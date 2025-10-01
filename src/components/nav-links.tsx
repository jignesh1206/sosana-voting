"use client"

import { UserGroupIcon, InformationCircleIcon, DocumentTextIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"

interface NavLinksProps {
  isMobile?: boolean
  onItemClick?: () => void
}

const links = [
  { name: "VOTE", icon: UserGroupIcon, href: "/vote" },
  { name: "VESTING", icon: LockClosedIcon, href: "/vesting" },
  { name: "TOP 10", icon: InformationCircleIcon, href: "/info" },
  { name: "DOCS", icon: DocumentTextIcon, href: "/docs" },
]

export default function NavLinks({ isMobile = false, onItemClick }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200",
              pathname === link.href
                ? "bg-primary text-primary-foreground glow-button"
                : "text-foreground hover:bg-accent/20 hover:text-accent",
              isMobile && "w-full",
            )}
            onClick={onItemClick}
          >
            <LinkIcon className={clsx("w-5 h-5", pathname === link.href ? "" : "group-hover:text-accent")} />
            <span>{link.name}</span>
          </Link>
        )
      })}
    </>
  )
}

