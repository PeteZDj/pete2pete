import { formatDistanceToNowStrict, format, differenceInSeconds } from 'date-fns';

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function exactTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '';
  }
}

export function shortTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'HH:mm');
  } catch {
    return '';
  }
}

export function uptimeString(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function connectionUptime(connectedAt: string | null): string {
  if (!connectedAt) return '—';
  try {
    const diff = differenceInSeconds(new Date(), new Date(connectedAt));
    return uptimeString(diff);
  } catch {
    return '—';
  }
}
