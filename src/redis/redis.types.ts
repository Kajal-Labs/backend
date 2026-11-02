export type RedisJsonPrimitive = string | number | boolean | null;

export type RedisJsonValue =
    RedisJsonPrimitive | RedisJsonValue[] | { [key: string]: RedisJsonValue };
