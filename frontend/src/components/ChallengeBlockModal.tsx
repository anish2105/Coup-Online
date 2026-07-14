import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Timer, Shield, HelpCircle, XCircle } from 'lucide-react';

interface ActionPayload {
  type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange';
  sourceId: string;
  targetId?: string;
  challengerId?: string;
  blockerId?: string;
  blockRole?: string;
}

interface Player {
  id: string;
  name: string;
  coins?: number;
}

interface ChallengeBlockModalProps {
  currentAction: ActionPayload;
  phase: 'CHALLENGE_WINDOW' | 'BLOCK_WINDOW';
  players: Player[];
  localPlayerId: string;
  localPlayerCards?: string[];
  onRespond: (response: 'pass' | 'challenge' | 'block', blockRole?: string) => void;
}

export const ChallengeBlockModal: React.FC<ChallengeBlockModalProps> = ({
  currentAction,
  phase,
  players,
  localPlayerId,
  localPlayerCards = [],
  onRespond,
}) => {
  const [progress, setProgress] = useState(100);
  const duration = 12; // 12 seconds countdown

  // Store onRespond in a ref so the timer interval doesn't reset when references change
  const onRespondRef = useRef(onRespond);
  useEffect(() => {
    onRespondRef.current = onRespond;
  }, [onRespond]);

  useEffect(() => {
    setProgress(100);
    const intervalTime = 100; // tick every 100ms
    const totalTicks = (duration * 1000) / intervalTime;
    let ticks = 0;

    const timer = setInterval(() => {
      ticks += 1;
      const pct = Math.max(0, 100 - (ticks / totalTicks) * 100);
      setProgress(pct);

      if (ticks >= totalTicks) {
        clearInterval(timer);
        onRespondRef.current('pass'); // Auto-pass when timer runs out
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentAction.type, currentAction.sourceId, currentAction.targetId, currentAction.blockerId, phase]);

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || 'Unknown';
  };

  const actorName = getPlayerName(currentAction.sourceId);
  const targetName = currentAction.targetId ? getPlayerName(currentAction.targetId) : '';
  const isActor = currentAction.sourceId === localPlayerId;
  const isTarget = currentAction.targetId === localPlayerId;

  // Let's formulate the descriptive text of the challenge window
  const getPromptText = () => {
    if (phase === 'CHALLENGE_WINDOW') {
      switch (currentAction.type) {
        case 'tax':
          return `${actorName} claims DUKE to take Tax (+3 Coins).`;
        case 'assassinate':
          return `${actorName} claims ASSASSIN to Assassinate ${targetName}.`;
        case 'steal':
          return `${actorName} claims CAPTAIN to Steal 2 Coins from ${targetName}.`;
        case 'exchange':
          return `${actorName} claims AMBASSADOR to Exchange cards.`;
        default:
          return `${actorName} is performing ${currentAction.type}.`;
      }
    } else {
      // BLOCK_WINDOW
      if (currentAction.type === 'foreign_aid') {
        if (currentAction.blockerId) {
          const blockerName = getPlayerName(currentAction.blockerId);
          return `${blockerName} claims DUKE to Block ${actorName}'s Foreign Aid.`;
        }
        return `${actorName} is taking Foreign Aid. Anyone can claim Duke to Block.`;
      } else if (currentAction.type === 'assassinate') {
        if (currentAction.blockerId) {
          const blockerName = getPlayerName(currentAction.blockerId);
          return `${blockerName} claims CONTESSA to Block ${actorName}'s Assassination.`;
        }
        return `${actorName} is Assassinating ${targetName}. ${targetName} can block.`;
      } else if (currentAction.type === 'steal') {
        if (currentAction.blockerId) {
          const blockerName = getPlayerName(currentAction.blockerId);
          const roleClaimed = currentAction.blockRole || 'Captain/Ambassador';
          return `${blockerName} claims ${roleClaimed.toUpperCase()} to Block ${actorName}'s Steal.`;
        }
        return `${actorName} is Stealing from ${targetName}. ${targetName} can block.`;
      }
      return `${actorName}'s action can be blocked.`;
    }
  };

  // Determine what reaction choices are available to the local player
  const showChallenge = phase === 'CHALLENGE_WINDOW' && !isActor;
  
  // Can block if:
  // - We are in BLOCK_WINDOW, and no block has been declared yet, and we are not the actor, and (it is foreign aid or we are the target).
  // - OR we are in CHALLENGE_WINDOW, and we are the target, and the action is blockable (assassinate/steal).
  const showBlockOptions =
    !currentAction.blockerId &&
    !isActor &&
    ((phase === 'BLOCK_WINDOW' && (currentAction.type === 'foreign_aid' || isTarget)) ||
     (phase === 'CHALLENGE_WINDOW' && isTarget && ['assassinate', 'steal'].includes(currentAction.type)));

  // Can challenge a block if we are in BLOCK_WINDOW, a block HAS been declared, and we are not the blocker
  const showChallengeBlock =
    phase === 'BLOCK_WINDOW' &&
    !!currentAction.blockerId &&
    currentAction.blockerId !== localPlayerId;

  // If local player is the actor of the current target claim, they are just waiting
  const isWaiting = phase === 'CHALLENGE_WINDOW'
    ? isActor
    : (currentAction.blockerId ? currentAction.blockerId === localPlayerId : isActor);

  const localPlayer = players.find((p) => p.id === localPlayerId);

  const renderPanelHeader = () => {
    if (!localPlayer) return null;
    const coins = localPlayer.coins ?? 0;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '12px',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Status
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>
            {localPlayer.name} <span style={{ color: 'var(--accent-gold)', marginLeft: '4px', fontWeight: 600 }}>({coins} Coins)</span>
          </span>
        </div>
        
        {/* Miniature hand display */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
            Your Hand:
          </span>
          {localPlayerCards.length === 0 ? (
            <span style={{ fontSize: '10px', color: 'var(--color-assassin)', fontWeight: 800 }}>ELIMINATED</span>
          ) : (
            localPlayerCards.map((role, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1.5px solid var(--color-${role.toLowerCase()})`,
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'white',
                  textTransform: 'uppercase',
                  boxShadow: `0 0 6px var(--color-${role.toLowerCase()})30`,
                }}
              >
                <img
                  src={`/assets/${role.toLowerCase()}.png`}
                  alt={role}
                  style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {role}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content gold-glow-panel" style={{ padding: '24px', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-gold)' }} />
          <h2 style={{ fontSize: '18px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {phase === 'CHALLENGE_WINDOW' ? 'Challenge Opportunity' : 'Reaction Window'}
          </h2>
        </div>

        {renderPanelHeader()}

        <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.5' }}>
          {getPromptText()}
        </p>

        {/* Timer Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Timer size={12} /> Timer</span>
            <span>{Math.ceil((progress / 100) * duration)}s</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress > 30 ? 'var(--accent-gold)' : 'var(--color-assassin)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isWaiting ? (
          <div style={{ textAlign: 'center', padding: '12px', border: '1px dashed var(--border-glass)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Waiting for other players to respond...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {showChallenge && (
              <button
                onClick={() => onRespond('challenge')}
                className="btn btn-danger"
                style={{ width: '100%', padding: '12px' }}
              >
                <HelpCircle size={15} />
                Challenge Bluff!
              </button>
            )}

            {showChallengeBlock && (
              <button
                onClick={() => onRespond('challenge')}
                className="btn btn-danger"
                style={{ width: '100%', padding: '12px' }}
              >
                <HelpCircle size={15} />
                Challenge Block Claim!
              </button>
            )}

            {showBlockOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '4px' }}>
                  Declare Counter-Block
                </span>
                
                {currentAction.type === 'foreign_aid' && (
                  <button
                    onClick={() => onRespond('block', 'duke')}
                    className="btn btn-secondary"
                    style={{ borderLeft: '3px solid var(--color-duke)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '12px', width: '100%' }}
                  >
                    <Shield size={14} style={{ color: 'var(--color-duke)', marginRight: '8px' }} />
                    <span>Block with Duke</span>
                    {localPlayerCards.includes('duke') && (
                      <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700, marginLeft: 'auto' }}>
                        TRUTH
                      </span>
                    )}
                  </button>
                )}

                {currentAction.type === 'assassinate' && (
                  <button
                    onClick={() => onRespond('block', 'contessa')}
                    className="btn btn-secondary"
                    style={{ borderLeft: '3px solid var(--color-contessa)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '12px', width: '100%' }}
                  >
                    <Shield size={14} style={{ color: 'var(--color-contessa)', marginRight: '8px' }} />
                    <span>Block with Contessa</span>
                    {localPlayerCards.includes('contessa') && (
                      <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700, marginLeft: 'auto' }}>
                        TRUTH
                      </span>
                    )}
                  </button>
                )}

                {currentAction.type === 'steal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => onRespond('block', 'captain')}
                      className="btn btn-secondary"
                      style={{ borderLeft: '3px solid var(--color-captain)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '12px', width: '100%' }}
                    >
                      <Shield size={14} style={{ color: 'var(--color-captain)', marginRight: '8px' }} />
                      <span>Block with Captain</span>
                      {localPlayerCards.includes('captain') && (
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700, marginLeft: 'auto' }}>
                          TRUTH
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onRespond('block', 'ambassador')}
                      className="btn btn-secondary"
                      style={{ borderLeft: '3px solid var(--color-ambassador)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '12px', width: '100%' }}
                    >
                      <Shield size={14} style={{ color: 'var(--color-ambassador)', marginRight: '8px' }} />
                      <span>Block with Ambassador</span>
                      {localPlayerCards.includes('ambassador') && (
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-ambassador)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700, marginLeft: 'auto' }}>
                          TRUTH
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onRespond('pass')}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
            >
              <XCircle size={15} />
              Pass / Accept Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
