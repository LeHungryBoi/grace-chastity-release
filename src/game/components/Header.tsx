import React from 'react';
import { Volume2, VolumeX, Sliders, Shield, RefreshCw } from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface HeaderProps {
  currentRound: number;
  activePlayerName: string;
  isWifeyMode: boolean;
  onToggleWifeyMode: () => void;
  onOpenDMSettings: () => void;
  onRestartGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRound,
  activePlayerName,
  isWifeyMode,
  onToggleWifeyMode,
  onOpenDMSettings,
  onRestartGame,
}) => {
  const [isAudioMuted, setIsAudioMuted] = React.useState(!sound.enabled);

  const toggleAudio = () => {
    sound.enabled = !sound.enabled;
    setIsAudioMuted(!sound.enabled);
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-wider text-slate-100 uppercase font-mono">
          APEX <span className="text-amber-500">·</span> PROTOCOL
        </span>
        <span className="hidden sm:inline-block text-xs font-mono text-slate-500 tracking-widest uppercase">
          [Roguelike Gauntlet]
        </span>
      </div>

      {/* Zone 2: Navigation / Round & Turn HUD */}
      <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">CYCLE</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">
            #{currentRound}
          </span>
        </div>
        <span className="text-slate-700">/</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">ACTIVE TURN</span>
          <span className="text-slate-200 font-semibold truncate max-w-[120px]">
            {activePlayerName}
          </span>
        </div>
      </div>

      {/* Zone 3: Primary Actions & Wifey/Hubby Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          title={isAudioMuted ? "Unmute audio" : "Mute audio"}
          aria-label="Toggle Sound"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* DM Settings Drawer (available if Wifey mode) */}
        {isWifeyMode && (
          <button
            onClick={onOpenDMSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 rounded-md transition-all whitespace-nowrap"
            title="Open Master Balancing & Hazard Panel"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DM Panel</span>
          </button>
        )}

        {/* Wifey Mode / Hubby Mode Switch (Required top right disguise & toggle) */}
        <button
          onClick={onToggleWifeyMode}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-md border transition-all whitespace-nowrap ${
            isWifeyMode
              ? 'bg-rose-950/60 border-rose-600/70 text-rose-200 hover:bg-rose-900/60 shadow-sm shadow-rose-950'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title={isWifeyMode ? "Switch to Hubby Mode (Disguise player view)" : "Switch to Wifey Mode (Full Master controls)"}
        >
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>{isWifeyMode ? 'Wifey Mode' : 'Hubby Mode'}</span>
        </button>

        {/* New Session button */}
        <button
          onClick={onRestartGame}
          className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-md transition-colors"
          title="New Trial / Reset Board"
          aria-label="Restart Game"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
