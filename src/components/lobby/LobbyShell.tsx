import { text } from '../../content/texts';
import { LobbyHome } from './LobbyHome';

interface LobbyShellProps {
  mode: 'HOME' | 'HOST' | 'CLIENT' | 'GAME';
  error: string;
  name: string;
  roomNameInput: string;
  hostId: string;
  onNameChange: (value: string) => void;
  onRoomNameChange: (value: string) => void;
  onHostIdChange: (value: string) => void;
  onCreateRoom: () => void;
  onStartSolo: () => void;
  onJoinRoom: () => void;
}

export function LobbyShell({
  mode,
  error,
  name,
  roomNameInput,
  hostId,
  onNameChange,
  onRoomNameChange,
  onHostIdChange,
  onCreateRoom,
  onStartSolo,
  onJoinRoom,
}: LobbyShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex flex-col items-center justify-center font-sans">
      <h1 className="text-6xl font-black mb-8 italic tracking-tighter drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">
        {text.app.name.slice(0, 4)}
        <span className="text-white">{text.app.name.slice(4)}</span>
      </h1>

      {error && <div className="bg-red-500/80 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20">
        {mode === 'HOME' && (
          <LobbyHome
            name={name}
            roomNameInput={roomNameInput}
            hostId={hostId}
            onNameChange={onNameChange}
            onRoomNameChange={onRoomNameChange}
            onHostIdChange={onHostIdChange}
            onCreateRoom={onCreateRoom}
            onStartSolo={onStartSolo}
            onJoinRoom={onJoinRoom}
          />
        )}

        {mode === 'HOST' && <p className="text-center animate-pulse">{text.lobby.initializingHost}</p>}
        {mode === 'CLIENT' && <p className="text-center animate-pulse">{text.lobby.connectingHost}</p>}
      </div>
    </div>
  );
}
