export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  width: number;
  height: number;
  position: Point;
}

export interface Corridor {
  start: Point;
  end: Point;
  width: number;
}

export function rectCenter(r: Rect): Point {
  return {
    x: r.position.x + r.width / 2,
    y: r.position.y + r.height / 2
  }
}

export function rectOverlap(a: Rect, b: Rect, pad: number): boolean {
  return (
    a.position.x < b.position.x + b.width + pad &&
    a.position.x + a.width + pad > b.position.x &&
    a.position.y < b.position.y + b.height + pad &&
    a.position.y + a.height + pad > b.position.y
  )
}

export function corridorOverlap(corridor: Corridor, room: Rect): boolean {
  const { start, end, width } = corridor
  const center = rectCenter(room)

  const dx = end.x - start.x
  const dy = end.y - start.y

  const lengthSquared = dx * dx + dy * dy
  const projection = ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared

  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, projection))

  const closest = {
    x: start.x + t * dx,
    y: start.y + t * dy
  }

  const distX = Math.max(
    Math.abs(center.x - closest.x) - room.width / 2, 0
  )

  const distY = Math.max(
    Math.abs(center.y - closest.y) - room.height / 2, 0
  )

  return distX * distX + distY * distY <= (width / 2) ** 2
}