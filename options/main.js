/**
 * Options page entry point.
 */

import { OptionsManager } from './options.js';

// Staggered fade-in of the sections and cards
function animateElements() {
  document.querySelectorAll('.section').forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
    section.classList.add('fade-in-up');
  });
  document.querySelectorAll('.tab-item, .category-item').forEach((card, index) => {
    card.style.animationDelay = `${0.3 + (index * 0.05)}s`;
    card.classList.add('fade-in-up');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    new OptionsManager();
    setTimeout(animateElements, 100);
  }, 50);
});
