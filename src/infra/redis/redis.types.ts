export type RedisJsonValue =
    string | number | boolean | null | RedisJsonValue[] | { [key: string]: RedisJsonValue };
