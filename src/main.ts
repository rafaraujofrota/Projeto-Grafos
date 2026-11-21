import { generateDungeon, type DungeonConfig } from "./dungeon"
import { rectCenter, type Rect } from "./geometry"
import type { Graph } from "./graph"

const canvasElement = document.getElementById("canvas")
const canvas = canvasElement as HTMLCanvasElement
const ctx = canvas.getContext("2d")

const generateButton = document.getElementById("generate")
const simplifyButton = document.getElementById("simplify")
const simplifyMaxButton = document.getElementById("simplifyMax")

function getInputData(id: string): number {
  const element = document.getElementById(id) as HTMLInputElement
  if(!element) console.log(`Input ${id} não foi criado`)
  return Number(element.value)
}

function renderGraph(dungeonGraph: Graph<Rect>) {
  if(!canvas || !ctx) {
    console.log("Elemento canvas não existe")
    return
  }
  // Fundo
  ctx.fillStyle = "#b6b6b6"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Arestas
  ctx.lineWidth = 8
  ctx.lineCap = "round"
  for (const [a, b] of dungeonGraph.allEdges()) {
    ctx.strokeStyle = "#000000"
    if(dungeonGraph.isBridge(a, b)) ctx.strokeStyle = "#ff0000"
    const pa = rectCenter(dungeonGraph.getVertex(a).data) 
    const pb = rectCenter(dungeonGraph.getVertex(b).data) 
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }

  // Salas
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.lineWidth = 3
  const distances = dungeonGraph.distancesFrom(0)

  for (const v of dungeonGraph.allVertices()) {
    const { height, position, width } = v.data;
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(position.x, position.y, width, height)
    
    ctx.strokeStyle = "#2c2c2b"
    if(dungeonGraph.isArticulation(v.id)) ctx.strokeStyle = "#ff0000"
    ctx.strokeRect(position.x, position.y, width, height)
    
    ctx.fillStyle = "#2800ff"
    ctx.font = "bold 14px Montserrat"
    const cX = rectCenter(v.data).x
    const cY = rectCenter(v.data).y
    ctx.fillText(String(v.id), cX, cY - 7)
    ctx.font = "12px Montserrat"
    ctx.fillText("Dist: " + String(distances.get(v.id)), cX, cY + 7)
  }
}

let dungeonGraph: Graph<Rect>

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

function renderSimplifiedDungeon(dungeonGraph: Graph<Rect>, max: boolean) {
  let isSimple = false

  while (!isSimple) {
    isSimple = true

    for (const [a, b] of dungeonGraph.allEdges()) {
      if (!dungeonGraph.isBridge(a, b)) {
        isSimple = false
        dungeonGraph.removeEdge(a, b) 
        dungeonGraph.findWeakPoints()
        if(!max) {
          renderGraph(dungeonGraph)
          return
        }
        else break            
      }
    }
  }

  renderGraph(dungeonGraph)
}

renderNewDungeon()

// Botões
if(!generateButton) console.log("Sem botão de Gerar")
if(!simplifyButton) console.log("Sem botão de Simplificar")
if(!simplifyMaxButton) console.log("Sem botão de SimplificarMax")

generateButton?.addEventListener("click", () => renderNewDungeon())
simplifyButton?.addEventListener("click", 
  () => renderSimplifiedDungeon(dungeonGraph, false)
)
simplifyMaxButton?.addEventListener("click", 
  () => renderSimplifiedDungeon(dungeonGraph, true)
)