import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Budget } from './pages/Budget';
import { Calendar } from './pages/Calendar';
import { Reports } from './pages/Reports';
import { Accounts } from './pages/Accounts';
import { AiAssistant } from './pages/AiAssistant';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { useAuthStore } from './store/authStore';
import { useFinanceStore } from './store/financeStore';
import { isSupabaseConfigured } from './lib/supabase';

const PAGES: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  operations: Operations,
  budget: Budget,
  calendar: Calendar,
  reports: Reports,
  accounts: Accounts,
  ai: AiAssistant,
  settings: Settings,
};

function App() {
  const [page, setPage] = useState('dashboard');
  const [demoForced, setDemoForced] = useState(false);
  const { user, loading, init } = useAuthStore();
  const { loadFromSupabase, syncing } = useFinanceStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      loadFromSupabase();
    }
  }, [user]);

  const Page = PAGES[page] || Dashboard;

  // Показываем загрузку при инициализации
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  // Если Supabase настроен и пользователь не вошёл — показываем Auth
  if (isSupabaseConfigured && !user && !demoForced) {
    return <Auth onDemo={() => setDemoForced(true)} />;
  }

  return (
    <>
      <Sidebar active={page} onChange={setPage} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {syncing && (
          <div style={{ position: 'absolute', top: 12, right: 16, background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, zIndex: 10 }}>
            Синхронизация...
          </div>
        )}
        <Page onNavigate={setPage} />
      </main>
    </>
  );
}

export default App;
