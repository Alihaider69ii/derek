"use client"
import * as React from "react"
import { Suspense } from "react"
import { Navbar } from "@/components/shared/Navbar"
import { SplitChat } from "@/components/shared/SplitChat"
import { PromptCard } from "@/components/shared/PromptCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Twitter, Linkedin, Instagram, Zap, Eye, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

// ── Typing tagline animation ─────────────────────────────────────────────────
const TAGLINE_FULL = "Stop guessing, start getting results — convert any idea into precision‑crafted AI prompts built for speed, quality, and impact."

function TypingTagline() {
  const [displayed, setDisplayed] = React.useState("")
  const [phase, setPhase] = React.useState<"typing" | "hold" | "done">("typing")
  const idx = React.useRef(0)

  React.useEffect(() => {
    if (phase === "typing") {
      const id = setInterval(() => {
        idx.current += 1
        setDisplayed(TAGLINE_FULL.slice(0, idx.current))
        if (idx.current >= TAGLINE_FULL.length) {
          clearInterval(id)
          setPhase("done")
        }
      }, 28)
      return () => clearInterval(id)
    }
  }, [phase])

  return (
    <div className="relative py-12 px-4">
      {/* Gradient shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent pointer-events-none" />
      <div className="container mx-auto max-w-3xl text-center">
        <p
          className="text-xl md:text-2xl font-semibold leading-relaxed"
          style={{
            background: "linear-gradient(90deg, #94a3b8 0%, #e2e8f0 50%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            minHeight: "3em",
          }}
        >
          {displayed}
          {phase !== "done" && (
            <span style={{ WebkitTextFillColor: "#3b82f6", animation: "blink 1s step-end infinite" }}>|</span>
          )}
        </p>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}

// ── Contact form ─────────────────────────────────────────────────────────────
function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Thank you for reaching out! We'll get back to you soon.");
        setName(""); setEmail(""); setMessage("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5 flex flex-col pt-2" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Full Name</label>
          <Input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Email</label>
          <Input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2 pb-2">
        <label className="text-sm font-medium text-text-primary">Message</label>
        <textarea
          className="w-full min-h-[120px] rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-[150ms_ease] resize-y"
          placeholder="How can we help?"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>
      {success && <div className="text-green-600 text-sm text-center">{success}</div>}
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <Button type="submit" className="w-full h-12 text-md" disabled={loading}>{loading ? "Sending..." : "Send Message"}</Button>
    </form>
  );
}

// ── LLM Rating Showcase ───────────────────────────────────────────────────────
function LLMRatingShowcase() {
  return (
    <section className="py-20 bg-bg-base border-b border-border overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-[#6c63ff] font-semibold mb-2">
            Why It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Not all prompts are created equal.
          </h2>
          <p className="text-text-secondary text-lg">
            See the difference between generic human thoughts and Derek's precision engineering.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Generic Prompt */}
          <div className="bg-[#121629]/50 border border-border rounded-xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Your Raw Idea</h3>
                <p className="text-text-secondary text-sm">Typical human input</p>
              </div>
              <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/10">
                <span className="text-red-400 font-bold text-lg">4<span className="text-xs text-red-400/70">/10</span></span>
              </div>
            </div>
            <div className="bg-bg-panel/50 p-4 rounded-lg border border-border/50 text-text-secondary mb-6 italic text-sm">
              "Write a cold email to sell my marketing services to dentists."
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Structure</span>
                <span className="text-red-400">Poor</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: "30%" }}></div></div>
              
              <div className="flex justify-between text-sm pt-2">
                <span className="text-text-secondary">Context</span>
                <span className="text-orange-400">Basic</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: "45%" }}></div></div>
              
              <div className="flex justify-between text-sm pt-2">
                <span className="text-text-secondary">AI Output Quality</span>
                <span className="text-orange-400">Generic</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: "40%" }}></div></div>
            </div>
          </div>

          {/* Derek's Prompt */}
          <div className="bg-[#121629] border border-[#6c63ff]/30 rounded-xl p-6 md:p-8 relative shadow-[0_0_30px_rgba(108,99,255,0.15)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6c63ff] to-[#a09cff]" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Engineered by Derek <Zap size={18} className="text-[#6c63ff]" />
                </h3>
                <p className="text-[#6c63ff]/70 text-sm">Precision AI framework</p>
              </div>
              <div className="w-12 h-12 rounded-full border border-[#6c63ff]/50 flex items-center justify-center bg-[#6c63ff]/10 shadow-[0_0_15px_rgba(108,99,255,0.3)]">
                <span className="text-[#6c63ff] font-bold text-lg drop-shadow-md">9.8<span className="text-xs text-[#6c63ff]/70 drop-shadow-none">/10</span></span>
              </div>
            </div>
            
            <div className="bg-[#161b22] p-4 rounded-lg border border-[#6c63ff]/20 text-[#e6edf3] mb-6 text-sm font-mono leading-relaxed h-[85px] overflow-hidden relative">
               [ROLE]: Expert B2B Copywriter<br/>
               [TASK]: Draft a 3-part cold email sequence.<br/>
               [TARGET]: Dental practice owners...
               <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#161b22] to-transparent"></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#a09cff]">Structure</span>
                <span className="text-[#6c63ff] font-medium">Optimal</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-[#6c63ff] h-1.5 rounded-full shadow-[0_0_10px_rgba(108,99,255,0.8)]" style={{ width: "98%" }}></div></div>
              
              <div className="flex justify-between text-sm pt-2">
                <span className="text-[#a09cff]">Context</span>
                <span className="text-[#6c63ff] font-medium">Comprehensive</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-[#6c63ff] h-1.5 rounded-full shadow-[0_0_10px_rgba(108,99,255,0.8)]" style={{ width: "95%" }}></div></div>
              
              <div className="flex justify-between text-sm pt-2">
                <span className="text-[#a09cff]">AI Output Quality</span>
                <span className="text-[#6c63ff] font-medium">Outstanding</span>
              </div>
              <div className="w-full bg-bg-panel rounded-full h-1.5"><div className="bg-[#6c63ff] h-1.5 rounded-full shadow-[0_0_10px_rgba(108,99,255,0.8)]" style={{ width: "99%" }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('All')
  const [viralPrompts, setViralPrompts] = React.useState<any[]>([])
  const [popularPrompts, setPopularPrompts] = React.useState<any[]>([])
  const tabs = ['All', 'Coding', 'Writing', 'Marketing', 'Image Generation', 'Copywriting']

  React.useEffect(() => {
    fetch('/api/prompts/viral').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setViralPrompts(data)
    }).catch(console.error)

    fetch('/api/prompts/popular').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setPopularPrompts(data)
    }).catch(console.error)
  }, [])

  const handlePromptClick = () => {
    if (confirm("Please login to access the prompt. Go to login?")) {
      router.push('/login')
    }
  }

  const filteredPrompts = popularPrompts.filter(prompt =>
    activeTab === 'All' ? true : prompt.category === activeTab
  )

  return (
    <div className="min-h-screen animated-bg flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-in slide-in-from-bottom-5 fade-in duration-500">
              <h1 className="mb-6 text-text-primary text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Engineer Prompts <span className="text-accent text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">Like a Pro</span>. Test Them Instantly.
              </h1>
              <p className="text-text-secondary text-lg md:text-xl">
                Tell Derek your casual idea. He turns it into a structured, world-class prompt. Then paste it to Claude and see the magic happen.
              </p>
            </div>

            <div className="w-full max-w-6xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-700 delay-150 fill-mode-both">
              <Suspense fallback={<div>Loading...</div>}>
                <SplitChat guestMode />
              </Suspense>
            </div>
          </div>
        </section>

        {/* DYNAMIC TYPING TAGLINE */}
        <section className="border-y border-border bg-bg-panel/30">
          <TypingTagline />
        </section>

        {/* LLM RATING SHOWCASE */}
        <LLMRatingShowcase />

        {/* VIRAL PROMPTS CAROUSEL */}
        <section className="py-16 bg-bg-panel/50 border-b border-border overflow-hidden">
          <div className="container mx-auto px-4 mb-4">
            {/* Above-prompts headline */}
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-2 text-center">
              Unlock AI&apos;s Full Potential with Perfect Prompts by Derek
            </p>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              Viral Prompts
            </h2>
          </div>

          <div className="relative overflow-hidden hide-scrollbar pb-4">
            {/* Edge fade gradients */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-[#0d1117] to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-[#0d1117] to-transparent z-10"></div>

            <div className="flex gap-4 animate-marquee w-max hover:[animation-play-state:paused] px-4">
              {viralPrompts.length > 0 ? [...viralPrompts, ...viralPrompts, ...viralPrompts, ...viralPrompts].map((prompt, i) => (
                <div key={i} className="shrink-0 w-[280px] md:w-[350px]">
                  <PromptCard {...prompt} onClick={handlePromptClick} />
                </div>
              )) : (
                <div className="text-text-secondary h-20 flex items-center justify-center w-full px-8">Loading viral prompts...</div>
              )}
            </div>
          </div>
        </section>

        {/* POPULAR PROMPTS GRID */}
        <section className="py-20 px-4 container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
                Unlock AI&apos;s Full Potential with Perfect Prompts by Derek
              </p>
              <h2 className="text-3xl font-bold text-text-primary">Popular Prompts</h2>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 w-full md:w-auto hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-accent text-white' : 'bg-bg-hover text-text-secondary hover:bg-bg-panel hover:text-text-primary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt, i) => (
                <PromptCard key={i} {...prompt} className="w-full" onClick={handlePromptClick} />
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center text-text-secondary h-40">
                No prompts found for this category or loading.
              </div>
            )}
          </div>
        </section>

        {/* ABOUT US */}
        <section id="about" className="py-24 bg-[#0a0f1c] relative overflow-hidden">
          {/* Circuit background overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="container mx-auto max-w-6xl relative z-10 px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              
              {/* Left Column: Text Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#2a2a4a]">
                   <span className="w-2 h-2 rounded-full bg-[#6c63ff] animate-pulse" />
                   <span className="text-xs font-semibold text-[#a09cff] uppercase tracking-wider">About Us</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Turning ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c63ff] to-[#a09cff]">precision tools.</span>
                </h2>
                
                <div className="space-y-4 text-[#a0a5b5] text-lg leading-relaxed">
                  <p>
                    EaseMyPrompt.ai is built for people who want clarity, speed, and impact.
                    No guesswork. No generic outputs. Just smart, tailored prompts that unlock scroll‑stopping captions, viral scripts, and high‑performing hooks — every time.
                  </p>
                  <p>
                    Our platform is designed to turn simple ideas into powerful prompts that work with any AI tool. Whether you want to create an Instagram caption, viral hooks, write a message, generate content, plan a project, or simply get help with everyday tasks, EaseMyPrompt.ai helps you generate the perfect prompt in seconds.
                  </p>
                  <p>
                    EaseMyPrompt.ai is built for everyone. From social media ideas to daily hustles, work tasks, learning, and creative thinking, we help transform your thoughts into clear, effective prompts that unlock better results from AI.
                  </p>
                  <p>
                    Instead of struggling to figure out what to type into AI, you simply share your idea. Our system transforms that idea into a structured, optimized prompt that you can copy and paste into any AI platform to get better, clearer, and more impactful results.
                  </p>
                  <p className="text-[#6c63ff] font-semibold text-xl pt-2">
                    Because a great idea shouldn&apos;t start with confusion — it should start with the right prompt.
                  </p>
                </div>
              </div>

              {/* Right Column: Globe/Network Graphic */}
              <div className="relative h-[400px] lg:h-[600px] w-full flex items-center justify-center perspective-[1000px]">
                {/* Glowing orb center */}
                <div className="absolute w-64 h-64 bg-[#6c63ff] rounded-full blur-[100px] opacity-20 animate-pulse" />
                
                {/* CSS Globe Rings */}
                <div className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] border border-[#2a2a4a] rounded-full [transform:rotateX(60deg)_rotateY(0deg)] animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] border border-[#2a2a4a] rounded-full [transform:rotateX(60deg)_rotateY(60deg)] animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] border border-[#2a2a4a] rounded-full [transform:rotateX(60deg)_rotateY(120deg)] animate-[spin_20s_linear_infinite]" />
                
                <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#161b22] to-[#0a0f1c] border border-[#2a2a4a] shadow-[0_0_40px_rgba(108,99,255,0.3)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[#6c63ff]/10 mix-blend-overlay" />
                  <span className="text-4xl text-transparent text-shadow-sm" style={{ textShadow: "0 0 0 #6c63ff" }}>🌍</span>
                </div>

                {/* Floating Pills */}
                <div className="absolute top-1/4 left-0 md:-left-10 bg-[#161b22] border border-[#2a2a4a] text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl hover:-translate-y-1 transition-transform duration-300">
                  <span className="text-[#6c63ff] mr-2">✦</span> Our Vision
                </div>
                <div className="absolute bottom-1/4 right-0 md:-right-10 bg-[#161b22] border border-[#2a2a4a] text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl hover:-translate-y-1 transition-transform duration-300">
                  <span className="text-[#6c63ff] mr-2">✦</span> Our Mission
                </div>
                <div className="absolute top-1/3 right-10 md:right-0 bg-[#161b22] border border-[#2a2a4a] text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl hover:-translate-y-1 transition-transform duration-300">
                  <span className="text-[#6c63ff] mr-2">✦</span> Innovation
                </div>
              </div>
            </div>

            {/* Cards: Vision + Mission + Evolution */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Vision */}
              <div className="bg-[#121629]/80 backdrop-blur border border-[#2a2a4a] rounded-2xl p-8 hover:border-[#6c63ff]/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6c63ff]/20 to-transparent border border-[#6c63ff]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Eye size={24} className="text-[#a09cff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Our Vision</h3>
                <p className="text-[#8a91a6] text-sm leading-relaxed mb-3">
                  To become the world&apos;s most trusted platform for thinking clearly with AI — where prompts are not guesses, but strategic tools that drive impact, creativity, and income.
                </p>
                <p className="text-[#8a91a6] text-sm leading-relaxed">
                  We envision a future where anyone can turn ideas into results using AI, without technical barriers, noise, or confusion.
                </p>
              </div>

              {/* Mission */}
              <div className="bg-[#121629]/80 backdrop-blur border border-[#2a2a4a] rounded-2xl p-8 hover:border-[#6c63ff]/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6c63ff]/20 to-transparent border border-[#6c63ff]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target size={24} className="text-[#a09cff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Our Mission</h3>
                <p className="text-[#8a91a6] text-sm leading-relaxed mb-3">
                  Our mission is to simplify, structure, and elevate AI usage by providing:
                </p>
                <ul className="text-[#8a91a6] text-sm space-y-2 list-none mb-4">
                  <li className="flex items-start gap-3"><Zap size={15} className="text-[#6c63ff] mt-0.5 shrink-0" /> A powerful Prompt Bank built on performance, not randomness</li>
                  <li className="flex items-start gap-3"><Zap size={15} className="text-[#6c63ff] mt-0.5 shrink-0" /> Text-based AI coaching through Derek that teaches users how to think, not just what to type</li>
                  <li className="flex items-start gap-3"><Zap size={15} className="text-[#6c63ff] mt-0.5 shrink-0" /> Clear pathways to create, optimize, and monetize AI-generated content</li>
                </ul>
                <p className="text-[#8a91a6] text-sm leading-relaxed">
                  We exist to help creators, entrepreneurs, and businesses use AI with intention, confidence, and results.
                </p>
              </div>

              {/* Continuous Evolution */}
              <div className="bg-[#121629]/80 backdrop-blur border border-[#2a2a4a] rounded-2xl p-8 hover:border-[#6c63ff]/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6c63ff]/20 to-transparent border border-[#6c63ff]/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} className="text-[#a09cff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Continuous Evolution</h3>
                <p className="text-[#8a91a6] text-sm leading-relaxed">
                  EaseMyPrompt.ai grows smarter every day. By learning from real usage patterns, trends, and feedback, our platform continuously improves to deliver faster, sharper, and more effective prompts — so users always get better results with AI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-20 px-4 container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is it really free?", a: "Yes — you get 3 free chats with Derek and 3 free chats with Claude every 3 hours without signing up. The Free Plan gives you access to a limited prompt bank." },
              { q: "What models are supported?", a: "Currently, we proxy directly to Anthropic's Claude Sonnet 4.6, Claude 3 Opus, and Claude 3 Haiku." },
              { q: "What is a Mega Prompt?", a: "Mega Prompts are heavily engineered, highly structured prompts designed to tackle very complex multi-step workflows. They are marked with a gold badge." }
            ].map((faq, i) => (
              <details key={i} className="bg-bg-panel border border-border rounded-lg group overflow-hidden">
                <summary className="p-5 font-medium text-text-primary cursor-pointer list-none flex justify-between items-center transition-colors hover:bg-bg-hover">
                  {faq.q}
                  <ChevronDown className="text-text-secondary group-open:rotate-180 transition-transform duration-200" size={20} />
                </summary>
                <div className="px-5 pb-5 text-text-secondary text-sm border-t border-border mt-1 pt-4 bg-bg-panel/50">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CONTACT FORM */}
        <section id="contact" className="py-24 bg-bg-panel/30 border-t border-border px-4">
          <div className="container mx-auto max-w-2xl bg-bg-panel border border-border p-8 rounded-card shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-hover" />
            <h2 className="text-2xl font-bold text-text-primary mb-2 text-center mt-2">Get in Touch</h2>
            <p className="text-text-secondary text-sm text-center mb-8">Have a question or feedback? We&apos;d love to hear from you.</p>

            <ContactForm />
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="text-text-secondary text-sm mb-2">Connect with us:</div>
              <div className="flex gap-4">
                <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                  <Twitter size={18} className="group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                  <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                  <Instagram size={18} className="group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-bg-panel/80 backdrop-blur-sm border-t border-border pt-16 pb-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12">
            <div className="text-center md:text-left">
              <Link href="/" className="inline-flex items-center gap-1 font-bold text-xl mb-2">
                <span><span className="text-text-primary">easemyprompt</span><span className="text-accent">.ai</span></span>
              </Link>
              <p className="text-text-secondary text-sm max-w-xs mt-2 leading-relaxed">Democratizing prompt engineering for a human-centric AI future.</p>
            </div>

            <div className="flex gap-8 text-sm font-medium text-text-secondary">
              <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
              <Link href="/prompt-bank" className="hover:text-text-primary transition-colors">Prompt Bank</Link>
              <Link href="#about" className="hover:text-text-primary transition-colors">About</Link>
              <Link href="#contact" className="hover:text-text-primary transition-colors">Contact</Link>
            </div>

            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                <Twitter size={18} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-bg-panel border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent hover:text-accent transition-all group">
                <Instagram size={18} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-text-secondary border-t border-border pt-8 font-medium">
            © {new Date().getFullYear()} easemyprompt.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
