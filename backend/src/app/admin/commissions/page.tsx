import { prisma } from "@/app/utils/db";
import Link from "next/link";
import { formatToISTDateString } from "@/app/utils/date";

export default async function CommissionsPage(props: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);
  const q = searchParams.q || "";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";
  const limit = 15;
  const skip = (page - 1) * limit;

  // Build commission where clause
  const commissionWhere: Record<string, unknown> = {
    description: {
      contains: "Referral Commission",
    },
  };

  if (q.trim()) {
    commissionWhere.user = {
      OR: [
        { name: { contains: q.trim(), mode: "insensitive" } },
        { mobileNumber: { contains: q.trim() } },
      ],
    };
  }

  const dateFilter: Record<string, Date> = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const ed = new Date(endDate);
    ed.setHours(23, 59, 59, 999);
    dateFilter.lte = ed;
  }
  if (Object.keys(dateFilter).length > 0) {
    commissionWhere.createdAt = dateFilter;
  }

  const totalCommissions = await prisma.transaction.count({
    where: commissionWhere as any,
  });

  const commissions = await prisma.transaction.findMany({
    where: commissionWhere as any,
    include: {
      user: {
        select: {
          name: true,
          mobileNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(totalCommissions / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const getPageUrl = (newPage: number) => {
    const params = new URLSearchParams({
      page: String(newPage),
      ...(q && { q }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    return `/admin/commissions?${params.toString()}`;
  };

  // 2. Fetch duplicate device groups for fraud detection
  const deviceGroups = await prisma.user.groupBy({
    by: ["deviceId"],
    _count: {
      id: true,
    },
    where: {
      deviceId: { not: null },
    },
  });

  const duplicateDeviceGroups = deviceGroups.filter((g) => g._count.id > 1);

  // 3. Retrieve users linked to those duplicate device groups
  const duplicateDeviceUsers = await prisma.user.findMany({
    where: {
      deviceId: {
        in: duplicateDeviceGroups.map((g: { deviceId: string | null; _count: { id: number } }) => g.deviceId!).filter(Boolean),
      },
    },
    select: {
      id: true,
      name: true,
      mobileNumber: true,
      deviceId: true,
      isBlocked: true,
      createdAt: true,
      referredById: true,
    },
    orderBy: [{ deviceId: "asc" }, { createdAt: "asc" }],
  });

  const hasActiveFilters = q || startDate || endDate;

  return (
    <div className="space-y-10">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Referrals & Fraud Auditing
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor referral commission histories and detect multi-accounting fraud using device identity parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Section 1: Device Fraud Auditing */}
        <div className="space-y-4">
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
              <span>⚠️ Duplicate Devices Detected</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The following users share the same mobile device hardware ID. Multiple signups from a single device are common indicators of self-referral abuse.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-455 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-4">Device Hardware ID</th>
                    <th className="px-4 py-4">Linked Accounts</th>
                    <th className="px-4 py-4">Signup Date</th>
                    <th className="px-4 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {duplicateDeviceUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-medium">
                        No duplicate device accounts found. System is clean!
                      </td>
                    </tr>
                  ) : (
                    duplicateDeviceUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-4 font-mono text-xs text-indigo-400 font-bold truncate max-w-[150px]">
                          {u.deviceId}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{u.name || "N/A"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{u.mobileNumber}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-semibold">
                          {formatToISTDateString(u.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold border ${u.isBlocked ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                            {u.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Commission History */}
        <div className="space-y-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-sm font-bold text-emerald-450 flex items-center gap-1.5">
              <span>💰 Commission Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Logs of referral commissions awarded to referrers when their referred friends&apos; deposits were approved.
            </p>
          </div>

          {/* Commission Filters */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 space-y-3">
            <form method="GET" action="/admin/commissions" className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name or mobile…"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={startDate}
                    className="text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To</label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={endDate}
                    className="text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-bold rounded-xl transition-all"
                >
                  Apply
                </button>
                {hasActiveFilters && (
                  <Link
                    href="/admin/commissions"
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
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-455 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-4">Referrer</th>
                    <th className="px-4 py-4">Details</th>
                    <th className="px-4 py-4">Commission</th>
                    <th className="px-4 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-medium">
                        {hasActiveFilters ? "No commissions match your filters." : "No referral commissions credited yet."}
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{c.user.name || "N/A"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.user.mobileNumber}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-medium leading-relaxed">
                          {c.description}
                        </td>
                        <td className="px-4 py-4 font-black text-emerald-450 text-sm">
                          +₹{c.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-slate-400 font-semibold">
                          {formatToISTDateString(c.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/40 px-4 py-3.5 backdrop-blur-md">
                <div className="text-xs text-slate-400">
                  Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({totalCommissions} total)
                </div>
                <div className="flex gap-2">
                  <a
                    href={getPageUrl(page - 1)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      hasPrev
                        ? "bg-slate-900/60 border-slate-850 hover:bg-slate-800/80 text-white cursor-pointer"
                        : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                    }`}
                  >
                    Previous
                  </a>
                  <a
                    href={getPageUrl(page + 1)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      hasNext
                        ? "bg-slate-900/60 border-slate-850 hover:bg-slate-800/80 text-white cursor-pointer"
                        : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                    }`}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
