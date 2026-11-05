/**
 * @file ledgerView.js
 * @description DOM rendering and interactive state controller for the Runway Swiss Minimalist Ledger UI.
 */

import { convertCurrency, formatCurrency } from '../core/currency.js';
import { formatRunwayHorizon, generateTextAuditReport } from '../core/exporter.js';
import { analyzeFinancialLedger, isDuplicateCategory } from '../core/runwayEngine.js';
import { SIMULATION_SCENARIOS } from '../core/scenarios.js';

export class LedgerAppController {
  constructor() {
    const initial = SIMULATION_SCENARIOS.SURPLUS_USD;
    this.state = {
      scenarioId: initial.id,
      currency: initial.currency,
      monthlyIncome: initial.monthlyIncome,
      cashReserve: initial.cashReserve,
      expenses: initial.expenses.map((item) => ({ ...item })),
    };
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.syncInputsFromState();
    this.render();
  }

  cacheElements() {
    this.elScenarioSelect = document.getElementById('scenario-select');
    this.elCurrencySelect = document.getElementById('currency-select');
    this.elExportBtn = document.getElementById('export-txt-btn');

    this.elInputIncome = document.getElementById('input-income');
    this.elInputReserve = document.getElementById('input-reserve');
    this.elActiveCurrencyTag = document.getElementById('active-currency-tag');

    // KPI 01: Runway
    this.elRunwayBadge = document.getElementById('kpi-runway-badge');
    this.elRunwayPrimary = document.getElementById('kpi-runway-primary');
    this.elRunwayDays = document.getElementById('kpi-runway-days');
    this.elRunwayGross = document.getElementById('kpi-runway-gross');
    this.elRunwayNet = document.getElementById('kpi-runway-net');

    // KPI 02: Burn Rate
    this.elBurnRatioBadge = document.getElementById('kpi-burn-ratio-badge');
    this.elGrossBurn = document.getElementById('kpi-gross-burn');
    this.elDailyBurn = document.getElementById('kpi-daily-burn');
    this.elNetBurn = document.getElementById('kpi-net-burn');
    this.elPeakDriver = document.getElementById('kpi-peak-driver');

    // KPI 03: Net Cashflow
    this.elStatusBadge = document.getElementById('kpi-status-badge');
    this.elNetCashflow = document.getElementById('kpi-net-cashflow');
    this.elMonthlyIncome = document.getElementById('kpi-monthly-income');
    this.elNetMargin = document.getElementById('kpi-net-margin');
    this.elCategoryCount = document.getElementById('kpi-category-count');

    // KPI 04: Reserve
    this.elCashReserve = document.getElementById('kpi-cash-reserve');
    this.elEffectiveBuffer = document.getElementById('kpi-effective-buffer');
    this.elSavingsRate = document.getElementById('kpi-savings-rate');
    this.elRuleCompliance = document.getElementById('kpi-rule-compliance');

    // Tables & Forms
    this.elRuleTbody = document.getElementById('rule-503020-tbody');
    this.elRuleBars = document.getElementById('rule-bars-container');
    this.elLedgerTbody = document.getElementById('expense-ledger-tbody');
    this.elLedgerTfoot = document.getElementById('expense-ledger-tfoot');

    this.elAddForm = document.getElementById('add-expense-form');
    this.elExpenseCategory = document.getElementById('expense-category');
    this.elExpenseBucket = document.getElementById('expense-bucket');
    this.elExpenseAmount = document.getElementById('expense-amount');
    this.elFormError = document.getElementById('form-error-msg');

    // Advisory & Raw Audit
    this.elAdvisoryCode = document.getElementById('advisory-status-code');
    this.elAdvisoryBanner = document.getElementById('advisory-banner');
    this.elRawAuditOutput = document.getElementById('raw-audit-output');
  }

  bindEvents() {
    this.elScenarioSelect.addEventListener('change', (e) => {
      this.loadScenario(e.target.value);
    });

    this.elCurrencySelect.addEventListener('change', (e) => {
      this.switchCurrency(e.target.value);
    });

    this.elInputIncome.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.state.monthlyIncome = Number.isFinite(val) && val >= 0 ? val : 0;
      this.render();
    });

    this.elInputReserve.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.state.cashReserve = Number.isFinite(val) && val >= 0 ? val : 0;
      this.render();
    });

    this.elAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddExpense();
    });

    this.elLedgerTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-category]');
      if (btn) {
        const category = btn.getAttribute('data-delete-category');
        this.deleteExpense(category);
      }
    });

    this.elExportBtn.addEventListener('click', () => {
      this.exportReportFile();
    });
  }

  loadScenario(scenarioId) {
    const preset = SIMULATION_SCENARIOS[scenarioId];
    if (!preset) return;

    this.state = {
      scenarioId: preset.id,
      currency: preset.currency,
      monthlyIncome: preset.monthlyIncome,
      cashReserve: preset.cashReserve,
      expenses: preset.expenses.map((item) => ({ ...item })),
    };

    this.hideFormError();
    this.syncInputsFromState();
    this.render();
  }

  switchCurrency(targetCurrency) {
    const prevCurrency = this.state.currency;
    if (prevCurrency === targetCurrency) return;

    const roundForCcy = (val, ccy) =>
      ccy === 'IDR' ? Math.round(val) : Number(val.toFixed(2));

    this.state.monthlyIncome = roundForCcy(
      convertCurrency(this.state.monthlyIncome, prevCurrency, targetCurrency),
      targetCurrency
    );
    this.state.cashReserve = roundForCcy(
      convertCurrency(this.state.cashReserve, prevCurrency, targetCurrency),
      targetCurrency
    );
    this.state.expenses = this.state.expenses.map((item) => ({
      ...item,
      amount: roundForCcy(
        convertCurrency(item.amount, prevCurrency, targetCurrency),
        targetCurrency
      ),
    }));
    this.state.currency = targetCurrency;

    this.syncInputsFromState();
    this.render();
  }

  syncInputsFromState() {
    this.elScenarioSelect.value = this.state.scenarioId;
    this.elCurrencySelect.value = this.state.currency;
    this.elInputIncome.value = this.state.monthlyIncome;
    this.elInputReserve.value = this.state.cashReserve;
    this.elActiveCurrencyTag.textContent = `CCY: ${this.state.currency}`;
  }

  showFormError(msg) {
    this.elFormError.textContent = msg;
    this.elFormError.hidden = false;
  }

  hideFormError() {
    this.elFormError.textContent = '';
    this.elFormError.hidden = true;
  }

  handleAddExpense() {
    this.hideFormError();
    const category = this.elExpenseCategory.value.trim();
    const bucket = this.elExpenseBucket.value;
    const amount = parseFloat(this.elExpenseAmount.value);

    if (!category) {
      this.showFormError('ERROR: Category identifier cannot be empty.');
      return;
    }
    if (isDuplicateCategory(this.state.expenses, category)) {
      this.showFormError(`ERROR: Category "${category}" already exists in ledger.`);
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      this.showFormError('ERROR: Monthly outflow must be a valid non-negative number.');
      return;
    }

    this.state.expenses.push({ category, amount, bucket });
    this.elExpenseCategory.value = '';
    this.elExpenseAmount.value = '';
    this.render();
  }

  deleteExpense(category) {
    this.state.expenses = this.state.expenses.filter(
      (item) => item.category.toLowerCase() !== String(category).toLowerCase()
    );
    this.render();
  }

  exportReportFile() {
    const report = analyzeFinancialLedger(this.state);
    const text = generateTextAuditReport(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway_audit_${report.currency.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  render() {
    const report = analyzeFinancialLedger(this.state);
    const ccy = report.currency;
    const isSurplus = report.status === 'SURPLUS';
    const isDeficit = report.status === 'DEFICIT';

    // KPI 01: Financial Runway
    const primaryMonths = report.runway.primaryMonths;
    const primaryDays = report.runway.primaryDays;
    this.elRunwayPrimary.textContent = Number.isFinite(primaryMonths)
      ? `${primaryMonths.toFixed(2)} MO`
      : '∞ MO';
    this.elRunwayPrimary.className = `kpi-value tabular ${
      isDeficit ? 'text-deficit' : 'text-surplus'
    }`;

    this.elRunwayBadge.textContent = isDeficit ? 'DEPLETING' : 'AUTONOMOUS';
    this.elRunwayBadge.className = `status-pill ${
      isDeficit ? 'status-deficit' : 'status-surplus'
    }`;

    this.elRunwayDays.textContent = Number.isFinite(primaryDays)
      ? `${primaryDays} DAYS`
      : 'INFINITE';
    this.elRunwayGross.textContent = formatRunwayHorizon(
      report.runway.grossMonths,
      report.runway.grossDays
    );
    this.elRunwayNet.textContent = formatRunwayHorizon(
      report.runway.netMonths,
      report.runway.netDays
    );

    // KPI 02: Monthly Burn Rate
    this.elBurnRatioBadge.textContent = `${report.expenseRatio.toFixed(2)}% OF INC`;
    this.elBurnRatioBadge.className = `status-pill ${
      report.expenseRatio > 100 ? 'status-deficit' : 'status-surplus'
    }`;
    this.elGrossBurn.textContent = formatCurrency(report.grossBurnRate, ccy);
    this.elDailyBurn.textContent = `${formatCurrency(report.dailyBurnRate, ccy)} / DAY`;
    this.elNetBurn.textContent =
      report.netBurnRate > 0
        ? `${formatCurrency(report.netBurnRate, ccy)} / MO`
        : `${formatCurrency(0, ccy)} (NONE)`;
    this.elPeakDriver.textContent = report.highestExpense
      ? `${report.highestExpense.category} (${report.highestExpense.shareOfExpenses.toFixed(1)}%)`
      : 'NONE';

    // KPI 03: Net Monthly Cashflow
    this.elStatusBadge.textContent = report.status;
    this.elStatusBadge.className = `status-pill ${
      isDeficit ? 'status-deficit' : isSurplus ? 'status-surplus' : 'status-neutral'
    }`;
    this.elNetCashflow.textContent = formatCurrency(report.netCashflow, ccy, {
      showPlus: true,
    });
    this.elNetCashflow.className = `kpi-value tabular ${
      isDeficit ? 'text-deficit' : isSurplus ? 'text-surplus' : 'text-primary'
    }`;
    this.elMonthlyIncome.textContent = formatCurrency(report.monthlyIncome, ccy);
    const netMarginPct = 100 - report.expenseRatio;
    this.elNetMargin.textContent = `${netMarginPct >= 0 ? '+' : ''}${netMarginPct.toFixed(2)}%`;
    this.elCategoryCount.textContent = `${report.expenses.length} ITEMS`;

    // KPI 04: Liquid Reserve
    this.elCashReserve.textContent = formatCurrency(report.cashReserve, ccy);
    this.elEffectiveBuffer.textContent = formatCurrency(
      report.runway.effectiveLiquidBuffer,
      ccy
    );
    this.elSavingsRate.textContent = `${report.rule503020.savings.actualPct.toFixed(2)}%`;

    const allOptimal =
      report.rule503020.needs.status === 'OPTIMAL' &&
      report.rule503020.wants.status === 'OPTIMAL' &&
      report.rule503020.savings.status === 'OPTIMAL';
    this.elRuleCompliance.textContent = allOptimal ? 'OPTIMAL (3/3)' : 'VARIANCE ALERT';
    this.elRuleCompliance.className = allOptimal ? 'text-surplus' : 'text-deficit';

    // Render 50/30/20 Table & Bars
    this.renderRule503020(report);

    // Render Expense Ledger Table
    this.renderExpenseLedger(report);

    // Render Advisory & Plaintext Report
    this.elAdvisoryCode.textContent = `STATE: ${report.status}`;
    this.elAdvisoryBanner.textContent = report.advisory;
    this.elAdvisoryBanner.className = `advisory-box ${
      isDeficit ? 'advisory-deficit' : 'advisory-surplus'
    }`;
    this.elRawAuditOutput.textContent = generateTextAuditReport(report);
  }

  renderRule503020(report) {
    const ccy = report.currency;
    const buckets = [
      report.rule503020.needs,
      report.rule503020.wants,
      report.rule503020.savings,
    ];

    this.elRuleTbody.innerHTML = buckets
      .map((b) => {
        const isOptimal = b.status === 'OPTIMAL';
        const badgeClass = isOptimal ? 'status-surplus' : 'status-deficit';
        const badgeText = isOptimal ? 'OK' : 'WARN';
        const varSign = b.variancePct > 0 ? '+' : '';
        return `
          <tr>
            <td>${b.bucket}</td>
            <td class="num-col">${formatCurrency(b.amount, ccy)}</td>
            <td class="num-col">${b.actualPct.toFixed(2)}%</td>
            <td class="num-col">${b.targetPct.toFixed(0)}%</td>
            <td class="num-col ${isOptimal ? 'text-surplus' : 'text-deficit'}">${varSign}${b.variancePct.toFixed(2)}%</td>
            <td class="status-col"><span class="status-pill ${badgeClass}">${badgeText}</span></td>
          </tr>
        `;
      })
      .join('');

    this.elRuleBars.innerHTML = buckets
      .map((b) => {
        const isOptimal = b.status === 'OPTIMAL';
        const fillWidth = Math.min(100, Math.max(0, b.actualPct));
        const fillClass = isOptimal ? 'fill-surplus' : 'fill-deficit';
        return `
          <div class="rule-bar-item">
            <div class="rule-bar-header tabular">
              <span>${b.label}</span>
              <span>${b.actualPct.toFixed(1)}% / ${b.targetPct.toFixed(0)}% TARGET</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill ${fillClass}" style="width: ${fillWidth}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderExpenseLedger(report) {
    const ccy = report.currency;
    if (report.expenses.length === 0) {
      this.elLedgerTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
            NO EXPENSE LINE ITEMS RECORDED IN CURRENT LEDGER
          </td>
        </tr>
      `;
    } else {
      this.elLedgerTbody.innerHTML = report.expenses
        .map((item) => {
          const idx = String(item.index).padStart(2, '0');
          const barWidth = Math.min(100, Math.max(2, item.shareOfExpenses));
          const fillClass =
            item.bucket === 'SAVINGS'
              ? 'fill-surplus'
              : item.shareOfIncome > 35
                ? 'fill-deficit'
                : '';

          return `
            <tr>
              <td class="idx-col">${idx}</td>
              <td>${this.escapeHtml(item.category)}</td>
              <td><span class="bucket-tag">${item.bucket}</span></td>
              <td class="num-col">${formatCurrency(item.amount, ccy)}</td>
              <td class="num-col">${item.shareOfExpenses.toFixed(2)}%</td>
              <td class="num-col">${item.shareOfIncome.toFixed(2)}%</td>
              <td class="bar-col">
                <div class="meter-track">
                  <div class="meter-fill ${fillClass}" style="width: ${barWidth}%"></div>
                </div>
              </td>
              <td class="act-col">
                <button type="button" class="del-btn" data-delete-category="${this.escapeHtml(item.category)}">DEL</button>
              </td>
            </tr>
          `;
        })
        .join('');
    }

    this.elLedgerTfoot.innerHTML = `
      <tr>
        <td colspan="3">TOTAL MONTHLY OUTFLOW (BURN RATE)</td>
        <td class="num-col">${formatCurrency(report.grossBurnRate, ccy)}</td>
        <td class="num-col">100.00%</td>
        <td class="num-col ${report.expenseRatio > 100 ? 'text-deficit' : 'text-surplus'}">${report.expenseRatio.toFixed(2)}%</td>
        <td colspan="2"></td>
      </tr>
    `;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
