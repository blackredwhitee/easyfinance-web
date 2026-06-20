import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Category, Operation, Goal, BudgetItem, Recommendation } from '../types';
import { demoAccounts, demoCategories, demoOperations, demoGoals } from '../utils/demo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  operations: Operation[];
  goals: Goal[];
  budget: BudgetItem[];
  recommendations: Recommendation[];
  isDemoMode: boolean;
  syncing: boolean;

  loadFromSupabase: () => Promise<void>;
  addOperation: (op: Omit<Operation, 'id'>) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
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

// Маппинг snake_case → camelCase из Supabase
function mapAccount(r: any): Account {
  return { id: r.id, name: r.name, balance: r.balance, currency: r.currency, type: r.type, color: r.color };
}
function mapCategory(r: any): Category {
  return { id: r.id, name: r.name, type: r.type, icon: r.icon, color: r.color };
}
function mapOperation(r: any): Operation {
  return {
    id: r.id, type: r.type, amount: r.amount, currency: r.currency,
    date: r.date, accountId: r.account_id, toAccountId: r.to_account_id ?? undefined,
    categoryId: r.category_id ?? undefined, comment: r.comment ?? undefined,
    isDeleted: r.is_deleted ?? false,
  };
}
function mapGoal(r: any): Goal {
  return {
    id: r.id, title: r.title, targetAmount: r.target_amount, currentAmount: r.current_amount,
    deadline: r.deadline, icon: r.icon, color: r.color,
    monthlyRecommendation: r.monthly_recommendation ?? undefined,
  };
}
function mapBudget(r: any): BudgetItem {
  return { categoryId: r.category_id, planned: r.planned, actual: 0 };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      accounts: demoAccounts,
      categories: demoCategories,
      operations: demoOperations,
      goals: demoGoals,
      budget: demoBudget,
      recommendations: demoRecs,
      isDemoMode: true,
      syncing: false,

      loadFromSupabase: async () => {
        if (!isSupabaseConfigured) return;
        set({ syncing: true });
        try {
          const [
            { data: accounts },
            { data: categories },
            { data: operations },
            { data: goals },
            { data: budget },
          ] = await Promise.all([
            supabase.from('accounts').select('*').order('created_at'),
            supabase.from('categories').select('*').order('created_at'),
            supabase.from('operations').select('*').order('date', { ascending: false }),
            supabase.from('goals').select('*').order('created_at'),
            supabase.from('budget_items').select('*'),
          ]);

          let finalAccounts = accounts?.map(mapAccount) ?? [];
          let finalCategories = categories?.map(mapCategory) ?? demoCategories;

          // Новый пользователь — заполняем дефолтные данные
          if (accounts && accounts.length === 0) {
            const defaultAccs = demoAccounts.map(a => ({
              name: a.name, balance: a.balance, currency: a.currency, type: a.type, color: a.color,
            }));
            const { data: insertedAccs } = await supabase.from('accounts').insert(defaultAccs).select();
            if (insertedAccs) finalAccounts = insertedAccs.map(mapAccount);
          }

          if (categories && categories.length === 0) {
            const defaultCats = demoCategories.map(c => ({
              name: c.name, type: c.type, icon: c.icon, color: c.color,
            }));
            const { data: insertedCats } = await supabase.from('categories').insert(defaultCats).select();
            if (insertedCats) finalCategories = insertedCats.map(mapCategory);
          }

          set({
            accounts: finalAccounts,
            categories: finalCategories,
            operations: operations?.map(mapOperation) ?? [],
            goals: goals?.map(mapGoal) ?? [],
            budget: budget?.map(mapBudget) ?? demoBudget,
            isDemoMode: false, syncing: false,
          });
        } catch {
          set({ syncing: false });
        }
      },

      addOperation: async (op) => {
        if (get().isDemoMode || !isSupabaseConfigured) {
          // Demo mode: local only
          const newOp: Operation = { ...op, id: makeId() };
          set(s => {
            const accounts = s.accounts.map(a => {
              if (a.id === op.accountId) {
                const delta = op.type === 'income' ? op.amount : -op.amount;
                return { ...a, balance: a.balance + delta };
              }
              if (op.toAccountId && a.id === op.toAccountId) return { ...a, balance: a.balance + op.amount };
              return a;
            });
            return { operations: [newOp, ...s.operations], accounts };
          });
          return;
        }

        const { data, error } = await supabase.from('operations').insert({
          type: op.type, amount: op.amount, currency: op.currency,
          date: op.date, account_id: op.accountId,
          to_account_id: op.toAccountId ?? null,
          category_id: op.categoryId ?? null,
          comment: op.comment ?? null,
        }).select().single();

        if (!error && data) {
          set(s => ({ operations: [mapOperation(data), ...s.operations] }));
          // Обновляем баланс счёта
          const acc = get().accounts.find(a => a.id === op.accountId);
          if (acc) {
            const delta = op.type === 'income' ? op.amount : -op.amount;
            await supabase.from('accounts').update({ balance: acc.balance + delta }).eq('id', acc.id);
            set(s => ({ accounts: s.accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance + delta } : a) }));
          }
          if (op.toAccountId) {
            const toAcc = get().accounts.find(a => a.id === op.toAccountId);
            if (toAcc) {
              await supabase.from('accounts').update({ balance: toAcc.balance + op.amount }).eq('id', toAcc.id);
              set(s => ({ accounts: s.accounts.map(a => a.id === toAcc.id ? { ...a, balance: a.balance + op.amount } : a) }));
            }
          }
        }
      },

      deleteOperation: async (id) => {
        if (get().isDemoMode || !isSupabaseConfigured) {
          set(s => ({ operations: s.operations.map(o => o.id === id ? { ...o, isDeleted: true } : o) }));
          return;
        }
        await supabase.from('operations').update({ is_deleted: true }).eq('id', id);
        set(s => ({ operations: s.operations.map(o => o.id === id ? { ...o, isDeleted: true } : o) }));
      },

      addGoal: async (goal) => {
        if (get().isDemoMode || !isSupabaseConfigured) {
          set(s => ({ goals: [...s.goals, { ...goal, id: makeId() }] }));
          return;
        }
        const { data } = await supabase.from('goals').insert({
          title: goal.title, target_amount: goal.targetAmount, current_amount: goal.currentAmount,
          deadline: goal.deadline, icon: goal.icon, color: goal.color,
          monthly_recommendation: goal.monthlyRecommendation ?? null,
        }).select().single();
        if (data) set(s => ({ goals: [...s.goals, mapGoal(data)] }));
      },

      updateGoal: async (id, patch) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...patch } : g) }));
        if (!get().isDemoMode && isSupabaseConfigured) {
          const dbPatch: any = {};
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.targetAmount !== undefined) dbPatch.target_amount = patch.targetAmount;
          if (patch.currentAmount !== undefined) dbPatch.current_amount = patch.currentAmount;
          if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline;
          await supabase.from('goals').update(dbPatch).eq('id', id);
        }
      },

      resetToDemo: () => {
        set({
          accounts: demoAccounts, categories: demoCategories,
          operations: demoOperations, goals: demoGoals,
          budget: demoBudget, recommendations: demoRecs,
          isDemoMode: true,
        });
      },
    }),
    { name: 'ef-web-finance' }
  )
);
