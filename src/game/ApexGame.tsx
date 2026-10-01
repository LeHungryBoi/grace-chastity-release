import React, { useState, useEffect, useMemo } from 'react';
import { 
  Player, 
  DMSettings, 
  GamePhase, 
  ActiveTask, 
  BoardNode 
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

export const ApexGame: React.FC = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('DIRECTION_SELECTION');
  const [isWifeyMode, setIsWifeyMode] = useState<boolean>(true);
  const [showDMSettings, setShowDMSettings] = useState<boolean>(false);

  // Board graph state
  const [boardData, setBoardData] = useState(() => generateBoardGraph());
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);

  // Chaser State
  const [chaserNodeId, setChaserNodeId] = useState<string | null>(null);
  const [chaserSpawned, setChaserSpawned] = useState<boolean>(false);

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

  const handleStartGame = (initialPlayers: Player[], initialSettings: DMSettings) => {
    const newBoard = generateBoardGraph(9);
    setBoardData(newBoard);

    const placedPlayers = initialPlayers.map(p => ({
      ...p,
      currentNodeId: newBoard.startNodeId,
    }));

    setPlayers(placedPlayers);
    setSettings(initialSettings);
    setActivePlayerIndex(0);
    setRoundNumber(1);
    setChaserSpawned(false);
    setChaserNodeId(null);
    setGamePhase('DIRECTION_SELECTION');
    setHasStarted(true);
  };

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

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          return {
            ...p,
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
    advanceTurn();
  };

  const advanceTurn = () => {
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextPlayerIndex);

    if (nextPlayerIndex === 0) {
      const nextRound = roundNumber + 1;
      setRoundNumber(nextRound);
      runChaserCycle(nextRound);
    } else {
      setGamePhase('DIRECTION_SELECTION');
    }
  };

  const runChaserCycle = (round: number) => {
    let isSpawned = chaserSpawned;
    let chaserPos = chaserNodeId;

    if (round >= settings.chaserSpawnRound && !isSpawned) {
      isSpawned = true;
      chaserPos = boardData.startNodeId;
      setChaserSpawned(true);
      setChaserNodeId(chaserPos);
      sound.playHazardWarning();
    }

    if (isSpawned && chaserPos && settings.chaserSpeed > 0) {
      let closestPlayer: Player | null = null;
      let shortestDistance = Infinity;
      let bestPath: string[] = [];

      players.forEach(p => {
        if (!p.hasPressedSe) {
          const path = getShortestPath(boardData.nodes, chaserPos!, p.currentNodeId);
          if (path.length < shortestDistance) {
            shortestDistance = path.length;
            closestPlayer = p;
            bestPath = path;
          }
        }
      });

      if (bestPath.length > 1) {
        sound.playChaserAdvance();
        const stepsToTake = Math.min(settings.chaserSpeed, bestPath.length - 1);
        const newChaserPos = bestPath[stepsToTake];
        setChaserNodeId(newChaserPos);

        const caughtPlayers = players.filter(
          p => p.currentNodeId === newChaserPos && !p.hasPressedSe
        );

        if (caughtPlayers.length > 0) {
          sound.playHazardWarning();
          caughtPlayers.forEach(caught => {
            const hasDecoy = caught.relics.some(r => r.id === 'CHASER_DECOY');
            if (hasDecoy) {
              setPlayers(prev =>
                prev.map(p => {
                  if (p.id === caught.id) {
                    const idx = p.relics.findIndex(r => r.id === 'CHASER_DECOY');
                    const nextR = [...p.relics];
                    nextR.splice(idx, 1);
                    return { ...p, relics: nextR };
                  }
                  return p;
                })
              );
            } else {
              setPlayers(prev =>
                prev.map(p => {
                  if (p.id === caught.id) {
                    return {
                      ...p,
                      penaltiesEndured: p.penaltiesEndured + 1,
                      relics: [],
                    };
                  }
                  return p;
                })
              );
            }
          });
        }
      }
    }

    setGamePhase('DIRECTION_SELECTION');
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
    setChaserSpawned(true);
    setChaserNodeId(boardData.startNodeId);
  };

  const allCompleted = players.length > 0 && players.every(p => p.hasPressedSe);

  if (!hasStarted) {
    return <SetupScreen onStartGame={handleStartGame} />;
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none font-mono">
      <Header
        currentRound={roundNumber}
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
            chaserNodeId={chaserNodeId}
            chaserSpawned={chaserSpawned}
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
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          {players.map((p, idx) => (
            <PlayerCard
              key={p.id}
              player={p}
              isActive={idx === activePlayerIndex}
              onTriggerSeButton={handleTriggerSeButton}
            />
          ))}
        </div>
      </main>

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
