"use client";

import React, { useState, useTransition, useMemo } from "react";
import { calculateTicketWinnings } from "@/app/utils/lottery";
import { formatToISTString } from "@/app/utils/date";

interface User {
  id: string;
  name: string | null;
  mobileNumber: string | null;
}

interface Ticket {
  id: string;
  userId: string;
  lotteryId: string;
  number: string;
  amount: number;
  gameType: string;
  status: string;
  winnings: number;
  winningsPaid: boolean;
  createdAt: Date | string;
  user: User;
}

interface Lottery {
  id: string;
  name: string;
  category: string;
  drawTime: Date | string;
  ticketPrice: number;
  status: string;
  winningNumber: string | null;
}

interface TicketsClientProps {
  lottery: Lottery;
  initialTickets: Ticket[];
  declareResultAction: (formData: FormData) => Promise<void>;
  payUserWinningsAction: (userId: string, lotteryId: string) => Promise<void>;
  payAllWinningsAction: (lotteryId: string) => Promise<void>;
}

export default function TicketsClient({
  lottery,
  initialTickets,
  declareResultAction,
  payUserWinningsAction,
  payAllWinningsAction,
}: TicketsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [previewNumber, setPreviewNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isCompleted = lottery.status === "COMPLETED";
  const activeWinningNumber = isCompleted ? lottery.winningNumber || "" : previewNumber;

  // Clear messages
  const clearMessages = () => {
    setActionError(null);
    setSuccessMsg(null);
  };

  // Evaluate tickets based on winning number (either actual or preview)
  const evaluatedTickets = useMemo(() => {
    return initialTickets.map((ticket) => {
      // If completed and not previewing anything, use the actual DB state
      if (isCompleted && !previewNumber) {
        return {
          ...ticket,
          calculatedWinnings: ticket.winnings,
          isWinner: ticket.status === "WON",
        };
      }

      // If we have a preview number or if we are checking potential winnings
      if (activeWinningNumber.length === 4) {
        const potentialWinnings = calculateTicketWinnings(
          ticket.gameType,
          ticket.amount,
          ticket.number,
          activeWinningNumber
        );
        return {
          ...ticket,
          calculatedWinnings: potentialWinnings,
          isWinner: potentialWinnings > 0,
        };
      }

      // Default state for open/closed lotteries without preview number
      return {
        ...ticket,
        calculatedWinnings: 0,
        isWinner: false,
      };
    });
  }, [initialTickets, isCompleted, activeWinningNumber, previewNumber]);

  // Filter based on search term (search user name, phone, or ticket number)
  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return evaluatedTickets;

    return evaluatedTickets.filter(
      (t) =>
        t.number.includes(term) ||
        t.gameType.toLowerCase().includes(term) ||
        (t.user.name && t.user.name.toLowerCase().includes(term)) ||
        (t.user.mobileNumber && t.user.mobileNumber.includes(term))
    );
  }, [evaluatedTickets, searchTerm]);

  // Metrics calculations
  const totalTicketsCount = initialTickets.length;
  const totalSalesAmount = initialTickets.reduce((sum, t) => sum + t.amount, 0);

  const winnerMetrics = useMemo(() => {
    const winners = evaluatedTickets.filter((t) => t.isWinner);
    const unpaid = winners.filter((t) => !t.winningsPaid);
    const totalWinnings = winners.reduce((sum, t) => sum + t.calculatedWinnings, 0);
    const unpaidWinnings = unpaid.reduce((sum, t) => sum + t.calculatedWinnings, 0);

    return {
      winnersCount: winners.length,
      unpaidCount: unpaid.length,
      totalWinnings,
      unpaidWinnings,
    };
  }, [evaluatedTickets]);

  // Handle Result Declaration
  const handleDeclare = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    if (!previewNumber || previewNumber.length !== 4 || isNaN(Number(previewNumber))) {
      setActionError("Winning number must be a valid 4-digit number.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("lotteryId", lottery.id);
        formData.append("winningNumber", previewNumber);

        await declareResultAction(formData);
        setSuccessMsg(`Successfully declared winning number ${previewNumber} for ${lottery.name}!`);
        setPreviewNumber(""); // clear preview on success
      } catch (err: any) {
        setActionError(err.message || "Failed to declare result");
      }
    });
  };

  // Handle pay single user
  const handlePayUser = async (userId: string) => {
    clearMessages();
    startTransition(async () => {
      try {
        await payUserWinningsAction(userId, lottery.id);
        setSuccessMsg("Successfully disbursed winnings to the user's wallet!");
      } catch (err: any) {
        setActionError(err.message || "Failed to pay user");
      }
    });
  };

  // Handle pay all
  const handlePayAll = async () => {
    clearMessages();
    if (!confirm("Are you sure you want to pay all unpaid winners for this draw show?")) {
      return;
    }
    startTransition(async () => {
      try {
        await payAllWinningsAction(lottery.id);
        setSuccessMsg("Successfully disbursed all winnings for this draw show!");
      } catch (err: any) {
        setActionError(err.message || "Failed to process payouts");
      }
    });
  };

  // Group tickets by user to show who bought what in aggregated summary
  const userAggregatedList = useMemo(() => {
    const userMap: Record<
      string,
      {
        user: User;
        tickets: Ticket[];
        totalSpent: number;
        winnings: number;
        unpaidWinnings: number;
        isPaid: boolean;
        winTicketsCount: number;
      }
    > = {};

    for (const t of evaluatedTickets) {
      const uId = t.userId;
      if (!userMap[uId]) {
        userMap[uId] = {
          user: t.user,
          tickets: [],
          totalSpent: 0,
          winnings: 0,
          unpaidWinnings: 0,
          isPaid: true,
          winTicketsCount: 0,
        };
      }
      userMap[uId].tickets.push(t);
      userMap[uId].totalSpent += t.amount;
      if (t.isWinner) {
        userMap[uId].winTicketsCount += 1;
        userMap[uId].winnings += t.calculatedWinnings;
        if (!t.winningsPaid) {
          userMap[uId].unpaidWinnings += t.calculatedWinnings;
          userMap[uId].isPaid = false;
        }
      }
    }

    return Object.values(userMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [evaluatedTickets]);

  const [activeTab, setActiveTab] = useState<"tickets" | "users">("tickets");

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-4 rounded-xl flex justify-between items-center text-sm font-semibold">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-4 rounded-xl flex justify-between items-center text-sm font-semibold">
          <span>🏆 {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Show Info & Live Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw Status Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">Active Draw Show</span>
              {isCompleted ? (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Completed
                </span>
              ) : lottery.status === "CLOSED" ? (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                  Closed (Pending Result)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                  Open
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-2">{lottery.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Category: <span className="font-bold text-slate-350">{lottery.category}</span> | Draw Time:{" "}
              <span className="font-bold text-slate-350">{formatToISTString(lottery.drawTime)}</span> | Ticket Price:{" "}
              <span className="font-bold text-slate-350">₹{lottery.ticketPrice}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-850/60">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tickets Bought</p>
              <p className="text-xl font-extrabold text-white mt-1">{totalTicketsCount}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Sales</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">₹{totalSalesAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Winners ({previewNumber ? "Preview" : "Actual"})</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{winnerMetrics.winnersCount}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Payout</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">₹{winnerMetrics.totalWinnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Action Panel: Declare/Preview */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {isCompleted ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Declared Outcome</h3>
                <div className="flex items-center gap-2 mt-4">
                  {(lottery.winningNumber || "0000").split("").map((digit, idx) => (
                    <span
                      key={idx}
                      className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/5"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">
                  Result was declared. Match criteria calculations and winnings disbursements are frozen.
                </p>
              </div>

              {winnerMetrics.unpaidCount > 0 && (
                <button
                  onClick={handlePayAll}
                  disabled={isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-550 disabled:bg-slate-800 text-white py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {isPending ? "Processing..." : `💰 Pay All Unpaid (₹${winnerMetrics.unpaidWinnings.toFixed(2)})`}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Winnings Evaluation</h3>
              
              <form onSubmit={handleDeclare} className="space-y-3 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Winning Number Preview (4-digits)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={previewNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPreviewNumber(val);
                    }}
                    placeholder="Enter 4 digits (e.g. 5892)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none transition-colors"
                  />
                </div>

                {previewNumber.length === 4 && (
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Live Preview Active:</strong> The ticket table below is updated with winnings calculations based on the outcome number <strong>{previewNumber}</strong>.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || previewNumber.length !== 4}
                  className="w-full bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-800 disabled:text-slate-650 text-white py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {isPending ? "Declaring..." : "🏆 Declare & Process Result"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl shadow-md">
        {/* Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/50 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === "tickets"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            🎟️ All Tickets ({filteredTickets.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === "users"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            👥 User Breakdown ({userAggregatedList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search ticket number, game type, user name, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Main Table view */}
      {activeTab === "tickets" ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-350">
              <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Ticket Info</th>
                  <th className="px-6 py-4">Game Type</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Potential Outcome</th>
                  <th className="px-6 py-4">Payout Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs font-medium">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-semibold">
                      No matching purchased tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const hasWinnings = ticket.calculatedWinnings > 0;
                    
                    return (
                      <tr key={ticket.id} className="hover:bg-white/[0.01] transition-colors">
                        {/* User Details */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{ticket.user.name || "N/A"}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{ticket.user.mobileNumber || "N/A"}</p>
                        </td>

                        {/* Ticket Number */}
                        <td className="px-6 py-4">
                          <span className="font-mono font-black text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-xs">
                            {ticket.number}
                          </span>
                          <p className="text-[10px] text-slate-550 mt-1.5">
                            {formatToISTString(ticket.createdAt)}
                          </p>
                        </td>

                        {/* Game Type */}
                        <td className="px-6 py-4">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded text-[10px] font-bold">
                            {ticket.gameType}
                          </span>
                        </td>

                        {/* Cost */}
                        <td className="px-6 py-4 font-bold text-slate-200">
                          ₹{ticket.amount.toFixed(2)}
                        </td>

                        {/* Winnings Preview */}
                        <td className="px-6 py-4">
                          {hasWinnings ? (
                            <div>
                              <p className="text-emerald-450 font-black text-sm">₹{ticket.calculatedWinnings.toFixed(2)}</p>
                              {previewNumber && (
                                <p className="text-[9px] text-emerald-500/70 font-semibold uppercase tracking-wider">Preview Win</p>
                              )}
                            </div>
                          ) : activeWinningNumber.length === 4 ? (
                            <span className="text-slate-550">Losing Ticket</span>
                          ) : isCompleted ? (
                            <span className="text-slate-550">—</span>
                          ) : (
                            <span className="text-slate-600 italic">Pending draw</span>
                          )}
                        </td>

                        {/* Status / Paid state */}
                        <td className="px-6 py-4">
                          {ticket.winningsPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                              Paid
                            </span>
                          ) : hasWinnings ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-450 border border-rose-500/20 font-bold uppercase animate-pulse">
                              Unpaid Winnings
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-850/60 text-slate-500 border border-slate-800 font-bold uppercase">
                              {ticket.status}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {isCompleted && hasWinnings && !ticket.winningsPaid ? (
                            <button
                              disabled={isPending}
                              onClick={() => handlePayUser(ticket.userId)}
                              className="bg-emerald-600 hover:bg-emerald-550 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Disburse
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-550 font-bold">
                              {ticket.winningsPaid ? "Completed ✓" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // USER GROUPED BREAKDOWN
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-350">
              <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Tickets Bought</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Winning Tickets</th>
                  <th className="px-6 py-4">Total Winnings</th>
                  <th className="px-6 py-4">Payout Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs font-medium">
                {userAggregatedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-semibold">
                      No purchases recorded for this draw.
                    </td>
                  </tr>
                ) : (
                  userAggregatedList.map((entry) => {
                    const hasWinnings = entry.winnings > 0;
                    return (
                      <tr key={entry.user.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{entry.user.name || "N/A"}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{entry.user.mobileNumber || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-250">
                          {entry.tickets.length} tickets
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-200">
                          ₹{entry.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-450">
                          {entry.winTicketsCount} won
                        </td>
                        <td className="px-6 py-4 font-black text-indigo-400 text-sm">
                          ₹{entry.winnings.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {hasWinnings ? (
                            entry.isPaid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-450 border border-rose-500/20 font-bold uppercase animate-pulse">
                                Unpaid
                              </span>
                            )
                          ) : (
                            <span className="text-slate-550">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isCompleted && hasWinnings && !entry.isPaid ? (
                            <button
                              disabled={isPending}
                              onClick={() => handlePayUser(entry.user.id)}
                              className="bg-emerald-650 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow shadow-emerald-600/10"
                            >
                              Disburse Winnings
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-550 font-bold">
                              {hasWinnings && entry.isPaid ? "Paid Out ✓" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
