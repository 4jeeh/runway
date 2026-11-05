/**
 * @file main.js
 * @description Browser entry point for the Runway Swiss Minimalist Financial Ledger.
 */

import { LedgerAppController } from './ui/ledgerView.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new LedgerAppController();
  app.init();
});
