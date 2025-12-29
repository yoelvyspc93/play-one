import { text } from '../../content/texts';
import { PublicState } from '../../engine';

interface LobbyViewProps {
  state: PublicState;
  roomId: string;
  hostId: string;
  isHost: boolean;
  myId: string;
  onStartGame: () => void;
  onAddBot: () => void;
}

export function LobbyView({
  state,
  roomId,
  hostId,
  isHost,
  myId,
  onStartGame,
  onAddBot,
}: LobbyViewProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
          {text.lobby.lobbyTitle}
        </h1>
        <div className="mb-6 bg-black/50 p-4 rounded text-center">
          <div className="text-gray-400 text-sm">{text.lobby.roomId}</div>
          <div className="text-xl font-mono select-all bg-black p-2 rounded mt-1 border border-gray-700">
            {roomId || hostId}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{text.lobby.players}</h2>
          <ul className="space-y-2">
            {state.players.map((player) => (
              <li key={player.id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                <span>
                  {player.name} {player.id === myId && text.common.youLabel}
                </span>
                <span className={player.connected ? 'text-green-400' : 'text-red-400'}>●</span>
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1 py-3 rounded-lg font-bold bg-yellow-500 hover:scale-105 transition-transform"
                onClick={onStartGame}
              >
                {text.lobby.startGame}
              </button>
              <button
                className={`px-4 py-3 rounded-lg font-bold transition-transform ${
                  state.players.length >= 4
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-gray-600 hover:bg-gray-500 hover:scale-105'
                }`}
                onClick={onAddBot}
                disabled={state.players.length >= 4}
              >
                {text.lobby.addBot}
              </button>
            </div>
            <div className="text-center text-gray-500 text-sm">{text.lobby.minPlayers}</div>
          </div>
        ) : (
          <div className="text-center animate-pulse">{text.lobby.waitingHost}</div>
        )}
      </div>
    </div>
  );
}
