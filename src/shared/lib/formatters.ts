// src/shared/lib/formatters.ts
export const formatMoney = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("ru-RU").format(new Date(date));
