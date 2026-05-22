/**
 * Thin wrapper around next/cache revalidateTag.
 *
 * Next.js 16 types declare revalidateTag(tag, profile) — the second argument
 * was added for the "use cache" directive's cache-life profiles. The classic
 * unstable_cache tag form works at runtime with just the tag, but TypeScript
 * errors without the second arg. This wrapper casts once so callers stay clean.
 */
import { revalidateTag as _revalidateTag } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const revalidateTag: (tag: string) => void = _revalidateTag as any
