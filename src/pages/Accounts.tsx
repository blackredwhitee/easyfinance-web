import { CreditCard, Wallet, Building2, Landmark } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney } from '../utils/format';
import { getTotalBalance } from '../utils/calc';
import { Card, ProgressBar } from '../components/ui';

const ICONS: Record<string, React.ReactNode> = {
  cash: <Wallet size={20} />,
  card: <CreditCard size={20} />,
  deposit: <Building2 size={20} />,
  credit: <Landmark size={20} />,
};
const TYPE_NAMES: Record<string, string> = { cash: 'Наличные', card: 'Банковская карта', deposit: 'Вклад', credit: 'Кредит' };

export function Accounts() {
  const { accounts } = useFinanceStore();
  const total = getTotalBalance(accounts);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Счета</h1>

      <Card style={{ background: 'linear-gradient(135deg, #1E40AF, #7C3AED)', border: 'none' }}>
        <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginBottom: 4 }}>Общий баланс</div>
        <div style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>{formatMoney(total)}</div>
        <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 4 }}>{accounts.length} счетов</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {accounts.map(a => {
          const pct = total > 0 ? (a.balance / total) * 100 : 0;
          return (
            <Card key={a.id} style={{ borderTop: `3px solid ${a.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                  {ICONS[a.type]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{TYPE_NAMES[a.type]}</div>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: a.balance >= 0 ? 'var(--text)' : 'var(--danger)', marginBottom: 10 }}>
                {formatMoney(a.balance, a.currency)}
              </div>
              <ProgressBar value={pct} color={a.color} />
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{Math.round(pct)}% от общего баланса</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
          Подключить EasyBank
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>
          Автоматический импорт операций из 50+ российских банков. Сбербанк, Тинькофф, ВТБ, Альфа и другие.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Сбербанк', 'Тинькофф', 'ВТБ', 'Альфа-Банк', 'Газпромбанк', 'Открытие'].map(b => (
            <span key={b} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{b}</span>
          ))}
        </div>
        <button style={{ marginTop: 14, background: 'var(--primary)', color: 'white', padding: '9px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600 }}>
          Подключить банк
        </button>
      </Card>
    </div>
  );
}
