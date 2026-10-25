(() => {
  'use strict';

  // Prevent iOS pinch-to-zoom gestures inside the installed web app/Safari page.
  document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', event => event.preventDefault(), { passive: false });
  document.addEventListener('gestureend', event => event.preventDefault(), { passive: false });

  // Prevent double-tap zoom without blocking normal single taps or form focus.
  let lastTouchEnd = 0;
  document.addEventListener('touchend', event => {
    const now = Date.now();
    const elapsed = now - lastTouchEnd;
    const target = event.target;
    const isFormControl = target.closest('input, select, textarea');

    if (!isFormControl && elapsed > 0 && elapsed < 350) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
})();
