import { prisma } from "@/app/utils/db";
import { createHoliday, deleteHoliday } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

export default async function HolidaysPage() {
  const holidays = await prisma.holiday.findMany({
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-10">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Lottery Holidays Schedule
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Block draw days for specific lotteries or freeze bookings across the entire application on public holidays.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Holiday Block */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 h-fit backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-lg font-bold text-white mb-6">Add Holiday Block</h2>
          
          <form action={async (formData) => {
            "use server";
            const date = formData.get("date") as string;
            const category = formData.get("category") as string;
            const description = formData.get("description") as string;
            await createHoliday(date, category, description);
          }} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
              <input
                type="date"
                name="date"
                required
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all select-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Applicable Lottery</label>
              <select
                name="category"
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="ALL">All Lotteries (Whole Application)</option>
                <option value="DEAR">Dear Lotteries Only</option>
                <option value="KERALA">Kerala Lotteries Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <input
                type="text"
                name="description"
                required
                placeholder="e.g. Diwali Festival or Sunday Draw Suspension"
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <ConfirmButton
              type="submit"
              message="Are you sure you want to add this holiday block?"
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Add Holiday Block 📅
            </ConfirmButton>
          </form>
        </div>

        {/* Holidays List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-350">Active Holidays Schedule</h2>
          {holidays.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-850/60 p-10 text-center text-slate-500 rounded-2xl text-sm font-semibold">
              No holiday blocks defined. All draws will execute as scheduled.
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/85 text-xs text-slate-455 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Holiday Date</th>
                      <th className="px-6 py-4">Applicable Scope</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {new Date(h.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-bold border ${h.category === null ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : h.category === "DEAR" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                            {h.category === null ? "Whole App" : `${h.category} Category`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                          {h.description}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={deleteHoliday.bind(null, h.id)}>
                            <ConfirmButton
                              type="submit"
                              message="Are you sure you want to remove this holiday block and resume scheduled draws?"
                              className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500 hover:text-white px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </ConfirmButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
