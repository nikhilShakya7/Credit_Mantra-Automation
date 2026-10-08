export const apiPayloads = {
  minimalValid: [
    { date: '2026-06-01', description: 'SALARY CREDIT CO', amount: 85000.0, type: 'CREDIT' as const },
    { date: '2026-06-03', description: 'HOUSE RENT DEBIT', amount: 20000.0, type: 'DEBIT' as const },
    { date: '2026-06-05', description: 'EMI LOAN REPAYMENT', amount: 12000.0, type: 'DEBIT' as const },
  ],
  empty: [] as any[],
  nonArray: { bad: 1 },
  badType: [{ date: '2026-06-01', description: 'X', amount: 'abc' as any, type: 'DEBIT' as const }],
  missingDate: [{ description: 'X', amount: 100, type: 'DEBIT' as const }],
  badTypeEnum: [{ date: '2026-06-01', description: 'X', amount: 100, type: 'INVALID' as const }],
  tiny: [
    { date: '2026-06-01', description: 'SALARY', amount: 30000, type: 'CREDIT' as const },
    { date: '2026-06-02', description: 'RENT', amount: 10000, type: 'DEBIT' as const },
  ],
};
