import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CoupGame } from './game';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Initialize 5 lobbies
const LOBBY_IDS = ['lobby-1', 'lobby-2', 'lobby-3', 'lobby-4', 'lobby-5'];
const games: Record<string, CoupGame> = {};
const disconnectTimers: Record<string, NodeJS.Timeout> = {};
const playerSockets: Record<string, string> = {};

LOBBY_IDS.forEach((id) => {
  games[id] = new CoupGame();
});

// Helper to get global lobby list with count
function getLobbyList() {
  return LOBBY_IDS.map((id, index) => {
    const game = games[id];
    const state = game.getState();
    return {
      id,
      name: `Lobby ${index + 1}`,
      playerCount: state.players.length,
      phase: state.phase,
      playerIds: state.players.map((p) => p.id),
    };
  });
}

// Broadcast lobbies overview to all clients not in a game
function broadcastLobbyOverview() {
  io.emit('lobby_overview', getLobbyList());
}

// Check if lobby is empty and reset game state
function checkAndResetLobby(lobbyId: string) {
  const clients = io.sockets.adapter.rooms.get(lobbyId);
  const numClients = clients ? clients.size : 0;
  if (numClients === 0) {
    console.log(`Lobby ${lobbyId} is empty. Resetting game state.`);
    games[lobbyId] = new CoupGame();
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send current lobby overview on connection
  socket.emit('lobby_overview', getLobbyList());

  socket.on('join_lobby', ({ lobbyId, playerName, playerId }) => {
    if (!LOBBY_IDS.includes(lobbyId) || !playerId) {
      socket.emit('error_message', 'Invalid join parameters.');
      return;
    }

    const game = games[lobbyId];
    
    // Check if player is already in this lobby (reconnect)
    const state = game.getState();
    const existingPlayer = state.players.find(p => p.id === playerId);

    if (existingPlayer) {
      // Clear disconnect timer
      if (disconnectTimers[playerId]) {
        clearTimeout(disconnectTimers[playerId]);
        delete disconnectTimers[playerId];
      }
      game.setPlayerOnline(playerId, true);
      console.log(`Player ${playerName} (${playerId}) reconnected to lobby ${lobbyId}`);
    } else {
      const added = game.addPlayer(playerId, playerName);
      if (!added) {
        socket.emit('error_message', 'Lobby is full or game is already in progress.');
        return;
      }
    }

    // Set active socket for player
    playerSockets[playerId] = socket.id;

    // Bind lobby ID and playerId to socket
    socket.data.lobbyId = lobbyId;
    socket.data.playerId = playerId;
    socket.data.playerName = playerName;
    socket.join(lobbyId);

    // Sync state
    io.to(lobbyId).emit('game_state', game.getState());
    broadcastLobbyOverview();
  });

  socket.on('start_game', () => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const state = game.getState();
    
    // Only the host can start
    const player = state.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      socket.emit('error_message', 'Only the host can start the game.');
      return;
    }

    const started = game.startGame();
    if (started) {
      io.to(lobbyId).emit('game_state', game.getState());
      broadcastLobbyOverview();
    } else {
      socket.emit('error_message', 'Cannot start game. Ensure at least 2 players are in the lobby.');
    }
  });

  socket.on('declare_action', ({ type, targetId }) => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const success = game.declareAction(playerId, type, targetId);
    
    if (success) {
      io.to(lobbyId).emit('game_state', game.getState());
    } else {
      socket.emit('error_message', 'Action declared is invalid.');
    }
  });

  socket.on('respond_action', ({ response, blockRole }) => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const success = game.handleResponse(playerId, response, blockRole);

    if (success) {
      io.to(lobbyId).emit('game_state', game.getState());
    }
  });

  socket.on('reveal_card', ({ cardIndex }) => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const success = game.revealCard(playerId, cardIndex);

    if (success) {
      io.to(lobbyId).emit('game_state', game.getState());
    }
  });

  socket.on('lose_influence', ({ cardIndex }) => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const success = game.loseInfluence(playerId, cardIndex);

    if (success) {
      io.to(lobbyId).emit('game_state', game.getState());
    }
  });

  socket.on('resolve_exchange', ({ selectedCards }) => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    const game = games[lobbyId];
    const success = game.resolveExchange(playerId, selectedCards);

    if (success) {
      io.to(lobbyId).emit('game_state', game.getState());
    }
  });

  socket.on('reset_game', () => {
    const { lobbyId } = socket.data;
    if (!lobbyId) return;

    const game = games[lobbyId];
    const oldState = game.getState();

    // Recreate game for lobby
    const newGame = new CoupGame();
    games[lobbyId] = newGame;

    // Add back all original players who are still connected
    oldState.players.forEach((p) => {
      newGame.addPlayer(p.id, p.name);
    });

    io.to(lobbyId).emit('game_state', newGame.getState());
    broadcastLobbyOverview();
  });

  socket.on('leave_lobby', () => {
    const { lobbyId, playerId } = socket.data;
    if (!lobbyId || !playerId) return;

    // Clear any disconnect timer and active socket reference just in case
    if (disconnectTimers[playerId]) {
      clearTimeout(disconnectTimers[playerId]);
      delete disconnectTimers[playerId];
    }
    delete playerSockets[playerId];

    const game = games[lobbyId];
    game.removePlayer(playerId);

    socket.leave(lobbyId);
    socket.data.lobbyId = null;
    socket.data.playerId = null;

    io.to(lobbyId).emit('game_state', game.getState());
    socket.emit('left_lobby');
    checkAndResetLobby(lobbyId);
    broadcastLobbyOverview();
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const { lobbyId, playerId } = socket.data;
    if (lobbyId && playerId) {
      // ONLY trigger disconnect if this socket is still the active one!
      if (playerSockets[playerId] === socket.id) {
        const game = games[lobbyId];
        if (game) {
          // Store expiration timestamp on player object
          const state = game.getState();
          const player = state.players.find((p) => p.id === playerId);
          if (player) {
            player.disconnectExpiresAt = Date.now() + 25000;
          }

          // Toggle online status to false
          game.setPlayerOnline(playerId, false);
          io.to(lobbyId).emit('game_state', game.getState());

          // Cancel any existing disconnect timer for this player
          if (disconnectTimers[playerId]) {
            clearTimeout(disconnectTimers[playerId]);
          }

          // Set a 25-second grace period timer
          disconnectTimers[playerId] = setTimeout(() => {
            console.log(`Grace period expired for player ${playerId} in lobby ${lobbyId}`);
            delete disconnectTimers[playerId];
            delete playerSockets[playerId];

            const state = game.getState();
            if (state.phase === 'LOBBY') {
              // If still in lobby phase, just remove them
              game.removePlayer(playerId);
              io.to(lobbyId).emit('game_state', game.getState());
              checkAndResetLobby(lobbyId);
              broadcastLobbyOverview();
            } else {
              // If mid-game, eliminate them
              game.eliminatePlayerOffline(playerId);
              io.to(lobbyId).emit('game_state', game.getState());
              checkAndResetLobby(lobbyId);
            }
          }, 25000);
        }
      } else {
        console.log(`Disconnected socket ${socket.id} is obsolete for player ${playerId}. Active socket is ${playerSockets[playerId]}.`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
