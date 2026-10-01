import { BaseAction, ModifierEffect, Relic } from '../types/game';

export const BASE_ACTIONS: BaseAction[] = [
  {
    id: 'stroking',
    title: 'Stroking & Edging Cadence',
    category: 'physical',
    description: 'Maintain controlled strokes at a strict cadence without crossing the threshold.',
    baseDurationSec: 30,
    baseReps: 30,
    intensity: 'Medium',
  },
  {
    id: 'nipple_play',
    title: 'Nipple Play & Clamps',
    category: 'sensory',
    description: 'Apply firm twisting, stimulation, or attach tension clamps to both nipples.',
    baseDurationSec: 25,
    baseReps: 1,
    intensity: 'Medium',
  },
  {
    id: 'ball_tapping',
    title: 'Ball Tapping Impact',
    category: 'physical',
    description: 'Controlled direct taps to test conditioning. Count aloud on each audible impact.',
    baseReps: 10,
    intensity: 'Medium',
  },
  {
    id: 'kneeling',
    title: 'Discipline Kneeling Posture',
    category: 'discipline',
    description: 'Hold an upright kneeling posture on hard surface, hands behind back, head bowed.',
    baseDurationSec: 30,
    intensity: 'Medium',
  },
  {
    id: 'slapping',
    title: 'Facial Discipline Slaps',
    category: 'sensory',
    description: 'Crisp slaps delivered alternately across left and right cheeks. Eyes open.',
    baseReps: 8,
    intensity: 'Medium',
  },
  {
    id: 'humiliation',
    title: 'Verbal Submission & Begging',
    category: 'verbal',
    description: 'Kneel and recite the designated submission phrase with full clarity and conviction.',
    requiresTextInput: false,
    intensity: 'Medium',
  },
  {
    id: 'cold_shock',
    title: 'Cryo / Ice Conditioning',
    category: 'sensory',
    description: 'Apply direct ice cube or cold compress to inner thighs and lower abdomen.',
    baseDurationSec: 20,
    intensity: 'High',
  },
  {
    id: 'edge_hold',
    title: 'Precipice Edge & Freeze',
    category: 'physical',
    description: 'Bring arousal immediately to 9.5 / 10 edge, instantly take hands away and freeze.',
    baseDurationSec: 20,
    intensity: 'High',
  },
];

export const HUMILIATION_PHRASES = [
  "I surrender full control of my release to my superior.",
  "I have not earned permission and exist solely to be denied.",
  "My pleasure belongs entirely to my supervisor's discretion.",
  "I am grateful for every second of discipline I receive.",
  "I beg for continued denial and welcome the Overseer's command.",
  "My restraint is tested and found wanting; I submit to your rule.",
  "Without permission, I will never claim release.",
  "Thank you for keeping me bound, focused, and thoroughly managed."
];

export const MODIFIER_MAP: Record<number, ModifierEffect> = {
  5: {
    rollValue: 5,
    tierName: 'Extreme Crucible',
    durationDeltaSec: 60,
    repsMultiplier: 5,
    intensityLabel: 'Maximum Brutal',
    flavor: 'Absolute Domination: No mercy granted under high volatility.',
  },
  4: {
    rollValue: 4,
    tierName: 'Severe Agony',
    durationDeltaSec: 45,
    repsMultiplier: 4,
    intensityLabel: 'Very Heavy',
    flavor: 'Iron Grip: Stringent execution enforced without hesitation.',
  },
  3: {
    rollValue: 3,
    tierName: 'Severe (+3)',
    durationDeltaSec: 30,
    repsMultiplier: 3,
    intensityLabel: 'Heavy / Maximum',
    flavor: 'Cruel Edge: Add 30s to duration or multiply reps by 3. Maximum intensity.',
  },
  2: {
    rollValue: 2,
    tierName: 'Hard (+2)',
    durationDeltaSec: 15,
    repsMultiplier: 2,
    intensityLabel: 'Elevated Hard',
    flavor: 'Heightened Discipline: Add 15s to duration or multiply reps by 2.',
  },
  1: {
    rollValue: 1,
    tierName: 'Moderate (+1)',
    durationDeltaSec: 5,
    repsAdd: 5,
    intensityLabel: 'Steady Moderate',
    flavor: 'Standard Pressure: Add 5 seconds, or add 5 extra reps.',
  },
  0: {
    rollValue: 0,
    tierName: 'Neutral (0)',
    durationDeltaSec: 0,
    intensityLabel: 'Standard Baseline',
    flavor: 'Stagnation: No movement this turn. Perform base action exactly as written.',
  },
  '-1': {
    rollValue: -1,
    tierName: 'Relief (-1)',
    durationDeltaSec: -5,
    repsMultiplier: 0.5,
    intensityLabel: 'Gentle Cadence',
    flavor: 'Lenient Reprieve: Subtract 5 seconds, or reduce reps by half.',
  },
  '-2': {
    rollValue: -2,
    tierName: 'Easy (-2)',
    durationDeltaSec: -15,
    intensityLabel: 'Slow & Teasing',
    flavor: 'Agonizing Ease: Subtract 15 seconds, or execute at slowest pace possible.',
  },
  '-3': {
    rollValue: -3,
    tierName: 'Blessing / Skip (-3)',
    durationDeltaSec: 0,
    intensityLabel: 'Total Reprieve',
    flavor: 'Grace of the Empress: Action is entirely bypassed! +1 momentum granted.',
    isBypassed: true,
    bonusRoll: 1,
  },
  '-4': {
    rollValue: -4,
    tierName: 'Sovereign Pardon (-4)',
    durationDeltaSec: 0,
    intensityLabel: 'Pardon & Ward',
    flavor: 'Divine Exemption: Action bypassed and all active negative debuffs cleansed.',
    isBypassed: true,
  },
  '-5': {
    rollValue: -5,
    tierName: 'Ascendant Surge (-5)',
    durationDeltaSec: 0,
    intensityLabel: 'Miraculous Leap',
    flavor: 'Transcendent Breakthrough: Action bypassed and jump +1 additional node forward!',
    isBypassed: true,
  },
};

export const AVAILABLE_RELICS: Relic[] = [
  {
    id: 'IRON_WILL',
    name: 'Iron Will Shard',
    description: 'Consumable ward. Nullifies the next penalty challenge or Chaser ambush automatically.',
    icon: 'Shield',
  },
  {
    id: 'GOLDEN_COMPASS',
    name: 'Gilded Sextant',
    description: 'Allows you to choose your exact movement roll (-3 to +3) on any single turn.',
    icon: 'Compass',
  },
  {
    id: 'CHASER_DECOY',
    name: 'Obsidian Decoy',
    description: 'Forces the Chaser to freeze in place or lose tracking for one full round.',
    icon: 'EyeOff',
  },
  {
    id: 'METRONOME',
    name: 'Crucible Metronome',
    description: 'Permanently cuts active countdown challenge timers by 25%.',
    icon: 'Timer',
  },
];

export interface AvatarOption {
  id: string;
  name: string;
  title: string;
  color: string;
  bgHex: string;
  borderHex: string;
  symbol: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'iron_monolith',
    name: 'Iron Monolith',
    title: 'The Enduring Pillar',
    color: '#94a3b8',
    bgHex: 'bg-slate-800',
    borderHex: 'border-slate-500',
    symbol: 'M',
  },
  {
    id: 'obsidian_golem',
    name: 'Obsidian Golem',
    title: 'The Shadow Sentinel',
    color: '#f59e0b',
    bgHex: 'bg-amber-950',
    borderHex: 'border-amber-600',
    symbol: 'Ω',
  },
  {
    id: 'basalt_vanguard',
    name: 'Basalt Vanguard',
    title: 'The Heavy Bound',
    color: '#ef4444',
    bgHex: 'bg-red-950',
    borderHex: 'border-red-600',
    symbol: 'V',
  },
  {
    id: 'titanium_strider',
    name: 'Titanium Strider',
    title: 'The Silent Devotee',
    color: '#06b6d4',
    bgHex: 'bg-cyan-950',
    borderHex: 'border-cyan-600',
    symbol: 'T',
  },
];
