// Shared validation primitives for the Cloud Functions layer.
// Kept dependency-free so every callable can import the same definition.

/**
 * Constrained 24-hour HH:MM pattern — permits only hours 00–23 and
 * minutes 00–59 (no `24:00`, `99:99`, etc.).
 */
export const TIME_PATTERN = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/
