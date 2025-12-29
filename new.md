# UNO – Reglas Divertidas (Modo Arcade / Party)

Este documento define un conjunto de reglas alternativas y extendidas para el juego UNO, enfocadas en partidas más dinámicas, caóticas y entretenidas, manteniendo la esencia del juego original.

## 🎯 Objetivo del juego

Ser el **primer jugador en quedarse sin cartas**.

- No se juega por puntos.
- Cuando un jugador gana, la partida termina inmediatamente.

---

## 👥 Jugadores

- Mínimo: 2
- Máximo: 4
- Humanos y/o bots
- Si un jugador se desconecta:
  - Con 2 o más → la partida continúa
  - Con 1 → la partida termina automáticamente

---

## 🃏 Preparación

1. Barajar el mazo completo de UNO (108 cartas).
2. Repartir **7 cartas** a cada jugador.
3. Colocar el resto como **mazo de robo**.
4. Revelar la carta inicial del descarte.

### Carta inicial
- Si es numérica → se juega normal.
- Si es de acción → **se aplica inmediatamente**.
- Si es comodín o +4 → se vuelve a barajar y se saca otra.

---

## ▶️ Turno del jugador

En su turno, el jugador puede:

1. Jugar **una carta válida**, o
2. Robar **una carta del mazo**.

### Robo automático
- Si el jugador roba una carta:
  - Si puede jugarla → **se juega automáticamente**
  - Si no → termina su turno

---

## ✅ Cartas válidas

Una carta puede jugarse si cumple al menos una condición:
- Mismo **color**
- Mismo **número**
- Mismo **símbolo**
- Es un **comodín**

---

## 🃏 Cartas especiales y reglas extendidas

### ⛔ Salto (Skip)
- El siguiente jugador pierde su turno.

---

### 🔄 Reversa
- Cambia el sentido del juego.
- Con 2 jugadores:
  - Funciona como Skip.

---

### ➕2 (Roba Dos)
- El siguiente jugador roba 2 cartas.
- **Se puede apilar**:
  - Cada +2 suma +2 al castigo.
  - Ejemplo: +2 → +2 → +2 = 6 cartas
- El jugador afectado solo puede:
  - Apilar otro +2, o
  - Robar todas las cartas acumuladas y perder turno

---

### 🌈 Comodín (Cambia color)
- Permite elegir el nuevo color.
- Puede jugarse en cualquier momento.
- No obliga a robar cartas.

---

### ➕4 Comodín (Roba Cuatro)
- Elige color.
- El siguiente jugador roba 4 cartas.

---

## 🔗 Apilado de cartas (Stacking Rules)

Estas reglas hacen el juego más agresivo:

- +2 puede apilarse con +2
- +4 puede apilarse con +4
- +2 puede apilarse sobre +4
- +4 puede apilarse sobre +2
- El castigo se acumula
- El primer jugador que no pueda apilar:
  - Roba todas las cartas acumuladas
  - Pierde su turno

---

## 🔁 Regla de Mano Vacía

- Si un jugador se queda sin cartas:
  - Gana inmediatamente
  - No se resuelven efectos pendientes
  - No se reparten puntos

---

## ⚙️ Reglas técnicas (para implementación)

- El mazo se recicla automáticamente y se baraja cuando se agota.