"use client"

import dynamic from "next/dynamic"

const CatsTetris = dynamic(() => import("@/components/game/CatsTetris"), { ssr: false })

export default function CatsTetrisPage() {
  return <CatsTetris />
}
