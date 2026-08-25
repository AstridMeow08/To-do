import { useState } from 'react';
import type { Todo } from '../../types/todo';
import { TodoItem } from './TodoItem';
import { TodoDashboard } from '../TodoDashboard';
import styles from './TodoList.module.css';

interface TodoListProps {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
}

export function TodoList({ todos, onAdd, onToggle, onDelete, onClearCompleted }: TodoListProps) {
  const [inputText, setInputText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAdd(inputText.trim());
    setInputText('');
  };

  const hasCompleted = todos.some(t => t.completed);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>My To-Do List</span>
        <div className={styles.headerControls}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'dashboard' ? styles.activeView : ''}`}
              onClick={() => setViewMode('dashboard')}
            >
              Dashboard
            </button>
          </div>
          {viewMode === 'list' && hasCompleted && (
            <button className={styles.clearBtn} onClick={onClearCompleted}>
              Clear Completed
            </button>
          )}
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <>
          <form onSubmit={handleAdd} className={styles.addForm}>
            <input
              type="text"
              className={styles.input}
              placeholder="Add a new task..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={100}
            />
            <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
              Add
            </button>
          </form>

          <div className={styles.list}>
            {todos.length === 0 ? (
              <div className={styles.empty}>
                <p>You have no tasks pending.</p>
              </div>
            ) : (
              todos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => onToggle(todo.id)}
                  onDelete={() => onDelete(todo.id)}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <TodoDashboard todos={todos} />
      )}
    </div>
  );
}
