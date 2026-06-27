import React from "react";
import Link from "next/link";
import { prisma } from "@/app/utils/db";
import { declareResult } from "@/app/admin/results/actions";
import { payUserWinningsForShow, payAllWinningsForShow } from "@/app/admin/payouts/actions";
import TicketsClient from "./TicketsClient";
import { formatToISTString, formatToISTDateString } from "@/app/utils/date";

export default async function AdminTicketsPage(props: {
  searchParams: Promise<{
    lotteryId?: string;
    q?: string;
    category?: string;
    status?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { lotteryId: selectedLotteryId, q = "", category = "", status = "" } = searchParams;

  // Build filter for lotteries list
  const listWhere: Record<string, unknown> = {};
  if (q.trim()) {
    listWhere.name = { contains: q.trim(), mode: "insensitive" };
  }
  if (category) {
    listWhere.category = category;
  }
  if (status) {
    listWhere.status = status;
  }

  // Fetch all lotteries (filtered for list view, all for sidebar)
  const [lotteries, allLotteries] = await Promise.all([
    prisma.lottery.findMany({
      where: selectedLotteryId ? {} : listWhere,
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { drawTime: "desc" },
    }),
    selectedLotteryId
      ? prisma.lottery.findMany({
          include: { _count: { select: { tickets: true } } },
          orderBy: { drawTime: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const displayedLotteries = selectedLotteryId ? allLotteries : lotteries;

  // Fetch tickets only if a lottery is selected
  let selectedLottery = null;
  let tickets: any[] = [];

  if (selectedLotteryId) {
    selectedLottery = await prisma.lottery.findUnique({
      where: { id: selectedLotteryId },
    });

    if (selectedLottery) {
      tickets = await prisma.ticket.findMany({
        where: { lotteryId: selectedLotteryId },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  // Helper status styling functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20";
      case "CLOSED":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-450 border border-blue-500/20";
    }
  };

  const listFilterUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams({
      ...(q && { q }),
      ...(category && { category }),
      ...(status && { status }),
      ...params,
    });
    return `/admin/tickets?${base.toString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Purchased Tickets & Winnings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse all tickets bought by users for any lottery show. Type a winning number to preview potential payout metrics.
          </p>
        </div>
        {selectedLotteryId && (
          <Link
            href="/admin/tickets"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl font-bold transition-all"
          >
            ← Back to Shows List
          </Link>
        )}
      </div>

      {!selectedLotteryId ? (
        // SHOW LISTING VIEW
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-350">Select Draw Show to Inspect</h2>
            <span className="text-xs text-slate-500 font-semibold">{lotteries.length} show{lotteries.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Filters */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 space-y-3">
            <form method="GET" action="/admin/tickets" className="space-y-3">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by lottery name…"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  name="category"
                  defaultValue={category}
                  className="flex-1 min-w-[130px] text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="DEAR">DEAR</option>
                  <option value="KERALA">KERALA</option>
                </select>
                <select
                  name="status"
                  defaultValue={status}
                  className="flex-1 min-w-[130px] text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-bold rounded-xl transition-all"
                >
                  Apply
                </button>
                {(q || category || status) && (
                  <Link
                    href="/admin/tickets"
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl transition-all"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-350">
                <thead className="bg-slate-900/90 text-xs text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Draw Show Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Draw Time</th>
                    <th className="px-6 py-4">Ticket Price</th>
                    <th className="px-6 py-4">Tickets Purchased</th>
                    <th className="px-6 py-4">Winning Number</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs font-semibold">
                  {lotteries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No lottery shows match your filters.
                      </td>
                    </tr>
                  ) : (
                    lotteries.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{l.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{l.category}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase ${getStatusBadge(l.status)}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatToISTString(l.drawTime)}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          ₹{l.ticketPrice}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-400">
                          {l._count.tickets} tickets
                        </td>
                        <td className="px-6 py-4">
                          {l.winningNumber ? (
                            <span className="font-mono bg-indigo-500/10 text-indigo-400 font-extrabold px-2.5 py-1 rounded border border-indigo-500/20 text-xs">
                              {l.winningNumber}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/tickets?lotteryId=${l.id}`}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-650/10 inline-block"
                          >
                            Inspect Tickets →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // SHOW DETAILED TICKETS LIST WITH SIDEBAR
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area: Interactive client table */}
          <div className="xl:col-span-3 space-y-6">
            {selectedLottery ? (
              <TicketsClient
                lottery={selectedLottery}
                initialTickets={tickets}
                declareResultAction={declareResult}
                payUserWinningsAction={payUserWinningsForShow}
                payAllWinningsAction={payAllWinningsForShow}
              />
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-450">
                Lottery show detail records could not be found.
              </div>
            )}
          </div>

          {/* Quick Sidebar: Other shows */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-450 uppercase tracking-wider">Quick Select Shows</h3>
            
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 max-h-[700px] overflow-y-auto scrollbar-thin space-y-3">
              {displayedLotteries.map((l) => {
                const isActive = l.id === selectedLotteryId;
                return (
                  <Link
                    key={l.id}
                    href={`/admin/tickets?lotteryId=${l.id}`}
                    className={`block p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-sm"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-800/20 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-xs truncate max-w-[130px]">{l.name}</p>
                      <span className={`inline-block px-1.5 py-0.2 text-[8px] rounded font-bold uppercase ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <p className="text-[9px] text-slate-500 font-medium">
                        {formatToISTDateString(l.drawTime)}
                      </p>
                      <p className="text-[9px] text-indigo-400/90 font-bold">
                        {l._count.tickets} tickets
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
