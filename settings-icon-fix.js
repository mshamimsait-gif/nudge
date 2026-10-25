(() => {
  'use strict';
  const gear = document.getElementById('gear');
  if (!gear) return;

  gear.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3.25"></circle>
      <path d="M19.14 12.94a7.4 7.4 0 0 0 .05-.94 7.4 7.4 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.35 7.35 0 0 0-1.63-.95L14.87 3.6h-3.84l-.36 2.57c-.58.23-1.12.55-1.63.95l-2.39-.96-1.92 3.32 2.03 1.58a7.4 7.4 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58 1.92 3.32 2.39-.96c.51.4 1.05.72 1.63.95l.36 2.57h3.84l.36-2.57c.58-.23 1.12-.55 1.63-.95l2.39.96 1.92-3.32-2.03-1.58Z"></path>
    </svg>`;

  gear.style.display = 'grid';
  gear.style.placeItems = 'center';
  gear.style.padding = '0';

  const icon = gear.querySelector('svg');
  icon.style.display = 'block';
  icon.style.width = '25px';
  icon.style.height = '25px';
  icon.style.margin = '0';
  icon.style.transform = 'translate(0, 0)';
  icon.style.transformOrigin = 'center';
  icon.style.fill = 'none';
  icon.style.stroke = 'currentColor';
  icon.style.strokeWidth = '1.8';
  icon.style.strokeLinecap = 'round';
  icon.style.strokeLinejoin = 'round';
  icon.style.vectorEffect = 'non-scaling-stroke';
})();
