/**
 * @file scenarios.js
 * @description Canonical financial ledger simulation presets for Runway.
 * Covers Surplus (Income > Expenses), Deficit (Expenses > Income), and Multi-Currency (USD, EUR, IDR).
 */

export const SIMULATION_SCENARIOS = Object.freeze({
  SURPLUS_USD: {
    id: 'SURPLUS_USD',
    name: 'SCENARIO 01 // SURPLUS LEDGER (USD)',
    description: 'Disciplined cashflow (Income > Expenses) with 50/30/20 compliance and extended runway.',
    currency: 'USD',
    monthlyIncome: 5000.0,
    cashReserve: 18000.0,
    expenses: [
      { category: 'Housing & Utilities', amount: 1450.0, bucket: 'NEEDS' },
      { category: 'Groceries & Nutrition', amount: 520.0, bucket: 'NEEDS' },
      { category: 'Transit & Commute', amount: 230.0, bucket: 'NEEDS' },
      { category: 'Cloud & Workstation', amount: 380.0, bucket: 'WANTS' },
      { category: 'Dining & Hospitality', amount: 420.0, bucket: 'WANTS' },
      { category: 'Index ETF & Treasury', amount: 600.0, bucket: 'SAVINGS' },
    ],
  },
  DEFICIT_USD: {
    id: 'DEFICIT_USD',
    name: 'SCENARIO 02 // DEFICIT STRESS (USD)',
    description: 'Overbudget burn rate (Expenses > Income) triggering reserve depletion countdown.',
    currency: 'USD',
    monthlyIncome: 3200.0,
    cashReserve: 4800.0,
    expenses: [
      { category: 'Studio Apartment Lease', amount: 1650.0, bucket: 'NEEDS' },
      { category: 'Groceries & Provisions', amount: 540.0, bucket: 'NEEDS' },
      { category: 'Dining & Nightlife', amount: 780.0, bucket: 'WANTS' },
      { category: 'SaaS & Media Subscriptions', amount: 340.0, bucket: 'WANTS' },
      { category: 'Urban Transit & Rideshare', amount: 390.0, bucket: 'NEEDS' },
      { category: 'Hardware Financing', amount: 300.0, bucket: 'WANTS' },
    ],
  },
  ACADEMIC_IDR: {
    id: 'ACADEMIC_IDR',
    name: 'SCENARIO 03 // HERITAGE CAMPUS LEDGER (IDR)',
    description: 'Modernized Indonesian Rupiah (IDR) student treasury ledger with 50/30/20 allocation.',
    currency: 'IDR',
    monthlyIncome: 6500000.0,
    cashReserve: 19500000.0,
    expenses: [
      { category: 'Boarding House (Kost)', amount: 1750000.0, bucket: 'NEEDS' },
      { category: 'Daily Meals & Groceries', amount: 1200000.0, bucket: 'NEEDS' },
      { category: 'Academic & Lab Materials', amount: 300000.0, bucket: 'NEEDS' },
      { category: 'Campus Transit & Fuel', amount: 350000.0, bucket: 'NEEDS' },
      { category: 'Coffee & Social Dining', amount: 650000.0, bucket: 'WANTS' },
      { category: 'Digital Subscriptions', amount: 250000.0, bucket: 'WANTS' },
    ],
  },
  CONTINENTAL_EUR: {
    id: 'CONTINENTAL_EUR',
    name: 'SCENARIO 04 // CONTINENTAL LEDGER (EUR)',
    description: 'Eurozone operating budget demonstrating multi-currency tabular ledger precision.',
    currency: 'EUR',
    monthlyIncome: 4400.0,
    cashReserve: 15400.0,
    expenses: [
      { category: 'Apartment Rent & Heating', amount: 1380.0, bucket: 'NEEDS' },
      { category: 'Supermarket & Provisions', amount: 460.0, bucket: 'NEEDS' },
      { category: 'Rail Pass & Mobility', amount: 180.0, bucket: 'NEEDS' },
      { category: 'Cultural & Dining Out', amount: 520.0, bucket: 'WANTS' },
      { category: 'Software & Equipment', amount: 260.0, bucket: 'WANTS' },
      { category: 'Emergency Reserve Transfer', amount: 500.0, bucket: 'SAVINGS' },
    ],
  },
});
