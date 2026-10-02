import { GearItem } from '../types/game';

export const CHRONO_REST_HARNESS: GearItem = {
  id: 'chrono_rest_harness',
  name: 'Resonating Chrono-Harness',
  slot: 'accessory',
  rarity: 'Epic',
  icon: 'Zap',
  description: 'Grants +2 AP upon resting without terminating or ending the current turn.',
  flavorText: '"Rest is not a release from the gauntlet, merely an authorized pause for breath. Even with head bowed in forced stillness, the harness channels every obedient second into renewed momentum—granting no reprieve from your active trial."',
  hook: {
    listenTo: 'ON_REST',
    overrideEndsTurnImmediately: false, // Prevents turn from ending upon resting!
    overrideEndsRoundImmediately: false, // Backwards-compatible alias
    description: 'Hook: When resting, gain +2 AP as normal but DO NOT end your turn.',
  },
};

export const AVAILABLE_GEAR_ITEMS: GearItem[] = [
  CHRONO_REST_HARNESS,
];
