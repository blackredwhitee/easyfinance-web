import { useState } from 'react';
import { X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney, formatDate } from '../utils/format';
import { Card } from '../components/ui';
import { sumByType, isInPeriod } from '../utils/calc';
import type { Operation } from '../types';

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EC4899', '#7C3AED', '#06B6D4', '#EF4444', '#F97316'];

interface DrillDown { title: string; ops: Operation[] }

function DrillPanel({ drill, onClose, categories, accounts }: { drill: DrillDown; onClose: () => void; categories: any[]; accounts: any[] }) {
  const income = drill.ops.filter(o => o.type === 'income').reduce((s, o) => s + o.amount, 0);
  const expense = drill.ops.filter(o => o.type === 'expense').reduce((s, o) => s + o.amount, 0);
  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-md)', zIndex: 100, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{drill.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{drill.ops.length} операций</div>
        </div>
        <button onClick={onClose} style={{ padding: 6, borderRadius: 8, color: 'var(--text2)' }}><X size={18} /></button>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '12px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        {income > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Доходы</div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>{formatMoney(income)}</div>
          </div>
        )}
        {expense > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Расходы</div>
            <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 15 }}>{formatMoney(expense)}</div>
          </div>
        )}
        {income > 0 && expense > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Итого</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: income - expense >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatMoney(income - expense)}</div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {drill.ops.length === 0
          ? <p style={{ color: 'var(--text3)', padding: '20px 0', fontSize: 13 }}>Нет операций</p>
          : drill.ops.map(op => {
              const cat = categories.find((c: any) => c.id === op.categoryId);
              const acc = accounts.find((a: any) => a.id === op.accountId);
              const isIncome = op.type === 'income';
              const isTransfer = op.type === 'transfer';
              return (
                <div key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {cat?.icon || '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {op.comment || cat?.name || 'Операция'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {acc?.name} · {cat?.name || '—'} · {formatDate(op.date)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isIncome ? 'var(--success)' : isTransfer ? 'var(--text2)' : 'var(--danger)', flexShrink: 0 }}>
                    {isIncome ? '+' : isTransfer ? '↔' : '−'}{formatMoney(op.amount)}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

export function Reports() {
  const { operations, categories, accounts } = useFinanceStore();
  const [drill, setDrill] = useState<DrillDown | null>(null);
  const now = new Date();

  // Данные по 6 месяцам
  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { label: MONTHS[d.getMonth()], start, end, year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyData = monthRanges.map(r => {
    const ops = operations.filter(o => !o.isDeleted && isInPeriod(o.date, r.start, r.end));
    return { name: r.label, Доходы: sumByType(ops, 'income'), Расходы: sumByType(ops, 'expense') };
  });

  const onBarClick = (data: any) => {
    if (!data?.activeLabel) return;
    const range = monthRanges.find(r => r.label === data.activeLabel);
    if (!range) return;
    const ops = operations.filter(o => !o.isDeleted && isInPeriod(o.date, range.start, range.end))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!ops.length) return;
    setDrill({ title: `${range.label} ${range.year}`, ops });
  };

  // Данные по категориям текущего месяца
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end) && o.type === 'expense');
  const byCat: Record<string, number> = {};
  monthOps.forEach(o => {
    const cat = categories.find(c => c.id === o.categoryId)?.name || 'Прочее';
    byCat[cat] = (byCat[cat] || 0) + o.amount;
  });
  const catData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const onCatClick = (data: any) => {
    const catName = data?.name || data?.payload?.name;
    if (!catName) return;
    const ops = monthOps.filter(o => (categories.find(c => c.id === o.categoryId)?.name || 'Прочее') === catName)
      .sort((a, b) => b.amount - a.amount);
    setDrill({ title: `Категория: ${catName}`, ops });
  };

  const accountData = accounts.map(a => ({ name: a.name, value: Math.max(0, a.balance), color: a.color }));

  const totalIncome6 = monthlyData.reduce((s, m) => s + m.Доходы, 0);
  const totalExpense6 = monthlyData.reduce((s, m) => s + m.Расходы, 0);
  const avgMonthly = Math.round(totalExpense6 / 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', flex: 1 }}>
      {drill && <DrillPanel drill={drill} onClose={() => setDrill(null)} categories={categories} accounts={accounts} />}

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
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
            Доходы и расходы по месяцам
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Кликните по столбцу для просмотра операций</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} onClick={onBarClick} style={{ cursor: 'pointer' }}>
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
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
          Расходы по категориям в этом месяце
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Кликните по сектору или названию для просмотра операций</div>
        {catData.length > 0 ? (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={88}
                  dataKey="value" paddingAngle={2}
                  onClick={onCatClick} style={{ cursor: 'pointer' }}
                >
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catData.map((item, i) => (
                <div
                  key={item.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background .1s' }}
                  onClick={() => onCatClick(item)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatMoney(item.value)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 32, textAlign: 'right' }}>
                    {Math.round(item.value / catData.reduce((s, c) => s + c.value, 0) * 100)}%
                  </span>
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
