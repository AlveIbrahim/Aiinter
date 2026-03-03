'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Brain,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  ChevronRight,
} from "lucide-react";
import ParticleLandscapeBackground from "@/components/ParticleLandscapeBackground";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground overflow-hidden selection:bg-primary selection:text-black" style={{ background: 'transparent' }}>
      {/* 3D Particle Landscape Background */}
      <ParticleLandscapeBackground />

      {/* Scanline Effect */}
      <div className="scanline"></div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-all"></div>
              <Brain className="relative h-6 w-6 text-primary animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-glow">
              MOCK_MIND<span className="animate-cursor-blink">_</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <span className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
                [ ACCESS_LOGIN ]
              </span>
            </Link>
            <Link href="/signup">
              <Button 
                className="font-mono border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all rounded-none uppercase tracking-widest text-xs h-10 px-6"
              >
                &gt; INIT_SYSTEM
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-6 max-w-4xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-4 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SYSTEM_STATUS: ONLINE // V.3.5.0
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/50 text-glow">
            MASTER THE<br />
            ALGORITHM.
          </h1>
          
          <div className="max-w-2xl border-l-2 border-primary/50 pl-6 py-2">
            <p className="text-lg md:text-xl text-muted-foreground font-mono leading-relaxed">
              <span className="text-primary">&gt;</span> Initialize AI-powered mock interview protocol.<br/>
              <span className="text-primary">&gt;</span> Real-time voice analysis detected.<br/>
              <span className="text-primary">&gt;</span> Feedback loop active.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 pt-8">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-mono text-black bg-primary hover:bg-primary/90 rounded-none h-14 px-8 text-lg border border-primary uppercase tracking-widest relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  Execute_Sim <ArrowRight className="h-5 w-5" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-mono text-primary border-primary bg-transparent hover:bg-primary/10 rounded-none h-14 px-8 text-lg uppercase tracking-widest">
                User_Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Code/Terminal Decorator */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[500px] border border-border bg-black/60 backdrop-blur-md p-2 shadow-2xl shadow-primary/10">
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-border/50 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            <span className="text-xs text-muted-foreground font-mono ml-2">interview_protocol.exe</span>
          </div>
          <div className="font-mono text-xs space-y-1 p-2 h-[300px] overflow-hidden text-muted-foreground">
            <p><span className="text-primary">root@mockmind:~$</span> ./start_interview.sh</p>
            <p className="text-white">Loading modules...</p>
            <p>[OK] OpenAI GPT-3.5 connection established</p>
            <p>[OK] ElevenLabs Voice Synthesis ready</p>
            <p>[OK] Speech Recognition API active</p>
            <br/>
            <p><span className="text-primary">?</span> Select role: <span className="text-white">Full Stack Engineer</span></p>
            <p><span className="text-primary">?</span> Difficulty: <span className="text-white">Hard</span></p>
            <br/>
            <p className="text-white">Initializing interview environment...</p>
            <p className="animate-pulse text-primary">_</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-border/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
          {[
            {
              icon: Mic,
              title: "Voice_I/O",
              desc: "Full duplex audio communication channel. Speak naturally.",
              stat: "120ms latency",
            },
            {
              icon: Brain,
              title: "Neural_Core",
              desc: "Powered by GPT-3.5. Dynamic question generation algorithm.",
              stat: "1.7T params",
            },
            {
              icon: Activity,
              title: "Realtime_Analytics",
              desc: "Instant feedback loop on technical accuracy and soft skills.",
              stat: "99.9% uptime",
            },
            {
              icon: Layers,
              title: "Multi_Track",
              desc: "Frontend, Backend, System Design. Comprehensive coverage.",
              stat: "4 tracks",
            },
          ].map((f, i) => (
            <div key={i} className="group border-b md:border-b-0 md:border-r border-border last:border-0 p-8 hover:bg-primary/5 transition-colors relative overflow-hidden bg-background/70 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
              <f.icon className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-bold font-mono mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed mb-4">{f.desc}</p>
              <div className="text-xs font-mono text-primary/70 border-t border-dashed border-primary/30 pt-3">
                &gt; {f.stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Status Bar */}
      <footer className="border-t border-primary/30 bg-black py-2 px-6 fixed bottom-0 w-full z-50 font-mono text-[10px] uppercase tracking-widest text-primary/60 flex justify-between items-center backdrop-blur-sm">
        <div className="flex gap-4">
          <span>MEM: 64KB OK</span>
          <span>CPU: ACTIVE</span>
          <span className="hidden sm:inline">NET: CONNECTED</span>
        </div>
        <div className="flex gap-4">
          <span>© 2024 MOCK_MIND SYSTEM</span>
          <span className="animate-pulse">_</span>
        </div>
      </footer>
    </div>
  );
}
