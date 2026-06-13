// Reproducible provenance timestamp.
//
// Generated artifacts must be byte-stable across runs (the roadmap's "keep every
// generated dataset reproducible"), so we never stamp the wallclock. Instead we
// honour SOURCE_DATE_EPOCH (the reproducible-builds standard, seconds since the
// Unix epoch): a release/CI run can set it to record a real time, while local
// runs leave it unset and the field is omitted entirely.
//
// Returns undefined when unset/invalid; JSON.stringify drops undefined-valued
// keys, so `{ generatedAt: generatedAt() }` simply has no generatedAt locally.
export function generatedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (!epoch) return undefined;
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toISOString();
}
