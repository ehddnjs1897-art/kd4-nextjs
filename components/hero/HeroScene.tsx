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
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      const isMobile = window.innerWidth <= 768;
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = false; // 섀도우 OFF — 텍스처 유닛 한도 회피
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;

      // ── Scene ─────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      // 웜그레이 배경 — 사이트 전체 톤과 통일
      scene.background = new THREE.Color(0xE8E4D8);
      // 포그 강하게 — 사이드 엣지가 자연스럽게 풀어지도록
      scene.fog = new THREE.FogExp2(0xE8E4D8, 0.055);

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        50, window.innerWidth / window.innerHeight, 0.1, 120
      );
      camera.position.set(0, 3.0, 22);
      camera.lookAt(0, 0.6, 0);

      // ── FLOOR — 실사 오크 텍스처 (/textures/wood.JPG) ───────────────────
      const loader = new THREE.TextureLoader();
      const woodTex = loader.load("/textures/wood.JPG");
      woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
      woodTex.repeat.set(4, 10); // 판자 크기 느낌 — 타일링 반복 (연장된 바닥에 맞춤)
      woodTex.anisotropy = 8;
      // 색 공간 보정 (sRGB → 실제 톤 유지)
      if ("colorSpace" in woodTex) {
        // three r152+
        (woodTex as any).colorSpace = THREE.SRGBColorSpace;
      } else {
        (woodTex as any).encoding = 3001; // sRGBEncoding fallback
      }

      // color 틴트로 채도 낮춤 — 주황빛 오크 → 웜그레이 톤 오크
      const floorMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0xBFB5A0, // 웜그레이 틴트 (텍스처 색과 곱해짐)
        roughness: 0.75,
        metalness: 0.02,
      });

      // 바닥 — 카메라 시작점(z=22)까지 덮도록 넉넉하게 연장 (22×48, z=0 중심)
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 48),
        floorMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, 0);
      scene.add(floor);

      // ── WALLS (웜그레이 톤 — 배경과 이어지도록) ──────────────────────
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xE2DCCD, roughness: 0.95 });

      // 뒷벽
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), wallMat);
      backWall.position.set(0, 2.75, -20);
      scene.add(backWall);

      // 뒷벽 가운데에 유리문 암시 (밝은 세로 띠)
      const doorHint = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 3.2),
        new THREE.MeshBasicMaterial({
          color: 0xFFF8E8, transparent: true, opacity: 0.55,
        })
      );
      doorHint.position.set(0, 1.6, -19.98);
      scene.add(doorHint);

      // 타이틀은 DOM/CSS로 렌더 (픽셀 단위 선명도) — page.tsx의 .hero-title-wall 참고

      // 왼쪽 벽 — 톤 살짝 낮춰서 배경과 구분, 카메라 시작점까지 확장 (길이 48)
      const sideWallMat = new THREE.MeshStandardMaterial({
        color: 0xD6CFBE, roughness: 0.95, side: THREE.DoubleSide,
      });
      const wallL = new THREE.Mesh(new THREE.PlaneGeometry(48, 5.5), sideWallMat);
      wallL.rotation.y = Math.PI / 2;
      wallL.position.set(-11, 2.75, 0);
      scene.add(wallL);

      // 오른쪽 벽
      const wallR = new THREE.Mesh(new THREE.PlaneGeometry(48, 5.5), sideWallMat.clone());
      wallR.rotation.y = -Math.PI / 2;
      wallR.position.set(11, 2.75, 0);
      scene.add(wallR);

      // ── 사이드 벽 디테일: 베이스보드 + 허리선 몰딩 ─────────────────────
      // 다크 우드 걸레받이 (바닥 경계 명확하게) — 연장된 벽 길이(48)에 맞춤
      const baseboardMat = new THREE.MeshStandardMaterial({
        color: 0x3E2E1F, roughness: 0.6, metalness: 0.05,
      });
      const baseL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 48), baseboardMat);
      baseL.position.set(-10.98, 0.09, 0);
      scene.add(baseL);
      const baseR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 48), baseboardMat);
      baseR.position.set(10.98, 0.09, 0);
      scene.add(baseR);
      const baseB = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.04), baseboardMat);
      baseB.position.set(0, 0.09, -19.98);
      scene.add(baseB);

      // 허리선 몰딩 (chair rail) — 은은한 구분선
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xC8BFA8, roughness: 0.6, metalness: 0.08,
      });
      const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 48), trimMat);
      trimL.position.set(-10.97, 1.35, 0);
      scene.add(trimL);
      const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 48), trimMat);
      trimR.position.set(10.97, 1.35, 0);
      scene.add(trimR);

      // ── 크라운 몰딩 (천장-벽 경계) — 다크한 실선으로 명확하게 ─────────
      const crownMat = new THREE.MeshBasicMaterial({ color: 0x2A251E });
      // 왼쪽 벽 상단
      const crownL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 48), crownMat);
      crownL.position.set(-10.95, 5.46, 0);
      scene.add(crownL);
      // 오른쪽 벽 상단
      const crownR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 48), crownMat);
      crownR.position.set(10.95, 5.46, 0);
      scene.add(crownR);
      // 뒷벽 상단
      const crownB = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 0.05), crownMat);
      crownB.position.set(0, 5.46, -19.95);
      scene.add(crownB);

      // ── CEILING (웜그레이 톤) — 카메라 시작점까지 연장 ───────────────
      const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 48),
        new THREE.MeshStandardMaterial({ color: 0xC9C0AC, roughness: 1 })
      );
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(0, 5.5, 0);
      scene.add(ceil);

      // T-bar 격자 (드롭 천장 느낌) — 얇은 금속 레일
      const tbarMat = new THREE.MeshStandardMaterial({ color: 0xBDBAB0, roughness: 0.5, metalness: 0.4 });
      // 가로 레일 — 연장된 천장에 맞춰 더 많이
      for (let z = 20; z > -20; z -= 4) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(22, 0.03, 0.04), tbarMat);
        rail.position.set(0, 5.48, z);
        scene.add(rail);
      }
      // 세로 레일 — 연장된 천장 전체
      [-7, 0, 7].forEach((x) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 48), tbarMat);
        rail.position.set(x, 5.48, 0);
        scene.add(rail);
      });

      // ── 3개의 강한 스포트라이트 (임팩트 포인트) ─────────────────────────
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.6, metalness: 0.3 });

      const addSpot = (z: number) => {
        // 천장 트랙 마운트
        const mount = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.08, 0.15),
          bodyMat
        );
        mount.position.set(0, 5.5, z);
        scene.add(mount);

        // 암
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8),
          bodyMat
        );
        arm.position.set(0, 5.22, z);
        scene.add(arm);

        // 본체 (큰 원통)
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.10, 0.30, 12),
          bodyMat
        );
        body.position.set(0, 4.90, z);
        scene.add(body);

        // 빛나는 렌즈
        const lens = new THREE.Mesh(
          new THREE.CircleGeometry(0.09, 16),
          new THREE.MeshBasicMaterial({ color: 0xFFF2C8 })
        );
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 4.74, z);
        scene.add(lens);

        // 빛 원뿔 — 단일 원뿔 (깔끔하게)
        // ConeGeometry 기본: apex(뾰족) = +y (렌즈 근처), base(넓은 끝) = -y (바닥)
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 4.7, 28, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xFFF2CC, transparent: true, opacity: 0.12,
            side: THREE.DoubleSide, depthWrite: false,
          })
        );
        cone.position.set(0, 2.35, z);
        scene.add(cone);

        // 바닥 풀 — 부드러운 글로우
        const pool = new THREE.Mesh(
          new THREE.CircleGeometry(1.5, 32),
          new THREE.MeshBasicMaterial({
            color: 0xFFECC0, transparent: true, opacity: 0.22,
            depthWrite: false,
          })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, 0.012, z);
        scene.add(pool);

        // SpotLight (섀도우 없이)
        const spot = new THREE.SpotLight(0xFFF0C8, 2.0, 12, Math.PI / 6, 0.55, 1.4);
        spot.position.set(0, 4.7, z);
        spot.target.position.set(0, 0, z);
        scene.add(spot);
        scene.add(spot.target);
      };

      // 딱 3개만 — 아담한 공간에 맞춰 간격 좁게
      addSpot(1);
      addSpot(-4);
      addSpot(-10);

      // ── AMBIENT ───────────────────────────────────────────────────────────
      // 웜그레이 톤 ambient — 과한 주황빛 방지
      scene.add(new THREE.AmbientLight(0xEFEADD, 1.7));

      // 부드러운 필 라이트
      const fill = new THREE.DirectionalLight(0xF0E8D0, 0.5);
      fill.position.set(3, 5, 8);
      scene.add(fill);

      // ── CAMERA ANIMATION — 슬로우 달리 줌 ──────────────────────────────
      // 달리 줌 = 카메라는 앞으로 이동하면서 FOV 살짝 넓어짐 (히치콕 Vertigo 효과의 서브틀한 버전)
      let startTime: number | null = null;
      const TOTAL = 11000; // 11초 — 더 천천히

      // 부드럽고 시네마틱한 이징 — 초반 빠르게, 후반 부드럽게 (easeOutQuart)
      const easeInOutCubic = (t: number): number =>
        1 - Math.pow(1 - t, 3.2);

      let isVisible = true;
      let lastIdleFrame = 0;
      const IDLE_INTERVAL = isMobile ? 1000 / 30 : 0;

      const animate = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const t = Math.min(elapsed / TOTAL, 1);

        if (t < 1) {
          const e = easeInOutCubic(t);
          // 달리 (카메라 z=22 → z=3.8)
          camera.position.z = 22 - 18.2 * e;
          camera.position.y = 3.0 - 1.4 * e;
          camera.position.x = Math.sin(t * Math.PI * 0.12) * 0.025;
          // 줌 (FOV 50 → 55 — 미묘하게 넓어지며 배경이 뒤로 밀리는 느낌)
          camera.fov = 50 + 5 * e;
          camera.updateProjectionMatrix();
          camera.lookAt(0, 0.6 + 1.0 * e, -6);
        } else {
          if (ts - lastIdleFrame >= IDLE_INTERVAL) {
            lastIdleFrame = ts;
            const t2 = (elapsed - TOTAL) / 1000;
            camera.position.x = Math.sin(t2 * 0.15) * 0.035;
            camera.position.y = 1.6 + Math.sin(t2 * 0.22) * 0.012;
            camera.position.z = 3.8;
            camera.fov = 55 + Math.sin(t2 * 0.18) * 0.15;
            camera.updateProjectionMatrix();
            camera.lookAt(Math.sin(t2 * 0.1) * 0.025, 1.6, -6);
          }
        }

        renderer.render(scene, camera);
        if (isVisible) animFrameId = requestAnimationFrame(animate);
      };
      animFrameId = requestAnimationFrame(animate);

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
        { threshold: 0, rootMargin: "100px" }
      );
      observer.observe(canvas);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

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
