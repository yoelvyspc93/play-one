import { GameHost } from '../../network';
import { text } from '../../content/texts';

export function ensureName(name: string) {
  if (!name) {
    throw new Error(text.lobby.errors.nameRequired);
  }
}

export function ensureNameAndRoom(name: string, hostId: string) {
  if (!name || !hostId) {
    throw new Error(text.lobby.errors.nameAndRoomRequired);
  }
}

export function createHost(name: string) {
  return new GameHost(name);
}

export function startHostRoom(host: GameHost, roomNameInput: string) {
  const customId = roomNameInput.trim() || undefined;
  return host.start(customId);
}

export async function startSoloHost(name: string) {
  const host = new GameHost(name);
  const id = await host.start(`SOLO-${Math.floor(Math.random() * 1000)}`);
  return { host, id };
}
