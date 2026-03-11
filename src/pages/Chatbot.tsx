import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Loader2, Sparkles, Globe, Trash2, Lightbulb } from 'lucide-react';
import { askQuestionStream } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function Chatbot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjects = useStore((state) => state.subjects);
  const addQnA = useStore((state) => state.addQnA);
  const clearQnA = useStore((state) => state.clearQnA);
  const addSubjectQnA = useStore((state) => state.addSubjectQnA);
  const clearSubjectQnA = useStore((state) => state.clearSubjectQnA);

  const initialSubjectId = searchParams.get('subjectId') || '';
  const initialTopicId = searchParams.get('topicId') || '';

  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(initialTopicId ? [initialTopicId] : []);

  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState('');
  const [streamedQuestion, setStreamedQuestion] = useState('');
  const qnaEndRef = useRef<HTMLDivElement>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  
  // Get the active QnA list based on selection
  const isSingleTopic = selectedTopicIds.length === 1;
  const activeTopic = isSingleTopic ? selectedSubject?.topics.find(t => t.id === selectedTopicIds[0]) : null;
  const activeQnA = isSingleTopic ? activeTopic?.qna : selectedSubject?.qna;

  // Update URL params when selection changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSubjectId) params.set('subjectId', selectedSubjectId);
    if (selectedTopicIds.length === 1) params.set('topicId', selectedTopicIds[0]);
    setSearchParams(params);
  }, [selectedSubjectId, selectedTopicIds, setSearchParams]);

  // Reset topics when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubject) {
      // Keep valid selected topics
      const validTopicIds = selectedTopicIds.filter(id => selectedSubject.topics.some(t => t.id === id));
      if (validTopicIds.length !== selectedTopicIds.length) {
        setSelectedTopicIds(validTopicIds);
      }
    }
  }, [selectedSubjectId, selectedSubject]);

  const scrollToBottom = () => {
    qnaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeQnA, isAsking, streamedAnswer]);

  const handleAskQuestion = async (e?: React.FormEvent, predefinedQuestion?: string) => {
    if (e) e.preventDefault();
    const currentQuestion = predefinedQuestion || question;
    if (!currentQuestion.trim() || !selectedSubject || selectedTopicIds.length === 0) return;

    setQuestion('');
    setIsAsking(true);
    setStreamedQuestion(currentQuestion);
    setStreamedAnswer('');

    try {
      const topicTitles = selectedTopicIds.length === selectedSubject.topics.length 
        ? 'All Topics (Whole Subject)' 
        : selectedTopicIds.map(id => selectedSubject.topics.find(t => t.id === id)?.title).join(', ');

      // Build student context
      const completedTopics = selectedSubject.topics.filter(t => t.status === 'completed').map(t => t.title);
      let studentContext = '';
      if (completedTopics.length > 0) {
        studentContext += `The student has already completed the following topics: ${completedTopics.join(', ')}. `;
      }
      
      const recentQuizScores = selectedSubject.topics
        .flatMap(t => t.quizResults?.map(qr => ({ topic: t.title, score: qr.score, total: qr.total })) || [])
        .slice(-3); // Get last 3 quiz scores
        
      if (recentQuizScores.length > 0) {
        studentContext += `Recent quiz performance: ${recentQuizScores.map(q => `${q.score}/${q.total} on ${q.topic}`).join(', ')}. `;
      }

      const stream = await askQuestionStream(selectedSubject.name, topicTitles, currentQuestion, useSearch, studentContext);
      let fullAnswer = '';
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullAnswer += text;
          setStreamedAnswer(fullAnswer);
        }
      }
      
      const newQnA = {
        id: crypto.randomUUID(),
        question: currentQuestion,
        answer: fullAnswer,
        date: new Date().toISOString(),
      };

      if (isSingleTopic && activeTopic) {
        addQnA(selectedSubject.id, activeTopic.id, newQnA);
      } else {
        addSubjectQnA(selectedSubject.id, newQnA);
      }
    } catch (error) {
      console.error('Failed to ask question:', error);
      setStreamedAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsAsking(false);
      setStreamedQuestion('');
      setStreamedAnswer('');
    }
  };

  const handleClearChat = () => {
    if (selectedSubject && selectedTopicIds.length > 0 && window.confirm('Are you sure you want to clear the chat history for this context?')) {
      if (isSingleTopic && activeTopic) {
        clearQnA(selectedSubject.id, activeTopic.id);
      } else {
        clearSubjectQnA(selectedSubject.id);
      }
    }
  };

  const suggestedQuestions = selectedTopicIds.length > 0 ? [
    `Can you explain the main concepts of the selected topics?`,
    `What are the most important formulas or definitions to remember?`,
    `Can you give me a real-world example combining these topics?`
  ] : [];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar for Context Selection */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">AI Tutor</h2>
          </div>
          
          <p className="text-sm text-slate-500 mb-6">
            Select a subject and topic to give the AI context for your questions.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
              >
                <option value="">Select a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Topics Context
                </label>
                {selectedSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTopicIds.length === selectedSubject.topics.length) {
                        setSelectedTopicIds([]);
                      } else {
                        setSelectedTopicIds(selectedSubject.topics.map(t => t.id));
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {selectedTopicIds.length === selectedSubject.topics.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {!selectedSubject ? (
                  <p className="text-sm text-slate-500 italic">Select a subject first</p>
                ) : (
                  selectedSubject.topics.map((t) => (
                    <label key={t.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTopicIds([...selectedTopicIds, t.id]);
                          } else {
                            setSelectedTopicIds(selectedTopicIds.filter(id => id !== t.id));
                          }
                        }}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700 font-medium leading-tight">{t.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={useSearch}
                  onChange={(e) => setUseSearch(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Use Web Search</span>
                </div>
              </label>
              <p className="text-xs text-slate-500 mt-2 px-1">
                Enable this to get the most up-to-date information from the web.
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-indigo-500/10 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] mt-auto hidden lg:block">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
              I'm your personal AI tutor. I can explain complex concepts, provide examples, and help you prepare for exams based on your selected topic.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        {!selectedSubject || selectedTopicIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display mb-2">Ready to help</h3>
            <p className="text-slate-500 max-w-sm">
              Please select a subject and at least one topic from the sidebar to start asking questions.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedTopicIds.length === selectedSubject.topics.length 
                    ? 'All Topics (Whole Subject)' 
                    : isSingleTopic && activeTopic
                      ? activeTopic.title
                      : `${selectedTopicIds.length} Topics Selected`}
                </h3>
                <p className="text-xs font-medium text-slate-500">{selectedSubject.name}</p>
              </div>
              {activeQnA && activeQnA.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(!activeQnA || activeQnA.length === 0) && !isAsking && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bot className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium mb-8">No questions asked yet. Start the conversation!</p>
                  
                  <div className="w-full max-w-md space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4 flex items-center justify-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Suggested Questions
                    </p>
                    {suggestedQuestions.map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => handleAskQuestion(undefined, sq)}
                        className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeQnA?.map((item) => (
                <div key={item.id} className="space-y-6">
                  {/* User Question */}
                  <div className="flex items-start gap-4 justify-end">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[85%] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <p className="text-sm leading-relaxed">{item.question}</p>
                    </div>
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  {/* AI Answer */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%]">
                      <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50">
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Streaming Message */}
              {isAsking && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 justify-end">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[85%] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <p className="text-sm leading-relaxed">{streamedQuestion}</p>
                    </div>
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] min-w-[100px]">
                      {streamedAnswer ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50">
                          <ReactMarkdown>{streamedAnswer}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                          <span className="text-sm text-slate-500 font-medium">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div ref={qnaEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/40 bg-white/40 backdrop-blur-md">
              <form onSubmit={handleAskQuestion} className="relative flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this topic..."
                  className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  disabled={isAsking}
                />
                <button
                  type="submit"
                  disabled={isAsking || !question.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
