// heic2any 0.0.4 — 타입 선언 미제공. 사용하는 시그니처만 최소 선언.
declare module 'heic2any' {
  interface Heic2AnyOptions {
    blob: Blob
    toType?: string
    quality?: number
    multiple?: boolean
    gifInterval?: number
  }
  function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>
  export default heic2any
}
