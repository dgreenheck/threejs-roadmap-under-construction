import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

window.onload = () => loadScene();

const planetParams = {
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
  ambientIntensity: { value: 0.02 },
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
}

const atmosphereParams = {
  particles: { value: 2000 },
  minParticleSize: { value: 20 },
  maxParticleSize: { value: 80 },
  radius: { value: planetParams.radius.value + 0.7 },
  thickness: { value: 0.2 },
  density: { value: 0.2 },
  opacity: { value: 0.2 },
  scale: { value: 8 },
  color: { value: new THREE.Color(0xffffff) },
  speed: { value: 0.03 },
  lightDirection: planetParams.lightDirection
};


const texLoader = new THREE.TextureLoader();
const cloudTex = texLoader.load('images/cloud.png');

export class Atmosphere extends THREE.Points {
  constructor(params) {
    super();

    this.params = params;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: cloudTex },
        ...params
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader.replace(
        'void main() {',
        `${noiseFunctions}
         void main() {`
      ),
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true
    });

    this.update();
  }

  update() {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    const geometry = new THREE.BufferGeometry();

    const verts = [];
    const uvs = [];
    const sizes = [];

    // Sample points within the atmosphere
    for (let i = 0; i < this.params.particles.value; i++) {
      let r = Math.random() * this.params.thickness.value + this.params.radius.value;

      // Pick a random point within a cube of size [-1, 1]
      // This approach works better than parameterizing the spherical coordinates
      // since it doesn't have the issue of particles being bunched at the poles
      const p = new THREE.Vector3(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1
      );

      // Project onto the surface of a sphere
      p.normalize();
      p.multiplyScalar(r);

      const minSize = this.params.minParticleSize.value;
      const maxSize = this.params.maxParticleSize.value;
      const size = Math.random() * (maxSize - minSize) + minSize;

      verts.push(p.x, p.y, p.z);
      uvs.push(new THREE.Vector2(0.5, 0.5));
      sizes.push(size);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));

    this.geometry = geometry;
  }
}

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
  camera.position.z = 80;

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);

  composer.addPass(renderPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const material = new THREE.ShaderMaterial({
    uniforms: planetParams,
    vertexShader: planetVertexShader.replace(
      'void main() {',
      `${noiseFunctions}
       void main() {`
    ),
    fragmentShader: planetFragmentShader.replace(
      'void main() {',
      `${noiseFunctions}
       void main() {`
    ),
  });

  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), material);
  planet.geometry.computeTangents();
  scene.add(planet);

  const atmosphere = new Atmosphere(atmosphereParams);
  planet.add(atmosphere);

  function animate() {
    requestAnimationFrame(animate);
    atmosphere.material.uniforms.time.value = clock.getElapsedTime();
    atmosphere.rotation.y += 0.0002;
    controls.update();
    composer.render();
  }

  // Events
  window.addEventListener('resize', () => {
    // Resize camera aspect ratio and renderer size to the new window size
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  animate();
}

const noiseFunctions = `
const float PI = 3.14159265;

    //	Simplex 3D Noise 
    //	by Ian McEwan, Ashima Arts
    //
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    // 
    float simplex3(vec3 v) { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //  x0 = x0 - 0. + 0.0 * C 
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;

      // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      // Gradients
      // ( N*N points uniformly over a square, mapped onto an octahedron.)
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    float fractal3(      
      vec3 v,
      float sharpness,
      float period,
      float persistence,
      float lacunarity,
      int octaves
    ) {
      float n = 0.0;
      float a = 1.0; // Amplitude for current octave
      float max_amp = 0.0; // Accumulate max amplitude so we can normalize after
      float P = period;  // Period for current octave

      for(int i = 0; i < octaves; i++) {
          n += a * simplex3(v / P);
          a *= persistence;
          max_amp += a;
          P /= lacunarity;
      }

      // Normalize noise between [0.0, amplitude]
      return n / max_amp;
    }

    float terrainHeight(
      int type,
      vec3 v,
      float amplitude,
      float sharpness,
      float offset,
      float period,
      float persistence,
      float lacunarity,
      int octaves
    ) {
      float h = 0.0;

      if (type == 1) {
        h = amplitude * simplex3(v / period);
      } else if (type == 2) {
        h = amplitude * fractal3(
          v,
          sharpness,
          period, 
          persistence, 
          lacunarity, 
          octaves);
        h = amplitude * pow(max(0.0, (h + 1.0) / 2.0), sharpness);
      } else if (type == 3) {
        h = fractal3(
          v,
          sharpness,
          period, 
          persistence, 
          lacunarity, 
          octaves);
        h = amplitude * pow(max(0.0, 1.0 - abs(h)), sharpness);
      }

      // Multiply by amplitude and adjust offset
      return max(0.0, h + offset);
    }
`;

const planetVertexShader = `
    attribute vec3 tangent;

    // Terrain generation parameters
    uniform int type;
    uniform float radius;
    uniform float amplitude;
    uniform float sharpness;
    uniform float offset;
    uniform float period;
    uniform float persistence;
    uniform float lacunarity;
    uniform int octaves;

    // Bump mapping
    uniform float bumpStrength;
    uniform float bumpOffset;

    varying vec3 fragPosition;
    varying vec3 fragNormal;
    varying vec3 fragTangent;
    varying vec3 fragBitangent;

    void main() {
      // Calculate terrain height
      float h = terrainHeight(
        type,
        position,
        amplitude, 
        sharpness,
        offset,
        period, 
        persistence, 
        lacunarity, 
        octaves);

      vec3 pos = position * (radius + h);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      fragPosition = position;
      fragNormal = normal;
      fragTangent = tangent;
      fragBitangent = cross(normal, tangent);
    }
`;

const planetFragmentShader = `
    // Terrain generation parameters
    uniform int type;
    uniform float radius;
    uniform float amplitude;
    uniform float sharpness;
    uniform float offset;
    uniform float period;
    uniform float persistence;
    uniform float lacunarity;
    uniform int octaves;

    // Layer colors
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;
    uniform vec3 color5;
    
    // Transition points for each layer
    uniform float transition2;
    uniform float transition3;
    uniform float transition4;
    uniform float transition5;

    // Amount of blending between each layer
    uniform float blend12;
    uniform float blend23;
    uniform float blend34;
    uniform float blend45;

    // Bump mapping parameters
    uniform float bumpStrength;
    uniform float bumpOffset;

    // Lighting parameters
    uniform float ambientIntensity;
    uniform float diffuseIntensity;
    uniform float specularIntensity;
    uniform float shininess;
    uniform vec3 lightDirection;
    uniform vec3 lightColor;

    varying vec3 fragPosition;
    varying vec3 fragNormal;
    varying vec3 fragTangent;
    varying vec3 fragBitangent;

    void main() {
      // Calculate terrain height
      float h = terrainHeight(
        type,
        fragPosition,
        amplitude, 
        sharpness,
        offset,
        period, 
        persistence, 
        lacunarity, 
        octaves);

      vec3 dx = bumpOffset * fragTangent;
      float h_dx = terrainHeight(
        type,
        fragPosition + dx,
        amplitude, 
        sharpness,
        offset,
        period, 
        persistence, 
        lacunarity, 
        octaves);

      vec3 dy = bumpOffset * fragBitangent;
      float h_dy = terrainHeight(
        type,
        fragPosition + dy,
        amplitude, 
        sharpness,
        offset,
        period, 
        persistence, 
        lacunarity, 
        octaves);

      vec3 pos = fragPosition * (radius + h);
      vec3 pos_dx = (fragPosition + dx) * (radius + h_dx);
      vec3 pos_dy = (fragPosition + dy) * (radius + h_dy);

      // Recalculate surface normal post-bump mapping
      vec3 bumpNormal = normalize(cross(pos_dx - pos, pos_dy - pos));
      // Mix original normal and bumped normal to control bump strength
      vec3 N = normalize(mix(fragNormal, bumpNormal, bumpStrength));
    
      // Normalized light direction (points in direction that light travels)
      vec3 L = normalize(-lightDirection);
      // View vector from camera to fragment
      vec3 V = normalize(cameraPosition - pos);
      // Reflected light vector
      vec3 R = normalize(reflect(L, N));

      float diffuse = diffuseIntensity * max(0.0, dot(N, -L));

      // https://ogldev.org/www/tutorial19/tutorial19.html
      float specularFalloff = clamp((transition3 - h) / transition3, 0.0, 1.0);
      float specular = max(0.0, specularFalloff * specularIntensity * pow(dot(V, R), shininess));

      float light = ambientIntensity + diffuse + specular;

      // Blender colors layer by layer
      vec3 color12 = mix(
        color1, 
        color2, 
        smoothstep(transition2 - blend12, transition2 + blend12, h));

      vec3 color123 = mix(
        color12, 
        color3, 
        smoothstep(transition3 - blend23, transition3 + blend23, h));

      vec3 color1234 = mix(
        color123, 
        color4, 
        smoothstep(transition4 - blend34, transition4 + blend34, h));

      vec3 finalColor = mix(
        color1234, 
        color5, 
        smoothstep(transition5 - blend45, transition5 + blend45, h));
      
      gl_FragColor = vec4(light * finalColor * lightColor, 1.0);
    }
`;

const atmosphereVertexShader = `
attribute float size;

varying vec3 fragPosition;

void main() {
  gl_PointSize = size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  fragPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}
`;

const atmosphereFragmentShader = `
uniform float time;
uniform float speed;
uniform float opacity;
uniform float density;
uniform float scale;

uniform vec3 lightDirection;

uniform vec3 color;
uniform sampler2D pointTexture;

varying vec3 fragPosition;

vec2 rotateUV(vec2 uv, float rotation) {
    float mid = 0.5;
    return vec2(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

void main() {
  vec3 R = normalize(fragPosition);
  vec3 L = normalize(lightDirection);
  float light = max(0.05, dot(R, L));

  float n = simplex3((time * speed) + fragPosition / scale);
  float alpha = opacity * clamp(n + density, 0.0, 1.0);

  vec2 rotCoords = rotateUV(gl_PointCoord, n);
  gl_FragColor = vec4(light * color, alpha) * texture2D(pointTexture, gl_PointCoord);
}
`;