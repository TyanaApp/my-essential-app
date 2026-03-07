const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  PLN: 'zł',
  UAH: '₴',
  RUB: '₽',
};

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || '€';
};

export const formatMoney = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Number(amount).toFixed(2)}`;
};
