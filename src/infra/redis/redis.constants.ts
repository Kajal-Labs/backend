export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const ENV_LABELS = {
    production: 'prod',
    development: 'dev',
    preview: 'preview',
    test: 'test',
} as const;
