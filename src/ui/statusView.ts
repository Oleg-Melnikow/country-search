import { createDOMElement } from '../utils/domUtils.js';

export const createIdleView = (): HTMLElement =>
  createDOMElement('p', {
    className: 'status-message status-idle',
    textContent: 'Начните вводить название страны на английском языке.',
  });

export const createLoadingView = (): HTMLElement =>
  createDOMElement('div', {
    className: 'status-message status-loading',
    textContent: 'Загрузка стран...',
  });

export const createEmptyView = (query: string): HTMLElement =>
  createDOMElement('div', {
    className: 'status-message status-empty',
    textContent: `По запросу «${query}» ничего не найдено.`,
  });

export const createErrorView = (message: string, onRetry: () => void): HTMLElement => {
  const container = createDOMElement('div', { className: 'status-message status-error' });
  const text = createDOMElement('p', {
    className: 'error-text',
    textContent: message,
  });
  const retryBtn = createDOMElement('button', {
    className: 'retry-btn',
    type: 'button',
    textContent: 'Повторить',
  });

  retryBtn.addEventListener('click', onRetry);

  container.append(text, retryBtn);
  return container;
};
