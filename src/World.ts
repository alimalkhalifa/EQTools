import {
  Vector3, Scene, Engine, FreeCamera, Color3, StandardMaterial, Mesh, InstancedMesh
} from 'babylonjs';
import { ipcRenderer } from 'electron';
import Zone from './Zone';
import { SceneInterface } from './GraphicsInterfaces';
import { Sequelize } from 'sequelize';
import { initSpawn2Model } from './models/Spawn2Model';
import Clickable from './Clickable';
import Selectable from './Selectable';
import DatabaseListeners from './DatabaseListener';
import DatabaseDetailsInterface from './DatabaseDetailsInterface';
import { initSpawngroupModel } from './models/SpawngroupModel';

export default class World {
  private canvas: HTMLCanvasElement;
  private overlay: HTMLDivElement;
  private inspector: HTMLDivElement;
  private container: HTMLDivElement;
  private camera: FreeCamera;
  private engine: Engine;
  private scene: Scene;
  private assetStore: Scene;
  private zone: Zone;
  private time: number;
  private sequelize: Sequelize;
  private databaseDetails: DatabaseDetailsInterface;
  private databaseToLoadListeners: DatabaseListeners[] = [];
  private databaseConnected = false;

  private static selection: Selectable;

  public static main: World;
  public static spawnMaterial: StandardMaterial;

  constructor(canvas: HTMLCanvasElement, inspector: HTMLDivElement, canvasContainer: HTMLDivElement, canvasOverlay: HTMLDivElement) {
    this.canvas = canvas;
    this.inspector = inspector;
    this.container = canvasContainer;
    this.overlay = canvasOverlay;
    this.time = 0.0;
    World.main = this;
    const engine = new Engine(canvas, true);
    this.CreateScene(canvas, engine);
    this.CreateMaterials();
    this.HookupSelection();

    engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      //engine.setSize(this.container.offsetWidth, this.container.offsetHeight);
      engine.resize();
    });

    ipcRenderer.on('connect_database', (event, host, port, database, username, password) => {
      this.ConnectToDatabase({
        host,
        port,
        database,
        username,
        password
      });
    });

    ipcRenderer.on('disconnect_database', () => {
      this.sequelize.close();
      this.SendEventDisconnectedFromDatabase();
      this.databaseConnected = false;
    });

    ipcRenderer.on('is_database_connected', () => {
      ipcRenderer.send('is_database_connected_response', this.sequelize ? true : false);
    })
  }

  public GetScene(): Scene {
    return this.scene;
  }

  public GetInspector(): HTMLDivElement {
    return this.inspector;
  }

  public GetAssetStore(): Scene {
    return this.assetStore;
  }

  public GetDatabaseDetails() {
    return this.databaseDetails;
  }

  CreateScene(canvas: HTMLCanvasElement, engine: Engine): void {
    this.canvas = canvas;
    this.engine = engine;
    const scene = new Scene(engine);
    this.scene = scene;
    this.assetStore = new Scene(engine, { virtual: true })
    this.camera = new FreeCamera('cam', new Vector3(0, 5, -10), scene);
    this.camera.setTarget(new Vector3(0, 0, 0));
    this.camera.attachControl(canvas, true);
    scene.ambientColor = Color3.White();
  }

  LoadZone(scene: SceneInterface) {
    this.overlay.style.visibility = "visible";
    this.overlay.innerHTML = "<div>Loading ...</div>";
    this.zone = new Zone(scene);
    if (this.databaseConnected) this.SendEventLoadFromDatabase();
    this.overlay.style.visibility = "hidden";
  }

  CreateMaterials() {
    World.spawnMaterial = new StandardMaterial("spawnMaterial", this.scene);
    World.spawnMaterial.emissiveColor = Color3.Green();
  }

  HookupSelection() {
    this.scene.onPointerDown = (event, info, type) => {
      let clicked: Clickable | undefined = info.pickedMesh.metadata;
      if (clicked && clicked.onClick) {
        (clicked as Clickable).onClick(event, info, type);
      }
    }
  }

  ConnectToDatabase(details: DatabaseDetailsInterface = null) {
    if (details) {
      this.databaseDetails = details;
    }

    this.sequelize?.close();
    this.sequelize = new Sequelize(
      this.databaseDetails.database,
      this.databaseDetails.username,
      this.databaseDetails.password,
      {
        host: this.databaseDetails.host,
        port: this.databaseDetails.port,
        dialect: 'mariadb'
      }
    );

    this.sequelize.authenticate().then(() => {
      console.log("Connected to Database");
      ipcRenderer.send('connected_database', true);
      initSpawn2Model(this.sequelize);
      initSpawngroupModel(this.sequelize);
      if (this.zone) this.SendEventLoadFromDatabase();
      this.databaseConnected = true;
    }).catch(err => {
      ipcRenderer.send('connected_database', false, err);
    });
  }

  GetDatabaseConnection() {
    return this.sequelize;
  }

  public static GetSelection() {
    return World.selection
  }

  public static Select(selectable: Selectable) {
    this.selection?.onUnselect();
    this.selection = selectable;
    this.selection.onSelect();
  }

  AddToDatabaseListeners(node: DatabaseListeners) {
    this.databaseToLoadListeners.push(node);
  }

  RemoveFromDatabaseListeners(node: DatabaseListeners) {
    let index = this.databaseToLoadListeners.indexOf(node);
    this.databaseToLoadListeners.splice(index, 1);
  }

  SendEventLoadFromDatabase() {
    this.databaseToLoadListeners.forEach(listener => {
      listener.loadFromDatabase()
    });
  }

  SendEventDisconnectedFromDatabase() {
    this.databaseToLoadListeners.forEach(listener => {
      listener.disconnectedFromDatabase()
    });
  }

  Dispose() {
    let length = this.assetStore.meshes.length;
    for (let i = 0; i < length; i++) {
      let mesh = this.assetStore.meshes[i];
      if (mesh && mesh.isAnInstance) {
        let instancedMesh = mesh as InstancedMesh;
        instancedMesh.dispose();
      }
      else {
        let meshMesh = mesh as Mesh;
        if (meshMesh && !meshMesh.isDisposed()) {
          mesh.dispose();
        }
      }
    }
    length = this.assetStore.materials.length;
    for (let i = 0; i < length; i++) {
      this.assetStore.materials[i]?.dispose();
    }
    console.log("Asset Store cleared");

    length = this.scene.meshes.length;
    for (let i = 0; i < length; i++) {
      let mesh = this.scene.meshes[i];
      if (mesh && mesh.isAnInstance) {
        let instancedMesh = mesh as InstancedMesh;
        instancedMesh.dispose();
      }
      else {
        let meshMesh = mesh as Mesh;
        if (meshMesh && !meshMesh.isDisposed()) {
          mesh.dispose();
        }
      }
    }
    length = this.scene.materials.length;
    for (let i = 0; i < length; i++) {
      this.scene.materials[i]?.dispose();
    }
    console.log("Scene cleared");

    if (this.zone) {
      this.zone.Dispose();
      console.log("Zone disposed");
      this.zone = null;
    }
  }
}
