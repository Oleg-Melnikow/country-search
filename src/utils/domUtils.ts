type SafeElementProps<T extends HTMLElement> = Omit<
  Partial<T>,
  'innerHTML' | 'outerHTML' | 'style' | 'dataset'
>;

export function createDOMElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props?: SafeElementProps<HTMLElementTagNameMap[K]>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  return props ? Object.assign(element, props) : element;
}
