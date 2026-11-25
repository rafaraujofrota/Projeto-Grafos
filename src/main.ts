import { generateDungeon, getRoomColorList, type DungeonConfig } from "./dungeon"
import { updateText } from "./experiments"
import { rectCenter, type Rect } from "./geometry"
import { Graph } from "./graph"

const canvasElement = document.getElementById("canvas")
const canvas = canvasElement as HTMLCanvasElement
const ctx = canvas.getContext("2d")

export function getInputData(id: string): number {
  const element = document.getElementById(id) as HTMLInputElement
  if(!element) console.log(`Input ${id} não foi criado`)
  return Number(element.value)
}

export function getEl(id: string) {
  const el = document.getElementById(id)
  if(!el) console.log("Sem elemento com Id: " + id)
  return el
}

export function renderGraph(graph: Graph<Rect>) {
  if(!canvas || !ctx) {
    console.log("Elemento canvas não existe")
    return
  }

  dungeonGraph = graph

  // Fundo
  ctx.fillStyle = "#b6b6b6"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Arestas
  ctx.lineWidth = 8
  ctx.lineCap = "round"
  for (const [a, b] of graph.allEdges()) {
    ctx.strokeStyle = "#000000"
    if(graph.isBridge(a, b)) ctx.strokeStyle = "#ff0000"
    const pa = rectCenter(graph.getVertex(a).data) 
    const pb = rectCenter(graph.getVertex(b).data) 
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }

  // Salas
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.lineWidth = 3
  const distances = graph.distancesFrom(0)
  const roomColorList = getRoomColorList(graph.getTwoEdgeConnectedComponents())

  for (const v of graph.allVertices()) {
    const { height, position, width } = v.data;
    ctx.fillStyle = roomColorList.get(v.id)!
    ctx.fillRect(position.x, position.y, width, height)
    
    ctx.strokeStyle = "#2c2c2b"
    if(graph.isArticulation(v.id)) ctx.strokeStyle = "#ff0000"
    ctx.strokeRect(position.x, position.y, width, height)
    
    ctx.fillStyle = "#2800ff"
    ctx.font = "bold 14px Montserrat"
    const cX = rectCenter(v.data).x
    const cY = rectCenter(v.data).y
    ctx.fillText(String(v.id), cX, cY - 7)
    ctx.font = "12px Montserrat"
    ctx.fillText("Dist: " + String(distances.get(v.id)), cX, cY + 7)
  }

  updateText(graph)
}

export let dungeonGraph: Graph<Rect>

function renderNewDungeon() {
  const config: DungeonConfig = {
    loopChance: getInputData("loops") / 100,
    maxRoomSize: 150,
    minRoomSize: 50,
    roomCount: getInputData("rooms"),
    roomGap: 20,
  }

  dungeonGraph = generateDungeon(config)

  while(!dungeonGraph.isConnected()) {
    dungeonGraph = generateDungeon(config)
  }

  dungeonGraph.findWeakPoints()
  renderGraph(dungeonGraph)
}

renderNewDungeon()

// Botões 
getEl("generate")?.addEventListener("click", () => renderNewDungeon())
getEl("simplify")?.addEventListener("click", () => {
  dungeonGraph = Graph.getSimplifiedGraph(dungeonGraph, 1)
  renderGraph(dungeonGraph)
})
getEl("simplifyMax")?.addEventListener("click", () => {
  dungeonGraph = Graph.getSimplifiedGraph(dungeonGraph, Infinity)
  renderGraph(dungeonGraph)
})