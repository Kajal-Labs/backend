import { z } from 'zod';

// TODO:
// Define the request validation schema for user registration.
//
// Expected fields:
// - fullName
// - email
// - phone
// - password
//
// Add appropriate validation rules.
// Do NOT add business logic here.

export const registerSchema = z.object({
    // TODO: Add full name validation.
    // fullName: ...
    // TODO: Add email validation.
    // email: ...
    // TODO: Add phone validation.
    // phone: ...
    // TODO: Add password validation.
    // password: ...
});

export type RegisterInput = z.infer<typeof registerSchema>;
