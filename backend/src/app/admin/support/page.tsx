import { prisma } from "@/app/utils/db";

export default async function AdminSupportPage() {
  const tickets = await prisma.notification.findMany({
    where: {
      title: { startsWith: "[SUPPORT" },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, mobileNumber: true, email: true } },
    },
  });

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

  // Extract ticket ID from title like "[SUPPORT #TKT-ABC-XYZ] Subject"
  const parseTicket = (title: string, message: string) => {
    const match = title.match(/\[SUPPORT #([^\]]+)\]\s*(.*)/);
    return {
      ticketId: match?.[1] || "—",
      subject: match?.[2] || title,
      message,
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Help &amp; Support Tickets
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} submitted by users
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-16 text-center">
          <p className="text-5xl mb-4">🎧</p>
          <p className="text-slate-400 text-base font-semibold">No support tickets yet</p>
          <p className="text-slate-500 text-sm mt-1">All user support requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const { ticketId, subject, message } = parseTicket(ticket.title, ticket.message);
            const lines = message.split("\n");
            const fromLine = lines[0]; // "From: Name (mobile)"
            const body = lines.slice(2).join("\n").trim(); // skip blank line

            return (
              <div
                key={ticket.id}
                className="bg-slate-900/50 border border-slate-800/70 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left — ticket info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className="text-xs font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
                        #{ticketId}
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                        OPEN
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-base mb-1 truncate">{subject}</h3>

                    <p className="text-slate-400 text-xs font-semibold mb-3">
                      {fromLine}
                    </p>

                    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
                    </div>
                  </div>

                  {/* Right — meta */}
                  <div className="flex flex-col gap-2 text-right min-w-[180px]">
                    <div className="bg-slate-800/40 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">User Account</p>
                      <p className="text-slate-200 text-xs font-semibold">{ticket.user?.name || "Guest"}</p>
                      <p className="text-slate-400 text-[11px]">{ticket.user?.mobileNumber || "—"}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Submitted</p>
                      <p className="text-slate-300 text-xs font-semibold">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
