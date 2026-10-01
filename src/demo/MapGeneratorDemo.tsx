import React, { useState, useMemo, useEffect } from 'react';
import { 
  generateBoardGraph, 
  MapGenOptions, 
  GraphTopology 
} from '../lib/map/graphGenerator';
import { BoardNode, TileType } from '../lib/types/game';
import { 
  RotateCcw, 
  Sliders, 
  Compass, 
  Code, 
  Footprints,
  AlertTriangle, 
  Droplet, 
  Skull, 
  Sparkles, 
  Crown, 
  Copy, 
  Check,
  CircleDot,
  Octagon,
  GitBranch,
  Split
} from 'lucide-react';
import { sound } from '../lib/audio/soundEngine';

export const MapGeneratorDemo: React.FC = () => {
  const [genOptions, setGenOptions] = useState<MapGenOptions>({
    maxNodes: 38,
    branchChance: 0.85,
    primaryTendrilCount: 6,
    maxDotsBetweenRooms: 1, // Random 0 to 1 per screenshot
    allowHalfLengthPaths: true, // Variable full length (1.0x) and half length (0.6x)
    sparsityLimit: 0.35,
    reconnectionChance: 0.38,
    gridSpacing: 120,
    hazardSwampChance: 0.25,
    sanctuaryChance: 0.20,
    relicChance: 0.25,
    ruinedChance: 0.30,
  });

  const [seed, setSeed] = useState<number>(1);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Exploration Simulation State
  const [playerNodeId, setPlayerNodeId] = useState<string>('node_origin_room');
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set(['node_origin_room']));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const graph: GraphTopology = useMemo(() => {
    return generateBoardGraph(genOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genOptions, seed]);

  const allNodes = useMemo(() => Object.values(graph.nodes), [graph.nodes]);

  useEffect(() => {
    setPlayerNodeId(graph.startNodeId);
    setVisitedNodeIds(new Set([graph.startNodeId]));
    setSelectedNodeId(graph.startNodeId);
  }, [graph.startNodeId, seed]);

  const currentPlayerNode = graph.nodes[playerNodeId] || graph.nodes[graph.startNodeId];

  const adjacentMoveNodeIds = useMemo(() => {
    if (!currentPlayerNode) return [];
    return currentPlayerNode.nextNodes;
  }, [currentPlayerNode]);

  const stats = useMemo(() => {
    let roomCount = 0;
    let dotCount = 0;
    let totalEdges = 0;

    allNodes.forEach(node => {
      if (node.roomType === 'RestSpot') dotCount++;
      else roomCount++;
      totalEdges += node.nextNodes.length;
    });

    return {
      totalNodes: allNodes.length,
      totalEdges: Math.round(totalEdges / 2),
      roomCount,
      dotCount,
      densityPercent: (graph.density * 100).toFixed(1),
    };
  }, [allNodes, graph.density]);

  const handleRegenerate = () => {
    sound.playRollRattle();
    setSeed(prev => prev + 1);
  };

  const handlePlayerMove = (targetNodeId: string) => {
    sound.playCompassClick();
    setPlayerNodeId(targetNodeId);
    setSelectedNodeId(targetNodeId);
    setVisitedNodeIds(prev => new Set([...prev, targetNodeId]));

    if (targetNodeId === graph.apexNodeId) {
      sound.playSeReleaseFanfare();
    }
  };

  const handleResetExploration = () => {
    sound.playCompassClick();
    setPlayerNodeId(graph.startNodeId);
    setVisitedNodeIds(new Set([graph.startNodeId]));
    setSelectedNodeId(graph.startNodeId);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(graph, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
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

  const renderTileIcon = (type: TileType) => {
    if (type === 'APEX') return <Crown className="w-5 h-5 text-amber-300" />;
    if (type === 'START') return <Compass className="w-4 h-4 text-amber-400" />;
    if (type === 'HAZARD_SWAMP') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (type === 'SANCTUARY') return <Droplet className="w-4 h-4 text-sky-400" />;
    if (type === 'RUINED_HAZARD') return <Skull className="w-4 h-4 text-rose-500" />;
    if (type === 'ITEM_RELIC') return <Sparkles className="w-4 h-4 text-yellow-300" />;

    return <Octagon className="w-4 h-4 text-amber-300" />;
  };

  const selectedNode = selectedNodeId ? graph.nodes[selectedNodeId] : currentPlayerNode;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-mono select-none">
      {/* Sleek Ultra-Compact Top Bar (44px) */}
      <header className="h-11 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-600/70 flex items-center justify-center text-emerald-400">
            <Split className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              MAP LAB <span className="text-emerald-500">·</span> 8-DIRECTIONAL OCTAGON GRAPH
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
              All Rooms Are Octagons · 8-Directional Branching · Zero Overlap
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleRegenerate}
            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white rounded font-bold text-[11px] flex items-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-roll (Seed #{seed})</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Side: Parameters Sidebar */}
        <aside className="w-full lg:w-76 bg-slate-900/95 border-r border-slate-800 p-3 overflow-y-auto space-y-2.5 shrink-0 text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider">Parameters</span>
            </div>
            <button
              onClick={handleResetExploration}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              title="Reset player to starting room"
            >
              <Footprints className="w-3 h-3" />
              <span>Reset Pos</span>
            </button>
          </div>

          {/* 1. Variable Path Length Toggle */}
          <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <div>
              <span className="font-bold text-slate-200 block">Variable Path Length</span>
              <span className="text-[10px] text-slate-400">Full (1.0x) &amp; Half (0.6x)</span>
            </div>
            <button
              onClick={() =>
                setGenOptions(prev => ({ ...prev, allowHalfLengthPaths: !prev.allowHalfLengthPaths }))
              }
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                genOptions.allowHalfLengthPaths
                  ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              {genOptions.allowHalfLengthPaths ? 'ENABLED' : 'FIXED 1.0x'}
            </button>
          </div>

          {/* 2. Max Nodes in a Row (0 to 2) */}
          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 text-slate-200">
                <CircleDot className="w-3 h-3 text-sky-400" /> Transit Dots Between Rooms:
              </span>
              <span className="text-sky-400 font-bold tabular-nums">
                Random 0 to {genOptions.maxDotsBetweenRooms ?? 2}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight mb-1">
              Random intermediate waypoint dots between octagonal rooms.
            </p>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={genOptions.maxDotsBetweenRooms ?? 2}
              onChange={e =>
                setGenOptions(prev => ({
                  ...prev,
                  maxDotsBetweenRooms: Number(e.target.value),
                  waypointChainLength: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* 3. Branching & Forking Rate */}
          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span>8-Way Branching Rate:</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {Math.round((genOptions.branchChance ?? 0.75) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={0.95}
              step={0.05}
              value={genOptions.branchChance}
              onChange={e =>
                setGenOptions(prev => ({ ...prev, branchChance: Number(e.target.value) }))
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 4. Primary Radial Arms */}
          <div>
            <div className="flex justify-between text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 text-slate-200">
                <GitBranch className="w-3 h-3 text-emerald-400" /> Primary Arms from Origin:
              </span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {genOptions.primaryTendrilCount} arms
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={6}
              step={1}
              value={genOptions.primaryTendrilCount}
              onChange={e =>
                setGenOptions(prev => ({ ...prev, primaryTendrilCount: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* 5. Total Nodes & Spacing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block mb-0.5">Max Nodes: {genOptions.maxNodes}</span>
              <input
                type="range"
                min={16}
                max={40}
                step={2}
                value={genOptions.maxNodes}
                onChange={e =>
                  setGenOptions(prev => ({ ...prev, maxNodes: Number(e.target.value) }))
                }
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Spacing: {genOptions.gridSpacing}px</span>
              <input
                type="range"
                min={100}
                max={150}
                step={5}
                value={genOptions.gridSpacing}
                onChange={e =>
                  setGenOptions(prev => ({ ...prev, gridSpacing: Number(e.target.value) }))
                }
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Diagnostics Panel */}
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Octagon className="w-3 h-3" /> Octagon Rooms:
              </span>
              <span className="font-bold text-amber-300 tabular-nums">
                {stats.roomCount} rooms
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Transit Waypoints:</span>
              <span className="font-bold text-sky-400 tabular-nums">{stats.dotCount} dots</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Nodes / Edges:</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {stats.totalNodes} / {stats.totalEdges}
              </span>
            </div>
          </div>
        </aside>

        {/* Center / Right: Map Canvas & Compact HUD */}
        <main className="flex-1 flex flex-col p-2 overflow-hidden gap-1.5 min-h-0">
          {/* Compact Exploration HUD */}
          <div className="h-8 px-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                <Footprints className="w-3.5 h-3.5" /> Position:
              </span>
              <span className="text-slate-200 font-semibold truncate">
                {currentPlayerNode.title}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                ({currentPlayerNode.roomType === 'RestSpot' ? 'Waypoint Dot' : 'Octagon Room'})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-emerald-400 font-bold text-[10px]">
                {adjacentMoveNodeIds.length} Moves Available
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-[10px] text-slate-400">Click any adjacent room or dot to move</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div
            className="flex-1 min-h-0 w-full overflow-auto rounded-xl border border-slate-700/80 bg-slate-950 relative shadow-inner p-3"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.88)), url('/src/assets/images/game_board_slate_texture_1790812627477.jpg')`,
              backgroundSize: 'cover',
            }}
          >
            <svg
              width={graph.bounds.width}
              height={graph.bounds.height}
              className="overflow-visible block"
            >
              <defs>
                {/* High-Contrast Luminous Path Gradient */}
                <linearGradient id="edgeDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
                </linearGradient>
                {/* Active Accessible Route Glowing Gradient */}
                <linearGradient id="edgeAccessible" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="50%" stopColor="#fde047" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Corridor Lines: High-Contrast Crisp Pathways */}
              {allNodes.map(node =>
                node.nextNodes.map(nextId => {
                  const targetNode = graph.nodes[nextId];
                  if (!targetNode) return null;
                  if (node.id > nextId) return null;

                  const isAccessibleEdge =
                    (node.id === playerNodeId && adjacentMoveNodeIds.includes(nextId)) ||
                    (nextId === playerNodeId && adjacentMoveNodeIds.includes(node.id));

                  return (
                    <g key={`edge-${node.id}-${nextId}`}>
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
                        stroke={isAccessibleEdge ? 'url(#edgeAccessible)' : 'url(#edgeDefault)'}
                        strokeWidth={isAccessibleEdge ? '4' : '2.5'}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })
              )}

              {/* All Nodes: Octagonal Rooms & Waypoint Transit Dots */}
              {allNodes.map(node => {
                const isPlayerHere = node.id === playerNodeId;
                const isAdjacentMove = adjacentMoveNodeIds.includes(node.id);
                const isVisited = visitedNodeIds.has(node.id);
                const isApex = node.type === 'APEX';
                const isRestSpot = node.roomType === 'RestSpot';

                const roomSize = isApex ? 72 : 62;
                const halfRoom = roomSize / 2;
                const dotRadius = 11;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (isAdjacentMove) {
                        handlePlayerMove(node.id);
                      } else {
                        sound.playCompassClick();
                        setSelectedNodeId(node.id);
                      }
                    }}
                  >
                    {isRestSpot ? (
                      /* Waypoint Transit Dot (22px) */
                      <g>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isPlayerHere ? dotRadius + 3 : isAdjacentMove ? dotRadius + 2 : dotRadius}
                          fill={
                            isPlayerHere
                              ? '#064e3b'
                              : isAdjacentMove
                              ? '#1e293b'
                              : isVisited
                              ? '#1e293b'
                              : '#090d16'
                          }
                          stroke={
                            isPlayerHere
                              ? '#34d399'
                              : isAdjacentMove
                              ? '#f59e0b'
                              : node.type === 'SANCTUARY'
                              ? '#38bdf8'
                              : node.type === 'ITEM_RELIC'
                              ? '#eab308'
                              : '#64748b'
                          }
                          strokeWidth={isPlayerHere ? '3' : isAdjacentMove ? '2.5' : '1.5'}
                          className="transition-colors duration-150 hover:brightness-125"
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={4}
                          fill={
                            isPlayerHere
                              ? '#34d399'
                              : isAdjacentMove
                              ? '#f59e0b'
                              : node.type === 'SANCTUARY'
                              ? '#38bdf8'
                              : node.type === 'ITEM_RELIC'
                              ? '#eab308'
                              : '#cbd5e1'
                          }
                        />
                      </g>
                    ) : (
                      /* Octagonal Room - ALL rooms are octagonal! */
                      <g>
                        <polygon
                          points={getOctagonPoints(node.x, node.y, halfRoom)}
                          fill={
                            isPlayerHere
                              ? '#78350f'
                              : isAdjacentMove
                              ? '#451a03'
                              : isVisited
                              ? '#1e293b'
                              : '#0f172a'
                          }
                          stroke={
                            isPlayerHere
                              ? '#fbbf24'
                              : isAdjacentMove
                              ? '#f59e0b'
                              : isApex
                              ? '#f59e0b'
                              : node.type === 'RUINED_HAZARD'
                              ? '#f43f5e'
                              : '#64748b'
                          }
                          strokeWidth={isPlayerHere ? '3.5' : isAdjacentMove ? '3' : '2'}
                          className="transition-colors duration-150 hover:brightness-110"
                        />
                        <foreignObject
                          x={node.x - 12}
                          y={node.y - 12}
                          width={24}
                          height={24}
                          className="pointer-events-none"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            {renderTileIcon(node.type)}
                          </div>
                        </foreignObject>
                        <text
                          x={node.x}
                          y={node.y + halfRoom + 12}
                          textAnchor="middle"
                          className="text-[8px] font-mono font-bold fill-slate-300 pointer-events-none select-none"
                        >
                          {node.type === 'APEX' ? 'APEX' : node.type === 'START' ? 'ORIGIN' : 'ROOM'}
                        </text>
                      </g>
                    )}

                    {/* Static Player Marker */}
                    {isPlayerHere && (
                      <g transform={`translate(${node.x}, ${node.y - (isRestSpot ? dotRadius + 12 : halfRoom + 12)})`}>
                        <circle r="9" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
                        <text
                          y="3"
                          textAnchor="middle"
                          className="text-[8px] font-mono font-black fill-amber-200 pointer-events-none"
                        >
                          YOU
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Inspector Bar */}
          {selectedNode && (
            <div className="h-11 px-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-bold text-amber-400 text-xs truncate">
                  {selectedNode.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {selectedNode.roomType === 'RestSpot' ? 'Waypoint Dot' : 'Octagon Room'}
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                  {selectedNode.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedNode.id === playerNodeId ? (
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700/60 rounded text-[10px] font-bold">
                    CURRENT
                  </span>
                ) : adjacentMoveNodeIds.includes(selectedNode.id) ? (
                  <button
                    onClick={() => handlePlayerMove(selectedNode.id)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Footprints className="w-3 h-3" />
                    <span>Walk Here</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* JSON Modal */}
          {showJsonInspector && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-4 max-h-[80vh] flex flex-col font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-200">Topology Graph JSON</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyJson}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => setShowJsonInspector(false)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto mt-2 p-2 bg-slate-950 rounded text-[10px] text-slate-300">
                  <pre>{JSON.stringify(graph, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
