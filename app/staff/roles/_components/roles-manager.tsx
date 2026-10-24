"use client"

import { Check, ShieldAlert, Tablet, UserCheck, Users, X } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  removeUserRole,
  setUserRole,
  type UserRoleItem,
} from "@/lib/actions/roles"
import type { AppRole } from "@/lib/supabase/roles"
import { cn } from "@/lib/utils"

export function RolesManager({
  initialRoles,
}: {
  initialRoles: UserRoleItem[]
}) {
  const [roles, setRoles] = useState<UserRoleItem[]>(initialRoles)
  const [targetUserId, setTargetUserId] = useState("")
  const [targetRole, setTargetRole] = useState<AppRole>("kiosk")
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleChangeRole(userId: string, role: AppRole) {
    setRoles((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, role } : r))
    )

    startTransition(async () => {
      const res = await setUserRole(userId, role)
      if (res.ok) {
        setStatusMsg("Role updated successfully.")
      } else {
        setStatusMsg(res.error || "Failed to update role.")
      }
    })
  }

  function handleRemoveRole(userId: string) {
    setRoles((prev) => prev.filter((r) => r.user_id !== userId))

    startTransition(async () => {
      const res = await removeUserRole(userId)
      if (res.ok) {
        setStatusMsg("Role removed.")
      }
    })
  }

  function handleAssignNewRole(e: React.FormEvent) {
    e.preventDefault()
    const cleanId = targetUserId.trim()
    if (!cleanId) return

    startTransition(async () => {
      const res = await setUserRole(cleanId, targetRole)
      if (res.ok) {
        setRoles((prev) => {
          const exists = prev.some((r) => r.user_id === cleanId)
          if (exists) {
            return prev.map((r) =>
              r.user_id === cleanId ? { ...r, role: targetRole } : r
            )
          }
          return [...prev, { user_id: cleanId, role: targetRole }]
        })
        setTargetUserId("")
        setStatusMsg("User role assigned successfully.")
      } else {
        setStatusMsg(res.error || "Failed to assign role.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Device & Staff Role Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Authorize tablet kiosks and staff baristas without accessing the SQL editor.
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-2xl bg-primary/10 p-3.5 text-xs font-semibold text-primary">
          {statusMsg}
        </div>
      )}

      {/* Add / Assign Role Form */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-base font-bold text-foreground">Assign or Update Role</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Enter an Auth User ID (UUID) to grant staff or kiosk permissions.
        </p>

        <form onSubmit={handleAssignNewRole} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5 min-w-[260px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User UUID
            </label>
            <Input
              required
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="h-11 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-44">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as AppRole)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
            >
              <option value="kiosk">Kiosk (Tablet)</option>
              <option value="staff">Staff (Barista / KDS)</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={pending || !targetUserId.trim()}
            className="h-11 rounded-xl px-6 font-semibold shadow-lifted"
          >
            Assign Role
          </Button>
        </form>
      </div>

      {/* Current Active Roles Table */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="border-b border-border bg-muted/40 p-4 font-semibold text-sm">
          Active Devices & Accounts ({roles.length})
        </div>

        {roles.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No custom roles registered yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Role Assigned</th>
                <th className="p-4">Change Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {roles.map((item) => (
                <tr key={item.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs font-medium text-foreground">
                    {item.user_id}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase",
                        item.role === "staff"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : item.role === "kiosk"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.role === "staff" ? (
                        <UserCheck className="size-3.5" />
                      ) : (
                        <Tablet className="size-3.5" />
                      )}
                      <span>{item.role}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {(["kiosk", "staff"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleChangeRole(item.user_id, r)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all capitalize",
                            item.role === r
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "border border-border hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(item.user_id)}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove role"
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
