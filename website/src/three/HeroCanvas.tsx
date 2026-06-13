import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

// The brand's 5 theme colors, in a spectrum that wraps the sphere:
// offense(red) → ai(orange) → hacking(green) → defense(blue) → purple-team.
const STOPS = ["#ef4444", "#f97316", "#39ff88", "#3b82f6", "#a855f7"].map(
  (h) => new THREE.Color(h),
);

function gradient(t: number): THREE.Color {
  const x = THREE.MathUtils.clamp(t, 0, 0.9999) * (STOPS.length - 1);
  const i = Math.floor(x);
  return STOPS[i].clone().lerp(STOPS[i + 1], x - i);
}

const vertex = /* glsl */ `
  attribute float aScale;
  varying vec3 vColor;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.8 + 0.2 * sin(uTime * 1.2 + aScale * 28.0);
    gl_PointSize = uSize * uPixelRatio * aScale * twinkle * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

// Glow baked into the point: bright core + soft halo over additive blending,
// so it reads luminous without an EffectComposer/Bloom pass.
const fragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    if (a < 0.02) discard;
    vec3 col = vColor * (0.45 + 0.9 * a);
    gl_FragColor = vec4(col, a);
  }
`;

function SignalField({ count, reduced }: { count: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { pointer, viewport } = useThree();

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const radius = 2.45;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const jitter = 0.82 + Math.random() * 0.18;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions[i * 3] = x * radius * jitter;
      positions[i * 3 + 1] = y * radius * jitter;
      positions[i * 3 + 2] = z * radius * jitter;
      const az = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2);
      const c = gradient(az);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      scales[i] = 0.55 + Math.random() * 1.1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    return {
      geometry: g,
      uniforms: {
        uSize: { value: 30 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
        uTime: { value: 0 },
      },
    };
  }, [count]);

  useFrame((state, delta) => {
    // clamp delta so a backgrounded tab doesn't lurch on return
    const dt = Math.min(delta, 0.05);
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.rotation.y += dt * 0.05;
    if (!reduced) {
      const tx = (pointer.y * viewport.height) / 30;
      const ty = (pointer.x * viewport.width) / 30;
      group.current.rotation.x += (tx - group.current.rotation.x) * 0.03;
      group.current.position.x += (ty - group.current.position.x) * 0.03;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[3.05, 0.004, 6, 160]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function HeroCanvas({ reduced, visible }: { reduced: boolean; visible: boolean }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [dpr, setDpr] = useState<number>(isMobile ? 1 : 1.4);
  const count = isMobile ? 1200 : 2800;

  return (
    <Canvas
      // pause the loop entirely when the hero is scrolled out of view
      frameloop={visible ? "always" : "never"}
      camera={{ position: [0, 0, 6.4], fov: 45 }}
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#05070d", 6, 11]} />
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.min(d, 1))}
        flipflops={3}
      />
      <SignalField count={count} reduced={reduced} />
    </Canvas>
  );
}
