import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney } from '../utils/format';
import { Card } from '../components/ui';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function Calendar() {
  const { operations, categories } = useFinanceStore();
  const [curr, setCurr] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = curr.getFullYear();
  const month = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const opsByDay: Record<string, typeof operations> = {};
  operations.filter(o => !o.isDeleted).forEach(o => {
    const d = new Date(o.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = String(d.getDate());
      opsByDay[key] = [...(opsByDay[key] || []), o];
    }
  });

  const selectedOps = selected ? (opsByDay[selected] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, flex: 1 }}>Календарь</h1>
        <button onClick={() => setCurr(new Date(year, month - 1, 1))} style={{ padding: 6, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{MONTHS_RU[month]} {year}</span>
        <button onClick={() => setCurr(new Date(year, month + 1, 1))} style={{ padding: 6, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`e${i}`} style={{ minHeight: 80, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = String(day);
              const dayOps = opsByDay[key] || [];
              const income = dayOps.filter(o => o.type === 'income').reduce((s, o) => s + o.amount, 0);
              const expense = dayOps.filter(o => o.type === 'expense').reduce((s, o) => s + o.amount, 0);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isSel = selected === key;
              return (
                <div
                  key={day}
                  onClick={() => setSelected(isSel ? null : key)}
                  style={{
                    minHeight: 80, padding: 6, cursor: 'pointer',
                    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                    background: isSel ? 'var(--primary-light)' : 'var(--surface)',
                    transition: 'background .1s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? 'white' : 'var(--text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: isToday ? 700 : 400, marginBottom: 4,
                  }}>{day}</div>
                  {income > 0 && <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>+{Math.round(income/1000)}к</div>}
                  {expense > 0 && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600 }}>-{Math.round(expense/1000)}к</div>}
                </div>
              );
            })}
          </div>
        </Card>

        <div>
          {selected ? (
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{selected} {MONTHS_RU[month]}</div>
              {selectedOps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedOps.map(op => {
                    const cat = categories.find(c => c.id === op.categoryId);
                    return (
                      <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cat?.icon} {op.comment || cat?.name || 'Операция'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{cat?.name}</div>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: op.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                          {op.type === 'income' ? '+' : '-'}{formatMoney(op.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: 13 }}>Нет операций</p>
              )}
            </Card>
          ) : (
            <Card>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Выберите день для просмотра операций</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
