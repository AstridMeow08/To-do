import { useEffect, useState, useRef } from 'react';
import type { Habit } from '../types/habit';

export function useNotifications(habits: Habit[]) {
  const [activeReminder, setActiveReminder] = useState<Habit | null>(null);
  
  // Track which habits we've already notified for today
  // so we don't spam the user every minute.
  const [notifiedHabitIds, setNotifiedHabitIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('to-do-notified-habits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep today's notifications
        if (parsed.date === new Date().toDateString()) {
          return new Set(parsed.ids);
        }
      } catch (e) {
        console.error('Error parsing notified habits', e);
      }
    }
    return new Set();
  });

  // Keep a fresh ref to habits so the interval doesn't use stale data
  const habitsRef = useRef(habits);
  const notifiedRef = useRef(notifiedHabitIds);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  useEffect(() => {
    notifiedRef.current = notifiedHabitIds;
    // Save to local storage whenever it changes
    localStorage.setItem('to-do-notified-habits', JSON.stringify({
      date: new Date().toDateString(),
      ids: Array.from(notifiedHabitIds)
    }));
  }, [notifiedHabitIds]);

  // Request permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up the interval to check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      for (const habit of habitsRef.current) {
        // Only check habits that have a timeFrom set
        if (!habit.timeFrom) continue;
        
        // Only check if it's currently the time (or 1 minute past)
        if (habit.timeFrom === currentTimeStr) {
          
          // Ensure we haven't already notified today
          if (!notifiedRef.current.has(habit.id)) {
            
            // Check if habit is already completed today
            const isCompletedToday = habit.completions ? !!habit.completions[todayStr] : false;
            
            if (!isCompletedToday) {
              triggerNotification(habit);
              
              // Mark as notified so we don't spam
              setNotifiedHabitIds(prev => {
                const next = new Set(prev);
                next.add(habit.id);
                return next;
              });
            }
          }
        }
      }
    };

    const triggerNotification = (habit: Habit) => {
      if (document.visibilityState === 'visible') {
        // App is open and focused - show in-app modal
        setActiveReminder(habit);
      } else {
        // App is minimized/hidden - show native notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`Time for: ${habit.name}`, {
            body: habit.description || 'Mark it as done to keep up your streak!',
            icon: '/vite.svg', // Fallback icon
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
            setActiveReminder(habit); // Show modal when they click the notification
          };
        } else {
          // Fallback if no permissions: show modal when they eventually focus the tab
          setActiveReminder(habit);
        }
      }
    };

    // Check immediately, then every 30 seconds
    checkReminders();
    const intervalId = setInterval(checkReminders, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const dismissReminder = () => {
    setActiveReminder(null);
  };

  return {
    activeReminder,
    dismissReminder
  };
}
