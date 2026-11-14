import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { debounce } from '../core/debounce.js';

describe('debounce', () => {
  const DELAY = 300;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('не вызывает переданную функцию сразу при вызове обёртки', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn('B');

    expect(fn).not.toHaveBeenCalled();
  });

  it('вызывает функцию ровно один раз по истечении delay мс', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn('Belarus');

    jest.advanceTimersByTime(DELAY - 1);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('Belarus');
  });

  it('сбрасывает таймер при серии частых вызовов и передаёт последние аргументы', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn('J');
    jest.advanceTimersByTime(100);
    debouncedFn('Ja');
    jest.advanceTimersByTime(100);
    debouncedFn('Jap');
    jest.advanceTimersByTime(100);
    debouncedFn('Japan');

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(DELAY);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('Japan');
  });

  it('позволяет выполнять новые циклы вызовов после завершения предыдущего таймера', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn('France');
    jest.advanceTimersByTime(DELAY);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('France');

    debouncedFn('Germany');
    jest.advanceTimersByTime(DELAY);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('Germany');
  });

  it('изолирует таймеры разных экземпляров debounce друг от друга', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const debounced1 = debounce(fn1, 300);
    const debounced2 = debounce(fn2, 500);

    debounced1('first');
    debounced2('second');

    jest.advanceTimersByTime(300);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('корректно работает с нулевой задержкой (delay = 0)', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn('Instant');
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('Instant');
  });

  it('корректно передаёт несколько аргументов и значения undefined / null', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn('Poland', undefined, null, 0);
    jest.advanceTimersByTime(DELAY);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('Poland', undefined, null, 0);
  });

  it('не падает и корректно работает с функциями без аргументов', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, DELAY);

    debouncedFn();
    debouncedFn();
    jest.advanceTimersByTime(DELAY);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith();
  });
});
