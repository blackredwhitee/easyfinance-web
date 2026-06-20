export type OperationType = 'income' | 'expense' | 'transfer';
export type Currency = 'RUB' | 'USD' | 'EUR';

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
  type: 'cash' | 'card' | 'deposit' | 'credit';
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Operation {
  id: string;
  type: OperationType;
  amount: number;
  currency: Currency;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  comment?: string;
  isDeleted?: boolean;
}

export interface BudgetItem {
  categoryId: string;
  planned: number;
  actual: number;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  monthlyRecommendation?: number;
}

export interface Recommendation {
  id: string;
  type: 'warning' | 'tip' | 'success';
  title: string;
  body: string;
}

export interface FinHealthIndicators {
  finState: number;
  money: number;
  budget: number;
  debt: number;
  savings: number;
}
