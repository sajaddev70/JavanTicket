export function errorMessage(err: unknown, fallback: string): string {
  return (err as { message?: string })?.message || fallback;
}
