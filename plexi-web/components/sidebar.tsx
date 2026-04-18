"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Home, 
  BookOpen, 
  Bot, 
  Puzzle, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const mainNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/ai", label: "Plexi AI", icon: Bot },
]

const secondaryNavLinks = [
  { href: "/integrations", label: "Integrations", icon: Puzzle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { collapsed, setCollapsed } = useSidebar()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const allLinks = [...mainNavLinks, ...secondaryNavLinks]

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-background transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight">Plexi</span>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <div className="flex flex-col gap-1">
            {!collapsed && (
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </span>
            )}
            {mainNavLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-1">
            {!collapsed && (
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More
              </span>
            )}
            {secondaryNavLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-3">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="mb-2 h-10 w-full rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {mounted && (
            <Button
              variant="ghost"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "w-full justify-start gap-3 rounded-xl",
                collapsed && "justify-center px-2"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" />
              )}
              {!collapsed && <span>Toggle Theme</span>}
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md md:hidden">
        <nav className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Plexi</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2 pb-safe">
          {/* Main Navigation Items */}
          {mainNavLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                </div>
                <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>
                  {link.label}
                </span>
              </Link>
            )
          })}

          {/* More Menu (Sheet) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                  secondaryNavLinks.some(l => l.href === pathname)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    secondaryNavLinks.some(l => l.href === pathname) && "bg-primary/10"
                  )}
                >
                  <Menu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader className="pb-4">
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 pb-8">
                {secondaryNavLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}
