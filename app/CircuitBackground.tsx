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

// Cauda longa: cometa precisa de rastro, nao de um tracinho.
const STREAK = 150;
const REST = 190;

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

/**
 * Recorta o pedaço da polilinha entre duas distâncias — é o rastro visível
 * do cometa num instante, do fim da cauda até a cabeça.
 */
function slicePolyline(points: Point[], from: number, to: number): Point[] {
  const out: Point[] = [];
  let acc = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (seg === 0) continue;
    const segEnd = acc + seg;
    if (segEnd >= from && acc <= to) {
      const s = Math.max(from, acc);
      const e = Math.min(to, segEnd);
      const t0 = (s - acc) / seg;
      const t1 = (e - acc) / seg;
      const p0 = { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 };
      const p1 = { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 };
      if (out.length === 0) out.push(p0);
      out.push(p1);
    }
    acc = segEnd;
    if (acc > to) break;
  }
  return out;
}

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string | CanvasGradient,
  widthPx: number,
) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = widthPx;
  ctx.stroke();
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

    const PITCH = 26;

    /**
     * Um percurso e uma sequencia de trechos retos ligados por desvios de 45
     * graus, sempre sobre a malha de corredores. O roteamento anterior ligava
     * vizinhos ao acaso e o resultado era ruido, nao placa.
     */
    function routeAlongLanes(start: Point, horizontal: boolean, legs: number) {
      const pts: Point[] = [start];
      let cur = start;
      let goingH = horizontal;
      let sx = Math.random() > 0.5 ? 1 : -1;
      let sy = Math.random() > 0.5 ? 1 : -1;

      for (let i = 0; i < legs; i++) {
        const run = PITCH * (2 + Math.floor(Math.random() * 5));
        cur = goingH
          ? { x: cur.x + sx * run, y: cur.y }
          : { x: cur.x, y: cur.y + sy * run };
        pts.push(cur);

        if (i < legs - 1) {
          const jog = PITCH * (1 + Math.floor(Math.random() * 2));
          if (goingH) sy = Math.random() > 0.5 ? 1 : -1;
          else sx = Math.random() > 0.5 ? 1 : -1;
          cur = { x: cur.x + sx * jog, y: cur.y + sy * jog };
          pts.push(cur);
          // Manter a direcao na maior parte das vezes: alternar sempre deixa
          // o desenho nervoso, e placa real tem corridas longas.
          if (Math.random() > 0.72) goingH = !goingH;
        }
      }
      return pts;
    }

    function buildGrid() {
      const built: Trace[] = [];
      const builtPads: Pad[] = [];

      const add = (pts: Point[]) => {
        const { path, length } = pathOf(pts);
        if (length < PITCH * 2) return;
        built.push({
          points: pts,
          path,
          length,
          animated: false,
          phase: Math.random(),
          speed: 0.07 + Math.random() * 0.07,
          tone: Math.floor(Math.random() * TONES.length),
        });
      };

      const snap = () => ({
        x: Math.floor((Math.random() * width) / PITCH) * PITCH,
        y: Math.floor((Math.random() * height) / PITCH) * PITCH,
      });

      const area = width * height;
      const routeCount = Math.min(90, Math.max(14, Math.round(area / 22000)));

      for (let i = 0; i < routeCount; i++) {
        const pts = routeAlongLanes(
          snap(),
          Math.random() > 0.5,
          2 + Math.floor(Math.random() * 4),
        );
        add(pts);

        // Feixe: trilhas paralelas ao mesmo percurso, como um barramento.
        if (Math.random() > 0.55) {
          const lanes = 1 + Math.floor(Math.random() * 3);
          for (let k = 1; k <= lanes; k++) {
            add(pts.map((p) => ({ x: p.x, y: p.y + (k * PITCH) / 4 })));
          }
        }

        for (const at of [pts[0], pts[pts.length - 1]]) {
          builtPads.push({
            x: at.x,
            y: at.y,
            r: Math.random() > 0.6 ? 3 : 2,
            hollow: Math.random() > 0.5,
          });
        }
      }

      // Ilhas soltas em cruzamentos, como furos de componente.
      const loose = Math.min(70, Math.max(8, Math.round(area / 30000)));
      for (let i = 0; i < loose; i++) {
        const at = snap();
        builtPads.push({ x: at.x, y: at.y, r: 2, hollow: Math.random() > 0.4 });
      }

      traces = built;
      pads = builtPads;

      const long = built.filter((t) => t.length > PITCH * 5);
      for (let i = long.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [long[i], long[j]] = [long[j], long[i]];
      }
      const howMany = Math.min(long.length, width < 700 ? 16 : 30);
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

        // Cometa em UM traço só, com gradiente ao longo do caminho.
        //
        // Antes a cauda saía em 18 fatias separadas. Onde uma encostava na
        // outra o alpha se somava e aparecia um ponto mais claro — de perto o
        // rastro lia como uma fileira de bolinhas, não como um cometa. Um
        // traço único com gradiente não tem emenda nenhuma.
        for (const trace of lit) {
          const cycle = trace.length + STREAK + REST;
          const travelled = (time * trace.speed + trace.phase * cycle) % cycle;
          const headAt = travelled - STREAK;
          const tailAt = headAt - STREAK;
          if (headAt <= 0 || tailAt >= trace.length) continue;

          const from = Math.max(0, tailAt);
          const to = Math.min(trace.length, headAt);
          if (to - from < 1) continue;

          // Ao encostar na ilha final a cabeça ficava parada esperando a cauda
          // alcançar, o que lia como travar, e depois sumia de uma vez. Agora
          // o cometa se dissolve conforme chega.
          const overrun = headAt - trace.length;
          const fade = overrun <= 0 ? 1 : Math.max(0, 1 - overrun / STREAK);
          if (fade <= 0.01) continue;

          const tone = TONES[trace.tone];
          const pts = slicePolyline(trace.points, from, to);
          if (pts.length < 2) continue;

          const tail = pts[0];
          const head = pts[pts.length - 1];

          // O gradiente vai da cauda para a cabeça. As paradas concentram o
          // brilho na frente em vez de espalhar pelo rastro inteiro.
          const grad = (peak: number) => {
            const g = ctx!.createLinearGradient(tail.x, tail.y, head.x, head.y);
            g.addColorStop(0, `rgba(${tone}, 0)`);
            g.addColorStop(0.45, `rgba(${tone}, ${peak * 0.14 * fade})`);
            g.addColorStop(0.75, `rgba(${tone}, ${peak * 0.45 * fade})`);
            g.addColorStop(0.94, `rgba(${tone}, ${peak * fade})`);
            g.addColorStop(1, `rgba(${tone}, ${peak * fade})`);
            return g;
          };

          // Três passadas do mesmo traço: halo largo e difuso, corpo, e o
          // núcleo fino. Cada uma é um stroke só — nada de emenda.
          ctx.shadowColor = `rgba(${tone}, ${0.55 * fade})`;
          ctx.shadowBlur = 26;
          strokePolyline(ctx!, pts, grad(0.30) as unknown as string, 7);

          ctx.shadowBlur = 14;
          strokePolyline(ctx!, pts, grad(0.72) as unknown as string, 3);

          ctx.shadowBlur = 8;
          const core = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
          core.addColorStop(0, `rgba(${tone}, 0)`);
          core.addColorStop(0.6, `rgba(${tone}, ${0.5 * fade})`);
          core.addColorStop(0.92, `rgba(200, 255, 228, ${0.95 * fade})`);
          core.addColorStop(1, `rgba(230, 255, 242, ${fade})`);
          strokePolyline(ctx!, pts, core as unknown as string, 1.3);

          // Cabeça: núcleo quase branco com dois halos, como o miolo de um
          // cometa de verdade.
          ctx.shadowColor = `rgba(${tone}, ${fade})`;
          ctx.shadowBlur = 40;
          ctx.fillStyle = `rgba(${tone}, ${0.3 * fade})`;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 7.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 26;
          ctx.fillStyle = `rgba(${tone}, ${0.55 * fade})`;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 3.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 16;
          ctx.fillStyle = `rgba(235, 255, 245, ${fade})`;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 1.9, 0, Math.PI * 2);
          ctx.fill();
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

  return (
    <>
      <canvas ref={canvasRef} className="circuitBg" aria-hidden="true" />
      <div className="circuitScrim" aria-hidden="true" />
    </>
  );
}
