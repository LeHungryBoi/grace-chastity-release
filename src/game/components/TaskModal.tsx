import React, { useState, useEffect } from 'react';
import { 
  ActiveTask, 
  Player, 
  DMSettings 
} from '../../lib/types/game';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  MessageSquare, 
  Flame,
  Volume2,
  Sparkles,
  Crown
} from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface TaskModalProps {
  task: ActiveTask;
  player: Player;
  settings: DMSettings;
  onCompleteTask: (success: boolean, wasRuined?: boolean) => void;
  onUseIronWill?: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  player,
  settings,
  onCompleteTask,
  onUseIronWill,
}) => {
  const hasMetronome = player.relics.some(r => r.id === 'METRONOME');
  const baseSeconds = task.baseAction.baseDurationSec || 0;
  const modifierSeconds = task.modifier.durationDeltaSec || 0;
  
  let targetSeconds = Math.max(5, baseSeconds + modifierSeconds);
  if (hasMetronome && targetSeconds > 10) {
    targetSeconds = Math.round(targetSeconds * 0.75);
  }

  const baseReps = task.baseAction.baseReps || 0;
  let targetReps = baseReps;
  if (task.modifier.repsMultiplier) {
    targetReps = Math.round(baseReps * task.modifier.repsMultiplier);
  } else if (task.modifier.repsAdd) {
    targetReps = baseReps + task.modifier.repsAdd;
  }
  if (targetReps < 1 && baseReps > 0) targetReps = 1;

  const [timeLeft, setTimeLeft] = useState<number>(targetSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [hasFinishedTimer, setHasFinishedTimer] = useState<boolean>(false);
  const [metronomeAudio, setMetronomeAudio] = useState<boolean>(settings.autoMetronomeSound);

  const hasIronWill = player.relics.some(r => r.id === 'IRON_WILL');

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinishedTimer(true);
            sound.playTaskSuccess();
            return 0;
          }
          if (metronomeAudio) {
            sound.playMetronomeTick(prev <= 4);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, metronomeAudio]);

  const toggleTimer = () => {
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(targetSeconds);
      setHasFinishedTimer(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(targetSeconds);
    setHasFinishedTimer(false);
  };

  const handleIncrementReps = () => {
    sound.playCompassClick();
    setCurrentReps(prev => {
      const next = prev + 1;
      if (next >= targetReps) {
        sound.playTaskSuccess();
      }
      return next;
    });
  };

  if (task.modifier.isBypassed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl font-mono text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-300">
            <Sparkles className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400 mb-1">
            {task.modifier.tierName}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Movement Roll: <span className="font-bold text-emerald-300">{task.rollValue}</span>
          </p>
          <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-4 mb-6 text-sm text-emerald-200 leading-relaxed">
            {task.modifier.flavor}
          </div>
          <button
            onClick={() => onCompleteTask(true)}
            className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/60 active:scale-98"
          >
            Claim Blessing & Advance Turn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-200 shadow-2xl font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            {task.isApexGauntlet ? (
              <Crown className="w-5 h-5 text-amber-400" />
            ) : task.isChaserEncounter ? (
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            ) : (
              <Flame className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-sm font-bold tracking-wider uppercase text-slate-100">
              {task.isApexGauntlet
                ? 'The Apex Gauntlet of Release'
                : task.isChaserEncounter
                ? 'Overseer Encounter Challenge'
                : task.isRuinedCheck
                ? 'The Brink: High Risk Check'
                : 'Current Sector Trial'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {player.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold border ${
                task.rollValue > 0
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : task.rollValue < 0
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              Roll: {task.rollValue > 0 ? `+${task.rollValue}` : task.rollValue}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-100">
              {task.baseAction.title}
            </h3>
            <span className="text-xs text-amber-400 font-semibold">
              Intensity: {task.modifier.intensityLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {task.baseAction.description}
          </p>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs flex flex-col gap-1">
            <div className="text-slate-400 text-[11px]">Formula Breakdown:</div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="text-slate-300">Base Requirement</span>
              <span className="text-slate-600">+</span>
              <span className="text-rose-400 font-semibold">{task.modifier.tierName}</span>
              <span className="text-slate-600">=</span>
              <span className="text-amber-300 font-bold">
                {targetSeconds > 0 ? `${targetSeconds}s Duration` : ''}
                {targetSeconds > 0 && targetReps > 0 ? ' · ' : ''}
                {targetReps > 0 ? `${targetReps} Repetitions` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-0.5">
              "{task.modifier.flavor}"
            </p>
          </div>
        </div>

        {task.customHumiliationPhrase && (
          <div className="mb-4 bg-rose-950/30 border border-rose-900/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span>Mandatory Submission Pledge:</span>
            </div>
            <p className="text-sm text-rose-100 italic font-serif leading-relaxed px-2 py-1 bg-black/40 rounded border border-rose-900/40">
              "{task.customHumiliationPhrase}"
            </p>
            <span className="block text-[10px] text-rose-400/80 mt-1.5">
              *Recite kneeling with clear voice before supervisor approval.
            </span>
          </div>
        )}

        {targetSeconds > 0 && (
          <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                Cadence Stopwatch
              </span>
              <button
                onClick={() => setMetronomeAudio(!metronomeAudio)}
                className={`p-1 rounded text-[11px] flex items-center gap-1 ${
                  metronomeAudio ? 'text-amber-400' : 'text-slate-600'
                }`}
                title="Toggle metronome audio ticks"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Ticks</span>
              </button>
            </div>

            <div className="text-5xl font-black tabular-nums tracking-wider text-amber-400 my-2">
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
              {String(timeLeft % 60).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
              <button
                onClick={toggleTimer}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isRunning
                    ? 'bg-amber-900/60 text-amber-200 border border-amber-700'
                    : 'bg-emerald-950 text-emerald-200 border border-emerald-700 hover:bg-emerald-900'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'Pause' : timeLeft === 0 ? 'Repeat' : 'Begin Timer'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {targetReps > 0 && (
          <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Completed Reps:</span>
              <span className="text-xl font-bold tabular-nums text-slate-100">
                {currentReps} / {targetReps}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentReps(Math.max(0, currentReps - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm"
              >
                -1
              </button>
              <button
                onClick={handleIncrementReps}
                className="py-1.5 px-4 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 hover:bg-slate-700 font-bold text-xs"
              >
                +1 Rep
              </button>
            </div>
          </div>
        )}

        {hasIronWill && (
          <div className="mb-4 bg-sky-950/40 border border-sky-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs text-sky-200">
              <span className="font-bold block">Iron Will Shard Available:</span>
              <span className="text-[11px] text-sky-400">Expend to instantly nullify this trial.</span>
            </div>
            <button
              onClick={onUseIronWill}
              className="py-1 px-3 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            >
              Use Shard
            </button>
          </div>
        )}

        {task.isRuinedCheck && (
          <div className="mb-4 bg-rose-950/60 border border-rose-600/80 rounded-xl p-3 text-xs text-rose-200">
            <span className="font-bold flex items-center gap-1.5 text-rose-300 mb-0.5">
              <ShieldAlert className="w-4 h-4" />
              Brink Risk: Do not cross over!
            </span>
            <p className="text-[11px] text-rose-300/80">
              If control was broken and a release occurred without authorization, you must submit to a Ruined Orgasm penalty!
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {task.isRuinedCheck && (
            <button
              onClick={() => onCompleteTask(false, true)}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Failed / Ruined Finish</span>
            </button>
          )}

          <button
            onClick={() => onCompleteTask(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/60 active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Task Fully Executed & Passed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
