const nativeSetTimeout = globalThis.setTimeout;

export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => {
    nativeSetTimeout(resolve, 0);
  });
