import { useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { generateSubjectSyllabus } from '../lib/gemini';
import { format, isBefore, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const subjects = useStore((state) => state.subjects);
  const addSubject = useStore((state) => state.addSubject);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const commonSubjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Artificial Intelligence',
    'Machine Learning',
    'Compiler Design',
    'Theory of Computation',
    'Computer Organization and Architecture',
    'Other (Custom)'
  ];

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectToGenerate = selectedPreset === 'Other (Custom)' ? newSubjectName : selectedPreset;
    
    if (!subjectToGenerate.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await generateSubjectSyllabus(subjectToGenerate);
      addSubject({
        id: crypto.randomUUID(),
        name: subjectToGenerate,
        topics: data.topics.map((t) => ({
          ...t,
          status: 'not_started',
        })),
      });
      setIsAdding(false);
      setNewSubjectName('');
      setSelectedPreset('');
    } catch (err) {
      setError('Failed to generate syllabus. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalTopics = subjects.reduce((acc, sub) => acc + sub.topics.length, 0);
  const completedTopics = subjects.reduce(
    (acc, sub) => acc + sub.topics.filter((t) => t.status === 'completed').length,
    0
  );
  const progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const pendingReminders = subjects.flatMap((sub) =>
    sub.topics
      .filter(
        (t) =>
          t.status !== 'completed' &&
          (t.status === 'study_later' || (t.reminderDate && isBefore(parseISO(t.reminderDate), new Date())))
      )
      .map((t) => ({ ...t, subjectId: sub.id, subjectName: sub.name }))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      {/* Add Subject Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900">Add New Subject</h2>
            </div>
            <form onSubmit={handleAddSubject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Select Subject
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-4"
                    disabled={isLoading}
                  >
                    <option value="" disabled>Select a common subject...</option>
                    {commonSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                
                {selectedPreset === 'Other (Custom)' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Custom Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g., Quantum Computing"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      disabled={isLoading}
                    />
                  </motion.div>
                )}
                
                {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 disabled:opacity-50 min-w-[140px] transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                    disabled={isLoading || !selectedPreset || (selectedPreset === 'Other (Custom)' && !newSubjectName.trim())}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Plan'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Subjects</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{subjects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500">Overall Progress</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-slate-900 font-display">{progress}%</p>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending Reminders</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{pendingReminders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subjects List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 font-display">Your Subjects</h2>
          {subjects.length === 0 ? (
            <div className="text-center py-12 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 border-dashed">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 font-display">No subjects yet</h3>
              <p className="text-slate-500 mt-1">Add a subject to generate a study plan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => {
                const completed = subject.topics.filter((t) => t.status === 'completed').length;
                const total = subject.topics.length;
                const subProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

                return (
                  <Link
                    key={subject.id}
                    to={`/subjects/${subject.id}`}
                    className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all group hover:border-indigo-300"
                  >
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 font-display">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {completed} of {total} topics completed
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] rounded-full transition-all duration-500"
                          style={{ width: `${subProgress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{subProgress}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reminders Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 font-display">Action Needed</h2>
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            {pendingReminders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReminders.map((reminder) => (
                  <Link
                    key={reminder.id}
                    to={`/subjects/${reminder.subjectId}/topics/${reminder.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {reminder.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{reminder.subjectName}</p>
                        <p className="text-xs font-bold text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-0.5 rounded-md">
                          {reminder.status === 'study_later' ? 'Study Later' : `Due ${format(parseISO(reminder.reminderDate!), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

