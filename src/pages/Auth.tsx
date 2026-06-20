import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Auth({ onDemo }: { onDemo: () => void }) {
  const { signIn, signUp, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const set = (k: string, v: string) => { clearError(); setSuccess(''); setForm(f => ({ ...f, [k]: v })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') {
      await signIn(form.email, form.password);
    } else {
      await signUp(form.email, form.password, form.name);
      setSuccess('Письмо с подтверждением отправлено на почту. Проверьте ящик и войдите.');
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <TrendingUp size={28} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>EasyFinance</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
            {mode === 'login' ? 'Введите email и пароль' : 'Заполните данные для регистрации'}
          </p>

          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Имя</label>
                <input
                  type="text" required placeholder="Иван Иванов"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Пароль</label>
              <input
                type="password" required placeholder="••••••••" minLength={6}
                value={form.password} onChange={e => set('password', e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, marginTop: 4, opacity: loading ? .7 : 1 }}
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
            {mode === 'login' ? (
              <>Нет аккаунта? <button onClick={() => { setMode('register'); clearError(); setSuccess(''); }} style={{ color: 'var(--primary)', fontWeight: 600 }}>Создать</button></>
            ) : (
              <>Уже есть аккаунт? <button onClick={() => { setMode('login'); clearError(); setSuccess(''); }} style={{ color: 'var(--primary)', fontWeight: 600 }}>Войти</button></>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={onDemo} style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'underline' }}>
            Попробовать без регистрации (демо-режим)
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 13, background: 'var(--bg)', outline: 'none',
};
