/**
 * @file runwayEngine.js
 * @description Core financial computation engine for Runway.
 * Implements Monthly Gross/Net Burn Rate, Financial Runway (in months and days),
 * 50/30/20 Rule (Needs / Wants / Savings) allocation auditing, and ledger diagnostics.
 */

export const DAYS_PER_MONTH = 30;

export const BUCKET_TYPES = Object.freeze({
  NEEDS: 'NEEDS',
  WANTS: 'WANTS',
  SAVINGS: 'SAVINGS',
});

export const RULE_50_30_20_TARGETS = Object.freeze({
  NEEDS: 50.0,
  WANTS: 30.0,
  SAVINGS: 20.0,
});

const NEEDS_KEYWORDS = [
  'housing',
  'rent',
  'dorm',
  'mortgage',
  'utilities',
  'electric',
  'water',
  'internet',
  'groceries',
  'food',
  'meals',
  'transit',
  'transport',
  'commute',
  'fuel',
  'tuition',
  'academic',
  'books',
  'healthcare',
  'medical',
  'insurance',
  'debt',
  'loan',
];

const SAVINGS_KEYWORDS = [
  'saving',
  'savings',
  'emergency',
  'reserve',
  'invest',
  'investment',
  'etf',
  'index',
  'treasury',
  'pension',
  'retirement',
];

/**
 * Infer 50/30/20 bucket classification ('NEEDS' | 'WANTS' | 'SAVINGS') from category label.
 * @param {string} category - Expense category name
 * @param {string} [explicitBucket] - Optional explicit override
 * @returns {'NEEDS' | 'WANTS' | 'SAVINGS'}
 */
export function classifyCategoryBucket(category, explicitBucket) {
  if (explicitBucket) {
    const upper = String(explicitBucket).trim().toUpperCase();
    if (BUCKET_TYPES[upper]) {
      return BUCKET_TYPES[upper];
    }
  }
  const lower = String(category || '').trim().toLowerCase();
  if (SAVINGS_KEYWORDS.some((kw) => lower.includes(kw))) {
    return BUCKET_TYPES.SAVINGS;
  }
  if (NEEDS_KEYWORDS.some((kw) => lower.includes(kw))) {
    return BUCKET_TYPES.NEEDS;
  }
  return BUCKET_TYPES.WANTS;
}

/**
 * Check if a category already exists in the ledger (case-insensitive).
 * @param {Array<{category: string}>} expenses - Existing expense items
 * @param {string} category - Candidate category name
 * @returns {boolean}
 */
export function isDuplicateCategory(expenses, category) {
  const target = String(category || '').trim().toLowerCase();
  if (!target) return false;
  return expenses.some((item) => String(item.category || '').trim().toLowerCase() === target);
}

/**
 * Validate and normalize an expense ledger entry.
 * @param {object} rawItem
 * @param {string} rawItem.category
 * @param {number} rawItem.amount
 * @param {string} [rawItem.bucket]
 * @returns {{category: string, amount: number, bucket: 'NEEDS'|'WANTS'|'SAVINGS'}}
 */
export function normalizeExpenseItem(rawItem) {
  const category = String(rawItem?.category || '').trim();
  if (!category) {
    throw new Error('Expense category name cannot be empty.');
  }
  const amount = Number(rawItem?.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Expense amount for "${category}" must be a non-negative number.`);
  }
  const bucket = classifyCategoryBucket(category, rawItem?.bucket);
  return {
    category,
    amount: Number(amount.toFixed(4)),
    bucket,
  };
}

/**
 * Compute comprehensive financial ledger analytics, burn rate, runway, and 50/30/20 audit.
 *
 * @param {object} input
 * @param {number} input.monthlyIncome - Monthly income inflow
 * @param {number} [input.cashReserve=0] - Liquid cash/savings reserve on hand
 * @param {string} [input.currency='USD'] - ISO currency code ('USD' | 'EUR' | 'IDR')
 * @param {Array<{category: string, amount: number, bucket?: string}>} [input.expenses=[]] - Ledger items
 * @returns {object} Complete deterministic financial report object
 */
export function analyzeFinancialLedger(input = {}) {
  const monthlyIncome = Number(input.monthlyIncome ?? 0);
  const cashReserve = Number(input.cashReserve ?? 0);
  const currency = String(input.currency || 'USD').toUpperCase();

  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    throw new Error('Monthly income must be a non-negative number.');
  }
  if (!Number.isFinite(cashReserve) || cashReserve < 0) {
    throw new Error('Cash reserve must be a non-negative number.');
  }

  const normalizedExpenses = (input.expenses || []).map(normalizeExpenseItem);

  const totalOutflow = normalizedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const explicitSavings = normalizedExpenses
    .filter((item) => item.bucket === BUCKET_TYPES.SAVINGS)
    .reduce((sum, item) => sum + item.amount, 0);

  // Gross Burn Rate represents total monthly expenditure across all ledger lines
  const grossBurnRate = Number(totalOutflow.toFixed(4));
  const dailyBurnRate = Number((grossBurnRate / DAYS_PER_MONTH).toFixed(4));

  // Net Cashflow (Surplus > 0, Breakeven == 0, Deficit < 0)
  const netCashflow = Number((monthlyIncome - grossBurnRate).toFixed(4));
  const netBurnRate = netCashflow < 0 ? Number(Math.abs(netCashflow).toFixed(4)) : 0;
  const dailyNetBurnRate = Number((netBurnRate / DAYS_PER_MONTH).toFixed(4));

  // Status classification
  let status = 'BREAKEVEN';
  if (netCashflow > 1e-6) {
    status = 'SURPLUS';
  } else if (netCashflow < -1e-6) {
    status = 'DEFICIT';
  }

  // Enrich and sort expense items descending by amount
  const sortedExpenses = [...normalizedExpenses]
    .sort((a, b) => b.amount - a.amount)
    .map((item, idx) => {
      const shareOfExpenses = grossBurnRate > 0 ? (item.amount / grossBurnRate) * 100 : 0;
      const shareOfIncome = monthlyIncome > 0 ? (item.amount / monthlyIncome) * 100 : 0;
      return {
        index: idx + 1,
        category: item.category,
        bucket: item.bucket,
        amount: item.amount,
        shareOfExpenses: Number(shareOfExpenses.toFixed(2)),
        shareOfIncome: Number(shareOfIncome.toFixed(2)),
      };
    });

  const highestExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

  // Expense-to-Income Ratio
  const expenseRatio =
    monthlyIncome > 0
      ? Number(((grossBurnRate / monthlyIncome) * 100).toFixed(2))
      : grossBurnRate > 0
        ? 100.0
        : 0.0;

  // Effective liquid buffer after current period surplus (for zero-income autonomy calculation)
  const effectiveLiquidBuffer =
    status === 'SURPLUS' ? cashReserve + netCashflow : cashReserve;

  // 1. Gross Runway: How many months/days liquid buffer sustains Gross Burn if income drops to 0
  const grossRunwayMonths =
    grossBurnRate > 0
      ? Number((effectiveLiquidBuffer / grossBurnRate).toFixed(2))
      : Infinity;
  const grossRunwayDays =
    grossBurnRate > 0
      ? Math.round((effectiveLiquidBuffer / grossBurnRate) * DAYS_PER_MONTH)
      : Infinity;

  // 2. Net Runway: How many months/days cash reserve lasts at current Net Burn (Deficit)
  const netRunwayMonths =
    netBurnRate > 0 ? Number((cashReserve / netBurnRate).toFixed(2)) : Infinity;
  const netRunwayDays =
    netBurnRate > 0 ? Math.round((cashReserve / netBurnRate) * DAYS_PER_MONTH) : Infinity;

  // Primary operational runway metric
  // In DEFICIT: primary urgency is Net Runway (when reserve hits 0 at current deficit).
  // In SURPLUS/BREAKEVEN: primary readout is Gross Autonomy Runway (months of expenses covered by buffer), while Net Runway is INFINITE.
  const primaryRunwayMonths = status === 'DEFICIT' ? netRunwayMonths : grossRunwayMonths;
  const primaryRunwayDays = status === 'DEFICIT' ? netRunwayDays : grossRunwayDays;
  const primaryRunwayMode =
    status === 'DEFICIT' ? 'DEFICIT_DEPLETION_HORIZON' : 'ZERO_INCOME_AUTONOMY';

  // 50/30/20 Rule Breakdown
  const needsTotal = normalizedExpenses
    .filter((e) => e.bucket === BUCKET_TYPES.NEEDS)
    .reduce((sum, e) => sum + e.amount, 0);

  const wantsTotal = normalizedExpenses
    .filter((e) => e.bucket === BUCKET_TYPES.WANTS)
    .reduce((sum, e) => sum + e.amount, 0);

  // Total savings capacity = explicit savings items + unallocated positive cashflow
  const unallocatedSurplus = netCashflow > 0 ? netCashflow : 0;
  const effectiveSavingsTotal = explicitSavings + unallocatedSurplus;

  const needsPct = monthlyIncome > 0 ? (needsTotal / monthlyIncome) * 100 : 0;
  const wantsPct = monthlyIncome > 0 ? (wantsTotal / monthlyIncome) * 100 : 0;
  const savingsPct = monthlyIncome > 0 ? (effectiveSavingsTotal / monthlyIncome) * 100 : 0;

  const rule503020 = {
    needs: {
      bucket: 'NEEDS',
      label: 'Essential Needs (50%)',
      amount: Number(needsTotal.toFixed(2)),
      actualPct: Number(needsPct.toFixed(2)),
      targetPct: RULE_50_30_20_TARGETS.NEEDS,
      targetAmount: Number((monthlyIncome * 0.5).toFixed(2)),
      variancePct: Number((needsPct - RULE_50_30_20_TARGETS.NEEDS).toFixed(2)),
      varianceAmount: Number((needsTotal - monthlyIncome * 0.5).toFixed(2)),
      status: needsPct <= RULE_50_30_20_TARGETS.NEEDS + 1e-6 ? 'OPTIMAL' : 'OVERBUDGET',
    },
    wants: {
      bucket: 'WANTS',
      label: 'Discretionary Wants (30%)',
      amount: Number(wantsTotal.toFixed(2)),
      actualPct: Number(wantsPct.toFixed(2)),
      targetPct: RULE_50_30_20_TARGETS.WANTS,
      targetAmount: Number((monthlyIncome * 0.3).toFixed(2)),
      variancePct: Number((wantsPct - RULE_50_30_20_TARGETS.WANTS).toFixed(2)),
      varianceAmount: Number((wantsTotal - monthlyIncome * 0.3).toFixed(2)),
      status: wantsPct <= RULE_50_30_20_TARGETS.WANTS + 1e-6 ? 'OPTIMAL' : 'OVERBUDGET',
    },
    savings: {
      bucket: 'SAVINGS',
      label: 'Savings & Reserve (20%)',
      amount: Number(effectiveSavingsTotal.toFixed(2)),
      actualPct: Number(savingsPct.toFixed(2)),
      targetPct: RULE_50_30_20_TARGETS.SAVINGS,
      targetAmount: Number((monthlyIncome * 0.2).toFixed(2)),
      variancePct: Number((savingsPct - RULE_50_30_20_TARGETS.SAVINGS).toFixed(2)),
      varianceAmount: Number((effectiveSavingsTotal - monthlyIncome * 0.2).toFixed(2)),
      status:
        status !== 'DEFICIT' && savingsPct >= RULE_50_30_20_TARGETS.SAVINGS - 1e-6
          ? 'OPTIMAL'
          : 'DEFICIT_OR_UNDERSAVED',
    },
  };

  // Generate institutional advisory directive
  let advisory = '';
  if (status === 'SURPLUS') {
    advisory = `SURPLUS POSITION (+${(100 - expenseRatio).toFixed(2)}% net margin). Cashflow is self-sustaining; allocate unencumbered surplus into liquid treasury reserves to extend zero-income autonomy beyond ${Number.isFinite(grossRunwayMonths) ? grossRunwayMonths.toFixed(1) : '∞'} months.`;
  } else if (status === 'BREAKEVEN') {
    advisory = `ZERO-MARGIN POSITION (100.00% burn ratio). Operating expenses consume 100% of monthly inflow. Reduce discretionary wants by at least 20% to establish a structural capital buffer.`;
  } else {
    const runwayText = Number.isFinite(netRunwayDays)
      ? `${netRunwayMonths.toFixed(2)} months (${netRunwayDays} days)`
      : 'immediate exhaustion';
    advisory = `DEFICIT ALERT (-${(expenseRatio - 100).toFixed(2)}% overburn). Net burn depletes liquid reserve in ${runwayText}. Immediately contract discretionary outflow or expand monthly revenue to restore equilibrium.`;
  }

  return {
    currency,
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    cashReserve: Number(cashReserve.toFixed(2)),
    grossBurnRate: Number(grossBurnRate.toFixed(2)),
    dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
    netCashflow: Number(netCashflow.toFixed(2)),
    netBurnRate: Number(netBurnRate.toFixed(2)),
    dailyNetBurnRate: Number(dailyNetBurnRate.toFixed(2)),
    expenseRatio,
    status,
    runway: {
      primaryMonths: primaryRunwayMonths,
      primaryDays: primaryRunwayDays,
      primaryMode: primaryRunwayMode,
      grossMonths: grossRunwayMonths,
      grossDays: grossRunwayDays,
      netMonths: netRunwayMonths,
      netDays: netRunwayDays,
      effectiveLiquidBuffer: Number(effectiveLiquidBuffer.toFixed(2)),
    },
    rule503020,
    expenses: sortedExpenses,
    highestExpense,
    advisory,
  };
}
