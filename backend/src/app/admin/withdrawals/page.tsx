import { prisma } from "@/app/utils/db";
import { approveWithdrawal, rejectWithdrawal, deleteWithdrawal } from "./actions";
import { ConfirmButton } from "../ConfirmButton";
import { formatToISTString } from "@/app/utils/date";

export default async function WithdrawalsPage(props: {
  searchParams: Promise<{ page?: string; query?: string; status?: string; startDate?: string; endDate?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 15;
  const skip = (page - 1) * limit;

  const query = searchParams.query || "";
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
          { accountNumber: { contains: query, mode: "insensitive" } },
          { accountHolder: { contains: query, mode: "insensitive" } },
          { upiId: { contains: query, mode: "insensitive" } },
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

  const pendingRequests = await prisma.withdrawRequest.findMany({
    where: buildWhere("PENDING"),
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const historyStatusFilter = historyStatus === "ALL" ? { not: "PENDING" as const } : (historyStatus as any);
  const historyWhere = buildWhere(historyStatusFilter);

  const totalHistory = await prisma.withdrawRequest.count({
    where: historyWhere,
  });

  const allHistory = await prisma.withdrawRequest.findMany({
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
    return `/admin/withdrawals?query=${encodeURIComponent(query)}&status=${historyStatus}&startDate=${startDate}&endDate=${endDate}&page=${targetPage}`;
  };

  return (
    <div className="space-y-10">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Withdrawal Requests
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review, approve, or reject user-submitted cash withdrawals to their bank details.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Query Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search</label>
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="A/C, UPI, holder or user..."
              className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
            />
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
              {(query || historyStatus !== "ALL" || startDate || endDate) && (
                <a
                  href="/admin/withdrawals"
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-350 text-xs px-3.5 py-2 h-[34px] flex items-center justify-center rounded-xl font-bold transition-all cursor-pointer"
                >
                  Clear
                </a>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 1. Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <span>Pending Approvals</span>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
            {pendingRequests.length}
          </span>
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
            No pending withdrawal requests found.
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-450 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Bank Account details</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{request.user?.name || request.accountHolder || "Unnamed User"}</p>
                        <p className="text-xs text-slate-500">{request.user?.mobileNumber || "N/A"}</p>
                        {request.user?.deviceId && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">Device: {request.user.deviceId}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-100 font-semibold text-xs">{request.accountHolder}</p>
                        <p className="font-mono text-xs text-slate-400">A/C: {request.accountNumber} | IFSC: {request.ifscCode}</p>
                        {request.upiId && <p className="text-xs font-mono text-indigo-400">{request.upiId}</p>}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-indigo-400">₹{request.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatToISTString(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <form action={async () => {
                            "use server";
                            await approveWithdrawal(request.id);
                          }}>
                            <ConfirmButton
                              type="submit"
                              message={`Are you sure you want to APPROVE this withdrawal request of ₹${request.amount.toFixed(2)} to ${request.accountHolder}?`}
                              className="text-xs bg-emerald-600 hover:bg-emerald-550 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                            >
                              Approve Payout
                            </ConfirmButton>
                          </form>
                          <form action={async () => {
                            "use server";
                            await rejectWithdrawal(request.id);
                          }}>
                            <ConfirmButton
                              type="submit"
                              message={`Are you sure you want to REJECT this withdrawal request of ₹${request.amount.toFixed(2)}?`}
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
        <h2 className="text-lg font-bold text-slate-350">Withdrawal History</h2>
        {allHistory.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
            No withdrawal records found.
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                <thead className="bg-slate-900/85 text-xs text-slate-450 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Bank Account details</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Processed At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {allHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{h.user?.name || h.accountHolder || "Unnamed User"}</p>
                        <p className="text-xs text-slate-500">{h.user?.mobileNumber || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-100 font-semibold text-xs">{h.accountHolder}</p>
                        <p className="font-mono text-xs text-slate-400">A/C: {h.accountNumber} | IFSC: {h.ifscCode}</p>
                        {h.upiId && <p className="text-xs font-mono text-indigo-400">{h.upiId}</p>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-100">₹{h.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full font-bold border ${h.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-455 border-rose-500/20"}`}>
                          <span className={`w-1 h-1 rounded-full ${h.status === "APPROVED" ? "bg-emerald-450" : "bg-rose-450"}`} />
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatToISTString(h.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => {
                          "use server";
                          await deleteWithdrawal(h.id);
                        }}>
                          <ConfirmButton
                            type="submit"
                            message="Are you sure you want to DELETE this withdrawal history record?"
                            className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            Delete Record
                          </ConfirmButton>
                        </form>
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
                  of <span className="font-semibold text-white">{totalHistory}</span> withdrawals
                </div>
                <div className="flex gap-2">

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
