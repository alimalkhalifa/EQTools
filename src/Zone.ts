import {
  Mesh, VertexData, Texture, SubMesh, MultiMaterial, Vector3, Angle, StandardMaterial,
} from 'babylonjs';
import { ipcRenderer } from 'electron';
import Spawns from "./Spawns";
import { SceneInterface, PlaceableInterface, StaticMeshInterface } from './GraphicsInterfaces';
import World from './World';
import BufferReader from './BufferReader';
import * as Jimp from 'jimp';
import createEverquestMaterial from './EverquestMaterial';
import Disposable from './Disposable';

export default class Zone implements Disposable {
  private geometry: Mesh;
  private materials: StandardMaterial[];
  private objects: PlaceableInterface[];
  private staticMeshes: StaticMeshInterface[];
  private spawns: Spawns;

  constructor(scene: SceneInterface) {
    this.createZone(scene);
    
    ipcRenderer.on('load_objects', (event, scene) => this.loadObjects(scene));
    ipcRenderer.send('request_objects', scene.name);

    this.spawns = new Spawns(scene.name.substr(0, scene.name.length - 4));
  }

  private async createZone(scene: SceneInterface) {
    let [geometry, materials, textures, objects] = await this.LoadScene(scene);

    this.geometry = Mesh.MergeMeshes(geometry, true, true, null, true, true);
    World.main.GetScene().addMesh(this.geometry);
    this.materials = materials;
    this.objects = objects;
  }

  private async LoadScene(scene: SceneInterface): Promise<[Mesh[], StandardMaterial[], Texture[], PlaceableInterface[]]> {
    return new Promise<[Mesh[], StandardMaterial[], Texture[], PlaceableInterface[]]>((resolve, reject) => {
      let materials: StandardMaterial[] = [];
      let geometry: Mesh[] = [];
      let textures: Texture[] = [];
      let objects: PlaceableInterface[] = [];

      let imagePromiseArray: Promise<void>[] = [];

      for (const texture of scene.textures) {
        imagePromiseArray.push(new Promise<void>((resolve, reject) => {
          let texBuffer = Buffer.from(texture.data);
          Jimp.read(texBuffer, (err, bmp) => {
            if (err) reject(err);
            bmp.getBase64(Jimp.MIME_PNG, (err, base64) => {
              if (err) reject(err);
              let tex = new Texture(base64, World.main.GetScene(), false, true, Texture.BILINEAR_SAMPLINGMODE);
              tex.name = texture.file_name;
              textures.push(tex);
              let alpha_buffer = Buffer.alloc(texBuffer.length);
              texBuffer.copy(alpha_buffer);
              let reader = new BufferReader(alpha_buffer);
              reader.seek(54);
              Jimp.intToRGBA(reader.readUInt32(), (err, blank_color) => { // reads colors in the wrong order
                if (err) reject(err);
                bmp.rgba(true, (err, bmpa) => {
                  if (err) reject(err);
                  bmpa.scan(0, 0, bmpa.getWidth(), bmpa.getHeight(), function(x, y, idx) {
                    let rgba = { // lol this is such a hacky solution :D
                      g: this.bitmap.data[idx],
                      b: this.bitmap.data[idx+1],
                      a: this.bitmap.data[idx+2],
                      r: 0,
                    }
                    if (
                      rgba.r === blank_color.r &&
                      rgba.g === blank_color.g &&
                      rgba.b === blank_color.b &&
                      rgba.a === blank_color.a
                    ) {
                      this.bitmap.data[idx+3] = 0;
                    } else {
                      this.bitmap.data[idx+3] = 255
                    }
                  }, (err, alpha) => {
                    if (err) reject(err);
                    alpha.getBase64(Jimp.MIME_PNG, (err, alpha_base64) => {
                      if (err) reject(err);
                      let alphaTex = new Texture(alpha_base64, World.main.GetScene(), false, true, Texture.BILINEAR_SAMPLINGMODE);
                      alphaTex.name = `${texture.file_name}a`;
                      alphaTex.hasAlpha = true;
                      textures.push(alphaTex);
                      resolve();
                    });
                  });
                });
              });
            });
          });
        }));
      }

      Promise.all(imagePromiseArray).then(() => {
        for (const wld of scene.wlds) {
          objects.push(...wld.objects);
          for (const material of wld.materials) {
            const diffuseTextures: Texture[] = [];
            for (const texture of material.textures) {
              if (material.masked) {
                diffuseTextures.push(textures.find((value) => value.name === `${texture}a`));
              } else {
                diffuseTextures.push(textures.find((value) => value.name === texture));
              }
            }
            const mat = createEverquestMaterial(material.name, World.main.GetScene(), material.clear, material.frame_delay, diffuseTextures[0].name === "fire1.bmpa", diffuseTextures);
            mat.metadata = {
              id: material.id,
              wld: wld.file_name,
            };
            materials.push(mat);
          }
          for (const mesh of wld.meshes) {
            const vertexData = new VertexData();
            vertexData.positions = [];
            vertexData.uvs = [];
            vertexData.indices = [];
            for (const vertex of mesh.vertices) {
              vertexData.positions.push(...[
                vertex.x * mesh.scale + mesh.center.x,
                vertex.z * mesh.scale + mesh.center.z,
                vertex.y * mesh.scale + mesh.center.y,
              ]);
            }
            for (const uv of mesh.uvs) {
              vertexData.uvs.push(...[
                uv.x,
                uv.y,
              ]);
            }
            for (const index of mesh.polygons) {
              vertexData.indices.push(...[index.vertex1, index.vertex3, index.vertex2]);
            }
            const geo = new Mesh(mesh.name, World.main.GetAssetStore());
            vertexData.applyToMesh(geo);

            geo.subMeshes = [];
            const mesh_materials: StandardMaterial[] = [];
            let index_head = 0;
            for (let i = 0; i < mesh.polygon_indices.length; i++) {
              mesh_materials.push(materials.find((value) => value.metadata.wld === wld.file_name && value.metadata.id === mesh.materials_list[mesh.polygon_indices[i].index]));
              new SubMesh(i, 0, vertexData.positions.length, index_head, mesh.polygon_indices[i].count * 3, geo);
              index_head += mesh.polygon_indices[i].count * 3;
            }
            const material = new MultiMaterial(`${mesh.name}-multimat`, World.main.GetScene());
            material.subMaterials.push(...mesh_materials);
            geo.material = material;
            geo.metadata = {
              id: mesh.id,
              wld: wld.file_name
            };
            geometry.push(geo);
          }
        }
        resolve([geometry, materials, textures, objects]);
      }).catch(err => {
        reject(err);
      });
    });
  }

  private async loadObjects(scene: SceneInterface) {
    let [geometry, materials, textures, objects] = await this.LoadScene(scene);

    let objectGeometry = [];

    this.staticMeshes = scene.wlds[0].static_meshes;
    let meshGeometries: Mesh[] = [];
    let meshReferences = scene.wlds[0].mesh_references;
    this.materials.push(...materials);
    
    for (let static_mesh of this.staticMeshes) {
      let geo_array: Mesh[] = [];
      for (let mesh_reference of static_mesh.mesh_references) {
        let reference = meshReferences.find(value => value.id === mesh_reference)
        geo_array.push(geometry.find(value => value.metadata.id === reference.reference));
      }
      let geo = Mesh.MergeMeshes(geo_array, false, false, undefined, false, true);
      geo.name = static_mesh.name;
      meshGeometries.push(geo);
    }

    for (let position of this.objects) {
      let meshGeo = meshGeometries.find(value => value.name === position.object_name);
      let geo = meshGeo.createInstance(`${position.object_name} - ${position.position.x}, ${position.position.y}, ${position.position.z}`);
      geo.position = new Vector3(position.position.x, position.position.z, position.position.y);
      geo.rotation = new Vector3(
        Angle.FromDegrees(position.rotation.x).radians(),
        -Angle.FromDegrees(position.rotation.z).radians(),
        Angle.FromDegrees(position.rotation.y).radians()
      );
      geo.scaling = new Vector3(position.scale.x, position.scale.y, position.scale.x);
      World.main.GetScene().addMesh(geo);
      objectGeometry.push(geo);
    }
    for (let geo of geometry) {
      geo.dispose();
    }
  }

  public Dispose() {
    this.spawns.DisposeAll();
    //this.geometry.dispose();
  }
}
