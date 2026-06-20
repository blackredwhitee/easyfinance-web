import {
  LayoutDashboard, ListOrdered, Target, Calendar, BarChart3,
  Wallet, Bot, Settings, ChevronRight, TrendingUp
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV = [
  { key: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { key: 'operations', label: 'Операции', icon: ListOrdered },
  { key: 'budget', label: 'Бюджет и цели', icon: Target },
  { key: 'calendar', label: 'Календарь', icon: Calendar },
  { key: 'reports', label: 'Отчёты', icon: BarChart3 },
  { key: 'accounts', label: 'Счета', icon: Wallet },
  { key: 'ai', label: 'ИИ-ассистент', icon: Bot, highlight: true },
  { key: 'settings', label: 'Настройки', icon: Settings },
];

interface Props {
  active: string;
  onChange: (key: string) => void;
}

export function Sidebar({ active, onChange }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <TrendingUp size={22} color="#2563EB" />
        <span>EasyFinance</span>
      </div>

      <div className={styles.demo}>
        <span className={styles.demoBadge}>Demo</span>
        <span>Демо-режим</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ key, label, icon: Icon, highlight }) => (
          <button
            key={key}
            className={`${styles.item} ${active === key ? styles.active : ''} ${highlight ? styles.highlight : ''}`}
            onClick={() => onChange(key)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {active === key && <ChevronRight size={14} className={styles.arrow} />}
          </button>
        ))}
      </nav>

      <div className={styles.upgrade}>
        <div className={styles.upgradeTitle}>Тариф: Начальный</div>
        <div className={styles.upgradeText}>Перейдите на Базовый — получите бюджет и отчёты</div>
        <button className={styles.upgradeBtn}>Повысить тариф</button>
      </div>
    </aside>
  );
}
