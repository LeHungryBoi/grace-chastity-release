import React from 'react';
import { DMSettings, Player } from '../../lib/types/game';
import { BASE_ACTIONS } from '../../lib/config/actionsConfig';
import { 
  Sliders, 
  X, 
  Eye, 
  Zap, 
  HeartHandshake,
  Award
} from 'lucide-react';
import { sound } from '../../lib/audio/soundEngine';

interface DMSettingsModalProps {
  settings: DMSettings;
  onUpdateSettings: (newSettings: DMSettings) => void;
  onClose: () => void;
  players: Player[];
  activePlayerId: string;
  onManualSpawnChaser: () => void;
  onGrantApexPermission: (playerId: string) => void;
  onClearDebuffs: (playerId: string) => void;
}

export const DMSettingsModal: React.FC<DMSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  players,
  activePlayerId,
  onManualSpawnChaser,
  onGrantApexPermission,
  onClearDebuffs,
}) => {
  const toggleAction = (actionId: string) => {
    const exists = settings.activeActionIds.includes(actionId);
    let next: string[];
    if (exists) {
      if (settings.activeActionIds.length <= 1) return;
      next = settings.activeActionIds.filter(id => id !== actionId);
    } else {
      next = [...settings.activeActionIds, actionId];
    }
    onUpdateSettings({ ...settings, activeActionIds: next });
  };

  const handleVolatilityChange = (val: 1 | 3 | 5) => {
    sound.playCompassClick();
    onUpdateSettings({ ...settings, volatilityRange: val });
  };

  const handleChaserSpeedChange = (speed: number) => {
    sound.playCompassClick();
    onUpdateSettings({ ...settings, chaserSpeed: speed });
  };

  const handleSpawnRoundChange = (round: number) => {
    sound.playCompassClick();
    onUpdateSettings({ ...settings, chaserSpawnRound: round });
  };

  const handleSeverityChange = (severity: 'PENALTY_DEDUCT' | 'HARD_RESET') => {
    sound.playCompassClick();
    onUpdateSettings({ ...settings, ruinedSeverity: severity });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Sliders className="w-5 h-5" />
            <h3 className="text-base font-bold tracking-wider uppercase text-slate-100">
              Wifey Master Control & Balancing Panel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 text-sm">Modifier Volatility (Die Range)</span>
              <span className="text-slate-400">
                Current: [-{settings.volatilityRange}, +{settings.volatilityRange}]
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1 as const, label: 'Low: [-1 to +1]', desc: 'Gentle pacing, reduced extremes' },
                { val: 3 as const, label: 'Standard: [-3 to +3]', desc: 'Default roguelike volatility' },
                { val: 5 as const, label: 'Crucible: [-5 to +5]', desc: 'High stakes, extreme cruelty/relief' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => handleVolatilityChange(opt.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.volatilityRange === opt.val
                      ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block text-slate-100">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm mb-3">
              <Eye className="w-4 h-4 text-rose-500" />
              <span>Overseer Chaser Entity Dynamics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 mb-1.5">
                  Chaser Speed: <strong className="text-rose-400">{settings.chaserSpeed} tiles / cycle</strong>
                </span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(spd => (
                    <button
                      key={spd}
                      onClick={() => handleChaserSpeedChange(spd)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                        settings.chaserSpeed === spd
                          ? 'bg-rose-900 border-rose-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {spd === 0 ? 'Off' : `${spd} t`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-slate-400 mb-1.5">
                  Spawn Trigger: <strong className="text-amber-400">After Cycle #{settings.chaserSpawnRound}</strong>
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rnd => (
                    <button
                      key={rnd}
                      onClick={() => handleSpawnRoundChange(rnd)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-xs ${
                        settings.chaserSpawnRound === rnd
                          ? 'bg-amber-900 border-amber-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      #{rnd}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-900 flex justify-end">
              <button
                onClick={onManualSpawnChaser}
                className="py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-lg text-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Force Spawn / Reposition Chaser Now</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 text-sm">Ruined Orgasm Severity</span>
              <span className="text-slate-400">Consequence for premature loss of control</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSeverityChange('PENALTY_DEDUCT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.ruinedSeverity === 'PENALTY_DEDUCT'
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold block text-slate-100">Penalty & -3 Nodes</span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Player forfeits active perks and is set back 3 tiles.
                </span>
              </button>

              <button
                onClick={() => handleSeverityChange('HARD_RESET')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.ruinedSeverity === 'HARD_RESET'
                    ? 'bg-red-950 border-red-500 text-red-200 ring-1 ring-red-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold block text-rose-300">Hard Reset to Start</span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Merciless: Complete forfeiture back to Node 0 Genesis Gate!
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 text-sm">Active Challenge Pool</span>
              <span className="text-slate-500">Toggle allowed actions for tonight's session</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASE_ACTIONS.map(action => {
                const isActive = settings.activeActionIds.includes(action.id);
                return (
                  <button
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-slate-800 border-slate-600 text-slate-100'
                        : 'bg-slate-950/60 border-slate-900 text-slate-600'
                    }`}
                  >
                    <span className="font-bold block truncate text-[11px]">
                      {action.title}
                    </span>
                    <span className="text-[9px] text-slate-500 block uppercase mt-0.5">
                      {action.category} · {isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="font-bold text-slate-200 text-sm block mb-2">
              Mistress / Wifey Discretionary Rulings
            </span>
            <div className="flex flex-wrap gap-2">
              {players.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                >
                  <span className="font-bold text-slate-200">{p.name}:</span>
                  <button
                    onClick={() => onGrantApexPermission(p.id)}
                    className="px-2 py-1 bg-amber-950 text-amber-300 border border-amber-700/60 rounded hover:bg-amber-900 text-[11px] flex items-center gap-1"
                    title="Authorize final release command"
                  >
                    <Award className="w-3 h-3" />
                    <span>Authorize "色"</span>
                  </button>
                  <button
                    onClick={() => onClearDebuffs(p.id)}
                    className="px-2 py-1 bg-sky-950 text-sky-300 border border-sky-700/60 rounded hover:bg-sky-900 text-[11px] flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3 h-3" />
                    <span>Cleanse</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Apply & Return to Board
          </button>
        </div>
      </div>
    </div>
  );
};
