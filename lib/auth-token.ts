export const SESSION_COOKIE = "apex-auth";

export async function generateSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "gl8fx-apex-secret-key";
  const password = process.env.AUTH_PASSWORD ?? "gl8fx2024";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
