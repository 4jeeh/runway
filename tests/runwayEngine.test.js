/**
 * @file runwayEngine.test.js
 * @description Automated verification test suite for Runway financial engine,
 * multi-currency formatting/conversion, 50/30/20 allocation rule, and runway calculations.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { convertCurrency, formatCurrency } from '../src/core/currency.js';
import { generateTextAuditReport } from '../src/core/exporter.js';
import {
  analyzeFinancialLedger,
  classifyCategoryBucket,
  isDuplicateCategory,
} from '../src/core/runwayEngine.js';
import { SIMULATION_SCENARIOS } from '../src/core/scenarios.js';

test('Multi-currency formatting produces deterministic tabular strings for USD, EUR, and IDR', () => {
  assert.equal(formatCurrency(5000, 'USD'), '$5,000.00');
  assert.equal(formatCurrency(1400, 'USD', { showPlus: true }), '+$1,400.00');
  assert.equal(formatCurrency(-800, 'USD'), '-$800.00');
  assert.equal(formatCurrency(4400.5, 'EUR'), '€4.400,50');
  assert.equal(formatCurrency(6500000, 'IDR'), 'Rp6.500.000,00');
});

test('Multi-currency conversion accurately translates across USD, EUR, and IDR', () => {
  const usdToEur = convertCurrency(1000, 'USD', 'EUR');
  assert.equal(usdToEur, 920);

  const usdToIdr = convertCurrency(100, 'USD', 'IDR');
  assert.equal(usdToIdr, 1585000);

  const roundTrip = convertCurrency(usdToIdr, 'IDR', 'USD');
  assert.equal(roundTrip, 100);
});

test('Scenario 01 (Surplus: Income > Expenses) computes accurate burn rate, runway, and 50/30/20 metrics', () => {
  const report = analyzeFinancialLedger(SIMULATION_SCENARIOS.SURPLUS_USD);

  assert.equal(report.status, 'SURPLUS');
  assert.equal(report.monthlyIncome, 5000.0);
  assert.equal(report.grossBurnRate, 3600.0);
  assert.equal(report.dailyBurnRate, 120.0);
  assert.equal(report.netCashflow, 1400.0);
  assert.equal(report.netBurnRate, 0);
  assert.equal(report.expenseRatio, 72.0);

  // Effective liquid buffer = 18,000 + 1,400 surplus = 19,400
  // Gross Runway = 19,400 / 3,600 = 5.39 months (162 days)
  assert.equal(report.runway.effectiveLiquidBuffer, 19400.0);
  assert.equal(report.runway.grossMonths, 5.39);
  assert.equal(report.runway.grossDays, 162);
  assert.equal(report.runway.netMonths, Infinity);

  // 50/30/20 Rule verification:
  // Needs = 1450 + 520 + 230 = 2200 (44.00% <= 50% -> OPTIMAL)
  // Wants = 380 + 420 = 800 (16.00% <= 30% -> OPTIMAL)
  // Savings = 600 explicit + 1400 surplus = 2000 (40.00% >= 20% -> OPTIMAL)
  assert.equal(report.rule503020.needs.amount, 2200.0);
  assert.equal(report.rule503020.needs.actualPct, 44.0);
  assert.equal(report.rule503020.needs.status, 'OPTIMAL');

  assert.equal(report.rule503020.wants.amount, 800.0);
  assert.equal(report.rule503020.wants.actualPct, 16.0);
  assert.equal(report.rule503020.wants.status, 'OPTIMAL');

  assert.equal(report.rule503020.savings.amount, 2000.0);
  assert.equal(report.rule503020.savings.actualPct, 40.0);
  assert.equal(report.rule503020.savings.status, 'OPTIMAL');
});

test('Scenario 02 (Deficit: Expenses > Income) computes accurate net burn and reserve depletion runway', () => {
  const report = analyzeFinancialLedger(SIMULATION_SCENARIOS.DEFICIT_USD);

  assert.equal(report.status, 'DEFICIT');
  assert.equal(report.monthlyIncome, 3200.0);
  assert.equal(report.grossBurnRate, 4000.0);
  assert.equal(report.dailyBurnRate, 133.33);
  assert.equal(report.netCashflow, -800.0);
  assert.equal(report.netBurnRate, 800.0);
  assert.equal(report.expenseRatio, 125.0);

  // Deficit Net Runway: Reserve 4,800 / Net Burn 800 = 6.00 months (180 days)
  // Zero-Income Gross Runway: Reserve 4,800 / Gross Burn 4,000 = 1.20 months (36 days)
  assert.equal(report.runway.netMonths, 6.0);
  assert.equal(report.runway.netDays, 180);
  assert.equal(report.runway.grossMonths, 1.2);
  assert.equal(report.runway.grossDays, 36);
  assert.equal(report.runway.primaryMonths, 6.0);
  assert.equal(report.runway.primaryDays, 180);

  // Needs = 1650 + 540 + 390 = 2580 (80.63% > 50% -> OVERBUDGET)
  // Wants = 780 + 340 + 300 = 1420 (44.38% > 30% -> OVERBUDGET)
  assert.equal(report.rule503020.needs.status, 'OVERBUDGET');
  assert.equal(report.rule503020.wants.status, 'OVERBUDGET');
  assert.equal(report.rule503020.savings.status, 'DEFICIT_OR_UNDERSAVED');
});

test('Duplicate category detection and bucket inference work accurately', () => {
  const items = [{ category: 'Housing & Utilities', amount: 1000 }];
  assert.equal(isDuplicateCategory(items, 'housing & utilities'), true);
  assert.equal(isDuplicateCategory(items, 'Dining Out'), false);

  assert.equal(classifyCategoryBucket('Monthly Rent'), 'NEEDS');
  assert.equal(classifyCategoryBucket('Emergency Savings'), 'SAVINGS');
  assert.equal(classifyCategoryBucket('Concert Tickets'), 'WANTS');
});

test('Plaintext audit report exporter produces complete structured table output', () => {
  const report = analyzeFinancialLedger(SIMULATION_SCENARIOS.ACADEMIC_IDR);
  const txt = generateTextAuditReport(report);
  assert.match(txt, /RUNWAY \/\/ SWISS MINIMALIST FINANCIAL LEDGER/);
  assert.match(txt, /Boarding House \(Kost\)/);
  assert.match(txt, /50\/30\/20 ALLOCATION BENCHMARK/);
});
