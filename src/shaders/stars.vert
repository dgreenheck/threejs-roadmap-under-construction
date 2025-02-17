attribute float size;

varying vec4 vColor;

void main() {
    // Debug: Use a fixed color to test if varying works
    // vColor = color;  // Original line
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size;
}