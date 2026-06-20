import type { Account, Category, Operation, Goal } from '../types';

const now = new Date();
const mo = (d: number) => new Date(now.getFullYear(), now.getMonth(), d).toISOString();

export const demoAccounts: Account[] = [
  { id: 'a1', name: 'Наличные', balance: 25000, currency: 'RUB', type: 'cash', color: '#16A34A' },
  { id: 'a2', name: 'Сбербанк', balance: 148500, currency: 'RUB', type: 'card', color: '#1E40AF' },
  { id: 'a3', name: 'Тинькофф', balance: 62300, currency: 'RUB', type: 'card', color: '#F59E0B' },
];

export const demoCategories: Category[] = [
  { id: 'c1', name: 'Продукты', type: 'expense', icon: '🛒', color: '#16A34A' },
  { id: 'c2', name: 'Транспорт', type: 'expense', icon: '🚇', color: '#3B82F6' },
  { id: 'c3', name: 'Кафе и рестораны', type: 'expense', icon: '☕', color: '#F97316' },
  { id: 'c4', name: 'Жильё', type: 'expense', icon: '🏠', color: '#8B5CF6' },
  { id: 'c5', name: 'Развлечения', type: 'expense', icon: '🎬', color: '#EC4899' },
  { id: 'c6', name: 'Здоровье', type: 'expense', icon: '💊', color: '#EF4444' },
  { id: 'c7', name: 'Одежда', type: 'expense', icon: '👕', color: '#06B6D4' },
  { id: 'c8', name: 'Зарплата', type: 'income', icon: '💼', color: '#16A34A' },
  { id: 'c9', name: 'Подработка', type: 'income', icon: '💡', color: '#0EA5E9' },
  { id: 'c10', name: 'Прочее', type: 'expense', icon: '📦', color: '#6B7280' },
];

export const demoOperations: Operation[] = [
  { id: 'o1', type: 'income', amount: 120000, currency: 'RUB', date: mo(5), accountId: 'a2', categoryId: 'c8', comment: 'Зарплата' },
  { id: 'o2', type: 'expense', amount: 4500, currency: 'RUB', date: mo(6), accountId: 'a2', categoryId: 'c1', comment: 'Пятёрочка' },
  { id: 'o3', type: 'expense', amount: 2800, currency: 'RUB', date: mo(7), accountId: 'a3', categoryId: 'c3', comment: 'Ужин' },
  { id: 'o4', type: 'expense', amount: 5200, currency: 'RUB', date: mo(8), accountId: 'a2', categoryId: 'c2', comment: 'Проездной' },
  { id: 'o5', type: 'expense', amount: 45000, currency: 'RUB', date: mo(1), accountId: 'a2', categoryId: 'c4', comment: 'Аренда квартиры' },
  { id: 'o6', type: 'income', amount: 15000, currency: 'RUB', date: mo(10), accountId: 'a3', categoryId: 'c9', comment: 'Фриланс' },
  { id: 'o7', type: 'expense', amount: 3200, currency: 'RUB', date: mo(11), accountId: 'a3', categoryId: 'c3', comment: 'Кофе и выпечка' },
  { id: 'o8', type: 'expense', amount: 8900, currency: 'RUB', date: mo(12), accountId: 'a2', categoryId: 'c7', comment: 'Джинсы' },
  { id: 'o9', type: 'expense', amount: 1800, currency: 'RUB', date: mo(13), accountId: 'a1', categoryId: 'c6', comment: 'Аптека' },
  { id: 'o10', type: 'expense', amount: 2100, currency: 'RUB', date: mo(14), accountId: 'a3', categoryId: 'c5', comment: 'Кино' },
  { id: 'o11', type: 'expense', amount: 6300, currency: 'RUB', date: mo(15), accountId: 'a2', categoryId: 'c1', comment: 'ВкусВилл' },
  { id: 'o12', type: 'expense', amount: 950, currency: 'RUB', date: mo(16), accountId: 'a3', categoryId: 'c2', comment: 'Такси' },
  { id: 'o13', type: 'expense', amount: 3400, currency: 'RUB', date: mo(17), accountId: 'a2', categoryId: 'c3', comment: 'Обед с коллегами' },
  { id: 'o14', type: 'transfer', amount: 10000, currency: 'RUB', date: mo(18), accountId: 'a2', toAccountId: 'a1', comment: 'Перевод наличные' },
  { id: 'o15', type: 'expense', amount: 12500, currency: 'RUB', date: mo(19), accountId: 'a2', categoryId: 'c7', comment: 'Кроссовки' },
];

export const demoGoals: Goal[] = [
  { id: 'g1', title: 'Финансовая подушка', targetAmount: 300000, currentAmount: 97000, deadline: new Date(now.getFullYear(), now.getMonth() + 10, 1).toISOString(), icon: '🛡️', color: '#16A34A', monthlyRecommendation: 20300 },
  { id: 'g2', title: 'Отпуск в Испании', targetAmount: 120000, currentAmount: 45000, deadline: new Date(now.getFullYear(), now.getMonth() + 5, 1).toISOString(), icon: '✈️', color: '#0EA5E9', monthlyRecommendation: 15000 },
  { id: 'g3', title: 'Новый ноутбук', targetAmount: 150000, currentAmount: 30000, deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(), icon: '💻', color: '#7C3AED', monthlyRecommendation: 30000 },
];
