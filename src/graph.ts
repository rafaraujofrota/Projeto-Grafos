class Vertex<T> {
  readonly id: number
  readonly neighbors = new Set<number>()
  public data: T

  constructor(id: number, data:T) {
    this.id = id
    this.data = data
  }
}

export class Graph<T> {
  private readonly vertices = new Map<number, Vertex<T>>()
  private articulations: number[] | null = null
  private bridges: [number, number][] | null = null

  get size(): number {
    return this.vertices.size
  }

  clone(): Graph<T> {
    const copy = new Graph<T>()
    for (const v of this.allVertices()) {
      copy.addVertex(v.id, v.data)
    }
    for (const [a, b] of this.allEdges()) {
      copy.addEdge(a, b)
    }
    return copy
  }

  private clearWeakPoints() {
    this.articulations = null
    this.bridges = null
  }

  addVertex(id: number, data: T): Vertex<T> {
    if (this.vertices.has(id)) throw new Error(`Vertice ${id} já existe`)
    const v = new Vertex(id, data)
    this.vertices.set(id, v)
    return v
  }

  getVertex(id: number): Vertex<T> {
    const v = this.vertices.get(id)
    if (!v) throw new Error(`Vertice ${id} não existe`)
    return v
  }

  allVertices(): MapIterator<Vertex<T>> {
    return this.vertices.values()
  }

  addEdge(a: number, b: number): void {
    if (a === b) throw new Error("Laços não são permitidos")
    this.getVertex(a).neighbors.add(b)
    this.getVertex(b).neighbors.add(a)
    this.clearWeakPoints()
  }

  removeEdge(a: number, b: number): void {
    if (!this.hasEdge(a, b)) throw new Error(`Aresta ${a}-${b} não existe`)
    this.getVertex(a).neighbors.delete(b)
    this.getVertex(b).neighbors.delete(a)
    this.clearWeakPoints()
  }

  hasEdge(a: number, b: number): boolean {
    const vertex = this.vertices.get(a)
    if (!vertex) return false
    return vertex.neighbors.has(b)
  }

  allEdges(): [number, number][] {
    const edgeList: [number, number][] = []
    for(const v of this.allVertices()) {
      for (const n of v.neighbors) if (v.id < n) edgeList.push([v.id, n])
    }
    return edgeList
  }

  // Map<ID do Vertice, Distancia do Start>
  distancesFrom(start: number): Map<number, number> {
    const dist = new Map<number, number>()
    dist.set(start, 0)
    const queue = [start]

    for (let i = 0; i < queue.length; i++) {
      const current = queue[i]
      for (const n of this.getVertex(current).neighbors) {
        if (!dist.has(n)) {
          dist.set(n, dist.get(current)! + 1)
          queue.push(n)
        }
      }
    }
    return dist
  }

  isConnected(): boolean {
    if (this.size === 0) return true;
    const verticesIDs = [...this.vertices.keys()]
    const first = verticesIDs[0]
    const reachableVertices = this.distancesFrom(first).size
    return reachableVertices === this.size
  }

  findWeakPoints() {
    const pre = new Map<number, number>()
    const low = new Map<number, number>()
    const bridges: [number, number][] = []
    const articulations = new Set<number>()
    let time = 0

    const DFS = (u: number, parent: number | null): void => {
      pre.set(u, time)
      low.set(u, time)
      time++
      let children = 0

      for (const v of this.getVertex(u).neighbors) {
        if (v === parent) continue

        if (pre.has(v)) low.set(u, Math.min(low.get(u)!, pre.get(v)!))
        else {
          children++
          DFS(v, u)
          low.set(u, Math.min(low.get(u)!, low.get(v)!))

          if (low.get(v)! > pre.get(u)!) bridges.push([Math.min(u, v), Math.max(u, v)])

          if (parent !== null && low.get(v)! >= pre.get(u)!) articulations.add(u)
        }
      }

      if (parent === null && children > 1) articulations.add(u)
    }

    for (const v of this.vertices.keys()) {
      if (!pre.has(v)) DFS(v, null)
    }

    this.bridges = bridges
    this.articulations = [...articulations]
  }

  isBridge(a: number, b: number): boolean {
    if (!this.hasEdge(a, b)) throw new Error(`Aresta ${a}-${b} não existe`)
    if (!this.bridges) throw new Error("Weakpoints desatualizado")

    const [x, y] = a < b ? [a, b] : [b, a]
    return this.bridges.some(([p, q]) => p === x && q === y)
  }

  isArticulation(id: number): boolean {
    this.getVertex(id)
    if(!this.articulations) throw new Error("Weakpoints desatualizado")

    return this.articulations.includes(id)
  }

  getTwoEdgeConnectedComponents(): number[][] {
    if(!this.bridges) this.findWeakPoints() 

    const visited = new Set<number>()
    const componentList: number[][] = []

    for (const vertex of this.allVertices()) {
      if (visited.has(vertex.id)) continue

      const component: number[] = []
      const toVisit = [vertex.id]
      visited.add(vertex.id)

      while (toVisit.length > 0) {
        const u = toVisit.pop()!
        component.push(u)

        for (const n of this.getVertex(u).neighbors) {
          if (visited.has(n) || this.isBridge(u, n)) continue
          visited.add(n)
          toVisit.push(n)
        }
      }

      componentList.push(component)
    }

    return componentList
  }

  getBridges() {
    if(!this.bridges) this.findWeakPoints()
    return this.bridges
  }

  getArticulations() {
    if(!this.articulations) this.findWeakPoints()
    return this.articulations
  }

  static getSimplifiedGraph(graph: Graph<any>, maxRemovals: number) {
    const newGraph = graph.clone()
    newGraph.findWeakPoints()

    for (let i = 0; i < maxRemovals; i++) {
      const edge = [...newGraph.allEdges()].find(([a, b]) => !newGraph.isBridge(a, b))

      if (!edge) break

      newGraph.removeEdge(...edge)
      newGraph.findWeakPoints()
    }

    return newGraph
  }
}
