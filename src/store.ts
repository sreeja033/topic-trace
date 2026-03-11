import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'study_later';

export interface QuizResult {
  score: number;
  total: number;
  date: string;
}

export interface QnA {
  id: string;
  question: string;
  answer: string;
  date: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  importantQuestions: string[];
  relatedConcepts: string[];
  status: TopicStatus;
  reminderDate?: string;
  deadline?: string;
  lastNotifiedAt?: string;
  quizResults?: QuizResult[];
  qna?: QnA[];
  flashcards?: Flashcard[];
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
  createdAt: string;
  lastMinuteRevision?: string;
  qna?: QnA[];
}

export interface User {
  name: string;
  email: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  type: 'weekly' | 'monthly';
  targetTopics: number;
  targetHours: number;
  currentHours: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface AppState {
  user: User | null;
  subjects: Subject[];
  goals: StudyGoal[];
  isHydratedFromFirebase: boolean;
  setUser: (user: User | null) => void;
  setStoreData: (data: { subjects: Subject[], goals: StudyGoal[] }) => void;
  setHydratedFromFirebase: (status: boolean) => void;
  addSubject: (subject: Omit<Subject, 'createdAt'>) => void;
  updateTopicStatus: (subjectId: string, topicId: string, status: TopicStatus) => void;
  setTopicReminder: (subjectId: string, topicId: string, date: string | undefined) => void;
  setTopicDeadline: (subjectId: string, topicId: string, date: string | undefined) => void;
  setTopicLastNotified: (subjectId: string, topicId: string, date: string) => void;
  setTopicFlashcards: (subjectId: string, topicId: string, flashcards: Flashcard[]) => void;
  addQuizResult: (subjectId: string, topicId: string, result: QuizResult) => void;
  addQnA: (subjectId: string, topicId: string, qna: QnA) => void;
  clearQnA: (subjectId: string, topicId: string) => void;
  addSubjectQnA: (subjectId: string, qna: QnA) => void;
  clearSubjectQnA: (subjectId: string) => void;
  setLastMinuteRevision: (subjectId: string, content: string) => void;
  deleteSubject: (subjectId: string) => void;
  addTopic: (subjectId: string, topic: Topic) => void;
  addGoal: (goal: Omit<StudyGoal, 'id' | 'createdAt' | 'currentHours'>) => void;
  updateGoalHours: (goalId: string, hours: number) => void;
  deleteGoal: (goalId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      subjects: [],
      goals: [],
      isHydratedFromFirebase: false,
      setUser: (user) => set({ user }),
      setStoreData: (data) => set({ subjects: data.subjects || [], goals: data.goals || [] }),
      setHydratedFromFirebase: (status) => set({ isHydratedFromFirebase: status }),
      addSubject: (subject) =>
        set((state) => ({
          subjects: [...state.subjects, { ...subject, createdAt: new Date().toISOString() }],
        })),
      updateTopicStatus: (subjectId, topicId, status) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) => (t.id === topicId ? { ...t, status } : t)),
                }
              : sub
          ),
        })),
      setTopicReminder: (subjectId, topicId, date) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) => (t.id === topicId ? { ...t, reminderDate: date } : t)),
                }
              : sub
          ),
        })),
      setTopicDeadline: (subjectId, topicId, date) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) => (t.id === topicId ? { ...t, deadline: date } : t)),
                }
              : sub
          ),
        })),
      setTopicLastNotified: (subjectId, topicId, date) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) => (t.id === topicId ? { ...t, lastNotifiedAt: date } : t)),
                }
              : sub
          ),
        })),
      setTopicFlashcards: (subjectId, topicId, flashcards) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) => (t.id === topicId ? { ...t, flashcards } : t)),
                }
              : sub
          ),
        })),
      addQuizResult: (subjectId, topicId, result) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) =>
                    t.id === topicId
                      ? { ...t, quizResults: [...(t.quizResults || []), result] }
                      : t
                  ),
                }
              : sub
          ),
        })),
      addQnA: (subjectId, topicId, qna) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) =>
                    t.id === topicId
                      ? { ...t, qna: [...(t.qna || []), qna] }
                      : t
                  ),
                }
              : sub
          ),
        })),
      clearQnA: (subjectId, topicId) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? {
                  ...sub,
                  topics: sub.topics.map((t) =>
                    t.id === topicId
                      ? { ...t, qna: [] }
                      : t
                  ),
                }
              : sub
          ),
        })),
      addSubjectQnA: (subjectId, qna) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, qna: [...(sub.qna || []), qna] }
              : sub
          ),
        })),
      clearSubjectQnA: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, qna: [] }
              : sub
          ),
        })),
      setLastMinuteRevision: (subjectId, content) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId ? { ...sub, lastMinuteRevision: content } : sub
          ),
        })),
      deleteSubject: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.filter((sub) => sub.id !== subjectId),
        })),
      addTopic: (subjectId, topic) =>
        set((state) => ({
          subjects: state.subjects.map((sub) =>
            sub.id === subjectId
              ? { ...sub, topics: [...sub.topics, topic] }
              : sub
          ),
        })),
      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...goal,
              id: crypto.randomUUID(),
              currentHours: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateGoalHours: (goalId, hours) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, currentHours: g.currentHours + hours } : g
          ),
        })),
      deleteGoal: (goalId) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== goalId),
        })),
    }),
    {
      name: 'topic-trace-storage',
    }
  )
);


