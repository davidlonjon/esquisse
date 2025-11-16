import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useOnClickOutside } from './useOnClickOutside';

describe('useOnClickOutside', () => {
  let container: HTMLDivElement;
  let ref: React.RefObject<HTMLDivElement>;
  let handler: (event: MouseEvent) => void;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    ref = { current: container };
    handler = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should call handler when clicking outside element', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside element', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when clicking on element itself', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when enabled is false', () => {
    renderHook(() => useOnClickOutside(ref, handler, false));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('should handle null ref gracefully', () => {
    const nullRef = { current: null };
    renderHook(() => useOnClickOutside(nullRef, handler));

    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);

    // Should not call handler when ref is null (early return in hook)
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should update handler without recreating listener', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(({ handler: h }) => useOnClickOutside(ref, h), {
      initialProps: { handler: handler1 },
    });

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    let event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    // Update handler
    rerender({ handler: handler2 });

    event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('should toggle enabled state correctly', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useOnClickOutside(ref, handler, enabled),
      { initialProps: { enabled: true } }
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    // Enabled: should call handler
    let event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);

    // Disable
    rerender({ enabled: false });
    event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again

    // Re-enable
    rerender({ enabled: true });
    event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(2);

    document.body.removeChild(outsideElement);
  });
});
