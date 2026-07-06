import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, Award, HelpCircle, Coins, Skull, Info } from 'lucide-react';

interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'action' | 'challenge' | 'block' | 'reveal' | 'coins' | 'system' | 'elimination';
}

interface GameLogProps {
  logs: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of log ledger on new entry
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'action':
        return <Terminal size={14} style={{ color: '#fff' }} />;
      case 'challenge':
        return <HelpCircle size={14} style={{ color: 'var(--color-assassin)' }} />;
      case 'block':
        return <Shield size={14} style={{ color: 'var(--color-contessa)' }} />;
      case 'reveal':
        return <Info size={14} style={{ color: 'var(--color-ambassador)' }} />;
      case 'coins':
        return <Coins size={14} style={{ color: 'var(--accent-gold)' }} />;
      case 'elimination':
        return <Skull size={14} style={{ color: 'var(--color-assassin)' }} />;
      default:
        return <Info size={14} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getLogStyle = (type: GameLogEntry['type']) => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '13px',
      lineHeight: '1.4',
      padding: '6px 8px',
      borderRadius: '6px',
      marginBottom: '4px',
    };

    switch (type) {
      case 'challenge':
        return { ...baseStyle, color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.05)' };
      case 'block':
        return { ...baseStyle, color: '#93c5fd', backgroundColor: 'rgba(59, 130, 246, 0.05)' };
      case 'coins':
        return { ...baseStyle, color: '#fef08a', backgroundColor: 'rgba(212, 175, 55, 0.05)' };
      case 'reveal':
        return { ...baseStyle, color: '#a7f3d0', backgroundColor: 'rgba(16, 185, 129, 0.05)' };
      case 'elimination':
        return { ...baseStyle, color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' };
      case 'system':
        return { ...baseStyle, color: 'var(--text-secondary)' };
      default:
        return { ...baseStyle, color: '#f3f4f6' };
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(11, 13, 16, 0.85)',
        borderLeft: '1px solid var(--border-glass)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Terminal size={16} style={{ color: 'var(--accent-gold)' }} />
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }}>
          Activity Ledger
        </h3>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No actions recorded yet.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={getLogStyle(log.type)}>
              <span style={{ marginTop: '2px', flexShrink: 0 }}>{getLogIcon(log.type)}</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
