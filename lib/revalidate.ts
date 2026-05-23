/**
 * Thin wrapper around next/cache revalidateTag.
 *
 * Next.js 16 types require 2 arguments for revalidateTag — the second
 * ('default') is the cacheLife profile used with unstable_cache tags.
 *
 * NOTE (R76 scan): dropping the second arg would trigger immediate expiry
 * vs stale-while-revalidate, but the TS type enforces 2 args in this version.
 * Revisit if Next.js updates types to make the second arg optional.
 */
import { revalidateTag as _revalidateTag } from 'next/cache'

export function revalidateTag(tag: string): void {
  _revalidateTag(tag, 'default')
}
