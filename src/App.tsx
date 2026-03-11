/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useStore } from './store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import SubjectDetail from './pages/SubjectDetail';
import TopicDetail from './pages/TopicDetail';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Reminders from './pages/Reminders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chatbot from './pages/Chatbot';
import Landing from './pages/Landing';
import Goals from './pages/Goals';
import { StudyNotifier } from './components/StudyNotifier';

export default function App() {
  const { user, setUser, setStoreData, setHydratedFromFirebase, subjects, goals, isHydratedFromFirebase } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle Firebase Auth State Changes
  useEffect(() => {
    if (!auth) {
      setIsInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User', email: firebaseUser.email || '' });
        
        // Fetch user data from Firestore
        if (db) {
          try {
            const docRef = doc(db, 'user_data', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setStoreData({ subjects: data.subjects || [], goals: data.goals || [] });
            } else {
              setStoreData({ subjects: [], goals: [] });
            }
            setHydratedFromFirebase(true);
          } catch (error) {
            console.error('Error fetching user data from Firestore:', error);
            setHydratedFromFirebase(true); // Still set to true so we don't block the app, but it will use local state
          }
        }
      } else {
        setUser(null);
        setHydratedFromFirebase(false);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setStoreData, setHydratedFromFirebase]);

  // Sync state to Firestore when it changes
  useEffect(() => {
    if (!auth?.currentUser || !db || !isHydratedFromFirebase) return;

    const syncToFirestore = async () => {
      try {
        const docRef = doc(db, 'user_data', auth.currentUser!.uid);
        await setDoc(docRef, { subjects, goals }, { merge: true });
      } catch (error) {
        console.error('Error syncing to Firestore:', error);
      }
    };

    // Debounce the sync to avoid too many writes
    const timeoutId = setTimeout(syncToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [subjects, goals, isHydratedFromFirebase]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <StudyNotifier />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:subjectId" element={<SubjectDetail />} />
          <Route path="subjects/:subjectId/topics/:topicId" element={<TopicDetail />} />
          <Route path="subjects/:subjectId/topics/:topicId/quiz" element={<Quiz />} />
          <Route path="subjects/:subjectId/topics/:topicId/flashcards" element={<Flashcards />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="goals" element={<Goals />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

