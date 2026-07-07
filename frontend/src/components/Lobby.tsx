import React, { useState } from 'react';
import { Users, Play, LogOut, ArrowRight, User, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { RuleBookModal } from './RuleBookModal';

interface LobbyOverview {
  id: string;
  name: string;
  playerCount: number;
  phase: string;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface LobbyProps {
  lobbies: LobbyOverview[];
  joinedLobbyId: string | null;
  players: Player[];
  localPlayerId: string;
  onJoin: (lobbyId: string, name: string) => void;
  onLeave: () => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  lobbies,
  joinedLobbyId,
  players,
  localPlayerId,
  onJoin,
  onLeave,
  onStartGame,
  isMuted,
  onToggleMute,
}) => {
  const [name, setName] = useState('');
  const [selectedLobby, setSelectedLobby] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleJoinClick = (lobbyId: string) => {
    if (!name.trim()) {
      setError('Please enter your name first.');
      return;
    }
    setError('');
    onJoin(lobbyId, name.trim());
  };

  const currentLobby = lobbies.find((l) => l.id === joinedLobbyId);
  const localPlayer = players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost || false;

  // View 1: Lobby Selection Screen
  if (!joinedLobbyId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '20px' }}>
        <div className="glass-panel-heavy" style={{ width: '100%', maxWidth: '480px', padding: '32px', position: 'relative' }}>
          {/* Mute button on top-right of panel */}
          <button
            onClick={onToggleMute}
            className="btn btn-secondary"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
            }}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 className="title-glow" style={{ fontSize: '32px', marginBottom: '8px' }}>C O U P</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Bluff, Steal, and Assassinate your way to victory.
            </p>
            <button
              onClick={() => setShowRules(true)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={14} /> Read Rule Book
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Choose Your Persona
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                maxLength={15}
                placeholder="Enter nickname..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError('');
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '12px 16px 12px 42px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-glass)')}
              />
            </div>
            {error && <p style={{ color: 'var(--color-assassin)', fontSize: '13px', marginTop: '6px' }}>{error}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
              Select a Game Room
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lobbies.map((lobby) => {
                const inProgress = lobby.phase !== 'LOBBY';
                const isFull = lobby.playerCount >= 6;
                return (
                  <button
                    key={lobby.id}
                    disabled={inProgress || isFull}
                    onClick={() => handleJoinClick(lobby.id)}
                    className="glass-panel"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      cursor: inProgress || isFull ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      opacity: inProgress || isFull ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!inProgress && !isFull) {
                        e.currentTarget.style.borderColor = 'var(--accent-gold)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!inProgress && !isFull) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '16px', color: 'white', fontWeight: 600 }}>{lobby.name}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {inProgress ? 'In Progress' : isFull ? 'Full (6/6)' : 'Open Lobby'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <Users size={16} />
                        {lobby.playerCount}/6
                      </span>
                      <ArrowRight size={16} style={{ color: 'var(--accent-gold)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {showRules && <RuleBookModal onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  // View 2: Waiting Room inside a Lobby
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '20px' }}>
      <div className="glass-panel-heavy" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 600 }}>
              Waiting Room
            </span>
            <h2 style={{ fontSize: '24px', color: 'white' }}>{currentLobby?.name || 'Coup Room'}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onToggleMute}
              className="btn btn-secondary"
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px' }}
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={14} /> Rules
            </button>
            <button
              onClick={onLeave}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <LogOut size={14} /> Leave
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} />
            Buddies in Room ({players.length}/6)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: p.id === localPlayerId ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: p.id === localPlayerId ? '1px solid rgba(212, 175, 55, 0.15)' : '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: p.isHost ? 'var(--accent-gold)' : 'var(--color-ambassador)',
                      boxShadow: p.isHost ? '0 0 8px var(--accent-gold)' : '0 0 8px var(--color-ambassador)',
                    }}
                  />
                  <span style={{ fontWeight: 500, color: p.id === localPlayerId ? 'var(--accent-gold)' : 'white' }}>
                    {p.name} {p.id === localPlayerId && '(You)'}
                  </span>
                </div>
                {p.isHost && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', borderRadius: '4px', padding: '1px 6px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          {isHost ? (
            <div>
              <button
                disabled={players.length < 2}
                onClick={onStartGame}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '16px' }}
              >
                <Play size={18} fill="black" />
                Start Game
              </button>
              {players.length < 2 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>
                  Waiting for at least 1 more friend to join before starting.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
              <div className="active-ring" style={{ position: 'relative', width: '14px', height: '14px', borderRadius: '50%', top: 0, left: 0, right: 0, bottom: 0 }} />
              <span>Waiting for host to start the game...</span>
            </div>
          )}
        </div>
      </div>
      {showRules && <RuleBookModal onClose={() => setShowRules(false)} />}
    </div>
  );
};
