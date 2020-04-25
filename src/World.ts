import {
  Vector3, Scene, Engine, FreeCamera, Color3, Observer, StandardMaterial,
} from 'babylonjs';
import { ipcRenderer } from 'electron';
import Zone from './Zone';
import { SceneInterface } from './GraphicsInterfaces';
import { Sequelize } from 'sequelize';
import { initSpawn2Model } from './models/Spawn2Model';
import { Spawn } from './Spawns';
import Clickable from './Clickable';
import Selectable from './Selectable';
import DatabaseListeners from './DatabaseListener';

export default class World {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private assetStore: Scene;
  private zone: Zone;
  private time: number;
  private sequelize: Sequelize;
  private databaseToLoadListeners: DatabaseListeners[] = [];

  private static selection: Selectable;

  public static main: World;
  public static spawnMaterial: StandardMaterial;

  constructor(canvas: HTMLCanvasElement) {
    this.time = 0.0;
    World.main = this;
    const engine = new Engine(canvas, true);
    this.createScene(canvas, engine);
    this.createMaterials();
    this.hookupSelection();

    engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      engine.resize();
    });

    ipcRenderer.on('load_zone', (event, scene) => {
      this.loadZone(scene);
    });

    ipcRenderer.on('connect_database', (event, host, port, database, username, password) => {
      this.sequelize?.close();
      this.sequelize = new Sequelize(database, username, password, {
        host: host,
        port: port,
        dialect: 'mariadb'
      });

      this.sequelize.authenticate().then(() => {
        console.log("Connected to Database");
        ipcRenderer.send('connected_database', true);
        initSpawn2Model(this.sequelize);
        this.sendEventLoadFromDatabase();
      }).catch(err => {
        ipcRenderer.send('connected_database', false, err);
      });
    });

    ipcRenderer.on('disconnect_database', () => {
      this.sequelize.close();
      this.sendEventDisconnectedFromDatabase();
    });

    ipcRenderer.on('is_database_connected', () => {
      ipcRenderer.send('is_database_connected_response', this.sequelize ? true : false);
    })
  }

  public getScene(): Scene {
    return this.scene;
  }

  public getAssetStore(): Scene {
    return this.assetStore;
  }

  createScene(canvas: HTMLCanvasElement, engine: Engine): void {
    this.canvas = canvas;
    this.engine = engine;
    const scene = new Scene(engine);
    this.scene = scene;
    this.assetStore = new Scene(engine, { virtual: true })
    const camera = new FreeCamera('cam', new Vector3(0, 5, -10), scene);
    camera.setTarget(new Vector3(0, 0, 0));
    camera.attachControl(canvas, true);
    scene.ambientColor = Color3.White();
  }

  loadZone(scene: SceneInterface) {
    this.zone = new Zone(scene);
  }

  createMaterials() {
    World.spawnMaterial = new StandardMaterial("spawnMaterial", this.scene);
    World.spawnMaterial.emissiveColor = Color3.Green();
  }

  hookupSelection() {
    this.scene.onPointerDown = (event, info, type) => {
      let clicked: Clickable | undefined = info.pickedMesh.metadata;
      if (clicked && clicked.onClick) {
        (clicked as Clickable).onClick(event, info, type);
      }
    }
  }

  getDatabaseConnection() {
    return this.sequelize;
  }

  public static getSelection() {
    return World.selection
  }

  public static select(selectable: Selectable) {
    this.selection = selectable;
  }

  addToDatabaseListeners(node: DatabaseListeners) {
    this.databaseToLoadListeners.push(node);
  }

  removeFromDatabaseListeners(node: DatabaseListeners) {
    let index = this.databaseToLoadListeners.indexOf(node);
    this.databaseToLoadListeners.splice(index, 1);
  }

  sendEventLoadFromDatabase() {
    this.databaseToLoadListeners.forEach(listener => {
      listener.loadFromDatabase()
    });
  }

  sendEventDisconnectedFromDatabase() {
    this.databaseToLoadListeners.forEach(listener => {
      listener.disconnectedFromDatabase()
    });
  }
}
