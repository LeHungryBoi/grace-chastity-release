# GAME TERMINOLOGY & SYSTEM STYLE GUIDE
> **CRITICAL STYLE GUIDE & VOCABULARY REFERENCE**
> Always consult this guide when writing code, UI labels, scripts, rules, and game mechanics. Keep terminology consistent across all engine modules, Map Lab, and gameplay views.

---

## 1. Core Map & Graph Concepts

### **Node**
A general term for any discrete position, junction, or room located on the navigable board topology. Every node has a unique coordinate, connection list, and room category. Nodes are subdivided into two main types:
- **Waypoint Dot (`RestSpot` / Waypoint)**:
  - Subtle transit dot nodes (smaller footprint, 22px diameter).
  - Designed for fast stepping, smooth movement pacing, and simple/lightweight events.
  - Events have low complexity, fast resolution, and minimal friction (e.g., small stamina checks, brief sensory prompts, quick dice rolls).
- **Octagon Room (`OctagonRoom` / `OctagonHub` / Special Rooms)**:
  - Prominent 8-sided chamber rooms (large footprint, 60–74px diameter).
  - Serve as major thematic landmarks, junctions, or destination biomes (e.g., Dungeon, Lake, Swamp, Relic Shrine, Apex Sanctum).
  - Contain complex scripted events, rich narrative/flavor text, multi-choice branching mini-scenarios, high-stakes gauntlets, and severe hazard traps.

### **Path**
The navigable corridor or connecting edge between two nodes. Paths allow bidirectional movement across the board. Path lengths may be full (1.0x) or half (0.6x) for natural organic aesthetic variety.

---

## 2. Turn Cycle & Action Economy

### **Action Points (AP)**
The fundamental currency required to act and navigate.
- Starting AP: **3 AP**.
- Standard Move: Costs **1 AP** per node traversed.
- AP does **NOT** automatically reset to full when a round ends. Players manage AP through deliberate actions, resting, or invoking Grace.

### **Turn (Individual Participant Turn)**
An individual participant's (human player or NPC) active phase.
- During their turn, a player spends AP to move, take actions, or invoke Grace.
- Alternatively, a player may choose to **Rest** during their turn.
- A turn concludes when the participant chooses **End Turn** or **Rest**.
- **`onTurnEnd` Trigger**: A system callback fired whenever any individual player or NPC completes their turn.

### **Round (Full Table Cycle)**
A complete cycle around the table across all participants.
- A round is completed only when **every player and NPC** has completed and ended their individual turn.
- **`onRoundEnd` Trigger**: A system callback fired when the entire table cycle (round) is complete.

### **Rest**
A dedicated strategic action taken during a participant's turn.
- **Usage Limit**: A player can only rest **one time per turn**.
- **Immediate Turn Termination**: Resting immediately ends the participant's turn (unless a gear trait hook like *Resonating Chrono-Harness* or special condition modifier intercepts and overrides it).
- **Effect**: The player takes no movement or actions for that turn.
- **Reward**: The player regains **+2 AP**.
- Concludes the player's turn and triggers `onTurnEnd`.

---

## 3. Entities & NPC AI

### **Chaser Monolith**
Menacing obsidian monoliths placed at random nodes across the map.
- **Idle State**: Dormant floating monolith observing the sector.
- **Aggro State**: If any player moves within **3 nodes** distance (graph path distance $\le 3$), the Monolith becomes **AGGRO**, targets that player, and begins pursuit.

### **NPC AI Behavior**
Non-player characters participate seamlessly in the turn order alongside human players:
- **Turn Activation**: When the turn queue reaches an NPC, the AI takes control.
- **Basic Behavior Loop**: The NPC takes their turn, performs programmed automated actions (base default: promptly concludes their turn), and triggers `onTurnEnd` to advance the queue.

### **Multiple Occupancy**
Nodes (both Waypoint Dots and Octagon Rooms) support **multiple simultaneous occupants** (multiple human players, NPCs, and Chasers in the exact same room). Occupants are rendered with clean non-overlapping offsets and badges.

### **Grace & Submission**
A secondary mercy mechanic where players can forfeit dignity/execute specialized compliance challenges in exchange for bonus AP when depleted.

---

## 4. Turn Queue & Event Hook Systems

### **Global Turn Queue**
The authoritative sequence dictating which participant (human player or NPC) is actively taking their turn.
- **Strict Single Actor**: Only the participant highlighted as **ACTIVE** in the queue may make moves, rest, or act.
- **Dedicated Highlighting**: The board and navigation paths strictly highlight navigable options from the active participant's position.

### **Gear Traits & Global Event Broadcasts**
Items and equipment utilize a broadcast-and-hook system:
- **Global Event Broadcast**: Whenever core game actions occur (`ON_MOVE`, `ON_REST`, `ON_TURN_END`, `ON_ROUND_END`), the engine queries all equipped items: *"Is anyone going to step in?"*
- **JSON Hook Definitions**: Gear items specify which event they listen to and what behavior they overwrite.
- **Example — Resonating Chrono-Harness**:
  - `listenTo: "ON_REST"`
  - `overrideEndsTurnImmediately: false`
  - When the equipped player rests, the harness intercepts the event, awarding **+2 AP** while overriding the immediate turn-end behavior so the player's turn remains active.
