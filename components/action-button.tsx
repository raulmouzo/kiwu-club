"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

type ActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type" | "formAction"
> & {
  action: () => void | Promise<void>
}

function SubmitButton({
  disabled,
  ...props
}: Omit<ActionButtonProps, "action">) {
  const { pending } = useFormStatus()

  return <Button type="submit" disabled={disabled || pending} {...props} />
}

// Runs a server action on click and disables itself while it is pending.
function ActionButton({ action, ...props }: ActionButtonProps) {
  return (
    <form action={action}>
      <SubmitButton {...props} />
    </form>
  )
}

export { ActionButton }
