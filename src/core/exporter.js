/**
 * @file exporter.js
 * @description Audit report generator for Runway.
 * Produces structured Swiss-grid plaintext reports (.txt) and JSON/CSV payloads.
 */

import { formatCurrency } from './currency.js';

/**
 * Format runway months/days into a clean institutional string.
 * @param {number} months
 * @param {number} days
 * @returns {string}
 */
export function formatRunwayHorizon(months, days) {
  if (!Number.isFinite(months) || !Number.isFinite(days)) {
    return 'INFINITE (SELF-SUSTAINING)';
  }
  return `${months.toFixed(2)} MO (${days} DAYS)`;
}

/**
 * Generate a Swiss Minimalist plaintext financial audit report (evolution of Laporan_Keuangan.txt).
 * @param {object} report - Output of analyzeFinancialLedger()
 * @returns {string} Formatted ASCII/UTF-8 ledger report
 */
export function generateTextAuditReport(report) {
  const ccy = report.currency;
  const line = '='.repeat(86);
  const thin = '-'.repeat(86);

  const rows = [];
  rows.push(line);
  rows.push('RUNWAY // SWISS MINIMALIST FINANCIAL LEDGER & RUNWAY AUDIT REPORT');
  rows.push(`CURRENCY: ${ccy} | STATUS: ${report.status} | BURN RATIO: ${report.expenseRatio.toFixed(2)}%`);
  rows.push(line);
  rows.push('');
  rows.push('1.0 EXECUTIVE TELEMETRY');
  rows.push(thin);
  rows.push(
    `Monthly Income Inflow      : ${formatCurrency(report.monthlyIncome, ccy).padStart(20)}`
  );
  rows.push(
    `Liquid Cash Reserve        : ${formatCurrency(report.cashReserve, ccy).padStart(20)}`
  );
  rows.push(
    `Monthly Gross Burn Rate    : ${formatCurrency(report.grossBurnRate, ccy).padStart(20)}  (${formatCurrency(report.dailyBurnRate, ccy)}/day)`
  );
  rows.push(
    `Net Monthly Cashflow       : ${formatCurrency(report.netCashflow, ccy, { showPlus: true }).padStart(20)}`
  );
  rows.push(
    `Zero-Income Gross Runway   : ${formatRunwayHorizon(report.runway.grossMonths, report.runway.grossDays).padStart(20)}`
  );
  rows.push(
    `Deficit Depletion Runway   : ${formatRunwayHorizon(report.runway.netMonths, report.runway.netDays).padStart(20)}`
  );
  rows.push('');
  rows.push('2.0 CATEGORIZED EXPENSE LEDGER');
  rows.push(thin);
  rows.push(
    `${'IDX'.padEnd(5)}${'CATEGORY'.padEnd(28)}${'BUCKET'.padEnd(10)}${'AMOUNT'.padStart(18)}${'% BURN'.padStart(12)}${'% INC'.padStart(13)}`
  );
  rows.push(thin);

  for (const item of report.expenses) {
    const idxStr = String(item.index).padStart(2, '0').padEnd(5);
    const catStr = item.category.slice(0, 26).padEnd(28);
    const bktStr = item.bucket.padEnd(10);
    const amtStr = formatCurrency(item.amount, ccy).padStart(18);
    const burnStr = `${item.shareOfExpenses.toFixed(2)}%`.padStart(12);
    const incStr = `${item.shareOfIncome.toFixed(2)}%`.padStart(13);
    rows.push(`${idxStr}${catStr}${bktStr}${amtStr}${burnStr}${incStr}`);
  }

  rows.push(thin);
  rows.push('');
  rows.push('3.0 50/30/20 ALLOCATION BENCHMARK');
  rows.push(thin);
  rows.push(
    `${'BUCKET'.padEnd(26)}${'ACTUAL'.padStart(18)}${'SHARE'.padStart(10)}${'TARGET'.padStart(10)}${'VARIANCE'.padStart(10)}${'STATUS'.padStart(12)}`
  );
  rows.push(thin);

  for (const key of ['needs', 'wants', 'savings']) {
    const b = report.rule503020[key];
    const sign = b.variancePct > 0 ? '+' : '';
    const statusLabel = b.status === 'DEFICIT_OR_UNDERSAVED' ? 'UNDERSAVED' : b.status;
    rows.push(
      `${b.label.padEnd(26)}${formatCurrency(b.amount, ccy).padStart(18)}${`${b.actualPct.toFixed(2)}%`.padStart(10)}${`${b.targetPct.toFixed(2)}%`.padStart(10)}${`${sign}${b.variancePct.toFixed(2)}%`.padStart(10)}${statusLabel.padStart(12)}`
    );
  }

  rows.push(thin);
  rows.push('');
  rows.push('4.0 ADVISORY DIRECTIVE');
  rows.push(thin);
  rows.push(report.advisory);
  rows.push(line);

  return rows.join('\n');
}
