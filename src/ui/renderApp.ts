import { createCountrySearchController } from '../core/countrySearchController.js';
import { CountryCard, SearchState, SearchStatus } from '../types/types.js';
import { createDOMElement } from '../utils/domUtils.js';
import { createCountryCardElement } from './countryCard.js';
import { createCountryDetailsModal } from './countryModal.js';
import { createHistoryBarElement } from './historyBar.js';
import {
  createEmptyView,
  createErrorView,
  createIdleView,
  createLoadingView,
} from './statusView.js';

export const mountCountrySearchApp = (root: HTMLElement): void => {
  const controller = createCountrySearchController({
    debounceMs: 500,
    timeoutMs: 5000,
  });

  const app = createDOMElement('main', { className: 'app-container' });
  const header = createDOMElement('header', { className: 'app-header' });
  const title = createDOMElement('h1', {
    className: 'app-title',
    textContent: 'Поиск стран',
  });

  const searchBox = createDOMElement('div', { className: 'search-box' });
  const input = createDOMElement('input', {
    className: 'search-input',
    type: 'search',
    placeholder: 'Введите название страны (например, Belarus или Spain)...',
  });
  input.setAttribute('aria-label', 'Поиск страны по названию');

  const clearBtn = createDOMElement('button', {
    className: 'clear-btn',
    type: 'button',
    textContent: 'Очистить',
    hidden: true,
  });

  searchBox.append(input, clearBtn);

  const historyContainer = createDOMElement('div', { className: 'history-root' });
  header.append(title, searchBox, historyContainer);

  const contentArea = createDOMElement('section', { className: 'content-area' });
  const modalContainer = createDOMElement('div', { className: 'modal-root' });

  app.append(header, contentArea, modalContainer);
  root.append(app);

  const closeModal = (): void => {
    modalContainer.replaceChildren();
  };

  const openModal = (country: CountryCard): void => {
    closeModal();
    modalContainer.append(createCountryDetailsModal(country, closeModal));
  };

  const handleHistorySelect = (query: string): void => {
    input.value = query;
    controller.selectFromHistory(query);
  };

  const renderSuccessGrid = (countries: CountryCard[]): HTMLElement => {
    const grid = createDOMElement('div', { className: 'countries-grid' });
    countries.forEach((country) => {
      grid.append(createCountryCardElement(country, openModal));
    });
    return grid;
  };

  const stateRenderers: Record<SearchStatus, (state: SearchState) => HTMLElement> = {
    idle: () => createIdleView(),
    loading: () => createLoadingView(),
    empty: (state) => createEmptyView(state.query),
    error: (state) =>
      createErrorView(state.error?.message ?? 'Произошла неизвестная ошибка.', () =>
        controller.retry()
      ),
    success: (state) => renderSuccessGrid(state.results),
  };

  const renderState = (state: SearchState): void => {
    clearBtn.hidden = input.value.length === 0;

    const historyBar = createHistoryBarElement(state.history, handleHistorySelect, () =>
      controller.clearHistory()
    );

    if (historyBar) {
      historyContainer.replaceChildren(historyBar);
    } else {
      historyContainer.replaceChildren();
    }

    const view = stateRenderers[state.status](state);
    contentArea.replaceChildren(view);
  };

  input.addEventListener('input', () => {
    controller.handleInput(input.value);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    controller.handleInput('');
  });

  controller.subscribe(renderState);
  renderState(controller.getState());
};
