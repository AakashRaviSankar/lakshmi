import { prisma } from "@/app/utils/db";
import { approveRecharge, rejectRecharge, deleteRecharge, revokeRechargeApproval } from "./actions";
import { ConfirmButton } from "../ConfirmButton";
import { formatToISTString } from "@/app/utils/date";

export default async function RechargesPage(props: {
  searchParams: Promise<{ page?: string; query?: string; scanner?: string; status?: string; startDate?: string; endDate?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 15;
  const skip = (page - 1) * limit;

  const query = searchParams.query || "";
  const scanner = searchParams.scanner || "ALL";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";
  const historyStatus = searchParams.status || "ALL";

  const buildWhere = (statusFilter: any) => {
    const where: any = {
      status: statusFilter,
      AND: []
    };

    if (query) {
      where.AND.push({
        OR: [
          { utrNumber: { contains: query, mode: "insensitive" } },
          { scanner: { contains: query, mode: "insensitive" } },
          {
            user: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { mobileNumber: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ]
            }
          }
        ]
      });
    }

    if (scanner !== "ALL") {
      where.AND.push({ scanner });
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        dateQuery.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateQuery.lte = end;
      }
      where.AND.push({ createdAt: dateQuery });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }
    return where;
  };

  const pendingRequests = await prisma.rechargeRequest.findMany({
    where: buildWhere("PENDING"),
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const historyStatusFilter = historyStatus === "ALL" ? { not: "PENDING" as const } : (historyStatus as any);
  const historyWhere = buildWhere(historyStatusFilter);

  const totalHistory = await prisma.rechargeRequest.count({
    where: historyWhere,
  });

  const allHistory = await prisma.rechargeRequest.findMany({
    where: historyWhere,
    include: { user: true },
    orderBy: { updatedAt: "desc" },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(totalHistory / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const getPageUrl = (targetPage: number) => {
    return `/admin/recharges?query=${encodeURIComponent(query)}&scanner=${scanner}&status=${historyStatus}&startDate=${startDate}&endDate=${endDate}&page=${targetPage}`;
  };

  return (
    <div className="space-y-10">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Recharge Requests
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review, approve, reject, or revoke user-submitted wallet deposits.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Query Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search</label>
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="UTR or user details..."
              className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          {/* Scanner/Gateway Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scanner Gateway</label>
            <select
              name="scanner"
              defaultValue={scanner}
              className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
            >
              <option value="ALL">All Gateways</option>
              <option value="Scanner 1">Scanner 1</option>
              <option value="Scanner 2">Scanner 2</option>
            </select>
          </div>

          {/* History Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">History Status</label>
            <select
              name="status"
              defaultValue={historyStatus}
              className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
            >
              <option value="ALL">All History</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          </div>

          {/* Date Picker Range */}
          <div className="space-y-1 md:col-span-2 flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none transition-all select-none"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none transition-all select-none"
              />
            </div>
            <div className="flex gap-2 items-end">
              <button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs px-4 py-2 h-[34px] rounded-xl font-bold transition-all shadow-md shadow-indigo-650/10 cursor-pointer animate-none"
              >
                Apply
              </button>
              {(query || scanner !== "ALL" || historyStatus !== "ALL" || startDate || endDate) && (
                <a
                  href="/admin/recharges"
                  className="bg-slate-950 hover:bg-slate-805 border border-slate-800 text-slate-350 text-xs px-3.5 py-2 h-[34px] flex items-center justify-center rounded-xl font-bold transition-all cursor-pointer"
                >
                  Clear
                </a>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 1. Pending Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <span>Pending Approvals</span>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
            {pendingRequests.length}
          </span>
        </h2>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
            No pending recharge requests found.
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-450 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">UTR / Gateway</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4">Proof</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{request.user.name || "N/A"}</p>
                        <p className="text-xs text-slate-500">{request.user.mobileNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-semibold text-indigo-400">{request.utrNumber}</p>
                        <p className="text-xs text-slate-500">{request.scanner}</p>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-emerald-400">₹{request.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatToISTString(request.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {request.screenshotUrl ? (
                          <a
                            href={request.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-350 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            🖼️ View Proof
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs italic font-medium">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <form action={async () => {
                            "use server";
                            await approveRecharge(request.id);
                          }}>
                            <ConfirmButton
                              type="submit"
                              message={`Are you sure you want to APPROVE this deposit request of ₹${request.amount.toFixed(2)}?`}
                              className="text-xs bg-emerald-600 hover:bg-emerald-550 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                            >
                              Approve
                            </ConfirmButton>
                          </form>
                          <form action={async () => {
                            "use server";
                            await rejectRecharge(request.id);
                          }}>
                            <ConfirmButton
                              type="submit"
                              message={`Are you sure you want to REJECT this deposit request of ₹${request.amount.toFixed(2)}?`}
                              className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. History Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-350">Transaction History</h2>
        {allHistory.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
            No transaction records found.
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-450 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">UTR / Gateway</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {allHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{h.user.name || "N/A"}</p>
                        <p className="text-xs text-slate-500">{h.user.mobileNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-semibold text-indigo-400">{h.utrNumber}</p>
                        <p className="text-xs text-slate-500">{h.scanner}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-100">₹{h.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full font-bold border ${h.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-450 border-rose-500/20"}`}>
                          <span className={`w-1 h-1 rounded-full ${h.status === "APPROVED" ? "bg-emerald-450" : "bg-rose-450"}`} />
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatToISTString(h.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          {h.status === "APPROVED" && (
                            <form action={async () => {
                              "use server";
                              await revokeRechargeApproval(h.id);
                            }}>
                              <ConfirmButton
                                type="submit"
                                message={`Are you sure you want to REVOKE this recharge approval? This will deduct ₹${h.amount.toFixed(2)} balance from the user's wallet.`}
                                className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-900 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                              >
                                Revoke Approval
                              </ConfirmButton>
                            </form>
                          )}
                          <form action={async () => {
                            "use server";
                            await deleteRecharge(h.id);
                          }}>
                            <ConfirmButton
                              type="submit"
                              message="Are you sure you want to DELETE this recharge record?"
                              className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              Delete
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/40 px-6 py-4 backdrop-blur-md">
                <div className="text-xs text-slate-400">
                  Showing <span className="font-semibold text-white">{skip + 1}</span> to{" "}
                  <span className="font-semibold text-white">
                    {Math.min(skip + limit, totalHistory)}
                  </span>{" "}
                  of <span className="font-semibold text-white">{totalHistory}</span> deposits
                </div>
                <div className="flex gap-2">
                  <a
                    href={getPageUrl(page - 1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      hasPrev
                        ? "bg-slate-900/60 border-slate-850 hover:bg-slate-800/80 text-white cursor-pointer"
                        : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                    }`}
                  >
                    Previous
                  </a>
                  <span className="px-3 py-1.5 text-xs text-slate-400 font-semibold bg-slate-950/40 rounded-lg border border-slate-900">
                    Page {page} of {totalPages}
                  </span>
                  <a
                    href={getPageUrl(page + 1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      hasNext
                        ? "bg-slate-900/60 border-slate-850 hover:bg-slate-800/80 text-white cursor-pointer"
                        : "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none"
                    }`}
                  >
                    Next
                  </a>                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
