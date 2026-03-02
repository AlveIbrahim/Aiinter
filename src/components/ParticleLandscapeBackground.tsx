'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleLandscapeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── scene / camera / renderer ────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0f13);

    const camera = new THREE.PerspectiveCamera(
      90,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Apply yaw/pitch
    const pitch = (-41 * Math.PI) / 180;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, 0, 0, 'YXZ'));
    camera.position.set(0, 3, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);

    // ─── fog ──────────────────────────────────────────────────────────────────
    scene.fog = new THREE.Fog('#0e0f13', 1, 34);

    // ─── shader material ──────────────────────────────────────────────────────
    const pointMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap:              { value: null },
        uScale:            { value: 8 },
        uBias:             { value: -4 },
        uColor:            { value: new THREE.Color('#75e264') },
        uPointSize:        { value: 0.08 },
        uTime:             { value: 0.0 },
        uJitter:           { value: 0.02 },
        uMaskCenter:       { value: new THREE.Vector2(0, 0) },
        uMaskRadius:       { value: 8.8 },
        uMaskFeather:      { value: 4.9 },
        uHoverCenter:      { value: new THREE.Vector2(9999, 9999) },
        uHoverRadius:      { value: 1.6 },
        uHoverStrength:    { value: 0.8 },
        uHoverSnap:        { value: 2.0 },
        uHoverColor:       { value: new THREE.Color('#ffcc55') },
        uHoverEnabled:     { value: 0.0 },
        uAirplanePos:      { value: new THREE.Vector3(9999, 9999, 9999) },
        uAirplaneHoverEnabled: { value: 0.0 },
        uAirplaneHoverRadius:  { value: 0.5 },
        uRadarActive:      { value: 0.0 },
        uRadarOrigin:      { value: new THREE.Vector3(0, 0, 0) },
        uRadarRadius:      { value: 0.0 },
        uRadarRingWidth:   { value: 0.6 },
        uRadarFade:        { value: 1.0 },
        uRadarRainHeight:  { value: 41.0 },
        uRadarRainDuration:{ value: 0.35 },
        uRadarTime:        { value: 0.0 },
        uRadarExpandSpeed: { value: 9.72 },
        uRadarShowRing:    { value: 0.0 },
        uRadarRingFeather: { value: 0.1 },
        uPersistentRevealRadius: { value: 0.0 },
        uRainColor:        { value: new THREE.Color(0xbff4ff) },
        uRadarRingColorLow:  { value: new THREE.Color(0x00ccff) },
        uRadarRingColorMid:  { value: new THREE.Color(0x00ff80) },
        uRadarRingColorHigh: { value: new THREE.Color(0xffee33) },
        uRainColorFadeDuration: { value: 1.0 },
        uRainParticleWidth:  { value: 0.01 },
        uRainParticleLength: { value: 7.0 },
        uRainImpactScale:    { value: 4.5 },
        uRainSpawnRadius:    { value: 0.5 },
        uAirplaneColorFar:   { value: new THREE.Color(0xff9000) },
        uAirplaneColorClose: { value: new THREE.Color(0xff0000) },
        fogColor:   { value: new THREE.Color(0x0e0f13) },
        fogNear:    { value: 1 },
        fogFar:     { value: 34 },
        fogDensity: { value: 0.00025 },
      },
      transparent: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
      fog: true,
      vertexShader: `
        #include <uv_pars_vertex>
        varying float vMaskAlpha;
        varying float vHoverMix;
        varying float vAirplaneMix;
        varying float vAirplaneProximity;
        varying float vRadarMix;
        varying float vRadarHeight;
        varying float vRadarRainOpacity;
        varying float vRainColorBlend;
        varying float vRainProgress;
        varying vec2 vRainDirection;
        #include <fog_pars_vertex>
        uniform sampler2D uMap;
        uniform float uScale;
        uniform float uBias;
        uniform float uPointSize;
        uniform float uTime;
        uniform float uJitter;
        uniform vec2 uMaskCenter;
        uniform float uMaskRadius;
        uniform float uMaskFeather;
        uniform vec2 uHoverCenter;
        uniform float uHoverRadius;
        uniform float uHoverStrength;
        uniform float uHoverSnap;
        uniform float uHoverEnabled;
        uniform vec3 uAirplanePos;
        uniform float uAirplaneHoverEnabled;
        uniform float uAirplaneHoverRadius;
        uniform float uRadarActive;
        uniform vec3 uRadarOrigin;
        uniform float uRadarRadius;
        uniform float uRadarRingWidth;
        uniform float uRadarFade;
        uniform float uRadarRainHeight;
        uniform float uRadarRainDuration;
        uniform float uRadarTime;
        uniform float uRadarExpandSpeed;
        uniform float uRadarRingFeather;
        uniform float uPersistentRevealRadius;
        uniform float uRainColorFadeDuration;
        uniform float uRainParticleLength;
        uniform float uRainImpactScale;
        uniform float uRainSpawnRadius;
        float hash(vec2 p){
          return -1.0 + 2.0 * fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        void main() {
          #include <uv_vertex>
          vec3 p = position;
          float h = 0.0;
          #ifdef USE_UV
          vec3 c = texture2D(uMap, vUv).rgb;
          h = (c.r + c.g + c.b) / 3.0;
          #endif
          if (uJitter > 0.0) {
            vec4 wj = modelMatrix * vec4(p, 1.0);
            p.x += hash(wj.xz + 0.123) * uJitter;
            p.z += hash(wj.xz + 4.567) * uJitter;
          }
          float baseY = h * uScale + uBias;
          p.y = baseY;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(1.0, uPointSize * (300.0 / max(1.0, -mvPosition.z)));
          vec4 worldPos = modelMatrix * vec4(p, 1.0);
          float d = length(worldPos.xz - uMaskCenter);
          vMaskAlpha = 1.0 - smoothstep(uMaskRadius, uMaskRadius + max(0.0001, uMaskFeather), d);
          float hd = length(worldPos.xz - uHoverCenter);
          vHoverMix = uHoverEnabled * (1.0 - smoothstep(uHoverRadius, uHoverRadius + 0.5, hd));
          float airDist = length(worldPos.xz - uAirplanePos.xz);
          vAirplaneMix = uAirplaneHoverEnabled * (1.0 - smoothstep(uAirplaneHoverRadius, uAirplaneHoverRadius + 0.8, airDist));
          vAirplaneProximity = 1.0 - clamp((uAirplanePos.y - worldPos.y) / 0.6, 0.0, 1.0);
          float radarDist = length(worldPos.xz - uRadarOrigin.xz);
          float innerEdge = uRadarRadius - uRadarRingWidth;
          float outerEdge = uRadarRadius + uRadarRingWidth;
          float ringArrivalTime = radarDist / max(0.1, uRadarExpandSpeed);
          float timeSinceArrival = uRadarTime - ringArrivalTime;
          vRadarRainOpacity = 1.0;
          vRainColorBlend = 1.0;
          vRainProgress = 1.0;
          vRainDirection = vec2(0.0, 1.0);
          vec4 clipPos = projectionMatrix * viewMatrix * (modelMatrix * vec4(p, 1.0));
          vec4 clipDown = projectionMatrix * viewMatrix * (modelMatrix * vec4(p, 1.0) + vec4(0.0,-1.0,0.0,0.0));
          vec2 sPos = clipPos.xy / clipPos.w;
          vec2 sDown = clipDown.xy / clipDown.w;
          if (length(sDown - sPos) > 0.001) vRainDirection = normalize(sDown - sPos);
          if (uRadarActive > 0.5 && timeSinceArrival > -0.1) {
            float randDelay = hash(vUv * 7.89) * 0.15;
            float delayedTime = timeSinceArrival - randDelay;
            float dp = clamp(delayedTime / max(0.01, uRadarRainDuration), 0.0, 1.0);
            float deased = mix(dp, 1.0 - pow(1.0 - dp, 4.0), dp * dp);
            float rainOffset = uRadarRainHeight * (1.0 - deased);
            vec2 toP = worldPos.xz - uRadarOrigin.xz;
            float dist2 = length(toP);
            vec2 dir2 = dist2 > 0.01 ? toP / dist2 : vec2(0.0);
            vec2 hShift = dir2 * (mix(uRainSpawnRadius, dist2, deased) - dist2);
            vRadarRainOpacity = deased;
            vRainProgress = dp;
            float tsl = max(0.0, delayedTime - uRadarRainDuration);
            vRainColorBlend = clamp(tsl / max(0.01, uRainColorFadeDuration), 0.0, 1.0);
            vec3 ap = p; ap.y = baseY + rainOffset; ap.x += hShift.x; ap.z += hShift.y;
            mvPosition = modelViewMatrix * vec4(ap, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float phase1 = smoothstep(0.7, 0.9, dp);
            float phase2 = smoothstep(0.9, 1.0, dp);
            float fs = mix(mix(uRainParticleLength * 4.0, uRainImpactScale, phase1), 1.0, phase2);
            gl_PointSize = max(1.0, uPointSize * fs * (300.0 / max(1.0, -mvPosition.z)));
          }
          float feather = max(0.1, uRadarRingFeather);
          float ringMix = smoothstep(innerEdge - feather, innerEdge, radarDist)
                        * (1.0 - smoothstep(outerEdge, outerEdge + feather, radarDist));
          float persistentEdge = max(outerEdge, uPersistentRevealRadius);
          float revealMix = 1.0 - smoothstep(persistentEdge - feather * 0.5, persistentEdge + feather, radarDist);
          vRadarMix = uRadarActive * max(ringMix * 1.5, revealMix * 0.8);
          vRadarHeight = clamp((baseY + 1.0) / 3.0, 0.0, 1.0);
          #include <fog_vertex>
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uHoverColor;
        uniform vec3 uAirplaneColorFar;
        uniform vec3 uAirplaneColorClose;
        uniform float uRadarFade;
        uniform float uRadarShowRing;
        uniform vec3 uRainColor;
        uniform vec3 uRadarRingColorLow;
        uniform vec3 uRadarRingColorMid;
        uniform vec3 uRadarRingColorHigh;
        uniform float uRainParticleWidth;
        uniform float uRainParticleLength;
        varying float vMaskAlpha;
        varying float vHoverMix;
        varying float vAirplaneMix;
        varying float vAirplaneProximity;
        varying float vRadarMix;
        varying float vRadarHeight;
        varying float vRadarRainOpacity;
        varying float vRainColorBlend;
        varying float vRainProgress;
        varying vec2 vRainDirection;
        #include <fog_pars_fragment>
        void main() {
          vec2 pc = gl_PointCoord - 0.5;
          float r = length(pc);
          vec2 rd = normalize(vRainDirection);
          vec2 rpc;
          rpc.x = pc.x * (-rd.y) + pc.y * (-rd.x);
          rpc.y = pc.x * (-rd.x) + pc.y * (rd.y);
          float disc = 1.0 - smoothstep(0.45, 0.5, r);
          float ls = max(1.0, uRainParticleLength);
          float comp = 7.0 / ls;
          float cw = uRainParticleWidth * comp;
          float xMask = 1.0 - smoothstep(cw, cw + 0.02 * comp, abs(rpc.x));
          float yMask = 1.0 - smoothstep(0.48, 0.5, abs(rpc.y));
          float shape = mix(xMask * yMask, disc, smoothstep(0.88, 0.98, vRainProgress));
          float radarAlpha = vRadarMix * uRadarFade;
          float effectiveAlpha = max(vMaskAlpha, radarAlpha);
          float alpha = shape * effectiveAlpha * mix(0.6, 1.0, vRadarRainOpacity);
          if (alpha <= 0.001) discard;
          vec3 col = uColor;
          col = mix(col, uHoverColor, vHoverMix);
          col = mix(col, mix(uAirplaneColorFar, uAirplaneColorClose, vAirplaneProximity), vAirplaneMix);
          if (vRainColorBlend < 1.0) {
            vec3 tc = col;
            if (uRadarShowRing > 0.5)
              tc = vRadarHeight < 0.5
                ? mix(uRadarRingColorLow, uRadarRingColorMid, vRadarHeight * 2.0)
                : mix(uRadarRingColorMid, uRadarRingColorHigh, (vRadarHeight - 0.5) * 2.0);
            col = mix(uRainColor, tc, vRainColorBlend);
          } else if (uRadarShowRing > 0.5) {
            vec3 rc2 = vRadarHeight < 0.5
              ? mix(uRadarRingColorLow, uRadarRingColorMid, vRadarHeight * 2.0)
              : mix(uRadarRingColorMid, uRadarRingColorHigh, (vRadarHeight - 0.5) * 2.0);
            col = mix(col, rc2, radarAlpha * 0.9);
          }
          gl_FragColor = vec4(col, alpha);
          #include <fog_fragment>
        }
      `,
    });
    pointMaterial.defines = { USE_UV: '' };

    // ─── tiling ───────────────────────────────────────────────────────────────
    const TILE_SIZE = 44;
    const TILES_X = 5;
    const TILES_Z = 4;
    const scrollOffset = new THREE.Vector2(0, 0);
    let tilesPoints: THREE.Points[] = [];

    function positiveModulo(v: number, m: number) { return ((v % m) + m) % m; }

    function updateTileMatrices() {
      if (!tilesPoints.length) return;
      let idx = 0;
      const offsetX = (TILES_X - 1) * TILE_SIZE * 0.5;
      const offsetZ = (TILES_Z - 1) * TILE_SIZE * 0.5;
      const modX = positiveModulo(scrollOffset.x, TILE_SIZE);
      const modZ = positiveModulo(scrollOffset.y, TILE_SIZE);
      for (let z = 0; z < TILES_Z; z++) {
        for (let x = 0; x < TILES_X; x++) {
          const pts = tilesPoints[idx++];
          if (pts) pts.position.set(x * TILE_SIZE - offsetX - modX, 0, z * TILE_SIZE - offsetZ - modZ);
        }
      }
    }

    function buildTiles() {
      for (const p of tilesPoints) { scene.remove(p); p.geometry.dispose(); }
      tilesPoints = [];
      const g = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 200, 200);
      g.rotateX(-Math.PI / 2);
      g.deleteAttribute('normal');
      g.deleteAttribute('tangent');
      const ni = g.toNonIndexed();
      ni.computeBoundingSphere();
      g.dispose();
      for (let z = 0; z < TILES_Z; z++) {
        for (let x = 0; x < TILES_X; x++) {
          const pts = new THREE.Points(ni, pointMaterial);
          pts.frustumCulled = false;
          tilesPoints.push(pts);
          scene.add(pts);
        }
      }
      updateTileMatrices();
    }
    buildTiles();

    // ─── radar ────────────────────────────────────────────────────────────────
    const radarState = {
      active: false, startTime: 0, fadeEndTime: 0,
      expandDuration: 3.6, persistDuration: 2.0, fadeDuration: 0.5,
      maxRadius: 35.0, expandSpeed: 9.72, currentRadius: 0, persistentRevealRadius: 0,
    };

    // Visual ring pool
    type RingEntry = { mesh: THREE.Mesh; startTime: number };
    const activeRings: RingEntry[] = [];
    const ringPool: THREE.Mesh[] = [];

    function getOrCreateRingMesh(): THREE.Mesh {
      const inactive = ringPool.find(r => !r.visible);
      if (inactive) return inactive;
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uColor:   { value: new THREE.Color(0xffa500) },
          uOpacity: { value: 1.0 },
          uInner:   { value: 0.1 },
          uOuter:   { value: 0.2 },
          uFeather: { value: 0.05 },
        },
        vertexShader: `varying vec3 vLP; void main(){ vLP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uOpacity,uInner,uOuter,uFeather;
          varying vec3 vLP;
          void main(){
            float d=length(vLP.xz);
            float a=smoothstep(uInner-uFeather,uInner+uFeather,d)*(1.0-smoothstep(uOuter-uFeather,uOuter+uFeather,d))*uOpacity;
            gl_FragColor=vec4(uColor,a);
          }
        `,
        transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.2, 128), mat);
      mesh.geometry.rotateX(-Math.PI / 2);
      mesh.visible = false;
      mesh.renderOrder = 999;
      scene.add(mesh);
      ringPool.push(mesh);
      return mesh;
    }

    function spawnRing(origin: THREE.Vector3) {
      const mesh = getOrCreateRingMesh();
      mesh.position.copy(origin);
      mesh.visible = true;
      activeRings.push({ mesh, startTime: performance.now() * 0.001 });
    }

    function updateRings() {
      const now = performance.now() * 0.001;
      const total = radarState.expandDuration + radarState.persistDuration + radarState.fadeDuration;
      for (let i = activeRings.length - 1; i >= 0; i--) {
        const rd = activeRings[i];
        const el = now - rd.startTime;
        if (el >= total) { rd.mesh.visible = false; activeRings.splice(i, 1); continue; }
        let radius: number, fade: number;
        if (el < radarState.expandDuration) { radius = (el / radarState.expandDuration) * radarState.maxRadius; fade = 1; }
        else if (el < radarState.expandDuration + radarState.persistDuration) { radius = radarState.maxRadius; fade = 1; }
        else { radius = radarState.maxRadius; fade = 1 - (el - radarState.expandDuration - radarState.persistDuration) / radarState.fadeDuration; }
        const w = 0.07;
        const inner = Math.max(0.01, radius - w);
        const outer = radius + w;
        rd.mesh.geometry.dispose();
        rd.mesh.geometry = new THREE.RingGeometry(inner, outer, 128);
        (rd.mesh.geometry as THREE.RingGeometry).rotateX(-Math.PI / 2);
        const mat = rd.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uInner.value = inner;
        mat.uniforms.uOuter.value = outer;
        mat.uniforms.uOpacity.value = fade;
        mat.uniforms.uFeather.value = w * 0.3;
      }
    }

    function triggerRadar(origin: THREE.Vector3) {
      spawnRing(origin);
      const now = performance.now() * 0.001;
      const total = radarState.expandDuration + radarState.persistDuration + radarState.fadeDuration;
      if (radarState.active) {
        radarState.fadeEndTime = now + radarState.persistDuration + radarState.fadeDuration;
        pointMaterial.uniforms.uRadarFade.value = 1.0;
      } else {
        radarState.active = true;
        radarState.startTime = now;
        radarState.fadeEndTime = now + total;
        radarState.currentRadius = 0;
        radarState.persistentRevealRadius = 0;
        pointMaterial.uniforms.uRadarRadius.value = 0;
        pointMaterial.uniforms.uRadarFade.value = 1.0;
        pointMaterial.uniforms.uRadarTime.value = 0;
        pointMaterial.uniforms.uRadarOrigin.value.copy(origin);
      }
      pointMaterial.uniforms.uRadarActive.value = 1.0;
      pointMaterial.uniforms.uRadarExpandSpeed.value = radarState.maxRadius / radarState.expandDuration;
    }

    // ─── mouse ────────────────────────────────────────────────────────────────
    const mouseNdc = new THREE.Vector2(-2, -2);
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      raycaster.setFromCamera(mouseNdc, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hit)) {
        hit.y = 0;
        triggerRadar(hit);
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);

    // ─── heightmap ────────────────────────────────────────────────────────────
    const loader = new THREE.TextureLoader();
    loader.load('/heightmap_512x512.png', (tex) => {
      tex.colorSpace = THREE.NoColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      pointMaterial.uniforms.uMap.value = tex;
      pointMaterial.needsUpdate = true;
    });

    // ─── resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ─── animation loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      pointMaterial.uniforms.uTime.value = performance.now() * 0.001;

      // hover center
      raycaster.setFromCamera(mouseNdc, camera);
      const hoverHit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hoverHit)) {
        pointMaterial.uniforms.uHoverCenter.value.set(hoverHit.x, hoverHit.z);
      } else {
        pointMaterial.uniforms.uHoverCenter.value.set(9999, 9999);
      }

      // scroll forward
      scrollOffset.y -= 3 * delta;
      updateTileMatrices();

      // radar animation
      if (radarState.active) {
        const now = performance.now() * 0.001;
        const elapsed = now - radarState.startTime;
        pointMaterial.uniforms.uRadarTime.value = elapsed;
        radarState.currentRadius = Math.min(elapsed * radarState.expandSpeed, radarState.maxRadius);
        const fadeStart = radarState.fadeEndTime - radarState.fadeDuration;
        if (now >= radarState.fadeEndTime) {
          radarState.active = false;
          radarState.currentRadius = 0;
          radarState.persistentRevealRadius = 0;
          pointMaterial.uniforms.uRadarActive.value = 0;
          pointMaterial.uniforms.uRadarFade.value = 0;
          pointMaterial.uniforms.uPersistentRevealRadius.value = 0;
        } else {
          pointMaterial.uniforms.uRadarFade.value = now >= fadeStart
            ? 1.0 - (now - fadeStart) / radarState.fadeDuration
            : 1.0;
        }
        pointMaterial.uniforms.uRadarRadius.value = radarState.currentRadius;
        radarState.persistentRevealRadius = Math.max(radarState.persistentRevealRadius, radarState.currentRadius);
        pointMaterial.uniforms.uPersistentRevealRadius.value = radarState.persistentRevealRadius;
      }

      updateRings();
      renderer.render(scene, camera);
    }
    animate();

    // ─── cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      for (const pts of tilesPoints) { pts.geometry.dispose(); scene.remove(pts); }
      for (const r of ringPool) { r.geometry.dispose(); (r.material as THREE.Material).dispose(); }
      pointMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
    />
  );
}
