export type TileType = 
  | 'START'
  | 'STANDARD'
  | 'HAZARD_SWAMP'
  | 'SANCTUARY'
  | 'RUINED_HAZARD'
  | 'ITEM_RELIC'
  | 'APEX';

export type RoomType = 'OctagonRoom' | 'OctagonHub' | 'RestSpot' | 'SquareRoom';

export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface DirectionConnection {
  direction: CompassDirection;
  targetNodeId: string;
}

export interface BoardNode {
  id: string;
  tier: number; // Radial depth / distance from center
  indexInTier: number;
  x: number; // SVG pixel coordinate
  y: number; // SVG pixel coordinate
  gridX: number; // 2D integer spatial grid coordinate
  gridY: number; // 2D integer spatial grid coordinate
  roomType: RoomType; // 'OctagonHub' | 'SquareRoom' | 'RestSpot'
  type: TileType;
  title: string;
  description: string;
  baseActionId?: string;
  nextNodes: string[]; // Connected adjacent / exploration nodes
  prevNodes: string[]; // Connected parent / incoming nodes
  directionMap?: Partial<Record<CompassDirection, string>>; // direction to neighbor id
}

export type StatusEffectType = 
  | 'EDGE_LOCK'         // Cannot choose branching paths until cleared
  | 'HEAVY_DRAG'        // -1 movement distance
  | 'SERENE_FOCUS'      // Immune to next hazard
  | 'IRON_WILL'         // Nullifies next penalty
  | 'CHASER_DECOY';     // Chaser will ignore for 1 round

export interface StatusEffect {
  type: StatusEffectType;
  name: string;
  description: string;
  durationRounds: number;
}

export type RelicId = 
  | 'IRON_WILL'
  | 'GOLDEN_COMPASS'
  | 'CHASER_DECOY'
  | 'METRONOME';

export interface Relic {
  id: RelicId;
  name: string;
  description: string;
  icon: string;
}

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  color: string;
  currentNodeId: string;
  statusEffects: StatusEffect[];
  relics: Relic[];
  tasksCompleted: number;
  penaltiesEndured: number;
  ruinedCount: number;
  totalRolls: number;
  hasReachedApex: boolean;
  apexChallengePassed: boolean;
  hasPressedSe: boolean; // Triggered "色"
  finishedTime?: string;
}

export interface BaseAction {
  id: string;
  title: string;
  category: 'physical' | 'sensory' | 'discipline' | 'verbal';
  description: string;
  baseDurationSec?: number;
  baseReps?: number;
  intensity: 'Low' | 'Medium' | 'High';
  requiresTextInput?: boolean;
}

export interface ModifierEffect {
  rollValue: number;
  tierName: string;
  durationDeltaSec: number;
  repsMultiplier?: number;
  repsAdd?: number;
  intensityLabel: string;
  flavor: string;
  isBypassed?: boolean;
  bonusRoll?: number;
}

export interface ActiveTask {
  nodeId: string;
  baseAction: BaseAction;
  rollValue: number;
  modifier: ModifierEffect;
  calculatedDurationSec?: number;
  calculatedReps?: number;
  customHumiliationPhrase?: string;
  isChaserEncounter?: boolean;
  isRuinedCheck?: boolean;
  isApexGauntlet?: boolean;
}

export interface DMSettings {
  volatilityRange: 1 | 3 | 5; // e.g., 3 means -3 to +3
  chaserSpeed: number; // 0 (off), 1, 2, 3
  chaserSpawnRound: number; // default 3
  ruinedSeverity: 'PENALTY_DEDUCT' | 'HARD_RESET'; // Reset to start or back 3 tiles
  activeActionIds: string[];
  autoMetronomeSound: boolean;
  customPhrases: string[];
}

export type GamePhase = 
  | 'SETUP'
  | 'DIRECTION_SELECTION' // Choosing fork via compass
  | 'ROLLING'             // Rolling movement die
  | 'RESOLVING_TASK'      // Performing the task
  | 'CHASER_TURN'         // Chaser advancing
  | 'ROUND_END'           // Transitioning to next player/round
  | 'ALL_COMPLETED';      // All players pressed "色"
