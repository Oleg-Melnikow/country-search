export function createMockResponse(data: unknown, status = 200): Response {
  const body = typeof data === 'string' ? data : JSON.stringify(data);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Status ${status}`,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: async () => JSON.parse(body),
    text: async () => body,
  } as unknown as Response;
}
