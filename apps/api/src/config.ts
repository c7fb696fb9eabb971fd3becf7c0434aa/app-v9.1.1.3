import { z } from 'zod';
import { DEFAULT_API_PORT, DEFAULT_WEB_PORT } from '@greendocs/contracts/runtime-config';

const RuntimeEnvironment = z.enum(['development', 'test', 'production']);
const apiEnvironmentSchema = z.object({
  NODE_ENV: RuntimeEnvironment.default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_API_PORT),
  WEB_PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_WEB_PORT),
  WEB_ORIGINS: z.string().optional(),
  GITHUB_OWNER: z.string().trim().min(1).optional(),
  GITHUB_REPOSITORY: z.string().trim().min(1).optional(),
  GITHUB_BRANCH: z.string().trim().min(1).optional(),
  GOOGLE_CLOUD_PROJECT: z.string().trim().min(1).optional(),
  SESSION_KMS_KEY_NAME: z.string().trim().min(1).optional(),
  SESSION_COLLECTION: z.string().trim().min(1).default('greendocs_sessions'),
  PUBLISH_IDEMPOTENCY_COLLECTION: z.string().trim().min(1).default('greendocs_publish_requests'),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  AUTH_EDGE_RATE_LIMITING_CONFIGURED: z.enum(['true', 'false']).default('false'),
});

export interface ApiConfig {
  environment: z.infer<typeof RuntimeEnvironment>;
  port: number;
  webPort: number;
  allowedOrigins: ReadonlySet<string>;
  googleCloudProject: string | undefined;
  sessionKmsKeyName: string | undefined;
  sessionCollection: string;
  publishIdempotencyCollection: string;
  sessionTtlSeconds: number;
  githubTarget: {
    owner: string;
    repository: string;
    branch: string;
  };
}

const localGithubTarget = {
  owner: 'c7fb696fb9eabb971fd3becf7c0434aa',
  repository: 'app-v9.1.1.3',
  branch: 'main',
} as const;

function parseWebOrigins(
  value: string | undefined,
  environment: ApiConfig['environment'],
  webPort: number,
): Set<string> {
  if (!value && environment === 'production') {
    throw new Error('WEB_ORIGINS must be configured in production');
  }
  if (!value) return new Set([`http://localhost:${webPort}`]);

  const origins = value.split(',').map((origin) => origin.trim());
  if (origins.some((origin) => origin.length === 0)) {
    throw new Error('WEB_ORIGINS must contain valid comma-separated origins');
  }

  const normalizedOrigins = origins.map((origin) => {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('WEB_ORIGINS must contain valid comma-separated origins');
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash ||
      (environment === 'production' && parsed.protocol !== 'https:')
    ) {
      throw new Error('WEB_ORIGINS must contain origins only; production origins must use HTTPS');
    }
    return parsed.origin;
  });
  return new Set(normalizedOrigins);
}

export function loadApiConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = apiEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error('Invalid API runtime configuration');
  }

  const {
    NODE_ENV,
    API_PORT,
    WEB_PORT,
    WEB_ORIGINS,
    GITHUB_OWNER,
    GITHUB_REPOSITORY,
    GITHUB_BRANCH,
    GOOGLE_CLOUD_PROJECT,
    SESSION_KMS_KEY_NAME,
    SESSION_COLLECTION,
    PUBLISH_IDEMPOTENCY_COLLECTION,
    AUTH_SESSION_TTL_SECONDS,
    AUTH_EDGE_RATE_LIMITING_CONFIGURED,
  } = parsed.data;
  const allowedOrigins = parseWebOrigins(WEB_ORIGINS, NODE_ENV, WEB_PORT);
  if (NODE_ENV === 'production' && (!GITHUB_OWNER || !GITHUB_REPOSITORY || !GITHUB_BRANCH)) {
    throw new Error(
      'GITHUB_OWNER, GITHUB_REPOSITORY, and GITHUB_BRANCH must be configured in production',
    );
  }
  if (NODE_ENV === 'production' && (!GOOGLE_CLOUD_PROJECT || !SESSION_KMS_KEY_NAME)) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT and SESSION_KMS_KEY_NAME must be configured in production',
    );
  }
  if (NODE_ENV === 'production' && AUTH_EDGE_RATE_LIMITING_CONFIGURED !== 'true') {
    throw new Error('AUTH_EDGE_RATE_LIMITING_CONFIGURED must be true in production');
  }
  if (
    NODE_ENV === 'production' &&
    SESSION_KMS_KEY_NAME &&
    !/^projects\/[^/]+\/locations\/[^/]+\/keyRings\/[^/]+\/cryptoKeys\/[^/]+$/.test(
      SESSION_KMS_KEY_NAME,
    )
  ) {
    throw new Error('SESSION_KMS_KEY_NAME must be a full Cloud KMS key resource name');
  }
  if (
    NODE_ENV === 'production' &&
    GOOGLE_CLOUD_PROJECT &&
    SESSION_KMS_KEY_NAME &&
    !SESSION_KMS_KEY_NAME.startsWith(`projects/${GOOGLE_CLOUD_PROJECT}/`)
  ) {
    throw new Error('SESSION_KMS_KEY_NAME must belong to GOOGLE_CLOUD_PROJECT');
  }

  return {
    environment: NODE_ENV,
    port: API_PORT,
    webPort: WEB_PORT,
    allowedOrigins,
    googleCloudProject: GOOGLE_CLOUD_PROJECT,
    sessionKmsKeyName: SESSION_KMS_KEY_NAME,
    sessionCollection: SESSION_COLLECTION,
    publishIdempotencyCollection: PUBLISH_IDEMPOTENCY_COLLECTION,
    sessionTtlSeconds: AUTH_SESSION_TTL_SECONDS,
    githubTarget: {
      owner: GITHUB_OWNER ?? localGithubTarget.owner,
      repository: GITHUB_REPOSITORY ?? localGithubTarget.repository,
      branch: GITHUB_BRANCH ?? localGithubTarget.branch,
    },
  };
}

export const apiConfig = loadApiConfig();
