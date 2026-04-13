import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle, X, Menu, Shield, Video, Star, CheckCircle,
  ArrowRight, Send, Phone, Globe, Zap, Twitter, Instagram,
  Facebook, Download, Lock, Smile, Paperclip, Mic,
  ChevronRight, Users, Play, FileText, Rocket,
  Monitor, Tablet, Smartphone, Eye, ChevronDown,
} from "lucide-react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "How It Works", "Testimonials", "Security"];

const STATS = [
  { number: "50M+", label: "Active Users" },
  { number: "180+", label: "Countries" },
  { number: "4.9★", label: "App Rating" },
  { number: "0", label: "Ads / Trackers" },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Instant Messaging",
    description: "Lightning-fast delivery with smart read receipts, typing indicators, and message reactions. Supports 100+ languages with real-time translation.",
    color: "#2563EB",
    tag: "Core",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "Every message, call, and file is protected by AES-256 encryption — zero knowledge architecture means even we can't read your chats.",
    color: "#059669",
    tag: "Security",
  },
  {
    icon: Video,
    title: "4K Video Calls",
    description: "Crystal-clear HD and 4K video calls with noise cancellation and background blur. Host group calls with up to 500 participants.",
    color: "#7C3AED",
    tag: "Calls",
  },
  {
    icon: Users,
    title: "Communities & Groups",
    description: "Create channels for teams, families, or interest groups. Manage roles, permissions, and announcements — all in one place.",
    color: "#D97706",
    tag: "Social",
  },
  {
    icon: FileText,
    title: "File Sharing",
    description: "Share files up to 4GB — documents, photos, videos, and archives. Smart previews, cloud backup, and version history included.",
    color: "#DB2777",
    tag: "Files",
  },
  {
    icon: Mic,
    title: "Voice Messages",
    description: "Record, listen, and reply to voice messages with waveform visualization and 2x playback speed. Perfect for hands-free communication.",
    color: "#0891B2",
    tag: "Audio",
  },
];

const CHAT_MESSAGES = [
  { id: 1, user: "Arjun", message: "Hey team! Sprint kickoff in 5 mins 🚀", time: "10:28 AM", isMe: false, color: "#2563EB" },
  { id: 2, user: "You", message: "On my way! Sharing the mockups 🎨", time: "10:29 AM", isMe: true, reactions: ["👍", "❤️"] },
  { id: 3, user: "Meera", message: "Looks amazing! Love the new UI 😍", time: "10:31 AM", isMe: false, color: "#7C3AED" },
  { id: 4, user: "You", message: "Thanks! Built it overnight 😅", time: "10:32 AM", isMe: true },
  { id: 5, user: "Arjun", message: "Incredible work as always. Meeting starting!", time: "10:33 AM", isMe: false, color: "#2563EB" },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Product Designer",
    avatar: "https://i.pravatar.cc/150?u=priya",
    text: "ZATCHAT completely replaced Slack for our team. The design is gorgeous, and the encryption gives us peace of mind when sharing client files.",
    stars: 5,
  },
  {
    name: "Marcus Chen",
    role: "Lead Engineer",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    text: "I've tried every messaging app. Nothing comes close to ZATCHAT's speed and reliability. File transfers at 4GB? Insane. Our team adopted it in a day.",
    stars: 5,
  },
  {
    name: "Sofia Rodriguez",
    role: "Product Manager",
    avatar: "https://i.pravatar.cc/150?u=sofia",
    text: "The communities feature is a game-changer. I manage 3 different teams and a 10K community — ZATCHAT handles it all without breaking a sweat.",
    stars: 5,
  },
  {
    name: "Aiko Tanaka",
    role: "UX Lead",
    avatar: "https://i.pravatar.cc/150?u=aiko",
    text: "Switching from WhatsApp was scary but worth every second. The voice message waveforms alone made me fall in love. Quality all the way through.",
    stars: 5,
  },
];

const HOW_IT_WORKS = [
  { icon: Download, title: "Download the App", desc: "Available on iOS, Android, and Web. Takes less than 30 seconds to install." },
  { icon: Smartphone, title: "Create your Account", desc: "Sign up with your phone number or email. No spam, no surveys." },
  { icon: Users, title: "Invite your People", desc: "Find friends, family, and coworkers. Or create a new community." },
  { icon: MessageCircle, title: "Start Chatting", desc: "Text, call, share files. Everything is instant and encrypted by default." },
];

const PLATFORMS = [
  { icon: Smartphone, name: "iOS & Android" },
  { icon: Monitor, name: "Mac & Windows" },
  { icon: Globe, name: "Web Browser" },
  { icon: Tablet, name: "iPad & Tablet" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

const Landing: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,700&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #DBEAFE; color: #1D4ED8; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(37,99,235,0.1); border-color: #BFDBFE !important; }
        .nav-link { transition: color 0.15s ease; color: #475569; }
        .nav-link:hover { color: #2563EB; }
        .btn-primary { transition: background 0.2s ease; background: #2563EB; }
        .btn-primary:hover { background: #1D4ED8; }
        .btn-ghost { transition: background 0.2s ease; }
        .btn-ghost:hover { background: #F1F5F9; }
        .footer-link { transition: color 0.15s ease; color: #94A3B8; }
        .footer-link:hover { color: #2563EB; }
        .social-icon { transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
        .social-icon:hover { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }
        
        /* Responsive background styles */
        .hero-bg {
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: scroll; /* Changed from fixed for mobile */
        }
        @media (min-width: 768px) {
          .hero-bg {
            background-attachment: fixed;
          }
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(124, 58, 237, 0.85));
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
        }
        .features-bg {
          background-image: url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: scroll;
          position: relative;
        }
        .features-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          z-index: 1;
        }
        .features-content {
          position: relative;
          z-index: 2;
        }
        .security-bg {
          background-image: url('https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: scroll;
          position: relative;
        }
        .security-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(16, 185, 129, 0.9));
          z-index: 1;
        }
        .security-content {
          position: relative;
          z-index: 2;
        }
        
        /* Mobile menu animations */
        .mobile-menu-enter {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.2s ease;
        }
        .mobile-menu-enter-active {
          max-height: 300px;
          opacity: 1;
        }
        
        /* Responsive text adjustments */
        @media (max-width: 640px) {
          h1 {
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
          }
          h2 {
            font-size: 2rem !important;
            line-height: 1.2 !important;
          }
          .container-padding {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Grid responsive adjustments */
        @media (max-width: 768px) {
          .stats-grid {
            gap: 1rem;
          }
          .feature-card {
            padding: 1.5rem;
          }
        }
        
        /* Touch-friendly buttons */
        button, a {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Smooth scrolling */
        .smooth-scroll {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`sticky top-0 z-50 bg-white border-b border-slate-100 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
              <MessageCircle size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">ZATCHAT</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 lg:gap-7">
            {NAV_LINKS.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="nav-link text-xs lg:text-sm font-medium">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link to="/chat-login" className="btn-ghost text-xs lg:text-sm font-semibold px-3 lg:px-4 py-2 rounded-lg text-slate-500">Log in</Link>
            <Link to="/chat-login" className="btn-primary text-xs lg:text-sm font-bold px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl text-white whitespace-nowrap" style={{ boxShadow: "0 2px 10px rgba(37,99,235,0.3)" }}>
              Get Started Free
            </Link>
          </div>

          <button 
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mx-4 mb-3 p-4 rounded-2xl border border-slate-100 bg-slate-50">
            {NAV_LINKS.map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                onClick={() => setIsMenuOpen(false)} 
                className="block py-3 text-sm font-medium text-slate-600 border-b border-slate-100 last:border-0 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="mt-4 space-y-2">
              <Link 
                to="/chat-login" 
                className="block text-center py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                to="/chat-login" 
                className="block text-center py-3 rounded-xl text-sm font-bold text-white" 
                style={{ background: "#2563EB" }}
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO with Background Image ── */}
      <section className="relative pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-28 overflow-hidden hero-bg">
        <div className="hero-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* LEFT */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mx-auto lg:mx-0" style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
                <Zap size={12} fill="currentColor" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">V3.0 is live — Try it free</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] xl:text-[4.5rem] font-black leading-tight lg:leading-[1.05] tracking-tight text-white">
                Instant Messaging,<br />
                <span className="italic">End-to-End Encrypted</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 text-white/90 px-4 sm:px-0">
                The world's most secure messaging platform. Zero ads, zero tracking, end-to-end encrypted by default — with 4K video calls and blazing fast performance.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-4 sm:px-0">
                <button className="bg-white flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-blue-600 hover:bg-blue-50 transition text-sm sm:text-base" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                  <Download size={16} /> Download Free <ArrowRight size={14} />
                </button>
                <button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white border-2 border-white/30 bg-white/10 hover:bg-white/20 transition text-sm sm:text-base">
                  <Play size={14} fill="white" /> Watch Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 lg:gap-10 pt-4 sm:pt-2">
                {STATS.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl sm:text-2xl font-black text-white">{s.number}</div>
                    <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-0.5 text-white/70">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                {PLATFORMS.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold text-white bg-white/10 border border-white/20">
                    <p.icon size={12} /> {p.name}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Phone Mockup */}
            <div className="relative mx-auto max-w-[260px] sm:max-w-[280px] md:max-w-[300px] lg:max-w-[310px] w-full mt-8 lg:mt-0">
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] sm:rounded-[3rem] opacity-30" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", filter: "blur(30px) sm:blur(40px)" }} />

              <div className="relative rounded-[2rem] sm:rounded-[2.75rem] p-2 border-[3px] sm:border-[5px]" style={{ background: "#1E293B", borderColor: "#0F172A", boxShadow: "0 32px 72px rgba(15,23,42,0.2), 0 4px 16px rgba(15,23,42,0.1)" }}>
                <div className="rounded-[1.75rem] sm:rounded-[2.25rem] overflow-hidden bg-white" style={{ height: 500 }}>
                  {/* Notch */}
                  <div className="h-6 sm:h-7 flex justify-center items-end pb-1 sm:pb-1.5 bg-white">
                    <div className="w-16 sm:w-20 h-4 sm:h-5 rounded-full" style={{ background: "#1E293B" }} />
                  </div>

                  {/* App bar */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="relative">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>ST</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white" style={{ background: "#10B981" }} />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-slate-900">Sprint Team</div>
                        <div className="text-[8px] sm:text-[10px] text-slate-400">5 members online</div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 text-slate-400">
                      <Phone size={14} />
                      <Video size={14} />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto" style={{ background: "#F8FAFC", height: 340 }}>
                    {CHAT_MESSAGES.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                        {!msg.isMe && (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 mr-1 sm:mr-1.5 mt-auto flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white" style={{ background: msg.color }}>
                            {msg.user[0]}
                          </div>
                        )}
                        <div className="relative max-w-[80%] sm:max-w-[75%]">
                          <div className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs leading-relaxed ${msg.isMe ? "rounded-tr-sm" : "rounded-tl-sm"}`} style={{
                            background: msg.isMe ? "linear-gradient(135deg, #2563EB, #7C3AED)" : "#fff",
                            color: msg.isMe ? "#fff" : "#1E293B",
                            boxShadow: msg.isMe ? "0 2px 8px rgba(37,99,235,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
                          }}>
                            {!msg.isMe && <div className="text-[8px] sm:text-[9px] font-bold mb-0.5" style={{ color: msg.color }}>{msg.user}</div>}
                            {msg.message}
                            <div className="text-[7px] sm:text-[9px] mt-1 opacity-60">{msg.time}</div>
                          </div>
                          {msg.reactions && (
                            <div className="absolute -bottom-2 sm:-bottom-3 right-0 flex gap-0.5">
                              {msg.reactions.map((r, ri) => (
                                <span key={ri} className="text-[9px] sm:text-[11px] bg-white rounded-full px-1 py-0.5 border border-slate-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="px-2 sm:px-3 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 bg-white border-t border-slate-100">
                    <div className="flex gap-1.5 sm:gap-2 text-slate-400">
                      <Smile size={14} />
                      <Paperclip size={14} />
                    </div>
                    <div className="flex-1 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[11px] text-slate-400 bg-slate-100">Message Sprint Team…</div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                      <Send size={11} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES with Background Image ── */}
      <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-28 features-bg">
        <div className="features-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-3 sm:space-y-4">
              <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>Features</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 px-4">Everything you need to<br className="hidden sm:block" />communicate better.</h2>
              <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-slate-600 px-4">Built for speed, privacy, and the modern way people connect — at home, at work, or across the world.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="card-hover p-5 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center" style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}>
                      <f.icon size={18} style={{ color: f.color }} />
                    </div>
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full" style={{ background: `${f.color}10`, color: f.color }}>{f.tag}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 text-slate-900">{f.title}</h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{f.description}</p>
                  <div className="mt-3 sm:mt-4 md:mt-5 flex items-center gap-1 text-[10px] sm:text-xs font-semibold" style={{ color: f.color }}>
                    Learn more <ChevronRight size={11} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-24" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>Simple Setup</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">Up and running in <span style={{ color: "#2563EB" }}>2 minutes.</span></h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="relative mb-4 sm:mb-5 md:mb-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white border border-slate-200" style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.08)" }}>
                    <s.icon size={20} style={{ color: "#2563EB" }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>{i + 1}</div>
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2 text-slate-900">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 px-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY with Background Image ── */}
      <section id="security" className="py-16 sm:py-20 md:py-24 lg:py-28 security-bg relative overflow-hidden">
        <div className="security-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>Security</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 sm:mb-4">Privacy isn't a feature.<br /><span className="text-white">It's the foundation.</span></h2>
                <p className="text-sm sm:text-base md:text-lg text-white/90">We built ZATCHAT from the ground up with a zero-knowledge architecture. Your data belongs to you — always.</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: Lock, title: "AES-256 End-to-End Encryption", desc: "All messages, calls, and files encrypted before leaving your device." },
                  { icon: Eye, title: "Zero-Knowledge Architecture", desc: "Even our servers can't read your messages. Mathematical guarantee." },
                  { icon: Globe, title: "Open Source Protocol", desc: "Our encryption protocol is fully auditable by the public. No backdoors." },
                  { icon: Shield, title: "GDPR & SOC 2 Compliant", desc: "Enterprise-grade compliance for individuals and businesses alike." },
                ].map((item, i) => (
                  <div key={i} className="card-hover flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <item.icon size={14} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white mb-0.5 sm:mb-1">{item.title}</div>
                      <div className="text-[10px] sm:text-xs text-white/80">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm space-y-4 sm:space-y-5 md:space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }}>
                  <Shield size={28} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Security Report Card</h3>
                <p className="text-xs sm:text-sm text-white/70">Third-party audited · Last updated Feb 2025</p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { label: "Message Encryption", score: "A+" },
                  { label: "Data Minimization", score: "A+" },
                  { label: "Key Management", score: "A" },
                  { label: "Infrastructure Security", score: "A+" },
                  { label: "Open Source Audit", score: "Passed" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 sm:py-2 border-b border-white/20">
                    <span className="text-xs sm:text-sm text-white/80">{row.label}</span>
                    <span className="text-xs sm:text-sm font-black text-white">{row.score}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                <CheckCircle size={14} /> Independently verified by Trail of Bits
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-16 sm:py-20 md:py-24" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>Testimonials</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">Loved by millions worldwide.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="card-hover p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border bg-white cursor-pointer"
                style={{ borderColor: i === activeTestimonial ? "#93C5FD" : "#E2E8F0", boxShadow: i === activeTestimonial ? "0 0 0 2px #BFDBFE, 0 8px 24px rgba(37,99,235,0.08)" : "none" }}
                onClick={() => setActiveTestimonial(i)}
              >
                <div className="flex mb-3 sm:mb-4">
                  {[...Array(t.stars)].map((_, si) => <Star key={si} size={11} fill="#F59E0B" style={{ color: "#F59E0B" }} />)}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 text-slate-600">"{t.text}"</p>
                <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                  <img src={t.avatar} alt={t.name} className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTestimonial(i)} 
                className="transition-all duration-300"
                style={{ 
                  width: i === activeTestimonial ? 20 : 8, 
                  height: 8, 
                  borderRadius: 99, 
                  background: i === activeTestimonial ? "#2563EB" : "#CBD5E1",
                  border: "none", 
                  cursor: "pointer", 
                  padding: 0 
                }} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20" style={{ background: "#F0F7FF" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 text-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #5B21B6)", boxShadow: "0 16px 48px rgba(37,99,235,0.2)" }}>
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none text-white"><Globe size={200} className="sm:w-[240px] sm:h-[240px]" /></div>
            <div className="relative z-10 space-y-4 sm:space-y-5 md:space-y-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/15 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <Rocket size={10} /> Join 50 million+ users today
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white px-2">Ready to upgrade<br />how you communicate?</h2>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 max-w-xl mx-auto px-4">Free forever plan available. No credit card required. Set up in under 2 minutes.</p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
                <button className="bg-white text-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black flex items-center gap-2 text-sm sm:text-base" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                  <Download size={16} /> Download Free
                </button>
                <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white border border-white/30 bg-white/10 text-sm sm:text-base">
                  View All Features
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 py-12 sm:py-14 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 pb-8 sm:pb-10 md:pb-12 border-b border-slate-100">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                  <MessageCircle size={16} className="text-white" />
                </div>
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">ZATCHAT</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-xs">Making communication borderless, secure, and built for the way humans actually connect with each other.</p>
              <div className="flex gap-2 sm:gap-3">
                {[Twitter, Instagram, Facebook].map((Icon, i) => (
                  <div key={i} className="social-icon w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center cursor-pointer border border-slate-200 text-slate-400">
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>

            {[
              { title: "Product", links: ["Features", "Changelog", "Roadmap", "Status"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press Kit", "Contact"] },
              { title: "Resources", links: ["Docs", "API Reference", "Community", "Security", "Privacy"] },
            ].map((col) => (
              <div key={col.title} className="space-y-2 sm:space-y-3 md:space-y-4">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{col.title}</h4>
                <ul className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link} className="footer-link text-xs sm:text-sm cursor-pointer hover:text-blue-600 transition-colors">{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-6 sm:pt-8">
            <p className="text-[10px] sm:text-xs text-slate-400 text-center sm:text-left">© {new Date().getFullYear()} ZATCHAT Inc. — All rights reserved.</p>
            <div className="flex gap-4 sm:gap-6 text-[10px] sm:text-xs">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <span key={l} className="footer-link cursor-pointer hover:text-blue-600 transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;