import type { Rect } from "./geometry"
import { Graph } from "./graph"
import { dungeonGraph, getEl, renderGraph } from "./main";

export interface JSONDungeonData {
  vertices: { id: number; data: Rect }[]
  edges: [number, number][]
}

let savedGraph: Graph<Rect>
let savedMiddleGraph: Graph<Rect>
let savedFinalGraph: Graph<Rect>

function getGraphData(g: Graph<Rect>) {
  const comps = g.getTwoEdgeConnectedComponents()
  const nonTrivialComps = comps.filter((c) => c.length > 1).length
  return {
    vertices: g.size,
    edges: g.allEdges().length,
    bridges: g.getBridges()?.length,
    articulations: g.getArticulations()?.length,
    componentsTotal: comps.length,
    componentsWithCycles: nonTrivialComps,
    connected: g.isConnected(),
  }
}

function getGraphJSON(g: Graph<Rect>): JSONDungeonData {
  return {
    vertices: [...g.allVertices()].map((v) => ({ id: v.id, data: v.data })),
    edges: g.allEdges(),
  }
}

function getGraphFromJSON(json: JSONDungeonData): Graph<Rect> {
  const g = new Graph<Rect>()
  for (const v of json.vertices) g.addVertex(v.id, v.data)
  for (const [a, b] of json.edges) g.addEdge(a, b)
  g.findWeakPoints()
  return g
}

export function updateText(graph: Graph<any>) {
  const currentData = getGraphData(graph)
  const dataText = getEl("dataText")
  if(!dataText) return


  dataText.innerHTML = `
    <b>Métricas Atuais:</b>
    Salas (|V|): <b>${currentData.vertices}</b> |
    Corredores (|E|): <b>${currentData.edges}</b> |
    Pontes: <b style="color:#c00">${currentData.bridges}</b> |
    Articulações: <b style="color:#c00">${currentData.articulations}</b> |
    Comp. 2-Aresta-Conexas: <b>${currentData.componentsTotal}</b> 
    (${currentData.componentsWithCycles} com ciclos) |
    Conexo: <b>${currentData.connected ? "Sim" : "Não"}</b>
  `
}

// Botões
getEl("getDefault")?.addEventListener("click", async () => {
  const response = await fetch("/default.json")
  renderGraph(getGraphFromJSON(await response.json()))
})

getEl("export")?.addEventListener("click", () => {
  const json = JSON.stringify(getGraphJSON(dungeonGraph))
  const blob = new Blob([json], { type: "application/json" })

  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "dungeon.json"; a.click()
  URL.revokeObjectURL(a.href)
})

getEl("import")?.addEventListener("click", () => {
  const input = document.createElement("input")
  input.type = "file"; input.accept = ".json"
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    savedGraph = getGraphFromJSON(JSON.parse(await file.text()))
    renderGraph(savedGraph)
  }
  input.click()
})

getEl("startExperiment")?.addEventListener("click", () => {
  const tableEl = getEl("table")
  if(!tableEl) return

  savedGraph = dungeonGraph

  const n = savedGraph.size
  const pairs: [number, number][] = [
    [0, n - 1], [0, Math.floor(n / 2)],
    [Math.floor(n / 4), Math.floor((3 * n) / 4)],
  ]

  const treeEdgeCount = savedGraph.size - 1
  const extraEdges = savedGraph.allEdges().length - treeEdgeCount
  const halfExtra = Math.max(1, Math.floor(extraEdges / 2))

  savedMiddleGraph = Graph.getSimplifiedGraph(savedGraph, halfExtra)
  savedFinalGraph = Graph.getSimplifiedGraph(savedGraph, Infinity)

  const rows = [
    { nome: "Original", g: savedGraph },
    { nome: "Intermediária", g: savedMiddleGraph },
    { nome: "Final (Árvore)", g: savedFinalGraph },
  ] .map(({ nome, g }) => {
    const m = getGraphData(g)
    const dists = pairs.map(([a, b]) => g.distancesFrom(a).get(b) ?? -1)
    return { nome, ...m, dists }
  })

  tableEl.innerHTML = `
    <div class="tableTitle">Versão</div>
    <div class="tableTitle">|V|</div>
    <div class="tableTitle">|E|</div>
    <div class="tableTitle">Pontes</div>
    <div class="tableTitle">Articulações</div>
    <div class="tableTitle">Comp. 2-aresta-conexo (c/ ciclos)</div>
    <div class="tableTitle">Dist (${pairs[0][0]} → ${pairs[0][1]})</div>
    <div class="tableTitle">Dist (${pairs[1][0]} → ${pairs[1][1]})</div>
    <div class="tableTitle">Dist (${pairs[2][0]} → ${pairs[2][1]})</div>

    ${rows.map((r) => `
      <div>${r.nome}</div>
      <div>${r.vertices}</div>
      <div>${r.edges}</div>
      <div>${r.bridges}</div>
      <div>${r.articulations}</div>
      <div>${r.componentsTotal} (${r.componentsWithCycles})</div>
      <div>${r.dists[0]}</div>
      <div>${r.dists[1]}</div>
      <div>${r.dists[2]}</div>
    `).join("")}
  `
})

getEl("getOriginal")?.addEventListener("click", () => renderGraph(savedGraph))
getEl("getMiddle")?.addEventListener("click", () => renderGraph(savedMiddleGraph))
getEl("getFinal")?.addEventListener("click", () => renderGraph(savedFinalGraph))