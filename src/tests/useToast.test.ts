import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../hooks/useToast';

describe('useToast()', () => {
  it('starts with visible=false and empty message', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.visible).toBe(false);
    expect(result.current.message).toBe('');
  });

  it('showToast() sets visible=true and message', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Hello World', 'success');
    });
    expect(result.current.visible).toBe(true);
    expect(result.current.message).toBe('Hello World');
    expect(result.current.type).toBe('success');
  });

  it('defaults to success type when no type provided', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Test');
    });
    expect(result.current.type).toBe('success');
  });

  it('supports all toast types', () => {
    const { result } = renderHook(() => useToast());
    const types = ['success', 'error', 'info', 'warning'] as const;
    for (const t of types) {
      act(() => result.current.showToast(`${t} message`, t));
      expect(result.current.type).toBe(t);
    }
  });

  it('hideToast() sets visible=false immediately', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Visible toast', 'info');
    });
    expect(result.current.visible).toBe(true);
    act(() => {
      result.current.hideToast();
    });
    expect(result.current.visible).toBe(false);
  });

  it('replaces previous toast when showToast is called again', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast('First', 'success'));
    act(() => result.current.showToast('Second', 'error'));
    expect(result.current.message).toBe('Second');
    expect(result.current.type).toBe('error');
    expect(result.current.visible).toBe(true);
  });
});
