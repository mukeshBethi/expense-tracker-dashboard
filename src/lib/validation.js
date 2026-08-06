const MAX_AMOUNT_DIGITS = 10;

export function validateDate(isoDate, todayIso) {
  if (!isoDate) return "Date is required.";
  if (isoDate > todayIso) return "Date can't be in the future.";
  return null;
}

export function validateAmount(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Amount is required.";
  }
  if (!(amount > 0)) return "Amount must be greater than 0.";
  const intDigits = Math.floor(amount).toString().length;
  if (intDigits > MAX_AMOUNT_DIGITS) return "Amount can't exceed 10 digits.";
  return null;
}

export function validateCategory(category) {
  if (!category) return "Please choose a category.";
  return null;
}

export function validateCategoryName(name, existingCategories) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Category name is required.";
  if (trimmed.length > 24) return "Category name must be 24 characters or fewer.";
  if (existingCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    return "That category already exists.";
  }
  return null;
}

export function validateAllocation(newAmount, category, budgets, totalBudget) {
  if (!(totalBudget > 0)) return null;
  let othersSum = 0;
  for (const [cat, val] of Object.entries(budgets)) {
    if (cat === category) continue;
    othersSum += Number(val) || 0;
  }
  const projected = othersSum + (Number(newAmount) || 0);
  if (projected > totalBudget) {
    return { overage: projected - totalBudget };
  }
  return null;
}

export function validateTotalBudget(newTotal, budgets) {
  if (!(newTotal > 0)) return null;
  let allocated = 0;
  for (const val of Object.values(budgets)) allocated += Number(val) || 0;
  if (newTotal < allocated) {
    return { allocated };
  }
  return null;
}
