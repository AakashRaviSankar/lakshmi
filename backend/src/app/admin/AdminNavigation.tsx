"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminNavigationProps {
  session: any;
  children: React.ReactNode;
}

export default function AdminNavigation({ session, children }: AdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/users", label: "Manage Users", icon: "👥" },
    { href: "/admin/recharges", label: "Recharge Requests", icon: "💳" },
    { href: "/admin/withdrawals", label: "Withdrawal Requests", icon: "💸" },
    { href: "/admin/lotteries", label: "Lotteries", icon: "🎲" },
    { href: "/admin/tickets", label: "Purchased Tickets", icon: "🎟️" },
    { href: "/admin/results", label: "Declare Results", icon: "🏆" },
    { href: "/admin/payouts", label: "Pay Winnings", icon: "💰" },
    { href: "/admin/announcements", label: "Announcements", icon: "📢" },
    { href: "/admin/commissions", label: "Commissions & Fraud", icon: "🔍" },
    { href: "/admin/holidays", label: "Holidays", icon: "📅" },
    { href: "/admin/reports", label: "Reports & Winnings", icon: "📈" },
    { href: "/admin/support", label: "Support Tickets", icon: "🎧" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar sliding drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-500/30">
              KL
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Dear Admin
            </span>
          </div>
          <button
            className="text-slate-400 hover:text-white p-1 text-lg font-bold"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-800/60 transition-all duration-200 text-sm font-medium"
            >
              <span className="text-base group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-850/60 bg-slate-900/40 backdrop-blur-md flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">System Admin</p>
            <p className="text-xs text-slate-300 truncate font-semibold">{session?.user?.name || "Administrator"}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs px-3 py-1.5 rounded-md font-bold border border-rose-500/20 hover:border-transparent transition-all duration-200"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Desktop Permanent Sidebar */}
      <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col z-10 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-500/30">
            KL
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dear Admin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-800/60 transition-all duration-200 text-sm font-medium"
            >
              <span className="text-base group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-850/60 bg-slate-900/40 backdrop-blur-md flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">System Admin</p>
            <p className="text-xs text-slate-300 truncate font-semibold">{session?.user?.name || "Administrator"}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs px-3 py-1.5 rounded-md font-bold border border-rose-500/20 hover:border-transparent transition-all duration-200"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 z-0">
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/60 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger button visible only on mobile */}
            <button
              className="md:hidden text-slate-350 hover:text-white p-2 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xs md:text-sm font-bold tracking-widest text-slate-400 uppercase truncate max-w-[200px] xs:max-w-none">
              KL Dear Lottery Management
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-slate-400 hidden xs:inline">Database Connected</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
