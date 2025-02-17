import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  KernelSize,
  BlendFunction
} from "postprocessing";
import noiseShader from './shaders/noise.glsl?raw';
import planetVertexShader from './shaders/planet.vert?raw';
import planetFragmentShader from './shaders/planet.frag?raw';

window.onload = () => loadScene();

function loadScene() {
  const clock = new THREE.Clock(true);
  const container = document.getElementById('canvas-container');

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  camera.position.z = 90;

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType
  });

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomEffect = new BloomEffect({
    blendFunction: BlendFunction.SCREEN,
    kernelSize: KernelSize.MEDIUM,
    luminanceThreshold: 0.2,
    luminanceSmoothing: 0.5,
    intensity: 1,
    radius: 5.8
  });

  const bloomPass = new EffectPass(camera, bloomEffect);
  composer.addPass(bloomPass);

  const material = new THREE.ShaderMaterial({
    uniforms: planetParams,
    vertexShader: `${noiseShader}\n${planetVertexShader}`,
    fragmentShader: `${noiseShader}\n${planetFragmentShader}`
  });

  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), material);
  planet.geometry.computeTangents();
  scene.add(planet);

  const atmosphere = new Atmosphere(atmosphereParams);
  planet.add(atmosphere);

  // Create starry background
  function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 200;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random star colors (mostly white with hints of blue)
      colors[i * 3] = Math.random() * 0.2 + 0.8;
      colors[i * 3 + 1] = Math.random() * 0.2 + 0.8;
      colors[i * 3 + 2] = 1;

      // Random size between 1 and 3
      sizes[i] = Math.random() * 2 + 1;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      depthTest: true
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    return stars;
  }

  // Create and add stars to scene
  const stars = createStars();
  scene.add(stars);

  function animate() {
    requestAnimationFrame(animate);

    // Make stars follow camera
    stars.position.copy(camera.position);

    atmosphere.material.uniforms.time.value = clock.getElapsedTime();
    atmosphere.rotation.y += 0.0002;
    controls.update();

    composer.render(clock.getDelta());
  }

  // Update resize handler
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}