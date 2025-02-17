varying vec4 vColor;
uniform float uOpacity;

void main() {
    // Create a circular point with smooth edges
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

    // Create a smoother falloff using smoothstep
  float alpha = 1.0 - smoothstep(0.1, 0.5, dist);

    // Add a brighter core
  float core = 1.0 - smoothstep(0.0, 0.2, dist);

  // Debug: Output the varying color directly
  vec3 color = vColor.rgb;
  // Add the core glow
  color += vec3(core);

  gl_FragColor = vec4(color, alpha * uOpacity);
}