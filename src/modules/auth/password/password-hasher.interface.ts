export interface PasswordHasher {
    // TODO:
    // Define the contract for password hashing.
    //
    // Implementations should:
    // - Hash a plain-text password.
    // - Verify a plain-text password against a stored hash.

    hash(password: string): Promise<string>;

    verify(password: string, hash: string): Promise<boolean>;
}
