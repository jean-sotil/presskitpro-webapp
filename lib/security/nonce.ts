/**
 * Per-request CSP nonce. 16 random bytes encoded as base64 — long
 * enough to make a brute force impractical, short enough to keep the
 * `style-src` / `script-src` directives compact.
 *
 * Generated in the middleware, threaded to RSCs via the `x-nonce`
 * request header, and consumed by inline `<style>` tags via
 * `headers().get('x-nonce')`.
 */
export function mintNonce(): string {
  // `crypto.getRandomValues` is available on Node 18+ and the Edge
  // runtime — the only places this function runs.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64 without depending on Node's `Buffer` (Edge-safe).
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}
