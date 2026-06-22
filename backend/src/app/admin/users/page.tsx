import { prisma } from "@/app/utils/db";
import { toggleBlockUser, editUser, updateUserWallet } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

export default async function UsersPage(props: {
  searchParams: Promise<{
    query?: string;
    page?: string;
    isBlocked?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 15;
  const skip = (page - 1) * limit;

  const isBlocked = searchParams.isBlocked || "ALL";
  const role = searchParams.role || "ALL";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";

  const whereClause: any = {
    AND: []
  };

  if (query) {
    whereClause.AND.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { mobileNumber: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
      ],
    });
  }

  if (isBlocked !== "ALL") {
    whereClause.AND.push({
      isBlocked: isBlocked === "BLOCKED",
    });
  }

  if (role !== "ALL") {
    whereClause.AND.push({
      role: role as any,
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
    whereClause.AND.push({
      createdAt: dateQuery,
    });
  }

  if (whereClause.AND.length === 0) {
    delete whereClause.AND;
  }

  // Fetch total count matching query
  const totalCount = await prisma.user.count({
    where: whereClause,
  });

  // Fetch users matching query
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      wallet: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  // Group device IDs and query details for duplicate devices and shared wallets
  const deviceIds = users.map((u) => u.deviceId).filter(Boolean) as string[];

  // Get other accounts sharing the same device IDs
  const sharedDeviceUsers = deviceIds.length > 0
    ? await prisma.user.findMany({
        where: {
          deviceId: { in: deviceIds },
        },
        select: {
          id: true,
          name: true,
          mobileNumber: true,
          deviceId: true,
        },
      })
    : [];

  // Find the oldest user for each device ID in this list to get the canonical wallet balance
  const allDeviceUsers = deviceIds.length > 0
    ? await prisma.user.findMany({
        where: {
          deviceId: { in: deviceIds },
        },
        include: {
          wallet: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const oldestUserByDevice: Record<string, typeof allDeviceUsers[0]> = {};
  for (const u of allDeviceUsers) {
    if (u.deviceId && !oldestUserByDevice[u.deviceId]) {
      oldestUserByDevice[u.deviceId] = u;
    }
  }

  const totalPages = Math.ceil(totalCount / limit);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const getPageUrl = (targetPage: number) => {
    return `/admin/users?query=${encodeURIComponent(query)}&isBlocked=${isBlocked}&role=${role}&startDate=${startDate}&endDate=${endDate}&page=${targetPage}`;
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            User Accounts
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage user profiles, permissions, and wallet adjustments.</p>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Query Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Profile</label>
            <div className="relative">
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Name, mobile, email..."
                className="w-full bg-slate-950/65 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              name="isBlocked"
              defaultValue={isBlocked}
              className="w-full bg-slate-950/65 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
            >
              <option value="ALL">All Accounts</option>
              <option value="ACTIVE">Active Users Only</option>
              <option value="BLOCKED">Blocked Users Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              name="role"
              defaultValue={role}
              className="w-full bg-slate-950/65 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
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
              {(query || isBlocked !== "ALL" || role !== "ALL" || startDate || endDate) && (
                <a
                  href="/admin/users"
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-350 text-xs px-3.5 py-2 h-[34px] flex items-center justify-center rounded-xl font-bold transition-all cursor-pointer"
                >
                  Clear
                </a>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* Users Table / Grid */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs text-slate-450 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Name / Role</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Security Info</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const otherAccounts = user.deviceId
                    ? sharedDeviceUsers.filter((u) => u.deviceId === user.deviceId && u.id !== user.id)
                    : [];
                  const isCanonical = !user.deviceId || oldestUserByDevice[user.deviceId]?.id === user.id;
                  const displayWallet = (!isCanonical && user.deviceId)
                    ? oldestUserByDevice[user.deviceId]?.wallet
                    : user.wallet;

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                            {(user.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.name || "Unnamed User"}</p>
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase mt-0.5 ${user.role === "ADMIN" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-800 text-slate-400"}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{user.mobileNumber || "N/A"}</p>
                        <p className="text-xs text-slate-500">{user.email || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Device:</span>
                          <span className="font-mono">{user.deviceId || "Unrecorded"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Ref Code:</span>
                          <span className="font-mono font-bold text-indigo-400">{user.referralCode}</span>
                        </div>
                        {otherAccounts.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-[220px]">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                              Shared Device ({otherAccounts.length + 1} accounts):
                            </p>
                            <ul className="mt-1 space-y-1 font-mono text-[9px] text-slate-350 list-disc list-inside">
                              {otherAccounts.map((acc) => (
                                <li key={acc.id} title={acc.mobileNumber || ""}>
                                  {acc.name || "Unnamed"} ({acc.mobileNumber || "No Phone"})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <p className="text-sm font-bold text-emerald-400">
                          Play: ₹{(displayWallet?.balance ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs font-semibold text-indigo-400">
                          Winning: ₹{(displayWallet?.withdrawableBalance ?? 0).toFixed(2)}
                        </p>
                        {!isCanonical && (
                          <span className="inline-block text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md mt-1">
                            Shared Device Wallet
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-bold border ${user.isBlocked ? "bg-rose-500/10 text-rose-400 border-rose-500/25" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? "bg-rose-450 animate-pulse" : "bg-emerald-450"}`} />
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-y-2">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Toggle Block form */}
                          <form action={toggleBlockUser.bind(null, user.id)}>
                            <ConfirmButton
                              type="submit"
                              message={`Are you sure you want to ${user.isBlocked ? "UNBLOCK" : "BLOCK"} user ${user.name || user.mobileNumber}?`}
                              className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                user.isBlocked
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-450 hover:bg-emerald-500 hover:text-white hover:border-transparent"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent"
                              }`}
                            >
                              {user.isBlocked ? "Unblock User" : "Block User"}
                            </ConfirmButton>
                          </form>
                        </div>

                        {/* Edit Details Drawer Toggle */}
                        <details className="group select-none text-left">
                          <summary className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer text-right list-none focus:outline-none select-none transition-colors">
                            <span className="group-open:hidden">▼ Edit & Adjust Wallet</span>
                            <span className="hidden group-open:inline">▲ Hide panel</span>
                          </summary>
                          
                          <div className="mt-3 p-5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-left space-y-5 max-w-sm ml-auto select-text shadow-xl">
                            {/* Saved Bank Details */}
                            <div className="space-y-2 pb-4 border-b border-slate-850">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Bank Details</h4>
                              {user.bankAccountNumber ? (
                                <div className="space-y-1 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                                  <p><span className="text-slate-500 font-bold">Holder:</span> {user.bankAccountHolder}</p>
                                  <p><span className="text-slate-500 font-bold">A/C No:</span> {user.bankAccountNumber}</p>
                                  <p><span className="text-slate-500 font-bold">IFSC:</span> {user.bankIfscCode}</p>
                                  {user.upiId && <p><span className="text-slate-550 font-bold">UPI:</span> {user.upiId}</p>}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 italic">No saved bank details.</p>
                              )}
                            </div>

                            {/* Profile metadata Update Form */}
                            <form action={async (formData) => {
                              "use server";
                              const name = formData.get("name") as string;
                              const email = formData.get("email") as string;
                              const mobile = formData.get("mobileNumber") as string;
                              await editUser(user.id, name, email, mobile);
                            }} className="space-y-3 pb-4 border-b border-slate-800/60">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Details</h4>
                              <input
                                type="text"
                                name="name"
                                defaultValue={user.name || ""}
                                required
                                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Full Name"
                              />
                              <input
                                type="email"
                                name="email"
                                defaultValue={user.email || ""}
                                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Email Address"
                              />
                              <input
                                type="text"
                                name="mobileNumber"
                                defaultValue={user.mobileNumber || ""}
                                required
                                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Mobile Number"
                              />
                              <ConfirmButton
                                type="submit"
                                message={`Are you sure you want to update profile details for ${user.name || user.mobileNumber}?`}
                                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white text-xs py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                              >
                                Save Changes
                              </ConfirmButton>
                            </form>

                            {/* Wallet Adjust Form */}
                            <form action={async (formData) => {
                              "use server";
                              const amount = parseFloat(formData.get("amount") as string);
                              const actionType = formData.get("actionType") as "increment" | "decrement";
                              const adminPin = formData.get("adminPin") as string;
                              const walletType = formData.get("walletType") as "balance" | "withdrawableBalance";
                              await updateUserWallet(user.id, amount, actionType, adminPin, walletType);
                            }} className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjust Wallet</h4>
                              <div className="flex gap-2">
                                <select
                                  name="walletType"
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white focus:outline-none"
                                >
                                  <option value="balance">Play Balance</option>
                                  <option value="withdrawableBalance">Withdrawable Winnings</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  name="amount"
                                  required
                                  min="0.01"
                                  step="0.01"
                                  className="flex-1 text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-white focus:outline-none transition-all"
                                  placeholder="Amount (₹)"
                                />
                                <select
                                  name="actionType"
                                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 text-white focus:outline-none"
                                >
                                  <option value="increment">Add (+)</option>
                                  <option value="decrement">Deduct (-)</option>
                                </select>
                              </div>
                              <input
                                type="password"
                                name="adminPin"
                                maxLength={4}
                                required
                                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-white font-mono tracking-widest text-center focus:outline-none"
                                placeholder="4-Digit Security PIN"
                              />
                              <ConfirmButton
                                type="submit"
                                message={`Are you sure you want to adjust the wallet balance for ${user.name || user.mobileNumber}?`}
                                className="w-full bg-emerald-600 hover:bg-emerald-550 text-white text-xs py-1.5 rounded-lg font-extrabold transition-colors cursor-pointer"
                              >
                                Authorize Balance Adjust
                              </ConfirmButton>
                            </form>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/40 px-6 py-4 backdrop-blur-md">
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{skip + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(skip + limit, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-white">{totalCount}</span> users
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
              </a>            </div>
          </div>
        )}
      </div>
    </div>
  );
}
