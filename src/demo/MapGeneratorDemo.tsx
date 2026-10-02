import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  generateBoardGraph, 
  MapGenOptions, 
  GraphTopology,
  getShortestPath
} from '../lib/map/graphGenerator';
import { 
  BoardNode, 
  TileType, 
  Player, 
  ChaserMonolith,
  RoundEndEvent,
  TurnEndEvent,
  GearItem,
  BroadcastContext
} from '../lib/types/game';
import { CHRONO_REST_HARNESS } from '../lib/config/gearConfig';
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
  Split,
  Zap,
  Coffee,
  CheckCircle2,
  Users,
  Radio,
  Eye,
  Terminal,
  Info,
  Shield,
  Layers,
  ArrowRight,
  Flame,
  Wrench,
  Bot
} from 'lucide-react';
import { sound } from '../lib/audio/soundEngine';
import { GraceModal } from '../game/components/GraceModal';
import { GraceChallenge, getRandomGraceChallenge } from '../lib/config/gracePoolConfig';

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
  const [showCallbacksLog, setShowCallbacksLog] = useState<boolean>(true);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Turn & Round Lifecycle State
  // Turn = Individual participant's turn; Round = Full table cycle when everyone has taken their turn
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [turnIndex, setTurnIndex] = useState<number>(1);
  const [activeParticipantIndex, setActiveParticipantIndex] = useState<number>(0);
  const [hasRestedThisTurn, setHasRestedThisTurn] = useState<boolean>(false);
  const [isNpcProcessing, setIsNpcProcessing] = useState<boolean>(false);

  // Participants (Human and NPC in the Global Turn Queue)
  const [participants, setParticipants] = useState<Player[]>([
    {
      id: 'player_1',
      name: 'Player 1',
      avatarId: 'avatar_alpha',
      color: '#f59e0b',
      currentNodeId: 'node_origin_room',
      actionPoints: 3,
      maxActionPoints: 3,
      graceTokens: 2,
      graceSubmittedCount: 0,
      graceForfeitedCount: 0,
      statusEffects: [],
      relics: [],
      gear: [CHRONO_REST_HARNESS], // Equipped by default on P1 for immediate testing
      tasksCompleted: 0,
      penaltiesEndured: 0,
      ruinedCount: 0,
      totalRolls: 0,
      hasReachedApex: false,
      apexChallengePassed: false,
      hasPressedSe: false,
      isNPC: false,
    },
    {
      id: 'npc_companion',
      name: 'NPC Companion',
      avatarId: 'avatar_npc',
      color: '#38bdf8',
      currentNodeId: 'node_origin_room',
      actionPoints: 3,
      maxActionPoints: 3,
      graceTokens: 1,
      graceSubmittedCount: 0,
      graceForfeitedCount: 0,
      statusEffects: [],
      relics: [],
      gear: [],
      tasksCompleted: 0,
      penaltiesEndured: 0,
      ruinedCount: 0,
      totalRolls: 0,
      hasReachedApex: false,
      apexChallengePassed: false,
      hasPressedSe: false,
      isNPC: true,
    }
  ]);

  // Chaser Monoliths placed in random spots on map
  const [monoliths, setMonoliths] = useState<ChaserMonolith[]>([]);

  // Trigger & Broadcast Callback Logs
  const [callbackLogs, setCallbackLogs] = useState<Array<{ id: string; text: string; type: 'round' | 'turn' | 'agro' | 'hook'; time: string }>>([]);

  const [activeGraceChallenge, setActiveGraceChallenge] = useState<GraceChallenge | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set(['node_origin_room']));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const graph: GraphTopology = useMemo(() => {
    return generateBoardGraph(genOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genOptions, seed]);

  const allNodes = useMemo(() => Object.values(graph.nodes), [graph.nodes]);

  // Extract all unique undirected corridor edges
  const uniqueCorridors = useMemo(() => {
    const corridorMap = new Map<string, { from: BoardNode; to: BoardNode; id: string }>();
    allNodes.forEach(node => {
      node.nextNodes.forEach(nextId => {
        const target = graph.nodes[nextId];
        if (target) {
          const key = [node.id, nextId].sort().join('__');
          if (!corridorMap.has(key)) {
            corridorMap.set(key, { from: node, to: target, id: key });
          }
        }
      });
    });
    return Array.from(corridorMap.values());
  }, [allNodes, graph.nodes]);

  // Setup / Reset when graph changes or seed rolls
  useEffect(() => {
    const eligibleNodes = allNodes.filter(
      n => n.id !== graph.startNodeId && n.id !== graph.apexNodeId
    );
    
    // Pick 3 random nodes for Chaser Monoliths
    const shuffled = [...eligibleNodes].sort(() => Math.random() - 0.5);
    const chosenMonolithNodes = shuffled.slice(0, Math.min(3, shuffled.length));

    const initialMonoliths: ChaserMonolith[] = chosenMonolithNodes.map((node, i) => ({
      id: `monolith_${i + 1}`,
      name: `Monolith ${['Alpha', 'Beta', 'Gamma'][i] || i + 1}`,
      currentNodeId: node.id,
      isAggro: false,
      targetPlayerId: null,
      distanceToTarget: 99,
    }));

    setMonoliths(initialMonoliths);
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        currentNodeId: graph.startNodeId,
        actionPoints: 3,
        graceTokens: p.isNPC ? 1 : 2,
      }))
    );
    setActiveParticipantIndex(0);
    setHasRestedThisTurn(false);
    setIsNpcProcessing(false);
    setVisitedNodeIds(new Set([graph.startNodeId]));
    setSelectedNodeId(graph.startNodeId);
    setRoundNumber(1);
    setTurnIndex(1);
    setCallbackLogs([
      {
        id: `init_${Date.now()}`,
        text: `Game initialized. Round #1 started. Global Turn Queue active with Player 1 & NPC Companion.`,
        type: 'round',
        time: new Date().toLocaleTimeString(),
      }
    ]);
  }, [graph.startNodeId, graph.apexNodeId, allNodes, seed]);

  // Currently active participant in the global turn queue
  const activeParticipant = participants[activeParticipantIndex] || participants[0];
  const currentNode = graph.nodes[activeParticipant.currentNodeId] || graph.nodes[graph.startNodeId];

  // Recalculate Monolith Aggro when any participant moves
  useEffect(() => {
    if (monoliths.length === 0) return;

    let newlyAggroed = false;
    const updated = monoliths.map(monolith => {
      let closestDistance = Infinity;
      let closestPlayer: Player | null = null;

      participants.forEach(p => {
        const path = getShortestPath(graph.nodes, monolith.currentNodeId, p.currentNodeId);
        const dist = path.length - 1;
        if (dist < closestDistance) {
          closestDistance = dist;
          closestPlayer = p;
        }
      });

      // Within 3 nodes (<= 3) -> AGGRO
      const isWithin3Nodes = closestDistance <= 3;
      if (isWithin3Nodes && !monolith.isAggro) {
        newlyAggroed = true;
      }

      return {
        ...monolith,
        isAggro: isWithin3Nodes,
        targetPlayerId: isWithin3Nodes && closestPlayer ? (closestPlayer as Player).id : null,
        distanceToTarget: closestDistance,
      };
    });

    setMonoliths(updated);

    if (newlyAggroed) {
      sound.playHazardWarning();
      setCallbackLogs(prev => [
        {
          id: `agro_${Date.now()}`,
          text: `⚠️ PROXIMITY ALERT: Chaser Monolith entered AGGRO state (within 3 nodes of a player)!`,
          type: 'agro',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 20)
      ]);
    }
  }, [participants, graph.nodes]);

  // Highlighting strictly for the currently active participant
  const adjacentMoveNodeIds = useMemo(() => {
    if (!currentNode) return [];
    return currentNode.nextNodes;
  }, [currentNode]);

  const stats = useMemo(() => {
    let roomCount = 0;
    let dotCount = 0;

    allNodes.forEach(node => {
      if (node.roomType === 'RestSpot') dotCount++;
      else roomCount++;
    });

    const aggroCount = monoliths.filter(m => m.isAggro).length;

    return {
      totalNodes: allNodes.length,
      totalEdges: uniqueCorridors.length,
      roomCount,
      dotCount,
      monolithsTotal: monoliths.length,
      monolithsAggro: aggroCount,
      densityPercent: (graph.density * 100).toFixed(1),
    };
  }, [allNodes, graph.density, uniqueCorridors.length, monoliths]);

  // GLOBAL BROADCAST SYSTEM & EVENT HOOK DISPATCHER
  // When an action happens (ON_MOVE, ON_REST, ON_TURN_END, ON_ROUND_END),
  // a global broadcast asks: "Is anyone going to step in / hook this event?"
  const broadcastGameEvent = useCallback((
    ctx: BroadcastContext
  ): { intercepted: boolean; modifiedContext: BroadcastContext; hookItem?: GearItem } => {
    const participant = participants.find(p => p.id === ctx.participantId);
    let intercepted = false;
    const modifiedContext = { ...ctx };
    let hookItem: GearItem | undefined = undefined;

    // Check equipped gear on participant
    if (participant?.gear && participant.gear.length > 0) {
      for (const item of participant.gear) {
        if (item.hook.listenTo === ctx.type) {
          intercepted = true;
          hookItem = item;

          const overrideVal = item.hook.overrideEndsTurnImmediately !== undefined 
            ? item.hook.overrideEndsTurnImmediately 
            : item.hook.overrideEndsRoundImmediately;

          if (overrideVal !== undefined) {
            modifiedContext.endsTurnImmediately = overrideVal;
            modifiedContext.endsRoundImmediately = overrideVal;
          }
          if (item.hook.bonusAP) {
            modifiedContext.apReward = (modifiedContext.apReward ?? 0) + item.hook.bonusAP;
          }

          // Log hook intercept event
          setCallbackLogs(prev => [
            {
              id: `gear_hook_${Date.now()}_${Math.random()}`,
              text: `⚡ [Event Hook Intercept]: '${item.name}' responded to broadcast '${ctx.type}'! Overwrote behavior: endsTurnImmediately = ${modifiedContext.endsTurnImmediately}.`,
              type: 'hook',
              time: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 25),
          ]);
        }
      }
    }

    if (!intercepted) {
      setCallbackLogs(prev => [
        {
          id: `broadcast_${Date.now()}_${Math.random()}`,
          text: `📡 [Global Broadcast '${ctx.type}']: Querying event hooks for ${ctx.participantName}... (No hooks stepped in; executing default).`,
          type: 'turn',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 25)
      ]);
    }

    return { intercepted, modifiedContext, hookItem };
  }, [participants]);

  // Lifecycle Callback: onTurnEnd Trigger (Individual Participant Turn)
  const onTurnEnd = useCallback((event: TurnEndEvent) => {
    setCallbackLogs(prev => [
      {
        id: `turn_${Date.now()}_${Math.random()}`,
        text: `Trigger [onTurnEnd]: ${event.participantName} finished turn #${event.turnNumber} (Round #${event.roundNumber}). Rest: ${event.restTaken ? 'YES (+2 AP)' : 'NO'}. Remaining AP: ${event.actionPointsRemaining}.`,
        type: 'turn',
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 25)
    ]);
  }, []);

  // Lifecycle Callback: onRoundEnd Trigger (Full Table Cycle)
  const onRoundEnd = useCallback((event: RoundEndEvent) => {
    setCallbackLogs(prev => [
      {
        id: `round_${Date.now()}_${Math.random()}`,
        text: `🏆 Trigger [onRoundEnd]: Round #${event.roundNumber} concluded across all ${event.totalParticipants} participants!`,
        type: 'round',
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 25)
    ]);
  }, []);

  // Advance participant's Individual Turn / Manage Full Table Rounds
  const advanceParticipantTurn = (updatedParticipant: Player, restTaken: boolean) => {
    // Reset turn-specific flags
    setHasRestedThisTurn(false);

    // Fire onTurnEnd trigger
    onTurnEnd({
      participantId: updatedParticipant.id,
      participantName: updatedParticipant.name,
      actionPointsRemaining: updatedParticipant.actionPoints,
      restTaken,
      turnNumber: turnIndex,
      roundNumber: roundNumber,
      timestamp: Date.now(),
    });

    setTurnIndex(prev => prev + 1);

    const nextIndex = (activeParticipantIndex + 1) % participants.length;
    
    // Check if full Round completed (all participants have taken their turn)
    if (nextIndex === 0) {
      const nextRound = roundNumber + 1;
      setRoundNumber(nextRound);
      
      // Fire onRoundEnd trigger
      onRoundEnd({
        roundNumber: roundNumber,
        totalParticipants: participants.length,
        activePlayers: participants,
        chasers: monoliths,
        timestamp: Date.now(),
      });
    }

    setActiveParticipantIndex(nextIndex);
  };

  // BASIC NPC AI BEHAVIOR LOOP:
  // When it is an NPC's turn, the AI automatically executes and concludes their turn
  useEffect(() => {
    if (activeParticipant.isNPC && !isNpcProcessing) {
      setIsNpcProcessing(true);
      setCallbackLogs(prev => [
        {
          id: `npc_start_${Date.now()}`,
          text: `🤖 [NPC AI]: ${activeParticipant.name} (NPC) turn started. Executing automated turn...`,
          type: 'turn',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 25)
      ]);

      const timer = setTimeout(() => {
        sound.playCompassClick();
        setCallbackLogs(prev => [
          {
            id: `npc_end_${Date.now()}`,
            text: `🤖 [NPC AI]: ${activeParticipant.name} (NPC) completed turn routine and ended turn.`,
            type: 'turn',
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 25)
        ]);
        setIsNpcProcessing(false);
        advanceParticipantTurn(activeParticipant, false);
      }, 950);

      return () => clearTimeout(timer);
    }
  }, [activeParticipantIndex, activeParticipant.isNPC, participants]);

  const handleRegenerate = () => {
    sound.playRollRattle();
    setSeed(prev => prev + 1);
  };

  // Player Move: Costs 1 AP - only active participant in queue can move
  const handlePlayerMove = (targetNodeId: string) => {
    if (isNpcProcessing || activeParticipant.isNPC) return;
    if (activeParticipant.actionPoints <= 0) {
      sound.playHazardWarning();
      return;
    }

    // Broadcast ON_MOVE event
    broadcastGameEvent({
      type: 'ON_MOVE',
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      targetNodeId,
      currentAP: activeParticipant.actionPoints,
    });

    sound.playCompassClick();
    const updatedAP = activeParticipant.actionPoints - 1;

    setParticipants(prev =>
      prev.map((p, idx) => {
        if (idx === activeParticipantIndex) {
          return {
            ...p,
            actionPoints: updatedAP,
            currentNodeId: targetNodeId,
            totalRolls: p.totalRolls + 1,
            hasReachedApex: p.hasReachedApex || targetNodeId === graph.apexNodeId,
          };
        }
        return p;
      })
    );

    setSelectedNodeId(targetNodeId);
    setVisitedNodeIds(prev => new Set([...prev, targetNodeId]));

    if (targetNodeId === graph.apexNodeId) {
      sound.playSeReleaseFanfare();
    }
  };

  // REST ACTION WITH GEAR EVENT HOOK OVERWRITE:
  // 1. Participant can only rest ONE time per turn.
  // 2. Broadcasts ON_REST asking "is anyone going to step in?".
  // 3. If gear with hook (e.g. Resonating Chrono-Harness) steps in, it overwrites
  //    endsTurnImmediately = false, allowing +2 AP without ending the turn!
  const handleRest = () => {
    if (isNpcProcessing || activeParticipant.isNPC) return;
    if (hasRestedThisTurn) {
      sound.playHazardWarning();
      setCallbackLogs(prev => [
        {
          id: `warn_${Date.now()}`,
          text: `⚠️ REST LIMIT: ${activeParticipant.name} has already rested this turn! (Limit: 1 rest per turn)`,
          type: 'turn',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 25)
      ]);
      return;
    }

    sound.playTaskSuccess();
    setHasRestedThisTurn(true);

    const newAP = activeParticipant.actionPoints + 2;
    const updatedParticipant = {
      ...activeParticipant,
      actionPoints: newAP,
    };

    setParticipants(prev =>
      prev.map((p, idx) => (idx === activeParticipantIndex ? updatedParticipant : p))
    );

    // Send global broadcast for ON_REST
    const broadcastResult = broadcastGameEvent({
      type: 'ON_REST',
      participantId: activeParticipant.id,
      participantName: activeParticipant.name,
      currentAP: newAP,
      endsTurnImmediately: true, // default without gear
    });

    const shouldEndTurn = broadcastResult.modifiedContext.endsTurnImmediately ?? broadcastResult.modifiedContext.endsRoundImmediately ?? true;

    if (shouldEndTurn) {
      // Standard rest: immediately concludes the turn
      advanceParticipantTurn(updatedParticipant, true);
    } else {
      // Gear Hook Intercept: Rest granted +2 AP and turn is NOT ended!
      sound.playTaskSuccess();
      setCallbackLogs(prev => [
        {
          id: `hook_proc_${Date.now()}`,
          text: `✨ [Gear Proc]: '${broadcastResult.hookItem?.name || 'Gear'}' active! Rest granted +2 AP. Turn remains active for ${activeParticipant.name}.`,
          type: 'hook',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 25)
      ]);
    }
  };

  // END TURN ACTION: Conclude turn after spending AP without resting
  const handleEndTurn = () => {
    if (isNpcProcessing || activeParticipant.isNPC) return;
    sound.playCompassClick();
    advanceParticipantTurn(activeParticipant, false);
  };

  // Toggle Gear on the active participant
  const handleToggleChronoGear = (targetPlayerId?: string) => {
    const targetId = targetPlayerId || activeParticipant.id;
    sound.playCompassClick();

    setParticipants(prev =>
      prev.map(p => {
        if (p.id === targetId) {
          const hasGear = p.gear?.some(g => g.id === CHRONO_REST_HARNESS.id);
          const newGear = hasGear
            ? (p.gear || []).filter(g => g.id !== CHRONO_REST_HARNESS.id)
            : [...(p.gear || []), CHRONO_REST_HARNESS];

          setCallbackLogs(prevLogs => [
            {
              id: `gear_toggle_${Date.now()}`,
              text: hasGear
                ? `🎒 [Gear Unequipped]: '${CHRONO_REST_HARNESS.name}' removed from ${p.name}.`
                : `⚔️ [Gear Equipped]: '${CHRONO_REST_HARNESS.name}' equipped on ${p.name}! Event hook listening for ON_REST.`,
              type: 'hook',
              time: new Date().toLocaleTimeString(),
            },
            ...prevLogs.slice(0, 25)
          ]);

          return {
            ...p,
            gear: newGear,
          };
        }
        return p;
      })
    );
  };

  const handleResetExploration = () => {
    sound.playCompassClick();
    setHasRestedThisTurn(false);
    setIsNpcProcessing(false);
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        currentNodeId: graph.startNodeId,
        actionPoints: 3,
      }))
    );
    setVisitedNodeIds(new Set([graph.startNodeId]));
    setSelectedNodeId(graph.startNodeId);
    setActiveParticipantIndex(0);
  };

  // Grace Handlers
  const handleInvokeGrace = () => {
    if (isNpcProcessing || activeParticipant.isNPC || activeParticipant.graceTokens <= 0) return;
    sound.playCompassClick();
    const challenge = getRandomGraceChallenge();
    setActiveGraceChallenge(challenge);
  };

  const handleConfirmGraceSubmit = (challenge: GraceChallenge) => {
    sound.playTaskSuccess();
    setParticipants(prev =>
      prev.map((p, idx) => {
        if (idx === activeParticipantIndex) {
          return {
            ...p,
            graceTokens: Math.max(0, p.graceTokens - 1),
            graceSubmittedCount: p.graceSubmittedCount + 1,
            actionPoints: p.actionPoints + challenge.apReward,
          };
        }
        return p;
      })
    );
    setActiveGraceChallenge(null);
  };

  const handleForfeitGrace = () => {
    sound.playHazardWarning();
    setParticipants(prev =>
      prev.map((p, idx) => {
        if (idx === activeParticipantIndex) {
          return {
            ...p,
            graceTokens: Math.max(0, p.graceTokens - 1),
            graceForfeitedCount: p.graceForfeitedCount + 1,
          };
        }
        return p;
      })
    );
    setActiveGraceChallenge(null);
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

  const selectedNode = selectedNodeId ? graph.nodes[selectedNodeId] : currentNode;
  const activeHasChronoGear = activeParticipant.gear?.some(g => g.id === CHRONO_REST_HARNESS.id) ?? false;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-mono select-none">
      {/* Top Navigation Bar */}
      <header className="h-11 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-600/70 flex items-center justify-center text-emerald-400 shadow">
            <Split className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              MAP LAB <span className="text-emerald-500">·</span> ROUND #{roundNumber}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
              Turn #{turnIndex}: <strong className="text-amber-300">{activeParticipant.name}</strong> {activeParticipant.isNPC && '(NPC AI)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AP & Gear Hook Status in Top Bar */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
              activeParticipant.actionPoints > 0 
                ? 'bg-amber-950 text-amber-300 border border-amber-600/80' 
                : 'bg-rose-950 text-rose-300 border border-rose-700/80 animate-pulse'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{activeParticipant.actionPoints} AP</span>
            </span>

            {/* Gear Hook Status Indicator */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
              activeHasChronoGear
                ? 'bg-purple-950 text-purple-300 border border-purple-600/90 shadow'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`} title="Resonating Chrono-Harness Hook Status">
              <Wrench className="w-3.5 h-3.5 text-purple-400" />
              <span>{activeHasChronoGear ? 'Hook: Non-Stop Rest' : 'No Gear'}</span>
            </span>

            {/* Monolith Aggro Status Badge */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
              stats.monolithsAggro > 0
                ? 'bg-rose-950 text-rose-300 border border-rose-600/90 animate-pulse'
                : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}>
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              <span>{stats.monolithsAggro > 0 ? `${stats.monolithsAggro} AGGRO` : 'Monoliths: Idle'}</span>
            </span>
          </div>

          <button
            onClick={() => setShowCallbacksLog(!showCallbacksLog)}
            className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
              showCallbacksLog
                ? 'border-emerald-600 bg-emerald-950/80 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Lifecycle & Gear Event Hooks Log"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Event Log</span>
          </button>

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

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Side: Parameters, Turn Flow & Gear Items */}
        <aside className="w-full lg:w-80 bg-slate-900/95 border-r border-slate-800 p-3 overflow-y-auto space-y-2.5 shrink-0 text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider">Turn &amp; Rest Actions</span>
            </div>
            <button
              onClick={handleResetExploration}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              title="Reset all participants to starting room"
            >
              <Footprints className="w-3 h-3" />
              <span>Reset Pos</span>
            </button>
          </div>

          {/* Active Participant Banner */}
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shadow"
                  style={{ borderColor: activeParticipant.color, color: activeParticipant.color }}
                >
                  {activeParticipant.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-slate-200 text-xs block">
                    {activeParticipant.name} {activeParticipant.isNPC && '(NPC AI)'}
                  </span>
                  <span className={`text-[9px] font-semibold flex items-center gap-1 ${isNpcProcessing ? 'text-sky-400 animate-pulse' : 'text-emerald-400'}`}>
                    {isNpcProcessing ? (
                      <>
                        <Bot className="w-3 h-3" />
                        <span>AI AUTO-ACTING...</span>
                      </>
                    ) : (
                      <span>CURRENT PARTICIPANT TURN</span>
                    )}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-900/60 font-bold">
                ⚡ {activeParticipant.actionPoints} AP
              </span>
            </div>

            {/* Core Rest & Turn Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {/* REST BUTTON (+2 AP) */}
              <button
                onClick={handleRest}
                disabled={hasRestedThisTurn || isNpcProcessing || activeParticipant.isNPC}
                className={`w-full py-2.5 px-2 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 transition-all shadow-md ${
                  hasRestedThisTurn || isNpcProcessing || activeParticipant.isNPC
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-400 active:scale-95 cursor-pointer ring-1 ring-emerald-400/30'
                }`}
                title={
                  hasRestedThisTurn
                    ? 'Already rested this turn (Limit: 1 rest per turn)'
                    : activeHasChronoGear
                    ? 'Rest (+2 AP): Chrono-Harness Hook Active! Will NOT end turn.'
                    : 'Rest (+2 AP): Default behavior ends turn immediately.'
                }
              >
                <div className="flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="tracking-wide">
                    {hasRestedThisTurn ? 'RESTED' : 'REST (+2 AP)'}
                  </span>
                </div>
                <span className="text-[9px] text-emerald-200 font-normal">
                  {hasRestedThisTurn
                    ? '1/turn limit'
                    : activeHasChronoGear
                    ? '⚡ Hook: Keeps turn!'
                    : 'Pass turn & recover'}
                </span>
              </button>

              {/* END TURN BUTTON */}
              <button
                onClick={handleEndTurn}
                disabled={isNpcProcessing || activeParticipant.isNPC}
                className={`w-full py-2.5 px-2 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isNpcProcessing || activeParticipant.isNPC
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                }`}
                title="End Turn: Conclude this participant's turn without resting"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>END TURN</span>
                </div>
                <span className="text-[9px] text-slate-400 font-normal">Pass to next in queue</span>
              </button>
            </div>

            {/* Invoke Grace & Queue Controls */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={handleInvokeGrace}
                disabled={isNpcProcessing || activeParticipant.isNPC || activeParticipant.graceTokens <= 0}
                className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10px] border flex items-center justify-center gap-1 transition-all ${
                  activeParticipant.graceTokens > 0 && !isNpcProcessing && !activeParticipant.isNPC
                    ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-600/70 text-amber-200 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Invoke Grace: Complete submission task for +AP"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Grace (x{activeParticipant.graceTokens})</span>
              </button>

              {/* Force Advance Turn Queue */}
              <button
                onClick={() => {
                  setHasRestedThisTurn(false);
                  setIsNpcProcessing(false);
                  setActiveParticipantIndex((activeParticipantIndex + 1) % participants.length);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                title="Force shift turn in global queue"
              >
                <Users className="w-3 h-3 text-sky-400" />
                <span>Skip Turn</span>
              </button>
            </div>
          </div>

          {/* ITEM SYSTEM & EVENT HOOK TRAIT INSPECTOR */}
          <div className="p-2.5 bg-slate-950 border border-purple-900/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Wrench className="w-3.5 h-3.5 text-purple-400" />
                <span className="uppercase tracking-wider">Gear &amp; Event Hook Trait</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                {CHRONO_REST_HARNESS.rarity}
              </span>
            </div>

            {/* Gear Card */}
            <div className="p-2 bg-slate-900/90 border border-purple-700/50 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-300">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 text-[11px] block leading-tight">
                      {CHRONO_REST_HARNESS.name}
                    </span>
                    <span className="text-[9px] text-purple-400">
                      Slot: {CHRONO_REST_HARNESS.slot}
                    </span>
                  </div>
                </div>

                {/* Equip / Unequip Toggle */}
                <button
                  onClick={() => handleToggleChronoGear()}
                  className={`px-2.5 py-1 rounded font-bold text-[10px] border transition-all cursor-pointer shadow ${
                    activeHasChronoGear
                      ? 'bg-purple-900 hover:bg-purple-800 text-purple-100 border-purple-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                  title="Equip or unequip this gear on the active player"
                >
                  {activeHasChronoGear ? 'EQUIPPED ✓' : '+ EQUIP'}
                </button>
              </div>

              <p className="text-[10px] text-slate-300 leading-relaxed italic bg-slate-950/60 p-1.5 rounded border border-slate-800">
                &quot;{CHRONO_REST_HARNESS.flavorText}&quot;
              </p>

              {/* JSON Hook Definition */}
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className="font-bold text-purple-300">Hook Listener Definition (JSON):</span>
                  <span className={`px-1 rounded ${activeHasChronoGear ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500'}`}>
                    {activeHasChronoGear ? '● LISTENING' : '○ INACTIVE'}
                  </span>
                </div>
                <pre className="text-[9px] p-1.5 bg-slate-950 rounded text-purple-300/90 font-mono overflow-x-auto border border-slate-900">
{JSON.stringify(CHRONO_REST_HARNESS.hook, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Chaser Monoliths Telemetry */}
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="uppercase tracking-wider">Chaser Monoliths</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                Aggro Zone: &le; 3 Nodes
              </span>
            </div>

            <div className="space-y-1.5">
              {monoliths.map(m => {
                const targetPlayer = participants.find(p => p.id === m.targetPlayerId);
                return (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg border text-[10px] transition-all ${
                      m.isAggro
                        ? 'bg-rose-950/70 border-rose-600/80 text-rose-200 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${m.isAggro ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                        {m.name}
                      </span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                        m.isAggro ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.isAggro ? 'AGGRO' : 'IDLE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span>Location: <strong className="text-slate-200">{m.currentNodeId.replace('node_', 'N_')}</strong></span>
                      <span>
                        {m.isAggro ? (
                          <span className="text-rose-300 font-bold">
                            Chasing {targetPlayer?.name} ({m.distanceToTarget} nodes away)
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Dist: {m.distanceToTarget} nodes (Safe &gt;3)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center / Right: Global Turn Queue, Map Canvas & Prototype HUD */}
        <main className="flex-1 flex flex-col p-2 overflow-hidden gap-1.5 min-h-0">
          {/* 1. GLOBAL TURN QUEUE BAR (Round # tracking full table cycle) */}
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs shrink-0 shadow">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Turn Queue (Round #{roundNumber}):</span>
              </span>
            </div>

            {/* Queue Participant Sequence */}
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-1">
              {participants.map((p, idx) => {
                const isCurrent = idx === activeParticipantIndex;
                const hasGear = p.gear?.some(g => g.id === CHRONO_REST_HARNESS.id);
                return (
                  <React.Fragment key={p.id}>
                    {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-mono shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 opacity-75'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold"
                        style={{ borderColor: p.color, color: p.color }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{p.name}</span>
                        {p.isNPC && <span className="text-[9px] text-sky-400 font-bold">(NPC AI)</span>}
                      </div>

                      {/* Status Badges */}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold">
                        ⚡ {p.actionPoints} AP
                      </span>

                      {hasGear && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-700 text-purple-300 font-bold" title="Resonating Chrono-Harness Hook Active">
                          ⚡ Hook
                        </span>
                      )}

                      {isCurrent ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold animate-pulse flex items-center gap-1">
                          {p.isNPC && <Bot className="w-2.5 h-2.5" />}
                          <span>{p.isNPC ? 'AI ACTING' : 'ACTING NOW'}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-600 font-semibold">
                          Turn #{idx + 1}
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 hidden xl:inline shrink-0">
              Only the active participant can move or take actions
            </div>
          </div>

          {/* 2. Position HUD - Strictly for the currently active participant */}
          <div className="h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                <Footprints className="w-3.5 h-3.5" /> {activeParticipant.name}&apos;s Turn:
              </span>
              <span className="text-slate-200 font-semibold truncate">
                {currentNode.title}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                ({currentNode.roomType === 'RestSpot' ? 'Waypoint Dot' : 'Octagon Room'})
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 ${
                  activeParticipant.actionPoints > 0 
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/80' 
                    : 'bg-rose-950 text-rose-300 border border-rose-700/80 animate-pulse'
                }`}>
                  <Zap className="w-3 h-3 fill-current" />
                  <span>{activeParticipant.actionPoints} AP</span>
                </span>
              </div>

              <span className="text-slate-600">|</span>

              <span className="text-emerald-400 font-bold text-[10px]">
                {adjacentMoveNodeIds.length} Valid Moves for {activeParticipant.name} (Cost: 1 AP)
              </span>
            </div>
          </div>

          {/* 3. SVG Map Canvas - Map Highlighting strictly reflects active participant */}
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
                <filter id="monolithGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Pathways: Standard + Active Player Navigable Highlights */}
              {uniqueCorridors.map(({ from, to, id }) => {
                const isActivePath =
                  (from.id === activeParticipant.currentNodeId && adjacentMoveNodeIds.includes(to.id)) ||
                  (to.id === activeParticipant.currentNodeId && adjacentMoveNodeIds.includes(from.id));

                return (
                  <line
                    key={`corridor-${id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isActivePath ? '#f59e0b' : '#e2e8f0'}
                    strokeWidth={isActivePath ? '3.5' : '2.5'}
                    strokeLinecap="round"
                    opacity={isActivePath ? '1.0' : '0.88'}
                  />
                );
              })}

              {/* Monolith Aggro Tether Lines to Target */}
              {monoliths.map(m => {
                if (!m.isAggro || !m.targetPlayerId) return null;
                const mNode = graph.nodes[m.currentNodeId];
                const targetP = participants.find(p => p.id === m.targetPlayerId);
                const pNode = targetP ? graph.nodes[targetP.currentNodeId] : null;
                if (!mNode || !pNode) return null;

                return (
                  <g key={`tether-${m.id}`}>
                    <line
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
                  </g>
                );
              })}

              {/* All Nodes: Octagonal Rooms & Waypoint Transit Dots */}
              {allNodes.map(node => {
                const isCurrentActiveNode = node.id === activeParticipant.currentNodeId;
                // Highlighting strictly for the currently active participant
                const isAdjacentMove = adjacentMoveNodeIds.includes(node.id);
                const isVisited = visitedNodeIds.has(node.id);
                const isApex = node.type === 'APEX';
                const isRestSpot = node.roomType === 'RestSpot';

                // Multiple players on this node
                const playersHere = participants.filter(p => p.currentNodeId === node.id);
                // Monoliths on this node
                const monolithsHere = monoliths.filter(m => m.currentNodeId === node.id);

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
                          r={isCurrentActiveNode ? dotRadius + 3 : isAdjacentMove ? dotRadius + 2 : dotRadius}
                          fill={
                            isCurrentActiveNode
                              ? '#064e3b'
                              : isAdjacentMove
                              ? '#1e293b'
                              : isVisited
                              ? '#1e293b'
                              : '#090d16'
                          }
                          stroke={
                            isCurrentActiveNode
                              ? '#34d399'
                              : isAdjacentMove
                              ? '#f59e0b'
                              : node.type === 'SANCTUARY'
                              ? '#38bdf8'
                              : node.type === 'ITEM_RELIC'
                              ? '#eab308'
                              : '#64748b'
                          }
                          strokeWidth={isCurrentActiveNode ? '3' : isAdjacentMove ? '2.5' : '1.5'}
                          className="transition-colors duration-150 hover:brightness-125"
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={4}
                          fill={
                            isCurrentActiveNode
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
                      /* Octagonal Room */
                      <g>
                        <polygon
                          points={getOctagonPoints(node.x, node.y, halfRoom)}
                          fill={
                            isCurrentActiveNode
                              ? '#78350f'
                              : isAdjacentMove
                              ? '#451a03'
                              : isVisited
                              ? '#1e293b'
                              : '#0f172a'
                          }
                          stroke={
                            isCurrentActiveNode
                              ? '#fbbf24'
                              : isAdjacentMove
                              ? '#f59e0b'
                              : isApex
                              ? '#f59e0b'
                              : node.type === 'RUINED_HAZARD'
                              ? '#f43f5e'
                              : '#64748b'
                          }
                          strokeWidth={isCurrentActiveNode ? '3.5' : isAdjacentMove ? '3' : '2'}
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

                    {/* MULTIPLE OCCUPANTS (Multiple Players & NPCs in the same room!) */}
                    {playersHere.length > 0 && (
                      <g transform={`translate(${node.x}, ${node.y - (isRestSpot ? dotRadius + 14 : halfRoom + 14)})`}>
                        {playersHere.map((p, pIdx) => {
                          const xOffset = (pIdx - (playersHere.length - 1) / 2) * 18;
                          const isActing = p.id === activeParticipant.id;
                          return (
                            <g key={p.id} transform={`translate(${xOffset}, 0)`}>
                              <circle
                                r={isActing ? 9 : 7.5}
                                fill="#0f172a"
                                stroke={p.color}
                                strokeWidth={isActing ? 2.5 : 1.5}
                                className={isActing ? 'animate-pulse' : ''}
                              />
                              <text
                                y="3"
                                textAnchor="middle"
                                className="text-[8px] font-mono font-bold fill-white pointer-events-none"
                              >
                                {p.name.charAt(0)}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* CHASER MONOLITHS OCCUPYING THIS NODE */}
                    {monolithsHere.map((m, mIdx) => {
                      const mOffset = (mIdx - (monolithsHere.length - 1) / 2) * 20;
                      return (
                        <g 
                          key={m.id} 
                          transform={`translate(${node.x + mOffset}, ${node.y + (isRestSpot ? dotRadius + 14 : halfRoom + 14)})`}
                          filter={m.isAggro ? 'url(#monolithGlow)' : undefined}
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
                          <text
                            y="14"
                            textAnchor="middle"
                            className={`text-[7px] font-mono font-black select-none pointer-events-none ${
                              m.isAggro ? 'fill-rose-400 font-bold' : 'fill-slate-500'
                            }`}
                          >
                            {m.isAggro ? 'AGGRO' : 'MONOLITH'}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 4. Bottom Inspector & Move / Rest Bar */}
          {selectedNode && (
            <div className="h-12 px-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-bold text-amber-400 text-xs truncate">
                  {selectedNode.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {selectedNode.roomType === 'RestSpot' ? 'Waypoint Dot (Quick)' : 'Octagon Room (Scripted)'}
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                  {selectedNode.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedNode.id === activeParticipant.currentNodeId ? (
                  <button
                    onClick={handleRest}
                    disabled={hasRestedThisTurn || isNpcProcessing || activeParticipant.isNPC}
                    className={`px-3 py-1 font-bold rounded text-[11px] flex items-center gap-1 shadow transition-colors ${
                      hasRestedThisTurn || isNpcProcessing || activeParticipant.isNPC
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                    title={
                      hasRestedThisTurn
                        ? 'Already rested this turn (Limit: 1 rest per turn)'
                        : activeHasChronoGear
                        ? 'Rest on current node (+2 AP) - Chrono-Harness Hook Active (Keeps turn active)'
                        : 'Rest on current node (+2 AP)'
                    }
                  >
                    <Coffee className="w-3.5 h-3.5 text-emerald-200" />
                    <span>
                      {hasRestedThisTurn
                        ? 'Rested (1/turn)'
                        : activeHasChronoGear
                        ? 'Rest (+2 AP & Keep Turn)'
                        : 'Rest (+2 AP)'}
                    </span>
                  </button>
                ) : adjacentMoveNodeIds.includes(selectedNode.id) ? (
                  <button
                    onClick={() => handlePlayerMove(selectedNode.id)}
                    disabled={isNpcProcessing || activeParticipant.isNPC || activeParticipant.actionPoints <= 0}
                    className={`px-3 py-1 font-bold rounded text-[11px] flex items-center gap-1 transition-colors ${
                      !isNpcProcessing && !activeParticipant.isNPC && activeParticipant.actionPoints > 0
                        ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>
                      {isNpcProcessing
                        ? 'AI Acting...'
                        : activeParticipant.actionPoints > 0
                        ? `Move ${activeParticipant.name} Here (1 AP)`
                        : '0 AP (Need Rest/Grace)'}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* 5. Live Event Hooks & Lifecycle Broadcast Log */}
          {showCallbacksLog && (
            <div className="h-28 bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-y-auto font-mono text-[10px] space-y-1 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400 font-bold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Terminal className="w-3 h-3" /> Global Event Broadcasts &amp; Gear Hook Trait Intercepts
                </span>
                <button
                  onClick={() => setCallbackLogs([])}
                  className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>

              <div className="space-y-0.5 pt-0.5">
                {callbackLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No events triggered yet. Take actions, Rest, or move to generate lifecycle events.</div>
                ) : (
                  callbackLogs.map(log => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 leading-relaxed ${
                        log.type === 'hook'
                          ? 'text-purple-300 font-bold'
                          : log.type === 'agro'
                          ? 'text-rose-400 font-semibold'
                          : log.type === 'round'
                          ? 'text-amber-300 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="text-slate-600 shrink-0 tabular-nums">[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Grace Challenge Modal Popup */}
          {activeGraceChallenge && (
            <GraceModal
              challenge={activeGraceChallenge}
              player={activeParticipant}
              onConfirmSubmit={handleConfirmGraceSubmit}
              onForfeit={handleForfeitGrace}
            />
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
