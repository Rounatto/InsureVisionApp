"use client";

/**
 * Forces a client sign-out using NextAuth CSRF + POST signout flow,
 * then performs a hard navigation to the target page.
 */
export async function forceClientSignOut(redirectTo = "/login") {
  try {
    const csrfRes = await fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    const csrfData = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfData?.csrfToken;

    if (!csrfToken) {
      window.location.assign(redirectTo);
      return;
    }

    const body = new URLSearchParams();
    body.set("csrfToken", csrfToken);
    body.set("callbackUrl", redirectTo);
    body.set("json", "true");

    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } finally {
    window.location.assign(redirectTo);
  }
}

