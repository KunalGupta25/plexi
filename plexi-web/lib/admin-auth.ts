/**
 * admin-auth.ts — server-side helper for authenticating admin API routes.
 *
 * Mutating routes (POST /api/blogs, PATCH/DELETE /api/blogs/[id],
 * POST /api/release-notes) call this to verify the X-Admin-Token header
 * matches the ADMIN_PASSWORD env var.
 *
 * The client stores the password in sessionStorage after a successful login
 * and threads it through admin-store.ts fetch calls.
 */
export function validateAdminToken(request: Request): boolean {
  const token = request.headers.get("X-Admin-Token");
  const master = process.env.ADMIN_PASSWORD;

  if (!master) {
    // Misconfigured server — fail closed
    console.error("ADMIN_PASSWORD env var is not set");
    return false;
  }

  return typeof token === "string" && token === master;
}
