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
      const isMobile = window.innerWidth <= 768;
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;

      // ── Scene ─ 웜그레이 스튜디오 톤 ───────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xF0F0E8);
      scene.fog = new THREE.FogExp2(0xF0F0E8, 0.055);

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.1,
        120
      );
      camera.position.set(0, 1.65, 18);
      camera.lookAt(0, 1.4, 0);

      // ── FLOOR ─ 웜그레이 바닥 ────────────────────────────────────────────
      const floorGeo = new THREE.PlaneGeometry(10, 80, 20, 80);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xCFCFC3,
        roughness: 0.95,
        metalness: 0.03,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.z = -20;
      floor.receiveShadow = true;
      scene.add(floor);

      // Floor navy line grid
      const addFloorLine = (z: number) => {
        const lg = new THREE.PlaneGeometry(10, 0.02);
        const lm = new THREE.MeshBasicMaterial({
          color: 0x15488A,
          opacity: 0.22,
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
        color: 0x15488A,
        opacity: 0.35,
        transparent: true,
      });
      const aisle = new THREE.Mesh(aisleGeo, aisleMat);
      aisle.rotation.x = -Math.PI / 2;
      aisle.position.set(0, 0.003, -20);
      scene.add(aisle);

      // ── CEILING ───────────────────────────────────────────────────────────
      const ceilGeo = new THREE.PlaneGeometry(10, 80);
      const ceilMat = new THREE.MeshStandardMaterial({
        color: 0xE8E8DF,
        roughness: 1,
        metalness: 0,
      });
      const ceil = new THREE.Mesh(ceilGeo, ceilMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(0, 4.2, -20);
      ceil.receiveShadow = true;
      scene.add(ceil);

      // ── WALLS ─ 웜그레이 벽 ──────────────────────────────────────────────
      const wallGeo = new THREE.PlaneGeometry(80, 4.2);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xDEDED4,
        roughness: 0.95,
        metalness: 0.02,
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
      const backMat = new THREE.MeshStandardMaterial({ color: 0xCAC9BD, roughness: 0.9 });
      const backWall = new THREE.Mesh(backGeo, backMat);
      backWall.position.set(0, 2.1, -58);
      scene.add(backWall);

      // ── NAVY WALL TRIM STRIPS ─────────────────────────────────────────────
      const addWallTrim = (side: "L" | "R", zStart: number, zEnd: number, y: number) => {
        const len = Math.abs(zEnd - zStart);
        const trimGeo = new THREE.PlaneGeometry(0.04, len);
        const trimMat = new THREE.MeshBasicMaterial({
          color: 0x15488A,
          opacity: 0.4,
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
            color: 0xB8B8AC,
            metalness: 0.15,
            roughness: 0.7,
          });
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(side === "L" ? -4.96 : 4.96, 2.1, z);
          scene.add(col);

          const accentGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
          const accentMat = new THREE.MeshStandardMaterial({
            color: 0x15488A,
            metalness: 0.5,
            roughness: 0.4,
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
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x888878, metalness: 0.5 });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(0, 4.14, -20);
      scene.add(track);

      // ── CEILING SPOTLIGHTS ────────────────────────────────────────────────
      const addCeilingSpot = (z: number, intensity: number) => {
        const fix = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.08, 0.22, 8),
          new THREE.MeshStandardMaterial({ color: 0x888878, metalness: 0.7 })
        );
        fix.position.set(0, 4.1, z);
        scene.add(fix);

        const spot = new THREE.SpotLight(0xfff8ec, intensity, 14, Math.PI / 5, 0.4, 1.5);
        spot.position.set(0, 4.05, z);
        spot.target.position.set(0, 0, z);
        spot.castShadow = true;
        scene.add(spot);
        scene.add(spot.target);
      };
      for (let z = 1; z > -52; z -= 7) addCeilingSpot(z, 0.85);

      // Stage spotlight (navy accent)
      const stageSpot = new THREE.SpotLight(0x15488A, 4, 30, Math.PI / 9, 0.35, 1.2);
      stageSpot.position.set(0, 4, -45);
      stageSpot.target.position.set(0, 0, -55);
      scene.add(stageSpot);
      scene.add(stageSpot.target);

      // Ambient light — 밝은 웜톤
      scene.add(new THREE.AmbientLight(0xf5f3ea, 2.2));

      // Camera fill light
      const camLight = new THREE.PointLight(0xfff6e8, 0.4, 8);
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

      let isVisible = true;
      let lastIdleFrame = 0;
      const IDLE_INTERVAL = isMobile ? 1000 / 30 : 0; // 모바일 idle: 30fps 스로틀

      const animate = (ts: number) => {
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
          renderer.render(scene, camera);
          if (isVisible) animFrameId = requestAnimationFrame(animate);
        } else {
          // idle 페이즈: 모바일에서 30fps로 스로틀
          if (ts - lastIdleFrame >= IDLE_INTERVAL) {
            lastIdleFrame = ts;
            const t2 = (ts - startTime - FLY_DUR) / 1000;
            camera.position.x = Math.sin(t2 * 0.18) * 0.04;
            camera.position.y = 1.53 + Math.sin(t2 * 0.27) * 0.015;
            camera.lookAt(Math.sin(t2 * 0.12) * 0.03, 1.35, 0);
            renderer.render(scene, camera);
          }
          if (isVisible) animFrameId = requestAnimationFrame(animate);
        }
      }
      animFrameId = requestAnimationFrame(animate);

      // 뷰포트 밖으로 나가면 raf 완전 중단, 돌아오면 재시작
      const observer = new IntersectionObserver(
        (entries) => {
          const nowVisible = entries[0].isIntersecting;
          if (nowVisible && !isVisible) {
            isVisible = true;
            animFrameId = requestAnimationFrame(animate);
          } else if (!nowVisible && isVisible) {
            isVisible = false;
            cancelAnimationFrame(animFrameId);
          }
        },
        { threshold: 0, rootMargin: '100px' }
      );
      observer.observe(canvas);

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
        observer.disconnect();
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
        position: "absolute",
        inset: 0,
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
