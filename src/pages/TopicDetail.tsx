import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore, TopicStatus } from '../store';
import { ArrowLeft, CheckCircle2, Clock, Calendar, ExternalLink, HelpCircle, FileText, PlayCircle, MessageSquare, Sparkles, Globe, Loader2, CalendarPlus, Layers, Paperclip, Send, Volume2, Wand2, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { searchTopicUpdates, askQuestion, generateExplanationFromFile, generateAudio, generateAnalogy, roastAnswer } from '../lib/gemini';

export default function TopicDetail() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const subject = useStore((state) => state.subjects.find((s) => s.id === subjectId));
  const topic = subject?.topics.find((t) => t.id === topicId);
  const updateTopicStatus = useStore((state) => state.updateTopicStatus);
  const setTopicReminder = useStore((state) => state.setTopicReminder);
  const setTopicDeadline = useStore((state) => state.setTopicDeadline);
  const addQnA = useStore((state) => state.addQnA);

  const [reminderDate, setReminderDate] = useState(topic?.reminderDate || '');
  const [deadlineDate, setDeadlineDate] = useState(topic?.deadline || '');
  const [latestUpdates, setLatestUpdates] = useState<string | null>(null);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<{ pause: () => void, play: () => void } | null>(null);

  const [analogy, setAnalogy] = useState<string | null>(null);
  const [isLoadingAnalogy, setIsLoadingAnalogy] = useState(false);

  const [isRoastMode, setIsRoastMode] = useState(false);
  const [filePodcastText, setFilePodcastText] = useState<string | null>(null);

  if (!subject || !topic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Topic not found</h2>
        <Link to={`/subjects/${subjectId}`} className="text-indigo-600 hover:underline mt-4 inline-block">
          Return to Subject
        </Link>
      </div>
    );
  }

  const handleStatusChange = (status: TopicStatus) => {
    updateTopicStatus(subject.id, topic.id, status);
  };

  const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setReminderDate(date);
    setTopicReminder(subject.id, topic.id, date || undefined);
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setDeadlineDate(date);
    setTopicDeadline(subject.id, topic.id, date || undefined);
  };

  const handleAddToCalendar = () => {
    if (!reminderDate) return;
    
    const date = new Date(reminderDate);
    // Format date for ICS (YYYYMMDDTHHMMSSZ)
    const formattedDate = format(date, "yyyyMMdd'T'HHmmss'Z'");
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formattedDate}
DTEND:${formattedDate}
SUMMARY:Study Reminder: ${topic.title}
DESCRIPTION:Reminder to study ${topic.title} for ${subject.name}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `study_reminder_${topic.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchLatestUpdates = async () => {
    setIsLoadingUpdates(true);
    try {
      const updates = await searchTopicUpdates(subject.name, topic.title);
      setLatestUpdates(updates);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      setLatestUpdates('Failed to load latest updates. Please try again later.');
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionInput.trim() || !subject || !topic) return;
    setIsAsking(true);
    try {
      let answer = '';
      if (isRoastMode) {
        answer = await roastAnswer(subject.name, topic.title, questionInput);
      } else {
        answer = await askQuestion(subject.name, topic.title, questionInput);
      }
      addQnA(subject.id, topic.id, {
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

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const audioData = await generateAudio(filePodcastText || topic.summary);
      if (audioData) {
        if (audioData.mimeType?.includes('wav') || audioData.mimeType?.includes('mp3')) {
          const audio = new Audio(`data:${audioData.mimeType};base64,${audioData.data}`);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          audio.play();
          setIsPlaying(true);
        } else {
          // Fallback for raw PCM or unknown
          const binaryString = window.atob(audioData.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          try {
            const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
            setIsPlaying(true);
            audioRef.current = {
              play: () => {}, // Not supported for BufferSource
              pause: () => { source.stop(); setIsPlaying(false); audioRef.current = null; }
            };
          } catch (e) {
            // If decodeAudioData fails, assume raw 16-bit PCM
            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              float32Array[i] = int16Array[i] / 32768.0;
            }
            const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
            setIsPlaying(true);
            audioRef.current = {
              play: () => {},
              pause: () => { source.stop(); setIsPlaying(false); audioRef.current = null; }
            };
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate audio", error);
      alert("Failed to generate audio.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleGenerateAnalogy = async () => {
    setIsLoadingAnalogy(true);
    try {
      const result = await generateAnalogy(subject.name, topic.title);
      setAnalogy(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate analogy.");
    } finally {
      setIsLoadingAnalogy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subject || !topic) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        try {
          const answer = await generateExplanationFromFile(subject.name, topic.title, base64String, mimeType);
          addQnA(subject.id, topic.id, {
            id: crypto.randomUUID(),
            question: `Generated simple explanation from file: ${file.name}`,
            answer,
            date: new Date().toISOString()
          });
          setFilePodcastText(answer);
        } catch (err) {
          console.error(err);
          alert('Failed to analyze file.');
        } finally {
          setIsUploading(false);
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/subjects/${subject.id}`}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">{topic.title}</h1>
            <p className="text-slate-500 mt-1">{subject.name}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Status:</span>
          <select
            value={topic.status}
            onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-bold outline-none border-none cursor-pointer",
              topic.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
              topic.status === 'in_progress' ? "bg-amber-100 text-amber-700" :
              topic.status === 'study_later' ? "bg-indigo-100 text-indigo-700" :
              "bg-slate-100 text-slate-700"
            )}
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="study_later">Study Later</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2" title="Set Start Time">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Start</span>
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={handleReminderChange}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {reminderDate && (
              <button
                onClick={handleAddToCalendar}
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add to Calendar"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2" title="Set End Time">
            <span className="text-xs font-medium text-rose-500 uppercase tracking-wider">End</span>
            <Clock className="w-4 h-4 text-rose-500" />
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={handleDeadlineChange}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-rose-500 text-rose-600 font-medium"
            />
          </div>

          <Link
            to={`/subjects/${subject.id}/topics/${topic.id}/flashcards`}
            className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-500 transition-all gap-2 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
          >
            <Layers className="w-4 h-4" />
            Flashcards
          </Link>
          <Link
            to={`/subjects/${subject.id}/topics/${topic.id}/quiz`}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
          >
            <PlayCircle className="w-4 h-4" />
            Take Quiz
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notes Section */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Revision Notes</h2>
              </div>
              <button
                onClick={handlePlayAudio}
                disabled={isLoadingAudio}
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition-colors gap-2"
              >
                {isLoadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                {isPlaying ? 'Pause Audio' : (filePodcastText ? 'Play File Audio' : 'Play Audio')}
              </button>
            </div>
            <div className="prose prose-slate max-w-none mb-6">
              <div className="markdown-body">
                <ReactMarkdown>{topic.summary}</ReactMarkdown>
              </div>
            </div>
            
            {!analogy ? (
              <button
                onClick={handleGenerateAnalogy}
                disabled={isLoadingAnalogy}
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] rounded-xl font-semibold hover:bg-amber-500/20 transition-all gap-2"
              >
                {isLoadingAnalogy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Explain with an Analogy
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-amber-900">Analogy</h3>
                </div>
                <div className="prose prose-sm prose-amber max-w-none">
                  <div className="markdown-body text-sm">
                    <ReactMarkdown>{analogy}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* AI Tutor Q&A Section */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display">AI Tutor Q&A</h2>
              </div>
              <Link
                to={`/chat?subjectId=${subject.id}&topicId=${topic.id}`}
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                Open Full Chat <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Q&A History */}
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
              {topic.qna?.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p className="font-bold text-slate-900 mb-3 flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 text-sm">Q</span>
                    <span className="pt-0.5">{item.question}</span>
                  </p>
                  <div className="prose prose-slate max-w-none pl-8 border-l-2 border-purple-100">
                    <div className="markdown-body text-sm">
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {(!topic.qna || topic.qna.length === 0) && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-8 h-8 text-purple-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No questions asked yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Ask a question or upload a document to generate a simple explanation.</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setIsRoastMode(!isRoastMode)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    isRoastMode 
                      ? "bg-rose-100 text-rose-700 border border-rose-200" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Roast My Answer
                </button>
              </div>
              <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="cursor-pointer p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative flex items-center gap-2" title="Upload document or image">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,image/*,.txt,.ppt,.pptx"
                    onChange={handleFileUpload}
                    disabled={isUploading || isAsking}
                  />
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <Paperclip className="w-5 h-5" />}
                  <span className="text-xs font-semibold hidden sm:inline-block">Upload File</span>
                </label>
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAsking && !isUploading) {
                      handleAskQuestion();
                    }
                  }}
                  placeholder={isRoastMode ? "Paste your answer here to get roasted..." : "Ask a question about this topic..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm px-2"
                  disabled={isAsking || isUploading}
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || isUploading || !questionInput.trim()}
                  className={cn(
                    "p-2 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm",
                    isRoastMode ? "bg-rose-600 hover:bg-rose-500" : "bg-purple-600 hover:bg-purple-500"
                  )}
                >
                  {isAsking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Latest Updates (Search Grounding) */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Latest Updates</h2>
            </div>
            
            {!latestUpdates && !isLoadingUpdates ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-4">Get the most recent news and advancements related to this topic from the web.</p>
                <button
                  onClick={fetchLatestUpdates}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] rounded-xl font-semibold hover:bg-blue-500/20 transition-all gap-2 w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  Search Web
                </button>
              </div>
            ) : isLoadingUpdates ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Searching the web...</p>
              </div>
            ) : (
              <div className="prose prose-sm prose-slate max-w-none">
                <div className="markdown-body text-sm">
                  <ReactMarkdown>{latestUpdates || ''}</ReactMarkdown>
                </div>
              </div>
            )}
          </section>

          {/* Important Questions */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Important Questions</h2>
            </div>
            <ul className="space-y-4">
              {topic.importantQuestions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 leading-relaxed text-sm">{q}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Related Concepts */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 font-display">Related Concepts</h2>
            <div className="flex flex-wrap gap-2">
              {topic.relatedConcepts.map((concept, i) => (
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
          </section>

          {/* Quiz History */}
          <section className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 font-display">Quiz History</h2>
            {!topic.quizResults || topic.quizResults.length === 0 ? (
              <p className="text-sm text-slate-500">No quizzes taken yet.</p>
            ) : (
              <div className="space-y-3">
                {topic.quizResults.map((result, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/60 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Score: {result.score}/{result.total}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(result.date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold",
                      result.score === result.total ? "bg-emerald-100 text-emerald-700" :
                      result.score >= result.total / 2 ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {Math.round((result.score / result.total) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

