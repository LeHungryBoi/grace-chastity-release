import React, { useRef, useEffect } from 'react';
import { BoardNode, Player, TileType, RoomType, ChaserMonolith } from '../../lib/types/game';
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
  CircleDot,
  Radio
} from 'lucide-react';

interface BoardGraphProps {
  nodes: Record<string, BoardNode>;
  players: Player[];
  activePlayerId: string;
  chaserNodeId?: string | null;
  chaserSpawned?: boolean;
  monoliths?: ChaserMonolith[];
  selectedTargetNodeId: string | null;
  onNodeClick?: (nodeId: string) => void;
}

export const BoardGraph: React.FC<BoardGraphProps> = ({
  nodes,
  players,
  activePlayerId,
  chaserNodeId,
  chaserSpawned,
  monoliths = [],
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

  // Extract all unique undirected corridors to ensure uniform bright paths across the board
  const uniqueCorridors = React.useMemo(() => {
    const corridorMap = new Map<string, { from: BoardNode; to: BoardNode; id: string }>();
    allNodes.forEach(node => {
      node.nextNodes.forEach(nextId => {
        const target = nodes[nextId];
        if (target) {
          const key = [node.id, nextId].sort().join('__');
          if (!corridorMap.has(key)) {
            corridorMap.set(key, { from: node, to: target, id: key });
          }
        }
      });
    });
    return Array.from(corridorMap.values());
  }, [allNodes, nodes]);

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

  const hasAggroMonoliths = monoliths.some(m => m.isAggro) || chaserSpawned;

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
        <div className="flex items-center gap-3 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-sm shadow">
          <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Octagon className="w-3.5 h-3.5 text-amber-400" /> Octagon Room (Scripted)
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <CircleDot className="w-3.5 h-3.5" /> Waypoint Dot (Transit)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <Skull className="w-3.5 h-3.5" /> Ruined Brink
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Crown className="w-3.5 h-3.5" /> Apex Sanctum
          </span>
        </div>

        {hasAggroMonoliths && (
          <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-700/80 text-rose-300 px-3 py-1.5 rounded-lg backdrop-blur-sm font-semibold animate-pulse shadow">
            <Eye className="w-3.5 h-3.5" />
            <span>CHASER MONOLITH AGGRO (&le; 3 NODES)</span>
          </div>
        )}
      </div>

      <svg
        width={maxX}
        height={maxY}
        className="overflow-visible block p-4"
      >
        <defs>
          <filter id="monolithGlowBoard" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Connecting Corridor Edges - 100% Uniform, Bright, Crisp Pathways */}
        {uniqueCorridors.map(({ from, to, id }) => (
          <line
            key={`corridor-${id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#e2e8f0"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.92"
          />
        ))}

        {/* Aggro Tether Lines between Chasers and Target Players */}
        {monoliths.map(m => {
          if (!m.isAggro || !m.targetPlayerId) return null;
          const mNode = nodes[m.currentNodeId];
          const targetP = players.find(p => p.id === m.targetPlayerId);
          const pNode = targetP ? nodes[targetP.currentNodeId] : null;
          if (!mNode || !pNode) return null;

          return (
            <line
              key={`tether-${m.id}`}
              x1={mNode.x}
              y1={mNode.y}
              x2={pNode.x}
              y2={pNode.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
              opacity="0.8"
            />
          );
        })}

        {/* 2. Room Shapes & Nodes */}
        {allNodes.map(node => {
          const isCurrentActivePlayerNode = activePlayer?.currentNodeId === node.id;
          const isTarget = selectedTargetNodeId === node.id;
          const isApex = node.type === 'APEX';

          // Support multiple players in the same node
          const playersOnNode = players.filter(p => p.currentNodeId === node.id);
          
          // Support multiple Chaser Monoliths in the same node
          const nodeMonoliths = monoliths.filter(m => m.currentNodeId === node.id);
          const legacyChaserHere = chaserSpawned && chaserNodeId === node.id;

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
                {node.type === 'APEX' ? 'APEX' : node.type === 'START' ? 'ORIGIN' : isRestSpot ? `(${node.gridX},${node.gridY})` : `ROOM (${node.gridX},${node.gridY})`}
              </text>

              {/* Multiple Players Occupying this Node */}
              {playersOnNode.length > 0 && (
                <g transform={`translate(${node.x}, ${node.y - (isRestSpot ? dotRadius + 14 : half + 14)})`}>
                  {playersOnNode.map((p, idx) => {
                    const offset = (idx - (playersOnNode.length - 1) / 2) * 18;
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

              {/* Chaser Monoliths on this Node */}
              {nodeMonoliths.map((m, mIdx) => {
                const mOffset = (mIdx - (nodeMonoliths.length - 1) / 2) * 20;
                return (
                  <g 
                    key={m.id} 
                    transform={`translate(${node.x + mOffset}, ${node.y + (isRestSpot ? dotRadius + 12 : half + 12)})`}
                    filter={m.isAggro ? 'url(#monolithGlowBoard)' : undefined}
                  >
                    <polygon
                      points="-6,0 0,-14 6,0 4,8 -4,8"
                      fill={m.isAggro ? '#7f1d1d' : '#1e293b'}
                      stroke={m.isAggro ? '#ef4444' : '#64748b'}
                      strokeWidth={m.isAggro ? 2 : 1.5}
                    />
                    <circle
                      cy="-5"
                      r="2.5"
                      fill={m.isAggro ? '#f87171' : '#94a3b8'}
                      className={m.isAggro ? 'animate-ping' : ''}
                    />
                  </g>
                );
              })}

              {/* Legacy fallback if single chaserNodeId passed */}
              {nodeMonoliths.length === 0 && legacyChaserHere && (
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
