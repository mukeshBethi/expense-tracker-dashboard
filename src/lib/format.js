export function formatMoney(amount, currency) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${currency}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmountInput(rawValue) {
  if (!rawValue) return "";
  const cleaned = rawValue.replace(/,/g, "");
  const [intPart, decPart] = cleaned.split(".");
  if (!/^\d*$/.test(intPart)) return rawValue.replace(/,/g, "");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function parseAmountInput(displayValue) {
  if (!displayValue) return NaN;
  return parseFloat(displayValue.replace(/,/g, ""));
}
