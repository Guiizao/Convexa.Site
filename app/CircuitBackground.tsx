"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Trace = {
  points: Point[];
  length: number;
  pulseOffset: number;
  speed: number;
};

const GREEN = "54, 224, 161";

/**
 * Fundo decorativo: trilhas ortogonais estilo placa de circuito, com um
 * pulso de luz "cobrinha" percorrendo algumas delas. Puramente visual —
 * aria-hidden, sem interação de teclado/leitor de tela.
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
    let raf = 0;
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
            if (length === 0) continue;
            built.push({
              points,
              length,
              pulseOffset: Math.random(),
              speed: 0.00012 + Math.random() * 0.00018,
            });
          }
        }
      }
      traces = built;
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
    }

    function pointAlong(trace: Trace, t: number): Point {
      let remaining = Math.max(0, Math.min(1, t)) * trace.length;
      for (let i = 0; i < trace.points.length - 1; i++) {
        const a = trace.points[i];
        const b = trace.points[i + 1];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const isLast = i === trace.points.length - 2;
        if (remaining <= segLen || isLast) {
          const ratio = segLen === 0 ? 0 : Math.min(1, remaining / segLen);
          return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
        }
        remaining -= segLen;
      }
      return trace.points[trace.points.length - 1];
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height);

      for (const trace of traces) {
        ctx.beginPath();
        ctx.moveTo(trace.points[0].x, trace.points[0].y);
        for (let i = 1; i < trace.points.length; i++) {
          ctx.lineTo(trace.points[i].x, trace.points[i].y);
        }
        ctx.strokeStyle = `rgba(${GREEN}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

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
        const activeTraces = traces.slice(0, Math.min(traces.length, 28));
        for (const trace of activeTraces) {
          const t = (time * trace.speed + trace.pulseOffset) % 1;
          for (let k = 0; k < 6; k++) {
            const tt = t - k * 0.012;
            if (tt < 0) continue;
            const p = pointAlong(trace, tt);
            const a = (1 - k / 6) * 0.85;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.4 - k * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${GREEN}, ${a})`;
            ctx.fill();
          }
        }
        raf = requestAnimationFrame(draw);
      }
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
      if (reduceMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (canHover) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseleave", onMouseLeave);
    }

    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="circuitBg" aria-hidden="true" />;
}
