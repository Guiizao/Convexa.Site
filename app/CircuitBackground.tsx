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
  tone: number;
};
type Pad = { x: number; y: number; r: number; hollow: boolean };

const GREEN = "54, 224, 161";

// Três verdes para as trilhas não parecerem desenhadas com a mesma caneta.
// O site tem fundo preto, então a variação é entre verdes CLAROS: tom escuro
// sobre preto simplesmente some.
const TONES = ["54, 224, 161", "43, 217, 107", "134, 245, 190"];

const STREAK = 72;
const REST = 200;

const sign = (v: number) => (v < 0 ? -1 : 1);

/**
 * Roteia como numa placa de verdade: trecho reto, diagonal de 45 graus, trecho
 * reto. É a diagonal que dá a leitura de PCB em vez de grade quadriculada.
 */
function route(from: Point, to: Point, horizontalFirst: boolean): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const diag = Math.min(Math.abs(dx), Math.abs(dy));

  if (horizontalFirst) {
    const turn = from.x + sign(dx) * (Math.abs(dx) - diag);
    return [
      from,
      { x: turn, y: from.y },
      { x: turn + sign(dx) * diag, y: from.y + sign(dy) * diag },
      to,
    ];
  }
  const turn = from.y + sign(dy) * (Math.abs(dy) - diag);
  return [
    from,
    { x: from.x, y: turn },
    { x: from.x + sign(dx) * diag, y: turn + sign(dy) * diag },
    to,
  ];
}

function pathOf(points: Point[]): { path: Path2D; length: number } {
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y);
    length += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
  }
  return { path, length };
}

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
    let traces: Trace[] = [];
    let lit: Trace[] = [];
    let pads: Pad[] = [];
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


      const built: Trace[] = [];
      const builtPads: Pad[] = [];

      const addTrace = (a: Point, b: Point, bus: boolean) => {
        const horizontalFirst = Math.random() > 0.5;
        const points = route(a, b, horizontalFirst);
        const { path, length } = pathOf(points);
        if (length < 8) return;
        built.push({
          points,
          path,
          length,
          animated: false,
          phase: Math.random(),
          // px por milissegundo — independente do comprimento da trilha,
          // então o risco corre na mesma velocidade em todas elas.
          speed: 0.075 + Math.random() * 0.075,
          tone: Math.floor(Math.random() * TONES.length),
        });

        // Feixe: trilhas correndo juntas, como um barramento numa placa.
        if (bus) {
          const offsets = Math.random() > 0.5 ? [5, 10] : [6];
          for (const off of offsets) {
            const shifted = route(
              { x: a.x, y: a.y + off },
              { x: b.x, y: b.y + off },
              horizontalFirst,
            );
            const built2 = pathOf(shifted);
            built.push({
              points: shifted,
              path: built2.path,
              length: built2.length,
              animated: false,
              phase: Math.random(),
              speed: 0.075 + Math.random() * 0.075,
              tone: Math.floor(Math.random() * TONES.length),
            });
          }
        }
      };

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];

          if (c < cols - 1 && Math.random() > 0.4) {
            addTrace(p, grid[r][c + 1], Math.random() > 0.72);
          }
          if (r < rows - 1 && Math.random() > 0.56) {
            addTrace(p, grid[r + 1][c], false);
          }
          if (r < rows - 1 && c < cols - 1 && Math.random() > 0.82) {
            addTrace(p, grid[r + 1][c + 1], false);
          }

          // Ilhas: nem todo nó vira pad, e alguns são vias vazadas.
          if (Math.random() > 0.45) {
            builtPads.push({
              x: p.x,
              y: p.y,
              r: Math.random() > 0.72 ? 3.2 : 2,
              hollow: Math.random() > 0.55,
            });
          }

          // Stub curto terminando em ilha, comum numa placa real.
          if (Math.random() > 0.8) {
            const len = spacing * (0.28 + Math.random() * 0.22);
            const dir = Math.floor(Math.random() * 4);
            const end =
              dir === 0
                ? { x: p.x + len, y: p.y }
                : dir === 1
                  ? { x: p.x - len, y: p.y }
                  : dir === 2
                    ? { x: p.x, y: p.y + len }
                    : { x: p.x, y: p.y - len };
            const stub = pathOf([p, end]);
            built.push({
              points: [p, end],
              path: stub.path,
              length: stub.length,
              animated: false,
              phase: Math.random(),
              speed: 0.08,
              tone: Math.floor(Math.random() * TONES.length),
            });
            builtPads.push({
              x: end.x,
              y: end.y,
              r: 2.4,
              hollow: Math.random() > 0.5,
            });
          }
        }
      }

      traces = built;
      pads = builtPads;

      // Sorteia as trilhas acesas em vez de pegar as primeiras da lista: como
      // a lista é montada linha por linha, `slice(0, n)` deixava a animação
      // toda amontoada no canto superior esquerdo.
      const long = built.filter((t) => t.length > spacing * 0.6);
      for (let i = long.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [long[i], long[j]] = [long[j], long[i]];
      }
      const howMany = Math.min(long.length, width < 700 ? 20 : 36);
      lit = long.slice(0, howMany).map((t) => {
        t.animated = true;
        return t;
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

      ctx.lineWidth = 1.1;
      ctx.lineJoin = "round";
      for (const trace of traces) {
        ctx.strokeStyle = `rgba(${TONES[trace.tone]}, 0.115)`;
        ctx.stroke(trace.path);
      }

      // Ilhas e vias: é o que faz o desenho ler como placa em vez de malha.
      for (const pad of pads) {
        let alpha = 0.2;
        if (mouse.active) {
          const d = Math.hypot(pad.x - mouse.x, pad.y - mouse.y);
          if (d < 170) alpha = 0.2 + (1 - d / 170) * 0.6;
        }
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, pad.r, 0, Math.PI * 2);
        if (pad.hollow) {
          ctx.strokeStyle = `rgba(${GREEN}, ${alpha})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${GREEN}, ${alpha})`;
          ctx.fill();
        }
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
