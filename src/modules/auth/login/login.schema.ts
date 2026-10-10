import { z } from 'zod';

// TODO:
// Define the request validation schema for login.
//
// Expected fields:
// - email
// - password
//
// Add only request validation rules here.
// Do NOT add authentication or business logic.

export const loginSchema = z.object({
    // TODO: Add email validation.
    // email: ...
    // TODO: Add password validation.
    // password: ...
});

export type LoginInput = z.infer<typeof loginSchema>;
