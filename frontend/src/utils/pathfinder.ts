/**
 * A* Pathfinding Engine for Gigafactory Autonomous Guided Vehicles (AGV / AMR)
 * Completely client-side, highly robust, with step-by-step exploration tracking.
 */

export interface Point {
  row: number;
  col: number;
}

export interface PathNode {
  row: number;
  col: number;
  g: number; // Cost from start
  h: number; // Heuristic estimate to goal
  f: number; // Total cost f = g + h
  parent: PathNode | null;
}

export interface PathResult {
  found: boolean;
  path: Point[];
  exploredOrder: Point[];
  frontierCells: Point[];
  nodesExplored: number;
  pathCost: number;
  executionTimeMs: number;
  message?: string;
}

export function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function euclideanDistance(a: Point, b: Point): number {
  const dr = a.row - b.row;
  const dc = a.col - b.col;
  return Math.sqrt(dr * dr + dc * dc);
}

/**
 * Execute A* Pathfinding search on an NxM grid.
 * @param grid 2D array where 1 = obstacle/machine, 0 = free corridor
 * @param start Starting coordinates (e.g. Inbound Dock)
 * @param goal Goal coordinates (e.g. Pack Assembly Line)
 * @param allowDiagonal Whether 8-directional movement is allowed
 */
export function findPathAStar(
  grid: number[][],
  start: Point,
  goal: Point,
  allowDiagonal: boolean = false
): PathResult {
  const startTime = performance.now();
  const rows = grid.length;
  const cols = grid[0].length;

  // Boundary and collision checks
  if (
    start.row < 0 || start.row >= rows ||
    start.col < 0 || start.col >= cols ||
    goal.row < 0 || goal.row >= rows ||
    goal.col < 0 || goal.col >= cols
  ) {
    return {
      found: false,
      path: [],
      exploredOrder: [],
      frontierCells: [],
      nodesExplored: 0,
      pathCost: 0,
      executionTimeMs: 0,
      message: "Start or goal coordinate out of bounds",
    };
  }

  if (grid[start.row][start.col] === 1 || grid[goal.row][goal.col] === 1) {
    return {
      found: false,
      path: [],
      exploredOrder: [],
      frontierCells: [],
      nodesExplored: 0,
      pathCost: 0,
      executionTimeMs: 0,
      message: "Start or goal position is blocked by an obstacle",
    };
  }

  if (start.row === goal.row && start.col === goal.col) {
    return {
      found: true,
      path: [start],
      exploredOrder: [start],
      frontierCells: [],
      nodesExplored: 1,
      pathCost: 0,
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Open set and closed set
  const openSet: PathNode[] = [];
  const closedSet: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const openSetMap: (PathNode | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  const exploredOrder: Point[] = [];

  const startNode: PathNode = {
    row: start.row,
    col: start.col,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null,
  };

  openSet.push(startNode);
  openSetMap[start.row][start.col] = startNode;

  const directions = allowDiagonal
    ? [
        { dr: -1, dc: 0, cost: 1.0 },
        { dr: 1, dc: 0, cost: 1.0 },
        { dr: 0, dc: -1, cost: 1.0 },
        { dr: 0, dc: 1, cost: 1.0 },
        { dr: -1, dc: -1, cost: 1.414 },
        { dr: -1, dc: 1, cost: 1.414 },
        { dr: 1, dc: -1, cost: 1.414 },
        { dr: 1, dc: 1, cost: 1.414 },
      ]
    : [
        { dr: -1, dc: 0, cost: 1.0 },
        { dr: 1, dc: 0, cost: 1.0 },
        { dr: 0, dc: -1, cost: 1.0 },
        { dr: 0, dc: 1, cost: 1.0 },
      ];

  while (openSet.length > 0) {
    // Pick node with lowest f cost (tie-break with lowest h)
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (
        openSet[i].f < openSet[lowestIdx].f ||
        (openSet[i].f === openSet[lowestIdx].f && openSet[i].h < openSet[lowestIdx].h)
      ) {
        lowestIdx = i;
      }
    }

    const current = openSet.splice(lowestIdx, 1)[0];
    openSetMap[current.row][current.col] = null;
    closedSet[current.row][current.col] = true;
    exploredOrder.push({ row: current.row, col: current.col });

    // Goal reached
    if (current.row === goal.row && current.col === goal.col) {
      const path: Point[] = [];
      let curr: PathNode | null = current;
      while (curr !== null) {
        path.unshift({ row: curr.row, col: curr.col });
        curr = curr.parent;
      }

      const frontierCells: Point[] = openSet.map((n) => ({ row: n.row, col: n.col }));
      return {
        found: true,
        path,
        exploredOrder,
        frontierCells,
        nodesExplored: exploredOrder.length,
        pathCost: Math.round(current.g * 100) / 100,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      };
    }

    // Explore neighbors
    for (const dir of directions) {
      const nr = current.row + dir.dr;
      const nc = current.col + dir.dc;

      // In-bounds check
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      // Obstacle or already evaluated
      if (grid[nr][nc] === 1 || closedSet[nr][nc]) continue;

      // Corner-cutting prevention for diagonal moves
      if (allowDiagonal && dir.dr !== 0 && dir.dc !== 0) {
        if (grid[current.row + dir.dr][current.col] === 1 && grid[current.row][current.col + dir.dc] === 1) {
          continue;
        }
      }

      const tentativeG = current.g + dir.cost;
      const existingOpenNode = openSetMap[nr][nc];

      if (existingOpenNode === null) {
        // Not in open set, create and add
        const h = manhattanDistance({ row: nr, col: nc }, goal);
        const neighborNode: PathNode = {
          row: nr,
          col: nc,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };
        openSet.push(neighborNode);
        openSetMap[nr][nc] = neighborNode;
      } else if (tentativeG < existingOpenNode.g) {
        // Found a better path to this node
        existingOpenNode.g = tentativeG;
        existingOpenNode.f = tentativeG + existingOpenNode.h;
        existingOpenNode.parent = current;
      }
    }
  }

  // No path found (isolated goal)
  return {
    found: false,
    path: [],
    exploredOrder,
    frontierCells: [],
    nodesExplored: exploredOrder.length,
    pathCost: 0,
    executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    message: "No valid trajectory exists. Intralogistics path blocked by machinery.",
  };
}
