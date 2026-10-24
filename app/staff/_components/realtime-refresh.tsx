"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { createClient } from "@/lib/supabase/client"

// Re-renders the server component whenever an order is created or changes.
export function RealtimeRefresh() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | undefined

    const channel = supabase
      .channel("staff-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // A new order fires several events in a row; refresh once.
          clearTimeout(timer)
          timer = setTimeout(() => router.refresh(), 200)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
