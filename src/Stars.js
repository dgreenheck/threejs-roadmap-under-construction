import * as THREE from 'three';
import starsVertexShader from './shaders/stars.vert?raw';
import starsFragmentShader from './shaders/stars.frag?raw';

export class Stars extends THREE.Points {
  constructor() {
    const geometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const colorArray = new Float32Array(starsCount * 4);
    const sizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 200;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const whiteColor = [0.9, 0.9, 0.9, 1];      // slightly dimmed white
      const coloredStars = [
        [0.8, 0.2, 0.2, 1],      // desaturated red
        [0.9, 0.6, 0.3, 1],      // desaturated orange
        [0.3, 0.3, 0.8, 1]       // desaturated blue
      ];

      let selectedColor;
      if (Math.random() < 0.75) {
        selectedColor = whiteColor;
      } else {
        selectedColor = coloredStars[Math.floor(Math.random() * coloredStars.length)];
      }

      colorArray[i * 4] = selectedColor[0];
      colorArray[i * 4 + 1] = selectedColor[1];
      colorArray[i * 4 + 2] = selectedColor[2];
      colorArray[i * 4 + 3] = selectedColor[3];

      sizes[i] = 5 * Math.random() + 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.3 }
      },
      vertexShader: starsVertexShader,
      fragmentShader: starsFragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    super(geometry, material);
  }

  update(camera) {
    this.position.copy(camera.position);
  }
} 