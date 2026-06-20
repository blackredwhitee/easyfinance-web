import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '16px',
        ...style,
      }}
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
}
export function Badge({ children, color = 'var(--text2)', bg = 'var(--bg)' }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color,
      fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
}
export function ProgressBar({ value, color = 'var(--primary)', height = 6 }: ProgressBarProps) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: color,
        borderRadius: 99,
        transition: 'width .4s ease',
      }} />
    </div>
  );
}

interface GaugeProps {
  value: number; // 0-100
  size?: number;
  label: string;
  color?: string;
}
export function Gauge({ value, size = 64, label, color }: GaugeProps) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const clipped = Math.min(100, Math.max(0, value));
  const dash = (clipped / 100) * circ;
  const c = color || (clipped >= 70 ? 'var(--success)' : clipped >= 40 ? 'var(--warning)' : 'var(--danger)');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .5s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', marginTop: -size * 0.3, position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        {/* value shown via label below */}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c, marginTop: -4 }}>{clipped}</div>
    </div>
  );
}

export function GaugeInline({ value, size = 56, label }: GaugeProps) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const clipped = Math.min(100, Math.max(0, value));
  const dash = (clipped / 100) * circ;
  const c = clipped >= 70 ? 'var(--success)' : clipped >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={4}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c }}>
          {clipped}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}
