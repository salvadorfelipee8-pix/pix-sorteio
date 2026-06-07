'use client'
// app/admin/layout.tsx
// SorteioMax — Layout do painel admin: sidebar + guard client-side

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Ticket,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sorteios', label: 'Sorteios', icon: Ticket },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ClipboardList }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    })
    router.push('/admin/login')
  }

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#111111] border-r border-[#FFD700]/20
          z-30 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#FFD700]/20">
          <Shield className="text-[#FFD700]" size={24} />
          <div>
            <p className="text-[#FFD700] font-bold text-sm tracking-widest uppercase">SorteioMax</p>
            <p className="text-zinc-500 text-xs">Painel Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#FFD700]/20">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            {loggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-[#FFD700]/20 bg-[#111111]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="text-[#FFD700] font-bold text-sm tracking-widest uppercase">SorteioMax Admin</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
