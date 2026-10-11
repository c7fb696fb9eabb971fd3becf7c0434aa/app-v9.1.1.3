import { Firestore, Timestamp } from '@google-cloud/firestore';
import { KeyManagementServiceClient } from '@google-cloud/kms';
import { z } from 'zod';
import type { VerifiedGithubUser } from '@greendocs/contracts';

export interface AuthSessionRecord {
  token: string;
  user: VerifiedGithubUser;
  expiresAt: number;
}

export interface AuthSessionStore {
  save(sessionHash: string, session: AuthSessionRecord): Promise<void>;
  get(sessionHash: string): Promise<AuthSessionRecord | null>;
  delete(sessionHash: string): Promise<void>;
}

const UserSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1),
  name: z.string().nullable(),
  avatarUrl: z.url(),
});

export class GoogleCloudAuthSessionStore implements AuthSessionStore {
  private readonly firestore: Firestore;
  private readonly kms: KeyManagementServiceClient;

  constructor(
    projectId: string,
    private readonly collectionName: string,
    private readonly kmsKeyName: string,
  ) {
    this.firestore = new Firestore({ projectId });
    this.kms = new KeyManagementServiceClient();
  }

  async save(sessionHash: string, session: AuthSessionRecord): Promise<void> {
    const [encrypted] = await this.kms.encrypt({
      name: this.kmsKeyName,
      plaintext: Buffer.from(session.token, 'utf8'),
    });
    if (!encrypted.ciphertext) {
      throw new Error('session_token_encryption_failed');
    }

    await this.firestore
      .collection(this.collectionName)
      .doc(sessionHash)
      .create({
        encryptedPat: Buffer.from(encrypted.ciphertext).toString('base64'),
        user: session.user,
        expiresAt: Timestamp.fromMillis(session.expiresAt),
        createdAt: Timestamp.now(),
      });
  }

  async get(sessionHash: string): Promise<AuthSessionRecord | null> {
    const reference = this.firestore.collection(this.collectionName).doc(sessionHash);
    const snapshot = await reference.get();
    if (!snapshot.exists) return null;

    const data = snapshot.data();
    if (!data) throw new Error('invalid_auth_session_record');
    const user = UserSchema.safeParse(data.user);
    if (!user.success || typeof data.encryptedPat !== 'string') {
      throw new Error('invalid_auth_session_record');
    }
    if (!(data.expiresAt instanceof Timestamp)) {
      throw new Error('invalid_auth_session_expiry');
    }

    const expiresAt = data.expiresAt.toMillis();
    if (Date.now() >= expiresAt) {
      await reference.delete();
      return null;
    }

    const [decrypted] = await this.kms.decrypt({
      name: this.kmsKeyName,
      ciphertext: Buffer.from(data.encryptedPat, 'base64'),
    });
    if (!decrypted.plaintext) {
      throw new Error('session_token_decryption_failed');
    }

    return {
      token: Buffer.from(decrypted.plaintext).toString('utf8'),
      user: user.data,
      expiresAt,
    };
  }

  async delete(sessionHash: string): Promise<void> {
    await this.firestore.collection(this.collectionName).doc(sessionHash).delete();
  }
}
