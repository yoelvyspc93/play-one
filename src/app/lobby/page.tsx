'use client';

import { Suspense } from 'react';
import { LobbyState } from '../../components/lobby/LobbyState';
import { text } from '../../content/texts';

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          {text.common.loading}
        </div>
      }
    >
      <LobbyState />
    </Suspense>
  );
}
