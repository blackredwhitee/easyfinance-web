import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Budget } from './pages/Budget';
import { Calendar } from './pages/Calendar';
import { Reports } from './pages/Reports';
import { Accounts } from './pages/Accounts';
import { AiAssistant } from './pages/AiAssistant';
import { Settings } from './pages/Settings';

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
  const Page = PAGES[page] || Dashboard;

  return (
    <>
      <Sidebar active={page} onChange={setPage} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Page onNavigate={setPage} />
      </main>
    </>
  );
}

export default App;
