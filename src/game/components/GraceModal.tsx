import React, { useState, useEffect } from 'react';
import { GraceChallenge } from '../../lib/config/gracePoolConfig';
import { Player } from '../../lib/types/game';
import { 
  Sparkles, 
  HeartHandshake, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Quote, 
  AlertOctagon,
  ShieldQuestion
} from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface GraceModalProps {
  player: Player;
  challenge: GraceChallenge;
  onConfirmSubmit: (challenge: GraceChallenge) => void;
  onForfeit: () => void;
}

export const GraceModal: React.FC<GraceModalProps> = ({
  player,
  challenge,
  onConfirmSubmit,
  onForfeit,
}) => {
  const [timerCount, setTimerCount] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerCount(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const handleSubmit = () => {
    sound.playTaskSuccess();
    onConfirmSubmit(challenge);
  };

  const handleForfeitClick = () => {
    sound.playHazardWarning();
    onForfeit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-amber-950/60 relative flex flex-col gap-4 overflow-hidden">
        {/* Divine / Psychological Aura Backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  PETITION FOR GRACE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/80 font-bold">
                  Consume 1 Grace
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                <span>{player.name}</span>
                <span className="text-slate-500 font-normal">is begging for AP</span>
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase">Current AP</div>
            <div className="text-sm font-black text-amber-300 flex items-center justify-end gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{player.actionPoints} / {player.maxActionPoints}</span>
            </div>
          </div>
        </div>

        {/* Challenge Body */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldQuestion className="w-3.5 h-3.5 text-amber-400" />
              {challenge.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-black tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-300" />
              +{challenge.apReward} AP REWARD
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            {challenge.prompt}
          </p>

          {challenge.subtext && (
            <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-900/40 px-2.5 py-1.5 rounded flex items-start gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{challenge.subtext}</span>
            </div>
          )}

          {challenge.flavorQuote && (
            <div className="text-[10px] text-slate-500 italic flex items-center gap-1 border-t border-slate-900 pt-2">
              <Quote className="w-3 h-3 text-slate-600 shrink-0" />
              <span>{challenge.flavorQuote}</span>
            </div>
          )}
        </div>

        {/* Timer Helper (Optional Penance Assistant) */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Pose / Silence Stopwatch:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
              {timerCount}s
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              {isTimerRunning ? 'Pause' : 'Start Timer'}
            </button>
          </div>
        </div>

        {/* Action Buttons as explicitly requested: Green "Submit" above, Red "Forfeit" below */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Top Green Button: Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/80 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all text-sm tracking-wide border border-emerald-400/50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Submit (Action Completed · Claim +{challenge.apReward} AP)</span>
          </button>

          {/* Bottom Red Button: Forfeit */}
          <button
            onClick={handleForfeitClick}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-rose-950/80 text-rose-400 hover:text-rose-200 border border-rose-900/60 hover:border-rose-600 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all text-xs tracking-wider"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Forfeit (Decline Penance · No AP Gained)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
