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

import { Planet } from './Planet';
import { Stars } from './Stars';
import { Atmosphere } from './Atmosphere';

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

  // Post-processing setup
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType
  });

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomEffect = new BloomEffect({
    blendFunction: BlendFunction.SCREEN,
    kernelSize: KernelSize.SMALL,
    luminanceThreshold: 0.2,
    luminanceSmoothing: 1,
    intensity: 0.5,
    radius: 1
  });

  const bloomPass = new EffectPass(camera, bloomEffect);
  composer.addPass(bloomPass);

  // Create objects
  const planet = new Planet();
  scene.add(planet);

  const atmosphere = new Atmosphere();
  planet.add(atmosphere);

  const stars = new Stars();
  scene.add(stars);

  function animate() {
    requestAnimationFrame(animate);
    stars.update(camera);
    atmosphere.material.uniforms.time.value = clock.getElapsedTime();
    atmosphere.rotation.y += 0.0002;
    controls.update();
    composer.render(clock.getDelta());
  }

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
} 