import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Category, Operation, Goal, BudgetItem, Recommendation } from '../types';
import {
  demoAccounts, demoCategories, demoOperations, demoGoals
} from '../utils/demo';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  operations: Operation[];
  goals: Goal[];
  budget: BudgetItem[];
  recommendations: Recommendation[];
  isDemoMode: boolean;

  addOperation: (op: Omit<Operation, 'id'>) => void;
  deleteOperation: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  resetToDemo: () => void;
}

const makeId = () => Math.random().toString(36).slice(2);

const demoBudget: BudgetItem[] = [
  { categoryId: 'c1', planned: 15000, actual: 0 },
  { categoryId: 'c2', planned: 6000, actual: 0 },
  { categoryId: 'c3', planned: 8000, actual: 0 },
  { categoryId: 'c4', planned: 45000, actual: 0 },
  { categoryId: 'c5', planned: 5000, actual: 0 },
];

const demoRecs: Recommendation[] = [
  { id: 'r1', type: 'warning', title: 'Кафе и рестораны: превышение', body: 'В этом месяце вы потратили на 42% больше запланированного на еду вне дома.' },
  { id: 'r2', type: 'tip', title: 'Откладывайте сразу', body: 'Переводите 10% от дохода на накопительный счёт в день зарплаты.' },
  { id: 'r3', type: 'success', title: 'Подушка растёт', body: 'Вы на 32% пути к финансовой подушке безопасности. Так держать!' },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, _get) => ({
      accounts: demoAccounts,
      categories: demoCategories,
      operations: demoOperations,
      goals: demoGoals,
      budget: demoBudget,
      recommendations: demoRecs,
      isDemoMode: true,

      addOperation: (op) => {
        const newOp: Operation = { ...op, id: makeId() };
        set(s => {
          const accounts = s.accounts.map(a => {
            if (a.id === op.accountId) {
              const delta = op.type === 'income' ? op.amount : op.type === 'expense' ? -op.amount : -op.amount;
              return { ...a, balance: a.balance + delta };
            }
            if (op.toAccountId && a.id === op.toAccountId) {
              return { ...a, balance: a.balance + op.amount };
            }
            return a;
          });
          return { operations: [...s.operations, newOp], accounts };
        });
      },

      deleteOperation: (id) => {
        set(s => ({
          operations: s.operations.map(o => o.id === id ? { ...o, isDeleted: true } : o),
        }));
      },

      addGoal: (goal) => {
        const newGoal: Goal = { ...goal, id: makeId() };
        set(s => ({ goals: [...s.goals, newGoal] }));
      },

      updateGoal: (id, patch) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...patch } : g) }));
      },

      resetToDemo: () => {
        set({
          accounts: demoAccounts,
          categories: demoCategories,
          operations: demoOperations,
          goals: demoGoals,
          budget: demoBudget,
          recommendations: demoRecs,
          isDemoMode: true,
        });
      },
    }),
    { name: 'ef-web-finance' }
  )
);
