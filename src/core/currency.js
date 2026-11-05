/**
 * @file currency.js
 * @description Multi-currency specification, precision formatting, and FX conversion engine
 * supporting USD, EUR, and IDR for the Runway Swiss Minimalist Financial Ledger.
 */

export const SUPPORTED_CURRENCIES = Object.freeze({
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
    thousandSep: ',',
    decimalSep: '.',
    rateFromUSD: 1.0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
    thousandSep: '.',
    decimalSep: ',',
    rateFromUSD: 0.92,
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    locale: 'id-ID',
    decimals: 2,
    thousandSep: '.',
    decimalSep: ',',
    rateFromUSD: 15850.0,
  },
});

/**
 * Validate and retrieve currency configuration.
 * @param {string} currencyCode - ISO 4217 currency code ('USD' | 'EUR' | 'IDR')
 * @returns {object} Currency descriptor
 */
export function getCurrencyConfig(currencyCode = 'USD') {
  const normalized = String(currencyCode || 'USD').trim().toUpperCase();
  const config = SUPPORTED_CURRENCIES[normalized];
  if (!config) {
    throw new Error(`Unsupported currency code: "${currencyCode}". Supported: USD, EUR, IDR.`);
  }
  return config;
}

/**
 * Deterministic, locale-independent tabular currency formatter.
 * Ensures identical output across browser engines and Node.js runtimes.
 *
 * @param {number} amount - Monetary value to format
 * @param {string} [currencyCode='USD'] - Target currency ('USD' | 'EUR' | 'IDR')
 * @param {object} [options={}] - Formatting options
 * @param {boolean} [options.showPlus=false] - Prefix positive numbers with '+'
 * @param {number} [options.decimals] - Override default decimal places
 * @returns {string} Formatted monetary string
 */
export function formatCurrency(amount, currencyCode = 'USD', options = {}) {
  const config = getCurrencyConfig(currencyCode);
  const numeric = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const decimals = typeof options.decimals === 'number' ? options.decimals : config.decimals;

  const isNegative = numeric < -1e-9;
  const isPositive = numeric > 1e-9;
  const absValue = Math.abs(numeric);

  const fixed = absValue.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSep);
  const formattedNumber =
    decimals > 0 ? `${groupedInt}${config.decimalSep}${decPart}` : groupedInt;

  const signPrefix = isNegative ? '-' : options.showPlus && isPositive ? '+' : '';
  return `${signPrefix}${config.symbol}${formattedNumber}`;
}

/**
 * Convert an amount between any two supported currencies (USD, EUR, IDR).
 *
 * @param {number} amount - Source amount
 * @param {string} fromCurrency - Source ISO currency code
 * @param {string} toCurrency - Target ISO currency code
 * @returns {number} Converted monetary amount
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    throw new Error('Amount must be a finite number.');
  }
  const source = getCurrencyConfig(fromCurrency);
  const target = getCurrencyConfig(toCurrency);

  if (source.code === target.code) {
    return numeric;
  }

  const amountInUSD = numeric / source.rateFromUSD;
  const converted = amountInUSD * target.rateFromUSD;
  return Number(converted.toFixed(4));
}
