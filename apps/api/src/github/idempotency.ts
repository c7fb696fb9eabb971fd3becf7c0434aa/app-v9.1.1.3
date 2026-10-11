import { createHash } from 'node:crypto';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { z } from 'zod';
import type { PublishResult } from './repository.js';

const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;
const PENDING_LEASE_MS = 5 * 60 * 1000;
const PublishResultSchema = z.object({
  commitSha: z.string().regex(/^[0-9a-f]{40}$/),
  commitUrl: z.url(),
});

export type IdempotencyReservation =
  | { kind: 'acquired' }
  | { kind: 'replay'; result: PublishResult }
  | { kind: 'in-progress' }
  | { kind: 'payload-mismatch' };

export interface PublishIdempotencyStore {
  reserve(scope: string, payloadHash: string, now: number): Promise<IdempotencyReservation>;
  complete(scope: string, payloadHash: string, result: PublishResult, now: number): Promise<void>;
  release(scope: string, payloadHash: string): Promise<void>;
}

function hashScope(scope: string): string {
  return createHash('sha256').update(scope).digest('hex');
}

export class FirestorePublishIdempotencyStore implements PublishIdempotencyStore {
  private readonly firestore: Firestore;

  constructor(
    projectId: string,
    private readonly collectionName = 'greendocs_publish_requests',
  ) {
    this.firestore = new Firestore({ projectId });
  }

  async reserve(scope: string, payloadHash: string, now: number): Promise<IdempotencyReservation> {
    const reference = this.firestore.collection(this.collectionName).doc(hashScope(scope));
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data();
      if (
        !snapshot.exists ||
        !data ||
        !(data.expiresAt instanceof Timestamp) ||
        data.expiresAt.toMillis() <= now
      ) {
        transaction.set(reference, {
          state: 'pending',
          payloadHash,
          pendingUntil: Timestamp.fromMillis(now + PENDING_LEASE_MS),
          expiresAt: Timestamp.fromMillis(now + IDEMPOTENCY_RETENTION_MS),
        });
        return { kind: 'acquired' };
      }

      if (data.payloadHash !== payloadHash) return { kind: 'payload-mismatch' };
      if (data.state === 'complete') {
        const result = PublishResultSchema.safeParse(data.result);
        if (!result.success) throw new Error('invalid_idempotency_result');
        return { kind: 'replay', result: result.data };
      }
      if (data.state !== 'pending' || !(data.pendingUntil instanceof Timestamp)) {
        throw new Error('invalid_idempotency_record');
      }
      if (data.pendingUntil.toMillis() > now) return { kind: 'in-progress' };

      transaction.update(reference, {
        pendingUntil: Timestamp.fromMillis(now + PENDING_LEASE_MS),
      });
      return { kind: 'acquired' };
    });
  }

  async complete(
    scope: string,
    payloadHash: string,
    result: PublishResult,
    now: number,
  ): Promise<void> {
    const reference = this.firestore.collection(this.collectionName).doc(hashScope(scope));
    await this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data();
      if (!data || data.state !== 'pending' || data.payloadHash !== payloadHash) {
        throw new Error('idempotency_reservation_lost');
      }
      transaction.update(reference, {
        state: 'complete',
        result,
        completedAt: Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + IDEMPOTENCY_RETENTION_MS),
      });
    });
  }

  async release(scope: string, payloadHash: string): Promise<void> {
    const reference = this.firestore.collection(this.collectionName).doc(hashScope(scope));
    await this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data();
      if (data?.state === 'pending' && data.payloadHash === payloadHash) {
        transaction.delete(reference);
      }
    });
  }
}
