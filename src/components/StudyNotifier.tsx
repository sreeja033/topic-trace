import { useEffect } from 'react';
import { useStore } from '../store';

export function StudyNotifier() {
  const subjects = useStore((state) => state.subjects);
  const setTopicLastNotified = useStore((state) => state.setTopicLastNotified);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      const nowTime = now.getTime();

      subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          // Only notify for topics that are not completed
          if (topic.status === 'completed') return;

          // We need both a start (reminderDate) and end (deadline) time
          if (!topic.reminderDate || !topic.deadline) return;

          const startTime = new Date(topic.reminderDate).getTime();
          const endTime = new Date(topic.deadline).getTime();

          // Check if current time is within the study window
          if (nowTime >= startTime && nowTime <= endTime) {
            let shouldNotify = false;

            if (!topic.lastNotifiedAt) {
              // First time notifying within the window
              shouldNotify = true;
            } else {
              const lastNotifiedTime = new Date(topic.lastNotifiedAt).getTime();
              const hoursSinceLastNotification = (nowTime - lastNotifiedTime) / (1000 * 60 * 60);
              
              // Notify if it's been at least 1 hour since the last notification
              if (hoursSinceLastNotification >= 1) {
                shouldNotify = true;
              }
            }

            if (shouldNotify) {
              // Trigger notification
              new Notification('Study Reminder', {
                body: `Time to study: ${topic.title} (${subject.name})`,
                icon: '/vite.svg' // Fallback icon
              });

              // Update last notified time
              setTopicLastNotified(subject.id, topic.id, now.toISOString());
            }
          }
        });
      });
    };

    // Check immediately on mount
    checkReminders();

    // Check every minute
    const intervalId = setInterval(checkReminders, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [subjects, setTopicLastNotified]);

  return null; // This component doesn't render anything
}
