import { prisma } from "@/app/utils/db";
import Link from "next/link";
import { formatToISTString } from "@/app/utils/date";
import { declareResult, editWinningNumber } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

export default async function ResultsPage(props: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);
  const q = searchParams.q || "";
  const limit = 10;
  const skip = (page - 1) * limit;

  const searchWhere = q.trim()
    ? { name: { contains: q.trim(), mode: "insensitive" as const } }
    : {};

  const closedLotteries = await prisma.lottery.findMany({
    where: { status: "CLOSED", ...searchWhere },
    orderBy: { drawTime: "desc" },
  });

  const totalCompleted = await prisma.lottery.count({
    where: { status: "COMPLETED", ...searchWhere },
  });

  const completedLotteries = await prisma.lottery.findMany({
    where: { status: "COMPLETED", ...searchWhere },
    orderBy: { drawTime: "desc" },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(totalCompleted / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const getPageUrl = (newPage: number) => {
    const params = new URLSearchParams({ page: String(newPage), ...(q && { q }) });
    return `/admin/results?${params.toString()}`;
  };

  return (
    <div className="space-y-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Declare & Correct Results
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Input draw outcomes or perform winning number corrections (which will automatically adjust payouts).
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
        <form method="GET" action="/admin/results" className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by lottery name…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-bold rounded-xl transition-all"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin/results"
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl transition-all"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Declare Results Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-350 flex items-center gap-2">
            <span>Pending Results</span>
            {closedLotteries.length > 0 && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-xs font-black">
                {closedLotteries.length}
              </span>
            )}
          </h2>
          
          {closedLotteries.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-850/60 p-8 text-center text-slate-500 rounded-2xl text-sm font-semibold">
              {q ? "No closed lotteries match your search." : "No closed lotteries waiting for results."}
            </div>
          ) : (
            <ul className="space-y-4">
              {closedLotteries.map((lottery) => (
                <li
                  key={lottery.id}
                  className="bg-slate-900/40 border-l-4 border-amber-500/80 border-t border-r border-b border-slate-800/80 p-5 rounded-2xl backdrop-blur-md space-y-4"
                >
                  <div>
                    <h3 className="font-bold text-white text-base">{lottery.name}</h3>
                    <p className="text-xs text-slate-550 font-medium mt-0.5">
                      Draw: {formatToISTString(lottery.drawTime)}
                    </p>
                  </div>
                  
                  <form action={declareResult} className="flex gap-2">
                    <input type="hidden" name="lotteryId" value={lottery.id} />
                    <input
                      type="text"
                      name="winningNumber"
                      required
                      maxLength={4}
                      placeholder="Winning Number (4 digits, e.g. 5892)"
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm flex-1 text-white placeholder-slate-650 focus:outline-none"
                    />
                    <ConfirmButton
                      type="submit"
                      message="Are you sure you want to DECLARE the winning number for this draw? This will calculate and allocate user payouts."
                      className="bg-emerald-650 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Declare
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Results with Edit Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-350">Recent Results</h2>
          {completedLotteries.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-850/60 p-8 text-center text-slate-500 rounded-2xl text-sm font-semibold">
              {q ? "No results match your search." : "No results declared yet."}
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {completedLotteries.map((lottery) => {
                  const digits = (lottery.winningNumber || "0000").split("");
                  return (
                    <li
                      key={lottery.id}
                      className="bg-slate-900/40 border-l-4 border-emerald-500/80 border-t border-r border-b border-slate-800/80 p-5 rounded-2xl backdrop-blur-md space-y-4"
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <h3 className="font-bold text-white text-base">{lottery.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Draw: {formatToISTString(lottery.drawTime)}
                          </p>
                          <Link
                            href={`/admin/payouts?lotteryId=${lottery.id}`}
                            className="inline-block mt-2 text-xs font-bold text-emerald-450 hover:text-emerald-400 hover:underline transition-colors"
                          >
                            💰 Disburse Winnings ➔
                          </Link>
                        </div>
                        <div className="flex gap-1.5">
                          {digits.map((digit, index) => (
                            <span
                              key={index}
                              className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-extrabold text-sm"
                            >
                              {digit}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Inline edit details */}
                      <details className="group select-none border-t border-slate-850/60 pt-3 text-left">
                        <summary className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer text-right list-none focus:outline-none select-none transition-colors">
                          <span className="group-open:hidden">▼ Edit Declared Result</span>
                          <span className="hidden group-open:inline">▲ Hide panel</span>
                        </summary>
                        
                        <form action={async (formData) => {
                          "use server";
                          const newNo = formData.get("newWinningNumber") as string;
                          await editWinningNumber(lottery.id, newNo);
                        }} className="mt-3 flex gap-2 max-w-sm ml-auto select-text">
                          <input
                            type="text"
                            name="newWinningNumber"
                            maxLength={4}
                            defaultValue={lottery.winningNumber || ""}
                            required
                            placeholder="Correct Winning Number"
                            className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs flex-1 text-white focus:outline-none"
                          />
                          <ConfirmButton
                            type="submit"
                            message="Are you sure you want to CORRECT the winning number? This will re-evaluate payouts and update user wallets."
                            className="bg-amber-600 hover:bg-amber-550 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Correct Result
                          </ConfirmButton>
                        </form>
                      </details>
                    </li>
                  );
                })}
              </ul>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-850/60">
                  <div className="text-xs text-slate-400">
                    Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={getPageUrl(page - 1)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        hasPrev
                          ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-white cursor-pointer"
                          : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                      }`}
                    >
                      Previous
                    </a>
                    <a
                      href={getPageUrl(page + 1)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        hasNext
                          ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-white cursor-pointer"
                          : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                      }`}
                    >
                      Next
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
