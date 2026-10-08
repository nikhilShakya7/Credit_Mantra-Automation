export const calculators = {
  emi: {
    defaults: { principal: 1000000, rate: 12.0, tenureYrs: 5 },
    clamp: {
      underMinPrincipal: 10000, // server clamps to 25000? UI JS clamps on blur
      overMaxPrincipal: 999999999,
    },
  },
  dti: {
    cases: [
      { income: 80000, debts: 12000, expected: { percent: 15.0, badge: 'Excellent / Low Debt' } },
      { income: 80000, debts: 28800, expected: { percent: 36.0, badge: 'Moderate Debt Ratio' } },
      { income: 80000, debts: 40000, expected: { percent: 50.0, badge: 'High Debt Burden' } },
      { income: 80000, debts: 60000, expected: { percent: 75.0, badge: 'Critical Debt Levels' } },
    ],
  },
  tax: {
    monthsClampInput: 15,
    ssfOverLimit: 600000,
  },
  affordability: {
    example: { incomeMonthly: 120000, existingDebt: 15000, downPayment: 500000 },
  },
};
