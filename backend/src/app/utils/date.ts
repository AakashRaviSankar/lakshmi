export function getCurrentISTDate(): Date {
  const options = { timeZone: "Asia/Kolkata" };
  const istString = new Date().toLocaleString("en-US", options);
  return new Date(istString);
}

export function getISTDateStr(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === "year")!.value;
  const month = parts.find(p => p.type === "month")!.value;
  const day = parts.find(p => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

export function getISTStartOfDay(date: Date): Date {
  const istDateStr = getISTDateStr(date);
  return new Date(`${istDateStr}T00:00:00.000+05:30`);
}

export function parseAdminInputToIST(drawTimeStr: string): Date {
  if (!drawTimeStr) return new Date();
  // Standard format for datetime-local input is YYYY-MM-DDTHH:mm
  // If it doesn't end with Z or offset, append +05:30
  if (!/([+-]\d{2}:\d{2}|Z)$/.test(drawTimeStr)) {
    return new Date(`${drawTimeStr}+05:30`);
  }
  return new Date(drawTimeStr);
}

export function formatToISTString(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
}

export function formatToISTDateString(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatToISTTimeString(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
