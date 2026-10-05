function readDateParts(
  iso: string,
): { day: string; month: string; year: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return null;
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

export function formatDate(iso: string): string {
  const parts = readDateParts(iso);
  if (!parts) {
    return iso;
  }

  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatShortDate(iso: string): string {
  const parts = readDateParts(iso);
  if (!parts) {
    return iso;
  }

  return `${parts.day}/${parts.month}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}

export function formatShortDateRange(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} → ${formatShortDate(endDate)}`;
}
