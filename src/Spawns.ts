import Spawn2Model from "./models/Spawn2Model";
import { Mesh, Vector3, PickingInfo, PointerEventTypes } from 'babylonjs';
import World from "./World";
import Clickable from "./Clickable";
import Selectable from "./Selectable";
import DatabaseListeners from "./DatabaseListener";
import Destroyable from "./Destroyable";

export class Spawn implements Clickable, Selectable, Destroyable {
  private spawn2: Spawn2Model;

  private mesh: Mesh;

  constructor(from: Spawn2Model) {
    this.spawn2 = from;

    this.mesh = Mesh.CreateSphere(`spawn-${this.spawn2.id}`, 8, 2, World.main.getScene());
    this.mesh.position = new Vector3(this.spawn2.y, this.spawn2.z, this.spawn2.x);
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
    this.destroyAll();
  }

  destroyAll() {
    this.list.forEach(spawn => {
      spawn.destroy();
    });
    this.list = [];
  }
}