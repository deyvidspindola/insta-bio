/**
 * Token CSRF do meta tag injetado pelo Blade.
 */
export function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}
