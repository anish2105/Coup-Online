import React, { useState } from 'react';
import { PlayerSeat } from './PlayerSeat';
import { ActionPanel } from './ActionPanel';
import { ChallengeBlockModal } from './ChallengeBlockModal';
import { CardSelectionModal } from './CardSelectionModal';
import { GameLog } from './GameLog';
import { RuleBookModal } from './RuleBookModal';
import { ArrowLeft, RefreshCw, Trophy, Coins, BookOpen, Terminal, Volume2, VolumeX } from 'lucide-react';

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

interface ActionPayload {
  type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange';
  sourceId: string;
  targetId?: string;
  challengerId?: string;
  blockerId?: string;
  blockRole?: string;
}

interface GameLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'action' | 'challenge' | 'block' | 'reveal' | 'coins' | 'system' | 'elimination';
}

interface CoupGameState {
  players: Player[];
  deck: string[];
  currentPlayerIndex: number;
  phase: string;
  currentAction: ActionPayload | null;
  pendingLossReason: 'coup' | 'assassinate' | 'challenge_failed' | 'block_challenge_failed' | null;
  pendingLossPlayerId: string | null;
  pendingRevealPlayerId: string | null;
  pendingActionAfterLoss: 'RESOLVE' | 'BLOCK_WINDOW' | 'NEXT_TURN' | null;
  responses: Record<string, { response: 'pass' | 'challenge' | 'block'; blockRole?: string }>;
  logs: GameLogEntry[];
  winnerId: string | null;
  ambassadorOptions: string[];
}

interface GameBoardProps {
  gameState: CoupGameState;
  localPlayerId: string;
  onDeclareAction: (type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange', targetId?: string) => void;
  onRespondAction: (response: 'pass' | 'challenge' | 'block', blockRole?: string) => void;
  onRevealCard: (cardIndex: number) => void;
  onLoseInfluence: (cardIndex: number) => void;
  onResolveExchange: (selectedCards: string[]) => void;
  onResetGame: () => void;
  onLeave: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  localPlayerId,
  onDeclareAction,
  onRespondAction,
  onRevealCard,
  onLoseInfluence,
  onResolveExchange,
  onResetGame,
  onLeave,
  isMuted,
  onToggleMute,
}) => {
  const { players, phase, currentAction, pendingLossPlayerId, pendingRevealPlayerId, logs } = gameState;
  const [showRules, setShowRules] = useState(false);
  const [showMobileLogs, setShowMobileLogs] = useState(false);

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const activePlayer = players[gameState.currentPlayerIndex];
  const isLocalTurn = activePlayer?.id === localPlayerId;
  const isHost = localPlayer?.isHost || false;

  // Calculate circular seats positioning relative to local player at the bottom (angle: Math.PI / 2)
  const renderSeats = () => {
    const total = players.length;
    const localIdx = players.findIndex((p) => p.id === localPlayerId);
    
    // Default fallback if player not found
    const baseIdx = localIdx === -1 ? 0 : localIdx;

    return players.map((player, idx) => {
      // Relative offset from local player
      const relIdx = (idx - baseIdx + total) % total;
      
      // Calculate angle: local player is at PI / 2 (90 degrees, bottom)
      // We distribute others clockwise
      const angle = Math.PI / 2 + (relIdx * (2 * Math.PI)) / total;
      
      // Compute responsive positioning coordinates
      const radius = 'min(24vw, 24vh)';
      const left = `calc(50% + ${Math.cos(angle)} * ${radius})`;
      const top = `calc(50% + ${Math.sin(angle)} * ${radius})`;

      const isActiveTurn = gameState.currentPlayerIndex === idx && phase !== 'GAME_OVER' && phase !== 'LOBBY';
      const isPendingLoss = pendingLossPlayerId === player.id || pendingRevealPlayerId === player.id;

      return (
        <PlayerSeat
          key={player.id}
          player={player}
          isLocal={player.id === localPlayerId}
          isActiveTurn={isActiveTurn}
          isPendingLoss={isPendingLoss}
          style={{ left, top }}
          angle={angle}
          radius={radius}
        />
      );
    });
  };

  // Helper to format deck size
  const deckSize = gameState.deck.length;
  // Let's compute treasury coins: start with 50 total coins in Coup, deduct coins held by players
  const playerCoinsSum = players.reduce((sum, p) => sum + p.coins, 0);
  const treasuryCoins = Math.max(0, 50 - playerCoinsSum);

  // Status message for the center circle
  const getCenterStatus = () => {
    if (phase === 'GAME_OVER') {
      const winner = players.find((p) => p.id === gameState.winnerId);
      return `${winner?.name || 'Someone'} wins!`;
    }
    
    if (phase === 'EXCHANGING') {
      const activeName = activePlayer?.id === localPlayerId ? 'You' : activePlayer?.name;
      return `${activeName} is exchanging cards...`;
    }

    if (pendingRevealPlayerId) {
      const revealName = pendingRevealPlayerId === localPlayerId ? 'You' : players.find((p) => p.id === pendingRevealPlayerId)?.name;
      return `${revealName} must reveal a card!`;
    }

    if (pendingLossPlayerId) {
      const lossName = pendingLossPlayerId === localPlayerId ? 'You' : players.find((p) => p.id === pendingLossPlayerId)?.name;
      return `${lossName} is losing an influence...`;
    }

    if (currentAction) {
      const actorName = currentAction.sourceId === localPlayerId ? 'You' : players.find((p) => p.id === currentAction.sourceId)?.name;
      return `${actorName} declares ${currentAction.type.toUpperCase()}`;
    }

    const turnName = activePlayer?.id === localPlayerId ? 'Your' : `${activePlayer?.name}'s`;
    return `${turnName} Turn`;
  };

  // 1. Reaction Overlay Modal (Challenge/Block)
  // Show if in challenge/block phase, local player has NOT responded, is alive, and not the one being challenged
  const hasResponded = localPlayerId in gameState.responses;
  const isLocalAlive = localPlayer && !localPlayer.eliminated;
  const isActor = currentAction?.sourceId === localPlayerId;

  // Exclude the one being challenged:
  // - In CHALLENGE_WINDOW: exclude the original actor who claimed the role.
  // - In BLOCK_WINDOW: if a block was declared, exclude the blocker. If no block yet, exclude the original actor.
  const isExcludedFromReaction = phase === 'CHALLENGE_WINDOW'
    ? isActor
    : (currentAction?.blockerId ? currentAction.blockerId === localPlayerId : isActor);

  const showReactionModal =
    (phase === 'CHALLENGE_WINDOW' || phase === 'BLOCK_WINDOW') &&
    currentAction &&
    isLocalAlive &&
    !hasResponded &&
    !isExcludedFromReaction;

  // 2. Reveal Card Modal (Challenge Defense)
  // Show if local player is challenged and must reveal a card to defend
  const showRevealModal =
    (phase === 'CHALLENGE_REACTION' || phase === 'BLOCK_REACTION') &&
    pendingRevealPlayerId === localPlayerId &&
    isLocalAlive;

  const localActiveCards = localPlayer?.cards.filter((c) => !c.revealed).map((c) => c.role) || [];

  // 3. Lose Influence Modal
  // Show if local player must discard a card
  const showLoseInfluenceModal =
    phase === 'INFLUENCE_LOSS_PENDING' &&
    pendingLossPlayerId === localPlayerId &&
    isLocalAlive;

  // 4. Ambassador Exchange Modal
  // Show if local player is performing exchange
  const showExchangeModal =
    phase === 'EXCHANGING' &&
    activePlayer?.id === localPlayerId &&
    isLocalAlive;

  return (
    <div className="game-container">
      {/* Header Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          background: 'rgba(11, 13, 16, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onLeave}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={14} /> Leave Table
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Room: <strong style={{ color: 'white' }}>{gameState.players[0]?.name}'s Game</strong>
          </span>
        </div>

        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '0.1em' }}>
            COUP ONLINE
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onToggleMute}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px' }}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={() => setShowMobileLogs(true)}
            className="btn btn-secondary mobile-log-trigger"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Terminal size={14} /> Logs
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <BookOpen size={14} /> Rules
          </button>
          {isHost && (
            <button
              onClick={onResetGame}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={14} /> Restart Game
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="main-layout">
        
        {/* Left Column: Board Seating Area */}
        <div className="board-area">
          {/* Seats container */}
          <div className="seats-container">{renderSeats()}</div>

          {/* Table Center Hub */}
          <div className="table-center">
            {/* Center Information */}
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                marginBottom: '8px',
              }}
            >
              Status Hub
            </span>

            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                padding: '0 24px',
                marginBottom: '24px',
                lineHeight: '1.4',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {getCenterStatus()}
            </span>

            {/* Central deck and coin representations */}
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center' }}>
              {/* Deck representation */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '66px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--accent-gold)',
                    background: 'linear-gradient(135deg, #1b1712 0%, #0d0b0a 100%)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.8), -3px 3px 0 #12100d, -6px 6px 0 #0d0b0a',
                    transform: 'rotate(-5deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '7px', fontWeight: 800, color: 'var(--accent-gold)' }}>COUP</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>
                  Deck: {deckSize}
                </span>
              </div>

              {/* Coin stack representation */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '2px solid var(--accent-gold)',
                    boxShadow: '0 0 15px var(--accent-gold-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Coins size={20} style={{ color: 'var(--accent-gold)' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Treasury: {treasuryCoins}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Only displayed to active player on their turn) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '460px',
              zIndex: 30,
              pointerEvents: 'auto',
            }}
          >
            {isLocalTurn && phase === 'RESOLVING' && !currentAction && isLocalAlive && (
              <ActionPanel
                players={players}
                localPlayerId={localPlayerId}
                localPlayerCards={localActiveCards}
                onDeclareAction={onDeclareAction}
              />
            )}
          </div>
        </div>

        {/* Right Column: Game Logs ledger sidebar */}
        <div className="desktop-log-sidebar" style={{ height: '100%' }}>
          <GameLog logs={logs} />
        </div>
      </div>

      {/* MODALS SECTION */}

      {/* 1. Reaction Overlay Modal (Challenge/Block) */}
      {showReactionModal && currentAction && (
        <ChallengeBlockModal
          currentAction={currentAction}
          phase={phase as 'CHALLENGE_WINDOW' | 'BLOCK_WINDOW'}
          players={players}
          localPlayerId={localPlayerId}
          localPlayerCards={localActiveCards}
          onRespond={onRespondAction}
        />
      )}

      {/* 2. Challenge Reveal Card Modal */}
      {showRevealModal && (
        <CardSelectionModal
          title="Prove Your Claim!"
          description={`Another player has challenged your claim! You must select your claimed card to show them. If you do not have it, you will lose it permanently.`}
          cards={localActiveCards}
          countToSelect={1}
          onSubmit={(indexes) => {
            // Translate the active face-down selection index back to the absolute hand index
            const faceDownIndexes: number[] = [];
            localPlayer!.cards.forEach((c, idx) => {
              if (!c.revealed) faceDownIndexes.push(idx);
            });
            onRevealCard(faceDownIndexes[indexes[0]]);
          }}
        />
      )}

      {/* 3. Lose Influence Modal */}
      {showLoseInfluenceModal && (
        <CardSelectionModal
          title="Lose Influence"
          description="You were targetted by a Coup, assassination, or failed a challenge. Choose one of your active influence cards to flip face-up permanently."
          cards={localActiveCards}
          countToSelect={1}
          onSubmit={(indexes) => {
            // Translate active face-down index to absolute index
            const faceDownIndexes: number[] = [];
            localPlayer!.cards.forEach((c, idx) => {
              if (!c.revealed) faceDownIndexes.push(idx);
            });
            onLoseInfluence(faceDownIndexes[indexes[0]]);
          }}
        />
      )}

      {/* 4. Ambassador Exchange Modal */}
      {showExchangeModal && (
        <CardSelectionModal
          title="Ambassador Exchange"
          description={`Select exactly ${localActiveCards.length} cards to KEEP. The unselected cards will be returned to the Court Deck.`}
          cards={gameState.ambassadorOptions}
          countToSelect={localActiveCards.length}
          originalCount={localActiveCards.length}
          onSubmit={(indexes) => {
            // Map selected indexes to their roles
            const selected = indexes.map((idx) => gameState.ambassadorOptions[idx]);
            onResolveExchange(selected);
          }}
        />
      )}

      {/* 5. Game Over / Win Modal Overlay */}
      {phase === 'GAME_OVER' && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-heavy" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: '400px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '2px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 20px var(--accent-gold-glow)',
              }}
            >
              <Trophy size={36} style={{ color: 'var(--accent-gold)' }} />
            </div>

            <h2 className="title-glow" style={{ fontSize: '28px', marginBottom: '8px' }}>
              VICTORY!
            </h2>
            
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              {players.find((p) => p.id === gameState.winnerId)?.name} wins the game!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isHost ? (
                <button
                  onClick={onResetGame}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px' }}
                >
                  Play Again
                </button>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px' }}>
                  Waiting for host to restart the game...
                </p>
              )}
              <button
                onClick={onLeave}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px' }}
              >
                Exit to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
      {showRules && <RuleBookModal onClose={() => setShowRules(false)} />}
      {showMobileLogs && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content glass-panel-heavy" style={{ padding: '0', width: '90%', maxWidth: '400px', height: '80vh', display: 'flex', flexDirection: 'column', border: '1.5px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>GAME LEDGER</span>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setShowMobileLogs(false)}>
                Close
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <GameLog logs={logs} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
