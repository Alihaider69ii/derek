"use client"
import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { SplitChat } from "@/components/shared/SplitChat"
import styles from "./page.module.css"
import {
  ArrowRight,
  Search,
  CheckCircle2,
  Upload,
  TrendingUp,
  FileText,
} from "lucide-react"

export const dynamic = 'force-dynamic'

interface PromptItem {
  _id: string
  title: string
  category: string
  promptText: string
  sampleOutput?: string
  emoji?: string
  isMega?: boolean
}

interface CategoryItem {
  _id: string
  name: string
  emoji: string
}

function preview(text: string, len = 130) {
  if (!text) return ""
  return text.length > len ? text.slice(0, len).trim() + "…" : text
}

/**
 * A single auto-scrolling (marquee) carousel row.
 * - Pure CSS animation (no JS ticking) — pauses on hover.
 * - The card list is rendered twice so the -50% translate loops seamlessly.
 * - `reverse` flips the scroll direction for alternating rows.
 */
function MarqueeRow({
  items,
  reverse,
  onCardClick,
}: {
  items: PromptItem[]
  reverse?: boolean
  onCardClick: () => void
}) {
  // Pad short lists so the track is wide enough to fill the row seamlessly.
  const MIN = 6
  let base = items
  if (items.length > 0 && items.length < MIN) {
    base = []
    while (base.length < MIN) base = base.concat(items)
    base = base.slice(0, MIN)
  }
  // Duplicate the list — the animation translates by exactly -50%, so the
  // second copy sits where the first started and the loop is invisible.
  const track = [...base, ...base]

  return (
    <div className={styles.marquee}>
      <div className={`${styles.marqueeTrack} ${reverse ? styles.marqueeReverse : ""}`}>
        {track.map((prompt, i) => (
          <div
            key={`${prompt._id}-${i}`}
            className={styles.promptCard}
            onClick={onCardClick}
            aria-hidden={i >= base.length ? true : undefined}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardCategory}>{prompt.category}</span>
              {prompt.isMega && <span className={styles.cardBadge}>MEGA</span>}
            </div>
            <div className={styles.cardTitle}>{prompt.title}</div>
            <div className={styles.cardPreview}>
              <span className={styles.ps}>&gt;_</span> {preview(prompt.promptText)}
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.cardOpen} onClick={onCardClick}>Open prompt</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Reveals `text` on a single line, character by character, via a CSS width animation. */
function TypedText({ text, delay = 0, duration = 800 }: { text: string; delay?: number; duration?: number }) {
  return (
    <span
      className={styles.typedText}
      style={{
        ["--tw" as string]: `${text.length}ch`,
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationTimingFunction: `steps(${Math.max(text.length, 1)}, end)`,
      } as React.CSSProperties}
    >
      {text}
    </span>
  )
}

const DEMO_STAGES = [
  { name: "The Struggle", duration: 3000 },
  { name: "They find Derek", duration: 2000 },
  { name: "Derek works his magic", duration: 4000 },
  { name: "The result", duration: 3000 },
] as const

function DemoStruggle() {
  return (
    <div className={styles.demoPanel}>
      <div className={`${styles.demoChatCard} ${styles.demoFadeIn}`}>
        <div className={styles.demoChatHead}>
          <span className={styles.demoChatDot} />
          <span className={styles.demoChatDot} />
          <span className={styles.demoChatDot} />
          <span className={styles.demoChatTitle}>Any AI tool</span>
        </div>
        <div className={styles.demoChatBody}>
          <div className={`${styles.demoBubbleUser} ${styles.demoFadeIn}`} style={{ animationDelay: "100ms" }}>
            <TypedText text="write me something for instagram" delay={150} duration={700} />
          </div>
          <div className={`${styles.demoBubbleBad} ${styles.demoFadeIn}`} style={{ animationDelay: "900ms" }}>
            ❌ Generic result
          </div>
          <div className={`${styles.demoBubbleUser} ${styles.demoFadeIn}`} style={{ animationDelay: "1400ms" }}>
            <TypedText text="make it better" delay={1450} duration={350} />
          </div>
          <div className={`${styles.demoBubbleBad} ${styles.demoFadeIn}`} style={{ animationDelay: "1900ms" }}>
            ❌ Still generic
          </div>
        </div>
      </div>
      <div className={`${styles.demoReaction} ${styles.demoFadeIn}`} style={{ animationDelay: "2300ms" }}>😤</div>
    </div>
  )
}

function DemoMeetDerek() {
  return (
    <div className={styles.demoPanel}>
      <div className={`${styles.demoChatCard} ${styles.demoGhostCard} ${styles.demoSlideOutLeft}`}>
        <div className={styles.demoGhostLine} />
        <div className={styles.demoGhostLine} style={{ width: "60%" }} />
      </div>
      <div className={`${styles.demoDerekIntro} ${styles.demoSlideInRight}`}>
        <div className={styles.demoDerekPhoto}>
          <Image src="/derek/derek2.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
        </div>
      </div>
      <p className={`${styles.demoIntroText} ${styles.demoFadeIn}`} style={{ animationDelay: "900ms" }}>
        Meet <strong>Derek</strong>. Your AI prompt engineer.
      </p>
    </div>
  )
}

function DemoMagic() {
  return (
    <div className={styles.demoPanel}>
      <div className={`${styles.demoChatCard} ${styles.demoFadeIn}`}>
        <div className={styles.demoChatHead}>
          <div className={styles.demoDerekAvatarSm}>
            <Image src="/derek/derek3.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
          </div>
          <span className={styles.demoChatTitle}>Derek — Prompt Engineer</span>
        </div>
        <div className={styles.demoChatBody}>
          <div className={`${styles.demoBubbleUser} ${styles.demoFadeIn}`} style={{ animationDelay: "150ms" }}>
            <TypedText text="I sell handmade jewellery. Want Instagram caption." delay={200} duration={1100} />
          </div>

          <div className={styles.demoPromptBlock}>
            <div className={`${styles.demoPromptLine} ${styles.demoFadeIn}`} style={{ animationDelay: "1500ms" }}>
              <span className={styles.demoPromptTag}>[ROLE]</span> You are a viral social media copywriter specialising in handmade jewellery brands.
            </div>
            <div className={`${styles.demoPromptLine} ${styles.demoFadeIn}`} style={{ animationDelay: "1900ms" }}>
              <span className={styles.demoPromptTag}>[CONTEXT]</span> Small handmade jewellery business, Instagram audience, warm and elegant brand tone.
            </div>
            <div className={`${styles.demoPromptLine} ${styles.demoFadeIn}`} style={{ animationDelay: "2300ms" }}>
              <span className={styles.demoPromptTag}>[TASK]</span> Write a scroll-stopping caption for a new jewellery piece launch.
            </div>
            <div className={`${styles.demoPromptLine} ${styles.demoFadeIn}`} style={{ animationDelay: "2700ms" }}>
              <span className={styles.demoPromptTag}>[FORMAT]</span> Hook line + 2-3 sentence story + call-to-action + 5 relevant hashtags.
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.demoBadgeGood} ${styles.demoFadeIn}`} style={{ animationDelay: "3200ms" }}>
        ✅ Precision prompt — ready to use
      </div>
    </div>
  )
}

function DemoResult() {
  return (
    <div className={styles.demoPanel}>
      <div className={`${styles.demoPasteRow} ${styles.demoFadeIn}`}>
        <span className={styles.demoPasteLabel}>Pasted into any AI tool</span>
        <div className={styles.demoPasteChips}>
          <span className={styles.compatChip}>ChatGPT</span>
          <span className={styles.compatChip}>Claude</span>
          <span className={styles.compatChip}>Gemini</span>
        </div>
      </div>

      <div className={`${styles.demoOutputCard} ${styles.demoPopIn}`} style={{ animationDelay: "400ms" }}>
        <div className={styles.demoOutputHead}>
          <span className={styles.demoOutputDot} />
          Generated caption
        </div>
        <p className={styles.demoOutputText}>
          &quot;Handcrafted with love, worn with pride. ✨ Every piece tells a story — what will yours say? 🤍&quot;
        </p>
        <div className={styles.demoOutputTags}>#HandmadeJewellery #ShopSmall #WearYourStory</div>
      </div>

      <div className={`${styles.demoReactionRow} ${styles.demoFadeIn}`} style={{ animationDelay: "1400ms" }}>
        <span className={styles.demoReaction}>👏</span>
        <span className={styles.demoResultText}>10x better output. Every time.</span>
      </div>
    </div>
  )
}

/**
 * "See Derek in action" — a 4-stage animated demo that loops automatically.
 * Stage switching is driven by React state (useState + useEffect timers);
 * everything inside a stage animates via pure CSS so it stays smooth and
 * needs no per-frame JS work.
 */
function DerekDemo() {
  const [stage, setStage] = React.useState(1)
  const [cycle, setCycle] = React.useState(0)

  React.useEffect(() => {
    const duration = DEMO_STAGES[stage - 1].duration
    const timer = setTimeout(() => {
      setStage(prev => {
        const next = prev === DEMO_STAGES.length ? 1 : prev + 1
        if (next === 1) setCycle(c => c + 1)
        return next
      })
    }, duration)
    return () => clearTimeout(timer)
  }, [stage])

  return (
    <section className={`${styles.section} ${styles.demoSection}`} id="demo">
      <div className={styles.sectionInner}>
        <p className={styles.sectionEyebrow}>See It In Action</p>
        <h2 className={styles.sectionHeading}>Struggle to <em>10x results.</em></h2>
        <p className={styles.sectionSub}>Watch how Derek turns a vague idea into a precision prompt — in seconds.</p>

        <div className={styles.demoProgress} role="progressbar" aria-valuenow={stage} aria-valuemin={1} aria-valuemax={4}>
          {DEMO_STAGES.map((s, i) => {
            const idx = i + 1
            return (
              <div className={styles.demoProgressSeg} key={s.name}>
                {idx < stage && <div className={styles.demoProgressFillDone} />}
                {idx === stage && (
                  <div
                    key={`${idx}-${cycle}`}
                    className={styles.demoProgressFillActive}
                    style={{ animationDuration: `${s.duration}ms` }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className={styles.demoStageLabel}>Stage {stage} of {DEMO_STAGES.length} — {DEMO_STAGES[stage - 1].name}</div>

        <div className={styles.demoStage}>
          {stage === 1 && <DemoStruggle key={`s1-${cycle}`} />}
          {stage === 2 && <DemoMeetDerek key={`s2-${cycle}`} />}
          {stage === 3 && <DemoMagic key={`s3-${cycle}`} />}
          {stage === 4 && <DemoResult key={`s4-${cycle}`} />}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [prompts, setPrompts] = React.useState<PromptItem[]>([])
  const [categories, setCategories] = React.useState<CategoryItem[]>([])

  React.useEffect(() => {
    fetch("/api/prompts/popular").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setPrompts(data)
    }).catch(console.error)

    fetch("/api/categories").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setCategories(data)
    }).catch(console.error)
  }, [])

  const handlePromptClick = () => {
    if (confirm("Please login to access the prompt. Go to login?")) {
      router.push("/login")
    }
  }

  const heroPrompts = prompts.slice(0, 3)

  // Group prompts into one carousel row per category. Categories from the API
  // set the display order/emoji; any leftover categories found only on prompts
  // are appended so nothing is dropped.
  const rows = React.useMemo(() => {
    const byCat = new Map<string, PromptItem[]>()
    for (const p of prompts) {
      const key = p.category || "Popular"
      if (!byCat.has(key)) byCat.set(key, [])
      byCat.get(key)!.push(p)
    }
    const ordered: { name: string; emoji?: string; items: PromptItem[] }[] = []
    const seen = new Set<string>()
    for (const c of categories) {
      const items = byCat.get(c.name)
      if (items && items.length) {
        ordered.push({ name: c.name, emoji: c.emoji, items })
        seen.add(c.name)
      }
    }
    for (const [name, items] of Array.from(byCat.entries())) {
      if (!seen.has(name)) ordered.push({ name, items })
    }
    return ordered
  }, [prompts, categories])

  return (
    <div className={styles.empHome}>
      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>EaseMyPrompt<span>.ai</span></Link>
        <ul className={styles.navLinks}>
          <li><a href="#marketplace">Marketplace</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#derek">Ask Derek <span className={styles.navBadge}>AI</span></a></li>
          <li><a href="#earn">Sell Prompts</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.btnGhost}>Log in</Link>
          <Link href="/marketplace" className={styles.btnPrimary}>
            Browse Marketplace
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGlowCenter} />
        <div className={styles.heroGlowAmber} />
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.heroEyebrow}><span className={styles.eyebrowDot} />The Prompt Marketplace</div>
              <h1 className={styles.heroHeadline}>
                The world&apos;s best<br />prompts. <em>All in</em><br />one place.
              </h1>
              <p className={styles.heroSub}>
                Browse and buy proven, community-built prompts for any AI tool. Or ask Derek to engineer one for you — then sell it in the marketplace.
              </p>
              <div className={styles.heroActions}>
                <a href="#marketplace" className={styles.btnHero}>
                  <Search size={18} />
                  Browse Prompts
                </a>
                <a href="#derek" className={styles.btnOutlineHero}>Ask Derek instead →</a>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>2,400<span>+</span></div>
                  <div className={styles.statLabel}>Prompts in marketplace</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>18k<span>+</span></div>
                  <div className={styles.statLabel}>Active users</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNum}>₹84k<span>+</span></div>
                  <div className={styles.statLabel}>Paid to creators</div>
                </div>
              </div>
            </div>

            {/* Hero card stack — real prompts */}
            <div className={styles.heroCards}>
              {heroPrompts[2] && (
                <div className={`${styles.heroCard} ${styles.heroCard3}`}>
                  <div className={styles.hcardTitle}>{heroPrompts[2].title}</div>
                </div>
              )}
              {heroPrompts[1] && (
                <div className={`${styles.heroCard} ${styles.heroCard2}`}>
                  <div className={styles.hcardTitle}>{heroPrompts[1].title}</div>
                </div>
              )}
              {heroPrompts[0] && (
                <div className={`${styles.heroCard} ${styles.heroCard1}`} onClick={handlePromptClick}>
                  <div className={styles.hcardTop}>
                    <span className={styles.hcardCat}>{heroPrompts[0].category}</span>
                  </div>
                  <div className={styles.hcardTitle}>{heroPrompts[0].title}</div>
                  <div className={styles.hcardPreview}>
                    <span className={styles.promptSym}>&gt;_</span> {preview(heroPrompts[0].promptText)}
                  </div>
                  <div className={styles.hcardFooter}>
                    <button className={styles.hcardBtn} onClick={handlePromptClick}>Open prompt</button>
                  </div>
                </div>
              )}
              {heroPrompts.length === 0 && (
                <div className={`${styles.heroCard} ${styles.heroCard1}`}>
                  <div className={styles.hcardTitle}>Loading prompts…</div>
                </div>
              )}
            </div>
          </div>

          {/* Compat bar */}
          <div className={styles.compatBar}>
            <span className={styles.compatLabel}>Paste into any AI →</span>
            <div className={styles.compatChips}>
              <span className={styles.compatChip}>ChatGPT</span>
              <span className={styles.compatChip}>Claude</span>
              <span className={styles.compatChip}>Gemini</span>
              <span className={styles.compatChip}>Grok</span>
              <span className={styles.compatChip}>Copilot</span>
              <span className={styles.compatChip}>Perplexity</span>
              <span className={styles.compatChip}>+ any AI tool</span>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE */}
      <section className={`${styles.section} ${styles.marketplaceSection}`} id="marketplace">
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>Marketplace</p>
          <h2 className={styles.sectionHeading}>Proven prompts.<br /><em>Ready to use.</em></h2>
          <p className={styles.sectionSub}>Browse the Prompt Bank — community-built, ready to copy into any AI tool.</p>

          <div className={styles.marqueeRows}>
            {rows.length > 0 ? rows.map((row, idx) => (
              <div className={styles.marqueeRow} key={row.name}>
                <div className={styles.marqueeHeader}>
                  {row.emoji && <span className={styles.marqueeEmoji}>{row.emoji}</span>}
                  <span className={styles.marqueeCat}>{row.name}</span>
                </div>
                <MarqueeRow
                  items={row.items}
                  reverse={idx % 2 === 1}
                  onCardClick={handlePromptClick}
                />
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                Loading prompts…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`${styles.section} ${styles.hiwSection}`} id="how-it-works">
        <div className={styles.sectionInner}>

          {/* ── Hero row ── */}
          <div className={styles.hiwHeroRow}>
            <div>
              <p className={styles.sectionEyebrow}>How It Works</p>
              <div className={styles.hiwLabelPill}>
                <span className={styles.hiwLabelDot} />
                Simple. Fast. Powerful.
              </div>
              <h2 className={styles.sectionHeading}>From idea to<br /><em>perfect prompt.</em></h2>
              <p className={styles.sectionSub}>Three steps. Derek handles the hard part — you just share what you need.</p>
              <a href="#derek" className={styles.btnPrimary}>
                Ask Derek now <ArrowRight size={16} />
              </a>
            </div>

            {/* Derek hero photo */}
            <div className={styles.hiwHeroIllust}>
              <div className={styles.hiwHeroGlow} />
              <div className={styles.hiwOrbit} />
              <div className={styles.hiwOrbitInner} />
              <div className={styles.hiwHeroPhoto}>
                <Image src="/derek/derek2.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
              </div>
              <div className={styles.hiwFloatCard}>
                <span className={styles.hiwTPrompt}>&gt;_</span>
                Write me a viral Instagram caption...
              </div>
            </div>
          </div>

          {/* ── Step cards ── */}
          <div className={styles.hiwSteps}>

            {/* Step 1 — Share your idea */}
            <div className={styles.hiwStep}>
              <span className={styles.hiwStepNum}>1</span>
              <div className={styles.hiwStepTop}>
                <div className={styles.hiwStepAvatar}>
                  <Image src="/derek/derek3.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
                </div>
                <span className={styles.hiwStepBadge}>01</span>
              </div>
              <div className={styles.hiwTerminal}>
                <span className={styles.hiwTPrompt}>&gt;</span>
                <span className={styles.hiwTText}>your idea here...</span>
                <span className={styles.hiwTCursor} />
              </div>
              <h3 className={styles.hiwStepTitle}>Share your <em>idea</em></h3>
              <p className={styles.hiwStepBody}>Tell Derek what you want in plain words. A caption, a hook, a message, a plan — anything. No experience needed.</p>
              <span className={styles.hiwStepTag}>you type</span>
            </div>

            {/* Step 2 — Ask Derek to engineer it */}
            <div className={`${styles.hiwStep} ${styles.hiwStep2}`}>
              <span className={styles.hiwStepNum}>2</span>
              <div className={styles.hiwStepTop}>
                <div className={styles.hiwStepAvatar}>
                  <Image src="/derek/derek1.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
                </div>
                <span className={styles.hiwStepBadge}>02</span>
              </div>
              <div className={`${styles.hiwTerminal} ${styles.hiwTerminal2}`}>
                <span className={styles.hiwTPrompt}>#</span>
                <span className={styles.hiwTText}>ask derek to engineer it...</span>
                <span className={styles.hiwTCursor} />
              </div>
              <h3 className={styles.hiwStepTitle}><em>Ask Derek</em> to engineer it</h3>
              <p className={styles.hiwStepBody}>Derek structures and optimises your idea into a precision prompt in seconds. No jargon. No struggle. He does the engineering.</p>
              <span className={styles.hiwStepTag}>derek works</span>
            </div>

            {/* Step 3 — Paste and get results */}
            <div className={styles.hiwStep}>
              <span className={styles.hiwStepNum}>3</span>
              <div className={styles.hiwStepTop}>
                <div className={styles.hiwStepAvatar}>
                  <Image src="/derek/derek4.jpeg" alt="Derek" fill style={{ objectFit: "cover", objectPosition: "center 15%" }} />
                </div>
                <span className={styles.hiwStepBadge}>03</span>
              </div>
              <div className={styles.hiwTerminal}>
                <span className={styles.hiwTCheck}>✓</span>
                <span className={styles.hiwTText}>prompt ready — copy &amp; paste</span>
              </div>
              <h3 className={styles.hiwStepTitle}>Paste. <em>Get results.</em></h3>
              <p className={styles.hiwStepBody}>Copy your prompt into ChatGPT, Claude, Gemini, anything — and get scroll-stopping, impactful output. Instantly.</p>
              <span className={styles.hiwStepTag}>you win</span>
            </div>

          </div>

          {/* ── Bottom quote ── */}
          <div className={styles.hiwBottom}>
            <div className={styles.hiwBottomLine} />
            <p className={styles.hiwBottomQuote}>
              A great idea shouldn&apos;t start with confusion — it should start with <strong>the right prompt.</strong>
            </p>
            <div className={styles.hiwBottomLine} />
          </div>

        </div>
      </section>

      {/* SEE DEREK IN ACTION — auto-looping 4-stage demo */}
      <DerekDemo />

      {/* DEREK */}
      <section className={`${styles.section} ${styles.derekSection}`} id="derek">
        <div className={styles.sectionInner}>
          <div className={styles.derekGrid}>
            <div>
              <p className={styles.sectionEyebrow}>Ask Derek</p>
              <h2 className={styles.sectionHeading}>Can&apos;t find it?<br /><em>Derek builds it.</em></h2>
              <p className={styles.sectionSub}>Tell Derek what you need in plain words. He engineers a precision prompt in seconds. Then copy it into any AI — or publish it to the marketplace and earn.</p>

              <div className={styles.derekFeatures}>
                <div className={styles.derekFeature}>
                  <div className={styles.derekFeatureIcon}><CheckCircle2 size={14} color="var(--violet)" /></div>
                  <div>
                    <p className={styles.derekFeatureTitle}>No prompt experience needed</p>
                    <p className={styles.derekFeatureDesc}>Just describe your idea. Derek handles the engineering.</p>
                  </div>
                </div>
                <div className={styles.derekFeature}>
                  <div className={styles.derekFeatureIcon}><CheckCircle2 size={14} color="var(--violet)" /></div>
                  <div>
                    <p className={styles.derekFeatureTitle}>Use it or sell it</p>
                    <p className={styles.derekFeatureDesc}>Every prompt Derek makes can be published to the marketplace to earn.</p>
                  </div>
                </div>
                <div className={styles.derekFeature}>
                  <div className={styles.derekFeatureIcon}><CheckCircle2 size={14} color="var(--violet)" /></div>
                  <div>
                    <p className={styles.derekFeatureTitle}>Works with any AI tool</p>
                    <p className={styles.derekFeatureDesc}>Paste into ChatGPT, Claude, Gemini — whatever you use.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.derekChatFrame}>
              <div className={styles.derekChatHeader}>
                <div className={styles.derekAvatar}>
                  <Image
                    src="/derek/derek1.jpeg"
                    alt="Derek"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center 15%", borderRadius: "50%" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
                <div>
                  <div className={styles.derekChatName}>Derek — Prompt Engineer</div>
                  <div className={styles.derekChatStatus}><span className={styles.statusDot} />Online · ready to build</div>
                </div>
              </div>
              <div className={styles.derekChatBody}>
                <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
                  <SplitChat guestMode />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRIDGE: Derek -> Marketplace publish flow */}
      <section className={`${styles.section} ${styles.bridgeSection}`} id="earn">
        <div className={styles.sectionInner}>
          <div className={styles.bridgeInner}>
            <div>
              <p className={`${styles.sectionEyebrow} ${styles.amberText}`}>For Creators</p>
              <h2 className={styles.sectionHeading}>Derek engineers it.<br />You <span className={styles.amber}>sell it.</span></h2>
              <p className={styles.sectionSub}>Save a prompt Derek built to your Favourites, then list it in the marketplace. You set the price — every buyer pays you directly.</p>

              <div className={styles.bridgeFlow}>
                <div className={styles.flowStep}>
                  <div className={`${styles.flowNum} ${styles.flowNumViolet}`}>1</div>
                  <div>
                    <div className={styles.flowTitle}>Ask <em>Derek</em> to engineer your prompt</div>
                    <div className={styles.flowDesc}>Share your idea in plain language. Derek structures, optimises, and precision-engineers it into a prompt that performs.</div>
                  </div>
                </div>
                <div className={styles.flowConnector} />
                <div className={styles.flowStep}>
                  <div className={`${styles.flowNum} ${styles.flowNumViolet}`}>2</div>
                  <div>
                    <div className={styles.flowTitle}>Save it to your <em>Favourites</em></div>
                    <div className={styles.flowDesc}>Test it in any AI tool. Happy with the output? Save it so you can list it.</div>
                  </div>
                </div>
                <div className={styles.flowConnector} />
                <div className={styles.flowStep}>
                  <div className={`${styles.flowNum} ${styles.flowNumAmber}`}>3</div>
                  <div>
                    <div className={styles.flowTitle}>Publish to the <span className={styles.amber}>marketplace</span></div>
                    <div className={styles.flowDesc}>Set your price (₹1–₹1000). Add a title. One click to list. Your prompt is live and earning.</div>
                  </div>
                </div>
                <div className={styles.flowConnector} />
                <div className={styles.flowStep}>
                  <div className={`${styles.flowNum} ${styles.flowNumGreen}`}>4</div>
                  <div>
                    <div className={styles.flowTitle}>Earn every time someone buys</div>
                    <div className={styles.flowDesc}>Buyers see the prompt blurred until they purchase. Build a library of prompts and earn passively while Derek keeps building new ones for you.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings card — illustrative example */}
            <div className={styles.earningsCard}>
              <div className={styles.earningsHeader}>
                <div className={styles.earningsTitle}>Example prompt earnings</div>
                <div className={styles.earningsLive}><span className={styles.liveDot} />Live</div>
              </div>
              <div className={styles.earningsBody}>
                <div className={styles.earningRow}>
                  <div className={`${styles.earningIcon} ${styles.earningIconViolet}`}>
                    <FileText size={16} color="var(--violet)" />
                  </div>
                  <div className={styles.earningInfo}>
                    <div className={styles.earningName}>Viral Instagram Caption Pack</div>
                    <div className={styles.earningMeta}>48 sales · ₹49 each</div>
                  </div>
                  <div className={styles.earningAmount}>₹2,352</div>
                </div>
                <div className={styles.earningRow}>
                  <div className={`${styles.earningIcon} ${styles.earningIconAmber}`}>
                    <TrendingUp size={16} color="var(--amber)" />
                  </div>
                  <div className={styles.earningInfo}>
                    <div className={styles.earningName}>Hook Generator — 10 Formats</div>
                    <div className={styles.earningMeta}>31 sales · ₹79 each</div>
                  </div>
                  <div className={styles.earningAmount}>₹2,449</div>
                </div>
                <div className={styles.earningRow}>
                  <div className={`${styles.earningIcon} ${styles.earningIconViolet}`}>
                    <Upload size={16} color="var(--violet)" />
                  </div>
                  <div className={styles.earningInfo}>
                    <div className={styles.earningName}>Cold Email Pack — B2B</div>
                    <div className={styles.earningMeta}>22 sales · ₹99 each</div>
                  </div>
                  <div className={styles.earningAmount}>₹2,178</div>
                </div>
                <div className={styles.earningsTotal}>
                  <div className={styles.earningsTotalLabel}>This month</div>
                  <div className={styles.earningsTotalNum}>₹6,979</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className={`${styles.section} ${styles.aboutSection}`} id="about">
        <div className={styles.sectionInner}>
          <div className={styles.aboutInner}>
            <div className={styles.aboutLeft}>
              <p className={styles.sectionEyebrow}>Our story</p>

              <div className={styles.aboutPull}>
                <p className={styles.aboutPullText}>
                  The answer wasn&apos;t a <em>smarter AI.</em><br />
                  It was a better <span className={styles.amber}>prompt.</span>
                </p>
              </div>

              <div className={styles.aboutBody}>
                <p className={styles.aboutPara}>
                  EaseMyPrompt.ai is built for people who want clarity, speed, and impact. No guesswork. No generic outputs. Just smart, tailored prompts that unlock scroll-stopping captions, viral scripts, and high-performing hooks — every time.
                </p>
                <p className={styles.aboutPara}>
                  Our platform is designed to turn simple ideas into powerful prompts that work with any AI tool. Whether you want to create an Instagram caption, viral hooks, write a message, generate content, plan a project, or simply get help with everyday tasks, EaseMyPrompt.ai helps you generate the perfect prompt in seconds.
                </p>
                <p className={styles.aboutPara}>
                  At the heart of the platform is <strong>Derek</strong> — a built-in AI prompt engineer who helps you go from half-formed idea to precision prompt in seconds. No technical background required. Just tell Derek what you need, and he engineers it. <span className={styles.highlight}>If it&apos;s good enough to sell, publish it to the marketplace</span> and start earning every time someone buys it.
                </p>
                <p className={styles.aboutPara}>
                  Instead of struggling to figure out what to type into AI, you simply share your idea. Our system transforms that idea into a structured, optimized prompt that you can copy and paste into any AI platform to get better, clearer, and more impactful results.
                </p>
              </div>
            </div>

            <div className={styles.aboutRight}>
              <div className={styles.originCard}>
                <div className={styles.originTag}>The origin</div>
                <div className={styles.originQuote}>
                  &quot;Hours of tinkering. The same ideas rewritten over and over.{" "}
                  <em>Why does the AI keep missing the point?</em>&quot;
                </div>
                <p className={styles.originBody}>
                  That frustration became the foundation. The marketplace exists so no one has to start from scratch. Derek exists so anyone can create a prompt worth selling. Together, they turn a painful problem into a platform — and a platform into a business.
                </p>
              </div>

              <div className={styles.aboutStats}>
                <div className={styles.aboutStat}>
                  <div className={styles.aboutStatNum}>2,400<span>+</span></div>
                  <div className={styles.aboutStatLabel}>Prompts in marketplace</div>
                </div>
                <div className={styles.aboutStat}>
                  <div className={styles.aboutStatNum}>18k<span>+</span></div>
                  <div className={styles.aboutStatLabel}>Active users worldwide</div>
                </div>
                <div className={styles.aboutStat}>
                  <div className={styles.aboutStatNum}>₹84k<span>+</span></div>
                  <div className={styles.aboutStatLabel}>Paid to prompt creators</div>
                </div>
                <div className={styles.aboutStat}>
                  <div className={styles.aboutStatNum}>4.9<span>★</span></div>
                  <div className={styles.aboutStatLabel}>Average prompt rating</div>
                </div>
              </div>

              <div className={styles.derekCallout}>
                <div className={styles.derekCalloutAv}>
                  <Image
                    src="/derek/derek1.jpeg"
                    alt="Derek"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center 15%", borderRadius: "50%" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
                <div className={styles.derekCalloutText}>
                  <strong>Meet Derek — your built-in prompt engineer</strong>
                  <p>Turn any half-formed idea into a precision prompt in seconds — then publish it to the marketplace and earn. No technical knowledge needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.footerLogo}>EaseMyPrompt<span>.ai</span></Link>
          <ul className={styles.footerLinks}>
            <li><Link href="/marketplace">Marketplace</Link></li>
            <li><a href="#derek">Ask Derek</a></li>
            <li><a href="#earn">Sell Prompts</a></li>
            <li><a href="#about">About</a></li>
          </ul>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} easemyprompt.ai</p>
        </div>
      </footer>
    </div>
  )
}
