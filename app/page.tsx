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
  const [active, setActive] = useState(0);
  const wheelLock = useRef(false);
  const wheelAccum = useRef(0);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, index));
    const track = trackRef.current;
    if (!track) return;
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
        const width = track.clientWidth || 1;
        const index = Math.round(track.scrollLeft / width);
        setActive((prev) => (prev === index ? prev : index));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Roda do mouse é vertical por natureza — traduz o gesto em navegação
  // horizontal, uma seção por vez (trackpads já mandam deltaX nativo).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (event: WheelEvent) => {
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
      if (event.key === "ArrowRight" || event.key === "ArrowDown") goTo(active + 1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") goTo(active - 1);
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(SECTION_COUNT - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  const pane = (index: number) => `pane${active === index ? " isActive" : ""}`;

  return (
    <main className="paged">
      <CircuitBackground />
      <CursorGlow />

      <nav className="nav" aria-label="Navegação principal">
        <a
          className="brand"
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            goTo(0);
          }}
          aria-label="Convexa - início"
        >
          <span className="brandMark">C</span>convexa<span className="dot">.</span>
        </a>

        <div className="navLinks" role="tablist" aria-label="Seções">
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
                <span className="pulse" /> Atendimento inteligente via WhatsApp
              </div>
              <h1>
                Enquanto você
                <br />
                trabalha, o <em>Convexa atende.</em>
              </h1>
              <p>
                Uma IA humanizada conversa com seus clientes, encontra o melhor
                horário e organiza tudo no seu painel. Simples assim.
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
              Um atendente que nunca perde
              <br />
              <em>um cliente por WhatsApp.</em>
            </h2>
            <p className="lead">
              O Convexa é a IA que conversa com quem já usa o WhatsApp do seu
              negócio: entende pedidos, oferece horários e confirma o
              agendamento — sem fila de espera e sem mensagem esquecida.
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
              Somos uma equipe focada em tirar a tarefa repetitiva da mão de
              quem empreende sozinho ou com um time pequeno. Sem call center,
              sem sistema complicado — só o WhatsApp que seu cliente já usa,
              com uma IA cuidando dos detalhes por trás.
            </p>
            <div className="valueRow">
              {[
                ["Simplicidade", "Sem app novo pro cliente aprender"],
                ["IA com toque humano", "Conversa natural, não script robótico"],
                ["No seu ritmo", "O dono continua no controle da agenda"],
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
              <em>Sem você tocar no celular.</em>
            </h2>
            <div className="stepGrid compact">
              <Spotlight as="article">
                <span className="stepIcon">
                  <Chat size={15} /> ETAPA 01
                </span>
                <div className="phoneBubble">&ldquo;Oi, tem horário hoje?&rdquo;</div>
                <h3>Seu cliente chama</h3>
                <p>Ele manda uma mensagem no WhatsApp do seu negócio, como sempre fez.</p>
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
                <h3>A IA conversa</h3>
                <p>Entende o pedido, oferece serviços e encontra os melhores horários.</p>
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
                <h3>A agenda se organiza</h3>
                <p>O compromisso aparece no seu painel, pronto e confirmado.</p>
              </Spotlight>
            </div>
          </div>
        </section>

        <section className={`${pane(4)} paneContato`} id="contato" aria-label="Contato">
          <div className="paneInner centered">
            <span className="kicker">FALE AGORA</span>
            <h2>
              Fale com a gente
              <br />
              <em>no WhatsApp.</em>
            </h2>
            <p className="lead">
              Conte pra gente sobre o seu negócio e veja o Convexa funcionando
              de verdade — sem formulário, direto na conversa.
            </p>
            <div className="contatoRow">
              <WhatsAppMock compact />
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

function WhatsAppMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`whatsappCard${compact ? " compact" : ""}`}>
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
          Oi, Carlos! Tenho sim. Encontrei dois horários:
          <br />
          <b>18:30</b> ou <b>19:15</b>. Qual fica melhor?
          <small>18:42</small>
        </div>
        <div className="msg client short">
          18:30 perfeito!
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
            Corte de cabelo · Amanhã, 18:30
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
