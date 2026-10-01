import React, { useState } from 'react';
import { ApexGame } from './game/ApexGame';
import { MapGeneratorDemo } from './demo/MapGeneratorDemo';
import { Gamepad2, Compass } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'GAME' | 'MAP_DEMO'>('GAME');

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Top Floating View Switcher (Discreet & Quick) */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center bg-slate-900/90 border border-slate-700/80 rounded-full p-1 shadow-2xl backdrop-blur-md text-xs font-mono select-none">
        <button
          onClick={() => setActiveView('GAME')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            activeView === 'GAME'
              ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Play Full APEX Protocol Game"
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Game Mode</span>
        </button>

        <button
          onClick={() => setActiveView('MAP_DEMO')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            activeView === 'MAP_DEMO'
              ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Open Isolated Map Generation Lab"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Map Lab (Demo)</span>
        </button>
      </div>

      {/* Main View Render */}
      {activeView === 'GAME' ? <ApexGame /> : <MapGeneratorDemo />}
    </div>
  );
}
