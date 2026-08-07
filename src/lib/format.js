export function formatMoney(amount, currency) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${currency}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const MAX_INT_DIGITS = 10;

export function formatAmountInput(rawValue) {
  if (!rawValue) return "";
  const cleaned = rawValue.replace(/,/g, "");
  const [intPart, decPart] = cleaned.split(".");
  if (!/^\d*$/.test(intPart)) return rawValue.replace(/,/g, "");
  const cappedIntPart = intPart.slice(0, MAX_INT_DIGITS);
  const withCommas = cappedIntPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function parseAmountInput(displayValue) {
  if (!displayValue) return NaN;
  return parseFloat(displayValue.replace(/,/g, ""));
}
