import { createLottery, closeLottery } from "./actions";
import { prisma } from "@/app/utils/db";
import { ConfirmButton } from "../ConfirmButton";
import Link from "next/link";

export default async function LotteriesPage(props: {
  searchParams: Promise<{
    category?: string;
    status?: string;
    q?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { category = "", status = "", q = "" } = searchParams;

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
  }
  if (q.trim()) {
    where.name = { contains: q.trim(), mode: "insensitive" };
  }

  const lotteries = await prisma.lottery.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const getPageUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams({
      ...(category && { category }),
      ...(status && { status }),
      ...(q && { q }),
      ...params,
    });
    return `/admin/lotteries?${base.toString()}`;
  };

  return (
    <div className="space-y-10">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Manage Lotteries
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Create new lottery schedules, view active shows, and close bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create New Lottery Block */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 h-fit backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-lg font-bold text-white mb-6">Create New Draw</h2>
          
          <form action={createLottery} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Lottery Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="e.g. Dear Lottery 8 PM"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <select
                name="category"
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="DEAR">DEAR (1PM, 6PM, 8PM Draws)</option>
                <option value="KERALA">KERALA (3PM Draws)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Draw Time</label>
              <input
                type="datetime-local"
                name="drawTime"
                required
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all select-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Price (₹)</label>
              <input
                type="number"
                name="ticketPrice"
                step="0.01"
                required
                defaultValue="10.00"
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <ConfirmButton
              type="submit"
              message="Are you sure you want to create a new lottery draw show?"
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Create Lottery 🎟️
            </ConfirmButton>
          </form>
        </div>

        {/* Lotteries List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-350">Scheduled Draws</h2>
            <span className="text-xs text-slate-500 font-semibold">{lotteries.length} result{lotteries.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Filters */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 space-y-3">
            <form method="GET" action="/admin/lotteries" className="space-y-3">
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
                {/* Category */}
                <select
                  name="category"
                  defaultValue={category}
                  className="flex-1 min-w-[130px] text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="DEAR">DEAR</option>
                  <option value="KERALA">KERALA</option>
                </select>
                {/* Status */}
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
                    href="/admin/lotteries"
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl transition-all"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>
          </div>

          {lotteries.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
              No lottery schedules match your filters.
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <ul className="divide-y divide-slate-850/60">
                {lotteries.map((lottery) => (
                  <li key={lottery.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div>
                      <p className="font-bold text-white text-base">{lottery.name}</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        Category: <span className="text-indigo-400">{lottery.category}</span> | Ticket Cost: <span className="text-emerald-450 font-bold">₹{lottery.ticketPrice.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Draw scheduled for: {new Date(lottery.drawTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      {lottery.status === "OPEN" ? (
                        <form action={closeLottery.bind(null, lottery.id)}>
                          <ConfirmButton
                            type="submit"
                            message="Are you sure you want to close bookings for this lottery? This will stop further ticket sales."
                            className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Close Bookings
                          </ConfirmButton>
                        </form>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold border ${
                          lottery.status === "CLOSED"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                        }`}>
                          {lottery.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
