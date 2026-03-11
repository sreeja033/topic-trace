import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Bell, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';

export default function Reminders() {
  const subjects = useStore((state) => state.subjects);

  const allReminders = subjects.flatMap((sub) =>
    sub.topics
      .filter((t) => t.reminderDate || t.status === 'study_later')
      .map((t) => ({ ...t, subjectId: sub.id, subjectName: sub.name }))
  );

  const pendingReminders = allReminders.filter(
    (r) => r.status !== 'completed' && (r.status === 'study_later' || (r.reminderDate && isBefore(parseISO(r.reminderDate), new Date())))
  );

  const upcomingReminders = allReminders.filter(
    (r) => r.status !== 'completed' && r.status !== 'study_later' && r.reminderDate && !isBefore(parseISO(r.reminderDate), new Date())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Reminders</h1>
          <p className="text-neutral-500 mt-1">Keep track of your study schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Reminders */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Action Needed
          </h2>
          {pendingReminders.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No pending reminders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  to={`/subjects/${reminder.subjectId}/topics/${reminder.id}`}
                  className="block bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">{reminder.title}</h3>
                      <p className="text-sm text-neutral-500">{reminder.subjectName}</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                      {reminder.status === 'study_later' ? 'Study Later' : 'Overdue'}
                    </span>
                  </div>
                  {reminder.reminderDate && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium">
                      <Clock className="w-4 h-4" />
                      Due {format(parseISO(reminder.reminderDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Upcoming
          </h2>
          {upcomingReminders.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm text-center">
              <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No upcoming reminders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  to={`/subjects/${reminder.subjectId}/topics/${reminder.id}`}
                  className="block bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">{reminder.title}</h3>
                      <p className="text-sm text-neutral-500">{reminder.subjectName}</p>
                    </div>
                  </div>
                  {reminder.reminderDate && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                      <Clock className="w-4 h-4" />
                      Due {format(parseISO(reminder.reminderDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
