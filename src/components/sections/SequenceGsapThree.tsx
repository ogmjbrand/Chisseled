"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/motion";
import { ArrowMark } from "@/components/primitives/Marks";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * PROTOTYPE — NOT THE PRODUCTION SEQUENCE.
 * ------------------------------------------------------------------
 * Built to answer one question: what does GSAP + Three.js actually buy
 * this component over the hand-written version in `Sequence.tsx`?
 *
 * What GSAP's ScrollTrigger removes: the manual pinned-window math
 * (`useScrollProgress`'s rect/vh formula, the `sticky` + utility-class
 * override bug documented in `Sequence.tsx`) — `pin: true` and a scrubbed
 * timeline do the same job with no bespoke geometry code.
 *
 * What Three.js adds that plain CSS/DOM cannot: a real camera with real
 * depth — the product planes sit in an actual 3D scene the camera drifts
 * through, plus a particle field for atmosphere that would cost a canvas
 * or a lot of absolutely-positioned divs to fake in 2D.
 *
 * Not yet at production polish (no reduced-texture-memory teardown beyond
 * dispose-on-unmount, no mobile-specific particle count) — this exists to
 * be looked at and compared, not shipped.
 */

interface GsapStage {
  id: string;
  word: string;
  line: string;
  body: string;
  /** Filename under /media/product/, no extension. */
  media: string;
  bg: string;
}

const STAGES: GsapStage[] = [
  {
    id: "wear",
    word: "Wear it.",
    line: "Apparel",
    body: "Squat-tested at depth. Seam-mapped to the body. Specified on the page so you can check the claim before you buy it.",
    media: "fitted-set",
    bg: "#07070a",
  },
  {
    id: "train",
    word: "Train in it.",
    line: "Training",
    body: "Programmes that read the effort you logged and move the volume accordingly. A coach behind every block, not a PDF behind a paywall.",
    media: "compression-tee--royal",
    bg: "#04120d",
  },
  {
    id: "live",
    word: "Live it.",
    line: "Nutrition & Recovery",
    body: "Full-disclosure labels, research-matched doses, and the recovery half that almost nobody bothers to sell you.",
    media: "whey-protein",
    bg: "#0c0a05",
  },
];

export function SequenceGsapThree() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    let raf = 0;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 6;

    const resize = () => {
      const w = section.clientWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const loader = new THREE.TextureLoader();
    const group = new THREE.Group();
    scene.add(group);

    const meshes = STAGES.map((stage, i) => {
      const geo = new THREE.PlaneGeometry(2.6, 2.6 * (1867 / 1400));
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = i * 4;
      group.add(mesh);
      loader.load(`/media/product/${stage.media}.webp`, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
      });
      return mesh;
    });
    if (meshes[0]) meshes[0].material.opacity = 1;

    // Ambient particle field — the one thing this scene can do that a flat
    // DOM cross-fade cannot without a canvas of its own.
    const particleCount = 240;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color("#9630fc"),
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const progressState = { p: 0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          progressState.p = self.progress;
        },
      },
      defaults: { ease: "power2.inOut" },
    });
    STAGES.forEach((_, i) => {
      const seg = 1 / STAGES.length;
      const start = i * seg;
      if (i > 0) tl.to(meshes[i].material, { opacity: 1, duration: seg * 0.35 }, start);
      if (i < STAGES.length - 1) tl.to(meshes[i].material, { opacity: 0, duration: seg * 0.35 }, start + seg * 0.65);

      const el = textRefs.current[i];
      if (!el) return;
      if (i > 0) tl.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: seg * 0.3 }, start + seg * 0.05);
      if (i < STAGES.length - 1) tl.to(el, { autoAlpha: 0, y: -20, duration: seg * 0.25 }, start + seg * 0.7);
    });

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      const idx = Math.min(STAGES.length - 1, Math.floor(progressState.p * STAGES.length));

      camera.position.x += (idx * 4 - camera.position.x) * 0.08;
      camera.position.y = Math.sin(progressState.p * Math.PI * 2) * 0.15;
      camera.lookAt(camera.position.x, 0, 0);

      const t = clock.getElapsedTime();
      particles.rotation.y = t * 0.02;
      particles.position.x = camera.position.x * 0.4;

      if (bgRef.current) bgRef.current.style.backgroundColor = STAGES[idx].bg;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      tl.scrollTrigger?.kill();
      tl.kill();
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.map?.dispose();
        m.material.dispose();
      });
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [reduced]);

  if (reduced) return <SequenceGsapThreeStatic />;

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden border-t border-bone/10 bg-black"
      aria-labelledby="sequence-gsap-heading"
    >
      <h2 id="sequence-gsap-heading" className="sr-only">
        Wear it. Train in it. Live it. Become Chisseled. (GSAP + Three.js prototype)
      </h2>

      <div
        ref={bgRef}
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: STAGES[0].bg, transition: "background-color 900ms ease" }}
      />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
      <div
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-r from-black/85 via-black/40 to-transparent"
      />

      <div className="shell relative z-[3] flex h-full items-center">
        <div className="relative w-full max-w-[46ch]">
          {STAGES.map((stage, i) => (
            <div
              key={stage.id}
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className={i === 0 ? "relative" : "absolute inset-0"}
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <p className="eyebrow mb-6 text-purple-bright">
                0{i + 1} — {stage.line}
              </p>
              <p className="display-mega mb-7 text-bone">{stage.word}</p>
              <p className="lede text-fog">{stage.body}</p>
              {i === STAGES.length - 1 ? (
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/shop" className="btn btn-primary">
                    Shop the collection
                    <ArrowMark className="size-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SequenceGsapThreeStatic() {
  return (
    <section className="border-t border-bone/10 bg-ink section-pad" aria-labelledby="sequence-gsap-heading-static">
      <div className="shell">
        <h2 id="sequence-gsap-heading-static" className="display-lg mb-14 text-bone">
          Wear it. Train in it. Live it. (reduced motion)
        </h2>
        <p className="lede max-w-[50ch] text-fog">
          The pinned camera-and-particle scene is disabled under prefers-reduced-motion, same as the
          production Sequence — this prototype has no static layout of its own to compare, since the
          question here is only whether the motion is worth adding.
        </p>
      </div>
    </section>
  );
}
