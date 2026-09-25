import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('ne met pas à jour avant la fin du délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });

    // Avant le délai
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');
  });

  it('met à jour après le délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('réinitialise le timer si la valeur change à nouveau', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'b', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    }); // 200ms, pas encore déclenché
    rerender({ value: 'c', delay: 300 }); // nouveau changement → reset timer
    act(() => {
      vi.advanceTimersByTime(200);
    }); // +200ms = 400ms total, mais timer reset à 0
    expect(result.current).toBe('a'); // toujours la valeur initiale

    act(() => {
      vi.advanceTimersByTime(100);
    }); // +100ms = complète les 300ms du dernier changement
    expect(result.current).toBe('c');
  });

  it('fonctionne avec les types numériques', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: number; delay: number }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );

    rerender({ value: 42, delay: 500 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(42);
  });
});
