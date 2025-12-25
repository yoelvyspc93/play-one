# SPEC_UNO.md — PlayOne (Next.js Static Export + PeerJS P2P)

## 1. Objetivo

Construir un juego de cartas estilo **UNO oficial** con:
- **App en Next.js** con `output: "export"` (sitio estático).
- **Sin backend de juego** (no hay servidor autoritativo HTTP/WebSocket).
- **Multijugador online P2P** con **PeerJS** (máximo 4 jugadores).
- **Modo solo vs máquina** (bot determinista, **sin IA**).
- Reglas oficiales + variantes confirmadas:
  - Gana quien **se queda sin cartas**.
  - Al terminar, inicia **nueva ronda** en el mismo lobby/sala.
  - **Robar 1 y jugar automáticamente si es posible.**
  - **Carta inicial aplica efecto.**
  - **Apilado de +2 y +4** (incluye cross-stack).
  - **Sin desafío de +4**.
  - Si alguien se va a mitad de ronda: **seguir con los restantes**; si quedan 2 y se va 1 (queda 1 conectado), **terminar ronda**.

---

## 2. Restricciones técnicas y premisas

### 2.1 Next.js Static Export
- La app debe funcionar como SPA estática (GitHub Pages u hosting estático).
- Cualquier uso de PeerJS/WebRTC debe ejecutarse **solo en cliente** (nunca en SSR).
- Evitar dependencias que requieran servidor (ej. API Routes para juego).

### 2.2 “Sin backend” y señalización (signaling)
- PeerJS requiere **servidor de signaling** (PeerServer).
- Esto no es “backend de juego”, pero sí infraestructura necesaria.
- El juego debe permitir configurar:
  - PeerServer público/gestionado, o
  - PeerServer propio (peerjs-server).
- La implementación debe tolerar que algunos peers no conecten en NAT estrictos (sin TURN), con UX de error claro.

---

## 3. Definición del producto

### 3.1 Modos
1) **Online P2P** (2–4 jugadores)
- Un jugador crea sala (host).
- Otros se unen con código/link.
- Host es autoritativo (ver sección 5).

2) **Solo vs máquina**
- 1 humano + 1 bot.
- Misma lógica de reglas que online.

### 3.2 Flujo global
- Home → Lobby → Game → Round End → Auto Next Round (si hay ≥2 conectados).

---

## 4. Reglas del juego (cerradas)

### 4.1 Baraja y cartas (UNO estándar)
Se asume baraja UNO clásica:
- Colores: rojo, azul, verde, amarillo.
- Cartas numéricas 0–9.
- Cartas de acción: Skip (Salto), Reverse (Reversa), Draw Two (+2).
- Comodines: Wild (Comodín), Wild Draw Four (+4).

> Nota: Para MVP basta representar “tipo + valor + color” sin necesidad de replicar conteos exactos por carta, siempre que el gameplay sea consistente. Si se quiere fidelidad, usar conteo oficial UNO.

### 4.2 Inicio de ronda
1) Se crea mazo (deck) y se baraja.
2) Se reparten **7 cartas** a cada jugador.
3) Se coloca una carta inicial al descarte (discard) como `topCard`.
4) **La carta inicial aplica efecto inmediatamente** (ver 4.3).
5) Comienza el turno del primer jugador a partir del dealer según orden.

### 4.3 Efecto de carta inicial (obligatorio)
- Si es **Número**: se define `currentColor = topCard.color`. Inicia normal.
- Si es **Skip**: el primer jugador (después del dealer) **pierde el turno**.
- Si es **Reverse**:
  - Con **3–4 jugadores**: cambia dirección.
  - Con **2 jugadores**: se comporta como **Skip**.
- Si es **+2**:
  - Se define `currentColor = topCard.color`. Inicia normal.
- Si es **Wild**:
  - Se requiere elección de color inicial (el primer jugador).
- Si es **+4**:
  - Se define `currentColor = topCard.color`. Inicia normal.
  - El primer jugador elige el color.

### 4.4 Turnos: jugar / robar (regla cerrada)
En tu turno:
- Si puedes jugar alguna carta válida, debes **jugar** (no se permite robar “por gusto”).
- Si **no** puedes jugar:
  1) Robas **1** carta.
  2) Si la robada es jugable, **se juega automáticamente** en ese mismo turno.
  3) Si no es jugable, termina el turno.

### 4.5 Validez de una jugada (sin penalización acumulada)
Una carta es jugable si:
- Coincide con `currentColor`, o
- Coincide con el valor/acción de `topCard`, o
- Es `Wild` o `+4` (siempre jugable; sin challenge).

### 4.6 Wild y elección de color
- Al jugar `Wild` o `+4`, se debe elegir `currentColor`.
- El juego entra en estado `CHOOSE_COLOR_REQUIRED` y no avanza hasta recibir color.

### 4.7 Acciones
- **Skip**: salta al siguiente jugador conectado.
- **Reverse**: invierte dirección (2 jugadores equivale a skip).
- **+2**: inicia/incrementa acumulación `pendingDraw += 2`.
- **+4**: inicia/incrementa acumulación `pendingDraw += 4`, requiere elección de color.

### 4.8 Apilado (+2 y +4) (cerrado)
Si `pendingDraw > 0`:
- El jugador en turno **solo puede**:
  - Apilar con `+2` o `+4` (cross-stack permitido), o
  - Robar `pendingDraw` y **perder turno**.
- Cross-stack permitido:
  - `+2` sobre `+2` (ok)
  - `+4` sobre `+4` (ok)
  - `+4` sobre `+2` (ok)
  - `+2` sobre `+4` (ok)

Resolución:
- Si no puede apilar:
  - Roba `pendingDraw`.
  - `pendingDraw = 0`.
  - Pierde turno.
- Si apila:
  - `pendingDraw` se incrementa y el turno pasa al siguiente.

### 4.9 Final de ronda
- Gana el jugador que se queda con **0 cartas**.
- Mostrar ganador y razón.
- Iniciar nueva ronda automáticamente si hay **≥2 conectados**.

### 4.10 Salida/desconexión en medio de ronda (cerrado)
- Si un jugador se desconecta:
  - Se marca `connected=false`.
  - Sus cartas se **remueven del juego** (no regresan al mazo) para evitar rebarajados/desync en MVP.
- Si era su turno, el host avanza al siguiente conectado.
- Si la partida queda con **1 jugador conectado**:
  - Terminar la ronda inmediatamente con razón `OPPONENT_LEFT` y declarar ganador al restante.

---

## 5. Arquitectura de red (PeerJS P2P)

### 5.1 Modelo autoritativo con Host
- Un peer es **Host** y mantiene `GameState` canónico.
- Clientes envían solo **intenciones** (INTENT).
- Host valida reglas y emite estado actualizado.
- Ventaja: evita desincronización y dobles acciones.

### 5.2 Privacidad de manos
- El host conoce todas las manos.
- Cada cliente solo recibe:
  - Estado público (conteos, topCard, turnos, etc.)
  - Su mano privada.

---

## 6. Máquina de estados (Game Phases)

Estados principales:
- `LOBBY`
- `ROUND_START`
- `TURN`
- `CHOOSE_COLOR_REQUIRED` (subfase/bloqueo)
- `RESOLVE` (opcional: si se quiere separar efectos)
- `ROUND_END`

Transiciones:
- LOBBY → ROUND_START (Host inicia si ≥2 conectados)
- ROUND_START → TURN (tras repartir y aplicar carta inicial)
- TURN → CHOOSE_COLOR_REQUIRED (si se juega Wild/+4)
- CHOOSE_COLOR_REQUIRED → TURN (al elegir color y terminar resolución)
- TURN → ROUND_END (si alguien queda sin cartas o queda 1 conectado)
- ROUND_END → ROUND_START (auto, si ≥2 conectados; si no, vuelve a LOBBY o espera)

---

## 7. Modelos de datos (host)

### 7.1 Card
- `id: string` (único por carta)
- `kind: "NUMBER" | "SKIP" | "REVERSE" | "DRAW_TWO" | "WILD" | "WILD_DRAW_FOUR"`
- `color: "RED" | "GREEN" | "BLUE" | "YELLOW" | "WILD" | null`
- `number?: 0..9` (solo NUMBER)

### 7.2 Player (host)
- `id: string` (playerId persistente)
- `name: string`
- `connected: boolean`
- `hand: Card[]` (solo host y dueño vía PRIVATE_HAND)
- `cardCount: number` (derivado)

### 7.3 PublicState (para todos)
- `roomId: string`
- `hostId: string`
- `players: { id, name, connected, cardCount }[]`
- `order: string[]` (ids)
- `dealerIndex: number`
- `currentPlayerIndex: number`
- `direction: 1 | -1`
- `topCard: Card`
- `currentColor: "RED"|"GREEN"|"BLUE"|"YELLOW"`
- `pendingDraw: number`
- `phase: string`
- `winnerId?: string`
- `roundEndReason?: "PLAYER_EMPTY_HAND" | "OPPONENT_LEFT"`
- `stateVersion: number`

### 7.4 InternalState (host)
- `deck: Card[]`
- `discard: Card[]`
- `skipNext: boolean` (si se modela así)
- `awaitingColorChoiceFrom?: playerId` (si aplica)
- `removedCards: Card[]` (opcional, por desconexión)
- `rngSeed?: string` (opcional, si se hace deterministic shuffle)

---

## 8. Protocolo de mensajes

### 8.1 Envelope (común)
- `type: string`
- `roomId: string`
- `senderId: string`
- `clientSeq?: number` (solo client→host)
- `serverSeq?: number` (solo host→client)
- `payload: object`

### 8.2 Client → Host (INTENT)
Lobby:
- `INTENT_JOIN { name }`
- `INTENT_LEAVE {}`
- `INTENT_START_ROUND {}` (solo host)

Juego:
- `INTENT_PLAY_CARD { cardId }`
- `INTENT_DRAW {}`
- `INTENT_CHOOSE_COLOR { color }`

Red:
- `PING { t }`
- `INTENT_RESYNC_REQUEST { lastStateVersion }`

### 8.3 Host → Client
Sync:
- `STATE_SNAPSHOT { stateVersion, publicState }`
- `PRIVATE_HAND { stateVersion, playerId, hand }`

ACK/NACK:
- `INTENT_ACCEPTED { clientSeq, stateVersion }`
- `INTENT_REJECTED { clientSeq, reasonCode, message }`

Eventos:
- `PLAYER_JOINED { player }`
- `PLAYER_LEFT { playerId }`
- `PONG { t }`

### 8.4 Reason Codes (rechazos)
- `NOT_YOUR_TURN`
- `INVALID_PHASE`
- `CARD_NOT_IN_HAND`
- `CARD_NOT_PLAYABLE`
- `COLOR_REQUIRED`
- `MUST_STACK_OR_DRAW_PENDING`
- `CANNOT_DRAW`
- `ROOM_FULL`
- `ROUND_ALREADY_STARTED`

### 8.5 Reglas de sincronización (obligatorio)
- Host incrementa `stateVersion` en cada mutación válida.
- Cliente aplica solo versiones crecientes.
- Si cliente detecta hueco/desorden: envía `INTENT_RESYNC_REQUEST`.

---

## 9. Algoritmo del turno (detallado)

### 9.1 Entrada a turno
1) Si jugador actual está desconectado: avanzar al siguiente conectado.
2) Si `pendingDraw > 0`:
   - Permitir solo `PLAY(+2/+4)` o `DRAW(pendingDraw)`.

### 9.2 Procesar `INTENT_PLAY_CARD`
Validaciones:
- Debe ser tu turno.
- Debe existir la carta en tu mano.
- Si `pendingDraw > 0` → carta debe ser `DRAW_TWO` o `WILD_DRAW_FOUR` (cross-stack).
- Si `pendingDraw == 0` → debe ser jugable por reglas.

Aplicación:
- Quitar carta de mano.
- Poner en discard como `topCard`.
- Actualizar `currentColor`:
  - Si no es wild: `currentColor = card.color`
  - Si es wild: bloquear y exigir `CHOOSE_COLOR`.
- Efectos:
  - Skip: marcar salto.
  - Reverse: cambiar dirección (2 jugadores equivale a skip).
  - +2/+4: incrementar `pendingDraw`.
- Chequear victoria: si `hand.length==0` → `ROUND_END`.

### 9.3 Procesar `INTENT_DRAW`
Casos:
- Si `pendingDraw > 0`:
  - Robar `pendingDraw` cartas.
  - `pendingDraw = 0`
  - Perder turno (no auto-play aquí).
- Si `pendingDraw == 0`:
  - Robar 1 carta.
  - Si es jugable: auto-play inmediato (misma lógica de PLAY).
  - Si no: perder turno.

### 9.4 Elección de color
- Solo si el estado está esperando color.
- Actualizar `currentColor`.
- Continuar con el avance de turno.

### 9.5 Avanzar turno
- Calcular siguiente índice según `direction`.
- Aplicar `skip` si está activo.
- Saltar desconectados.
- Si queda 1 conectado → `ROUND_END` (OPPONENT_LEFT).

---

## 10. Bot (modo solo, sin IA)

### 10.1 Reglas del bot
En su turno:
- Si `pendingDraw > 0`:
  - Si tiene +2/+4, apila priorizando:
    1) Apilar (minimiza robar)
    2) Preferir +2 antes que +4 (conservar +4)
    3) Si juega +4, elegir color con mayor cantidad en su mano
  - Si no puede apilar: roba `pendingDraw` y termina turno.
- Si `pendingDraw == 0`:
  - Si tiene cartas jugables, elegir por prioridad:
    1) Jugar carta que reduzca su mano en el color más abundante
    2) Preferir acciones (Skip/Reverse) si el oponente tiene pocas cartas
    3) Conservar Wild/+4 si hay otra jugable
  - Si no tiene jugables: robar 1 y auto-play si aplica.

### 10.2 Elección de color del bot (wild)
- Elegir el color con mayor presencia en su mano.
- En empate: usar un orden fijo (ej. RED > BLUE > GREEN > YELLOW) para determinismo.

---

## 11. Pantallas y UX (mobile-first)

### 11.1 Home (`/`)
- Crear sala online
- Unirse a sala (room code)
- Jugar solo vs máquina
- Ajustes: nombre

Estados:
- idle / validating / error

### 11.2 Lobby (`/lobby?room=XXXX`)
- Lista de jugadores (2–4)
- Mostrar host
- Copiar código/link
- Botón “Iniciar” solo host

Estados:
- connecting / in_room / full / error / starting

### 11.3 Game (`/game?room=XXXX`)
Componentes:
- Top bar: room, estado conexión, salir
- Mesa: topCard, currentColor, pendingDraw chip
- Jugadores: avatares + cardCount + indicador turno + desconectado
- Mano del jugador: scroll horizontal, cartas deshabilitadas si no jugables
- Botón Robar (habilitado solo cuando corresponde)
- Modal elegir color (bloqueante)

UX obligatoria:
- Si `pendingDraw>0`: banner “Debes apilar +2/+4 o robar +X”
- Si robas y auto-play ocurre: mensaje breve “Se jugó automáticamente”
- Si alguien sale: toast “X salió. La partida continúa.”
- Si queda 1: pantalla fin de ronda por abandono

---

## 12. Manejo de errores y robustez

- Si PeerJS falla al conectar: mostrar error y opción reintentar.
- Si cliente se desincroniza: solicitar snapshot (`RESYNC_REQUEST`).
- Si host se cae:
  - MVP: sala termina y todos vuelven a Lobby/Home con mensaje.
  - (Opcional futuro) migración de host.

---

## 13. Plan de pruebas (checklist)

### Motor
- Inicio de ronda y reparto correcto.
- Carta inicial aplica efecto: número/skip/reverse/+2/wild/+4.
- Validez de jugadas.
- Robar 1 y auto-play.
- Apilado +2/+4 con cross-stack.
- Resolución de pendingDraw.
- Reverse con 2 jugadores equivale a skip.
- Fin de ronda por mano vacía.
- Reposición de mazo si se agota (reciclar discard excepto topCard).
- Desconexión: remover cartas, saltar turnos, fin si queda 1.

### Red
- Join/leave.
- Room full.
- Mensajes fuera de orden → resync.
- Reconexión simple (si se implementa).
- Desconexión en turno con pendingDraw.

### Bot
- Solo juega cartas válidas.
- Apila correctamente.
- Elige color determinista.
- Respeta auto-play al robar.

---

## 14. Criterios de aceptación (Definition of Done)

1) Online 2–4 jugadores:
- Se crea sala, se unen jugadores, se juega una ronda completa, inicia siguiente ronda.
2) Reglas cerradas implementadas exactamente:
- Auto-play al robar, carta inicial con efecto, stacking +2/+4 cross-stack, sin challenge +4.
3) Desconexión:
- Si un jugador sale, el juego sigue; si queda 1, termina la ronda.
4) Modo solo:
- Humano vs bot, misma lógica de reglas.
5) Estático:
- Deploy como sitio estático (GitHub Pages u otro) funcional.
6) Sincronización:
- No hay desync observable bajo latencia normal; `stateVersion` protege consistencia.

---

## 15. Roadmap de implementación (paso a paso)

Fase 1 — Motor local
- Implementar modelos y reducer/engine determinista.
- Hotseat local (sin red) para validar reglas.
- Tests del motor.

Fase 2 — Bot
- Implementar bot determinista con heurísticas.
- Modo solo completo.

Fase 3 — Online PeerJS
- Lobby + conexiones.
- Host autoritativo + INTENTs + snapshots + manos privadas.
- Manejo básico de errores.

Fase 4 — Pulido
- UX/animaciones básicas.
- Reconexión simple.
- Optimización mobile.

---

## 16. Notas finales de diseño

- Priorizar snapshots sobre diffs para MVP.
- Mantener motor desacoplado de UI y red:
  - El motor solo recibe eventos “intención validada” o acciones internas (auto-play).
- Cada evento del host debe ser reproducible y testeable.
