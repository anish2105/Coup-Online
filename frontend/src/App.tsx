import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';

interface LobbyOverview {
  id: string;
  name: string;
  playerCount: number;
  phase: string;
}

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

const PLAYER_ID = (() => {
  let id = localStorage.getItem('coup_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('coup_player_id', id);
  }
  return id;
})();

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbies, setLobbies] = useState<LobbyOverview[]>([]);
  const [joinedLobbyId, setJoinedLobbyId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<CoupGameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Connect to backend socket server
    const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      
      // Auto-reconnect if we were in a lobby before
      const savedLobbyId = localStorage.getItem('coup_joined_lobby_id');
      const savedPlayerName = localStorage.getItem('coup_player_name');
      if (savedLobbyId && savedPlayerName) {
        setJoinedLobbyId(savedLobbyId);
        newSocket.emit('join_lobby', {
          lobbyId: savedLobbyId,
          playerName: savedPlayerName,
          playerId: PLAYER_ID
        });
      }
    });

    newSocket.on('lobby_overview', (overview: LobbyOverview[]) => {
      setLobbies(overview);
    });

    newSocket.on('game_state', (state: CoupGameState) => {
      setGameState(state);
    });

    newSocket.on('left_lobby', () => {
      localStorage.removeItem('coup_joined_lobby_id');
      localStorage.removeItem('coup_player_name');
      setJoinedLobbyId(null);
      setGameState(null);
    });

    newSocket.on('error_message', (msg: string) => {
      setErrorMsg(msg);
      
      // Clear localStorage if rejoin fails due to full room or active game
      if (msg.includes('already in progress') || msg.includes('full') || msg.includes('Invalid')) {
        localStorage.removeItem('coup_joined_lobby_id');
        localStorage.removeItem('coup_player_name');
        setJoinedLobbyId(null);
        setGameState(null);
      }

      // Auto dismiss error toast
      setTimeout(() => {
        setErrorMsg(null);
      }, 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinLobby = useCallback((lobbyId: string, playerName: string) => {
    if (!socket) return;
    
    // Save lobby details in localStorage for reload tolerance
    localStorage.setItem('coup_joined_lobby_id', lobbyId);
    localStorage.setItem('coup_player_name', playerName);
    
    setJoinedLobbyId(lobbyId);
    socket.emit('join_lobby', { lobbyId, playerName, playerId: PLAYER_ID });
  }, [socket]);

  const handleLeaveLobby = useCallback(() => {
    if (!socket) return;
    
    // Clear lobby details from localStorage
    localStorage.removeItem('coup_joined_lobby_id');
    localStorage.removeItem('coup_player_name');
    
    socket.emit('leave_lobby');
  }, [socket]);

  const handleStartGame = useCallback(() => {
    if (!socket) return;
    socket.emit('start_game');
  }, [socket]);

  const handleDeclareAction = useCallback((
    type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange',
    targetId?: string
  ) => {
    if (!socket) return;
    socket.emit('declare_action', { type, targetId });
  }, [socket]);

  const handleRespondAction = useCallback((response: 'pass' | 'challenge' | 'block', blockRole?: string) => {
    if (!socket) return;
    socket.emit('respond_action', { response, blockRole });
  }, [socket]);

  const handleRevealCard = useCallback((cardIndex: number) => {
    if (!socket) return;
    socket.emit('reveal_card', { cardIndex });
  }, [socket]);

  const handleLoseInfluence = useCallback((cardIndex: number) => {
    if (!socket) return;
    socket.emit('lose_influence', { cardIndex });
  }, [socket]);

  const handleResolveExchange = useCallback((selectedCards: string[]) => {
    if (!socket) return;
    socket.emit('resolve_exchange', { selectedCards });
  }, [socket]);

  const handleResetGame = useCallback(() => {
    if (!socket) return;
    socket.emit('reset_game');
  }, [socket]);

  if (!socket) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="active-ring" style={{ position: 'relative', width: '20px', height: '20px', borderRadius: '50%', top: 0, left: 0, right: 0, bottom: 0 }} />
          <span>Connecting to Coup server...</span>
        </div>
      </div>
    );
  }

  // Determine whether to display the lobby view or the active game board
  const inGame = gameState && gameState.phase !== 'LOBBY';

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      {/* Global Error Toast Notification */}
      {errorMsg && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderLeft: '4px solid var(--color-assassin)',
            backgroundColor: 'rgba(18, 22, 28, 0.95)',
            color: 'white',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-assassin)' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {inGame ? (
        <GameBoard
          gameState={gameState}
          localPlayerId={PLAYER_ID}
          onDeclareAction={handleDeclareAction}
          onRespondAction={handleRespondAction}
          onRevealCard={handleRevealCard}
          onLoseInfluence={handleLoseInfluence}
          onResolveExchange={handleResolveExchange}
          onResetGame={handleResetGame}
          onLeave={handleLeaveLobby}
        />
      ) : (
        <Lobby
          lobbies={lobbies}
          joinedLobbyId={joinedLobbyId}
          players={gameState ? gameState.players : []}
          localPlayerId={PLAYER_ID}
          onJoin={handleJoinLobby}
          onLeave={handleLeaveLobby}
          onStartGame={handleStartGame}
        />
      )}
    </div>
  );
}

export default App;
