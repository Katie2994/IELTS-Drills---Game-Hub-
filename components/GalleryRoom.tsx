import React, { useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { FOLDER_DATA } from '../data/folders';
import { clearPosterCache, createLabelCanvas, getPosterCanvas } from '../utils/posterArt';

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GalleryRoomHandle {
  step: (dir: number) => void;
  stepBack: () => void;
  focusGame: (gameIndex: number, immediate?: boolean) => void;
  getFocusedGameIndex: () => number | null;
}

interface GalleryRoomProps {
  isActiveView: boolean;
  onFocusChange: (focused: boolean, gameIndex: number | null) => void;
  onHoverPill: (visible: boolean, x: number, y: number) => void;
  onOpenGame: (gameIndex: number, rect: ScreenRect) => void;
  onReady: () => void;
  onStepSound: () => void;
}

interface PrintSlot {
  gameIndex: number;
  angle: number;
  wall: 'outer' | 'inner';
  mesh: THREE.Mesh;
  group: THREE.Group;
}

interface Pose {
  th: number;
  r: number;
  yaw: number;
  y: number;
  pitch: number;
}

const R = 18;
const RIN = 12.2;
const H = 6.2;
const PW = 1.36;
const PH = (1.36 * 763) / 567;
const PY = 1.95;
const OUTER_COUNT = 36;
const INNER_COUNT = 24;
const STEP = (Math.PI * 2) / OUTER_COUNT;

const SMALL_MEDIA =
  '(max-width: 819px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px)';

const easeOutQuad = (t: number) => 1 - Math.pow(1 - t, 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function getWallOffset(isSmallPortrait: boolean) {
  return isSmallPortrait ? 0.14 + 0.9 * STEP : 0.14;
}

function getWalkPose(th: number, isSmallPortrait: boolean): Pose {
  if (isSmallPortrait) {
    return { th, r: 15.4, yaw: -0.42, y: 1.9, pitch: -0.1 };
  }
  return { th, r: 15.6, yaw: -0.3, y: 1.92, pitch: -0.12 };
}

function getFocusPose(angle: number, wall: 'outer' | 'inner', isSmallPortrait: boolean): Pose {
  const offset = isSmallPortrait ? 5.2 : 4.26;
  const yOffset = isSmallPortrait ? 1.05 : 0.52;
  if (wall === 'outer') {
    return {
      th: angle,
      r: R - offset,
      yaw: Math.PI / 2,
      y: PY - yOffset,
      pitch: 0,
    };
  }
  return {
    th: angle,
    r: RIN + offset,
    yaw: -Math.PI / 2,
    y: PY - yOffset,
    pitch: 0,
  };
}

function nearestAngle(targetAngle: number, currentTh: number): number {
  let diff = (targetAngle - currentTh) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return currentTh + diff;
}

function createWallGradientTexture(stops: Array<[number, string]>): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [pos, col] of stops) {
    grad.addColorStop(pos, col);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFloorGradientTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d')!;
  const rInner = (512 * RIN) / R;
  const grad = ctx.createRadialGradient(512, 512, rInner, 512, 512, 512);
  grad.addColorStop(0, '#EDD6B0');
  grad.addColorStop(0.55, '#F3E1C3');
  grad.addColorStop(1, '#EFDAB8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHaloTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 128 * 0.35, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 128 * 0.25, 128, 128, 128);
  grad.addColorStop(0, 'rgba(120, 90, 50, 0.28)');
  grad.addColorStop(1, 'rgba(120, 90, 50, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GalleryRoom = React.forwardRef<GalleryRoomHandle, GalleryRoomProps>(
  ({ isActiveView, onFocusChange, onHoverPill, onOpenGame, onReady, onStepSound }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const callbacksRef = useRef({
      onFocusChange,
      onHoverPill,
      onOpenGame,
      onReady,
      onStepSound,
    });
    callbacksRef.current = {
      onFocusChange,
      onHoverPill,
      onOpenGame,
      onReady,
      onStepSound,
    };

    const isActiveViewRef = useRef(isActiveView);
    isActiveViewRef.current = isActiveView;

    const controlRef = useRef<{
      step: (dir: number) => void;
      stepBack: () => void;
      focusGame: (gameIndex: number, immediate?: boolean) => void;
      getFocusedGameIndex: () => number | null;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      step: (dir: number) => controlRef.current?.step(dir),
      stepBack: () => controlRef.current?.stepBack(),
      focusGame: (gameIndex: number, immediate?: boolean) =>
        controlRef.current?.focusGame(gameIndex, immediate),
      getFocusedGameIndex: () => controlRef.current?.getFocusedGameIndex() ?? null,
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const checkSmallPortrait = () =>
        window.matchMedia(SMALL_MEDIA).matches && window.innerHeight > window.innerWidth;
      const checkSmall = () => window.matchMedia(SMALL_MEDIA).matches;

      // Software WebGL guard
      const isSoftwareGl = (() => {
        try {
          const probe = document.createElement('canvas');
          const gl = probe.getContext('webgl2') || probe.getContext('webgl');
          if (!gl) return true;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param) || '');
          gl.getExtension('WEBGL_lose_context')?.loseContext();
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return false;
        }
      })();

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const canvas = renderer.domElement;
      container.appendChild(canvas);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#FFF9EC');
      scene.fog = new THREE.Fog('#FFF9EC', 10, 46);

      const getFov = (w: number, h: number) => (w >= h ? 56 : 70);
      const camera = new THREE.PerspectiveCamera(
        getFov(window.innerWidth, window.innerHeight),
        window.innerWidth / window.innerHeight,
        0.05,
        100
      );

      // Ambient/Hemisphere lights per spec
      scene.add(new THREE.HemisphereLight(0xfffdf6, 0xe9cfa6, 1.55));
      scene.add(new THREE.AmbientLight(0xfff6e6, 0.55));

      const disposables: Array<{ dispose: () => void }> = [];

      // Room textures & meshes
      const outerTex = createWallGradientTexture([
        [0, '#F5EBD8'],
        [0.2, '#FBF3E3'],
        [0.6, '#FBF3E3'],
        [0.86, '#F8EDD9'],
        [1, '#EFDFC4'],
      ]);
      const innerTex = createWallGradientTexture([
        [0, '#F7EEDD'],
        [0.3, '#FFFAF0'],
        [0.8, '#FDF5E6'],
        [1, '#F1E1C6'],
      ]);
      const floorTex = createFloorGradientTexture();
      const haloTex = createHaloTexture();
      const shadowTex = createShadowTexture();
      disposables.push(outerTex, innerTex, floorTex, haloTex, shadowTex);

      const outerWallGeo = new THREE.CylinderGeometry(R, R, H, 160, 1, true);
      const outerWallMat = new THREE.MeshBasicMaterial({ map: outerTex, side: THREE.BackSide });
      const outerWall = new THREE.Mesh(outerWallGeo, outerWallMat);
      outerWall.position.y = 3.1;
      scene.add(outerWall);
      disposables.push(outerWallGeo, outerWallMat);

      const innerPillarGeo = new THREE.CylinderGeometry(RIN, RIN, H, 120, 1, true);
      const innerPillarMat = new THREE.MeshBasicMaterial({ map: innerTex, side: THREE.FrontSide });
      const innerPillar = new THREE.Mesh(innerPillarGeo, innerPillarMat);
      innerPillar.position.y = 3.1;
      scene.add(innerPillar);
      disposables.push(innerPillarGeo, innerPillarMat);

      const floorGeo = new THREE.CircleGeometry(R, 160);
      const floorMat = new THREE.MeshBasicMaterial({ map: floorTex });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);
      disposables.push(floorGeo, floorMat);

      const ceilGeo = new THREE.CircleGeometry(R, 160);
      const ceilMat = new THREE.MeshBasicMaterial({ color: '#FAF1E0', side: THREE.BackSide });
      const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
      ceiling.rotation.x = -Math.PI / 2;
      ceiling.position.y = H;
      scene.add(ceiling);
      disposables.push(ceilGeo, ceilMat);

      // Shared geometries & materials for prints
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const haloGeo = new THREE.PlaneGeometry(2.1 * PW, 1.75 * PH);
      const haloMat = new THREE.MeshBasicMaterial({
        map: haloTex,
        transparent: true,
        depthWrite: false,
        fog: true,
      });
      const shadowGeo = new THREE.PlaneGeometry(1.25 * PW, 1.18 * PH);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      });
      const frameGeo = new THREE.BoxGeometry(PW + 0.07, PH + 0.07, 0.06);
      const frameMat = new THREE.MeshBasicMaterial({ color: '#D3AA72' });
      const printGeo = new THREE.PlaneGeometry(PW, PH);
      const labelGeo = new THREE.PlaneGeometry(0.92, (0.92 * 260) / 640);
      disposables.push(haloGeo, haloMat, shadowGeo, shadowMat, frameGeo, frameMat, printGeo, labelGeo);

      const slots: PrintSlot[] = [];
      const printMeshes: THREE.Mesh[] = [];
      const posterTextures = new Map<number, THREE.CanvasTexture>();
      const labelTextures: Array<{ tex: THREE.CanvasTexture; gameIndex: number }> = [];

      const getOrBuildPosterTexture = (gameIndex: number) => {
        const existing = posterTextures.get(gameIndex);
        if (existing) return existing;
        const canvasEl = getPosterCanvas(gameIndex);
        const tex = new THREE.CanvasTexture(canvasEl);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        posterTextures.set(gameIndex, tex);
        disposables.push(tex);
        return tex;
      };

      const addSlot = (angle: number, wall: 'outer' | 'inner', gameIndex: number) => {
        const group = new THREE.Group();
        const radius = wall === 'outer' ? 17.98 : 12.22;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        group.position.set(x, 0, z);
        if (wall === 'outer') {
          group.lookAt(0, 0, 0);
        } else {
          group.lookAt(2 * x, 0, 2 * z);
        }

        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, PY + 0.05, 0.005);
        group.add(halo);

        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.position.set(0.05, PY - 0.06, 0.01);
        group.add(shadow);

        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(0, PY, 0.045);
        group.add(frame);

        const printMat = new THREE.MeshBasicMaterial({
          map: getOrBuildPosterTexture(gameIndex),
        });
        const printMesh = new THREE.Mesh(printGeo, printMat);
        printMesh.position.set(0, PY, 0.077);
        printMesh.userData = { slotIndex: slots.length };
        group.add(printMesh);
        disposables.push(printMat);

        const labelCanvas = createLabelCanvas(FOLDER_DATA[gameIndex], gameIndex);
        const labelTex = new THREE.CanvasTexture(labelCanvas);
        labelTex.colorSpace = THREE.SRGBColorSpace;
        labelTex.anisotropy = maxAniso;
        const labelMat = new THREE.MeshBasicMaterial({
          map: labelTex,
          transparent: true,
          depthWrite: false,
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(-PW / 2 + 0.46, PY - PH / 2 - 0.42, 0.02);
        group.add(labelMesh);
        disposables.push(labelTex, labelMat);
        labelTextures.push({ tex: labelTex, gameIndex });

        scene.add(group);
        slots.push({ gameIndex, angle, wall, mesh: printMesh, group });
        printMeshes.push(printMesh);
      };

      const totalGames = FOLDER_DATA.length;
      for (let s = 0; s < OUTER_COUNT; s++) {
        addSlot(s * STEP, 'outer', s % totalGames);
      }
      for (let k = 0; k < INNER_COUNT; k++) {
        addSlot(((k + 0.5) * Math.PI * 2) / INNER_COUNT, 'inner', (k + 4) % totalGames);
      }

      // Camera pose & animation state
      let isSmallPortrait = checkSmallPortrait();
      let D = getWallOffset(isSmallPortrait);
      let targetTh = D;
      let pose: Pose = getWalkPose(D, isSmallPortrait);

      // Intro state
      let introActive = !reducedMotion;
      let introStart = 0;
      const introDuration = reducedMotion ? 0 : 1400;
      const introStartTh = D + 0.16;
      const introStartR = pose.r - 0.35;
      if (introActive) {
        pose.th = introStartTh;
        pose.r = introStartR;
      }

      // Focus / glide state
      let focusedSlot: PrintSlot | null = null;
      let glide: {
        active: boolean;
        startTime: number;
        duration: number;
        from: Pose;
        to: Pose;
      } = {
        active: false,
        startTime: 0,
        duration: reducedMotion ? 0 : 950,
        from: { ...pose },
        to: { ...pose },
      };

      const applyCameraPose = (p: Pose) => {
        const cosT = Math.cos(p.th);
        const sinT = Math.sin(p.th);
        camera.position.set(p.r * cosT, p.y, p.r * sinT);

        // Tangent (sin th, 0, -cos th), normal (cos th, 0, sin th)
        const tx = sinT;
        const tz = -cosT;
        const nx = cosT;
        const nz = sinT;
        const cy = Math.cos(p.yaw);
        const sy = Math.sin(p.yaw);
        const dx = cy * tx + sy * nx;
        const dz = cy * tz + sy * nz;
        camera.lookAt(
          camera.position.x + dx,
          camera.position.y + p.pitch,
          camera.position.z + dz
        );
      };

      const startGlideTo = (toPose: Pose, immediate = false) => {
        if (reducedMotion || immediate) {
          pose = { ...toPose };
          targetTh = toPose.th;
          glide.active = false;
          applyCameraPose(pose);
          return;
        }
        glide = {
          active: true,
          startTime: performance.now(),
          duration: 950,
          from: { ...pose },
          to: { ...toPose },
        };
      };

      const stepBack = () => {
        if (!focusedSlot) return;
        focusedSlot = null;
        container.classList.remove('hovering');
        callbacksRef.current.onHoverPill(false, 0, 0);
        callbacksRef.current.onFocusChange(false, null);
        const walkTarget = pose.th + D;
        targetTh = walkTarget;
        startGlideTo(getWalkPose(walkTarget, checkSmallPortrait()));
      };

      const focusSlot = (slot: PrintSlot, immediate = false) => {
        const smallPort = checkSmallPortrait();
        const alignedAngle = nearestAngle(slot.angle, pose.th);
        const fPose = getFocusPose(alignedAngle, slot.wall, smallPort);
        focusedSlot = slot;
        targetTh = alignedAngle;
        introActive = false;
        callbacksRef.current.onFocusChange(true, slot.gameIndex);
        startGlideTo(fPose, immediate);
        if (checkSmall()) {
          // On small screens show pill automatically at 55% down center
          setTimeout(() => {
            if (focusedSlot === slot && isActiveViewRef.current) {
              callbacksRef.current.onHoverPill(
                true,
                window.innerWidth * 0.5,
                window.innerHeight * 0.55
              );
            }
          }, immediate ? 0 : 950);
        }
      };

      const projectSlotRect = (slot: PrintSlot): ScreenRect => {
        const hw = PW / 2;
        const hh = PH / 2;
        const corners = [
          new THREE.Vector3(-hw, -hh, 0),
          new THREE.Vector3(hw, -hh, 0),
          new THREE.Vector3(-hw, hh, 0),
          new THREE.Vector3(hw, hh, 0),
        ];
        slot.mesh.updateWorldMatrix(true, false);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (const c of corners) {
          c.applyMatrix4(slot.mesh.matrixWorld);
          c.project(camera);
          const sx = ((c.x + 1) / 2) * w;
          const sy = ((-c.y + 1) / 2) * h;
          minX = Math.min(minX, sx);
          minY = Math.min(minY, sy);
          maxX = Math.max(maxX, sx);
          maxY = Math.max(maxY, sy);
        }
        return {
          left: Math.max(0, minX),
          top: Math.max(0, minY),
          width: Math.max(40, maxX - minX),
          height: Math.max(54, maxY - minY),
        };
      };

      controlRef.current = {
        step: (dir: number) => {
          introActive = false;
          if (focusedSlot) {
            stepBack();
            return;
          }
          D = getWallOffset(checkSmallPortrait());
          targetTh = (Math.round((targetTh - D) / STEP) - dir) * STEP + D;
          if (reducedMotion) {
            pose.th = targetTh;
          }
          callbacksRef.current.onStepSound();
        },
        stepBack,
        focusGame: (gameIndex: number, immediate = false) => {
          // Pick outer-wall copy nearest current angle
          const outerCopies = slots.filter(
            (s) => s.wall === 'outer' && s.gameIndex === gameIndex
          );
          const candidates = outerCopies.length
            ? outerCopies
            : slots.filter((s) => s.gameIndex === gameIndex);
          if (!candidates.length) return;
          let best = candidates[0];
          let bestDist = Infinity;
          for (const c of candidates) {
            const na = nearestAngle(c.angle, pose.th);
            const dist = Math.abs(na - pose.th);
            if (dist < bestDist) {
              bestDist = dist;
              best = c;
            }
          }
          focusSlot(best, immediate);
        },
        getFocusedGameIndex: () => (focusedSlot ? focusedSlot.gameIndex : null),
      };

      // Raycasting & pointer/wheel interaction
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let isDragging = false;
      let pointerDown = false;
      let downX = 0;
      let downY = 0;
      let downTh = 0;
      let hoveredSlot: PrintSlot | null = null;
      let lastRaycast = 0;

      const pickSlot = (clientX: number, clientY: number): PrintSlot | null => {
        ndc.x = (clientX / window.innerWidth) * 2 - 1;
        ndc.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(printMeshes, false);
        if (!hits.length) return null;
        const idx = hits[0].object.userData.slotIndex;
        return slots[idx] || null;
      };

      const onWheel = (e: WheelEvent) => {
        if (!isActiveViewRef.current) return;
        e.preventDefault();
        introActive = false;
        if (focusedSlot) {
          stepBack();
        }
        const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        targetTh -= delta * 0.0016;
        if (reducedMotion) {
          pose.th = targetTh;
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        if (!isActiveViewRef.current) return;
        pointerDown = true;
        isDragging = false;
        downX = e.clientX;
        downY = e.clientY;
        downTh = targetTh;
        introActive = false;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isActiveViewRef.current) return;
        if (pointerDown) {
          const dx = e.clientX - downX;
          const dy = e.clientY - downY;
          if (!isDragging && Math.hypot(dx, dy) > 6) {
            isDragging = true;
            container.classList.add('dragging');
            callbacksRef.current.onHoverPill(false, 0, 0);
            if (focusedSlot) {
              stepBack();
              downTh = targetTh;
            }
          }
          if (isDragging) {
            const sensitivity = checkSmall() ? 0.0042 : 0.0022;
            const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
            targetTh = downTh + delta * sensitivity;
            if (reducedMotion) {
              pose.th = targetTh;
            }
          }
          return;
        }

        // Hover raycast throttled
        const now = performance.now();
        if (now - lastRaycast < 32) return;
        lastRaycast = now;

        const slot = pickSlot(e.clientX, e.clientY);
        hoveredSlot = slot;
        if (slot) {
          container.classList.add('hovering');
          if (focusedSlot && focusedSlot === slot) {
            callbacksRef.current.onHoverPill(true, e.clientX, e.clientY);
          } else {
            callbacksRef.current.onHoverPill(false, 0, 0);
          }
        } else {
          container.classList.remove('hovering');
          if (!checkSmall()) {
            callbacksRef.current.onHoverPill(false, 0, 0);
          }
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!pointerDown) return;
        pointerDown = false;
        container.classList.remove('dragging');
        if (isDragging) {
          isDragging = false;
          return;
        }
        if (!isActiveViewRef.current) return;

        const clicked = pickSlot(e.clientX, e.clientY);
        if (clicked) {
          if (focusedSlot && focusedSlot === clicked) {
            const rect = projectSlotRect(clicked);
            callbacksRef.current.onHoverPill(false, 0, 0);
            callbacksRef.current.onOpenGame(clicked.gameIndex, rect);
          } else {
            callbacksRef.current.onStepSound();
            focusSlot(clicked);
          }
        } else if (focusedSlot) {
          stepBack();
        }
      };

      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        isSmallPortrait = checkSmallPortrait();
        D = getWallOffset(isSmallPortrait);
        camera.fov = getFov(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        if (!focusedSlot && !glide.active) {
          const wp = getWalkPose(pose.th, isSmallPortrait);
          pose.r = wp.r;
          pose.yaw = wp.yaw;
          pose.y = wp.y;
          pose.pitch = wp.pitch;
        }
      };

      const onContextLost = (e: Event) => {
        e.preventDefault();
      };

      container.addEventListener('wheel', onWheel, { passive: false });
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('resize', onResize);
      canvas.addEventListener('webglcontextlost', onContextLost);

      // Wait for fonts to redraw crisp typography inside posters & 3D labels, then fire onReady
      let disposed = false;
      let readyFired = false;
      const fireReady = () => {
        if (readyFired || disposed) return;
        readyFired = true;
        introStart = performance.now();
        callbacksRef.current.onReady();
      };

      const failsafeTimer = window.setTimeout(fireReady, 4000);
      document.fonts.ready.then(() => {
        if (disposed) return;
        clearPosterCache();
        posterTextures.forEach((tex, gIdx) => {
          const fresh = getPosterCanvas(gIdx);
          const targetCanvas = tex.image as HTMLCanvasElement;
          const ctx = targetCanvas.getContext('2d');
          if (ctx && fresh !== targetCanvas) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(fresh, 0, 0);
          }
          tex.needsUpdate = true;
        });
        for (const item of labelTextures) {
          const fresh = createLabelCanvas(FOLDER_DATA[item.gameIndex], item.gameIndex);
          const ctx = (item.tex.image as HTMLCanvasElement).getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 640, 260);
            ctx.drawImage(fresh, 0, 0);
            item.tex.needsUpdate = true;
          }
        }
        fireReady();
      });

      // Animation loop
      let rafId = 0;
      let lastTime = performance.now();

      const afterDraw = (cb: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              rafId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              rafId = window.setTimeout(cb, 80);
            }
          };
          rafId = window.setTimeout(poll, 5);
        } else {
          rafId = window.setTimeout(cb, 80);
        }
      };

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        if (introActive && readyFired) {
          const elapsed = now - introStart;
          const t = Math.min(1, elapsed / introDuration);
          const e = easeOutExpo(t);
          const targetWalk = getWalkPose(targetTh, isSmallPortrait);
          pose.th = introStartTh + (targetWalk.th - introStartTh) * e;
          pose.r = introStartR + (targetWalk.r - introStartR) * e;
          pose.yaw = targetWalk.yaw;
          pose.y = targetWalk.y;
          pose.pitch = targetWalk.pitch;
          if (t >= 1) introActive = false;
        } else if (glide.active) {
          const t = Math.min(1, (now - glide.startTime) / glide.duration);
          const eTh = easeOutQuart(t);
          const eYaw = easeOutQuad(t);
          const ePos = easeOutCubic(t);
          pose.th = glide.from.th + (glide.to.th - glide.from.th) * eTh;
          pose.yaw = glide.from.yaw + (glide.to.yaw - glide.from.yaw) * eYaw;
          pose.r = glide.from.r + (glide.to.r - glide.from.r) * ePos;
          pose.y = glide.from.y + (glide.to.y - glide.from.y) * ePos;
          pose.pitch = glide.from.pitch + (glide.to.pitch - glide.from.pitch) * ePos;
          if (t >= 1) glide.active = false;
        } else if (!focusedSlot) {
          if (reducedMotion) {
            pose.th = targetTh;
          } else {
            pose.th += (targetTh - pose.th) * (1 - Math.exp(-dt / 0.36));
          }
        }

        applyCameraPose(pose);
        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      applyCameraPose(pose);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }

      return () => {
        disposed = true;
        clearTimeout(failsafeTimer);
        cancelAnimationFrame(rafId);
        clearTimeout(rafId);
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('resize', onResize);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        for (const d of disposables) {
          d.dispose();
        }
        renderer.dispose();
        if (canvas.parentNode === container) {
          container.removeChild(canvas);
        }
      };
    }, []);

    return <div id="gallery" ref={containerRef} />;
  }
);

GalleryRoom.displayName = 'GalleryRoom';
export default GalleryRoom;
