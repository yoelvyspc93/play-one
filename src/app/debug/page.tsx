'use client';

import { useState, useReducer, useEffect } from 'react';
import { 
    gameReducer, 
    createInitialState, 
    ActionType, 
    CardColor, 
    GameState,
    Card,
    calculateBotMove
} from '../../engine';

export default function DebugPage() {
    const [botEnabled, setBotEnabled] = useState<Record<string, boolean>>({
        'player2': true,
        'player3': true
    });

    const [state, dispatch] = useReducer(gameReducer, null, () => 
        createInitialState(['player1', 'player2', 'player3'], ['Alice', 'Bob (Bot)', 'Charlie (Bot)'])
    );
    
    // Auto-start
    useEffect(() => {
        if (state.public.phase === 'LOBBY') {
            dispatch({ type: ActionType.START_GAME });
        }
    }, []);

    // Bot Loop
    useEffect(() => {
        const currentPlayerId = state.public.order[state.public.currentPlayerIndex];
        
        if (botEnabled[currentPlayerId] && state.public.winnerId === undefined) {
             const timer = setTimeout(() => {
                 const action = calculateBotMove(state, currentPlayerId);
                 if (action) {
                     console.log(`Bot ${currentPlayerId} Action:`, action);
                     dispatch(action);
                 } else {
                     console.warn(`Bot ${currentPlayerId} returned no action?`);
                 }
             }, 1000); // 1s delay for visual
             return () => clearTimeout(timer);
        }
    }, [state.public.stateVersion, state.public.phase, botEnabled]);

    const currentPlayerId = state.public.order[state.public.currentPlayerIndex];
    const currentPlayer = state.players[currentPlayerId];

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>Debug Engine + Bot</h1>
            
            <div style={{ marginBottom: 10 }}>
                <label>
                    <input type="checkbox" checked={botEnabled['player2']} onChange={e => setBotEnabled(p => ({...p, player2: e.target.checked}))} />
                    Enable Bot for Bob
                </label>
                <label style={{ marginLeft: 10 }}>
                    <input type="checkbox" checked={botEnabled['player3']} onChange={e => setBotEnabled(p => ({...p, player3: e.target.checked}))} />
                    Enable Bot for Charlie
                </label>
            </div>
            
            <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1, border: '1px solid #ccc', padding: 10 }}>
                    <h2>Public State</h2>
                    <pre>{JSON.stringify(state.public, ((key, value) => {
                         if (key === 'players') return value.map((p: any) => ({ ...p, hand: 'HIDDEN' }));
                         return value;
                    }), 2)}</pre>
                </div>
                
                <div style={{ flex: 1, border: '1px solid #ccc', padding: 10 }}>
                    <h2>Controls (Current: {currentPlayer.name})</h2>
                    <p>Pending Draw: {state.public.pendingDraw}</p>
                    <p>Top Card: {state.public.topCard?.kind} {state.public.topCard?.color} {state.public.topCard?.number}</p>
                    <p>Current Color: {state.public.currentColor}</p>
                    
                    <h3>Hand ({currentPlayer.hand.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {currentPlayer.hand.map((card: Card) => (
                            <button 
                                key={card.id}
                                disabled={botEnabled[currentPlayer.id]} // Disable manual if bot on
                                onClick={() => dispatch({ 
                                    type: ActionType.PLAY_CARD, 
                                    playerId: currentPlayer.id, 
                                    cardId: card.id 
                                })}
                                style={{ 
                                    padding: 5,
                                    border: '1px solid black',
                                    background: card.color === CardColor.RED ? '#ffcccc' :
                                                card.color === CardColor.BLUE ? '#ccccff' :
                                                card.color === CardColor.GREEN ? '#ccffcc' :
                                                card.color === CardColor.YELLOW ? '#ffffcc' : '#eee'
                                }}
                            >
                                {card.kind} {card.number} {card.color === CardColor.WILD ? '🌈' : ''}
                            </button>
                        ))}
                    </div>
                    
                    <div style={{ marginTop: 20 }}>
                        <button 
                            disabled={botEnabled[currentPlayer.id]}
                            onClick={() => dispatch({ type: ActionType.DRAW_CARD, playerId: currentPlayer.id })}
                        >
                            DRAW CARD
                        </button>
                    </div>

                    {state.public.phase === 'CHOOSE_COLOR_REQUIRED' && (
                        <div style={{ marginTop: 20, border: '1px solid red', padding: 10 }}>
                            <h3>CHOOSE COLOR</h3>
                            {['RED', 'GREEN', 'BLUE', 'YELLOW'].map(c => (
                                <button key={c} 
                                    disabled={botEnabled[currentPlayer.id]}
                                    onClick={() => dispatch({ 
                                    type: ActionType.CHOOSE_COLOR, 
                                    playerId: currentPlayer.id, 
                                    color: c as CardColor 
                                })}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div style={{ marginTop: 20 }}>
                         <button onClick={() => dispatch({ type: ActionType.START_GAME })}>RESTART GAME</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
