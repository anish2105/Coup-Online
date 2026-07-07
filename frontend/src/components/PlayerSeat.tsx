import React from 'react';
import { Coins, Skull, Shield } from 'lucide-react';

interface Card {
  role: string;
  revealed: boolean;
}

interface Player {
  id: string;
  name: string;
  coins: number;
  cards: Card[];
  eliminated: boolean;
  isHost: boolean;
}

interface PlayerSeatProps {
  player: Player;
  isLocal: boolean;
  isActiveTurn: boolean;
  isPendingLoss: boolean;
  style: React.CSSProperties;
  angle: number;
  radius: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isLocal,
  isActiveTurn,
  isPendingLoss,
  style,
  angle,
  radius,
}) => {
  // Get character background/border colors based on role
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'duke':
        return 'var(--color-duke)';
      case 'assassin':
        return 'var(--color-assassin)';
      case 'captain':
        return 'var(--color-captain)';
      case 'ambassador':
        return 'var(--color-ambassador)';
      case 'contessa':
        return 'var(--color-contessa)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getRoleAsset = (role: string) => {
    return `/assets/${role.toLowerCase()}.png`;
  };

  return (
    <div
      className="player-seat"
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '180px',
        padding: '12px',
        borderRadius: '16px',
        background: player.eliminated
          ? 'rgba(0, 0, 0, 0.4)'
          : isActiveTurn
          ? 'rgba(212, 175, 55, 0.08)'
          : 'rgba(18, 22, 28, 0.75)',
        backdropFilter: 'blur(10px)',
        border: player.eliminated
          ? '1px solid rgba(255, 0, 0, 0.1)'
          : isActiveTurn
          ? '1.5px solid var(--accent-gold)'
          : isPendingLoss
          ? '1.5px solid var(--color-assassin)'
          : '1px solid var(--border-glass)',
        boxShadow: isActiveTurn
          ? '0 0 15px var(--accent-gold-glow)'
          : isPendingLoss
          ? '0 0 15px rgba(239, 68, 68, 0.25)'
          : 'none',
        opacity: player.eliminated ? 0.6 : 1,
      }}
    >
      {/* Active turn indicator pulse */}
      {isActiveTurn && <div className="active-ring" style={{ borderRadius: '16px' }} />}

      {/* Name and Host tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', maxWidth: '100%' }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: '14px',
            color: player.eliminated ? 'var(--text-muted)' : 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.name}
        </span>
        {isLocal && (
          <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: 600, marginLeft: '2px' }}>
            (You)
          </span>
        )}
      </div>

      {/* Coins Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 10px',
          borderRadius: '20px',
          marginBottom: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Coins size={14} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-gold)' }}>
          {player.coins} {player.coins === 1 ? 'Coin' : 'Coins'}
        </span>
      </div>

      {/* Cards container */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', width: '100%' }}>
        {player.cards.map((card, idx) => {
          const revealed = card.revealed;
          const showFront = isLocal || revealed;
          
          const startTransform = `translate(calc(-${Math.cos(angle)} * ${radius}), calc(-${Math.sin(angle)} * ${radius}))`;
          
          return (
            <div
              key={`${idx}-${card.role}-${revealed}`}
              className={`card-container ${showFront ? 'revealed' : ''} card-draw-animation`}
              style={{
                width: '64px',
                height: '96px',
                perspective: '1000px',
                animationDelay: `${idx * 150}ms`,
                ['--draw-start-transform' as any]: startTransform,
              }}
            >
              <div className="card-inner">
                {/* Card Back */}
                <div
                  className="card-face card-back-face"
                  style={{
                    borderRadius: '6px',
                    border: '1.5px solid var(--accent-gold)',
                    background: 'radial-gradient(circle at center, #1b1712 0%, #0d0b0a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                  }}
                >
                  <img
                    src="/assets/card_back.png"
                    alt="Coup"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.8,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent-gold)',
                      textShadow: '0 2px 4px black',
                      letterSpacing: '0.05em',
                    }}
                  >
                    COUP
                  </div>
                </div>

                {/* Card Front */}
                <div
                  className="card-face card-front"
                  style={{
                    borderRadius: '6px',
                    border: `1.5px solid ${getRoleColor(card.role)}`,
                    background: '#0d0d12',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'absolute',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={getRoleAsset(card.role)}
                    alt={card.role}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  
                  {/* Glass overlay with label */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(2px)',
                      padding: '2px 4px',
                      textAlign: 'center',
                      borderTop: `1px solid ${getRoleColor(card.role)}`,
                      zIndex: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: getRoleColor(card.role),
                        letterSpacing: '0.02em',
                      }}
                    >
                      {card.role}
                    </span>
                  </div>

                  {/* Death mark for revealed cards */}
                  {revealed && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                    >
                      <Skull size={24} style={{ color: 'var(--color-assassin)', filter: 'drop-shadow(0 0 4px black)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Eliminated label */}
      {player.eliminated && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-assassin)' }}>
          <Skull size={12} />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OUT
          </span>
        </div>
      )}

      {/* Pending Action status label */}
      {isPendingLoss && !player.eliminated && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-assassin)', animation: 'pulse-ring 1s infinite' }}>
          <Shield size={12} />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            Losing Influence
          </span>
        </div>
      )}
    </div>
  );
};
