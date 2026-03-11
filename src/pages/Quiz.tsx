import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, PlayCircle } from 'lucide-react';
import { generateQuiz } from '../lib/gemini';
import { cn } from '../lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export default function Quiz() {
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const subject = useStore((state) => state.subjects.find((s) => s.id === subjectId));
  const topic = subject?.topics.find((t) => t.id === topicId);
  const addQuizResult = useStore((state) => state.addQuizResult);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!subject || !topic) return;

    const loadQuiz = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await generateQuiz(subject.name, topic.title);
        setQuestions(data.questions);
      } catch (err) {
        setError('Failed to generate quiz. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [subject, topic]);

  if (!subject || !topic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral-900">Topic not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === questions[currentQuestionIndex].correctAnswerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      addQuizResult(subject.id, topic.id, {
        score: score + (selectedOption === questions[currentQuestionIndex].correctAnswerIndex ? 1 : 0),
        total: questions.length,
        date: new Date().toISOString(),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Generating Quiz...</h2>
        <p className="text-neutral-500 mt-2">Creating questions based on your syllabus.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
        <p className="text-neutral-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-24 h-24 mx-auto bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-bold text-neutral-900 mb-2">Quiz Completed!</h2>
        <p className="text-xl text-neutral-600 mb-8">
          You scored <span className="font-bold text-indigo-600">{score}</span> out of{' '}
          <span className="font-bold">{questions.length}</span> ({percentage}%)
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/60 backdrop-blur-xl border border-white/60 text-neutral-700 rounded-xl font-bold hover:bg-white/80 transition-all shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          >
            Retake Quiz
          </button>
          <Link
            to={`/subjects/${subject.id}/topics/${topic.id}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
          >
            Back to Topic
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/subjects/${subject.id}/topics/${topic.id}`}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <h1 className="text-xl font-bold text-neutral-900 mt-1">{topic.title}</h1>
        </div>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/60 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentQuestion.correctAnswerIndex;
            const showCorrect = isAnswered && isCorrect;
            const showIncorrect = isAnswered && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                  !isAnswered && "border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50",
                  showCorrect && "border-emerald-500 bg-emerald-50",
                  showIncorrect && "border-red-500 bg-red-50",
                  isAnswered && !isSelected && !isCorrect && "border-neutral-100 opacity-50"
                )}
              >
                <span className={cn(
                  "font-medium",
                  showCorrect && "text-emerald-900",
                  showIncorrect && "text-red-900",
                  !isAnswered && "text-neutral-700"
                )}>
                  {option}
                </span>
                {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Explanation
            </h3>
            <p className="text-indigo-800 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
