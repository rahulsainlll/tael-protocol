/* eslint-disable @next/next/no-img-element */

const CARDS = [
  {
    logo: "/logos/logo-claude.svg",
    w: 110,
    h: 24,
    alt: "Claude",
    desc: "Chat with an AI assistant, write content, analyze information, and solve complex tasks.",
  },
  {
    logo: "/logos/logo-openai.svg",
    w: 89,
    h: 24,
    alt: "OpenAI",
    desc: "Create with powerful AI models for writing, coding, research, automation, and intelligent applications.",
  },
  {
    logo: "/logos/logo-groq.svg",
    w: 66,
    h: 24,
    alt: "Groq",
    desc: "Run AI models with fast inference, low latency, and responsive performance for real-time applications.",
  },
  {
    logo: "/logos/logo-anthropic.svg",
    w: 160,
    h: 18,
    alt: "Anthropic",
    desc: "Build reliable AI experiences with advanced models designed for reasoning, safety, and real-world work.",
  },
  {
    logo: "/logos/logo-grok.svg",
    w: 80,
    h: 30,
    alt: "Grok",
    desc: "Ask questions, explore current topics, generate ideas, and get direct answers from an AI assistant.",
  },
  {
    logo: "/logos/logo-elevenlabs.png",
    w: 139,
    h: 18,
    alt: "ElevenLabs",
    desc: "Generate realistic speech, clone voices, create audio content, and build natural voice experiences.",
  },
];

const pill =
  "rounded-[10px] bg-[#ECECED] px-4 py-2.5 text-[14px] font-medium tracking-[-0.02em] text-black";

export function ProviderCards() {
  return (
    <div className="flex w-full flex-col gap-7 lg:w-[728px]">
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        {CARDS.map((card) => (
          <div
            key={card.alt}
            className="flex h-[124px] flex-col gap-5 rounded-[11px] border border-[#E9E9E9] bg-white p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]"
          >
            <img src={card.logo} alt={card.alt} style={{ width: card.w, height: card.h }} />
            <p className="text-[13px] font-normal leading-5 tracking-[-0.03em] text-ink-muted">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={pill}>10+ agents available</span>
        <a
          href="https://discord.gg/tcb6b7ZYha"
          target="_blank"
          rel="noopener noreferrer"
          className={`${pill} transition-colors hover:bg-[#e2e2e4]`}
        >
          Join community to try now
        </a>
      </div>
    </div>
  );
}
