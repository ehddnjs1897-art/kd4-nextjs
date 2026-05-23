/**
 * Thin wrapper around next/cache revalidateTag.
 *
 * Next.js 16 types declare revalidateTag(tag, profile?) — the second argument
 * was added for the "use cache" directive's cache-life profiles. The classic
 * unstable_cache tag form works at runtime with just the tag, and the
 * 'default' profile is the correct default for unstable_cache tags.
 */
import { revalidateTag as _revalidateTag } from 'next/cache'

export function revalidateTag(tag: string): void {
  // 'default' = Next.js 16의 기본 캐시 라이프 프로파일 (unstable_cache 태그에 사용)
  _revalidateTag(tag, 'default')
}
