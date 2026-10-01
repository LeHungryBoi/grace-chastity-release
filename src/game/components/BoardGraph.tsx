import React, { useRef, useEffect } from 'react';
import { BoardNode, Player, TileType, RoomType } from '../../lib/types/game';
import { 
  Shield, 
  Swords, 
  Droplet, 
  Skull, 
  Sparkles, 
  Crown, 
  AlertTriangle,
  ChevronRight,
  Eye,
  Octagon,
  CircleDot
} from 'lucide-react';

interface BoardGraphProps {
  nodes: Record<string, BoardNode>;
  players: Player[];
  activePlayerId: string;
  chaserNodeId: string | null;
  chaserSpawned: boolean;
  selectedTargetNodeId: string | null;
  onNodeClick?: (nodeId: string) => void;
}

export const BoardGraph: React.FC<BoardGraphProps> = ({
  nodes,
  players,
  activePlayerId,
  chaserNodeId,
  chaserSpawned,
  selectedTargetNodeId,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePlayer = players.find(p => p.id === activePlayerId);

  useEffect(() => {
    if (activePlayer && containerRef.current) {
      const playerNode = nodes[activePlayer.currentNodeId];
      if (playerNode) {
        const targetScrollX = Math.max(0, playerNode.x - 300);
        const targetScrollY = Math.max(0, playerNode.y - 200);
        containerRef.current.scrollTo({ left: targetScrollX, top: targetScrollY, behavior: 'smooth' });
      }
    }
  }, [activePlayer?.currentNodeId, activePlayerId, nodes]);

  const allNodes = Object.values(nodes);
  const maxX = Math.max(...allNodes.map(n => n.x), 900) + 120;
  const maxY = Math.max(...allNodes.map(n => n.y), 500) + 120;

  const renderTileIcon = (type: TileType, roomType?: RoomType) => {
    switch (type) {
      case 'START':
        return <ChevronRight className="w-5 h-5 text-amber-400" />;
      case 'HAZARD_SWAMP':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'SANCTUARY':
        return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'RUINED_HAZARD':
        return <Skull className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'ITEM_RELIC':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'APEX':
        return <Crown className="w-6 h-6 text-amber-300 animate-bounce" />;
      default:
        return <Octagon className="w-4 h-4 text-amber-300" />;
    }
  };

  const getOctagonPoints = (cx: number, cy: number, r: number): string => {
    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto rounded-xl border border-slate-800/80 bg-slate-950 select-none shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.85)), url('/src/assets/images/game_board_slate_texture_1790812627477.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="sticky top-3 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-400 z-10 pointer-events-none mb-2 px-2">
        <div className="flex items-center gap-4 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-sm shadow">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Octagon className="w-3.5 h-3.5 text-amber-400" /> Octagon Room (8-Way)
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <CircleDot className="w-3.5 h-3.5" /> Rest Waypoint
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <Skull className="w-3.5 h-3.5" /> Ruined Brink
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Crown className="w-3.5 h-3.5" /> Apex Sanctum
          </span>
        </div>

        {chaserSpawned && (
          <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700/80 text-rose-300 px-3 py-1.5 rounded-lg backdrop-blur-sm font-semibold animate-pulse shadow">
            <Eye className="w-3.5 h-3.5" />
            <span>OVERSEER CHASER ACTIVE</span>
          </div>
        )}
      </div>

      <svg
        width={maxX}
        height={maxY}
        className="overflow-visible block p-4"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="activePathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 1. Connecting Corridor Edges */}
        {allNodes.map(node =>
          node.nextNodes.map(nextId => {
            const targetNode = nodes[nextId];
            if (!targetNode) return null;
            if (node.id > nextId) return null; // Avoid duplicate lines

            const isPlayerEdge =
              (activePlayer && node.id === activePlayer.currentNodeId && nextId === selectedTargetNodeId) ||
              (activePlayer && nextId === activePlayer.currentNodeId && node.id === selectedTargetNodeId);

            return (
              <g key={`edge-${node.id}->${nextId}`}>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#020617"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isPlayerEdge ? 'url(#activePathGradient)' : 'url(#pathGradient)'}
                  strokeWidth={isPlayerEdge ? '4' : '2.5'}
                  strokeLinecap="round"
                />
              </g>
            );
          })
        )}

        {/* 2. Room Shapes & Nodes */}
        {allNodes.map(node => {
          const isCurrentActivePlayerNode = activePlayer?.currentNodeId === node.id;
          const isTarget = selectedTargetNodeId === node.id;
          const isApex = node.type === 'APEX';

          const playersOnNode = players.filter(p => p.currentNodeId === node.id);
          const isChaserHere = chaserSpawned && chaserNodeId === node.id;

          const isRestSpot = node.roomType === 'RestSpot';
          const size = isApex ? 74 : node.roomType === 'OctagonHub' ? 66 : 58;
          const half = size / 2;
          const dotRadius = 11; // 22px diameter subtle waypoint dot

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onNodeClick && onNodeClick(node.id)}
            >
              {isRestSpot ? (
                /* Small Waypoint Transit Dot */
                <g>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCurrentActivePlayerNode ? dotRadius + 3 : isTarget ? dotRadius + 2 : dotRadius}
                    fill={isCurrentActivePlayerNode ? '#064e3b' : isTarget ? '#1e293b' : '#090d16'}
                    stroke={isCurrentActivePlayerNode ? '#34d399' : isTarget ? '#f59e0b' : node.type === 'SANCTUARY' ? '#38bdf8' : node.type === 'ITEM_RELIC' ? '#eab308' : '#475569'}
                    strokeWidth={isCurrentActivePlayerNode || isTarget ? '2.5' : '1.5'}
                    className="transition-colors duration-150 hover:brightness-125"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={4}
                    fill={isCurrentActivePlayerNode ? '#34d399' : isTarget ? '#f59e0b' : node.type === 'SANCTUARY' ? '#38bdf8' : node.type === 'ITEM_RELIC' ? '#eab308' : '#64748b'}
                  />
                </g>
              ) : (
                /* Prominent Octagon Room - All rooms are octagonal! */
                <g>
                  <polygon
                    points={getOctagonPoints(node.x, node.y, half)}
                    fill={isCurrentActivePlayerNode ? '#78350f' : isTarget ? '#451a03' : '#0f172a'}
                    stroke={isCurrentActivePlayerNode ? '#fbbf24' : isTarget ? '#f59e0b' : isApex ? '#f59e0b' : node.type === 'RUINED_HAZARD' ? '#f43f5e' : '#64748b'}
                    strokeWidth={isCurrentActivePlayerNode || isTarget ? '3' : '2'}
                    className="transition-colors duration-150 hover:brightness-110"
                  />
                  <foreignObject
                    x={node.x - 14}
                    y={node.y - 14}
                    width={28}
                    height={28}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {renderTileIcon(node.type, node.roomType)}
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* Label */}
              <text
                x={node.x}
                y={node.y + (isRestSpot ? dotRadius + 14 : half + 14)}
                textAnchor="middle"
                className="text-[9px] font-mono fill-slate-400 pointer-events-none select-none"
              >
                {node.type === 'APEX' ? 'APEX' : node.type === 'START' ? 'ORIGIN' : isRestSpot ? `(${node.gridX},${node.gridY})` : `CHAMBER (${node.gridX},${node.gridY})`}
              </text>

              {/* Players Occupying this Node */}
              {playersOnNode.length > 0 && (
                <g transform={`translate(${node.x}, ${node.y - (isRestSpot ? dotRadius + 14 : half + 14)})`}>
                  {playersOnNode.map((p, idx) => {
                    const offset = (idx - (playersOnNode.length - 1) / 2) * 16;
                    const isActive = p.id === activePlayerId;
                    return (
                      <g key={p.id} transform={`translate(${offset}, 0)`}>
                        <circle
                          r={isActive ? "10" : "8"}
                          fill="#0f172a"
                          stroke={p.color}
                          strokeWidth={isActive ? "2.5" : "1.5"}
                          className={isActive ? "animate-pulse" : ""}
                        />
                        <text
                          y="3"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Chaser Entity Marker */}
              {isChaserHere && (
                <g transform={`translate(${node.x + (isRestSpot ? dotRadius : half - 2)}, ${node.y - (isRestSpot ? dotRadius : half - 2)})`}>
                  <circle r="11" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                  <circle r="10" fill="#7f1d1d" stroke="#f87171" strokeWidth="2" />
                  <text
                    y="3.5"
                    textAnchor="middle"
                    className="text-[9px] font-mono font-black fill-rose-200 pointer-events-none"
                  >
                    Ω
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
