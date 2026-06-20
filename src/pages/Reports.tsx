import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney } from '../utils/format';
import { Card } from '../components/ui';
import { sumByType, isInPeriod } from '../utils/calc';

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EC4899', '#7C3AED', '#06B6D4', '#EF4444', '#F97316'];

export function Reports() {
  const { operations, categories, accounts } = useFinanceStore();
  const now = new Date();

  // По месяцам за 6 месяцев
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const ops = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
    return {
      name: MONTHS[d.getMonth()],
      Доходы: sumByType(ops, 'income'),
      Расходы: sumByType(ops, 'expense'),
    };
  });

  // По категориям за текущий месяц
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end) && o.type === 'expense');
  const byCat: Record<string, number> = {};
  monthOps.forEach(o => {
    const cat = categories.find(c => c.id === o.categoryId)?.name || 'Прочее';
    byCat[cat] = (byCat[cat] || 0) + o.amount;
  });
  const catData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // По счетам
  const accountData = accounts.map(a => ({ name: a.name, value: Math.max(0, a.balance), color: a.color }));

  const totalIncome6 = monthlyData.reduce((s, m) => s + m.Доходы, 0);
  const totalExpense6 = monthlyData.reduce((s, m) => s + m.Расходы, 0);
  const avgMonthly = Math.round(totalExpense6 / 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Отчёты</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Доходы за 6 мес.</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{formatMoney(totalIncome6)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Расходы за 6 мес.</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(totalExpense6)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Средние расходы/мес</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(avgMonthly)}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>Доходы и расходы по месяцам</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => `${Math.round(v/1000)}к`} />
              <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
              <Legend />
              <Bar dataKey="Доходы" fill="#16A34A" radius={[4,4,0,0]} />
              <Bar dataKey="Расходы" fill="#DC2626" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>Баланс по счетам</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={accountData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name }) => name} labelLine={false}>
                {accountData.map((a, i) => <Cell key={i} fill={a.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {accountData.map(a => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, display: 'inline-block' }} />
                  {a.name}
                </span>
                <span style={{ fontWeight: 600 }}>{formatMoney(a.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>Расходы по категориям в этом месяце</div>
        {catData.length > 0 ? (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
              {catData.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1, color: 'var(--text2)' }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{formatMoney(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Нет данных за месяц</p>
        )}
      </Card>
    </div>
  );
}
