import type { Account, Operation, BudgetItem, FinHealthIndicators } from '../types';

export function getTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function sumByType(ops: Operation[], type: 'income' | 'expense'): number {
  return ops.filter(o => o.type === type && !o.isDeleted).reduce((s, o) => s + o.amount, 0);
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function isInPeriod(iso: string, start: Date, end: Date): boolean {
  const d = new Date(iso);
  return d >= start && d <= end;
}

export function calcFinHealth(
  accounts: Account[],
  operations: Operation[],
  budget: BudgetItem[]
): FinHealthIndicators {
  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
  const income = sumByType(monthOps, 'income');
  const expense = sumByType(monthOps, 'expense');
  const totalBalance = getTotalBalance(accounts);

  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const totalPlanned = budget.reduce((s, b) => s + b.planned, 0);
  const budgetExecution = totalPlanned > 0 ? expense / totalPlanned : 1;
  const totalDebt = accounts.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(a.balance), 0);
  const debtRatio = income > 0 ? totalDebt / (income * 12) : 0;

  const finState = Math.min(100, Math.max(0, Math.round(50 + savingsRate * 100)));
  const money = Math.min(100, Math.max(0, Math.round((totalBalance / Math.max(expense * 3, 1)) * 100)));
  const budget_ = Math.min(100, Math.max(0, Math.round((1 - Math.max(0, budgetExecution - 1)) * 100)));
  const debt = Math.min(100, Math.max(0, Math.round((1 - Math.min(debtRatio, 1)) * 100)));
  const savings = Math.min(100, Math.max(0, Math.round(savingsRate * 200)));

  return { finState, money, budget: budget_, debt, savings };
}

export function daysUntilEmpty(accounts: Account[], operations: Operation[]): number | null {
  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
  const expense = sumByType(monthOps, 'expense');
  const dailySpend = expense / Math.max(new Date().getDate(), 1);
  if (dailySpend <= 0) return null;
  return Math.floor(getTotalBalance(accounts) / dailySpend);
}
