import { useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { Habit, HabitFormData } from './types/habit';
import { useHabits } from './hooks/useHabits';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { HabitsGrid } from './components/HabitsGrid';
import { HabitModal } from './components/HabitModal';
import { ReminderModal } from './components/ReminderModal';
import { Dashboard } from './components/Dashboard';
import { Toast } from './components/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import './App.css';

type View = 'habits' | 'dashboard';

export default function App() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabit } = useHabits();
  const { message, visible, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { activeReminder, dismissReminder } = useNotifications(habits);

  const [view, setView] = useState<View>('habits');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  // PWA service worker registration & update handling
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() { setUpdateVisible(true); },
    onOfflineReady() { showToast('App ready to work offline ✓'); },
  });

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((habit: Habit) => {
    setEditing(habit);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const handleSave = useCallback(
    (data: HabitFormData) => {
      if (editing) {
        updateHabit(editing.id, data);
        showToast('Habit updated');
      } else {
        addHabit(data);
        showToast('Habit added');
      }
      closeModal();
    },
    [editing, addHabit, updateHabit, closeModal, showToast]
  );

  const handleToggle = useCallback(
    (id: string) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      toggleHabit(id);
      const wasCompleted = habit.completions[new Date().toISOString().slice(0, 10)];
      showToast(wasCompleted ? 'Habit unmarked' : 'Great work! Habit completed');
    },
    [habits, toggleHabit, showToast]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm('Remove this habit? All progress will be lost.')) return;
      deleteHabit(id);
      showToast('Habit removed');
    },
    [deleteHabit, showToast]
  );

  const handleCompleteReminder = (habitId: string) => {
    toggleHabit(habitId);
    dismissReminder();
    showToast('Habit completed');
  };

  return (
    <div className="shell">
      <Header onAdd={openAdd} theme={theme} onToggleTheme={toggleTheme} />

      {/* ── Navigation Tabs ── */}
      <nav className="nav-tabs" aria-label="Main navigation">
        <button
          className={`nav-tab${view === 'habits' ? ' active' : ''}`}
          onClick={() => setView('habits')}
          aria-current={view === 'habits' ? 'page' : undefined}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Habits
        </button>
        <button
          className={`nav-tab${view === 'dashboard' ? ' active' : ''}`}
          onClick={() => setView('dashboard')}
          aria-current={view === 'dashboard' ? 'page' : undefined}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </button>
      </nav>

      {/* ── Views ── */}
      {view === 'habits' && (
        <>
          <SummaryBar habits={habits} />
          <HabitsGrid
            habits={habits}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={openAdd}
          />
        </>
      )}

      {view === 'dashboard' && <Dashboard habits={habits} />}

      <HabitModal
        open={modalOpen}
        editing={editing}
        onClose={closeModal}
        onSave={handleSave}
      />
      <ReminderModal
        habit={activeReminder}
        onClose={dismissReminder}
        onComplete={handleCompleteReminder}
      />
      <Toast message={message} visible={visible} />
      <UpdatePrompt
        visible={updateVisible}
        onUpdate={() => { updateServiceWorker(true); setUpdateVisible(false); }}
        onDismiss={() => setUpdateVisible(false)}
      />
    </div>
  );
}
