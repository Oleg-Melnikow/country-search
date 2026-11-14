export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  throw new Error(`error not implement ${fn.name} with ${delay} ms`);
}
