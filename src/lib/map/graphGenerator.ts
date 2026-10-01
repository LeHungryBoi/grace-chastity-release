import { 
  BoardNode, 
  TileType, 
  RoomType, 
  CompassDirection 
} from '../types/game';
import { BASE_ACTIONS } from '../config/actionsConfig';

export interface GraphTopology {
  nodes: Record<string, BoardNode>;
  startNodeId: string;
  apexNodeId: string;
  tierCount: number;
  density: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export interface MapGenOptions {
  maxNodes?: number;
  branchChance?: number;
  primaryTendrilCount?: number;
  maxDotsBetweenRooms?: number; // 0 to 2
  waypointChainLength?: number;
  allowHalfLengthPaths?: boolean; // Variable between full length (1.0x) and half length (0.55-0.65x)
  sparsityLimit?: number;
  reconnectionChance?: number;
  gridSpacing?: number;
  hazardSwampChance?: number;
  sanctuaryChance?: number;
  relicChance?: number;
  ruinedChance?: number;
  totalTiers?: number;
}

const DIRECTION_VECTORS: Record<CompassDirection, [number, number]> = {
  N: [0, -1],
  NE: [0.7071, -0.7071],
  E: [1, 0],
  SE: [0.7071, 0.7071],
  S: [0, 1],
  SW: [-0.7071, 0.7071],
  W: [-1, 0],
  NW: [-0.7071, -0.7071],
};

const ALL_DIRECTIONS: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const OPPOSITE_DIRECTIONS: Record<CompassDirection, CompassDirection> = {
  N: 'S',
  NE: 'SW',
  E: 'W',
  SE: 'NW',
  S: 'N',
  SW: 'NE',
  W: 'E',
  NW: 'SE',
};

// Physical clearance radii in pixels to guarantee ZERO UI overlapping
const ROOM_CLEARANCE_RADII: Record<string, number> = {
  OctagonRoom: 36, // 72px octagon room diameter
  OctagonHub: 36,
  RestSpot: 12,    // 24px waypoint dot diameter
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBoardGraph(options: number | MapGenOptions = 38): GraphTopology {
  const opts: MapGenOptions = typeof options === 'number' 
    ? { maxNodes: Math.max(16, options) } 
    : options;

  const maxNodes = opts.maxNodes ?? 38;
  const branchChance = opts.branchChance ?? 0.85;
  const primaryTendrilCount = opts.primaryTendrilCount ?? 6;
  
  // Max dots in a row: 1 (random 0 to 1 dots in a row per screenshot)
  const maxDotsBetweenRooms = Math.min(2, Math.max(0, opts.maxDotsBetweenRooms ?? 1));
  const allowHalfLengthPaths = opts.allowHalfLengthPaths ?? true;

  const reconnectionChance = opts.reconnectionChance ?? 0.38;
  const gridSpacing = opts.gridSpacing ?? 120; // 120px base spacing provides clean breathing room

  const hazardSwampChance = opts.hazardSwampChance ?? 0.25;
  const sanctuaryChance = opts.sanctuaryChance ?? 0.20;
  const relicChance = opts.relicChance ?? 0.25;
  const ruinedChance = opts.ruinedChance ?? 0.30;

  const nodes: Record<string, BoardNode> = {};

  // Random amount of dots from 0 to maxDotsBetweenRooms (0, 1, or 2)
  const rollDotsCount = () => Math.floor(Math.random() * (maxDotsBetweenRooms + 1));

  // Determine safe step length:
  // - If connecting Room <-> Room (0 intermediate dots): MUST be full length 1.0x so 72px octagon rooms never collide!
  // - If connecting Room <-> Dot: variable (0.65x or 1.0x)
  // - If connecting Dot <-> Dot: variable (0.55x or 1.0x)
  const getStepMultiplier = (fromType: RoomType, toIsDot: boolean): number => {
    if (!allowHalfLengthPaths) return 1.0;
    if (fromType !== 'RestSpot' && !toIsDot) {
      // Room to Room direct: full length required for physical clearance
      return 1.0;
    }
    if (fromType === 'RestSpot' && toIsDot) {
      // Dot to Dot: ~50% chance of half length (0.55x)
      return Math.random() < 0.50 ? 0.55 : 1.0;
    }
    // Room to Dot or Dot to Room: ~40% chance of half length (0.65x)
    return Math.random() < 0.40 ? 0.65 : 1.0;
  };

  // 1. Genesis Starting Room (Octagon at center (0, 0))
  const startId = 'node_origin_room';
  const startNode: BoardNode = {
    id: startId,
    tier: 0,
    indexInTier: 0,
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    roomType: 'OctagonRoom',
    type: 'START',
    title: 'Genesis Room',
    description: 'Starting octagonal nexus. 8-directional branching terminal for the gauntlet.',
    nextNodes: [],
    prevNodes: [],
    directionMap: {},
  };

  nodes[startId] = startNode;

  let nodeCounter = 1;

  const linkNodes = (fromNode: BoardNode, toNode: BoardNode, dir: CompassDirection) => {
    const oppDir = OPPOSITE_DIRECTIONS[dir];
    if (!fromNode.nextNodes.includes(toNode.id)) fromNode.nextNodes.push(toNode.id);
    if (!toNode.nextNodes.includes(fromNode.id)) toNode.nextNodes.push(fromNode.id);
    if (!fromNode.directionMap) fromNode.directionMap = {};
    if (!toNode.directionMap) toNode.directionMap = {};
    fromNode.directionMap[dir] = toNode.id;
    toNode.directionMap[oppDir] = fromNode.id;
  };

  // Euclidean Clearance Check: Ensures NO two rooms or UIs can EVER overlap!
  const isOverlapCollision = (targetGx: number, targetGy: number, targetType: RoomType): { hasCollision: boolean; collidingNeighborId: string | null } => {
    const targetRadius = ROOM_CLEARANCE_RADII[targetType] || 36;
    const targetPxX = targetGx * gridSpacing;
    const targetPxY = targetGy * gridSpacing;

    const existingList = Object.values(nodes);
    for (const existing of existingList) {
      const existingRadius = ROOM_CLEARANCE_RADII[existing.roomType] || 36;
      const existingPxX = existing.gridX * gridSpacing;
      const existingPxY = existing.gridY * gridSpacing;

      const distPx = Math.hypot(targetPxX - existingPxX, targetPxY - existingPxY);
      // Required separation: sum of radii + 22px safety corridor buffer
      const minSeparationPx = targetRadius + existingRadius + 22;

      if (distPx < minSeparationPx) {
        return { hasCollision: true, collidingNeighborId: existing.id };
      }
    }
    return { hasCollision: false, collidingNeighborId: null };
  };

  interface ExpansionPoint {
    sourceNodeId: string;
    heading: CompassDirection;
    dotsRemaining: number; // 0, 1, or 2
    depth: number;
  }

  const expansionQueue: ExpansionPoint[] = [];

  // All initial branches from Genesis Room are 8-directional!
  const initialDirections = shuffleArray(ALL_DIRECTIONS).slice(0, Math.min(primaryTendrilCount, 6));
  initialDirections.forEach(dir => {
    expansionQueue.push({
      sourceNodeId: startId,
      heading: dir,
      dotsRemaining: rollDotsCount(),
      depth: 1,
    });
  });

  while (expansionQueue.length > 0 && Object.keys(nodes).length < maxNodes) {
    const current = expansionQueue.shift()!;
    const sourceNode = nodes[current.sourceNodeId];
    if (!sourceNode) continue;

    const isNextADot = current.dotsRemaining > 0;
    const prospectiveType: RoomType = isNextADot ? 'RestSpot' : 'OctagonRoom';
    const stepMultiplier = getStepMultiplier(sourceNode.roomType, isNextADot);

    const [dx, dy] = DIRECTION_VECTORS[current.heading];
    const targetGx = Number((sourceNode.gridX + dx * stepMultiplier).toFixed(2));
    const targetGy = Number((sourceNode.gridY + dy * stepMultiplier).toFixed(2));

    // Strict Physical Clearance Collision Check
    const { hasCollision, collidingNeighborId } = isOverlapCollision(targetGx, targetGy, prospectiveType);

    if (hasCollision) {
      if (
        collidingNeighborId &&
        collidingNeighborId !== sourceNode.id &&
        !sourceNode.nextNodes.includes(collidingNeighborId) &&
        Math.random() < reconnectionChance
      ) {
        const neighborNode = nodes[collidingNeighborId];
        if (neighborNode) {
          linkNodes(sourceNode, neighborNode, current.heading);
        }
      }
      continue;
    }

    const radialDist = Math.round(Math.hypot(targetGx, targetGy));

    if (current.dotsRemaining > 0) {
      // Spawn small RestSpot transit dot (22px)
      const dotId = `node_${nodeCounter++}_dot`;

      let tileType: TileType = 'STANDARD';
      const rand = Math.random();
      if (rand < sanctuaryChance) tileType = 'SANCTUARY';
      else if (rand < sanctuaryChance + relicChance) tileType = 'ITEM_RELIC';

      const randomAction = BASE_ACTIONS[Math.floor(Math.random() * BASE_ACTIONS.length)];

      const dotNode: BoardNode = {
        id: dotId,
        tier: radialDist,
        indexInTier: nodeCounter,
        x: 0,
        y: 0,
        gridX: targetGx,
        gridY: targetGy,
        roomType: 'RestSpot',
        type: tileType,
        title: tileType === 'SANCTUARY' ? 'Serenity Fountain' : tileType === 'ITEM_RELIC' ? 'Relic Cache' : 'Transit Waypoint',
        description: 'A pathway waypoint linking octagonal rooms across the void.',
        baseActionId: randomAction.id,
        nextNodes: [],
        prevNodes: [sourceNode.id],
        directionMap: {},
      };

      nodes[dotId] = dotNode;
      linkNodes(sourceNode, dotNode, current.heading);

      expansionQueue.push({
        sourceNodeId: dotId,
        heading: current.heading,
        dotsRemaining: current.dotsRemaining - 1,
        depth: current.depth + 1,
      });
    } else {
      // Spawn Octagonal Room - ALL rooms are octagonal!
      const roomId = `node_${nodeCounter++}_room`;

      let tileType: TileType = 'STANDARD';
      const rand = Math.random();
      if (radialDist >= 2 && rand < ruinedChance) {
        tileType = 'RUINED_HAZARD';
      } else if (rand < hazardSwampChance) {
        tileType = 'HAZARD_SWAMP';
      } else if (rand < 0.2) {
        tileType = 'ITEM_RELIC';
      }

      const randomAction = BASE_ACTIONS[Math.floor(Math.random() * BASE_ACTIONS.length)];
      let title = `Room (Sector ${radialDist})`;
      let description = randomAction.description;

      if (tileType === 'RUINED_HAZARD') {
        title = `Crucible Room (Sector ${radialDist})`;
        description = 'High stakes chamber. Strict control check under high pressure.';
      } else if (tileType === 'HAZARD_SWAMP') {
        title = `Mire Room (Sector ${radialDist})`;
        description = 'Submerged dungeon tile. Inflicts Edge Lock debuff upon breach.';
      } else if (tileType === 'ITEM_RELIC') {
        title = `Relic Room (Sector ${radialDist})`;
        description = 'Sanctuary housing an ancient artifact.';
      }

      const roomNode: BoardNode = {
        id: roomId,
        tier: radialDist,
        indexInTier: nodeCounter,
        x: 0,
        y: 0,
        gridX: targetGx,
        gridY: targetGy,
        roomType: 'OctagonRoom',
        type: tileType,
        title,
        description,
        baseActionId: randomAction.id,
        nextNodes: [],
        prevNodes: [sourceNode.id],
        directionMap: {},
      };

      nodes[roomId] = roomNode;
      linkNodes(sourceNode, roomNode, current.heading);

      // Every room is 8-directional!
      const oppDir = OPPOSITE_DIRECTIONS[current.heading];
      const forwardCandidates = shuffleArray(ALL_DIRECTIONS.filter(d => d !== oppDir));

      const forksToCreate = Math.random() < branchChance ? (Math.random() < 0.5 ? 2 : 3) : 1;

      for (let f = 0; f < Math.min(forksToCreate, forwardCandidates.length); f++) {
        expansionQueue.push({
          sourceNodeId: roomId,
          heading: forwardCandidates[f],
          dotsRemaining: rollDotsCount(),
          depth: current.depth + 1,
        });
      }
    }
  }

  // Designate the Apex Room at furthest perimeter
  let furthestNodeId = startId;
  let maxDist = -1;

  Object.values(nodes).forEach(n => {
    if (n.id === startId) return;
    const dist = Math.hypot(n.gridX, n.gridY);
    if (dist > maxDist) {
      maxDist = dist;
      furthestNodeId = n.id;
    }
  });

  const apexNode = nodes[furthestNodeId];
  if (apexNode) {
    apexNode.type = 'APEX';
    apexNode.roomType = 'OctagonRoom';
    apexNode.title = 'The Apex Room of Release';
    apexNode.description = 'The ultimate destination sanctum. Pass the Final Gauntlet to trigger "色".';
  }

  // Calculate Spatial Bounds
  const allNodesList = Object.values(nodes);
  const minGx = Math.min(...allNodesList.map(n => n.gridX));
  const maxGx = Math.max(...allNodesList.map(n => n.gridX));
  const minGy = Math.min(...allNodesList.map(n => n.gridY));
  const maxGy = Math.max(...allNodesList.map(n => n.gridY));

  const padding = 80;
  const spanX = Math.max(1, maxGx - minGx);
  const spanY = Math.max(1, maxGy - minGy);
  const totalSvgWidth = Math.max(750, (spanX + 1.5) * gridSpacing + padding * 2);
  const totalSvgHeight = Math.max(520, (spanY + 1.5) * gridSpacing + padding * 2);

  const originX = padding + (0 - minGx) * gridSpacing;
  const originY = padding + (0 - minGy) * gridSpacing;

  allNodesList.forEach(n => {
    n.x = originX + n.gridX * gridSpacing;
    n.y = originY + n.gridY * gridSpacing;
  });

  const gridArea = (spanX + 1) * (spanY + 1);
  const actualDensity = allNodesList.length / Math.max(1, gridArea);

  return {
    nodes,
    startNodeId: startId,
    apexNodeId: furthestNodeId,
    tierCount: Math.ceil(maxDist),
    density: actualDensity,
    bounds: {
      minX: 0,
      maxX: totalSvgWidth,
      minY: 0,
      maxY: totalSvgHeight,
      width: totalSvgWidth,
      height: totalSvgHeight,
    },
  };
}

export function getShortestPath(
  nodes: Record<string, BoardNode>,
  fromId: string,
  targetId: string
): string[] {
  if (fromId === targetId) return [fromId];

  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const node = nodes[id];
    if (!node) continue;

    const neighbors = [...new Set([...node.nextNodes, ...node.prevNodes])];

    for (const next of neighbors) {
      if (next === targetId) {
        return [...path, next];
      }
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, path: [...path, next] });
      }
    }
  }

  return [fromId];
}
