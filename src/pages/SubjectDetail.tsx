import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore, TopicStatus } from '../store';
import { ArrowLeft, CheckCircle2, Circle, Clock, Trash2, ChevronRight, PlayCircle, Sparkles, Loader2, HelpCircle, ExternalLink, Plus, MessageSquare, Send, Network } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { generateLastMinuteRevision, generateSingleTopic, askQuestion, generateMindMap } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import Mermaid from '../components/Mermaid';

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const subject = useStore((state) => state.subjects.find((s) => s.id === subjectId));
  const updateTopicStatus = useStore((state) => state.updateTopicStatus);
  const deleteSubject = useStore((state) => state.deleteSubject);
  const setLastMinuteRevision = useStore((state) => state.setLastMinuteRevision);
  const addTopic = useStore((state) => state.addTopic);
  const addQnA = useStore((state) => state.addQnA);

  const [isGeneratingLMR, setIsGeneratingLMR] = useState(false);
  const [showLMR, setShowLMR] = useState(false);
  
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [topicError, setTopicError] = useState('');

  const [expandedTopicQnA, setExpandedTopicQnA] = useState<string | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [mindMapCode, setMindMapCode] = useState<string | null>(null);
  const [showMindMap, setShowMindMap] = useState(false);

  if (!subject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Subject not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteSubject(subject.id);
      navigate('/');
    }
  };

  const handleGenerateLMR = async () => {
    if (subject.lastMinuteRevision) {
      setShowLMR(true);
      return;
    }

    setIsGeneratingLMR(true);
    try {
      const topicTitles = subject.topics.map(t => t.title);
      const content = await generateLastMinuteRevision(subject.name, topicTitles);
      setLastMinuteRevision(subject.id, content);
      setShowLMR(true);
    } catch (error) {
      console.error(error);
      alert('Failed to generate last minute revision.');
    } finally {
      setIsGeneratingLMR(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (mindMapCode) {
      setShowMindMap(true);
      return;
    }
    setIsGeneratingMindMap(true);
    try {
      const code = await generateMindMap(
        subject.name,
        subject.topics.map((t) => t.title)
      );
      setMindMapCode(code);
      setShowMindMap(true);
    } catch (error) {
      console.error(error);
      alert('Failed to generate mind map');
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setIsGeneratingTopic(true);
    setTopicError('');
    try {
      const topicData = await generateSingleTopic(subject.name, newTopicTitle);
      addTopic(subject.id, {
        ...topicData,
        status: 'not_started',
      });
      setIsAddingTopic(false);
      setNewTopicTitle('');
    } catch (err) {
      setTopicError('Failed to generate topic details. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleAskQuestion = async (topicId: string, topicTitle: string) => {
    if (!questionInput.trim()) return;
    setIsAsking(true);
    try {
      const answer = await askQuestion(subject.name, topicTitle, questionInput);
      addQnA(subject.id, topicId, {
        id: crypto.randomUUID(),
        question: questionInput,
        answer,
        date: new Date().toISOString()
      });
      setQuestionInput('');
    } catch (error) {
      console.error(error);
      alert('Failed to get answer from AI');
    } finally {
      setIsAsking(false);
    }
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'study_later':
        return <Clock className="w-5 h-5 text-indigo-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const completed = subject.topics.filter((t) => t.status === 'completed').length;
  const total = subject.topics.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Aggregate resources
  const allImportantQuestions = subject.topics.flatMap(t => t.importantQuestions.map(q => ({ topicTitle: t.title, question: q })));
  const allRelatedConcepts = Array.from(new Set(subject.topics.flatMap(t => t.relatedConcepts)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/subjects"
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">{subject.name}</h1>
            <p className="text-slate-500 mt-1">Study Plan & Topics</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingTopic(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl font-semibold hover:bg-indigo-500/20 transition-all gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
          <button
            onClick={handleGenerateMindMap}
            disabled={isGeneratingMindMap || subject.topics.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-xl font-semibold hover:bg-emerald-500/20 transition-all gap-2 disabled:opacity-70"
          >
            {isGeneratingMindMap ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Network className="w-4 h-4" />
            )}
            Mind Map
          </button>
          <button
            onClick={handleGenerateLMR}
            disabled={isGeneratingLMR}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] gap-2 disabled:opacity-70"
          >
            {isGeneratingLMR ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Last Minute Revision
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete Subject"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mind Map Modal */}
      {showMindMap && mindMapCode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/60"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-xl flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold font-display text-slate-900">Subject Mind Map</h2>
              </div>
              <button
                onClick={() => setShowMindMap(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[400px] flex items-center justify-center">
              <Mermaid chart={mindMapCode} />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowMindMap(false)}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isAddingTopic && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/60"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900">Add New Topic</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Enter a topic title and AI will automatically generate the summary, important questions, and related concepts.
            </p>
            <form onSubmit={handleAddTopic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="e.g., Normalization in DBMS"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    disabled={isGeneratingTopic}
                  />
                </div>
                {topicError && <p className="text-rose-600 text-sm font-medium">{topicError}</p>}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingTopic(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                    disabled={isGeneratingTopic}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 disabled:opacity-50 min-w-[140px] transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                    disabled={isGeneratingTopic || !newTopicTitle.trim()}
                  >
                    {isGeneratingTopic ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Topic'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Last Minute Revision Modal */}
      {showLMR && subject.lastMinuteRevision && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl border border-white/60">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Last Minute Revision</h2>
                  <p className="text-sm text-slate-500">{subject.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLMR(false)}
                className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-slate max-w-none">
              <div className="markdown-body">
                <ReactMarkdown>{subject.lastMinuteRevision}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 font-display">Overall Progress</h2>
          <span className="text-2xl font-bold text-indigo-600 font-display">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-4 font-medium">
          {completed} out of {total} topics completed. Keep it up!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Topics List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 font-display">Topics to Cover</h2>
          </div>
          <div className="grid gap-4">
            {subject.topics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Status Toggle Area */}
                  <div className="p-4 sm:p-6 sm:w-16 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() =>
                        updateTopicStatus(
                          subject.id,
                          topic.id,
                          topic.status === 'completed' ? 'not_started' : 'completed'
                        )
                      }
                      className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      {getStatusIcon(topic.status)}
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Topic {index + 1}
                        </span>
                        {topic.reminderDate && (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Due {format(parseISO(topic.reminderDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">{topic.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{topic.summary}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setExpandedTopicQnA(expandedTopicQnA === topic.id ? null : topic.id)}
                        className={cn(
                          "inline-flex items-center justify-center px-4 py-2.5 border rounded-xl font-semibold transition-all gap-2",
                          expandedTopicQnA === topic.id 
                            ? "bg-purple-100 text-purple-700 border-purple-200 shadow-inner"
                            : "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:bg-purple-500/20"
                        )}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ask AI
                      </button>
                      <Link
                        to={`/subjects/${subject.id}/topics/${topic.id}/quiz`}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)] rounded-xl font-semibold hover:bg-indigo-500/20 transition-all gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Quiz
                      </Link>
                      <Link
                        to={`/subjects/${subject.id}/topics/${topic.id}`}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-[0_0_15px_rgba(15,23,42,0.4)] gap-2"
                      >
                        Study
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Q&A Section */}
                {expandedTopicQnA === topic.id && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <h4 className="text-sm font-bold text-slate-900">AI Tutor Q&A</h4>
                    </div>
                    
                    {/* Q&A History */}
                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
                      {topic.qna?.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                          <p className="font-semibold text-slate-900 text-sm mb-2">Q: {item.question}</p>
                          <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown>{item.answer}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      {(!topic.qna || topic.qna.length === 0) && (
                        <p className="text-sm text-slate-500 text-center py-4">No questions asked yet. Ask the AI tutor anything about this topic!</p>
                      )}
                    </div>

                    {/* Ask Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={questionInput}
                        onChange={(e) => setQuestionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isAsking) {
                            handleAskQuestion(topic.id, topic.title);
                          }
                        }}
                        placeholder={`Ask a question about ${topic.title}...`}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                        disabled={isAsking}
                      />
                      <button
                        onClick={() => handleAskQuestion(topic.id, topic.title)}
                        disabled={isAsking || !questionInput.trim()}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                      >
                        {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Subject Resources */}
        <div className="space-y-8">
          {/* All Important Questions */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Subject Questions</h2>
            </div>
            {allImportantQuestions.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {allImportantQuestions.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-slate-700 leading-relaxed text-sm font-medium">{item.question}</p>
                      <p className="text-xs text-slate-400 mt-1">From: {item.topicTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No questions available yet.</p>
            )}
          </section>

          {/* All Related Concepts */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 font-display">All Related Concepts</h2>
            {allRelatedConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allRelatedConcepts.map((concept, i) => (
                  <a
                    key={i}
                    href={`https://www.google.com/search?q=${encodeURIComponent(concept + ' ' + subject.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {concept}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No related concepts available yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

