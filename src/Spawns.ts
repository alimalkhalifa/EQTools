import Spawn2Model from "./models/Spawn2Model";
import { Mesh, Vector3, PickingInfo, PointerEventTypes } from 'babylonjs';
import World from "./World";
import Clickable from "./Clickable";
import Selectable from "./Selectable";
import DatabaseListeners from "./DatabaseListener";
import Destroyable from "./Destroyable";

export class Spawn implements Clickable, Selectable, Destroyable {
  id!: number;
  spawngroupID!: number;
  zone!: number;
  version!: number;
  x!: number;
  y!: number;
  z!: number;
  heading!: number;
  respawntime!: number;
  variance!: number;
  pathgrid!: number;
  _condition!: number;
  cond_value!: number;
  enabled!: number;
  animation!: number;

  private mesh: Mesh;

  constructor(from: Spawn2Model) {
    this.id = from.id;
    this.spawngroupID = from.spawngroupID;
    this.zone = from.zone;
    this.version = from.version;
    this.x = from.x;
    this.y = from.y;
    this.z = from.z;
    this.heading = from.heading;
    this.respawntime = from.respawntime;
    this.variance = from.variance;
    this.pathgrid = from.pathgrid;
    this._condition = from._condition;
    this.cond_value = from.cond_value;
    this.enabled = from.enabled;
    this.animation = from.animation;

    this.mesh = Mesh.CreateSphere(`spawn-${this.id}`, 8, 2, World.main.getScene());
    this.mesh.position = new Vector3(this.y, this.z, this.x);
    this.mesh.material = World.spawnMaterial;
    this.mesh.isPickable = true;
    this.mesh.metadata = this;
  }

  onClick(event: PointerEvent, info: PickingInfo, type: PointerEventTypes) {
    World.select(this);
    console.log(World.getSelection());
    console.log('selected');
  }

  onSelect() {}
  onUnselect() {}

  destroy() {
    this.mesh.dispose();
  }
}

export default class Spawns implements DatabaseListeners {
  private list: Spawn[];
  private zone: string;

  constructor(zone: string) {
    this.zone = zone;
    World.main.addToDatabaseListeners(this);
  }

  async loadSpawns(zone: string) {
    this.list = [];
    Spawn2Model.findAll({
      where: {
        zone
      }
    }).then(spawns => {
      spawns.forEach(row => {
        this.list.push(new Spawn(row))
      });
    }).catch(err => {
      throw err;
    });
  }

  loadFromDatabase() {
    this.loadSpawns(this.zone);
  }

  disconnectedFromDatabase() {
    this.list.forEach(spawn => {
      spawn.destroy();
    });
    this.list = [];
  }
}