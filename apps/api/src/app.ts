import { createHash, randomUUID } from 'node:crypto';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { z } from 'zod';
import { API_PATHS } from '@greendocs/contracts/api-paths';
import { CACHE_POLICY } from '@greendocs/contracts/cache-policy';
import type {
  ApiError,
  AuthSessionResponse,
  HealthResponse,
  LoginResponse,
} from '@greendocs/contracts';
import { CONTENT_LIMITS, PageRecordSchema, CardRecordSchema } from '@greendocs/content-schema';
import { apiConfig, type ApiConfig } from './config.js';
import { AuthService, AuthenticationError, type ResolvedAuthSession } from './auth/service.js';
import {
  createGitHubRepositoryAdapter,
  GitHubRepositoryError,
  RepositoryConflictError,
  RepositoryValidationError,
  type RepositoryMutation,
  type RepositoryBinding,
  type RepositorySnapshot,
  type PublishResult,
} from './github/repository.js';
import {
  FirestorePublishIdempotencyStore,
  type PublishIdempotencyStore,
} from './github/idempotency.js';
import { GoogleCloudAuthSessionStore, type AuthSessionStore } from './auth/session-store.js';

const LoginRequestSchema = z.object({
  pat: z.string().trim().min(10).max(512),
});
const Base64Schema = z
  .string()
  .max(Math.ceil(CONTENT_LIMITS.assetBytes / 3) * 4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
const MutationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('upsert-page'), record: PageRecordSchema }),
  z.object({ type: z.literal('delete-page'), id: z.string().uuid() }),
  z.object({ type: z.literal('upsert-card'), record: CardRecordSchema }),
  z.object({ type: z.literal('delete-card'), id: z.string().uuid() }),
  z.object({
    type: z.literal('upsert-asset'),
    id: z.string().uuid(),
    mimeType: z.string().min(1).max(100),
    bytes: Base64Schema,
  }),
  z.object({
    type: z.literal('delete-asset'),
    id: z.string().uuid(),
    mimeType: z.string().min(1).max(100),
  }),
]);
const PublishRequestSchema = z.object({
  expectedHead: z.string().regex(/^[0-9a-f]{40}$/),
  message: z.string().trim().min(1).max(200),
  mutations: z.array(MutationSchema).min(1).max(CONTENT_LIMITS.mutationsPerPublish),
});
const IdempotencyKeySchema = z.string().uuid();

interface AppVariables {
  requestId: string;
  authSession: ResolvedAuthSession;
}

export interface AppDependencies {
  config?: ApiConfig;
  authService?: AuthService;
  repositoryAdapterFactory?: (
    token: string,
    binding: RepositoryBinding,
  ) => {
    readSnapshot(): Promise<RepositorySnapshot>;
    publishBatch(
      expectedHead: string,
      mutations: readonly RepositoryMutation[],
      message: string,
    ): Promise<PublishResult>;
  };
  publishIdempotencyStore?: PublishIdempotencyStore;
}

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('missing_request_body');
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RangeError('request_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function configuredAuthService(config: ApiConfig): AuthService | undefined {
  if (!config.googleCloudProject || !config.sessionKmsKeyName) return undefined;
  const store: AuthSessionStore = new GoogleCloudAuthSessionStore(
    config.googleCloudProject,
    config.sessionCollection,
    config.sessionKmsKeyName,
  );
  return new AuthService(config.githubTarget, store, config.sessionTtlSeconds);
}

function bearerSessionId(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
  return match?.[1] ?? null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function createApp(dependencies: AppDependencies = {}) {
  const config = dependencies.config ?? apiConfig;
  const authService = dependencies.authService ?? configuredAuthService(config);
  const repositoryAdapterFactory =
    dependencies.repositoryAdapterFactory ?? createGitHubRepositoryAdapter;
  const publishIdempotencyStore =
    dependencies.publishIdempotencyStore ??
    (config.googleCloudProject
      ? new FirestorePublishIdempotencyStore(
          config.googleCloudProject,
          config.publishIdempotencyCollection,
        )
      : undefined);
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', async (context, next) => {
    context.set('requestId', randomUUID());
    await next();
    context.header('X-Request-ID', context.get('requestId'));
  });

  app.use(
    `${API_PATHS.apiPrefix}/*`,
    cors({
      origin: (origin) => (config.allowedOrigins.has(origin) ? origin : ''),
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      maxAge: 600,
    }),
  );
  app.use(`${API_PATHS.apiPrefix}/*`, async (context, next) => {
    context.header('Cache-Control', CACHE_POLICY.authenticatedApi);
    context.header('Pragma', 'no-cache');
    await next();
  });

  app.get(API_PATHS.healthz, (context) =>
    context.json<HealthResponse>({ status: 'ok', service: 'greendocs-api' }),
  );
  app.get(API_PATHS.health, (context) =>
    context.json<HealthResponse>({ status: 'ok', service: 'greendocs-api' }),
  );

  app.post(API_PATHS.authLogin, async (context) => {
    if (!authService) {
      return context.json<ApiError>(
        { error: 'auth_provider_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const contentLength = Number(context.req.header('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 4096) {
      return context.json<ApiError>(
        { error: 'request_too_large', requestId: context.get('requestId') },
        413,
      );
    }

    let body: unknown;
    try {
      body = await readJson(context.req.raw, 4096);
    } catch (error) {
      if (error instanceof RangeError) {
        return context.json<ApiError>(
          { error: 'request_too_large', requestId: context.get('requestId') },
          413,
        );
      }
      if (!(error instanceof SyntaxError)) throw error;
      return context.json<ApiError>(
        { error: 'invalid_login_request', requestId: context.get('requestId') },
        400,
      );
    }
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json<ApiError>(
        { error: 'invalid_login_request', requestId: context.get('requestId') },
        400,
      );
    }

    try {
      const result: LoginResponse = await authService.login(parsed.data.pat);
      return context.json<LoginResponse>(result, 200);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return context.json<ApiError>(
          { error: error.code, requestId: context.get('requestId') },
          error.status,
        );
      }
      throw error;
    }
  });

  app.get(API_PATHS.authMe, async (context) => {
    if (!authService) {
      return context.json<ApiError>(
        { error: 'auth_provider_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const session = await authService.resolve(bearerSessionId(context.req.header('authorization')));
    if (!session) {
      return context.json<ApiError>(
        { error: 'authentication_required', requestId: context.get('requestId') },
        401,
      );
    }
    const result: AuthSessionResponse = {
      user: session.user,
      expiresAt: new Date(session.expiresAt).toISOString(),
    };
    return context.json<AuthSessionResponse>(result);
  });

  app.post(API_PATHS.authLogout, async (context) => {
    if (!authService) {
      return context.json<ApiError>(
        { error: 'auth_provider_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const sessionId = bearerSessionId(context.req.header('authorization'));
    const session = await authService.resolve(sessionId);
    if (!session || !sessionId) {
      return context.json<ApiError>(
        { error: 'authentication_required', requestId: context.get('requestId') },
        401,
      );
    }
    await authService.logout(sessionId);
    return context.body(null, 204);
  });

  app.get(API_PATHS.repositorySnapshot, async (context) => {
    if (!authService) {
      return context.json<ApiError>(
        { error: 'auth_provider_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const session = await authService.resolve(bearerSessionId(context.req.header('authorization')));
    if (!session) {
      return context.json<ApiError>(
        { error: 'authentication_required', requestId: context.get('requestId') },
        401,
      );
    }
    const adapter = repositoryAdapterFactory(session.token, config.githubTarget);
    const snapshot = await adapter.readSnapshot();
    return context.json({
      sourceCommit: snapshot.commitSha,
      pages: snapshot.pages,
      cards: snapshot.cards,
      assetPaths: [...snapshot.assetPaths],
      repository: {
        owner: config.githubTarget.owner,
        name: config.githubTarget.repository,
        branch: config.githubTarget.branch,
      },
    });
  });

  app.post(API_PATHS.repositoryPublish, async (context) => {
    if (!authService) {
      return context.json<ApiError>(
        { error: 'auth_provider_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const sessionId = bearerSessionId(context.req.header('authorization'));
    const session = await authService.resolve(sessionId);
    if (!session || !sessionId) {
      return context.json<ApiError>(
        { error: 'authentication_required', requestId: context.get('requestId') },
        401,
      );
    }
    const contentLength = Number(context.req.header('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > CONTENT_LIMITS.publishRequestBytes) {
      return context.json<ApiError>(
        { error: 'request_too_large', requestId: context.get('requestId') },
        413,
      );
    }

    let body: unknown;
    try {
      body = await readJson(context.req.raw, CONTENT_LIMITS.publishRequestBytes);
    } catch (error) {
      if (error instanceof RangeError) {
        return context.json<ApiError>(
          { error: 'request_too_large', requestId: context.get('requestId') },
          413,
        );
      }
      if (!(error instanceof SyntaxError)) throw error;
      return context.json<ApiError>(
        { error: 'invalid_publish_request', requestId: context.get('requestId') },
        400,
      );
    }
    const parsed = PublishRequestSchema.safeParse(body);
    if (!parsed.success) {
      return context.json<ApiError>(
        { error: 'invalid_publish_request', requestId: context.get('requestId') },
        400,
      );
    }
    if (!publishIdempotencyStore) {
      return context.json<ApiError>(
        { error: 'publish_idempotency_not_configured', requestId: context.get('requestId') },
        503,
      );
    }
    const key = IdempotencyKeySchema.safeParse(context.req.header('idempotency-key'));
    if (!key.success) {
      return context.json<ApiError>(
        { error: 'invalid_idempotency_key', requestId: context.get('requestId') },
        400,
      );
    }
    const payloadHash = createHash('sha256').update(stableJson(parsed.data)).digest('hex');
    const scope = [
      session.user.id,
      config.githubTarget.owner,
      config.githubTarget.repository,
      config.githubTarget.branch,
      key.data,
    ].join(':');
    const reservation = await publishIdempotencyStore.reserve(scope, payloadHash, Date.now());
    if (reservation.kind === 'payload-mismatch') {
      return context.json<ApiError>(
        { error: 'idempotency_key_reused', requestId: context.get('requestId') },
        409,
      );
    }
    if (reservation.kind === 'in-progress') {
      return context.json<ApiError>(
        { error: 'publish_already_in_progress', requestId: context.get('requestId') },
        409,
      );
    }
    if (reservation.kind === 'replay') {
      context.header('Idempotent-Replay', 'true');
      return context.json(reservation.result);
    }

    const mutations: RepositoryMutation[] = parsed.data.mutations.map((mutation) =>
      mutation.type === 'upsert-asset'
        ? { ...mutation, bytes: Buffer.from(mutation.bytes, 'base64') }
        : mutation,
    );
    const adapter = repositoryAdapterFactory(session.token, config.githubTarget);
    try {
      const result = await adapter.publishBatch(
        parsed.data.expectedHead,
        mutations,
        parsed.data.message,
      );
      await publishIdempotencyStore.complete(scope, payloadHash, result, Date.now());
      return context.json(result, 200);
    } catch (error) {
      if (error instanceof RepositoryConflictError) {
        return context.json<ApiError>(
          { error: 'repository_head_changed', requestId: context.get('requestId') },
          409,
        );
      }
      if (error instanceof RepositoryValidationError) {
        return context.json<ApiError>(
          { error: 'invalid_repository_mutation', requestId: context.get('requestId') },
          400,
        );
      }
      if (error instanceof GitHubRepositoryError) {
        const status =
          error.status === 401
            ? 401
            : error.status === 403
              ? 403
              : error.status === 404
                ? 404
                : error.status === 429
                  ? 503
                  : 502;
        return context.json<ApiError>(
          { error: error.code, requestId: context.get('requestId') },
          status,
        );
      }
      throw error;
    }
  });

  app.notFound((context) =>
    context.json<ApiError>({ error: 'not_found', requestId: context.get('requestId') }, 404),
  );
  app.onError((error, context) => {
    console.error('Unhandled API error', {
      kind: error.name,
      path: context.req.path,
      requestId: context.get('requestId'),
    });
    return context.json<ApiError>(
      { error: 'internal_error', requestId: context.get('requestId') },
      500,
    );
  });
  return app;
}

export const app = createApp();
