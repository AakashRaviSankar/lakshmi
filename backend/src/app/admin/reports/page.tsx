import { prisma } from "@/app/utils/db";
import Link from "next/link";
import { getISTDateStr, formatToISTDateString, formatToISTTimeString } from "@/app/utils/date";

export default async function ReportsPage(props: {
  searchParams: Promise<{
    tab?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "overview";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";
  const q = searchParams.q || "";

  // Build date range filter
  const dateFilter: Record<string, Date> = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const ed = new Date(endDate);
    ed.setHours(23, 59, 59, 999);
    dateFilter.lte = ed;
  }
  const hasDateFilter = Object.keys(dateFilter).length > 0;
  const createdAtFilter = hasDateFilter ? { createdAt: dateFilter } : {};

  // Fetch all required data for aggregations
  const [tickets, recharges, withdrawals, commissions, users] = await Promise.all([
    // 1. Fetch tickets with lottery details
    prisma.ticket.findMany({
      where: { ...createdAtFilter },
      include: {
        lottery: {
          select: {
            name: true,
            category: true,
            drawTime: true,
            winningNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // 2. Fetch approved recharges
    prisma.rechargeRequest.findMany({
      where: { status: "APPROVED", ...createdAtFilter },
      select: {
        amount: true,
        createdAt: true,
        userId: true,
      },
    }),
    // 3. Fetch approved withdrawals
    prisma.withdrawRequest.findMany({
      where: { status: "APPROVED", ...createdAtFilter },
      select: {
        amount: true,
        createdAt: true,
        userId: true,
      },
    }),
    // 4. Fetch commission transactions
    prisma.transaction.findMany({
      where: {
        description: {
          contains: "Referral Commission",
        },
        ...createdAtFilter,
      },
      select: {
        amount: true,
        createdAt: true,
        userId: true,
      },
    }),
    // 5. Fetch users with wallet balance
    prisma.user.findMany({
      where: q.trim()
        ? {
            OR: [
              { name: { contains: q.trim(), mode: "insensitive" } },
              { mobileNumber: { contains: q.trim() } },
            ],
          }
        : {},
      include: {
        wallet: {
          select: {
            balance: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Aggregate stats cards
  const totalSales = tickets.reduce((sum, t) => sum + t.amount, 0);
  const totalWinnings = tickets
    .filter((t) => t.status === "WON")
    .reduce((sum, ticket) => sum + ticket.winnings, 0);
  const profitLoss = totalSales - totalWinnings;
  const totalRechargesSum = recharges.reduce((sum, r) => sum + r.amount, 0);
  const totalWithdrawalsSum = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Process Day-Wise Reports
  const dayWiseMap: {
    [dateStr: string]: {
      date: string;
      booked: number;
      winnings: number;
      recharges: number;
      withdrawals: number;
      commissions: number;
    };
  } = {};

  const getOrInitDay = (dateStr: string) => {
    if (!dayWiseMap[dateStr]) {
      dayWiseMap[dateStr] = {
        date: dateStr,
        booked: 0,
        winnings: 0,
        recharges: 0,
        withdrawals: 0,
        commissions: 0,
      };
    }
    return dayWiseMap[dateStr];
  };

  for (const ticket of tickets) {
    const dateStr = getISTDateStr(ticket.createdAt);
    const day = getOrInitDay(dateStr);
    day.booked += ticket.amount;
    if (ticket.status === "WON") {
      day.winnings += ticket.winnings;
    }
  }

  for (const recharge of recharges) {
    const dateStr = getISTDateStr(recharge.createdAt);
    const day = getOrInitDay(dateStr);
    day.recharges += recharge.amount;
  }

  for (const withdrawal of withdrawals) {
    const dateStr = getISTDateStr(withdrawal.createdAt);
    const day = getOrInitDay(dateStr);
    day.withdrawals += withdrawal.amount;
  }

  for (const commission of commissions) {
    const dateStr = getISTDateStr(commission.createdAt);
    const day = getOrInitDay(dateStr);
    day.commissions += commission.amount;
  }

  const dayWiseReports = Object.values(dayWiseMap).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Process Show-Wise Reports
  const showWiseMap: {
    [lotteryId: string]: {
      id: string;
      name: string;
      category: string;
      drawTime: Date;
      winningNumber: string;
      ticketsCount: number;
      totalSold: number;
      totalPayout: number;
    };
  } = {};

  // Fetch all lotteries with optional search
  const allLotteries = await prisma.lottery.findMany({
    where: q.trim()
      ? { name: { contains: q.trim(), mode: "insensitive" } }
      : {},
    orderBy: { drawTime: "desc" },
  });

  for (const show of allLotteries) {
    showWiseMap[show.id] = {
      id: show.id,
      name: show.name,
      category: show.category,
      drawTime: show.drawTime,
      winningNumber: show.winningNumber || "Not Declared",
      ticketsCount: 0,
      totalSold: 0,
      totalPayout: 0,
    };
  }

  for (const ticket of tickets) {
    const show = showWiseMap[ticket.lotteryId];
    if (show) {
      show.ticketsCount += 1;
      show.totalSold += ticket.amount;
      if (ticket.status === "WON") {
        show.totalPayout += ticket.winnings;
      }
    }
  }

  const showWiseReports = Object.values(showWiseMap).sort(
    (a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime()
  );

  // Process User-Wise Reports
  const userWiseMap: {
    [userId: string]: {
      id: string;
      name: string;
      mobileNumber: string;
      balance: number;
      totalRecharge: number;
      totalBooked: number;
      totalCommission: number;
      totalWithdraw: number;
    };
  } = {};

  for (const user of users) {
    userWiseMap[user.id] = {
      id: user.id,
      name: user.name || "N/A",
      mobileNumber: user.mobileNumber || "N/A",
      balance: user.wallet?.balance || 0,
      totalRecharge: 0,
      totalBooked: 0,
      totalCommission: 0,
      totalWithdraw: 0,
    };
  }

  for (const recharge of recharges) {
    const userReport = userWiseMap[recharge.userId];
    if (userReport) {
      userReport.totalRecharge += recharge.amount;
    }
  }

  for (const ticket of tickets) {
    const userReport = userWiseMap[ticket.userId];
    if (userReport) {
      userReport.totalBooked += ticket.amount;
    }
  }

  for (const commission of commissions) {
    const userReport = userWiseMap[commission.userId];
    if (userReport) {
      userReport.totalCommission += commission.amount;
    }
  }

  for (const withdrawal of withdrawals) {
    const userReport = userWiseMap[withdrawal.userId];
    if (userReport) {
      userReport.totalWithdraw += withdrawal.amount;
    }
  }

  const userWiseReports = Object.values(userWiseMap).sort(
    (a, b) => b.totalBooked - a.totalBooked
  );

  // Get recent wins for overview
  const recentWins = tickets
    .filter((t) => t.status === "WON")
    .map((win) => {
      const userObj = users.find((u) => u.id === win.userId);
      return {
        id: win.id,
        name: win.lottery.name,
        winningNumber: win.lottery.winningNumber,
        gameType: win.gameType,
        number: win.number,
        amount: win.amount,
        winnings: win.winnings,
        createdAt: win.createdAt,
        user: {
          name: userObj?.name || "N/A",
          mobileNumber: userObj?.mobileNumber || "N/A",
        },
      };
    })
    .slice(0, 10);

  const hasActiveFilters = startDate || endDate || q;

  const getTabUrl = (tab: string) => {
    const params = new URLSearchParams({
      tab,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(q && { q }),
    });
    return `/admin/reports?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Financial & Sales Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review business metrics, day-wise ledger activity, draw show performance, and detailed user activity.
        </p>
      </div>

      {/* Global Filters */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
        <form method="GET" action="/admin/reports" className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="tab" value={activeTab} />
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Search (User / Show Name)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Name, mobile, show…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          {/* Date Range */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">From</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">To</label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-bold rounded-xl transition-all"
            >
              Apply
            </button>
            {hasActiveFilters && (
              <Link
                href={`/admin/reports?tab=${activeTab}`}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl transition-all"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
        {hasActiveFilters && (
          <p className="text-xs text-indigo-400/80 mt-2 font-medium">
            📊 Stats below reflect filtered data
            {startDate && ` from ${startDate}`}
            {endDate && ` to ${endDate}`}
            {q && ` matching "${q}"`}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sales</h3>
          <p className="text-2xl font-black text-indigo-400 mt-2">₹{totalSales.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Ticket bets</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Winnings Paid</h3>
          <p className="text-2xl font-black text-amber-400 mt-2">₹{totalWinnings.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Prizes calculated</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recharges</h3>
          <p className="text-2xl font-black text-emerald-400 mt-2">₹{totalRechargesSum.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Approved deposits</p>
        </div>

        <div className={`p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden ${profitLoss >= 0 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">Net Profit / Loss</h3>
          <p className="text-2xl font-black mt-2">
            ₹{profitLoss.toFixed(2)}
          </p>
          <p className="text-xs mt-1 font-medium opacity-85">Revenue minus payouts</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800/80 gap-2 pb-px">
        {[
          { key: "overview", label: "Overview & KPIs", icon: "📊" },
          { key: "daywise", label: "Day-Wise Reports", icon: "📅" },
          { key: "showwise", label: "Show-Wise Reports", icon: "🎟️" },
          { key: "userwise", label: "User Performance Ledger", icon: "👤" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={getTabUrl(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-300 ${
              activeTab === tab.key
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-10">
          {/* Draw Reports Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-300">Recent Draw Performance</h2>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Draw Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Result</th>
                      <th className="px-6 py-4">Tickets</th>
                      <th className="px-6 py-4">Total Sales</th>
                      <th className="px-6 py-4">Total Payout</th>
                      <th className="px-6 py-4 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {showWiseReports.slice(0, 10).map((report) => (
                      <tr key={report.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{report.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatToISTDateString(report.drawTime)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold border ${report.ticketsCount > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                            {report.ticketsCount > 0 ? "Active Play" : "No Bookings"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-xs text-indigo-400">
                          {report.winningNumber}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-100">{report.ticketsCount}</td>
                        <td className="px-6 py-4 text-indigo-400 font-bold">₹{report.totalSold.toFixed(2)}</td>
                        <td className="px-6 py-4 text-amber-400 font-bold">₹{report.totalPayout.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-extrabold ${report.totalSold - report.totalPayout >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          ₹{(report.totalSold - report.totalPayout).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Wins Breakdown */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-300">Recent Winnings Payout</h2>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Winner</th>
                      <th className="px-6 py-4">Lottery Show</th>
                      <th className="px-6 py-4">Game Type</th>
                      <th className="px-6 py-4">Matched Digit</th>
                      <th className="px-6 py-4">Play Cost</th>
                      <th className="px-6 py-4 text-right">Prize Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {recentWins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No wins declared yet.
                        </td>
                      </tr>
                    ) : (
                      recentWins.map((win) => {
                        return (
                          <tr key={win.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-white">{win.user.name || "N/A"}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{win.user.mobileNumber}</p>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-100">{win.name}</td>
                            <td className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                              {win.gameType.replace("_", " ")}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/20">
                                {win.number}
                              </span>
                              <span className="text-xs text-slate-500 ml-1.5">
                                (Draw: {win.winningNumber})
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">₹{win.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-black text-emerald-400 text-base">
                              ₹{win.winnings.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "daywise" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300">Day-Wise Ledger Report</h2>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Booked (Ticket Sales)</th>
                    <th className="px-6 py-4">Winnings Paid</th>
                    <th className="px-6 py-4">Approved Recharges</th>
                    <th className="px-6 py-4">Approved Withdrawals</th>
                    <th className="px-6 py-4">Referral Commissions</th>
                    <th className="px-6 py-4 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {dayWiseReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No transactions recorded{hasActiveFilters ? " for the selected filters." : "."} 
                      </td>
                    </tr>
                  ) : (
                    dayWiseReports.map((row) => {
                      const netProfit = row.booked - row.winnings;
                      return (
                        <tr key={row.date} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {row.date}
                          </td>
                          <td className="px-6 py-4 text-indigo-400 font-bold">
                            ₹{row.booked.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-bold">
                            ₹{row.winnings.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-emerald-400 font-semibold">
                            ₹{row.recharges.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-rose-450 font-semibold">
                            ₹{row.withdrawals.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            ₹{row.commissions.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right font-black text-base ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            ₹{netProfit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "showwise" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300">Show-Wise Performance Summary</h2>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Show Name / Draw</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Draw Date</th>
                    <th className="px-6 py-4">Tickets Booked</th>
                    <th className="px-6 py-4">Total Sales (Revenue)</th>
                    <th className="px-6 py-4">Total Winnings Paid</th>
                    <th className="px-6 py-4 text-right">Net Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {showWiseReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        {hasActiveFilters ? "No shows match your filters." : "No lottery shows initialized."}
                      </td>
                    </tr>
                  ) : (
                    showWiseReports.map((row) => {
                      const netProfit = row.totalSold - row.totalPayout;
                      return (
                        <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-bold text-white">
                            {row.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                              {row.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {formatToISTDateString(row.drawTime)} at {formatToISTTimeString(row.drawTime)}
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-semibold">
                            {row.ticketsCount}
                          </td>
                          <td className="px-6 py-4 text-indigo-400 font-bold">
                            ₹{row.totalSold.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-bold">
                            ₹{row.totalPayout.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right font-extrabold ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            ₹{netProfit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "userwise" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300">User Performance Ledger</h2>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Wallet Balance</th>
                    <th className="px-6 py-4">Total Recharged</th>
                    <th className="px-6 py-4">Total Booked</th>
                    <th className="px-6 py-4">Total Commissions</th>
                    <th className="px-6 py-4">Total Withdrawn</th>
                    <th className="px-6 py-4 text-right">Net Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {userWiseReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        {hasActiveFilters ? "No users match your search." : "No registered users found."}
                      </td>
                    </tr>
                  ) : (
                    userWiseReports.map((row) => {
                      const netFlow = row.totalRecharge - row.totalWithdraw;
                      return (
                        <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-white">{row.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{row.mobileNumber}</p>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                            ₹{row.balance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-emerald-400 font-semibold">
                            ₹{row.totalRecharge.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-bold">
                            ₹{row.totalBooked.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-amber-550 font-semibold">
                            ₹{row.totalCommission.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-rose-400 font-semibold">
                            ₹{row.totalWithdraw.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right font-black ${netFlow >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                            ₹{netFlow.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
