import React, { useState } from 'react';
import { Dices, Sparkles, AlertCircle, Zap, ArrowRightCircle } from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';
import { MODIFIER_MAP } from '../../lib/config/actionsConfig';
import { Relic } from '../../lib/types/game';

interface DiceRollUIProps {
  volatilityRange: 1 | 3 | 5;
  onRollComplete: (rollValue: number) => void;
  disabled?: boolean;
  relics: Relic[];
  onUseGoldenCompass?: (chosenRoll: number) => void;
  actionPoints?: number;
  maxActionPoints?: number;
  graceTokens?: number;
  onInvokeGrace?: () => void;
  onEndTurn?: () => void;
  onRest?: () => void;
  hasRestedThisRound?: boolean;
}

export const DiceRollUI: React.FC<DiceRollUIProps> = ({
  volatilityRange,
  onRollComplete,
  disabled = false,
  relics,
  onUseGoldenCompass,
  actionPoints = 3,
  maxActionPoints = 3,
  graceTokens = 0,
  onInvokeGrace,
  onEndTurn,
  onRest,
  hasRestedThisRound = false,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [showGoldenCompassModal, setShowGoldenCompassModal] = useState(false);

  const hasGoldenCompass = relics.some(r => r.id === 'GOLDEN_COMPASS');
  const isOutOfAP = actionPoints <= 0;
  const isRollDisabled = disabled || isRolling || isOutOfAP;

  const executeRoll = () => {
    if (isRollDisabled) return;
    setIsRolling(true);
    sound.playRollRattle();

    let steps = 0;
    const interval = setInterval(() => {
      const tempVal = Math.floor(Math.random() * (volatilityRange * 2 + 1)) - volatilityRange;
      setDisplayValue(tempVal);
      steps++;

      if (steps > 9) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * (volatilityRange * 2 + 1)) - volatilityRange;
        setDisplayValue(finalVal);
        setIsRolling(false);
        sound.playRollSettle(finalVal);
        onRollComplete(finalVal);
      }
    }, 70);
  };

  const handleSelectExactRoll = (val: number) => {
    setShowGoldenCompassModal(false);
    setDisplayValue(val);
    sound.playRollSettle(val);
    if (onUseGoldenCompass) {
      onUseGoldenCompass(val);
    } else {
      onRollComplete(val);
    }
  };

  const modifierInfo = displayValue !== null ? MODIFIER_MAP[displayValue] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-lg">
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Dices className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-slate-200">TRAVERSAL & MODIFIER ROLL</span>
        </div>

        {/* AP & Grace Status Header */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
            actionPoints > 0 
              ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
              : 'bg-rose-950 text-rose-300 border border-rose-700/80 animate-pulse'
          }`}>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{actionPoints} / {maxActionPoints} AP</span>
          </span>

          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Grace: x{graceTokens}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <div
          className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-xl relative overflow-hidden ${
            displayValue === null
              ? 'bg-slate-950 border-slate-800 text-slate-600'
              : displayValue > 0
              ? 'bg-gradient-to-b from-rose-950/80 to-slate-950 border-rose-600/80 text-rose-200 shadow-rose-950/50'
              : displayValue < 0
              ? 'bg-gradient-to-b from-emerald-950/80 to-slate-950 border-emerald-600/80 text-emerald-200 shadow-emerald-950/50'
              : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-600 text-slate-200 shadow-slate-950/50'
          }`}
        >
          <span className="text-4xl font-extrabold font-mono tabular-nums tracking-tight">
            {displayValue === null
              ? '?'
              : displayValue > 0
              ? `+${displayValue}`
              : `${displayValue}`}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">
            {displayValue === null
              ? 'READY'
              : displayValue === 0
              ? '0 TILES (HOLD)'
              : `${Math.abs(displayValue)} ${Math.abs(displayValue) === 1 ? 'TILE' : 'TILES'}`}
          </span>

          {isRolling && (
            <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
          )}
        </div>
      </div>

      {modifierInfo ? (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <span>{modifierInfo.tierName}</span>
            <span
              className={`text-[11px] ${
                displayValue! > 0
                  ? 'text-rose-400'
                  : displayValue! < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {modifierInfo.intensityLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {modifierInfo.flavor}
          </p>
        </div>
      ) : (
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 text-xs font-mono text-slate-500 text-center flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>Roll Cost: 1 AP · Traversal Distance = |Roll|</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Main Trigger Roll Button */}
        <button
          onClick={executeRoll}
          disabled={isRollDisabled}
          className={`w-full py-3 px-4 rounded-lg font-mono font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
            isRollDisabled
              ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-rose-900/80 hover:bg-rose-800 border border-rose-600/70 text-rose-100 hover:text-white cursor-pointer active:scale-[0.98]'
          }`}
        >
          <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
          <span>
            {isRolling
              ? 'CALCULATING FATE...'
              : isOutOfAP
              ? 'OUT OF AP (INVOKE GRACE OR PASS)'
              : 'TRIGGER ROLL (COST: 1 AP)'}
          </span>
        </button>

        {/* Secondary Action Row: Rest (+2 AP), Grace & End Round */}
        <div className="grid grid-cols-3 gap-1.5">
          {onRest && (
            <button
              onClick={onRest}
              disabled={disabled || isRolling || hasRestedThisRound}
              className={`py-2 px-1.5 rounded-lg font-mono text-xs font-bold border flex items-center justify-center gap-1 transition-all shadow ${
                hasRestedThisRound
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                  : isOutOfAP
                  ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-400 text-white animate-pulse cursor-pointer'
                  : 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200 hover:bg-emerald-900/80 cursor-pointer'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={
                hasRestedThisRound
                  ? 'Already rested this round (Limit: 1 rest per round)'
                  : 'Rest: Take no move/action this round to regain +2 AP (Ends round immediately)'
              }
            >
              <span>{hasRestedThisRound ? '☕ Rested' : '☕ Rest (+2)'}</span>
            </button>
          )}

          {onInvokeGrace && graceTokens > 0 ? (
            <button
              onClick={onInvokeGrace}
              disabled={disabled}
              className={`py-2 px-1.5 rounded-lg font-mono text-xs font-bold border flex items-center justify-center gap-1 transition-all shadow ${
                isOutOfAP
                  ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white border-amber-300 animate-pulse shadow-amber-950 cursor-pointer'
                  : 'bg-amber-950/40 border-amber-600/70 text-amber-200 hover:bg-amber-900/60 cursor-pointer'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Draw a challenge from the Grace Pool to claim extra AP"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Grace ({graceTokens})</span>
            </button>
          ) : (
            <button
              disabled
              className="py-2 px-1.5 rounded-lg font-mono text-xs bg-slate-950/60 border border-slate-800 text-slate-600 flex items-center justify-center gap-1 cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3 text-slate-700" />
              <span>0 Grace</span>
            </button>
          )}

          {onEndTurn && (
            <button
              onClick={onEndTurn}
              disabled={disabled || isRolling}
              className="py-2 px-1.5 rounded-lg font-mono text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="End your round and pass to the next player"
            >
              <ArrowRightCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>End Round</span>
            </button>
          )}
        </div>

        {hasGoldenCompass && !disabled && (
          <button
            onClick={() => setShowGoldenCompassModal(true)}
            className="w-full py-1.5 px-3 rounded-lg font-mono text-xs text-amber-300 bg-amber-950/40 border border-amber-700/60 hover:bg-amber-900/50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Use Gilded Sextant (Choose Exact Value)</span>
          </button>
        )}
      </div>

      {showGoldenCompassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-600/80 p-5 rounded-xl max-w-sm w-full font-mono text-slate-200">
            <h4 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gilded Sextant: Choose Fate
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Select the exact movement & modifier value for this turn:
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: volatilityRange * 2 + 1 }, (_, i) => i - volatilityRange).map(
                val => (
                  <button
                    key={val}
                    onClick={() => handleSelectExactRoll(val)}
                    className={`py-2 rounded font-bold text-sm border transition-all ${
                      val > 0
                        ? 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900'
                        : val < 0
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setShowGoldenCompassModal(false)}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded border border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

