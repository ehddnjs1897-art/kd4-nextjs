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

      // ── FLOOR — 프로시저럴 우드플로어 (Canvas2D 랜덤 엇갈림 판자) ─────
      // JPG 타일링은 세로줄 이음새가 노출돼서 합판 느낌 → 판자마다 길이/톤/엇갈림을
      // 자연스럽게 분산시킨 canvas 텍스처로 대체
      const makeWoodFloorTexture = (): THREE.CanvasTexture => {
        const canvas = document.createElement("canvas");
        // 1024×2048 — 세로(V) = 판자 길이 방향
        canvas.width = 1024;
        canvas.height = 2048;
        const ctx = canvas.getContext("2d")!;

        // 배경 = 어두운 이음새 색
        ctx.fillStyle = "#2E241A";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 차분한 웜 미드톤 팔레트 (채도 낮춤)
        const plankTones = [
          "#7E6B55", "#6E5D49", "#7A6754", "#665645",
          "#827062", "#75634F", "#6B5A46", "#80705E",
          "#705F4C", "#78685A",
        ];

        const plankW = 82; // 판자 가로폭 (픽셀)
        let colIdx = 0;
        for (let x = 0; x < canvas.width; x += plankW) {
          // 각 열마다 랜덤 오프셋 → 판자 끝 위치가 엇갈림
          let yOffset = (colIdx * 380 + Math.random() * 240) % canvas.height;
          let y = -yOffset;

          while (y < canvas.height) {
            const plankLen = 260 + Math.random() * 480; // 260~740px 판자 길이
            const tone = plankTones[Math.floor(Math.random() * plankTones.length)];

            // 판자 본체 (2px 여백 = 다크 이음새)
            ctx.fillStyle = tone;
            ctx.fillRect(x + 2, y + 2, plankW - 4, plankLen - 4);

            // 판자 내부 나뭇결 (세로 방향의 미세한 곡선)
            ctx.strokeStyle = "rgba(0,0,0,0.07)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
              const gx = x + 10 + Math.random() * (plankW - 20);
              ctx.beginPath();
              ctx.moveTo(gx, y + 6);
              ctx.bezierCurveTo(
                gx + (Math.random() - 0.5) * 4, y + plankLen * 0.3,
                gx + (Math.random() - 0.5) * 4, y + plankLen * 0.7,
                gx, y + plankLen - 6
              );
              ctx.stroke();
            }

            // 아주 살짝 밝은 하이라이트 줄 (판자 왼쪽 가장자리)
            ctx.strokeStyle = "rgba(255,240,220,0.04)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 4);
            ctx.lineTo(x + 3, y + plankLen - 4);
            ctx.stroke();

            y += plankLen;
          }
          colIdx++;
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = 8;
        if ("colorSpace" in tex) {
          (tex as any).colorSpace = THREE.SRGBColorSpace;
        } else {
          (tex as any).encoding = 3001;
        }
        return tex;
      };

      const woodTex = makeWoodFloorTexture();
      // 바닥이 22×48 — 반복 횟수 낮춰서 타일링 패턴 티 안나게
      woodTex.repeat.set(1.5, 3);

      // 살짝만 틴트 — 텍스처가 이미 톤 다운 돼있어서 흰색에 가까운 중립톤
      const floorMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0xB8AD9A, // 은은한 웜그레이 톤 (텍스처 색과 곱해짐)
        roughness: 0.88,
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

      // ── 올리브 나무 (좌우 사이드 화분) ──────────────────────────────────
      // 실버세이지 녹색 잎 + 얇은 트렁크 + 테라코타 화분 — 공간에 숨결 추가
      const olivePotMat = new THREE.MeshStandardMaterial({
        color: 0x8A5A3E, // 테라코타
        roughness: 0.9,
        metalness: 0.02,
      });
      const oliveTrunkMat = new THREE.MeshStandardMaterial({
        color: 0x5C4A38, // 차분한 올리브 목피
        roughness: 0.95,
        metalness: 0.02,
      });
      const oliveLeafMat = new THREE.MeshStandardMaterial({
        color: 0x8FA07A, // 실버세이지 그린 (올리브 잎 특유의 은녹)
        roughness: 0.85,
        metalness: 0.04,
        flatShading: true, // 저폴리 느낌으로 잎 클러스터 더 자연스럽게
      });

      const addOliveTree = (x: number, z: number, scale: number = 1) => {
        const group = new THREE.Group();

        // 화분 크기도 나무 크기에 비례 — 작은 묘목은 작은 화분
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28 * scale, 0.22 * scale, 0.36 * scale, 12),
          olivePotMat
        );
        pot.position.y = 0.18 * scale;
        group.add(pot);

        const soil = new THREE.Mesh(
          new THREE.CircleGeometry(0.26 * scale, 12),
          new THREE.MeshBasicMaterial({ color: 0x2A1F15 })
        );
        soil.rotation.x = -Math.PI / 2;
        soil.position.y = 0.361 * scale;
        group.add(soil);

        // 트렁크 — 자연스러운 기울기
        const trunkHeight = 1.1 * scale;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04 * scale, 0.055 * scale, trunkHeight, 8),
          oliveTrunkMat
        );
        trunk.position.y = 0.36 * scale + trunkHeight * 0.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.12;
        trunk.rotation.x = (Math.random() - 0.5) * 0.08;
        group.add(trunk);

        // 잎 클러스터 — 개수·위치·크기 모두 랜덤 (3~6개) → 복제 느낌 제거
        const foliageBase = 0.36 * scale + trunkHeight;
        const clusterCount = 3 + Math.floor(Math.random() * 4); // 3~6
        for (let i = 0; i < clusterCount; i++) {
          const t = i / Math.max(1, clusterCount - 1); // 0~1 진행도
          // 아래에서 위로 점점 작아지는 수관 형태
          const yPos = foliageBase + (t * 0.75 - 0.1) * scale;
          const offX = (Math.random() - 0.5) * 0.32 * scale;
          const offZ = (Math.random() - 0.5) * 0.32 * scale;
          // 위로 갈수록 작아지고, 전체 개수에 따라 크기 조정
          const radiusBase = (0.3 + Math.random() * 0.22) * scale;
          const r = radiusBase * (1 - t * 0.35);

          const foliage = new THREE.Mesh(
            new THREE.IcosahedronGeometry(r, 1),
            oliveLeafMat
          );
          foliage.position.set(offX, yPos, offZ);
          // 살짝 눌린 타원 + 랜덤 회전으로 실루엣 다양화
          foliage.scale.set(
            1 + (Math.random() - 0.5) * 0.2,
            0.82 + Math.random() * 0.12,
            1 + (Math.random() - 0.5) * 0.2
          );
          foliage.rotation.y = Math.random() * Math.PI;
          group.add(foliage);
        }

        group.position.set(x, 0, z);
        // 그룹 전체 랜덤 회전 — 각 나무가 다른 방향을 바라보게
        group.rotation.y = Math.random() * Math.PI * 2;
        scene.add(group);
      };

      // ── 배치: 배우들의 성장 서사 ──
      // 카메라가 z=22 → z=3.8로 진입하며 지나가는 순서대로 작은→큰 나무가 등장
      // 좌 3그루 (세 단계 세분: 묘목·성장·원숙) + 우 2그루 (시작·완성 대비)
      // 비대칭이지만 우측의 가장 큰 나무가 좌측 세 그루의 시각적 무게를 균형잡음
      addOliveTree(-9.3, 10, 0.45);    // 좌1: 갓 심은 묘목 — 입문 단계
      addOliveTree(9.2, 5, 0.62);      // 우1: 어린 나무 — 첫 성장
      addOliveTree(-9.1, -1, 0.9);     // 좌2: 자라는 중 — 본격 훈련
      addOliveTree(9.4, -9, 1.35);     // 우2: 우측의 완성체 — 원숙한 배우
      addOliveTree(-9.4, -14, 1.15);   // 좌3: 뒷배경의 큰 나무 — 깊이감

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
