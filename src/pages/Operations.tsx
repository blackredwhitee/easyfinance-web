import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney, formatDate } from '../utils/format';
import { Card } from '../components/ui';
import styles from './Operations.module.css';
import type { OperationType } from '../types';

const TYPE_LABELS: Record<OperationType, string> = { income: 'Доход', expense: 'Расход', transfer: 'Перевод' };
const TYPE_COLORS: Record<OperationType, string> = { income: 'var(--success)', expense: 'var(--danger)', transfer: 'var(--text2)' };

export function Operations() {
  const { operations, accounts, categories, deleteOperation, addOperation } = useFinanceStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({ type: 'expense' as OperationType, amount: '', categoryId: '', accountId: accounts[0]?.id || '', comment: '', date: new Date().toISOString().slice(0, 10) });

  const visible = operations.filter(o => {
    if (o.isDeleted) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (search) {
      const cat = categories.find(c => c.id === o.categoryId)?.name || '';
      const acc = accounts.find(a => a.id === o.accountId)?.name || '';
      const q = search.toLowerCase();
      if (!(o.comment?.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || acc.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = visible.filter(o => o.type === 'income').reduce((s, o) => s + o.amount, 0);
  const totalExpense = visible.filter(o => o.type === 'expense').reduce((s, o) => s + o.amount, 0);

  const onSave = () => {
    if (!form.amount || !form.accountId) return;
    addOperation({
      type: form.type,
      amount: Number(form.amount),
      currency: 'RUB',
      date: new Date(form.date).toISOString(),
      accountId: form.accountId,
      categoryId: form.categoryId || undefined,
      comment: form.comment || undefined,
    });
    setShowForm(false);
    setForm(f => ({ ...f, amount: '', comment: '' }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Операции</h1>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {showForm && (
        <Card>
          <div className={styles.formGrid}>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as OperationType }))} className={styles.input}>
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
              <option value="transfer">Перевод</option>
            </select>
            <input type="number" placeholder="Сумма" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={styles.input} />
            <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} className={styles.input}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className={styles.input}>
              <option value="">— Категория —</option>
              {categories.filter(c => c.type === form.type || form.type === 'transfer').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={styles.input} />
            <input placeholder="Комментарий" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className={styles.input} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className={styles.addBtn} onClick={onSave}>Сохранить</button>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </Card>
      )}

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={14} color="var(--text3)" />
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.typeFilters}>
          {(['all', 'income', 'expense', 'transfer'] as const).map(t => (
            <button key={t} className={`${styles.typeBtn} ${typeFilter === t ? styles.typeBtnActive : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'Все' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className={styles.summary}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{formatMoney(totalIncome)}</span>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{formatMoney(totalExpense)}</span>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Категория</th>
              <th>Счёт</th>
              <th>Комментарий</th>
              <th style={{ textAlign: 'right' }}>Сумма</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(op => {
              const cat = categories.find(c => c.id === op.categoryId);
              const acc = accounts.find(a => a.id === op.accountId);
              return (
                <tr key={op.id}>
                  <td style={{ color: 'var(--text2)' }}>{formatDate(op.date)}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[op.type], background: TYPE_COLORS[op.type] + '18', padding: '2px 8px', borderRadius: 20 }}>
                      {TYPE_LABELS[op.type]}
                    </span>
                  </td>
                  <td>
                    {cat ? <span>{cat.icon} {cat.name}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{acc?.name}</td>
                  <td style={{ color: 'var(--text2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.comment || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: TYPE_COLORS[op.type] }}>
                    {op.type === 'income' ? '+' : op.type === 'transfer' ? '↔' : '-'}{formatMoney(op.amount)}
                  </td>
                  <td>
                    <button onClick={() => deleteOperation(op.id)} style={{ padding: 4, color: 'var(--text3)', borderRadius: 4 }} title="Удалить">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Нет операций</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
