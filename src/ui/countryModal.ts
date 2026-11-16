import { CountryCard } from '../types/types.js';
import { createDOMElement } from '../utils/domUtils.js';

const formatCountryDetails = (country: CountryCard): Array<[string, string]> => {
  const languagesText = country.languages.length > 0 ? country.languages.join(', ') : '—';

  const currenciesText = country.currencies.length > 0 ? country.currencies.join(', ') : '—';

  const bordersText =
    country.borders.length > 0 ? country.borders.join(', ') : 'Нет сухопутных границ';

  return [
    ['Столица', country.capital],
    ['Регион', country.region],
    ['Население', country.population.toLocaleString('ru-RU')],
    ['Площадь', `${country.area.toLocaleString('ru-RU')} км²`],
    ['Языки', languagesText],
    ['Валюта', currenciesText],
    ['Границы', bordersText],
  ];
};

export const createCountryDetailsModal = (
  country: CountryCard,
  onClose: () => void
): HTMLElement => {
  const overlay = createDOMElement('div', { className: 'modal-overlay' });
  const modal = createDOMElement('div', { className: 'modal-card' });

  const handleClose = (): void => {
    document.removeEventListener('keydown', handleEscape);
    onClose();
  };

  const handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  document.addEventListener('keydown', handleEscape);

  const closeBtn = createDOMElement('button', {
    className: 'modal-close',
    type: 'button',
    textContent: '✕',
  });
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.addEventListener('click', handleClose);

  overlay.addEventListener('click', (event: Event) => {
    if (event.target === overlay) {
      handleClose();
    }
  });

  const flagImg = createDOMElement('img', {
    className: 'modal-flag',
    src: country.flagUrl,
    alt: `Флаг ${country.name}`,
  });

  const title = createDOMElement('h2', {
    className: 'modal-title',
    textContent: country.name,
  });

  const detailsList = createDOMElement('ul', { className: 'modal-details' });

  formatCountryDetails(country).forEach(([label, value]) => {
    const item = createDOMElement('li', { className: 'modal-detail-item' });
    const labelEl = createDOMElement('strong', { textContent: `${label}: ` });
    const valueEl = createDOMElement('span', { textContent: value });
    item.append(labelEl, valueEl);
    detailsList.append(item);
  });

  modal.append(closeBtn, flagImg, title, detailsList);
  overlay.append(modal);

  return overlay;
};
