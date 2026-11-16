import { createDOMElement } from '../utils/domUtils.js';

export const createHistoryBarElement = (
  items: string[],
  onSelect: (query: string) => void,
  onClear: () => void
): HTMLElement | null => {
  if (items.length === 0) {
    return null;
  }

  const container = createDOMElement('div', { className: 'history-bar' });
  const label = createDOMElement('span', {
    className: 'history-label',
    textContent: 'Недавние запросы:',
  });
  const chipsList = createDOMElement('div', { className: 'history-chips' });

  items.forEach((query) => {
    const chip = createDOMElement('button', {
      className: 'history-chip',
      type: 'button',
      textContent: query,
    });
    chip.addEventListener('click', () => onSelect(query));
    chipsList.append(chip);
  });

  const clearHistoryBtn = createDOMElement('button', {
    className: 'history-clear-btn',
    type: 'button',
    textContent: 'Очистить историю',
  });
  clearHistoryBtn.addEventListener('click', onClear);

  container.append(label, chipsList, clearHistoryBtn);
  return container;
};
