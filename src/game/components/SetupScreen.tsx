import React, { useState } from 'react';
import { AVATAR_OPTIONS, AvatarOption } from '../../lib/config/actionsConfig';
import { Player, DMSettings } from '../../lib/types/game';
import { 
  Users, 
  Plus, 
  Trash2, 
  Play, 
  Flame, 
  SlidersHorizontal 
} from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface SetupScreenProps {
  onStartGame: (players: Player[], settings: DMSettings) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [playerList, setPlayerList] = useState<{ name: string; avatarIndex: number }[]>([
    { name: 'Mark', avatarIndex: 0 },
    { name: 'Dan', avatarIndex: 1 },
  ]);

  const [volatility, setVolatility] = useState<1 | 3 | 5>(3);
  const [chaserSpeed, setChaserSpeed] = useState<number>(1);
  const [ruinedSeverity, setRuinedSeverity] = useState<'PENALTY_DEDUCT' | 'HARD_RESET'>('PENALTY_DEDUCT');

  const addPlayer = () => {
    if (playerList.length >= 4) return;
    sound.playCompassClick();
    setPlayerList(prev => [
      ...prev,
      { name: `Player ${prev.length + 1}`, avatarIndex: prev.length % AVATAR_OPTIONS.length },
    ]);
  };

  const removePlayer = (index: number) => {
    if (playerList.length <= 1) return;
    sound.playCompassClick();
    setPlayerList(prev => prev.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    setPlayerList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  };

  const cycleAvatar = (index: number) => {
    sound.playCompassClick();
    setPlayerList(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        avatarIndex: (copy[index].avatarIndex + 1) % AVATAR_OPTIONS.length,
      };
      return copy;
    });
  };

  const handleBegin = () => {
    sound.playTaskSuccess();
    const createdPlayers: Player[] = playerList.map((p, i) => {
      const avatar = AVATAR_OPTIONS[p.avatarIndex];
      return {
        id: `player_${i}_${Date.now()}`,
        name: p.name.trim() || `Player ${i + 1}`,
        avatarId: avatar.id,
        color: avatar.color,
        currentNodeId: 'node_0_0',
        statusEffects: [],
        relics: [],
        tasksCompleted: 0,
        penaltiesEndured: 0,
        ruinedCount: 0,
        totalRolls: 0,
        hasReachedApex: false,
        apexChallengePassed: false,
        hasPressedSe: false,
      };
    });

    const settings: DMSettings = {
      volatilityRange: volatility,
      chaserSpeed,
      chaserSpawnRound: 3,
      ruinedSeverity,
      activeActionIds: [
        'stroking',
        'nipple_play',
        'ball_tapping',
        'kneeling',
        'slapping',
        'humiliation',
        'cold_shock',
        'edge_hold',
      ],
      autoMetronomeSound: true,
      customPhrases: [],
    };

    onStartGame(createdPlayers, settings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-amber-500 mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>Turn-Based Chastity & Release Board</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase mb-2">
            APEX PROTOCOL
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Traverse the Roguelike Node Graph via Compass & Modifier Rolls. Endure trials, outpace the Overseer Chaser, and earn permission to strike the sacred <strong className="text-amber-400 font-serif font-bold">"色"</strong> button.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-amber-500" />
              <span>HOTSEAT ROSTER (1–4 PLAYERS)</span>
            </div>
            {playerList.length < 4 && (
              <button
                onClick={addPlayer}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Participant</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {playerList.map((p, idx) => {
              const avatar = AVATAR_OPTIONS[p.avatarIndex];
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl"
                >
                  <button
                    onClick={() => cycleAvatar(idx)}
                    className="w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-base transition-transform hover:scale-105 shrink-0"
                    style={{
                      borderColor: avatar.color,
                      backgroundColor: '#050811',
                      color: avatar.color,
                    }}
                    title="Click to cycle avatar monolith"
                  >
                    {avatar.symbol}
                  </button>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={p.name}
                      maxLength={18}
                      onChange={e => updateName(idx, e.target.value)}
                      placeholder={`Player ${idx + 1}`}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1 truncate">
                      {avatar.name} · {avatar.title}
                    </span>
                  </div>

                  {playerList.length > 1 && (
                    <button
                      onClick={() => removePlayer(idx)}
                      className="p-2 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl mb-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <span>INITIAL SESSION BALANCING</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Modifier Volatility:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { v: 1 as const, label: '[-1, +1]' },
                  { v: 3 as const, label: '[-3, +3]' },
                  { v: 5 as const, label: '[-5, +5]' },
                ].map(item => (
                  <button
                    key={item.v}
                    onClick={() => setVolatility(item.v)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold ${
                      volatility === item.v
                        ? 'bg-rose-950 border-rose-600 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Ruined Breach Penalty:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setRuinedSeverity('PENALTY_DEDUCT')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-bold ${
                    ruinedSeverity === 'PENALTY_DEDUCT'
                      ? 'bg-amber-950 border-amber-600 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  -3 Nodes
                </button>
                <button
                  onClick={() => setRuinedSeverity('HARD_RESET')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-bold ${
                    ruinedSeverity === 'HARD_RESET'
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Reset to Start
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleBegin}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-amber-950/80 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Lock In Vows & Begin Gauntlet</span>
        </button>
      </div>
    </div>
  );
};
