import { text } from '../../content/texts';

interface LobbyHomeProps {
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

export function LobbyHome({
  name,
  roomNameInput,
  hostId,
  onNameChange,
  onRoomNameChange,
  onHostIdChange,
  onCreateRoom,
  onStartSolo,
  onJoinRoom,
}: LobbyHomeProps) {
  return (
    <div className="flex flex-col gap-4">
      <input
        className="input-field bg-black/40 border border-white/20 rounded-xl p-4 text-center text-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={text.lobby.enterNickname}
      />

      <input
        className="input-field bg-black/40 border border-white/20 rounded-xl p-4 text-center text-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 mt-2"
        value={roomNameInput}
        onChange={(e) => onRoomNameChange(e.target.value)}
        placeholder={text.lobby.roomNameOptional}
      />

      <div className="h-px bg-white/20 my-2" />

      <button
        onClick={onCreateRoom}
        className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        {text.lobby.createRoom}
      </button>

      <button
        onClick={onStartSolo}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        {text.lobby.playSolo}
      </button>

      <div className="relative text-center text-sm text-gray-300">
        <span>{text.lobby.orJoin}</span>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-black/40 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={hostId}
          onChange={(e) => onHostIdChange(e.target.value)}
          placeholder={text.lobby.pasteRoomId}
        />
        <button
          onClick={onJoinRoom}
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold p-3 rounded-xl transition-transform hover:scale-105"
        >
          {text.lobby.join}
        </button>
      </div>
    </div>
  );
}
