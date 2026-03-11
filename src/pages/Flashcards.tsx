import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { generateFlashcards } from '../lib/gemini';
import { ArrowLeft, Loader2, RefreshCw, ChevronRight, ChevronLeft, Layers, Sparkles, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Flashcards() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const subject = useStore((state) => state.subjects.find((s) => s.id === subjectId));
  const topic = subject?.topics.find((t) => t.id === topicId);
  const setTopicFlashcards = useStore((state) => state.setTopicFlashcards);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!subject || !topic) {
      navigate('/');
    }
  }, [subject, topic, navigate]);

  const handleGenerateFlashcards = async () => {
    if (!subject || !topic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateFlashcards(subject.name, topic.title);
      setTopicFlashcards(subject.id, topic.id, data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
      setError('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!subject || !topic) return null;

  const flashcards = topic.flashcards || [];
  const hasFlashcards = flashcards.length > 0;

  const [displayOrder, setDisplayOrder] = useState<number[]>([]);

  useEffect(() => {
    if (flashcards.length > 0 && displayOrder.length !== flashcards.length) {
      setDisplayOrder(flashcards.map((_, i) => i));
    }
  }, [flashcards.length]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const newOrder = [...displayOrder];
      for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      }
      setDisplayOrder(newOrder);
      setCurrentIndex(0);
    }, 150);
  };

  const currentFlashcard = hasFlashcards && displayOrder.length > 0 
    ? flashcards[displayOrder[currentIndex]] 
    : flashcards[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/subjects/${subject.id}/topics/${topic.id}`}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Flashcards</h1>
            <p className="text-slate-500 mt-1">{topic.title}</p>
          </div>
        </div>
        {hasFlashcards && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleShuffle}
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all gap-2 shadow-sm"
              title="Shuffle Flashcards"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>
        )}
      </div>

      {!hasFlashcards ? (
        <div className="bg-white/60 backdrop-blur-xl p-12 rounded-3xl border border-white/60 shadow-sm text-center">
          <div className="w-20 h-20 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
            <Layers className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display mb-4">Generate Flashcards</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Create AI-powered flashcards to quickly review key terms, definitions, and concepts for this topic.
          </p>
          {error && <p className="text-rose-600 mb-6 font-medium">{error}</p>}
          <button
            onClick={handleGenerateFlashcards}
            disabled={isGenerating}
            className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Progress Bar */}
          <div className="w-full max-w-2xl mb-8">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-full aspect-[3/2] max-w-2xl perspective-1000">
            <motion.div
              className="w-full h-full relative preserve-3d cursor-pointer"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                <span className="absolute top-6 left-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Term</span>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 font-display leading-tight">
                  {currentFlashcard?.front}
                </h3>
                <p className="absolute bottom-6 text-sm text-slate-400 font-medium">Click to flip</p>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                <span className="absolute top-6 left-6 text-sm font-bold text-purple-200 uppercase tracking-wider">Definition</span>
                <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                  {currentFlashcard?.back}
                </p>
                <p className="absolute bottom-6 text-sm text-purple-200 font-medium">Click to flip</p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-8 mt-10">
            <button
              onClick={handlePrev}
              className="p-4 bg-white text-slate-700 rounded-full shadow-md hover:bg-slate-50 transition-all hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="p-4 bg-white text-slate-700 rounded-full shadow-md hover:bg-slate-50 transition-all hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
