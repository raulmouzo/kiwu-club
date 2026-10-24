"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "@/lib/actions/auth"
import { loginSchema, type LoginInput } from "@/lib/schemas/auth"

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const { isSubmitting, errors } = form.formState

  async function onSubmit(values: LoginInput) {
    // On success the action redirects, so this only continues on failure.
    const result = await login(values)
    if (result?.error) form.setError("root", { message: result.error })
  }

  return (
    <Card className="w-full max-w-sm rounded-[2rem] shadow-[0_8px_32px_rgb(48_40_32/0.08)]">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">Sign in</CardTitle>
        <CardDescription>Use your Kiwu Club account.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* noValidate: zod owns the messages instead of the browser's bubbles. */}
        <form noValidate aria-busy={isSubmitting} onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-2xl bg-background px-4 text-base"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-2xl bg-background px-4 text-base"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" size="lg" className="h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
