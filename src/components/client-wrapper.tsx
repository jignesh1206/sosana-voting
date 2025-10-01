"use client"

import type { ReactNode } from "react"
import PolicyModal from "./policy-modal"

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <PolicyModal />
      {children}
    </>
  )
}

