"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Plus, History, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="w-full border-b bg-gradient-to-r from-[#8F48D8] to-[#7A3CBD] sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-36 h-10">
            <Image src="/logo.png" alt="ChimpVine Logo" fill className="object-contain" priority />
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>

          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>

          <Button className="bg-white text-[#8F48D8] border-none hover:bg-gray-100 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Evaluate New
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#7A3CBD] shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white w-full justify-start"
              asChild
            >
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white w-full justify-start"
              onClick={() => setMobileMenuOpen(false)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button
              className="bg-white text-[#8F48D8] border-none hover:bg-gray-100 shadow-sm w-full justify-start"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Evaluate New
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
