
import { prisma } from "@/app/utils/db";
import Link from "next/link";

export default async function AdminDashboard() {
  // Fetch some basic stats
  const totalUsers = await prisma.user.count();
  const activeLotteries = await prisma.lottery.count({
    where: { status: "OPEN" },
  });
  const pendingRecharges = await prisma.rechargeRequest.count({
    where: { status: "PENDING" },
  });
  const totalTicketsSold = await prisma.ticket.count();

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      desc: "Registered mobile accounts",
      icon: "👥",
      color: "from-blue-500/20 to-indigo-500/20",
      border: "group-hover:border-blue-500/50",
      glow: "bg-blue-500/10",
    },
    {
      label: "Active Lotteries",
      value: activeLotteries,
      desc: "Open for bookings",
      icon: "🎟️",
      color: "from-emerald-500/20 to-teal-500/20",
      border: "group-hover:border-emerald-500/50",
      glow: "bg-emerald-500/10",
    },
    {
      label: "Pending Recharges",
      value: pendingRecharges,
      desc: "Requires manual approval",
      icon: "💳",
      color: "from-amber-500/20 to-orange-500/20",
      border: "group-hover:border-amber-500/50",
      glow: "bg-amber-500/10",
      highlight: pendingRecharges > 0 ? "text-amber-400 animate-pulse" : "text-slate-400",
    },
    {
      label: "Tickets Sold",
      value: totalTicketsSold,
      desc: "Total tickets checked out",
      icon: "📈",
      color: "from-violet-500/20 to-fuchsia-500/20",
      border: "group-hover:border-violet-500/50",
      glow: "bg-violet-500/10",
    },
  ];

  const quickActions = [
    { href: "/admin/users", label: "Manage Users", desc: "Block users or adjust wallet balances", icon: "👥" },
    { href: "/admin/recharges", label: "Approve Deposits", desc: `Review ${pendingRecharges} pending recharge requests`, icon: "💳" },
    { href: "/admin/results", label: "Declare Results", desc: "Declare 4-digit draw winning numbers", icon: "🏆" },
    { href: "/admin/announcements", label: "Send Announcements", desc: "Broadcast push alerts to all players", icon: "📢" },
    { href: "/admin/holidays", label: "Configure Holidays", desc: "Manage game suspension schedules", icon: "📅" },
    { href: "/admin/reports", label: "Profit & Loss Reports", desc: "Check business performance charts", icon: "📈" },
  ];

  return (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time status of your lottery platform.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-slate-900/50 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:bg-slate-900"
          >
            {/* Glowing borders */}
            <div className={`absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r ${stat.color} opacity-30 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{stat.label}</p>
                <p className={`text-4xl font-extrabold tracking-tight mt-2 ${stat.highlight || "text-white"}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stat.glow} border border-white/5`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-300">Quick Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="flex gap-4 p-5 rounded-2xl bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-all duration-200 group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {action.label}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
