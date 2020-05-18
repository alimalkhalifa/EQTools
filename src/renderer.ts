import World from './World';
import { ipcRenderer } from 'electron';
import { SceneInterface } from './GraphicsInterfaces';

let canvas: HTMLCanvasElement = document.getElementById('render-canvas') as HTMLCanvasElement;
let canvasContainer = document.getElementById('render-canvas-container') as HTMLDivElement;
let canvasOverlay = document.getElementById('render-overlay') as HTMLDivElement;
let inspector = document.getElementById('inspector') as HTMLDivElement;
let world: World = new World(canvas, inspector, canvasContainer, canvasOverlay);

ipcRenderer.on('load_zone', (event, scene: SceneInterface) => {
  console.log("Loading Zone");
  world?.Dispose();
  canvasOverlay.style.visibility = "visible";
  setTimeout(() => world.LoadZone(scene), 3 * 1000);
})