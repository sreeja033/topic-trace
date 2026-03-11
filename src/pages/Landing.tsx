import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, BrainCircuit, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      name: 'Smart Syllabus Parsing',
      description: 'Instantly generate structured study plans from just a subject name using advanced AI.',
      icon: BookOpen,
    },
    {
      name: 'AI Tutor & Chatbot',
      description: 'Get instant answers, explanations, and context-aware help for any topic you are studying.',
      icon: BrainCircuit,
    },
    {
      name: 'Automated Reminders',
      description: 'Never miss a revision session. Set reminders and track your "Study Later" topics easily.',
      icon: Bell,
    },
    {
      name: 'Last Minute Revision',
      description: 'Generate concise, high-yield cheat sheets for quick review right before your exams.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">
      {/* Global Background Decoration - Atmospheric */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-300/40 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-300/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-300/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-300/30 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-display">Topic Trace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-[0_0_15px_rgba(15,23,42,0.4)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50"></div>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold text-slate-900 tracking-tight font-display max-w-4xl mx-auto leading-[1.1]"
          >
            Organize your study journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Topic Trace</span>.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Topic Trace organizes your syllabus, tracks your progress, and provides an intelligent AI tutor to help you understand complex concepts faster.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl text-lg font-bold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
            >
              Start Learning for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/60 backdrop-blur-xl text-slate-700 border border-white/60 rounded-2xl text-lg font-bold hover:bg-white/80 transition-all shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-slate-50/50 backdrop-blur-sm border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-display mb-4">Everything you need to ace your exams</h2>
            <p className="text-lg text-slate-600">Stop worrying about what to study and focus on actually learning. We've got the organization covered.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 hover:border-indigo-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-500/20 mb-6 text-indigo-500">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-3">{feature.name}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof / Footer CTA */}
      <div className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold font-display mb-6">Ready to transform your study habits?</h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">Join thousands of students who are already using Topic Trace to organize their syllabus and learn smarter with AI.</p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-2xl text-lg font-bold hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
          >
            Create Your Free Account
          </Link>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Setup in 60 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
