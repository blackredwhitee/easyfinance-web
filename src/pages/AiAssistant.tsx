import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import { formatMoney } from '../utils/format';
import { getTotalBalance, sumByType, getMonthRange, isInPeriod } from '../utils/calc';
import { Card } from '../components/ui';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: { label: string; fn: () => void };
}

function parseIntent(
  text: string,
  ctx: { totalBalance: number; monthExpense: number; monthIncome: number; goals: any[]; operations: any[] },
  addOp: (op: any) => void,
  accounts: any[],
  categories: any[]
): { reply: string; action?: { label: string; fn: () => void } } {
  const lower = text.toLowerCase();
  const amountMatch = text.match(/(\d[\d\s]*)/);
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/\s/g, '')) : null;

  if ((lower.includes('потратил') || lower.includes('купил') || lower.includes('заплатил')) && amount) {
    const catMap: Record<string, string> = {
      'кофе': 'Кафе и рестораны', 'ужин': 'Кафе и рестораны', 'обед': 'Кафе и рестораны',
      'такси': 'Транспорт', 'метро': 'Транспорт',
      'продукт': 'Продукты', 'магазин': 'Продукты',
    };
    let catName = 'Прочее';
    for (const [k, v] of Object.entries(catMap)) { if (lower.includes(k)) { catName = v; break; } }
    const cat = categories.find((c: any) => c.name === catName && c.type === 'expense');
    return {
      reply: `Записываю расход **${formatMoney(amount)}** в «${catName}». Подтвердить?`,
      action: {
        label: `✓ Добавить расход ${formatMoney(amount)}`,
        fn: () => addOp({ type: 'expense', amount, currency: 'RUB', date: new Date().toISOString(), accountId: accounts[0]?.id, categoryId: cat?.id, comment: text }),
      },
    };
  }

  if (lower.includes('баланс') || lower.includes('сколько денег') || lower.includes('остаток')) {
    return { reply: `Ваш общий баланс: **${formatMoney(ctx.totalBalance)}**\n\nЗа этот месяц:\n• Доходы: ${formatMoney(ctx.monthIncome)}\n• Расходы: ${formatMoney(ctx.monthExpense)}\n• Экономия: ${formatMoney(ctx.monthIncome - ctx.monthExpense)}` };
  }

  if (lower.includes('прогноз') || lower.includes('кончатся') || lower.includes('хватит') || lower.includes('кассовый')) {
    const daily = ctx.monthExpense / Math.max(new Date().getDate(), 1);
    const daysLeft = daily > 0 ? Math.floor(ctx.totalBalance / daily) : 999;
    if (daysLeft > 180) return { reply: `При темпе ${formatMoney(Math.round(daily))}/день денег хватит более чем на 6 месяцев. 💚` };
    const date = new Date(); date.setDate(date.getDate() + daysLeft);
    return { reply: `⚠️ При темпе ${formatMoney(Math.round(daily))}/день баланс может уйти в 0 около **${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}** (через ${daysLeft} дней).\n\nСовет: сократите расходы или пополните счёт.` };
  }

  if (lower.includes('цел') || lower.includes('накоп')) {
    if (!ctx.goals.length) return { reply: 'У вас пока нет целей. Создайте в разделе «Бюджет и цели»!' };
    const g = ctx.goals[0];
    const remaining = g.targetAmount - g.currentAmount;
    const monthly = ctx.monthIncome - ctx.monthExpense;
    const months = monthly > 0 ? Math.ceil(remaining / monthly) : null;
    return { reply: `Цель «${g.title}»:\n• Накоплено: ${formatMoney(g.currentAmount)} из ${formatMoney(g.targetAmount)}\n• Осталось: ${formatMoney(remaining)}${months ? `\n• При текущей норме (~${formatMoney(monthly)}/мес) — через ~${months} мес.` : ''}` };
  }

  if (lower.includes('сэконом') || lower.includes('совет') || lower.includes('как накоп')) {
    return { reply: `💡 **Советы по накоплениям:**\n\n1. Правило 50/30/20: обязательное / желаемое / сбережения\n2. Платите сначала себе — откладывайте в день зарплаты\n3. Проверьте подписки — часто это 3–5 тыс./мес. лишних расходов\n4. Записывайте расходы ежедневно — это повышает осознанность на 30%` };
  }

  return { reply: `Я ваш финансовый ИИ-ассистент 🤖\n\nМогу помочь:\n• «потратил 500 на кофе» — запишу расход\n• «сколько у меня денег?» — покажу баланс\n• «прогноз баланса» — когда закончатся деньги\n• «мои цели» — прогресс по накоплениям\n• «как сэкономить?» — советы` };
}

export function AiAssistant() {
  const { accounts, operations, goals, categories, addOperation } = useFinanceStore();
  const [msgs, setMsgs] = useState<Msg[]>([{
    id: '0', role: 'assistant',
    text: 'Привет! Я ваш финансовый ИИ-ассистент 🤖\n\nСпросите меня о балансе, прогнозе или расходах — или просто напишите «потратил 500 на кофе» и я сам запишу операцию.',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { start, end } = getMonthRange();
  const monthOps = operations.filter(o => !o.isDeleted && isInPeriod(o.date, start, end));
  const ctx = {
    totalBalance: getTotalBalance(accounts),
    monthExpense: sumByType(monthOps, 'expense'),
    monthIncome: sumByType(monthOps, 'income'),
    goals, operations,
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text = input) => {
    if (!text.trim()) return;
    setInput('');
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMsgs(p => [...p, userMsg]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const { reply, action } = parseIntent(text.trim(), ctx, addOperation, accounts, categories);
    const botMsg: Msg = { id: (Date.now() + 1).toString(), role: 'assistant', text: reply, action };
    setMsgs(p => [...p, botMsg]);
    setLoading(false);
  };

  const QUICK = ['Сколько у меня денег?', 'Прогноз баланса', 'Мои цели', 'Как сэкономить?'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 24, paddingBottom: 0 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>ИИ-ассистент</h1>
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {msgs.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 10, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={16} color="var(--purple)" />
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    background: m.role === 'user' ? 'var(--primary)' : 'var(--surface2)',
                    color: m.role === 'user' ? 'white' : 'var(--text)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.text}
                  </div>
                  {m.action && (
                    <button
                      onClick={() => { m.action!.fn(); setMsgs(p => [...p, { id: Date.now().toString(), role: 'assistant', text: '✅ Операция добавлена!' }]); }}
                      style={{ marginTop: 6, background: 'var(--success)', color: 'white', padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}
                    >
                      {m.action.label}
                    </button>
                  )}
                </div>
                {m.role === 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={16} color="var(--primary)" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="var(--purple)" />
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', fontSize: 18, color: 'var(--text3)' }}>
                  •••
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text2)' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Напишите запрос..." disabled={loading}
              style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 24, fontSize: 13, background: 'var(--bg)', outline: 'none' }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? 'var(--primary)' : 'var(--border)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar tips */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Что умеет ИИ-ассистент</div>
            {[
              ['💬', 'Запись расходов голосом/текстом'],
              ['📊', 'Показ баланса и аналитики'],
              ['🔮', 'Прогноз кассового разрыва'],
              ['🎯', 'Отслеживание целей'],
              ['💡', 'Советы по экономии'],
              ['🔍', 'Поиск повторяющихся расходов'],
            ].map(([icon, text]) => (
              <div key={text as string} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Примеры запросов</div>
            {[
              'потратил 500 на кофе',
              'сколько я потратил в этом месяце?',
              'когда закончатся деньги?',
              'мои финансовые цели',
              'как сэкономить 10 тысяч?',
            ].map(q => (
              <button key={q} onClick={() => setInput(q)} style={{ display: 'block', textAlign: 'left', fontSize: 12, color: 'var(--primary)', marginBottom: 4, lineHeight: 1.5 }}>
                «{q}»
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
