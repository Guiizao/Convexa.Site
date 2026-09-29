# Convexa — site de apresentação

Site institucional do Convexa: a página que o dono de barbearia ou pet shop vê
antes de virar cliente. **Não é o painel** — o painel administrativo é outro
projeto (`convexa.flutter`).

O objetivo aqui é um só: levar o visitante ao WhatsApp.

---

## Rodar

Precisa de **Node 22.13 ou mais novo**. Confira com `node -v`.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Para gerar a versão de produção e servir ela:

```bash
npm run build
npm run start
```

---

## Como o site é navegado

É **uma tela só que desliza para o lado**, não uma página que rola para baixo.
Cinco seções, cada uma ocupando a tela inteira:

| # | Seção | O que faz |
|---|---|---|
| 1 | Início | Chamada principal |
| 2 | O que é | Explica o produto em uma frase |
| 3 | Quem somos | Time e história — **texto ainda provisório** |
| 4 | Como funciona | Os três passos do agendamento |
| 5 | Contato | Mockup de conversa + botão do WhatsApp |

Funciona com clique nos indicadores, roda do mouse e setas do teclado. Quem faz
isso é o CSS (`scroll-snap-type: x mandatory`), não JavaScript simulando gesto.

**No celular e no tablet (até 900px de largura) a página rola para baixo.** O
conteúdo de uma seção não cabe numa tela de celular, e deslizar para o lado e
ainda rolar dentro de cada seção deixava tudo cortado. As abas do topo viram uma
faixa que rola de lado, com fade na borda onde ainda tem aba escondida, e a aba
ativa acompanha a rolagem. A condição do corte fica em dois lugares que precisam
bater: `STACKED_QUERY` no `app/page.tsx` e o bloco "CELULAR E TABLET" do
`app/globals.css`.

---

## Estrutura

```
app/
  page.tsx               as cinco seções e o botão do WhatsApp
  CircuitBackground.tsx  fundo animado em canvas
  layout.tsx             metadados e fontes
  globals.css            estilos e o scroll horizontal
worker/index.ts          entrada do Cloudflare Worker
build/                   plugin de build (é código-fonte, não saída)
db/                      schema Drizzle — não usado no site hoje
```

### O fundo animado

`CircuitBackground.tsx` desenha trilhas ortogonais estilo placa de circuito num
`<canvas>`, com riscos de luz correndo por algumas delas. No desktop os pontos
acendem perto do mouse. Respeita "reduzir movimento" do sistema: com a opção
ligada, desenha as trilhas paradas e não anima nada.

---

## O que falta

Duas coisas dependem de você, não de código:

1. **Número do WhatsApp.** A constante `WHATSAPP_NUMBER` em `app/page.tsx` está
   com o placeholder `5511999999999`. Trocar pelo número comercial real.
2. **Texto de "Quem somos".** O que está lá é um texto genérico de missão,
   escrito só para não deixar a seção vazia. Precisa da história real.

---

## Notas técnicas

**Stack:** React 19 com React Server Components, [vinext](https://github.com/cloudflare/vinext)
sobre Vite, deploy em Cloudflare Workers, Tailwind 4. Drizzle está instalado mas
o site não usa banco hoje.

**`.openai/hosting.json`** é gerado pela plataforma que criou o projeto e fica
fora do git. O `vite.config.ts` lê o arquivo se ele existir e segue sem ele caso
contrário — sem isso, o projeto não subia em nenhuma máquina que não fosse a
original.

**Sem segredo no repositório.** Não há `.env` versionado nem chave no código.
Qualquer credencial futura entra como variável de ambiente no Cloudflare, nunca
em arquivo commitado.
