import React, { useState } from 'react';
import { Target, Shield, HelpCircle, Coins, Eye, UserPlus, ShieldAlert } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  coins: number;
  eliminated: boolean;
}

interface ActionPanelProps {
  players: Player[];
  localPlayerId: string;
  localPlayerCards?: string[];
  onDeclareAction: (type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange', targetId?: string) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  players,
  localPlayerId,
  localPlayerCards = [],
  onDeclareAction,
}) => {
  const [selectedAction, setSelectedAction] = useState<'coup' | 'assassinate' | 'steal' | null>(null);

  const localPlayer = players.find((p) => p.id === localPlayerId);
  if (!localPlayer) return null;

  const coins = localPlayer.coins;
  const mustCoup = coins >= 10;

  // Active players excluding self
  const potentialTargets = players.filter((p) => !p.eliminated && p.id !== localPlayerId);

  const handleActionClick = (actionType: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange') => {
    if (actionType === 'coup' || actionType === 'assassinate' || actionType === 'steal') {
      setSelectedAction(actionType);
    } else {
      onDeclareAction(actionType);
    }
  };

  const handleTargetClick = (targetId: string) => {
    if (selectedAction) {
      onDeclareAction(selectedAction, targetId);
      setSelectedAction(null);
    }
  };

  // View: Target Selector Overlay for targeting actions
  if (selectedAction) {
    return (
      <div className="glass-panel" style={{ padding: '20px', width: '100%', position: 'relative', border: '1px solid var(--accent-gold)' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--accent-gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Target size={16} />
          Select Target for {selectedAction.toUpperCase()}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {potentialTargets.map((target) => (
            <button
              key={target.id}
              onClick={() => handleTargetClick(target.id)}
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{target.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--accent-gold)', opacity: 0.8 }}>({target.coins} c)</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedAction(null)}
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '14px', padding: '10px', fontSize: '13px' }}
        >
          Cancel Action
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', width: '100%' }}>
      <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <Coins size={16} style={{ color: 'var(--accent-gold)' }} />
        YOUR TURN: DECLARE ACTION
      </h3>

      {mustCoup && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid var(--color-assassin)',
            padding: '12px',
            borderRadius: '8px',
            color: '#feca57',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <ShieldAlert size={18} style={{ color: 'var(--color-assassin)', flexShrink: 0 }} />
          <span><strong>Mandatory Coup!</strong> You have 10 or more coins and must Coup another player.</span>
        </div>
      )}

      {/* Grid layout for actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Core Actions (No Role Claim Needed) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            disabled={mustCoup}
            onClick={() => handleActionClick('income')}
            className="btn btn-secondary"
            style={{ padding: '12px 10px', flexDirection: 'column', height: '64px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Income</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+1 Coin (Safe)</span>
          </button>

          <button
            disabled={mustCoup}
            onClick={() => handleActionClick('foreign_aid')}
            className="btn btn-secondary"
            style={{ padding: '12px 10px', flexDirection: 'column', height: '64px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Foreign Aid</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+2 Coins (Blockable)</span>
          </button>
        </div>

        {/* Coup Button (Special Full Width) */}
        <button
          disabled={coins < 7}
          onClick={() => handleActionClick('coup')}
          className="btn btn-primary"
          style={{
            width: '100%',
            height: '46px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid var(--accent-gold)',
            boxShadow: mustCoup ? '0 0 12px var(--accent-gold-glow)' : 'none',
          }}
        >
          <Shield size={16} fill="black" />
          <strong>Coup (-7 Coins)</strong>
        </button>

        {/* Character/Bluff Actions */}
        {!mustCoup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Character Roles (Can Bluff)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Duke Tax */}
              <button
                onClick={() => handleActionClick('tax')}
                className="btn btn-secondary"
                style={{
                  padding: '10px 8px',
                  flexDirection: 'column',
                  borderLeft: '3px solid var(--color-duke)',
                  alignItems: 'flex-start',
                  borderRadius: '8px',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Tax <span style={{ color: 'var(--color-duke)', fontSize: '11px' }}>(Duke)</span></span>
                  {localPlayerCards.includes('duke') && (
                    <span style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>TRUTH</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+3 Coins</span>
              </button>

              {/* Assassin Assassinate */}
              <button
                disabled={coins < 3}
                onClick={() => handleActionClick('assassinate')}
                className="btn btn-secondary"
                style={{
                  padding: '10px 8px',
                  flexDirection: 'column',
                  borderLeft: '3px solid var(--color-assassin)',
                  alignItems: 'flex-start',
                  borderRadius: '8px',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Assassinate <span style={{ color: 'var(--color-assassin)', fontSize: '11px' }}>(Assassin)</span></span>
                  {localPlayerCards.includes('assassin') && (
                    <span style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>TRUTH</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-3 Coins, Kill target</span>
              </button>

              {/* Captain Steal */}
              <button
                onClick={() => handleActionClick('steal')}
                className="btn btn-secondary"
                style={{
                  padding: '10px 8px',
                  flexDirection: 'column',
                  borderLeft: '3px solid var(--color-captain)',
                  alignItems: 'flex-start',
                  borderRadius: '8px',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Steal <span style={{ color: 'var(--color-captain)', fontSize: '11px' }}>(Captain)</span></span>
                  {localPlayerCards.includes('captain') && (
                    <span style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>TRUTH</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Steal 2 Coins</span>
              </button>

              {/* Ambassador Exchange */}
              <button
                onClick={() => handleActionClick('exchange')}
                className="btn btn-secondary"
                style={{
                  padding: '10px 8px',
                  flexDirection: 'column',
                  borderLeft: '3px solid var(--color-ambassador)',
                  alignItems: 'flex-start',
                  borderRadius: '8px',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>Exchange <span style={{ color: 'var(--color-ambassador)', fontSize: '11px' }}>(Ambassador)</span></span>
                  {localPlayerCards.includes('ambassador') && (
                    <span style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>TRUTH</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Draw 2 & Choose</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
