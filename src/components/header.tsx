"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import NavLinks from "@/components/nav-links"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="bg-secondary/80 backdrop-blur-md shadow-md border-b border-purple-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image className="rounded-full" src="/logo.png" width={40} height={40} alt="Logo" priority={true} />
            <span className="hidden md:inline text-xl font-bold text-foreground">SOSANA</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          <NavLinks />
        </nav>

        <div className="flex items-center space-x-4">
          {mounted && <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2 rounded-md hover:bg-secondary/90"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden cosmic-card border-t-0 rounded-t-none">
          <nav className="flex flex-col p-4 space-y-3">
            <NavLinks isMobile={true} onItemClick={() => setMobileMenuOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  )
}

