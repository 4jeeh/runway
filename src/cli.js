/**
 * @file cli.js
 * @description Command-line simulation runner for Runway.
 * Executes deterministic financial simulations across Surplus (Income > Expenses),
 * Deficit (Expenses > Income), and Multi-Currency (USD, EUR, IDR) scenarios.
 */

import { generateTextAuditReport } from './core/exporter.js';
import { analyzeFinancialLedger } from './core/runwayEngine.js';
import { SIMULATION_SCENARIOS } from './core/scenarios.js';

function runSimulationSuite() {
  const scenarioKeys = ['SURPLUS_USD', 'DEFICIT_USD', 'ACADEMIC_IDR', 'CONTINENTAL_EUR'];

  for (const key of scenarioKeys) {
    const scenario = SIMULATION_SCENARIOS[key];
    const report = analyzeFinancialLedger(scenario);
    console.log(`\n>>> EXECUTING ${scenario.name}`);
    console.log(`>>> ${scenario.description}\n`);
    console.log(generateTextAuditReport(report));
  }
}

runSimulationSuite();
