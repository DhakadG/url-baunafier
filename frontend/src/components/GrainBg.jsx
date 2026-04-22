import { useEffect, useRef } from 'react';

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0,1); }`;
const FS = `precision mediump float;
uniform vec2 res; uniform float t; uniform vec2 mouse; uniform float click;
float r(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}
vec3 blob(vec2 uv,vec2 c,float rad,vec3 col){float d=length(uv-c);return col*smoothstep(rad,0.,d);}
void main(){
  vec2 uv=gl_FragCoord.xy/res; uv.y=1.-uv.y; float s=t*.14;
  vec2 m=mouse/res;
  vec3 c=vec3(.038,.038,.038);
  c+=blob(uv,vec2(.28+sin(s*.9)*.18,.38+cos(s*.7)*.14),.42,vec3(.018,.072,.022));
  c+=blob(uv,vec2(.72+cos(s*.8)*.14,.65+sin(s*.6)*.16),.38,vec3(.012,.055,.028));
  c+=blob(uv,vec2(.5+sin(s*1.2)*.09,.18+cos(s*.95)*.09),.3,vec3(.022,.04,.018));
  float cr=click*exp(-click*2.5);
  c+=blob(uv,m,.24+cr*.15,vec3(.03,.1,.026))*(.45+cr*.6);
  c=clamp(c,vec3(.032),vec3(.072,.13,.065));
  float g=r(uv+vec2(t*11.3,t*7.1))*.02-.01;
  c+=g; gl_FragColor=vec4(c,1.);
}`;

function makeShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export function GrainBg() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const clickRef = useRef(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext('webgl');
    if (!gl) return;

    const pr = gl.createProgram();
    gl.attachShader(pr, makeShader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, makeShader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    gl.useProgram(pr);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const al = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(al);
    gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(pr, 'res');
    const uT = gl.getUniformLocation(pr, 't');
    const uM = gl.getUniformLocation(pr, 'mouse');
    const uC = gl.getUniformLocation(pr, 'click');

    function resize() {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      gl.viewport(0, 0, cv.width, cv.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function onClick() {
      clickRef.current = 1;
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);

    const st = performance.now();
    let raf;
    function frame() {
      const time = (performance.now() - st) / 1000;
      clickRef.current = Math.max(0, clickRef.current - 0.018);
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, time);
      gl.uniform2f(uM, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uC, clickRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
