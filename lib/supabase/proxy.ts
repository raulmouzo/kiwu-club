import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Refreshes the Supabase session cookies and gates every route behind a login.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getClaims.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = !!data?.claims
  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === "/login"
  const isStatusRoute =
    pathname === "/status" || pathname.startsWith("/status/")

  // If entering /status with a number query (e.g. /status?number=14 or /status?order=14),
  // redirect directly to the order path /status/14
  if (pathname === "/status") {
    const queryNum =
      request.nextUrl.searchParams.get("number") ||
      request.nextUrl.searchParams.get("order") ||
      request.nextUrl.searchParams.get("orderNumber") ||
      request.nextUrl.searchParams.get("id") ||
      Array.from(request.nextUrl.searchParams.keys()).find((k) =>
        /^\d+$/.test(k)
      )

    if (queryNum && /^\d+$/.test(queryNum.trim())) {
      const url = request.nextUrl.clone()
      url.pathname = `/status/${queryNum.trim()}`
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  if (!isLoggedIn && !isLoginPage && !isStatusRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}
