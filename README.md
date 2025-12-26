# PlayOne - PeerJS UNO Game

A real-time multiplayer card game built with Next.js and PeerJS.
100% Client-side P2P. No backend server required.

## Features
- **P2P Multiplayer**: Hosting and Joining via PeerJS.
- **Bot Mode**: Play vs AI.
- **Responsive**: Mobile-first design.
- **Animations**: Smooth transitions with Framer Motion.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
yarn build
yarn start
```

## Static Export
This project is configured for static export (if needed).
```bash
yarn build
```
The output will be in `out/`.

## Architecture
- **Engine**: `src/engine` (Reducers, State)
- **Network**: `src/network` (PeerManager, Host, Client)
- **UI**: `src/components`, `src/app`
