import { useEffect } from 'react';

interface Options {
  timeoutMs?: number;
  enabled?: boolean;
  message?: string;
}

// Auto-logout after a period of user inactivity across mouse/keyboard/touch/scroll.
export function useIdleLogout({
  timeoutMs = 1 * 60 * 1000,
  enabled = true,
  message = 'You were logged out due to inactivity',
}: Options = {}) {
  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          sessionStorage.setItem('flashToast', JSON.stringify({ type: 'info', message }));
        } catch {}
        try { localStorage.removeItem('userPhone'); } catch {}
        try { sessionStorage.removeItem('userPhone'); } catch {}
        window.location.href = '/';
      }, timeoutMs);
    };

    const onActivity = (e: Event) => {
      // Ignore when tab becomes hidden; we'll still count down
      if (e.type === 'visibilitychange') {
        if (document.visibilityState === 'hidden') return;
      }
      schedule();
    };

    const events: (keyof WindowEventMap | 'visibilitychange')[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'visibilitychange',
    ];

    events.forEach(evt => {
      const target: any = evt === 'visibilitychange' ? document : window;
      target.addEventListener(evt, onActivity, { passive: true } as any);
    });

    schedule();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(evt => {
        const target: any = evt === 'visibilitychange' ? document : window;
        target.removeEventListener(evt, onActivity as any);
      });
    };
  }, [enabled, timeoutMs, message]);
}

export default useIdleLogout;
