import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Bell, Sparkles, MessageSquare, LogOut, User, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { isBefore, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const subjects = useStore((state) => state.subjects);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setStoreData = useStore((state) => state.setStoreData);

  // Calculate pending reminders (overdue dates OR marked as study_later)
  const pendingReminders = subjects.flatMap((sub) =>
    sub.topics.filter(
      (t) =>
        t.status !== 'completed' &&
        (t.status === 'study_later' || (t.reminderDate && isBefore(parseISO(t.reminderDate), new Date())))
    )
  ).length;

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Reminders', href: '/reminders', icon: Bell, badge: pendingReminders },
    { name: 'AI Tutor', href: '/chat', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    setUser(null);
    setStoreData({ subjects: [], goals: [] });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row font-sans relative selection:bg-indigo-500/30 selection:text-indigo-900">
      {/* Global Background Decoration - Atmospheric */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-300/40 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-300/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-300/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-300/30 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white/40 backdrop-blur-2xl border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-display">Topic Trace</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  'relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors z-10',
                  isActive
                    ? 'text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}>
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                    {item.name}
                  </div>
                  {item.badge ? (
                    <span className="bg-rose-100 text-rose-600 py-0.5 px-2 rounded-full text-xs font-bold shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-100/50 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-[0_0_15px_rgba(0,0,0,0.02)] mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Study Tip</p>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Reviewing notes within 24 hours of learning increases retention by 60%.
            </p>
          </div>
          
          {/* User Profile Section */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

