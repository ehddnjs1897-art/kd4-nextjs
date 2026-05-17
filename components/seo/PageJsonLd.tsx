/**
 * 페이지별 JSON-LD 라벨 wrapper
 * lib/seo-schemas.ts 에서 만든 schema 객체 배열을 받아 <script> 태그로 렌더.
 */
export default function PageJsonLd({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
