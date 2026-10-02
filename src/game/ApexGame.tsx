import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Player, 
  DMSettings, 
  GamePhase, 
  ActiveTask, 
  BoardNode,
  ChaserMonolith,
  RoundEndEvent,
  TurnEndEvent
} from '../lib/types/game';
import { generateBoardGraph, getShortestPath } from '../lib/map/graphGenerator';
import { 
  BASE_ACTIONS, 
  MODIFIER_MAP, 
  HUMILIATION_PHRASES, 
  AVAILABLE_RELICS 
} from '../lib/config/actionsConfig';
import { sound } from '../lib/audio/soundEngine';
import { Header } from './components/Header';
import { BoardGraph } from './components/BoardGraph';
import { CompassUI } from './components/CompassUI';
import { DiceRollUI } from './components/DiceRollUI';
import { PlayerCard } from './components/PlayerCard';
import { TaskModal } from './components/TaskModal';
import { DMSettingsModal } from './components/DMSettingsModal';
import { VictoryModal } from './components/VictoryModal';
import { SetupScreen } from './components/SetupScreen';
import { GraceModal } from './components/GraceModal';
import { GraceChallenge, getRandomGraceChallenge } from '../lib/config/gracePoolConfig';

export const ApexGame: React.FC = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [hasRestedThisRound, setHasRestedThisRound] = useState<boolean>(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('DIRECTION_SELECTION');
  const [isWifeyMode, setIsWifeyMode] = useState<boolean>(true);
  const [showDMSettings, setShowDMSettings] = useState<boolean>(false);

  // Board graph state
  const [boardData, setBoardData] = useState(() => generateBoardGraph());
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [activeGraceChallenge, setActiveGraceChallenge] = useState<GraceChallenge | null>(null);

  // Multiple Chaser Monoliths State
  const [monoliths, setMonoliths] = useState<ChaserMonolith[]>([]);

  // Victory State
  const [victoryPlayer, setVictoryPlayer] = useState<Player | null>(null);

  // Settings State
  const [settings, setSettings] = useState<DMSettings>({
    volatilityRange: 3,
    chaserSpeed: 1,
    chaserSpawnRound: 3,
    ruinedSeverity: 'PENALTY_DEDUCT',
    activeActionIds: BASE_ACTIONS.map(a => a.id),
    autoMetronomeSound: true,
    customPhrases: [],
  });

  const activePlayer = players[activePlayerIndex] || null;

  const currentNode = useMemo(() => {
    if (!activePlayer) return null;
    return boardData.nodes[activePlayer.currentNodeId] || null;
  }, [activePlayer, boardData.nodes]);

  const availableNextNodes = useMemo(() => {
    if (!currentNode) return [];
    return currentNode.nextNodes
      .map(id => boardData.nodes[id])
      .filter((n): n is BoardNode => Boolean(n));
  }, [currentNode, boardData.nodes]);

  useEffect(() => {
    if (availableNextNodes.length > 0) {
      if (!selectedTargetNodeId || !availableNextNodes.some(n => n.id === selectedTargetNodeId)) {
        setSelectedTargetNodeId(availableNextNodes[0].id);
      }
    } else {
      setSelectedTargetNodeId(null);
    }
  }, [availableNextNodes, selectedTargetNodeId]);

  // Spawn random Chaser Monoliths on game setup
  const spawnInitialMonoliths = (board: ReturnType<typeof generateBoardGraph>) => {
    const allNodesList = Object.values(board.nodes);
    const eligibleNodes = allNodesList.filter(
      n => n.id !== board.startNodeId && n.id !== board.apexNodeId
    );
    const shuffled = [...eligibleNodes].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(3, shuffled.length));

    return chosen.map((n, i) => ({
      id: `monolith_${i + 1}`,
      name: `Chaser Monolith ${['I', 'II', 'III'][i] || i + 1}`,
      currentNodeId: n.id,
      isAggro: false,
      targetPlayerId: null,
      distanceToTarget: 99,
    }));
  };

  const handleStartGame = (initialPlayers: Player[], initialSettings: DMSettings) => {
    const newBoard = generateBoardGraph(9);
    setBoardData(newBoard);

    const placedPlayers = initialPlayers.map(p => ({
      ...p,
      actionPoints: 3, // Start with 3 AP
      maxActionPoints: 3,
      graceTokens: p.graceTokens ?? 2,
      graceSubmittedCount: p.graceSubmittedCount ?? 0,
      graceForfeitedCount: p.graceForfeitedCount ?? 0,
      currentNodeId: newBoard.startNodeId,
    }));

    const initialMonoliths = spawnInitialMonoliths(newBoard);

    setPlayers(placedPlayers);
    setMonoliths(initialMonoliths);
    setSettings(initialSettings);
    setActivePlayerIndex(0);
    setRoundNumber(1);
    setTurnNumber(1);
    setGamePhase('DIRECTION_SELECTION');
    setHasStarted(true);
  };

  // Recalculate Monolith Aggro state (within 3 nodes)
  useEffect(() => {
    if (monoliths.length === 0 || players.length === 0) return;

    let newlyAggroed = false;
    const updated = monoliths.map(monolith => {
      let closestDistance = Infinity;
      let closestPlayer: Player | null = null;

      players.forEach(p => {
        if (!p.hasPressedSe) {
          const path = getShortestPath(boardData.nodes, monolith.currentNodeId, p.currentNodeId);
          const dist = path.length - 1;
          if (dist < closestDistance) {
            closestDistance = dist;
            closestPlayer = p;
          }
        }
      });

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
    }
  }, [players, boardData.nodes]);

  // Lifecycle callback hooks
  const onRoundEnd = useCallback((event: RoundEndEvent) => {
    // Round end callback hook for game systems / logs
  }, []);

  const onTurnEnd = useCallback((event: TurnEndEvent) => {
    // Turn end callback hook for game systems / logs
  }, []);

  const handleRollComplete = (rollValue: number) => {
    if (!activePlayer || !currentNode) return;

    const absDistance = Math.abs(rollValue);
    let targetNodeId = activePlayer.currentNodeId;

    if (absDistance > 0 && selectedTargetNodeId) {
      targetNodeId = selectedTargetNodeId;
      let stepsRemaining = absDistance - 1;

      while (stepsRemaining > 0) {
        const curr = boardData.nodes[targetNodeId];
        if (!curr || curr.nextNodes.length === 0) break;
        targetNodeId = curr.nextNodes[0];
        stepsRemaining--;
      }
    }

    const destNode = boardData.nodes[targetNodeId];
    if (!destNode) return;

    const reachedApex = destNode.type === 'APEX';

    // Deduct 1 AP for rolling & traversing
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          return {
            ...p,
            actionPoints: Math.max(0, p.actionPoints - 1),
            currentNodeId: destNode.id,
            totalRolls: p.totalRolls + 1,
            hasReachedApex: p.hasReachedApex || reachedApex,
          };
        }
        return p;
      })
    );

    if (destNode.type === 'HAZARD_SWAMP') {
      sound.playHazardWarning();
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            const hasLock = p.statusEffects.some(e => e.type === 'EDGE_LOCK');
            if (!hasLock) {
              return {
                ...p,
                statusEffects: [
                  ...p.statusEffects,
                  {
                    type: 'EDGE_LOCK',
                    name: 'Edge Lock',
                    description: 'Mire penalty: Must pass challenge before advancing.',
                    durationRounds: 2,
                  },
                ],
              };
            }
          }
          return p;
        })
      );
    } else if (destNode.type === 'SANCTUARY') {
      sound.playTaskSuccess();
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            return {
              ...p,
              statusEffects: [
                {
                  type: 'SERENE_FOCUS',
                  name: 'Serene Focus',
                  description: 'Immune to hazard tiles for 1 round.',
                  durationRounds: 1,
                },
              ],
            };
          }
          return p;
        })
      );
    } else if (destNode.type === 'ITEM_RELIC') {
      sound.playTaskSuccess();
      const randomRelic = AVAILABLE_RELICS[Math.floor(Math.random() * AVAILABLE_RELICS.length)];
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            return {
              ...p,
              relics: [...p.relics, randomRelic],
            };
          }
          return p;
        })
      );
    }

    const allowedActions = BASE_ACTIONS.filter(a => settings.activeActionIds.includes(a.id));
    const baseAction =
      destNode.baseActionId
        ? BASE_ACTIONS.find(a => a.id === destNode.baseActionId) || allowedActions[0]
        : allowedActions[Math.floor(Math.random() * allowedActions.length)];

    const modifier = MODIFIER_MAP[rollValue] || MODIFIER_MAP[0];

    let customHumiliationPhrase: string | undefined;
    if (baseAction.category === 'verbal') {
      const phrases = [...HUMILIATION_PHRASES, ...settings.customPhrases];
      customHumiliationPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    }

    const isRuined = destNode.type === 'RUINED_HAZARD';
    const isApex = destNode.type === 'APEX';

    const task: ActiveTask = {
      nodeId: destNode.id,
      baseAction,
      rollValue,
      modifier,
      customHumiliationPhrase,
      isRuinedCheck: isRuined,
      isApexGauntlet: isApex,
    };

    setActiveTask(task);
    setGamePhase('RESOLVING_TASK');
  };

  const handleUseGoldenCompass = (chosenRoll: number) => {
    if (!activePlayer) return;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          const idx = p.relics.findIndex(r => r.id === 'GOLDEN_COMPASS');
          if (idx !== -1) {
            const nextRelics = [...p.relics];
            nextRelics.splice(idx, 1);
            return { ...p, relics: nextRelics };
          }
        }
        return p;
      })
    );
    handleRollComplete(chosenRoll);
  };

  const handleUseIronWill = () => {
    if (!activePlayer) return;
    sound.playTaskSuccess();
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          const idx = p.relics.findIndex(r => r.id === 'IRON_WILL');
          if (idx !== -1) {
            const nextRelics = [...p.relics];
            nextRelics.splice(idx, 1);
            return { ...p, relics: nextRelics };
          }
        }
        return p;
      })
    );
    handleCompleteTask(true);
  };

  const handleCompleteTask = (success: boolean, wasRuined: boolean = false) => {
    if (!activePlayer || !activeTask) return;

    if (wasRuined) {
      sound.playHazardWarning();
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            let nextNodeId = p.currentNodeId;
            if (settings.ruinedSeverity === 'HARD_RESET') {
              nextNodeId = boardData.startNodeId;
            } else {
              let steps = 3;
              let curr = boardData.nodes[p.currentNodeId];
              while (steps > 0 && curr && curr.prevNodes.length > 0) {
                curr = boardData.nodes[curr.prevNodes[0]];
                steps--;
              }
              if (curr) nextNodeId = curr.id;
            }

            return {
              ...p,
              ruinedCount: p.ruinedCount + 1,
              penaltiesEndured: p.penaltiesEndured + 1,
              currentNodeId: nextNodeId,
              hasReachedApex: false,
              apexChallengePassed: false,
            };
          }
          return p;
        })
      );
    } else if (success) {
      sound.playTaskSuccess();
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            return {
              ...p,
              tasksCompleted: p.tasksCompleted + 1,
              apexChallengePassed: activeTask.isApexGauntlet ? true : p.apexChallengePassed,
            };
          }
          return p;
        })
      );
    }

    setActiveTask(null);

    // If player still has AP (> 0) let them choose their next action/move
    // Otherwise conclude their round
    if (activePlayer.actionPoints > 0 && !activePlayer.hasPressedSe) {
      setGamePhase('DIRECTION_SELECTION');
    } else {
      advanceRound(false);
    }
  };

  // Special condition stub: by default resting immediately ends the round.
  const checkSpecialRestCondition = (
    _player: Player
  ): { endsRoundImmediately: boolean; conditionName?: string } => {
    // STUB: Special conditions not yet active - default is immediate round end
    return { endsRoundImmediately: true };
  };

  // REST ACTION: Player skips actions for their round and gains +2 AP
  // Constraint: Player can only rest ONE time per round.
  // Resting immediately ends the round unless a special condition applies (stubbed).
  const handleRest = () => {
    if (!activePlayer || gamePhase === 'RESOLVING_TASK' || hasRestedThisRound) return;
    sound.playTaskSuccess();
    setHasRestedThisRound(true);

    const newAP = activePlayer.actionPoints + 2;
    const updatedPlayer = {
      ...activePlayer,
      actionPoints: newAP,
    };

    setPlayers(prev =>
      prev.map(p => (p.id === activePlayer.id ? updatedPlayer : p))
    );

    const specialCondition = checkSpecialRestCondition(updatedPlayer);
    if (specialCondition.endsRoundImmediately) {
      advanceRound(true);
    }
  };

  // Advance participant's individual turn
  const advanceRound = (restTaken: boolean) => {
    if (!activePlayer) return;

    // Reset turn-specific flags
    setHasRestedThisRound(false);

    onTurnEnd({
      participantId: activePlayer.id,
      participantName: activePlayer.name,
      actionPointsRemaining: activePlayer.actionPoints + (restTaken ? 2 : 0),
      restTaken,
      roundNumber,
      turnNumber,
      timestamp: Date.now(),
    });

    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextPlayerIndex);

    // If full cycle completed across all players -> advance Round!
    if (nextPlayerIndex === 0) {
      const nextRound = roundNumber + 1;
      setTurnNumber(turnNumber + 1);
      setRoundNumber(nextRound);

      onRoundEnd({
        roundNumber,
        totalParticipants: players.length,
        activePlayers: players,
        chasers: monoliths,
        timestamp: Date.now(),
      });
    }

    setGamePhase('DIRECTION_SELECTION');
  };

  const handleInvokeGrace = (playerId?: string) => {
    if (!activePlayer || activePlayer.graceTokens <= 0) return;
    sound.playCompassClick();
    const challenge = getRandomGraceChallenge();
    setActiveGraceChallenge(challenge);
  };

  const handleConfirmGraceSubmit = (challenge: GraceChallenge) => {
    if (!activePlayer) return;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
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
    setGamePhase('DIRECTION_SELECTION');
  };

  const handleForfeitGrace = () => {
    if (!activePlayer) return;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
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

  const handleEndTurn = () => {
    if (gamePhase === 'RESOLVING_TASK') return;
    sound.playCompassClick();
    advanceRound(false);
  };

  const handleTriggerSeButton = (playerId: string) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    const updated = {
      ...targetPlayer,
      hasPressedSe: true,
      finishedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setPlayers(prev => prev.map(p => (p.id === playerId ? updated : p)));
    setVictoryPlayer(updated);
  };

  const handleGrantApexPermission = (playerId: string) => {
    sound.playTaskSuccess();
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, apexChallengePassed: true, hasReachedApex: true } : p))
    );
  };

  const handleClearDebuffs = (playerId: string) => {
    sound.playTaskSuccess();
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, statusEffects: [] } : p))
    );
  };

  const handleManualSpawnChaser = () => {
    sound.playHazardWarning();
    const newMonoliths = spawnInitialMonoliths(boardData);
    setMonoliths(newMonoliths);
  };

  const allCompleted = players.length > 0 && players.every(p => p.hasPressedSe);

  if (!hasStarted) {
    return <SetupScreen onStartGame={handleStartGame} />;
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none font-mono">
      <Header
        currentRound={turnNumber}
        activePlayerName={activePlayer?.name || 'Player'}
        isWifeyMode={isWifeyMode}
        onToggleWifeyMode={() => {
          sound.playCompassClick();
          setIsWifeyMode(!isWifeyMode);
        }}
        onOpenDMSettings={() => setShowDMSettings(true)}
        onRestartGame={() => setHasStarted(false)}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-7xl w-full mx-auto flex flex-col gap-2 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 w-full">
          <BoardGraph
            nodes={boardData.nodes}
            players={players}
            activePlayerId={activePlayer?.id || ''}
            monoliths={monoliths}
            selectedTargetNodeId={selectedTargetNodeId}
            onNodeClick={nodeId => {
              if (availableNextNodes.some(n => n.id === nodeId)) {
                sound.playCompassClick();
                setSelectedTargetNodeId(nodeId);
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
          {currentNode && (
            <CompassUI
              currentNode={currentNode}
              availableNextNodes={availableNextNodes}
              selectedTargetNodeId={selectedTargetNodeId}
              onSelectTargetNode={setSelectedTargetNodeId}
              disabled={gamePhase === 'RESOLVING_TASK' || activePlayer?.hasPressedSe}
            />
          )}

          <DiceRollUI
            volatilityRange={settings.volatilityRange}
            onRollComplete={handleRollComplete}
            disabled={gamePhase === 'RESOLVING_TASK' || activePlayer?.hasPressedSe}
            relics={activePlayer?.relics || []}
            onUseGoldenCompass={handleUseGoldenCompass}
            actionPoints={activePlayer?.actionPoints ?? 0}
            maxActionPoints={activePlayer?.maxActionPoints ?? 3}
            graceTokens={activePlayer?.graceTokens ?? 0}
            onInvokeGrace={handleInvokeGrace}
            onEndTurn={handleEndTurn}
            onRest={handleRest}
            hasRestedThisRound={hasRestedThisRound}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          {players.map((p, idx) => (
            <PlayerCard
              key={p.id}
              player={p}
              isActive={idx === activePlayerIndex}
              onTriggerSeButton={handleTriggerSeButton}
              onInvokeGrace={handleInvokeGrace}
            />
          ))}
        </div>
      </main>

      {activeGraceChallenge && activePlayer && (
        <GraceModal
          challenge={activeGraceChallenge}
          player={activePlayer}
          onConfirmSubmit={handleConfirmGraceSubmit}
          onForfeit={handleForfeitGrace}
        />
      )}

      {activeTask && activePlayer && (
        <TaskModal
          task={activeTask}
          player={activePlayer}
          settings={settings}
          onCompleteTask={handleCompleteTask}
          onUseIronWill={handleUseIronWill}
        />
      )}

      {showDMSettings && (
        <DMSettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setShowDMSettings(false)}
          players={players}
          activePlayerId={activePlayer?.id || ''}
          onManualSpawnChaser={handleManualSpawnChaser}
          onGrantApexPermission={handleGrantApexPermission}
          onClearDebuffs={handleClearDebuffs}
        />
      )}

      {victoryPlayer && (
        <VictoryModal
          finishedPlayer={victoryPlayer}
          allPlayers={players}
          allCompleted={allCompleted}
          onContinueHotseat={() => setVictoryPlayer(null)}
          onRestartNewGame={() => setHasStarted(false)}
        />
      )}
    </div>
  );
};
