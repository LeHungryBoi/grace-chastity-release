import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '../../lib/types/game';
import { Crown, Sparkles, Award, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';

interface VictoryModalProps {
  finishedPlayer: Player;
  allPlayers: Player[];
  allCompleted: boolean;
  onContinueHotseat: () => void;
  onRestartNewGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  finishedPlayer,
  allPlayers,
  allCompleted,
  onContinueHotseat,
  onRestartNewGame,
}) => {
  useEffect(() => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 40,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#f59e0b', '#ef4444', '#ec4899', '#ffffff'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl font-mono text-center relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 border-2 border-amber-300 flex items-center justify-center mx-auto mb-4 text-white shadow-xl shadow-amber-950/80 text-3xl font-serif font-black">
          色
        </div>

        <h3 className="text-2xl font-black tracking-wider text-amber-400 mb-1 uppercase">
          {finishedPlayer.name} HAS ATTAINED RELEASE!
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          The Apex Vows have been fulfilled. Full climax permission authorized and executed.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left text-xs mb-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Completed Sector Trials:</span>
            <span className="font-bold text-slate-200 tabular-nums">
              {finishedPlayer.tasksCompleted}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Disciplinary Penalties Endured:</span>
            <span className="font-bold text-rose-400 tabular-nums">
              {finishedPlayer.penaltiesEndured}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Ruined Orgasm Breaches:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {finishedPlayer.ruinedCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
            <span>Status:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified & Cleansed
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-6 text-xs text-left">
          <span className="text-[11px] font-bold text-slate-400 block mb-2">
            Hotseat Session Roster:
          </span>
          <div className="space-y-1.5">
            {allPlayers.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between text-[11px] font-mono"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-slate-200">{p.name}</span>
                </div>
                <span
                  className={
                    p.hasPressedSe
                      ? 'text-emerald-400 font-bold'
                      : p.hasReachedApex
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }
                >
                  {p.hasPressedSe
                    ? 'RELEASED (色)'
                    : p.hasReachedApex
                    ? 'Awaiting Apex Ruling'
                    : 'Traversing Board'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!allCompleted ? (
            <button
              onClick={onContinueHotseat}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/60 cursor-pointer"
            >
              <span>Continue Hotseat for Others</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onRestartNewGame}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/60 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>All Released · Start New Trial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
