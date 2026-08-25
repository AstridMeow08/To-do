import type { Todo } from '../../types/todo';
import styles from './TodoList.module.css';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className={`${styles.item} ${todo.completed ? styles.completed : ''}`}>
      <button 
        className={styles.radioBtn} 
        onClick={onToggle}
        title={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        <div className={styles.radioInner} />
      </button>
      
      <div className={styles.text}>
        {todo.text}
      </div>
      
      <button 
        className={styles.deleteBtn} 
        onClick={onDelete}
        title="Delete task"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
