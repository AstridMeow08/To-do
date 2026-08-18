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
import { ConfirmModal } from './components/ConfirmModal';
import { Dashboard } from './components/Dashboard';
import { DataModal } from './components/DataModal';
import { Toast } from './components/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import './App.css';

type View = 'habits' | 'dashboard';

export default function App() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabit, importHabits } = useHabits();
  const { message, type, visible, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { activeReminder, dismissReminder } = useNotifications(habits);

  const [view, setView] = useState<View>('habits');
  const [modalOpen, setModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  // PWA service worker registration & update handling
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() { setUpdateVisible(true); },
    onOfflineReady() { showToast('App ready to work offline ✓', 'info'); },
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
        showToast('Habit updated successfully', 'success');
      } else {
        addHabit(data);
        showToast('Habit added successfully', 'success');
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
      if (wasCompleted) {
        showToast(`Unmarked: ${habit.name}`, 'info');
      } else {
        showToast(`Great job! Completed: ${habit.name} 🔥`, 'success');
      }
    },
    [habits, toggleHabit, showToast]
  );

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        setHabitToDelete(habit);
      }
    },
    [habits]
  );

  const handleConfirmDelete = useCallback(() => {
    if (habitToDelete) {
      deleteHabit(habitToDelete.id);
      showToast(`Removed habit "${habitToDelete.name}"`, 'info');
      setHabitToDelete(null);
    }
  }, [habitToDelete, deleteHabit, showToast]);

  const handleCompleteReminder = (habitId: string) => {
    toggleHabit(habitId);
    dismissReminder();
    showToast('Habit marked as completed! 🎯', 'success');
  };

  const handleImportData = useCallback(
    (importedHabits: Habit[], mode: 'merge' | 'replace') => {
      importHabits(importedHabits, mode);
      showToast(
        mode === 'replace'
          ? `Successfully replaced with ${importedHabits.length} habits`
          : `Successfully merged ${importedHabits.length} habits`,
        'success'
      );
    },
    [importHabits, showToast]
  );

  return (
    <div className="shell">
      <Header
        onAdd={openAdd}
        onOpenData={() => setDataModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

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
            onDelete={handleDeleteRequest}
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
      <DataModal
        open={dataModalOpen}
        habits={habits}
        onClose={() => setDataModalOpen(false)}
        onImport={handleImportData}
      />
      <ConfirmModal
        open={!!habitToDelete}
        title="Remove Habit?"
        message={`Are you sure you want to remove "${habitToDelete?.name || ''}"? All recorded streaks and completion history for this habit will be permanently deleted.`}
        confirmText="Delete Habit"
        cancelText="Keep Habit"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setHabitToDelete(null)}
      />
      <Toast message={message} type={type} visible={visible} />
      <UpdatePrompt
        visible={updateVisible}
        onUpdate={() => { updateServiceWorker(true); setUpdateVisible(false); }}
        onDismiss={() => setUpdateVisible(false)}
      />
    </div>
  );
}
