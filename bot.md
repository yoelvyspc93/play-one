# Reglas Avanzadas del Bot de UNO (IA sin aprendizaje automático)

Este documento define **todas las reglas, heurísticas y criterios de decisión** que debe seguir un bot para jugar UNO de forma inteligente, coherente y diferenciada entre bots.  
El objetivo es simular **razonamiento humano avanzado**, no azar ni IA predictiva compleja.

---

## 1. Principio General del Bot

El bot **no juega la primera carta válida**.  
Cada turno evalúa el estado de la partida y elige la jugada que:

1. Minimiza sus propias cartas.
2. Maximiza la dificultad del oponente más peligroso.
3. Mantiene control del color y del ritmo del juego.
4. Reduce el riesgo de quedar bloqueado en turnos futuros.

---

## 2. Estado Interno que el Bot Debe Mantener

Antes de jugar, el bot debe conocer y actualizar:

### 2.1 Estado propio
- Número total de cartas en su mano.
- Conteo de cartas por color.
- Conteo de cartas especiales (Skip, Reverse, +2, +4, Wild).
- Diversidad de colores en su mano.
- Capacidad de cierre (si puede ganar en 1–2 turnos).

### 2.2 Estado de cada oponente
Para **cada jugador rival**:
- Número de cartas visibles.
- Probabilidad estimada de cada color.
- Probabilidad estimada de que tenga comodines.
- Tendencia histórica (defensivo, agresivo, apilador, conservador).

### 2.3 Estado de la mesa
- Carta superior.
- Color activo.
- Dirección del juego.
- Jugador siguiente y orden relativo.
- Historial reciente de jugadas.
- Presión del mazo (frecuencia de robos recientes).

---

## 3. Identificación del Oponente Crítico

Antes de cada turno, el bot debe identificar:

- **Oponente crítico**: el jugador con menos cartas.
- Si hay empate, el que juega antes en el orden.
- Todas las decisiones ofensivas se priorizan contra este jugador.

---

## 4. Reglas de Urgencia

### 4.1 Si un oponente tiene 1–2 cartas
El bot debe priorizar:
1. Forzar robo (+2 / +4).
2. Cambiar el color a uno poco probable para ese oponente.
3. Negarle turno (Skip / Reverse).
4. Evitar dejarle el color favorable aunque perjudique su propia mano.

### 4.2 Si el bot tiene 1–2 cartas
El bot debe:
1. Maximizar la probabilidad de jugar su última carta pronto.
2. Evitar quedarse con un color aislado.
3. Guardar comodines solo si garantizan cierre inmediato.

---

## 5. Inferencia de Colores del Rival

El bot **deduce**, no ve.

### 5.1 Evidencia negativa
- Si un jugador roba cuando el color activo se repite → baja probabilidad de ese color.
- Si pasa turno teniendo alternativas previas → baja probabilidad.

### 5.2 Evidencia positiva
- Jugar repetidamente un color → alta probabilidad.
- Elegir un color tras comodín → probabilidad muy alta.

### 5.3 Inferencia de comodines
- Cambios de color “perfectos” en momentos críticos.
- Ataques defensivos precisos con pocas cartas.

---

## 6. Gestión del Color (Regla Central del Bot)

Antes de jugar cualquier carta, el bot evalúa:

- ¿Cuántas cartas tengo de este color después de jugar?
- ¿Cuántas cartas podría tener el oponente crítico de este color?
- ¿Este color me permite controlar próximos turnos?

El bot debe:
- Favorecer colores dominantes en su mano.
- Evitar eliminar un color si aún tiene otros colores sueltos.
- Forzar colores incómodos al líder aunque no le beneficien a corto plazo.

---

## 7. Uso Estratégico de Cartas Especiales

### 7.1 +2
Usar cuando:
- El siguiente jugador es el oponente crítico.
- Puede romper una posible victoria.
- Permite apilar o forzar robo múltiple.

Guardar cuando:
- No hay amenaza inmediata.
- Puede servir como defensa futura.

### 7.2 +4
Usar solo si:
- Cambiar color es estratégicamente crítico.
- El líder está por ganar.
- Permite cerrar partida o romper cierre ajeno.

Nunca usar:
- Por ansiedad.
- Si deja un color favorable al siguiente jugador.

### 7.3 Skip
Alta prioridad si:
- El siguiente jugador es el líder.
- Se niega un turno decisivo.

### 7.4 Reverse
Usar cuando:
- Cambia el orden para alejar al líder.
- En 2 jugadores equivale a Skip.
- Permite reposicionar ataques.

---

## 8. Elección de Color tras Comodín

El bot debe elegir el color que maximice:

- Cantidad propia de ese color.
- Incomodidad del oponente crítico.
- Control del flujo de turnos.

Nunca elegir:
- Un color que el siguiente jugador ha demostrado dominar.
- Un color que deje al bot sin continuidad.

---

## 9. Política de Apilado (+2 / +4)

El bot debe apilar si:
- Evita recibir el castigo.
- Castiga al líder.
- Permite cambiar color final a uno favorable.

Debe evitar apilar si:
- El resultado deja el color cómodo al líder.
- Se desperdicia una carta clave sin beneficio posicional.

---

## 10. Gestión del Riesgo

Antes de jugar, el bot evalúa:
- ¿Mi mano queda bloqueada?
- ¿Pierdo control de color?
- ¿Habilito una jugada fácil al siguiente jugador?

Si el riesgo supera el beneficio, la jugada se descarta.

---

## 11. Política Anti-Victoria Injusta (Anti-Kingmaking)

En partidas de 3–4 jugadores:
- Si un jugador está a punto de ganar, todos los bots priorizan frenarlo.
- El daño al líder tiene prioridad sobre la optimización individual temporal.

---

## 12. Perfiles de Bot (Comportamiento Individual)

Cada bot tiene pesos distintos:

### Agresivo
- Usa ataques temprano.
- Cambia colores ofensivamente.
- Busca cerrar rápido.

### Controlador
- Manipula turnos.
- Guarda comodines.
- Mantiene color dominante.

### Conservador
- Minimiza riesgo.
- Usa números primero.
- Ataca solo cuando es necesario.

### Caótico
- Introduce decisiones no obvias.
- Rompe patrones humanos.
- Nunca suicida, pero sorprende.

---

## 13. Desempates y Aleatoriedad Controlada

Si varias jugadas son similares:
- Se elige según perfil del bot.
- Se introduce una pequeña variación controlada.
- Nunca se elige una jugada claramente perjudicial.

---

## 14. Regla Final

El bot **no juega para sobrevivir el turno**,  
juega para **ganar la partida o impedir que otro la gane**.

Toda decisión debe tener intención.