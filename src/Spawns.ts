import Spawn2Model from "./models/Spawn2Model";
import { Mesh, Vector3, PickingInfo, PointerEventTypes } from 'babylonjs';
import World from "./World";
import Clickable from "./Clickable";
import Selectable from "./Selectable";
import DatabaseListeners from "./DatabaseListener";
import Disposable from "./Disposable";
import IdWidgetInterface from "./inspectorInterfaces/IdWidgetInterface";
import InspectorWidgetFactory from "./inspectorWidgetFactories/InspectorWidgetFactory";
import DataWidgetInterface from "./inspectorInterfaces/DataWidgetInterface";
import PositionWidgetInterface from "./inspectorInterfaces/PositionWidgetInterface";
import CommitWidgetInterface from "./inspectorInterfaces/CommitWidgetInterface";
import SpawngroupModel from "./models/SpawngroupModel";
import DataFieldFactory from "./inspectorWidgetFactories/DataFieldFactory"

export class Spawn implements Clickable, Selectable, Disposable, IdWidgetInterface, DataWidgetInterface, PositionWidgetInterface, CommitWidgetInterface {
  private spawn2: Spawn2Model;
  private spawngroup: SpawngroupModel;
  private spawngroupInspector: HTMLDivElement;
  private mesh: Mesh;
  private modified: boolean = false;
  private commitButton: HTMLButtonElement;
  private revertButton: HTMLButtonElement;

  constructor(from: Spawn2Model) {
    this.spawn2 = from;

    this.mesh = Mesh.CreateSphere(`spawn-${this.spawn2.id}`, 8, 2, World.main.GetScene());
    this.mesh.position = new Vector3(this.spawn2.y, this.spawn2.z, this.spawn2.x);
    this.mesh.material = World.spawnMaterial;
    this.mesh.isPickable = true;
    this.mesh.metadata = this;
  }

  onClick(event: PointerEvent, info: PickingInfo, type: PointerEventTypes) {
    World.Select(this);
  }

  async onSelect() {
    await this.UpdateSpawngroup(false);
    this.CreateInspector();
  }
  onUnselect() {
    let inspector = World.main.GetInspector();
    this.ClearDOMElementChildrenByRecursion(inspector);
  }

  ClearDOMElementChildrenByRecursion(elem: ChildNode) {
    while (elem.firstChild) {
      this.ClearDOMElementChildrenByRecursion(elem.firstChild);
      elem.firstChild.remove();
    }
  }

  Dispose() {
    this.mesh?.dispose();
  }

  CreateInspector() {
    let inspector = World.main.GetInspector();
    inspector.append(InspectorWidgetFactory("Spawn", this.CreateIdWidget()));
    inspector.append(InspectorWidgetFactory("Position", this.CreatePositionWidget()));
    inspector.append(InspectorWidgetFactory("Data", this.CreateDataWidget()));
    this.spawngroupInspector = InspectorWidgetFactory("Spawn Group", this.CreateSpawngroupEditWidget());
    inspector.append(this.spawngroupInspector);
    inspector.append(InspectorWidgetFactory("Save to Database", this.CreateCommitWidget()));
  }

  CreateIdWidget() {
    let div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'row';
    div.style.alignItems = 'center';
    div.className = 'inspector__widget';

    let img = document.createElement('img');
    img.src = 'images/Spawn_Icon.png';

    let label = document.createElement('label');
    label.style.marginLeft = '14px';
    label.style.marginRight = '8px';
    label.innerText = "ID:";

    let input = document.createElement('input');
    input.type = 'text';
    input.style.flex = '1';
    input.style.height = '22px';
    input.style.marginRight = '14px';
    input.style.background = "#222";
    input.style.borderColor = "#222";
    input.style.color = "#888";
    input.disabled = true;
    input.value = this.spawn2.id.toString();

    div.append(img);
    div.append(label);
    div.append(input);

    return div;
  }

  CreatePositionWidget() {
    let div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.className = 'inspector__widget';

    div.append(DataFieldFactory("x", this.spawn2.x.toString(), "X", { type: 'numberMultiIncrement', rangeOptions: { step: '0.1' } }, (fieldName, value) => this.UpdateSpawn2Position(parseFloat(value), this.spawn2.y, this.spawn2.z)));
    div.append(DataFieldFactory("y", this.spawn2.y.toString(), "Y", { type: 'numberMultiIncrement', rangeOptions: { step: '0.1' } }, (fieldName, value) => this.UpdateSpawn2Position(this.spawn2.x, parseFloat(value), this.spawn2.z)));
    div.append(DataFieldFactory("z", this.spawn2.z.toString(), "Z", { type: 'numberMultiIncrement', rangeOptions: { step: '0.1' } }, (fieldName, value) => this.UpdateSpawn2Position(this.spawn2.x, this.spawn2.y, parseFloat(value))));
    div.append(DataFieldFactory("heading", this.spawn2.heading.toString(), "Heading", { type: 'range', rangeOptions: { min: "0", max: "360", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));

    return div;
  }

  CreateDataWidget() {
    let div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.className = 'inspector__widget';

    div.append(DataFieldFactory("zone", this.spawn2.zone, "Zone", null, (fieldName, value) => this.UpdateSpawn2(fieldName, value), true));
    div.append(DataFieldFactory("version", this.spawn2.version.toString(), "Version", { type: 'range', rangeOptions: { min: "0", max: "20", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("respawntime", this.spawn2.respawntime.toString(), "Respawn Time", { type: 'number', rangeOptions: { min: "0", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("variance", this.spawn2.variance.toString(), "Variance", { type: 'number', rangeOptions: { min: '0', step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("pathgrid", this.spawn2.pathgrid.toString(), "Path Grid", { type: 'number', rangeOptions: { min: '0', step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("_condition", this.spawn2._condition.toString(), "Condition", { type: 'number', rangeOptions: { min: '0', step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("cond_value", this.spawn2.cond_value.toString(), "Condition Value", { type: 'number', rangeOptions: { min: '0', step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("enabled", this.spawn2.enabled.toString(), "Enabled", { type: 'checkbox' }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("animation", this.spawn2.animation.toString(), "Animation", { type: 'number', rangeOptions: { min: "0", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("min_expansion", this.spawn2.min_expansion.toString(), "Min Expansion", { type: 'number', rangeOptions: { min: "0", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(DataFieldFactory("max_expansion", this.spawn2.max_expansion.toString(), "Max Expansion", { type: 'number', rangeOptions: { min: "0", step: '1' } }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));

    return div;
  }

  CreateCommitWidget() {
    let div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'row';
    div.style.alignItems = 'center';
    div.className = 'inspector__widget';
    
    this.commitButton = document.createElement('button');
    this.commitButton.innerText = "Unchanged";
    this.commitButton.style.flexGrow = "1";
    this.commitButton.style.background = "green";
    this.commitButton.style.color = "white";
    this.commitButton.addEventListener('click',  () => this.onCommit());

    this.revertButton = document.createElement('button');
    this.revertButton.innerText = "Revert";
    this.revertButton.style.width = "30%";
    this.revertButton.style.background = "green";
    this.revertButton.style.color = "white";
    this.revertButton.style.display = "none";
    this.revertButton.addEventListener('click', () => this.onRevert());

    this.UpdateCommitButton();

    div.append(this.commitButton);
    div.append(this.revertButton);

    return div;
  }

  UpdateCommitButton() {
    this.commitButton.disabled = !this.modified;
    this.commitButton.style.background = this.modified ? 'red' : 'green';
    this.commitButton.innerText = this.modified ? 'Commit' : 'Unchanged';
    this.revertButton.disabled = !this.modified;
    this.revertButton.style.display = this.modified ? "block" : "none";
  }

  async onCommit() {
    try {
      await this.spawn2.save();
      this.modified = false;
      this.UpdateCommitButton();
    } catch(err) {
      throw err;
    }
  }

  async onRevert() {
    try {
      let inspector = World.main.GetInspector();
      await this.spawn2.reload();
      this.mesh.position = new Vector3(this.spawn2.y, this.spawn2.z, this.spawn2.x);
      this.modified = false;
      this.ClearDOMElementChildrenByRecursion(inspector);
      this.CreateInspector();
    } catch(err) {
      throw err;
    }
  }

  CreateSpawngroupEditWidget() {
    let div = document.createElement('div');

    div.append(DataFieldFactory("spawngroupID", this.spawn2.spawngroupID.toString(), "Spawn Group ID", { type: "number", rangeOptions: { min: '0'} }, (fieldName, value) => this.UpdateSpawn2(fieldName, parseInt(value))));
    div.append(this.CreateHorizontalRule());
    div.append(DataFieldFactory("name", this.spawngroup.name, "Name", null, null));

    return div;
  }

  

  CreateHorizontalRule() {
    let hr = document.createElement('hr');
    return hr;
  }

  UpdateSpawn2(fieldName: string, data: any) {
    this.spawn2[fieldName] = data;
    this.modified = true;
    this.UpdateCommitButton();
  }

  UpdateSpawn2Position(x: number, y: number, z: number) {
    this.spawn2.x = x;
    this.spawn2.y = y;
    this.spawn2.z = z;
    this.mesh.position = new Vector3(this.spawn2.y, this.spawn2.z, this.spawn2.x);
    this.modified = true;
    this.UpdateCommitButton();
  }

  async UpdateSpawngroup(updateUI: boolean = true) {
    this.spawngroup = await SpawngroupModel.findOne({ where: { id: this.spawn2.spawngroupID } });
    if (updateUI) this.UpdateSpawngroupWidget();
  }

  UpdateSpawngroupWidget() {
    let inspector = World.main.GetInspector();
    this.ClearDOMElementChildrenByRecursion(this.spawngroupInspector);
    this.spawngroupInspector.remove();
    this.spawngroupInspector = InspectorWidgetFactory("Spawn Group", this.CreateSpawngroupEditWidget());
    inspector.insertBefore(this.spawngroupInspector, inspector.lastChild);
  }
}

export default class Spawns implements DatabaseListeners {
  private list: Spawn[];
  private zone: string;

  constructor(zone: string) {
    this.zone = zone;
    World.main.AddToDatabaseListeners(this);
  }

  async loadSpawns(zone: string) {
    this.DisposeAll();
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
    this.DisposeAll();
  }

  DisposeAll() {
    this.list?.forEach(spawn => {
      spawn.Dispose();
    });
    this.list = [];
  }
}