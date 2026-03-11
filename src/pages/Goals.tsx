import { useState } from 'react';
import { useStore } from '../store';
import { Target, Plus, Clock, BookOpen, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore, parseISO, addDays, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Goals() {
  const goals = useStore((state) => state.goals || []);
  const addGoal = useStore((state) => state.addGoal);
  const updateGoalHours = useStore((state) => state.updateGoalHours);
  const deleteGoal = useStore((state) => state.deleteGoal);
  const subjects = useStore((state) => state.subjects);

  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'weekly' as 'weekly' | 'monthly',
    targetTopics: 5,
    targetHours: 10,
  });

  const [logHoursGoalId, setLogHoursGoalId] = useState<string | null>(null);
  const [hoursToLog, setHoursToLog] = useState(1);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (newGoal.type === 'weekly') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    addGoal({
      title: newGoal.title,
      type: newGoal.type,
      targetTopics: newGoal.targetTopics,
      targetHours: newGoal.targetHours,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    setIsAdding(false);
    setNewGoal({ title: '', type: 'weekly', targetTopics: 5, targetHours: 10 });
  };

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (logHoursGoalId && hoursToLog > 0) {
      updateGoalHours(logHoursGoalId, hoursToLog);
      setLogHoursGoalId(null);
      setHoursToLog(1);
    }
  };

  // Calculate completed topics within goal timeframe
  const getCompletedTopicsCount = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // For simplicity, we just count overall completed topics.
    // In a real app, we'd need to track WHEN a topic was completed.
    // Since we don't have completion dates on topics, we'll just show total completed topics.
    // To make it more realistic for the goal, we'll just use the total completed topics.
    return subjects.reduce(
      (acc, sub) => acc + sub.topics.filter((t) => t.status === 'completed').length,
      0
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Study Goals</h1>
          <p className="text-slate-500 mt-1">Set and track your weekly and monthly study targets.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900">Create Study Goal</h2>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Ace Midterms"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Timeframe</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as 'weekly' | 'monthly' })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={newGoal.targetHours}
                    onChange={(e) => setNewGoal({ ...newGoal, targetHours: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Topics to Complete</label>
                <input
                  type="number"
                  min="1"
                  value={newGoal.targetTopics}
                  onChange={(e) => setNewGoal({ ...newGoal, targetTopics: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                  disabled={!newGoal.title.trim()}
                >
                  Create Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {logHoursGoalId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-xl font-bold font-display text-slate-900 mb-4">Log Study Hours</h2>
            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hours Studied</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursToLog}
                  onChange={(e) => setHoursToLog(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLogHoursGoalId(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 border-dashed">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 font-display">No goals set</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Set weekly or monthly goals to stay motivated and track your study progress.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition-colors gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const completedTopics = getCompletedTopicsCount(goal.startDate, goal.endDate);
            const topicsProgress = Math.min(100, Math.round((completedTopics / goal.targetTopics) * 100));
            const hoursProgress = Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100));
            
            const isExpired = isBefore(parseISO(goal.endDate), new Date());
            const isCompleted = topicsProgress >= 100 && hoursProgress >= 100;

            return (
              <div key={goal.id} className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        goal.type === 'weekly' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        {goal.type}
                      </span>
                      {isExpired && !isCompleted && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-600">
                          Expired
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">{goal.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {format(parseISO(goal.startDate), 'MMM d')} - {format(parseISO(goal.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Topics Progress */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Topics Completed
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {completedTopics} <span className="text-slate-400 font-medium">/ {goal.targetTopics}</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          topicsProgress >= 100 ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"
                        )}
                        style={{ width: `${topicsProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Hours Progress */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Hours Studied
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {goal.currentHours} <span className="text-slate-400 font-medium">/ {goal.targetHours}h</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          hoursProgress >= 100 ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                        )}
                        style={{ width: `${hoursProgress}%` }}
                      />
                    </div>
                    
                    {!isExpired && (
                      <button
                        onClick={() => setLogHoursGoalId(goal.id)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Log Study Hours
                      </button>
                    )}
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
