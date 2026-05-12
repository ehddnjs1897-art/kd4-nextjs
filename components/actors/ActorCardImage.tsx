'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  src: string
  alt: string
  unoptimized?: boolean
}

export default function ActorCardImage({ src, alt, unoptimized }: Props) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="(max-width:640px) 100vw, 50vw"
      style={{ objectFit: 'cover', objectPosition: 'center top' }}
      unoptimized={unoptimized}
      onError={() => setImgSrc('/placeholder-actor.svg')}
    />
  )
}
