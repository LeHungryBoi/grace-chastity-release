# Action & Modifier Configuration Data

This file defines the authoritative gameplay catalog of base physical & psychological challenges, modifier translation formulas, hazard specs, and balancing parameters for the Hotseat Roguelike board game.

---

## 1. Base Action Pool

When a player arrives on a standard challenge tile, an action is drawn from this pool based on the active DM weighting.

### Standard Physical & Endurance Actions
1. **Stroking (Edge & Cadence):**
   - *Description:* Rhythmic stroking maintaining strict pace control.
   - *Base Requirement:* 30 seconds steady rhythm or 30 controlled strokes without crossing threshold.
2. **Nipple Play (Clamps & Torsion):**
   - *Description:* Applying tension, clothespins/clamps, or firm twisting stimulation.
   - *Base Requirement:* 20 seconds direct stimulation or 1 set of clamps attached.
3. **Ball Tapping (Impact Conditioning):**
   - *Description:* Controlled impacts using fingers, leather paddle, or cupped hand.
   - *Base Requirement:* 10 light-to-moderate taps, counting aloud on each impact.
4. **Kneeling (Discipline Posture):**
   - *Description:* Strict upright kneeling on hard surface (hands behind head or back, eyes downcast).
   - *Base Requirement:* 30 seconds uninterrupted upright posture without slouching.
5. **Slapping (Sensory Humility):**
   - *Description:* Administering crisp face slaps across alternate cheeks.
   - *Base Requirement:* 6 crisp slaps with audible contact.
6. **Humiliation & Begging (Verbal Submission):**
   - *Description:* Vocalizing designated submission phrases or formally requesting permission to continue.
   - *Base Requirement:* Recite 1 generated humility pledge kneeling at the Master's / Wifey's feet.
7. **Cold Shock (Temperature Shock):**
   - *Description:* Direct ice cube contact or cold sensation applied to lower torso / groin.
   - *Base Requirement:* 15 seconds direct contact without moving away.
8. **Edging Hold (Threshold Lockdown):**
   - *Description:* Bring right to the precipice of no-return (9.5/10), freeze hands completely, and hold without finishing.
   - *Base Requirement:* 1 peak edge followed by a 15-second mandatory freeze.

---

## 2. Modifier Translation Table

The movement roll (e.g., -3 to +3, or extended -5 to +5 based on DM volatility setting) modifies the base action upon landing:

| Roll Value | Tier Name | Effect on Duration / Reps / Intensity | Special Modifier Flavor |
| :---: | :---: | :--- | :--- |
| **+5** | Extreme Crucible | +60 seconds, or 5x reps. Maximum possible intensity. | "Absolute Domination: No mercy granted." |
| **+4** | Severe Agony | +45 seconds, or 4x reps. Heavy relentless pace. | "Wifey's Decree: Iron grip enforced." |
| **+3** | Severe | Add 30 seconds to duration, or multiply reps by 3. Maximum intensity. | "Cruel Edge: Full compliance expected." |
| **+2** | Hard | Add 15 seconds to duration, or multiply reps by 2. Heavy intensity. | "Heightened Discipline: Pace quickens." |
| **+1** | Moderate | Add 5 seconds, or add 5 extra reps. Maintain steady pace. | "Standard Pressure: Focus sharpens." |
| **0** | Neutral | Perform base action exactly as written. (Player did not move this turn). | "Stagnation Penalty: Must face the tile again." |
| **-1** | Relief | Subtract 5 seconds, or reduce reps by half. Gentle cadence. | "Lenient Reprieve: A slight easing of tension." |
| **-2** | Easy | Subtract 15 seconds, or execute at the absolute slowest pace possible. | "Slow Torture: Teasing, agonizingly slow." |
| **-3** | Skip / Blessing | Action is entirely bypassed, or converted into a temporary buff (+1 to next roll). | "Grace of the Empress: Total exemption granted." |
| **-4** | Golden Reprieve | Action bypassed, player heals all debuffs and gains an Iron Will buff. | "Sovereign Pardon: Fortified resolve." |
| **-5** | Miraculous Surge | Action bypassed, player advances +1 bonus tile immediately. | "Ascendant Momentum: Swift breakthrough." |

---

## 3. Special Tile Mechanics

1. **Hazard / Swamp Tile ("Mire of Denial"):**
   - Applies the **"Edge Lock"** debuff: Player cannot choose branching forks until they successfully survive a 30s Edge Challenge without flinching.
   - Alternative debuff: **"Heavy Drag"** (Movement rolls have -1 distance penalty).
2. **Sanctuary / Lake Tile ("Altar of Serenity"):**
   - Cleanses all active debuffs (Edge Lock, Heavy Drag, Chaser Vulnerability).
   - Grants the **"Serene Focus"** buff: Immune to the next hazard tile penalties.
3. **Ruined Orgasm Hazard Tile ("The Brink of Despair"):**
   - High risk, high reward.
   - Challenge: 45s maximum intensity stroking directly on the edge.
   - Check: Must hold hands off upon signal. If the player prematurely releases or loses control, a **Ruined Release** is registered:
     - *Penalty Mode:* Loss of 500 session glory points and reset back 3 tiles.
     - *Hard Reset Mode (DM toggle):* Sent immediately back to Start Node 0!
4. **Item / Relic Tile ("Reliquary"):**
   - Grants 1 consumable relic from the following pool:
     - **Iron Will:** Automatically nullify the next Boss or Hazard penalty.
     - **Golden Compass:** Allows player to choose their movement roll value (-3 to +3) instead of rolling randomly.
     - **Chaser Decoy:** The Chaser freezes or moves in the opposite direction for 1 turn.
     - **Pacing Metronome:** Automatically halves any timer challenge duration.

---

## 4. The Chaser Entity ("The Overseer Monolith")

- **Spawn Condition:** Round 3 completion (or custom round via DM panel).
- **Movement:** Traverses 1–3 tiles (DM configured) along the shortest connected node graph distance toward the leading/closest player.
- **Encounter ("Overseer's Reckoning"):**
  - Triggers an instant Boss Penalty Challenge: Strict 60s kneeling edge + 15 impact taps.
  - Strips all active positive buffs from the caught player.

---

## 5. The Apex & The "色" Button

- **Final Node:** "The Apex Chamber of Release".
- **Final Judgement:** The player must complete the final gauntlet challenge approved by the session supervisor / Wifey.
- **The "色" (Lust / Climax) Authorization:**
  - Upon passing the Apex Challenge without a ruined reset, the player UI unlocks the pulsing **"色"** button.
  - The player triggers their climax, sounds their cry of relief, and presses **"色"** to log their official victory completion time, surviving stats, and glory rating.
