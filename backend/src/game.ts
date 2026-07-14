export interface Player {
  id: string;
  name: string;
  coins: number;
  cards: {
    role: string;
    revealed: boolean;
  }[];
  eliminated: boolean;
  isHost: boolean;
  online?: boolean;
  disconnectExpiresAt?: number | null;
}

export interface GameLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'action' | 'challenge' | 'block' | 'reveal' | 'coins' | 'system' | 'elimination';
}

export type GamePhase =
  | 'LOBBY'
  | 'CHALLENGE_WINDOW'
  | 'BLOCK_WINDOW'
  | 'CHALLENGE_REACTION'
  | 'BLOCK_REACTION'
  | 'RESOLVING'
  | 'EXCHANGING'
  | 'INFLUENCE_LOSS_PENDING'
  | 'GAME_OVER';

export interface ActionPayload {
  type: 'income' | 'foreign_aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange';
  sourceId: string;
  targetId?: string;
  challengerId?: string;
  blockerId?: string;
  blockRole?: string;
  challengeSuccess?: boolean;
  blockSuccess?: boolean;
}

export interface CoupGameState {
  players: Player[];
  deck: string[];
  currentPlayerIndex: number;
  phase: GamePhase;
  currentAction: ActionPayload | null;
  pendingLossReason: 'coup' | 'assassinate' | 'challenge_failed' | 'block_challenge_failed' | null;
  pendingLossPlayerId: string | null;
  pendingRevealPlayerId: string | null;
  pendingActionAfterLoss: 'RESOLVE' | 'BLOCK_WINDOW' | 'NEXT_TURN' | null;
  responses: Record<string, { response: 'pass' | 'challenge' | 'block'; blockRole?: string }>;
  logs: GameLog[];
  winnerId: string | null;
  ambassadorOptions: string[];
}

export class CoupGame {
  private state: CoupGameState;

  constructor() {
    this.state = {
      players: [],
      deck: [],
      currentPlayerIndex: 0,
      phase: 'LOBBY',
      currentAction: null,
      pendingLossReason: null,
      pendingLossPlayerId: null,
      pendingRevealPlayerId: null,
      pendingActionAfterLoss: null,
      responses: {},
      logs: [],
      winnerId: null,
      ambassadorOptions: [],
    };
  }

  public getState(): CoupGameState {
    return this.state;
  }

  public addLog(message: string, type: GameLog['type']) {
    this.state.logs.push({
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      type,
    });
  }

  public addPlayer(id: string, name: string): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    if (this.state.players.length >= 6) return false;

    const isHost = this.state.players.length === 0;
    this.state.players.push({
      id,
      name,
      coins: 2,
      cards: [],
      eliminated: false,
      isHost,
      online: true,
    });

    this.addLog(`${name} joined the lobby.`, 'system');
    return true;
  }

  public removePlayer(id: string) {
    const playerIndex = this.state.players.findIndex((p) => p.id === id);
    if (playerIndex === -1) return;

    const player = this.state.players[playerIndex];
    this.addLog(`${player.name} left the game.`, 'system');

    // If host leaves, assign host to someone else
    if (player.isHost && this.state.players.length > 1) {
      const nextHost = this.state.players.find((p) => p.id !== id);
      if (nextHost) {
        nextHost.isHost = true;
        this.addLog(`${nextHost.name} is now the host.`, 'system');
      }
    }

    if (this.state.phase === 'LOBBY') {
      this.state.players.splice(playerIndex, 1);
    } else {
      // If mid-game, mark as eliminated and reveal cards
      player.eliminated = true;
      player.cards.forEach((c) => (c.revealed = true));
      this.checkWinner();
      if (this.state.phase !== 'GAME_OVER' && this.getCurrentPlayer()?.id === id) {
        this.nextTurn();
      }
    }
  }

  public setPlayerOnline(id: string, online: boolean) {
    const player = this.state.players.find((p) => p.id === id);
    if (player) {
      player.online = online;
      if (online) {
        player.disconnectExpiresAt = null;
      }
      this.addLog(`${player.name} is now ${online ? 'online' : 'offline'}.`, 'system');
    }
  }

  public eliminatePlayerOffline(id: string) {
    const player = this.state.players.find((p) => p.id === id);
    if (player && !player.eliminated) {
      player.eliminated = true;
      player.coins = 0;
      player.disconnectExpiresAt = null;
      player.cards.forEach((c) => (c.revealed = true));
      this.addLog(`${player.name} disconnected for too long and was eliminated.`, 'elimination');

      if (this.checkWinner()) return;

      // If they were in the middle of exchanging cards, return pool to deck
      if (this.state.phase === 'EXCHANGING' && this.state.currentPlayerIndex !== -1) {
        const activePlayer = this.state.players[this.state.currentPlayerIndex];
        if (activePlayer && activePlayer.id === id) {
          if (this.state.ambassadorOptions && this.state.ambassadorOptions.length > 0) {
            this.state.deck.push(...this.state.ambassadorOptions);
            this.state.deck = this.shuffle(this.state.deck);
            this.state.ambassadorOptions = [];
          }
        }
      }

      // If they were active or reaction was pending on them, skip to next turn
      const isPendingReveal = this.state.pendingRevealPlayerId === id;
      const isPendingLoss = this.state.pendingLossPlayerId === id;
      const isCurrentPlayer = this.state.players[this.state.currentPlayerIndex]?.id === id;

      if (isCurrentPlayer || isPendingReveal || isPendingLoss) {
        this.state.pendingRevealPlayerId = null;
        this.state.pendingLossPlayerId = null;
        this.nextTurn();
      }
    }
  }

  public startGame(): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    if (this.state.players.length < 2) return false;

    // Create Court Deck (3 of each character)
    const characters = ['duke', 'assassin', 'captain', 'ambassador', 'contessa'];
    const newDeck: string[] = [];
    characters.forEach((char) => {
      newDeck.push(char, char, char);
    });

    this.state.deck = this.shuffle(newDeck);

    // Deal cards and set coins
    this.state.players.forEach((player) => {
      player.coins = 2;
      player.eliminated = false;
      player.cards = [
        { role: this.state.deck.pop()!, revealed: false },
        { role: this.state.deck.pop()!, revealed: false },
      ];
    });

    this.state.phase = 'CHALLENGE_WINDOW'; // Start in a window, but wait, let's just make it the active player's choice
    // Let's use RESOLVING or turn-init phase. Actually, we start at turn 0 and phase LOBBY -> first player turn.
    // Let's set phase to RESOLVING but wait for active player action. Let's make an active turn phase:
    // Let's reuse "CHALLENGE_WINDOW" as wait action, but let's make a state or clean flow.
    this.state.currentPlayerIndex = Math.floor(Math.random() * this.state.players.length);
    this.state.currentAction = null;
    this.state.phase = 'RESOLVING'; // In resolving state with null action means waiting for player action!
    this.addLog(`Game started! It's ${this.getCurrentPlayer()!.name}'s turn.`, 'system');
    return true;
  }

  private shuffle(array: string[]): string[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public getCurrentPlayer(): Player | null {
    if (this.state.players.length === 0) return null;
    return this.state.players[this.state.currentPlayerIndex];
  }

  public declareAction(
    sourceId: string,
    type: ActionPayload['type'],
    targetId?: string
  ): boolean {
    const actor = this.getCurrentPlayer();
    if (!actor || actor.id !== sourceId) return false;
    if (this.state.phase !== 'RESOLVING' || this.state.currentAction !== null) return false;

    // Check mandatory Coup at 10+ coins
    if (actor.coins >= 10 && type !== 'coup') {
      return false;
    }

    // Check costs
    if (type === 'coup') {
      if (actor.coins < 7) return false;
      actor.coins -= 7;
      this.addLog(`${actor.name} performs a Coup on ${this.getPlayerName(targetId!)}.`, 'action');
    } else if (type === 'assassinate') {
      if (actor.coins < 3) return false;
      actor.coins -= 3;
      this.addLog(`${actor.name} declares Assassination on ${this.getPlayerName(targetId!)}.`, 'action');
    } else if (type === 'income') {
      actor.coins += 1;
      this.addLog(`${actor.name} takes Income (+1 coin).`, 'coins');
      this.nextTurn();
      return true;
    } else if (type === 'tax') {
      this.addLog(`${actor.name} claims Duke to take Tax (+3 coins).`, 'action');
    } else if (type === 'foreign_aid') {
      this.addLog(`${actor.name} requests Foreign Aid (+2 coins).`, 'action');
    } else if (type === 'steal') {
      this.addLog(
        `${actor.name} claims Captain to Steal 2 coins from ${this.getPlayerName(targetId!)}.`,
        'action'
      );
    } else if (type === 'exchange') {
      this.addLog(`${actor.name} claims Ambassador to Exchange cards.`, 'action');
    }

    this.state.currentAction = { type, sourceId, targetId };
    this.state.responses = {};

    // Determine next phase
    if (type === 'coup') {
      // Coup cannot be blocked or challenged. Target immediately loses influence.
      this.state.phase = 'INFLUENCE_LOSS_PENDING';
      this.state.pendingLossPlayerId = targetId!;
      this.state.pendingLossReason = 'coup';
      this.state.pendingActionAfterLoss = 'NEXT_TURN';
    } else if (type === 'foreign_aid') {
      // Foreign aid cannot be challenged, but can be blocked by Duke
      this.state.phase = 'BLOCK_WINDOW';
    } else {
      // Tax, Assassinate, Steal, Exchange can be challenged
      this.state.phase = 'CHALLENGE_WINDOW';
    }

    return true;
  }

  public handleResponse(
    playerId: string,
    response: 'pass' | 'challenge' | 'block',
    blockRole?: string
  ): boolean {
    if (
      this.state.phase !== 'CHALLENGE_WINDOW' &&
      this.state.phase !== 'BLOCK_WINDOW'
    ) {
      return false;
    }

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.eliminated) return false;

    // Check if player already responded
    if (this.state.responses[playerId]) return false;

    // Exclude the player whose claim is being challenged/blocked from responding:
    // - In CHALLENGE_WINDOW: the actor (sourceId) cannot challenge.
    // - In BLOCK_WINDOW (before block): the actor (sourceId) cannot block.
    // - In BLOCK_WINDOW (after block): the blocker (blockerId) cannot challenge/block.
    const excludeId =
      this.state.phase === 'BLOCK_WINDOW' && this.state.currentAction?.blockerId
        ? this.state.currentAction.blockerId
        : this.state.currentAction?.sourceId;

    if (playerId === excludeId && response !== 'pass') {
      return false;
    }

    // Target check for block
    if (response === 'block') {
      if (this.state.currentAction?.type === 'assassinate' && this.state.currentAction.targetId !== playerId) {
        return false; // Only target can block assassination
      }
      if (this.state.currentAction?.type === 'steal' && this.state.currentAction.targetId !== playerId) {
        return false; // Only target can block steal
      }
    }

    this.state.responses[playerId] = { response, blockRole };

    // If anyone challenges or blocks, process it immediately
    if (response === 'challenge') {
      this.processChallenge(playerId);
      return true;
    }

    if (response === 'block') {
      this.processBlock(playerId, blockRole!);
      return true;
    }

    const activeOpponents = this.state.players.filter(
      (p) => !p.eliminated && p.id !== excludeId
    );

    const allPassed = activeOpponents.every((p) => {
      if (p.online === false) return true;
      return this.state.responses[p.id]?.response === 'pass';
    });

    if (allPassed) {
      if (this.state.phase === 'CHALLENGE_WINDOW') {
        // Challenging passed. Is it blockable?
        const blockable = ['foreign_aid', 'assassinate', 'steal'].includes(
          this.state.currentAction!.type
        );
        if (blockable) {
          this.state.phase = 'BLOCK_WINDOW';
          this.state.responses = {}; // reset responses for block window
        } else {
          this.resolveAction();
        }
      } else if (this.state.phase === 'BLOCK_WINDOW') {
        if (this.state.currentAction?.blockerId) {
          // Block challenge window: all players passed the challenge to the block
          // The block succeeds, action is cancelled
          const blocker = this.state.players.find((p) => p.id === this.state.currentAction?.blockerId)!;
          this.addLog(`${blocker.name}'s block was accepted. Action cancelled.`, 'system');
          this.nextTurn();
        } else {
          // Normal block window: all players chose to pass without blocking
          // The action succeeds, resolve it
          this.resolveAction();
        }
      }
    }

    return true;
  }

  private processChallenge(challengerId: string) {
    const action = this.state.currentAction!;
    const challenger = this.state.players.find((p) => p.id === challengerId)!;

    this.addLog(`${challenger.name} challenges the claim.`, 'challenge');

    if (this.state.phase === 'CHALLENGE_WINDOW') {
      // Challenge the active action
      this.state.phase = 'CHALLENGE_REACTION';
      this.state.pendingRevealPlayerId = action.sourceId;
      action.challengerId = challengerId;
    } else if (this.state.phase === 'BLOCK_WINDOW') {
      // Challenge the block claim
      this.state.phase = 'BLOCK_REACTION';
      this.state.pendingRevealPlayerId = action.blockerId!;
      action.challengerId = challengerId;
    }
  }

  private processBlock(blockerId: string, blockRole: string) {
    const action = this.state.currentAction!;
    const blocker = this.state.players.find((p) => p.id === blockerId)!;

    this.addLog(
      `${blocker.name} blocks the action by claiming ${this.capitalize(blockRole)}.`,
      'block'
    );

    action.blockerId = blockerId;
    action.blockRole = blockRole;

    // Reset responses and open the challenge window for this block
    this.state.phase = 'BLOCK_WINDOW'; // In block window, players can now challenge the blocker
    this.state.responses = {};
    // Note: blocker cannot challenge their own block
  }

  public revealCard(playerId: string, cardIndex: number): boolean {
    if (
      this.state.phase !== 'CHALLENGE_REACTION' &&
      this.state.phase !== 'BLOCK_REACTION'
    ) {
      return false;
    }

    if (playerId !== this.state.pendingRevealPlayerId) return false;

    const revealer = this.state.players.find((p) => p.id === playerId)!;
    if (cardIndex < 0 || cardIndex >= revealer.cards.length) return false;

    const card = revealer.cards[cardIndex];
    if (card.revealed) return false;

    const action = this.state.currentAction!;
    const challenger = this.state.players.find((p) => p.id === action.challengerId!)!;

    // Check if challenge is against block or action
    const isBlockChallenge = this.state.phase === 'BLOCK_REACTION';
    const requiredRole = isBlockChallenge ? action.blockRole : this.getRequiredRole(action.type);

    let hasCorrectRole = false;
    if (requiredRole === 'captain_or_ambassador') {
      hasCorrectRole = card.role === 'captain' || card.role === 'ambassador';
    } else {
      hasCorrectRole = card.role === requiredRole;
    }

    this.addLog(
      `${revealer.name} reveals ${this.capitalize(card.role)}.`,
      'reveal'
    );

    if (hasCorrectRole) {
      // Revealer is telling the truth!
      this.addLog(`${revealer.name} was telling the truth! Challenge failed.`, 'challenge');
      
      // Shuffle revealed card back into deck and draw a new one
      this.state.deck.push(card.role);
      this.state.deck = this.shuffle(this.state.deck);
      revealer.cards[cardIndex] = {
        role: this.state.deck.pop()!,
        revealed: false,
      };

      // Challenger loses influence
      this.state.phase = 'INFLUENCE_LOSS_PENDING';
      this.state.pendingLossPlayerId = challenger.id;
      this.state.pendingLossReason = 'challenge_failed';

      if (isBlockChallenge) {
        // Block is successful, so action is cancelled
        this.state.pendingActionAfterLoss = 'NEXT_TURN';
      } else {
        // Action is valid, but can it be blocked now?
        const blockable = ['foreign_aid', 'assassinate', 'steal'].includes(action.type);
        const isChallengerTarget = challenger.id === action.targetId;
        
        if (blockable && !isChallengerTarget) {
          this.state.pendingActionAfterLoss = 'BLOCK_WINDOW';
        } else {
          this.state.pendingActionAfterLoss = 'RESOLVE';
        }
      }
    } else {
      // Revealer was bluffing!
      this.addLog(`${revealer.name} was bluffing! Challenge succeeded.`, 'challenge');

      // Revealer loses this card permanently
      card.revealed = true;
      
      // Check if revealer is eliminated
      this.checkPlayerElimination(revealer);

      // Challenger wins. Action fails/succeeds depending on who bluffed
      if (isBlockChallenge) {
        // Blocker bluffed, so block fails, original action succeeds!
        this.resolveAction();
      } else {
        // Actor bluffed, so action fails
        this.nextTurn();
      }
    }

    return true;
  }

  public loseInfluence(playerId: string, cardIndex: number): boolean {
    if (this.state.phase !== 'INFLUENCE_LOSS_PENDING') return false;
    if (playerId !== this.state.pendingLossPlayerId) return false;

    const player = this.state.players.find((p) => p.id === playerId)!;
    if (cardIndex < 0 || cardIndex >= player.cards.length) return false;

    const card = player.cards[cardIndex];
    if (card.revealed) return false;

    card.revealed = true;
    this.addLog(`${player.name} loses influence: ${this.capitalize(card.role)}.`, 'reveal');

    this.checkPlayerElimination(player);

    // Resume action resolution
    const nextPhase = this.state.pendingActionAfterLoss;
    this.state.pendingLossPlayerId = null;
    this.state.pendingLossReason = null;
    this.state.pendingActionAfterLoss = null;

    if (this.checkWinner()) return true;

    if (nextPhase === 'NEXT_TURN') {
      this.nextTurn();
    } else if (nextPhase === 'RESOLVE') {
      this.resolveAction();
    } else if (nextPhase === 'BLOCK_WINDOW') {
      this.state.phase = 'BLOCK_WINDOW';
      this.state.responses = {};
    }

    return true;
  }

  private resolveAction() {
    const action = this.state.currentAction!;
    const actor = this.state.players.find((p) => p.id === action.sourceId)!;

    if (actor.eliminated) {
      this.nextTurn();
      return;
    }

    this.state.phase = 'RESOLVING';

    if (action.type === 'tax') {
      actor.coins += 3;
      this.addLog(`${actor.name} receives Tax (+3 coins).`, 'coins');
      this.nextTurn();
    } else if (action.type === 'foreign_aid') {
      actor.coins += 2;
      this.addLog(`${actor.name} receives Foreign Aid (+2 coins).`, 'coins');
      this.nextTurn();
    } else if (action.type === 'steal') {
      const target = this.state.players.find((p) => p.id === action.targetId!)!;
      const stolen = Math.min(target.coins, 2);
      target.coins -= stolen;
      actor.coins += stolen;
      this.addLog(`${actor.name} steals ${stolen} coins from ${target.name}.`, 'coins');
      this.nextTurn();
    } else if (action.type === 'assassinate') {
      const target = this.state.players.find((p) => p.id === action.targetId!)!;
      this.addLog(`${actor.name} assassinates ${target.name}.`, 'action');

      // Target loses influence
      this.state.phase = 'INFLUENCE_LOSS_PENDING';
      this.state.pendingLossPlayerId = target.id;
      this.state.pendingLossReason = 'assassinate';
      this.state.pendingActionAfterLoss = 'NEXT_TURN';
    } else if (action.type === 'exchange') {
      // Draw 2 cards from deck
      const options = [
        ...actor.cards.filter((c) => !c.revealed).map((c) => c.role),
        this.state.deck.pop()!,
        this.state.deck.pop()!,
      ];
      this.state.ambassadorOptions = options;
      this.state.phase = 'EXCHANGING';
    }
  }

  public resolveExchange(playerId: string, selectedCards: string[]): boolean {
    if (this.state.phase !== 'EXCHANGING') return false;
    const actor = this.getCurrentPlayer();
    if (!actor || actor.id !== playerId) return false;

    const activeCards = actor.cards.filter((c) => !c.revealed);
    if (selectedCards.length !== activeCards.length) return false;

    // Verify all selected cards were in the option pool
    const pool = [...this.state.ambassadorOptions];
    for (const card of selectedCards) {
      const index = pool.indexOf(card);
      if (index === -1) return false;
      pool.splice(index, 1);
    }

    // Set player cards
    let selectIndex = 0;
    actor.cards = actor.cards.map((c) => {
      if (c.revealed) return c;
      return { role: selectedCards[selectIndex++], revealed: false };
    });

    // Return remaining pool to deck
    this.state.deck.push(...pool);
    this.state.deck = this.shuffle(this.state.deck);

    this.addLog(`${actor.name} completed card exchange.`, 'action');
    this.state.ambassadorOptions = [];
    this.nextTurn();
    return true;
  }

  private checkPlayerElimination(player: Player) {
    const allRevealed = player.cards.every((c) => c.revealed);
    if (allRevealed && !player.eliminated) {
      player.eliminated = true;
      player.coins = 0; // return coins to treasury
      this.addLog(`${player.name} has been eliminated!`, 'elimination');
    }
  }

  private checkWinner(): boolean {
    const activePlayers = this.state.players.filter((p) => !p.eliminated);
    if (activePlayers.length === 1 && this.state.phase !== 'LOBBY') {
      this.state.phase = 'GAME_OVER';
      this.state.winnerId = activePlayers[0].id;
      this.addLog(`${activePlayers[0].name} wins the game!`, 'system');
      return true;
    }
    return false;
  }

  public nextTurn() {
    if (this.checkWinner()) return;

    this.state.currentAction = null;
    this.state.responses = {};
    this.state.phase = 'RESOLVING';

    // Find next active player
    let nextIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    while (this.state.players[nextIndex].eliminated) {
      nextIndex = (nextIndex + 1) % this.state.players.length;
    }

    this.state.currentPlayerIndex = nextIndex;
    const nextPlayer = this.state.players[nextIndex];
    this.addLog(`It's ${nextPlayer.name}'s turn.`, 'system');
  }

  private getRequiredRole(actionType: string): string {
    switch (actionType) {
      case 'tax':
        return 'duke';
      case 'assassinate':
        return 'assassin';
      case 'steal':
        return 'captain';
      case 'exchange':
        return 'ambassador';
      default:
        return '';
    }
  }

  private getPlayerName(id: string): string {
    return this.state.players.find((p) => p.id === id)?.name || 'Unknown';
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
