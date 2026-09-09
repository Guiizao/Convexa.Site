"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Luz que acompanha o ponteiro pela página inteira.
 *
 * O JavaScript só escreve a posição em duas variáveis CSS; quem desenha é o
 * CSS. Assim o movimento não passa pelo React a cada pixel — nenhum re-render
 * acontece enquanto o mouse anda.
 *
 * Some em telas de toque (não há ponteiro para seguir) e com "reduzir
 * movimento" ligado.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    el.dataset.on = "1";

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // A luz persegue o ponteiro com um atraso pequeno. Grudada no cursor ela
    // parece um objeto; atrás dele, parece iluminação.
    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      el.style.setProperty("--gx", `${x}px`);
      el.style.setProperty("--gy", `${y}px`);
      raf = Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5
        ? requestAnimationFrame(tick)
        : 0;
    };

    const leave = () => {
      el.style.setProperty("--ga", "0");
    };
    const enter = () => {
      el.style.setProperty("--ga", "1");
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
    };
  }, []);

  return <div ref={ref} className="cursorGlow" aria-hidden="true" />;
}

/**
 * Realce que segue o ponteiro dentro de um elemento: a borda acende no ponto
 * mais próximo do cursor e a superfície ganha um brilho suave.
 *
 * Mesma ideia do CursorGlow — o React não re-renderiza durante o movimento.
 */
export function Spotlight({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "a" | "button";
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const enter = () => el.style.setProperty("--ma", "1");
    const leave = () => el.style.setProperty("--ma", "0");

    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const Component = Tag as "div";
  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={`spot ${className}`.trim()}
      {...rest}
    >
      <span className="spotBorder" aria-hidden="true" />
      <span className="spotGlow" aria-hidden="true" />
      {children}
    </Component>
  );
}
