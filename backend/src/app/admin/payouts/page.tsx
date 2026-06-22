import { prisma } from "@/app/utils/db";
import Link from "next/link";
import { payUserWinningsForShow, payAllWinningsForShow } from "./actions";

export default async function PayoutsPage(props: {
  searchParams: Promise<{ lotteryId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedLotteryId = searchParams.lotteryId;

  // 1. Fetch completed lotteries to list them
  const completedLotteries = await prisma.lottery.findMany({
    where: { status: "COMPLETED" },
    include: {
      tickets: {
        where: { status: "WON" },
      },
    },
    orderBy: { drawTime: "desc" },
  });

  // Calculate summaries for each lottery
  const lotteriesSummary = completedLotteries.map((lottery) => {
    const totalWinners = lottery.tickets.length;
    const unpaidTickets = lottery.tickets.filter((t) => !t.winningsPaid);
    const unpaidCount = unpaidTickets.length;
    const unpaidAmount = unpaidTickets.reduce((sum, t) => sum + t.winnings, 0);
    const totalPayout = lottery.tickets.reduce((sum, t) => sum + t.winnings, 0);

    return {
      id: lottery.id,
      name: lottery.name,
      drawTime: lottery.drawTime,
      winningNumber: lottery.winningNumber,
      totalWinners,
      unpaidCount,
      unpaidAmount,
      totalPayout,
    };
  });

  // 2. Fetch selected lottery details and group by user
  let selectedLottery = null;
  let winnersList: Array<{
    userId: string;
    name: string;
    mobileNumber: string;
    ticketsCount: number;
    totalWinnings: number;
    unpaidWinnings: number;
    isPaid: boolean;
  }> = [];

  if (selectedLotteryId) {
    selectedLottery = await prisma.lottery.findUnique({
      where: { id: selectedLotteryId },
      include: {
        tickets: {
          where: { status: "WON" },
          include: { user: true },
        },
      },
    });

    if (selectedLottery) {
      const userWinningsMap: Record<
        string,
        {
          userId: string;
          name: string;
          mobileNumber: string;
          ticketsCount: number;
          totalWinnings: number;
          unpaidWinnings: number;
          isPaid: boolean;
        }
      > = {};

      for (const ticket of selectedLottery.tickets) {
        const uId = ticket.userId;
        if (!userWinningsMap[uId]) {
          userWinningsMap[uId] = {
            userId: uId,
            name: ticket.user.name || "N/A",
            mobileNumber: ticket.user.mobileNumber || "N/A",
            ticketsCount: 0,
            totalWinnings: 0,
            unpaidWinnings: 0,
            isPaid: true,
          };
        }
        userWinningsMap[uId].ticketsCount += 1;
        userWinningsMap[uId].totalWinnings += ticket.winnings;
        if (!ticket.winningsPaid) {
          userWinningsMap[uId].unpaidWinnings += ticket.winnings;
          userWinningsMap[uId].isPaid = false;
        }
      }

      winnersList = Object.values(userWinningsMap).sort(
        (a, b) => b.totalWinnings - a.totalWinnings
      );
    }
  }

  const pendingPayoutsCount = lotteriesSummary.reduce((sum, l) => sum + (l.unpaidCount > 0 ? 1 : 0), 0);
  const totalUnpaidAmount = lotteriesSummary.reduce((sum, l) => sum + l.unpaidAmount, 0);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Manage Winnings Payouts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Dispatch lottery winnings directly to user withdrawable wallets after draw completion.
          </p>
        </div>
        {selectedLotteryId && (
          <Link
            href="/admin/payouts"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl font-bold transition-all"
          >
            ← Back to Shows List
          </Link>
        )}
      </div>

      {/* Summary KPI stats */}
      {!selectedLotteryId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Draws Pending Payout</h3>
            <p className="text-3xl font-black text-amber-400 mt-3">{pendingPayoutsCount}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Completed draws with unpaid winners</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Unpaid Winnings</h3>
            <p className="text-3xl font-black text-rose-450 mt-3">₹{totalUnpaidAmount.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Sum of all unclaimed draw winnings</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Draws</h3>
            <p className="text-3xl font-black text-indigo-400 mt-3">{completedLotteries.length}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total archived and evaluated draws</p>
          </div>
        </div>
      )}

      {/* Main View Grid */}
      {!selectedLotteryId ? (
        // LIST OF ALL COMPLETED SHOWS
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300">Completed Draw Shows</h2>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Draw Show Name</th>
                    <th className="px-6 py-4">Winning Number</th>
                    <th className="px-6 py-4">Winners (Tickets)</th>
                    <th className="px-6 py-4">Total Payout</th>
                    <th className="px-6 py-4">Unpaid Winners</th>
                    <th className="px-6 py-4">Payout Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {lotteriesSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No completed draw results found.
                      </td>
                    </tr>
                  ) : (
                    lotteriesSummary.map((summary) => (
                      <tr key={summary.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{summary.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Draw: {new Date(summary.drawTime).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-indigo-500/10 text-indigo-400 font-extrabold px-2.5 py-1 rounded border border-indigo-500/20 text-xs">
                            {summary.winningNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">
                          {summary.totalWinners} tickets
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          ₹{summary.totalPayout.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {summary.unpaidCount > 0 ? (
                            <span className="text-amber-400 font-semibold">
                              {summary.unpaidCount} tickets (₹{summary.unpaidAmount.toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {summary.totalWinners === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full bg-slate-500/10 text-slate-450 border border-slate-500/20 font-bold">
                              No Winners
                            </span>
                          ) : summary.unpaidCount === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              Fully Disbursed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                              Payout Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/payouts?lotteryId=${summary.id}`}
                            className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-indigo-650/10 inline-block"
                          >
                            Manage Payouts →
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
        // SHOW SPECIFIC USER-WISE WINNERS LIST
        <div className="space-y-6">
          {selectedLottery ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
              <div>
                <p className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">Active Draw Payout Panel</p>
                <h2 className="text-xl font-bold text-white mt-1">{selectedLottery.name}</h2>
                <p className="text-xs text-slate-550 mt-1">
                  Draw date: {new Date(selectedLottery.drawTime).toLocaleString()} | Winning Outcome:{" "}
                  <span className="text-indigo-400 font-bold font-mono bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-xs">
                    {selectedLottery.winningNumber}
                  </span>
                </p>
              </div>

              {/* Pay all button */}
              {winnersList.some((w) => !w.isPaid) && (
                <form
                  action={async () => {
                    "use server";
                    await payAllWinningsForShow(selectedLotteryId);
                  }}
                >
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-550 text-white text-sm px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    💰 Pay All Unpaid Winners
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400">
              Draw show details could not be found.
            </div>
          )}

          {/* User Wise Winnings Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-300">User Winnings Breakdown</h3>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/85 text-xs text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Winning Tickets</th>
                      <th className="px-6 py-4">Total Winnings</th>
                      <th className="px-6 py-4">Pending Payout</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {winnersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No winners recorded for this draw.
                        </td>
                      </tr>
                    ) : (
                      winnersList.map((winner) => (
                        <tr key={winner.userId} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-white">{winner.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{winner.mobileNumber}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-200">
                            {winner.ticketsCount} tickets
                          </td>
                          <td className="px-6 py-4 font-extrabold text-indigo-400">
                            ₹{winner.totalWinnings.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            {winner.unpaidWinnings > 0 ? (
                              <span className="text-rose-400 font-black">
                                ₹{winner.unpaidWinnings.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-550">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {winner.isPaid ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!winner.isPaid ? (
                              <form
                                action={async () => {
                                  "use server";
                                  await payUserWinningsForShow(winner.userId, selectedLotteryId!);
                                }}
                              >
                                <button
                                  type="submit"
                                  className="bg-emerald-600 hover:bg-emerald-550 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                                >
                                  Disburse Winnings
                                </button>
                              </form>
                            ) : (
                              <button
                                disabled
                                className="bg-slate-900 border border-slate-800 text-slate-500 text-xs px-4 py-2 rounded-xl font-bold pointer-events-none"
                              >
                                Paid Out ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
