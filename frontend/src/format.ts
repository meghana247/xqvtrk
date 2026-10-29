export const formatMW = (value: number | null | undefined) =>
  value == null ? "–" : `${Math.round(value).toLocaleString("en-GB")} MW`;

export const formatDay = (time: string | number) =>
  new Date(time).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });

export const formatDateTime = (time: string | number) =>
  new Date(time).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
