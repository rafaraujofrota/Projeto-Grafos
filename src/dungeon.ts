import { corridorOverlap, rectCenter, rectOverlap } from "./geometry";
import { type Corridor, type Point, type Rect } from "./geometry";
import { Graph } from "./graph";

export interface DungeonConfig {
  roomCount: number;
  loopChance: number;
  minRoomSize: number;
  maxRoomSize: number;
  roomGap: number;
}

function generateRooms(cfg: DungeonConfig): Rect[] {
  const rooms: Rect[] = []

  for (let tries = 0; tries < cfg.roomCount * 50; tries++) {
    if(rooms.length >= cfg.roomCount) break

    const interval = (cfg.maxRoomSize - cfg.minRoomSize)
    const w = cfg.minRoomSize + Math.random() * interval
    const h = cfg.minRoomSize + Math.random() * interval

    const rectPos: Point = {
      x: Math.round(20 + Math.random() * (1200 - w - 40)),
      y: Math.round(20 + Math.random() * (800 - h - 40))
    }
    const r: Rect = { position: rectPos, width: Math.round(w), height: Math.round(h) }

    if (!rooms.some((other) => rectOverlap(r, other, cfg.roomGap))) rooms.push(r)
  }
  return rooms
}

export function generateDungeon(cfg: DungeonConfig): Graph<Rect> {
  const rooms = generateRooms(cfg)
  const graph = new Graph<Rect>()
  
  rooms.forEach((room, id) => graph.addVertex(id, room))

  const pairs: { a: number; b: number; dist: number }[] = []
  for (let a = 0; a < rooms.length; a++) {
    for (let b = a + 1; b < rooms.length; b++) {
      const ca = rectCenter(rooms[a])
      const cb = rectCenter(rooms[b])
      pairs.push({ a, b, dist: Math.hypot(ca.x - cb.x, ca.y - cb.y) })
    }
  }
  // Tenta conectar os mais proximos primeiro para a dungeons ficar mais bonita no final
  // comentar essa linha para mostrar a diferença
  pairs.sort((p, q) => p.dist - q.dist)

  for (const { a, b } of pairs) {
    const corridor: Corridor = {
      start: rectCenter(rooms[a]), end: rectCenter(rooms[b]), width: 20,
    };

    const blocked = rooms.some((room, i) => i !== a && i !== b && corridorOverlap(corridor, room))
    if (blocked) continue

    const alreadyConnected = graph.distancesFrom(a).has(b)
    if (!alreadyConnected || Math.random() < cfg.loopChance) {
      graph.addEdge(a, b)
    }
  }

  return graph
}