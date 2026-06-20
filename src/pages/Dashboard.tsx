import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney } from '../utils/format';
import { getTotalBalance, sumByType, getMonthRange, isInPeriod, calcFinHealth, daysUntilEmpty } from '../utils/calc';
import { Card, GaugeInline, ProgressBar, Badge } from '../components/ui';
import styles from './Dashboard.module.css';

const HEALTH_LABELS: Record<string, string> = {
  finState: 'Общее', money: 'Деньги', budget: 'Бюджет', debt: 'Долги', savings: 'Накопления'
};

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { accounts, operations, goals, budget, recommendations, categories } = useFinanceStore();

  const totalBalance = getTotalBalance(accounts);
  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
  const monthIncome = sumByType(monthOps, 'income');
  const monthExpense = sumByType(monthOps, 'expense');
  const health = calcFinHealth(accounts, operations, budget);
  const days = daysUntilEmpty(accounts, operations);

  // Расходы по категориям для пирога
  const expOps = monthOps.filter(o => o.type === 'expense');
  const byCat: Record<string, number> = {};
  expOps.forEach(o => {
    const name = categories.find(c => c.id === o.categoryId)?.name || 'Прочее';
    byCat[name] = (byCat[name] || 0) + o.amount;
  });
  const pieData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EC4899', '#7C3AED'];

  // Последние операции
  const recent = [...operations].filter(o => !o.isDeleted).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Мини-график тренда
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const dayOps = operations.filter(o => !o.isDeleted && new Date(o.date).toDateString() === d.toDateString());
    return { name: ds, расходы: sumByType(dayOps, 'expense'), доходы: sumByType(dayOps, 'income') };
  });

  const recIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle size={14} color="var(--warning)" />;
    if (type === 'success') return <CheckCircle size={14} color="var(--success)" />;
    return <Lightbulb size={14} color="var(--primary)" />;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Главная</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => onNavigate('operations')}>
          <Plus size={16} /> Добавить операцию
        </button>
      </div>

      {/* Cashflow warning */}
      {days !== null && days < 30 && (
        <div className={styles.alert}>
          <AlertTriangle size={16} />
          <span>⚠️ При текущем темпе трат деньги закончатся через <strong>{days} дней</strong>. Пора сократить расходы!</span>
        </div>
      )}

      {/* KPI row */}
      <div className={styles.kpiRow}>
        <Card className={styles.kpiCard} style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginBottom: 4 }}>Общий баланс</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>{formatMoney(totalBalance)}</div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, marginTop: 4 }}>{accounts.length} счетов</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Доходы за месяц</div>
          <div style={{ color: 'var(--success)', fontSize: 24, fontWeight: 700 }}>{formatMoney(monthIncome)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--success)', fontSize: 12 }}>
            <TrendingUp size={13} /> +8% к прошлому месяцу
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Расходы за месяц</div>
          <div style={{ color: 'var(--danger)', fontSize: 24, fontWeight: 700 }}>{formatMoney(monthExpense)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: monthExpense > monthIncome ? 'var(--danger)' : 'var(--text2)', fontSize: 12 }}>
            <TrendingDown size={13} /> {monthIncome > 0 ? Math.round(monthExpense / monthIncome * 100) : 0}% от доходов
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Экономия</div>
          <div style={{ color: monthIncome - monthExpense >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 24, fontWeight: 700 }}>
            {formatMoney(monthIncome - monthExpense)}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>
            Норма сбережений: {monthIncome > 0 ? Math.round((1 - monthExpense / monthIncome) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Middle row */}
      <div className={styles.midRow}>
        {/* Financial health */}
        <Card style={{ flex: 1 }}>
          <div className={styles.cardTitle}>Финансовое здоровье</div>
          <div className={styles.gaugeRow}>
            {(Object.keys(health) as (keyof typeof health)[]).map(k => (
              <GaugeInline key={k} value={health[k]} label={HEALTH_LABELS[k]} />
            ))}
          </div>
        </Card>

        {/* Pie */}
        <Card style={{ flex: 1 }}>
          <div className={styles.cardTitle}>Расходы по категориям</div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pieData.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text3)', fontSize: 13, paddingTop: 20 }}>Нет операций за месяц</p>
          )}
        </Card>

        {/* Recommendations */}
        <Card style={{ flex: 1 }}>
          <div className={styles.cardTitle}>Советы и рекомендации</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map(r => (
              <div key={r.id} style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: r.type === 'warning' ? 'var(--warning-light)' : r.type === 'success' ? 'var(--success-light)' : 'var(--primary-light)',
                borderLeft: `3px solid ${r.type === 'warning' ? 'var(--warning)' : r.type === 'success' ? 'var(--success)' : 'var(--primary)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {recIcon(r.type)}
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{r.title}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow}>
        {/* Trend chart */}
        <Card style={{ flex: 2 }}>
          <div className={styles.cardTitle}>Тренд за 7 дней</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => v > 999 ? `${Math.round(v/1000)}к` : String(v)} />
              <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
              <Area type="monotone" dataKey="доходы" stroke="#16A34A" fill="url(#inc)" strokeWidth={2} />
              <Area type="monotone" dataKey="расходы" stroke="#DC2626" fill="url(#exp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent ops */}
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className={styles.cardTitle} style={{ marginBottom: 0 }}>Последние операции</span>
            <button style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }} onClick={() => onNavigate('operations')}>Все</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(op => {
              const cat = categories.find(c => c.id === op.categoryId);
              const acc = accounts.find(a => a.id === op.accountId);
              return (
                <div key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {cat?.icon || '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {op.comment || cat?.name || 'Операция'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{acc?.name} · {new Date(op.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: op.type === 'income' ? 'var(--success)' : op.type === 'transfer' ? 'var(--text2)' : 'var(--danger)', flexShrink: 0 }}>
                    {op.type === 'income' ? '+' : op.type === 'transfer' ? '→' : '-'}{formatMoney(op.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Goals */}
        <Card style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className={styles.cardTitle} style={{ marginBottom: 0 }}>Цели</span>
            <button style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }} onClick={() => onNavigate('budget')}>Все</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {goals.slice(0, 3).map(g => {
              const pct = Math.round(g.currentAmount / g.targetAmount * 100);
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{g.icon} {g.title}</span>
                    <Badge color={g.color} bg={g.color + '22'}>{pct}%</Badge>
                  </div>
                  <ProgressBar value={pct} color={g.color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--text2)' }}>
                    <span>{formatMoney(g.currentAmount)}</span>
                    <span>{formatMoney(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
