import { Scene, Texture, StandardMaterial, Color3, Engine } from 'babylonjs';

export default function createEverquestMaterial(name: string, scene: Scene, clear: boolean, frame_delay: number, fire: boolean, diffuseTextures: Texture[]): StandardMaterial {
  let mat = new StandardMaterial(name, scene);

  if (clear) {
    mat.alpha = 0.0;
  } else {
    mat.diffuseTexture = diffuseTextures[0];
    mat.ambientColor = Color3.White();
    if (fire) {
      mat.useAlphaFromDiffuseTexture = true;
      mat.alphaMode = Engine.ALPHA_ADD;
    }
  }

  return mat;
}

/*
export default function createEverquestMaterial(name: string, scene: Scene, clear: boolean, frame_delay: number, fire: boolean, diffuseTextures: Texture[]): ShaderMaterial {
  let mat = new ShaderMaterial(name, scene, "./eqshader", {
    attributes: [ 'position', 'uv' ],
    uniforms: [ "world", "worldView", "worldViewProjection", "view", "projection", "time", "direction", "frameTime", "frameCount" ],
    defines: [
      ...(clear ? [ '#define CLEAR' ] : []),
      ...(diffuseTextures[0].hasAlpha ? ['#define MASKED'] : []),
      ...(fire ? ['#define FIRE'] : [])
    ],
    samplers: [
      'diffuseTexture_0', 'diffuseTexture_1', 'diffuseTexture_2', 'diffuseTexture_3', 'diffuseTexture_4', 'diffuseTexture_5', 'diffuseTexture_6', 'diffuseTexture_7',
      'maskTexture_0', 'maskTexture_1', 'maskTexture_2', 'maskTexture_3', 'maskTexture_4', 'maskTexture_5', 'maskTexture_6', 'maskTexture_7',
    ],
    needAlphaBlending: fire,
    needAlphaTesting: (clear || diffuseTextures[0].hasAlpha !== null)
  });

  mat.setInt("frameCount", diffuseTextures.length <= 8 ? diffuseTextures.length : 8);
  mat.setFloat("frameTime", frame_delay);
  for (let i = 0; (i < diffuseTextures.length) && (i < 8); i++) {
    mat.setTexture(`diffuseTexture_${i}`, diffuseTextures[i]);
  }
  if (fire) mat.alphaMode = 1;

  return mat;
}
*/
