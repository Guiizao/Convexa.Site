"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CircuitBackground from "./CircuitBackground";
import { CursorGlow, Spotlight } from "./Spotlight";
import { SECTIONS, whatsappLink } from "./config";
import {
  ArrowRight,
  ArrowUpRight,
  Bolt,
  Calendar,
  Chat,
  Check,
  CheckDouble,
  Cpu,
  Droplet,
  Dumbbell,
  Pen,
  Play,
  Plus,
  Scissors,
  Send,
  Sparkle,
  Stethoscope,
} from "./icons";

const NAV_ITEMS = SECTIONS.slice(0, -1);
const SECTION_COUNT = SECTIONS.length;
const CONTACT = SECTION_COUNT - 1;

// Celular e tablet: as seções empilham e a página rola para baixo, porque o
// conteúdo de uma seção não cabe numa tela só. Precisa bater com a media query
// "CELULAR E TABLET" do globals.css.
const STACKED_QUERY = "(max-width: 900px), (max-height: 500px) and (hover: none)";
const isStacked = () => window.matchMedia(STACKED_QUERY).matches;

/** No modo empilhado, a seção ativa é a que cruzou um terço da tela. */
function stackedIndex(track: HTMLElement): number {
  if (track.scrollTop + track.clientHeight >= track.scrollHeight - 4) return SECTION_COUNT - 1;
  const probe = track.scrollTop + track.clientHeight * 0.35;
  let index = 0;
  Array.from(track.children).forEach((section, i) => {
    if ((section as HTMLElement).offsetTop <= probe) index = i;
  });
  return index;
}

const audiences = [
  { label: "Barbearias", Icon: Scissors },
  { label: "Salões", Icon: Sparkle },
  { label: "Estética", Icon: Droplet },
  { label: "Tatuadores", Icon: Pen },
  { label: "Personal", Icon: Dumbbell },
  { label: "Clínicas", Icon: Stethoscope },
];

export default function Home() {
  const trackRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const wheelLock = useRef(false);
  const wheelAccum = useRef(0);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, index));
    const track = trackRef.current;
    if (!track) return;
    if (isStacked()) {
      // Para no começo do conteúdo, com folga abaixo da barra fixa do topo.
      const inner = track.children[clamped]?.firstElementChild as HTMLElement | null;
      const navHeight = navRef.current?.offsetHeight ?? 0;
      const top = clamped === 0 || !inner ? 0 : inner.offsetTop - navHeight - 20;
      track.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      return;
    }
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }, []);

  // Mantém o estado "seção ativa" sincronizado com a posição real de scroll
  // (necessário tanto para clique no menu quanto para swipe/roda do mouse).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const index = isStacked()
          ? stackedIndex(track)
          : Math.round(track.scrollLeft / (track.clientWidth || 1));
        setActive((prev) => (prev === index ? prev : index));
      });
    };
    const layout = window.matchMedia(STACKED_QUERY);
    track.addEventListener("scroll", onScroll, { passive: true });
    layout.addEventListener("change", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      layout.removeEventListener("change", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Marca as seções que já apareceram. No modo empilhado a animação de entrada
  // depende disso: a seção que aparece embaixo da ativa não pode ficar vazia.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const sections = Array.from(track.children);
    const observer = new IntersectionObserver(
      (entries) => {
        const hits = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => sections.indexOf(entry.target));
        if (!hits.length) return;
        setSeen((prev) => {
          if (hits.every((i) => prev.has(i))) return prev;
          const next = new Set(prev);
          hits.forEach((i) => next.add(i));
          return next;
        });
      },
      { root: track, threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // No celular as abas não cabem e a caixa rola de lado. O fade aparece só na
  // borda onde ainda tem aba escondida, para o texto não parecer cortado.
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const update = () => {
      const max = tabs.scrollWidth - tabs.clientWidth;
      tabs.dataset.fadeStart = tabs.scrollLeft > 2 ? "1" : "0";
      tabs.dataset.fadeEnd = tabs.scrollLeft < max - 2 ? "1" : "0";
    };
    update();
    tabs.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      tabs.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // A aba ativa desliza para o meio da caixa quando a seção muda.
  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.children[active] as HTMLElement | undefined;
    if (!tabs || !tab || tabs.scrollWidth <= tabs.clientWidth) return;
    const left = tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
    tabs.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  // Roda do mouse é vertical por natureza — traduz o gesto em navegação
  // horizontal, uma seção por vez (trackpads já mandam deltaX nativo).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (event: WheelEvent) => {
      if (isStacked()) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      if (wheelLock.current) return;
      wheelAccum.current += event.deltaY;
      if (Math.abs(wheelAccum.current) < 35) return;
      const direction = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      wheelLock.current = true;
      setActive((prev) => {
        const next = Math.max(0, Math.min(SECTION_COUNT - 1, prev + direction));
        goTo(next);
        return next;
      });
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 700);
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [goTo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isStacked()) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") goTo(active + 1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") goTo(active - 1);
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(SECTION_COUNT - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  const pane = (index: number) =>
    `pane${active === index ? " isActive" : ""}${seen.has(index) ? " isSeen" : ""}`;

  return (
    <main className="paged">
      <CircuitBackground />
      <CursorGlow />

      <nav className="nav" ref={navRef} aria-label="Navegação principal">
        <a
          className="brand"
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            goTo(0);
          }}
          aria-label="Convexa, voltar ao início"
        >
          <span className="brandMark">C</span>
          <span className="brandName">
            convexa<span className="dot">.</span>
          </span>
        </a>

        <div className="navLinks">
          <div className="navScroll" ref={tabsRef} role="tablist" aria-label="Seções">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={active === i}
                className={active === i ? "active" : ""}
                onClick={() => goTo(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button className="navCta" type="button" onClick={() => goTo(CONTACT)}>
          Contato
        </button>
      </nav>

      <div className="dots" aria-hidden="true">
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <span key={i} className={active === i ? "active" : ""} />
        ))}
      </div>

      <div className="track" ref={trackRef}>
        <section className={pane(0)} id="inicio" aria-label="Início">
          <div className="paneInner heroGrid">
            <div className="heroCopy">
              <div className="eyebrow">
                <span className="pulse" /> Agendamento automático no WhatsApp
              </div>
              <h1>
                Enquanto você{" "}
                <br />
                trabalha, o <em>Convexa atende.</em>
              </h1>
              <p>
                Seu cliente manda mensagem e recebe resposta na hora, com os
                horários livres. O agendamento cai direto no seu painel, sem você
                parar o que está fazendo.
              </p>
              <div className="heroActions">
                <button className="primary" type="button" onClick={() => goTo(CONTACT)}>
                  Falar no WhatsApp <ArrowRight />
                </button>
                <button className="textLink" type="button" onClick={() => goTo(3)}>
                  <span className="play">
                    <Play />
                  </span>
                  Ver como funciona
                </button>
              </div>
            </div>

            <div className="heroVisual" aria-hidden="true">
              <div className="orbit orbit1" />
              <div className="orbit orbit2" />
              <WhatsAppMock />
              <div className="floatingTag">
                <span>
                  <Bolt size={14} />
                </span>
                <div>
                  <b>Novo agendamento</b>
                  <small>Chegou pelo WhatsApp</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={pane(1)} id="o-que-e" aria-label="O que é">
          <div className="paneInner centered">
            <span className="kicker">O QUE É</span>
            <h2>
              Seu WhatsApp responde
              <br />
              <em>mesmo quando você não pode.</em>
            </h2>
            <p className="lead">
              O Convexa é um assistente com IA que atende no número do seu
              negócio. Ele entende o que o cliente quer, oferece os horários
              livres e confirma o agendamento. Ninguém fica esperando e nenhuma
              mensagem cai no esquecimento.
            </p>
            <span className="miniKicker">FEITO PARA NEGÓCIOS COM HORA MARCADA</span>
            <div className="audienceRow compact">
              {audiences.map(({ label, Icon }) => (
                <Spotlight key={label}>
                  <span>
                    <Icon size={18} />
                  </span>
                  {label}
                </Spotlight>
              ))}
            </div>
          </div>
        </section>

        <section className={pane(2)} id="quem-somos" aria-label="Quem somos">
          <div className="paneInner centered">
            <span className="kicker">QUEM SOMOS</span>
            <h2>
              Criado para quem vive
              <br />
              <em>de atender bem.</em>
            </h2>
            <p className="lead">
              Nosso foco é tirar o trabalho repetitivo das mãos de quem toca o
              negócio sozinho ou com uma equipe pequena. Nada de central de
              atendimento ou sistema complicado. Seu cliente continua no
              WhatsApp que já usa, e a IA cuida dos detalhes.
            </p>
            <div className="valueRow">
              {[
                ["Simples de usar", "Seu cliente não precisa baixar nada"],
                ["Conversa de gente", "Respostas naturais, sem cara de robô"],
                ["Você no controle", "A agenda continua sendo sua"],
              ].map(([title, desc]) => (
                <Spotlight key={title}>
                  <b>{title}</b>
                  <small>{desc}</small>
                </Spotlight>
              ))}
            </div>
          </div>
        </section>

        <section className={pane(3)} id="como-funciona" aria-label="Como funciona">
          <div className="paneInner centered">
            <span className="kicker">COMO FUNCIONA</span>
            <h2>
              Do &ldquo;oi&rdquo; ao horário marcado.
              <br />
              <em>Sem você pegar no celular.</em>
            </h2>
            <div className="stepGrid compact">
              <Spotlight as="article">
                <span className="stepIcon">
                  <Chat size={15} /> ETAPA 01
                </span>
                <div className="phoneBubble">&ldquo;Oi, tem horário hoje?&rdquo;</div>
                <h3>O cliente chama</h3>
                <p>Ele manda mensagem no WhatsApp do seu negócio, do jeito que já faz hoje.</p>
              </Spotlight>
              <Spotlight as="article">
                <span className="stepIcon">
                  <Cpu size={15} /> ETAPA 02
                </span>
                <div className="aiOrb">
                  C
                  <span>
                    <Sparkle size={12} />
                  </span>
                </div>
                <h3>O Convexa responde</h3>
                <p>Entende o que ele precisa, apresenta os serviços e oferece os horários livres.</p>
              </Spotlight>
              <Spotlight as="article">
                <span className="stepIcon">
                  <Calendar size={15} /> ETAPA 03
                </span>
                <div className="calendarMini">
                  <b>13</b>
                  <span>
                    18:30 · Carlos <Check size={11} />
                  </span>
                </div>
                <h3>O horário fica marcado</h3>
                <p>O agendamento aparece no seu painel, já confirmado com o cliente.</p>
              </Spotlight>
            </div>
          </div>
        </section>

        <section className={`${pane(4)} paneContato`} id="contato" aria-label="Contato">
          <div className="paneInner centered">
            <span className="kicker">CONTATO</span>
            <h2>
              Fale com a gente
              <br />
              <em>no WhatsApp.</em>
            </h2>
            <p className="lead">
              Conte um pouco sobre o seu negócio e veja o Convexa funcionando
              na prática, direto na conversa. Sem formulário para preencher.
            </p>
            <div className="contatoRow">
              <a
                className="primary whatsappBtn"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chamar no WhatsApp <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function WhatsAppMock() {
  return (
    <div className="whatsappCard">
      <div className="chatHead">
        <div className="botAvatar">C</div>
        <div>
          <strong>Assistente Convexa</strong>
          <small>
            <i /> online agora
          </small>
        </div>
        <span className="chatDots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="chatBody">
        <div className="msg client">
          Oi! Tem horário pra corte amanhã depois das 18h?
          <small>
            18:42 <CheckDouble />
          </small>
        </div>
        <div className="msg bot">
          Oi, Carlos! Tenho sim: amanhã às <b>18:30</b> ou às <b>19:15</b>.
          Qual fica melhor pra você?
          <small>18:42</small>
        </div>
        <div className="msg client short">
          18:30, perfeito!
          <small>
            18:43 <CheckDouble />
          </small>
        </div>
        <div className="msg bot confirmation">
          <span>
            <Check size={12} />
          </span>
          <div>
            <b>Agendamento confirmado!</b>
            <br />
            Corte de cabelo · amanhã, 18:30
          </div>
          <small>18:43</small>
        </div>
      </div>
      <div className="chatInput">
        <span>
          <Plus size={13} />
        </span>
        <div>Mensagem</div>
        <span className="sendBtn">
          <Send size={12} />
        </span>
      </div>
    </div>
  );
}
