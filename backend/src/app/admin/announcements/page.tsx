import { createAnnouncement } from "./actions";
import { ConfirmButton } from "../ConfirmButton";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Global Announcements
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Broadcast notification alerts to all users. Notifications will show up in their mobile app alert list immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Form Column */}
        <div className="md:col-span-3 bg-slate-900/50 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-lg font-bold text-white mb-6">Create Broadcast</h2>
          
          <form action={createAnnouncement} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Announcement Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Server Maintenance or Sunday Bonus claim is open!"
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Message</label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Write the full alert details here..."
                className="w-full text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <ConfirmButton
              type="submit"
              message="Are you sure you want to broadcast this announcement to all active users?"
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Broadcast Announcement 📢
            </ConfirmButton>
          </form>
        </div>

        {/* Quick examples block */}
        <div className="md:col-span-2 bg-indigo-950/20 border border-indigo-550/15 rounded-2xl p-5 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
            <span>💡 Suggestions & Templates</span>
          </h3>
          <ul className="mt-4 text-xs text-slate-350 space-y-4">
            <li className="space-y-1">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider text-indigo-405">Holiday Blockout</span>
              <p className="leading-relaxed">
                "Dear Lottery draws are cancelled tomorrow due to festival holiday. Bookings for subsequent days remain open."
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider text-indigo-405">Promo Alert</span>
              <p className="leading-relaxed">
                "Sunday Bonus is now claimable! If you completed Monday-Saturday requirements, claim your free ₹100 from the Rules page."
              </p>
            </li>
            <li className="space-y-1">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider text-indigo-405">System Maintenance</span>
              <p className="leading-relaxed">
                "Deposit gateway Scanner 1 will undergo routine maintenance tonight at 10 PM. Please use Scanner 2 or 3 in the meantime."
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
