import React from 'react';
import { Compass, Navigation } from 'lucide-react';
import { BoardNode } from '../../lib/types/game';
import { sound } from '../../lib/audio/soundEngine';

interface CompassUIProps {
  currentNode: BoardNode;
  availableNextNodes: BoardNode[];
  selectedTargetNodeId: string | null;
  onSelectTargetNode: (nodeId: string) => void;
  disabled?: boolean;
}

export const CompassUI: React.FC<CompassUIProps> = ({
  currentNode,
  availableNextNodes,
  selectedTargetNodeId,
  onSelectTargetNode,
  disabled = false,
}) => {
  const selectedNode = availableNextNodes.find(n => n.id === selectedTargetNodeId);

  let needleAngle = 90; // Default East
  if (selectedNode) {
    const dx = selectedNode.x - currentNode.x;
    const dy = selectedNode.y - currentNode.y;
    needleAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  const handleSelectPath = (nodeId: string) => {
    if (disabled) return;
    sound.playCompassClick();
    onSelectTargetNode(nodeId);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-between gap-3 shadow-lg">
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Compass className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-slate-200">SEXTANT COMPASS</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {availableNextNodes.length > 1 ? 'FORK DETECTED' : 'DIRECT PATH'}
        </span>
      </div>

      {/* Compass Dial Visualizer */}
      <div className="relative w-32 h-32 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center shadow-inner group">
        <span className="absolute top-1 text-[9px] font-mono text-slate-500">N</span>
        <span className="absolute right-2 text-[9px] font-mono text-amber-500/80 font-bold">E</span>
        <span className="absolute bottom-1 text-[9px] font-mono text-slate-500">S</span>
        <span className="absolute left-2 text-[9px] font-mono text-slate-500">W</span>

        <div className="absolute inset-2 rounded-full border border-slate-800/80 pointer-events-none" />
        <div className="absolute inset-5 rounded-full border border-slate-800/40 pointer-events-none" />

        <div
          className="absolute w-full h-full flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        >
          <div className="w-1.5 h-12 bg-gradient-to-t from-amber-500 to-rose-600 rounded-t-full shadow-sm shadow-rose-900/50 -translate-y-6" />
          <div className="w-1.5 h-12 bg-slate-600 rounded-b-full translate-y-6" />
        </div>

        <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-amber-500 z-10 shadow" />
      </div>

      {/* Path Selection Affordances */}
      <div className="w-full flex flex-col gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 text-center">
          {availableNextNodes.length > 1 ? 'Aim Compass Toward Chosen Path:' : 'Target Vector Locked:'}
        </span>
        <div className="grid grid-cols-1 gap-1.5 w-full">
          {availableNextNodes.map(node => {
            const isSelected = node.id === selectedTargetNodeId;
            const isFork = availableNextNodes.length > 1;
            const laneLabel = isFork
              ? node.y < currentNode.y
                ? 'North Path (Upper)'
                : node.y > currentNode.y
                ? 'South Path (Lower)'
                : 'Center Traverse'
              : 'Direct Forward Course';

            return (
              <button
                key={node.id}
                disabled={disabled}
                onClick={() => handleSelectPath(node.id)}
                className={`w-full px-3 py-2 text-left rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-600/80 text-amber-200 shadow-sm shadow-amber-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Navigation
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-amber-400' : 'text-slate-600'
                    }`}
                    style={{
                      transform: `rotate(${
                        node.y < currentNode.y ? -45 : node.y > currentNode.y ? 45 : 0
                      }deg)`,
                    }}
                  />
                  <div className="truncate">
                    <span className="font-semibold block truncate">{laneLabel}</span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      Tile #{node.tier + 1} · {node.title}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-[10px] uppercase font-bold text-amber-400 ml-2">
                    AIMED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
