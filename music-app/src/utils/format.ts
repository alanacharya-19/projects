export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function extractFolder(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 2] || 'Unknown';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
