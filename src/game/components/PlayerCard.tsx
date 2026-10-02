import React from 'react';
import { Player } from '../../lib/types/game';
import { 
  ShieldAlert, 
  Sparkles, 
  Droplet, 
  Lock, 
  Flame, 
  Check, 
  Compass, 
  Shield, 
  Timer, 
  EyeOff 
} from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  onTriggerSeButton: (playerId: string) => void;
  onInvokeGrace?: (playerId: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isActive,
  onTriggerSeButton,
  onInvokeGrace,
}) => {
  const canPressSe = player.hasReachedApex && player.apexChallengePassed && !player.hasPressedSe;

  const handleSeClick = () => {
    if (!canPressSe && !player.hasPressedSe) return;
    sound.playSeReleaseFanfare();
    onTriggerSeButton(player.id);
  };

  const getRelicIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      case 'Compass':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'EyeOff':
        return <EyeOff className="w-3.5 h-3.5 text-rose-400" />;
      case 'Timer':
        return <Timer className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-300 font-mono shadow-md ${
        isActive
          ? 'bg-slate-900 border-amber-500/80 shadow-amber-950/40 ring-1 ring-amber-500/30'
          : 'bg-slate-950/80 border-slate-800 text-slate-400'
      } ${player.hasPressedSe ? 'opacity-85 border-emerald-600/60' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm shadow shrink-0"
            style={{
              borderColor: player.color,
              backgroundColor: '#090d16',
              color: player.color,
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-sm truncate">
                {player.name}
              </span>
              {isActive && (
                <span className="text-[10px] text-amber-400 font-bold tracking-wider">
                  · TURN
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {player.hasPressedSe
                ? 'RELEASE ATTAINED'
                : player.hasReachedApex
                ? 'AT APEX SUMMIT'
                : `Tile: ${player.currentNodeId.replace('node_', 'T')}`}
            </div>
            {/* AP & Grace Indicators */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                player.actionPoints > 0 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60' 
                  : 'bg-slate-950 text-slate-600 border border-slate-800'
              }`}>
                <span>⚡ {player.actionPoints ?? 0}/{player.maxActionPoints ?? 3} AP</span>
              </span>

              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                player.graceTokens > 0
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                  : 'bg-slate-950 text-slate-600 border border-slate-800'
              }`}>
                <span>✨ Grace: x{player.graceTokens ?? 0}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center">
          <button
            onClick={handleSeClick}
            disabled={!canPressSe && !player.hasPressedSe}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-serif text-2xl font-bold transition-all relative select-none ${
              player.hasPressedSe
                ? 'bg-emerald-950 border-2 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950 cursor-default'
                : canPressSe
                ? 'bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-400 border-2 border-amber-300 text-white shadow-xl shadow-rose-950/80 animate-pulse hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-amber-500/40'
                : 'bg-slate-900 border border-slate-800 text-slate-700 cursor-not-allowed opacity-60'
            }`}
            title={
              player.hasPressedSe
                ? 'Release Logged: Session Complete!'
                : canPressSe
                ? 'PERMISSION GRANTED: Press "色" to claim your release!'
                : 'Locked: Must reach Apex and pass Final Gauntlet'
            }
          >
            {player.hasPressedSe ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <span>色</span>
            )}

            {!canPressSe && !player.hasPressedSe && (
              <Lock className="w-3 h-3 text-slate-600 absolute bottom-1 right-1" />
            )}
          </button>
          <span className="text-[9px] font-mono text-slate-500 mt-0.5">
            {player.hasPressedSe ? 'CLIMAXED' : canPressSe ? 'AUTHORIZED' : 'SEALED'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-800/80 text-[11px] text-slate-400 mb-3">
        <div>
          <span className="text-[10px] text-slate-500 block">TRIALS</span>
          <span className="font-semibold text-slate-200 tabular-nums">
            {player.tasksCompleted}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">PENALTIES</span>
          <span className="font-semibold text-rose-400 tabular-nums">
            {player.penaltiesEndured}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">RUINED</span>
          <span className="font-semibold text-amber-400 tabular-nums">
            {player.ruinedCount}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {player.statusEffects.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {player.statusEffects.map(effect => (
              <span
                key={effect.type}
                className="text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 bg-slate-950 text-amber-300 border-amber-800/70"
                title={effect.description}
              >
                <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{effect.name}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-600">No active debuffs</span>
        )}

        {player.relics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {player.relics.map((relic, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 flex items-center gap-1"
                title={relic.description}
              >
                {getRelicIcon(relic.icon)}
                <span>{relic.name}</span>
              </span>
            ))}
          </div>
        )}

        {isActive && onInvokeGrace && player.graceTokens > 0 && !player.hasPressedSe && (
          <button
            onClick={() => onInvokeGrace(player.id)}
            className="w-full mt-1 py-1.5 px-2 bg-gradient-to-r from-amber-950/80 to-emerald-950/80 hover:from-amber-900 hover:to-emerald-900 border border-amber-500/60 rounded-lg text-[11px] font-bold text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-[0.98]"
            title="Beg for Mercy / Extra AP from the Grace Challenge Pool"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Invoke Grace ({player.graceTokens} Tokens)</span>
          </button>
        )}
      </div>
    </div>
  );
};
