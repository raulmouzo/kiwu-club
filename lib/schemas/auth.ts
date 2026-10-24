import * as z from "zod"

// Shared by the form (instant feedback) and the server action (the real check).
// Login only asks for a value: password strength is a sign-up concern.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email.")
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
})

export type LoginInput = z.infer<typeof loginSchema>
