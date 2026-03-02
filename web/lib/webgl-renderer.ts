/**
 * WebGL2 point sprite renderer for 200K+ agents.
 * Zero-copy position upload from WASM memory views.
 * Additive blending for glow effects.
 */

const VERT_SRC = `#version 300 es
precision highp float;

in vec2 a_position;
in vec4 a_color;
in float a_size;

uniform mat3 u_transform;
uniform float u_pixelRatio;

out vec4 v_color;

void main() {
  vec3 pos = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  gl_PointSize = a_size * u_pixelRatio;
  v_color = a_color;
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  // Circular point with soft glow edge
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;

  // Core: solid circle
  float alpha = 1.0 - smoothstep(0.5, 1.0, dist);

  // Glow: softer, wider falloff
  float glow = exp(-dist * dist * 3.0) * 0.4;

  fragColor = vec4(v_color.rgb, v_color.a * (alpha + glow));
}
`;

// Pheromone overlay shaders
const PHERO_VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_uv;
}
`;

const PHERO_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_danger;
uniform sampler2D u_trail;
uniform sampler2D u_novelty;
uniform float u_dangerOn;
uniform float u_trailOn;
uniform float u_noveltyOn;
uniform float u_opacity;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  float d = texture(u_danger, v_uv).r;
  float t = texture(u_trail, v_uv).r;
  float n = texture(u_novelty, v_uv).r;

  vec3 color = vec3(0.0);
  float alpha = 0.0;

  // Danger: red/orange
  color += vec3(0.95, 0.35, 0.15) * d * u_dangerOn * 2.0;
  alpha += d * u_dangerOn;

  // Trail: blue
  color += vec3(0.2, 0.4, 0.9) * t * u_trailOn * 1.5;
  alpha += t * u_trailOn * 0.5;

  // Novelty: magenta/cyan
  color += vec3(0.7, 0.2, 0.9) * n * u_noveltyOn * 2.0;
  alpha += n * u_noveltyOn;

  fragColor = vec4(color, clamp(alpha, 0.0, 1.0) * u_opacity);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile: ${log}`);
  }
  return s;
}

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`Program link: ${gl.getProgramInfoLog(p)}`);
  }
  return p;
}

import type { ISwarmRenderer } from './types';

export class WebGLRenderer implements ISwarmRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private pheroProgram: WebGLProgram;
  private posBuf: WebGLBuffer;
  private colorBuf: WebGLBuffer;
  private sizeBuf: WebGLBuffer;
  private pheroQuadBuf: WebGLBuffer;

  // Pheromone textures
  private dangerTex: WebGLTexture;
  private trailTex: WebGLTexture;
  private noveltyTex: WebGLTexture;

  // Attribute locations
  private aPosition: number;
  private aColor: number;
  private aSize: number;
  private uTransform: WebGLUniformLocation;
  private uPixelRatio: WebGLUniformLocation;

  // Pheromone uniforms
  private pheroUniforms: Record<string, WebGLUniformLocation>;

  // Reusable typed arrays — sized to actual agent count, not a hardcoded max
  private colorArray: Float32Array;
  private sizeArray: Float32Array;
  private allocatedAgents: number;

  // Pheromone state
  public dangerOn = true;
  public trailOn = false;
  public noveltyOn = true;
  public pheromoneOpacity = 0.25;

  constructor(private canvas: HTMLCanvasElement, private maxAgents: number) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false })!;
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Agent program
    this.program = createProgram(gl, VERT_SRC, FRAG_SRC);
    this.aPosition = gl.getAttribLocation(this.program, 'a_position');
    this.aColor = gl.getAttribLocation(this.program, 'a_color');
    this.aSize = gl.getAttribLocation(this.program, 'a_size');
    this.uTransform = gl.getUniformLocation(this.program, 'u_transform')!;
    this.uPixelRatio = gl.getUniformLocation(this.program, 'u_pixelRatio')!;

    // Pheromone program
    this.pheroProgram = createProgram(gl, PHERO_VERT, PHERO_FRAG);
    this.pheroUniforms = {
      danger: gl.getUniformLocation(this.pheroProgram, 'u_danger')!,
      trail: gl.getUniformLocation(this.pheroProgram, 'u_trail')!,
      novelty: gl.getUniformLocation(this.pheroProgram, 'u_novelty')!,
      dangerOn: gl.getUniformLocation(this.pheroProgram, 'u_dangerOn')!,
      trailOn: gl.getUniformLocation(this.pheroProgram, 'u_trailOn')!,
      noveltyOn: gl.getUniformLocation(this.pheroProgram, 'u_noveltyOn')!,
      opacity: gl.getUniformLocation(this.pheroProgram, 'u_opacity')!,
    };

    // Buffers
    this.posBuf = gl.createBuffer()!;
    this.colorBuf = gl.createBuffer()!;
    this.sizeBuf = gl.createBuffer()!;

    this.colorArray = new Float32Array(maxAgents * 4);
    this.sizeArray = new Float32Array(maxAgents);
    this.allocatedAgents = maxAgents;

    // Pheromone fullscreen quad
    this.pheroQuadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pheroQuadBuf);
    // pos(x,y) + uv(u,v) interleaved
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ]), gl.STATIC_DRAW);

    // Pheromone textures
    this.dangerTex = this.createFloatTexture();
    this.trailTex = this.createFloatTexture();
    this.noveltyTex = this.createFloatTexture();

    // GL state
    gl.enable(gl.BLEND);
    gl.clearColor(0.039, 0.055, 0.102, 1.0); // #0a0e1a
  }

  private createFloatTexture(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Upload pheromone channel data as texture. */
  uploadPheromone(channel: 'danger' | 'trail' | 'novelty', data: Float32Array, res: number) {
    const gl = this.gl;
    const tex = channel === 'danger' ? this.dangerTex : channel === 'trail' ? this.trailTex : this.noveltyTex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, res, res, 0, gl.RED, gl.FLOAT, data);
  }

  /**
   * Render agents and pheromone overlay.
   * positions: interleaved [x0,y0,x1,y1,...] from WASM
   * colors: pre-computed RGBA float array
   * sizes: pre-computed point sizes
   */
  render(
    positions: Float32Array,
    nAgents: number,
    worldSize: number,
    hasPheromones: boolean,
  ) {
    const gl = this.gl;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    // Semi-transparent clear for motion trails
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    // Clear with trail effect — draw a dark quad
    gl.clearColor(0.039, 0.055, 0.102, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // World-to-clip transform
    const mapSize = Math.min(w, h) * 0.92;
    const ox = (w - mapSize) / 2;
    const oy = (h - mapSize) / 2;
    const sx = (mapSize / worldSize) * (2 / w);
    const sy = (mapSize / worldSize) * (2 / h);
    const tx = (ox / w) * 2 - 1 + (mapSize / w);
    const ty = -((oy / h) * 2 - 1 + (mapSize / h));

    // Pheromone nebula (behind agents)
    if (hasPheromones && (this.dangerOn || this.trailOn || this.noveltyOn)) {
      gl.useProgram(this.pheroProgram);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.dangerTex);
      gl.uniform1i(this.pheroUniforms.danger, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.trailTex);
      gl.uniform1i(this.pheroUniforms.trail, 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.noveltyTex);
      gl.uniform1i(this.pheroUniforms.novelty, 2);

      gl.uniform1f(this.pheroUniforms.dangerOn, this.dangerOn ? 1.0 : 0.0);
      gl.uniform1f(this.pheroUniforms.trailOn, this.trailOn ? 1.0 : 0.0);
      gl.uniform1f(this.pheroUniforms.noveltyOn, this.noveltyOn ? 1.0 : 0.0);
      gl.uniform1f(this.pheroUniforms.opacity, this.pheromoneOpacity);

      const aPos = gl.getAttribLocation(this.pheroProgram, 'a_pos');
      const aUv = gl.getAttribLocation(this.pheroProgram, 'a_uv');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pheroQuadBuf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(aPos);
      gl.disableVertexAttribArray(aUv);
    }

    // Agent points
    gl.useProgram(this.program);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive blending for glow

    // Transform: world coords → clip space
    const transform = new Float32Array([
      sx, 0, 0,
      0, -sy, 0,
      -1 + ox / w * 2, 1 - oy / h * 2, 1,
    ]);
    gl.uniformMatrix3fv(this.uTransform, false, transform);
    gl.uniform1f(this.uPixelRatio, dpr);

    // Position buffer (from WASM memory — may be invalidated, so always upload)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions.subarray(0, nAgents * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

    // Color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorArray.subarray(0, nAgents * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

    // Size buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.sizeArray.subarray(0, nAgents), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aSize);
    gl.vertexAttribPointer(this.aSize, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, nAgents);

    gl.disableVertexAttribArray(this.aPosition);
    gl.disableVertexAttribArray(this.aColor);
    gl.disableVertexAttribArray(this.aSize);
  }

  /** Ensure internal buffers can hold `n` agents. Grows if needed. */
  ensureCapacity(n: number) {
    if (n <= this.allocatedAgents) return;
    this.colorArray = new Float32Array(n * 4);
    this.sizeArray = new Float32Array(n);
    this.allocatedAgents = n;
  }

  /** Get the color array for external writes. */
  getColorArray(): Float32Array { return this.colorArray; }
  /** Get the size array for external writes. */
  getSizeArray(): Float32Array { return this.sizeArray; }

  destroy() {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteProgram(this.pheroProgram);
    gl.deleteBuffer(this.posBuf);
    gl.deleteBuffer(this.colorBuf);
    gl.deleteBuffer(this.sizeBuf);
    gl.deleteBuffer(this.pheroQuadBuf);
    gl.deleteTexture(this.dangerTex);
    gl.deleteTexture(this.trailTex);
    gl.deleteTexture(this.noveltyTex);
  }
}
