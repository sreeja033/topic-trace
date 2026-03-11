import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';

export default function Subjects() {
  const subjects = useStore((state) => state.subjects);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">All Subjects</h1>
          <p className="text-neutral-500 mt-1">Manage your study plans and progress.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-all gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => {
          const completed = subject.topics.filter((t) => t.status === 'completed').length;
          const total = subject.topics.length;
          const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

          return (
            <Link
              key={subject.id}
              to={`/subjects/${subject.id}`}
              className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all group hover:border-indigo-300"
            >
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2 line-clamp-2">
                {subject.name}
              </h3>
              <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                <span>{total} Topics</span>
                <span>{completed} Completed</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Link>
          );
        })}
        {subjects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 border-dashed">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No subjects yet</h3>
            <p className="text-neutral-500 mt-1">Go to the dashboard to add your first subject.</p>
          </div>
        )}
      </div>
    </div>
  );
}
