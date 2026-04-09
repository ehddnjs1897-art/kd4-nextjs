"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animFrameId: number;

    try {
      // ── Renderer ──────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;

      // ── Scene ─────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020202);
      scene.fog = new THREE.FogExp2(0x020202, 0.072);

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.1,
        120
      );
      camera.position.set(0, 1.65, 18);
      camera.lookAt(0, 1.4, 0);

      // ── FLOOR ─────────────────────────────────────────────────────────────
      const floorGeo = new THREE.PlaneGeometry(10, 80, 20, 80);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0d0c0a,
        roughness: 0.92,
        metalness: 0.08,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.z = -20;
      floor.receiveShadow = true;
      scene.add(floor);

      // Floor gold line grid
      const addFloorLine = (z: number) => {
        const lg = new THREE.PlaneGeometry(10, 0.02);
        const lm = new THREE.MeshBasicMaterial({
          color: 0xc4a55a,
          opacity: 0.18,
          transparent: true,
        });
        const l = new THREE.Mesh(lg, lm);
        l.rotation.x = -Math.PI / 2;
        l.position.set(0, 0.002, z);
        scene.add(l);
      };
      for (let z = 2; z > -55; z -= 3.5) addFloorLine(z);

      // Center aisle line
      const aisleGeo = new THREE.PlaneGeometry(0.06, 80);
      const aisleMat = new THREE.MeshBasicMaterial({
        color: 0xc4a55a,
        opacity: 0.3,
        transparent: true,
      });
      const aisle = new THREE.Mesh(aisleGeo, aisleMat);
      aisle.rotation.x = -Math.PI / 2;
      aisle.position.set(0, 0.003, -20);
      scene.add(aisle);

      // ── CEILING ───────────────────────────────────────────────────────────
      const ceilGeo = new THREE.PlaneGeometry(10, 80);
      const ceilMat = new THREE.MeshStandardMaterial({
        color: 0x080808,
        roughness: 1,
        metalness: 0,
      });
      const ceil = new THREE.Mesh(ceilGeo, ceilMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(0, 4.2, -20);
      ceil.receiveShadow = true;
      scene.add(ceil);

      // ── WALLS ─────────────────────────────────────────────────────────────
      const wallGeo = new THREE.PlaneGeometry(80, 4.2);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x0c0b09,
        roughness: 0.95,
        metalness: 0.04,
      });

      // Left wall
      const wallL = new THREE.Mesh(wallGeo, wallMat.clone());
      wallL.rotation.y = Math.PI / 2;
      wallL.position.set(-5, 2.1, -20);
      wallL.receiveShadow = true;
      scene.add(wallL);

      // Right wall
      const wallR = new THREE.Mesh(wallGeo, wallMat.clone());
      wallR.rotation.y = -Math.PI / 2;
      wallR.position.set(5, 2.1, -20);
      wallR.receiveShadow = true;
      scene.add(wallR);

      // Back wall
      const backGeo = new THREE.PlaneGeometry(10, 4.2);
      const backMat = new THREE.MeshStandardMaterial({ color: 0x100e0a, roughness: 0.9 });
      const backWall = new THREE.Mesh(backGeo, backMat);
      backWall.position.set(0, 2.1, -58);
      scene.add(backWall);

      // ── GOLD WALL TRIM STRIPS ─────────────────────────────────────────────
      const addWallTrim = (side: "L" | "R", zStart: number, zEnd: number, y: number) => {
        const len = Math.abs(zEnd - zStart);
        const trimGeo = new THREE.PlaneGeometry(0.04, len);
        const trimMat = new THREE.MeshBasicMaterial({
          color: 0xc4a55a,
          opacity: 0.35,
          transparent: true,
        });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.rotation.y = side === "L" ? Math.PI / 2 : -Math.PI / 2;
        trim.position.set(side === "L" ? -4.97 : 4.97, y, (zStart + zEnd) / 2);
        scene.add(trim);
      };
      addWallTrim("L", 5, -58, 0.05);
      addWallTrim("R", 5, -58, 0.05);
      addWallTrim("L", 5, -58, 4.15);
      addWallTrim("R", 5, -58, 4.15);

      // ── VERTICAL COLUMNS ──────────────────────────────────────────────────
      for (let z = 0; z > -55; z -= 7) {
        (["L", "R"] as const).forEach((side) => {
          const colGeo = new THREE.BoxGeometry(0.06, 4.2, 0.06);
          const colMat = new THREE.MeshStandardMaterial({
            color: 0x1a1608,
            metalness: 0.3,
            roughness: 0.6,
          });
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(side === "L" ? -4.96 : 4.96, 2.1, z);
          scene.add(col);

          const accentGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
          const accentMat = new THREE.MeshStandardMaterial({
            color: 0xc4a55a,
            metalness: 0.7,
            roughness: 0.3,
          });
          [0.4, 2.1, 3.8].forEach((ay) => {
            const accent = new THREE.Mesh(accentGeo, accentMat);
            accent.position.set(side === "L" ? -4.96 : 4.96, ay, z);
            scene.add(accent);
          });
        });
      }

      // ── CEILING TRACK ─────────────────────────────────────────────────────
      const trackGeo = new THREE.BoxGeometry(0.08, 0.08, 55);
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(0, 4.14, -20);
      scene.add(track);

      // ── CEILING SPOTLIGHTS ────────────────────────────────────────────────
      const addCeilingSpot = (z: number, intensity: number) => {
        const fix = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.08, 0.22, 8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 })
        );
        fix.position.set(0, 4.1, z);
        scene.add(fix);

        const spot = new THREE.SpotLight(0xfff4e0, intensity, 14, Math.PI / 5, 0.4, 1.5);
        spot.position.set(0, 4.05, z);
        spot.target.position.set(0, 0, z);
        spot.castShadow = true;
        scene.add(spot);
        scene.add(spot.target);
      };
      for (let z = 1; z > -52; z -= 7) addCeilingSpot(z, 1.4);

      // Stage spotlight (gold)
      const stageSpot = new THREE.SpotLight(0xc4a55a, 8, 30, Math.PI / 9, 0.35, 1.2);
      stageSpot.position.set(0, 4, -45);
      stageSpot.target.position.set(0, 0, -55);
      scene.add(stageSpot);
      scene.add(stageSpot.target);

      // Ambient light
      scene.add(new THREE.AmbientLight(0x0a0805, 1.8));

      // Camera fill light
      const camLight = new THREE.PointLight(0xfff0d0, 0.6, 8);
      camLight.position.set(0, 2.5, 16);
      scene.add(camLight);

      // ── CAMERA ANIMATION ──────────────────────────────────────────────────
      // Phase 1 (0→4.2s): fly from z=18 → z=4
      // Phase 2 (4.2s+): idle sway
      let startTime: number | null = null;
      let phase: "fly" | "idle" = "fly";
      const FLY_DUR = 4200;
      const FLY_FROM = 18;
      const FLY_TO = 4;
      let revealed = false;

      const easeOutExpo = (t: number): number => {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      };

      const animate = (ts: number) => {
        animFrameId = requestAnimationFrame(animate);
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        if (phase === "fly") {
          const t = Math.min(elapsed / FLY_DUR, 1);
          const e = easeOutExpo(t);
          camera.position.z = FLY_FROM - (FLY_FROM - FLY_TO) * e;
          camera.position.y = 1.65 - 0.12 * e;
          camera.lookAt(0, 1.4 - 0.05 * e, 0);
          if (t >= 1 && !revealed) {
            revealed = true;
            phase = "idle";
          }
        } else {
          const t2 = (ts - startTime - FLY_DUR) / 1000;
          camera.position.x = Math.sin(t2 * 0.18) * 0.04;
          camera.position.y = 1.53 + Math.sin(t2 * 0.27) * 0.015;
          camera.lookAt(Math.sin(t2 * 0.12) * 0.03, 1.35, 0);
        }

        renderer.render(scene, camera);
      }
      animFrameId = requestAnimationFrame(animate);

      // ── RESIZE HANDLER ────────────────────────────────────────────────────
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // ── CLEANUP ───────────────────────────────────────────────────────────
      return () => {
        cancelAnimationFrame(animFrameId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    } catch (err) {
      console.error("[HeroScene] Three.js 초기화 실패:", err);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        display: "block",
      }}
    />
  );
}
