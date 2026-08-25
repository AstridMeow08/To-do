import { useState, useCallback } from 'react';
import type { Todo } from '../types/todo';
import { uid } from '../utils/dateUtils';

const STORAGE_KEY = 'todoListData_v1';

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

function persist(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  const update = useCallback((next: Todo[]) => {
    setTodos(next);
    persist(next);
  }, []);

  const addTodo = useCallback(
    (text: string) => {
      const todo: Todo = { id: uid(), text, completed: false, createdAt: Date.now() };
      update([todo, ...todos]);
    },
    [todos, update]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      update(todos.map(t => {
        if (t.id === id) {
          const isCompleted = !t.completed;
          return { 
            ...t, 
            completed: isCompleted,
            completedAt: isCompleted ? Date.now() : undefined 
          };
        }
        return t;
      }));
    },
    [todos, update]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      update(todos.filter(t => t.id !== id));
    },
    [todos, update]
  );

  const clearCompleted = useCallback(() => {
    update(todos.filter(t => !t.completed));
  }, [todos, update]);

  return { todos, addTodo, toggleTodo, deleteTodo, clearCompleted };
}
