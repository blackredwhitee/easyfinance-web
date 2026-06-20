import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney, formatDateFull } from '../utils/format';
import { Card, ProgressBar, Badge } from '../components/ui';
import { getMonthRange, isInPeriod } from '../utils/calc';
import styles from './Budget.module.css';

const POPULAR = [
  { title: 'Финансовая подушка', target: 300000, months: 12, icon: '🛡️', color: '#16A34A' },
  { title: 'Отпуск', target: 100000, months: 6, icon: '✈️', color: '#0EA5E9' },
  { title: 'Автомобиль', target: 1000000, months: 36, icon: '🚗', color: '#3B82F6' },
  { title: 'Квартира', target: 3000000, months: 60, icon: '🏠', color: '#8B5CF6' },
  { title: 'Ноутбук', target: 150000, months: 6, icon: '💻', color: '#7C3AED' },
  { title: 'Образование', target: 200000, months: 12, icon: '🎓', color: '#F59E0B' },
];

export function Budget() {
  const { budget, categories, operations, goals, addGoal } = useFinanceStore();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [form, setForm] = useState({ title: '', targetAmount: '', currentAmount: '', months: '12', icon: '🎯', color: '#2563EB' });

  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end) && o.type === 'expense');

  const budgetWithActual = budget.map(b => {
    const actual = monthOps.filter(o => o.categoryId === b.categoryId).reduce((s, o) => s + o.amount, 0);
    const cat = categories.find(c => c.id === b.categoryId);
    return { ...b, actual, cat };
  });

  const totalPlanned = budget.reduce((s, b) => s + b.planned, 0);
  const totalActual = budgetWithActual.reduce((s, b) => s + b.actual, 0);

  const onSaveGoal = () => {
    if (!form.title || !form.targetAmount) return;
    const months = Number(form.months) || 12;
    const deadline = new Date(); deadline.setMonth(deadline.getMonth() + months);
    const remaining = Number(form.targetAmount) - Number(form.currentAmount || 0);
    addGoal({
      title: form.title,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount || 0),
      deadline: deadline.toISOString(),
      icon: form.icon,
      color: form.color,
      monthlyRecommendation: Math.ceil(remaining / months),
    });
    setShowGoalForm(false);
    setForm({ title: '', targetAmount: '', currentAmount: '', months: '12', icon: '🎯', color: '#2563EB' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Бюджет и цели</h1>
      </div>

      <div className={styles.cols}>
        {/* Budget */}
        <div className={styles.col}>
          <Card>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Бюджет на месяц</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {formatMoney(totalActual)} / {formatMoney(totalPlanned)}
              </span>
            </div>
            <ProgressBar
              value={totalPlanned > 0 ? totalActual / totalPlanned * 100 : 0}
              color={totalActual > totalPlanned ? 'var(--danger)' : 'var(--primary)'}
              height={8}
            />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {budgetWithActual.map(b => {
                const pct = b.planned > 0 ? Math.round(b.actual / b.planned * 100) : 0;
                const over = b.actual > b.planned;
                return (
                  <div key={b.categoryId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{b.cat?.icon} {b.cat?.name || 'Категория'}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: over ? 'var(--danger)' : 'var(--text2)' }}>
                          {formatMoney(b.actual)} / {formatMoney(b.planned)}
                        </span>
                        {over && <Badge color="var(--danger)" bg="var(--danger-light)">+{pct - 100}%</Badge>}
                      </div>
                    </div>
                    <ProgressBar value={Math.min(pct, 100)} color={over ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)'} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Goals */}
        <div className={styles.col}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className={styles.sectionTitle}>Финансовые цели</span>
            <button className={styles.addBtn} onClick={() => setShowGoalForm(!showGoalForm)}>
              <Plus size={14} /> Новая цель
            </button>
          </div>

          {showGoalForm && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Популярные шаблоны</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {POPULAR.map(p => (
                  <button key={p.title} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: p.color + '18', color: p.color,
                    border: `1px solid ${p.color}44`, borderRadius: 20,
                    padding: '4px 10px', fontSize: 12, fontWeight: 500,
                  }} onClick={() => setForm(f => ({ ...f, title: p.title, targetAmount: String(p.target), months: String(p.months), icon: p.icon, color: p.color }))}>
                    {p.icon} {p.title}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={styles.input} style={{ gridColumn: '1/-1' }} />
                <input type="number" placeholder="Сумма цели, ₽" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} className={styles.input} />
                <input type="number" placeholder="Уже накоплено, ₽" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} className={styles.input} />
                <input type="number" placeholder="Срок, месяцев" value={form.months} onChange={e => setForm(f => ({ ...f, months: e.target.value }))} className={styles.input} />
                <input placeholder="Иконка (эмодзи)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className={styles.input} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className={styles.addBtn} onClick={onSaveGoal}>Создать</button>
                <button className={styles.cancelBtn} onClick={() => setShowGoalForm(false)}>Отмена</button>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goals.map(g => {
              const pct = Math.round(g.currentAmount / g.targetAmount * 100);
              const remaining = g.targetAmount - g.currentAmount;
              const deadline = new Date(g.deadline);
              const monthsLeft = Math.max(0, (deadline.getFullYear() - new Date().getFullYear()) * 12 + deadline.getMonth() - new Date().getMonth());
              return (
                <Card key={g.id} style={{ borderLeft: `3px solid ${g.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{g.icon} {g.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>до {formatDateFull(g.deadline)}</div>
                    </div>
                    <Badge color={g.color} bg={g.color + '22'}>{pct}%</Badge>
                  </div>
                  <ProgressBar value={pct} color={g.color} height={8} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text2)' }}>Накоплено: <strong>{formatMoney(g.currentAmount)}</strong></span>
                    <span style={{ color: 'var(--text2)' }}>Осталось: <strong>{formatMoney(remaining)}</strong></span>
                  </div>
                  {g.monthlyRecommendation && (
                    <div style={{ marginTop: 6, fontSize: 11, color: g.color, fontWeight: 500 }}>
                      💡 Откладывать {formatMoney(g.monthlyRecommendation)}/мес · осталось {monthsLeft} мес.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
