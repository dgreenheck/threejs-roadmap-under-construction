import * as THREE from 'three';
import noiseShader from './shaders/noise.glsl?raw';
import planetVertexShader from './shaders/planet.vert?raw';
import planetFragmentShader from './shaders/planet.frag?raw';


export const planetParams = {
  type: { value: 2 },
  radius: { value: 20.0 },
  amplitude: { value: 1.19 },
  sharpness: { value: 2.6 },
  offset: { value: -0.016 },
  period: { value: 0.6 },
  persistence: { value: 0.484 },
  lacunarity: { value: 1.6 },
  octaves: { value: 10 },
  undulation: { value: 0.0 },
  ambientIntensity: { value: 0.15 },
  diffuseIntensity: { value: 1 },
  specularIntensity: { value: 2 },
  shininess: { value: 10 },
  lightDirection: { value: new THREE.Vector3(1, 1, 1) },
  lightColor: { value: new THREE.Color(0xffffff) },
  bumpStrength: { value: 1.0 },
  bumpOffset: { value: 0.001 },
  color1: { value: new THREE.Color(0.014, 0.117, 0.279) },
  color2: { value: new THREE.Color(0.080, 0.527, 0.351) },
  color3: { value: new THREE.Color(0.620, 0.516, 0.372) },
  color4: { value: new THREE.Color(0.149, 0.254, 0.084) },
  color5: { value: new THREE.Color(0.150, 0.150, 0.150) },
  transition2: { value: 0.071 },
  transition3: { value: 0.215 },
  transition4: { value: 0.372 },
  transition5: { value: 1.2 },
  blend12: { value: 0.152 },
  blend23: { value: 0.152 },
  blend34: { value: 0.104 },
  blend45: { value: 0.168 }
};

export class Planet extends THREE.Mesh {
  constructor() {
    const material = new THREE.ShaderMaterial({
      uniforms: planetParams,
      vertexShader: `${noiseShader}\n${planetVertexShader}`,
      fragmentShader: `${noiseShader}\n${planetFragmentShader}`
    });

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    super(geometry, material);
    this.geometry.computeTangents();
  }
} 