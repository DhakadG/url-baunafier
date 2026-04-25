import { useEffect, useRef } from 'react';

const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0,1); }`;
const FS = `precision mediump float;
uniform vec2 res; uniform float t; uniform vec2 mouse; uniform float click;

/* ---- fast hash ---- */
float h1(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}
float h2(vec2 c){return fract(sin(dot(c,vec2(93.9898,67.345)))*28491.2918);}

/* ---- value noise ---- */
float vnoise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),
             mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);
}

/* ---- fBm (4 octaves) ---- */
float fbm(vec2 p){
  float v=0.; float a=.5;
  mat2 rot=mat2(1.7,.9,-.9,1.7);
  for(int i=0;i<4;i++){v+=a*vnoise(p); p=rot*p*2.01; a*=.5;}
  return v;
}

/* ---- vortex swirl around center c ---- */
vec2 swirl(vec2 uv, vec2 c, float strength){
  vec2 d=uv-c; float r=length(d)+.001;
  float ang=strength/r; float co=cos(ang); float si=sin(ang);
  return c+vec2(co*d.x-si*d.y, si*d.x+co*d.y);
}

/* ---- glowing blob ---- */
vec3 blob(vec2 uv,vec2 c,float rad,vec3 col){
  float d=length(uv-c);
  float soft=smoothstep(rad,0.,d);
  float core=smoothstep(rad*.35,0.,d)*.55;
  return col*(soft+core);
}

void main(){
  vec2 uv=gl_FragCoord.xy/res; uv.y=1.-uv.y;
  float s=t*.13;
  vec2 m=mouse/res;

  /* animated swirl distortion on uv */
  vec2 suv1=swirl(uv, vec2(.30+sin(s*.9)*.14,.42+cos(s*.7)*.11), .032*(1.+sin(s*.4)*.4));
  vec2 suv2=swirl(uv, vec2(.70+cos(s*.8)*.12,.60+sin(s*.6)*.13), .028*(1.+cos(s*.5)*.4));
  vec2 suv3=swirl(uv, vec2(.50+sin(s*1.1)*.07,.22+cos(s*.95)*.08), .018);

  /* fBm warp — two layers offset by domain warp */
  vec2 fw=vec2(fbm(uv*2.8+vec2(s*.18,s*.12)), fbm(uv*2.8+vec2(3.2,1.7)+s*.09));
  vec2 warpUV=uv+fw*.08;
  float noise1=fbm(warpUV*3.5+s*.07);
  float noise2=fbm(uv*5.1-s*.05);

  /* base dark purple background */
  vec3 c=vec3(.028,.018,.052);

  /* primary blobs — purple/violet (swirlled uv for organic feel) */
  c+=blob(suv1, vec2(.28+sin(s*.9)*.18,.38+cos(s*.7)*.14), .44, vec3(.06,.03,.18));
  c+=blob(suv2, vec2(.72+cos(s*.8)*.14,.65+sin(s*.6)*.16), .40, vec3(.09,.03,.22));
  c+=blob(suv3, vec2(.50+sin(s*1.2)*.09,.18+cos(s*.95)*.09), .32, vec3(.04,.02,.14));

  /* secondary soft blobs — deep violet */
  c+=blob(uv, vec2(.15+cos(s*.55)*.11,.70+sin(s*.45)*.10), .30, vec3(.08,.02,.20));
  c+=blob(uv, vec2(.85+sin(s*.65)*.09,.30+cos(s*.75)*.12), .26, vec3(.05,.02,.16));

  /* fBm noise tinting — purple channel */
  c+=vec3(.008,.004,noise1*.032+noise2*.014)*smoothstep(.35,.9,noise1);

  /* mouse glow + click burst — violet */
  float cr=click*exp(-click*2.4);
  c+=blob(uv, m, .22+cr*.14, vec3(.14,.06,.36))*(.5+cr*.8);
  /* halo ring on click */
  float ringDist=abs(length(uv-m)-(.22+cr*.25));
  c+=vec3(.06,.02,.22)*smoothstep(.06,0.,ringDist)*cr*1.2;

  /* clamp to dark purple range */
  c=clamp(c, vec3(.025,.015,.048), vec3(.20,.08,.44));

  /* film grain */
  float g=h1(uv+vec2(t*11.3,t*7.1))*.022-.011;
  float g2=h2(uv+vec2(t*8.1,t*13.7))*.012-.006;
  c+=g+g2;

  gl_FragColor=vec4(c,1.);
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
