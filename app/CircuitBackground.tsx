"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Trace = {
  points: Point[];
  path: Path2D;
  length: number;
  animated: boolean;
  phase: number;
  speed: number;
};

const GREEN = "54, 224, 161";

const STREAK = 54;
const REST = 260;

/**
 * Fundo decorativo: trilhas ortogonais estilo placa de circuito, com um
 * risco de luz percorrendo algumas delas. Puramente visual — aria-hidden,
 * sem interação de teclado/leitor de tela.
 */
export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Point[] = [];
    let traces: Trace[] = [];
    let lit: Trace[] = [];
    let raf = 0;
    let running = false;
    let resizeTimer = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    function buildGrid() {
      const spacing = width < 700 ? 110 : 150;
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const grid: Point[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: Point[] = [];
        for (let c = 0; c < cols; c++) {
          const jitter = spacing * 0.26;
          row.push({
            x: c * spacing + (Math.random() - 0.5) * jitter,
            y: r * spacing + (Math.random() - 0.5) * jitter,
          });
        }
        grid.push(row);
      }
      nodes = grid.flat();

      const built: Trace[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];
          const targets: Point[] = [];
          if (c < cols - 1 && Math.random() > 0.35) targets.push(grid[r][c + 1]);
          if (r < rows - 1 && Math.random() > 0.55) targets.push(grid[r + 1][c]);
          for (const n of targets) {
            const bend: Point =
              Math.random() > 0.5 ? { x: n.x, y: p.y } : { x: p.x, y: n.y };
            const points = [p, bend, n];
            const length =
              Math.hypot(bend.x - p.x, bend.y - p.y) +
              Math.hypot(n.x - bend.x, n.y - bend.y);
            if (length < 1) continue;

            const path = new Path2D();
            path.moveTo(p.x, p.y);
            path.lineTo(bend.x, bend.y);
            path.lineTo(n.x, n.y);

            built.push({
              points,
              path,
              length,
              animated: false,
              phase: Math.random(),
              // px por milissegundo — independente do comprimento da trilha,
              // então o risco corre na mesma velocidade em todas elas.
              speed: 0.075 + Math.random() * 0.075,
            });
          }
        }
      }

      traces = built;

      // Sorteia as trilhas acesas em vez de pegar as primeiras da lista: como
      // a lista é montada linha por linha, `slice(0, n)` deixava a animação
      // toda amontoada no canto superior esquerdo.
      const indices = built.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const howMany = Math.min(built.length, width < 700 ? 12 : 22);
      lit = indices.slice(0, howMany).map((i) => {
        built[i].animated = true;
        return built[i];
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
      if (reduceMotion) draw(0);
    }

    function pointAlong(trace: Trace, distance: number): Point {
      let remaining = Math.max(0, Math.min(trace.length, distance));
      for (let i = 0; i < trace.points.length - 1; i++) {
        const a = trace.points[i];
        const b = trace.points[i + 1];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        if (remaining <= segLen || i === trace.points.length - 2) {
          const ratio = segLen === 0 ? 0 : Math.min(1, remaining / segLen);
          return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
        }
        remaining -= segLen;
      }
      return trace.points[trace.points.length - 1];
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = `rgba(${GREEN}, 0.075)`;
      ctx.lineWidth = 1;
      for (const trace of traces) ctx.stroke(trace.path);

      for (const n of nodes) {
        let alpha = 0.12;
        if (mouse.active) {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < 160) alpha = 0.12 + (1 - d / 160) * 0.55;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GREEN}, ${alpha})`;
        ctx.fill();
      }

      if (!reduceMotion) {
        ctx.save();
        ctx.lineCap = "round";

        for (const trace of lit) {
          const cycle = trace.length + STREAK + REST;
          const travelled = (time * trace.speed + trace.phase * cycle) % cycle;

          // Um único traço do padrão fica visível por vez: o "gap" é o ciclo
          // inteiro. Deslocar o offset arrasta esse traço ao longo do caminho,
          // que é o que faz a luz correr pelo fio em vez de piscar parada.
          ctx.setLineDash([STREAK, cycle]);
          ctx.lineDashOffset = STREAK - travelled;

          ctx.shadowColor = `rgba(${GREEN}, 0.85)`;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = `rgba(${GREEN}, 0.5)`;
          ctx.lineWidth = 2.6;
          ctx.stroke(trace.path);

          ctx.shadowBlur = 6;
          ctx.strokeStyle = `rgba(${GREEN}, 0.95)`;
          ctx.lineWidth = 1.3;
          ctx.stroke(trace.path);

          const headAt = travelled - STREAK;
          if (headAt >= 0 && headAt <= trace.length) {
            const head = pointAlong(trace, headAt);
            ctx.shadowBlur = 12;
            ctx.fillStyle = `rgba(${GREEN}, 1)`;
            ctx.beginPath();
            ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
        raf = requestAnimationFrame(draw);
      }
    }

    function start() {
      if (reduceMotion || running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onMouseLeave = () => {
      mouse.active = false;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (canHover) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseleave", onMouseLeave);
    }

    start();

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="circuitBg" aria-hidden="true" />;
}
