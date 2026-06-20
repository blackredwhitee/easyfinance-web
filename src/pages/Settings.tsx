import { useFinanceStore } from '../store/financeStore';
import { Card } from '../components/ui';

const PLANS = [
  { name: 'Начальный', price: 'Бесплатно', features: ['До 5 счетов', 'Учёт операций', 'Базовые отчёты'], current: true },
  { name: 'Базовый', price: '300 ₽/мес', features: ['До 20 счетов', 'Бюджет', 'Расширенные отчёты', 'EasyBank'], current: false },
  { name: 'Продвинутый', price: '350 ₽/мес', features: ['Неограничено', 'ИИ-ассистент', 'Прогнозы', 'Приоритет поддержки'], current: false },
  { name: 'Бизнес', price: '999 ₽/мес', features: ['Всё из Продвинутого', 'Несколько пользователей', 'API доступ', 'Персональный менеджер'], current: false },
];

export function Settings() {
  const { resetToDemo } = useFinanceStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', flex: 1 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Настройки</h1>

      <Card>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Профиль</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Имя</label>
            <input defaultValue="Иван Иванов" style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
            <input defaultValue="demo@easyfinance.ru" style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--bg)' }} />
          </div>
        </div>
      </Card>

      <div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Тарифы</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {PLANS.map(p => (
            <Card key={p.name} style={{ border: p.current ? '2px solid var(--primary)' : undefined, position: 'relative' }}>
              {p.current && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                  ТЕКУЩИЙ
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 12 }}>{p.price}</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                background: p.current ? 'var(--bg)' : 'var(--primary)',
                color: p.current ? 'var(--text2)' : 'white',
                border: p.current ? '1px solid var(--border)' : 'none',
              }}>
                {p.current ? 'Активен' : 'Выбрать'}
              </button>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Демо-данные</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Сбросить все данные к исходному демо-режиму</p>
        <button onClick={resetToDemo} style={{ background: 'var(--danger)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600 }}>
          Сбросить к демо
        </button>
      </Card>
    </div>
  );
}
