import Link from "next/link";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Camera, Zap as ZapIcon, DollarSign, Lightbulb, Lock, Smartphone, Target, Trophy, Sparkles } from "lucide-react";
import { AICarScanner } from "@/components/AICarScanner";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* ─── Navigation ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[color:var(--background)]/80 backdrop-blur-xl border-b border-[color:var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <InsureVisionLogo className="h-8 w-8" />
            <span className="font-bold text-xl hidden sm:inline bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              InsureVision AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-[color:var(--foreground)] hover:bg-[color:var(--muted)] transition text-sm font-medium">
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-[color:var(--background)] hover:opacity-90 transition text-sm font-semibold">
              Sign Up
            </Link>
            <div className="text-[color:var(--foreground)]">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-40">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[color:var(--muted-foreground)]">
                AI Vehicle Estimation
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
              Damage Estimation in{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Seconds
              </span>
            </h1>
            
            <p className="text-lg text-[color:var(--muted-foreground)] mb-8 leading-relaxed max-w-xl">
              Upload detailed car photos and let our advanced AI generate accurate repair cost estimates instantly. No more waiting for expensive appointments.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-[color:var(--background)] font-semibold hover:opacity-90 active:scale-95 transition-all text-center">
                Start Free Estimate
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-full border-2 border-[color:var(--border)] font-semibold hover:bg-[color:var(--muted)] active:scale-95 transition-all text-center">
                Learn More
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 pt-8 border-t border-[color:var(--border)]">
              <div>
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">Users Worldwide</p>
              </div>
              <div>
                <p className="text-2xl font-bold">4.8★</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold">2s</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">Avg. Analysis Time</p>
              </div>
            </div>
          </div>

          <div className="relative block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--muted)] rounded-3xl h-64 sm:h-80 md:h-96 flex items-center justify-center border border-[color:var(--border)]/50 shadow-2xl overflow-hidden">
              <AICarScanner />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--muted)]/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-[color:var(--muted-foreground)] max-w-2xl mx-auto">
              Three simple steps to get a professional estimate in less than a minute.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Camera, 
                title: "Upload Photos", 
                desc: "Capture clear images of the damage from multiple angles. Our AI works with any quality."
              },
              { 
                icon: ZapIcon, 
                title: "AI Analyzes", 
                desc: "Advanced computer vision examines every detail and assesses the extent of damage."
              },
              { 
                icon: DollarSign, 
                title: "Get Estimate", 
                desc: "Receive a detailed report with repair costs and part-by-part breakdown."
              },
            ].map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={step.title} 
                  className="group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  
                  <div className="relative bg-[color:var(--card)] border border-[color:var(--border)] rounded-2xl p-8 h-full hover:border-primary/40 transition-all">
                    <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:from-primary/30 group-hover:to-primary/20 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-[color:var(--muted-foreground)]">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why Choose InsureVision?</h2>
          <p className="text-lg text-[color:var(--muted-foreground)] max-w-2xl mx-auto">
            Built for precision, security, and speed. Here's what sets us apart.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: ZapIcon, title: "Lightning Fast", desc: "Get estimates in seconds, not hours. Analyze unlimited photos instantly." },
            { icon: Target, title: "95% Accurate", desc: "Advanced AI matches professional appraiser accuracy. Industry-leading precision." },
            { icon: Lock, title: "Bank-Grade Security", desc: "Military encryption. GDPR compliant. Your data is yours alone." },
            { icon: Smartphone, title: "Always Available", desc: "24/7 access from any device, anywhere. No appointments needed." },
            { icon: Lightbulb, title: "Detailed Reports", desc: "Part-by-part breakdown with severity indicators and repair timelines." },
            { icon: Trophy, title: "Trusted by Insurers", desc: "Use your estimate with 1000+ insurance companies worldwide." },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.title} className="group flex gap-4 p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40 hover:from-primary/20 hover:to-primary/10 transition-all shadow-sm hover:shadow-md hover:shadow-primary/20">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center group-hover:from-primary/40 group-hover:to-primary/30 transition-all shadow-lg shadow-primary/10 text-primary">
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-[color:var(--muted-foreground)]">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary from-0% via-primary via-50% to-primary to-100% rounded-3xl opacity-100"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40 rounded-3xl"></div>
        <div className="absolute inset-0 opacity-5 rounded-3xl">
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -top-40 -left-40"></div>
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -bottom-40 -right-40"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-3 gap-8 py-12 text-white text-center">
            {[
              { value: "50K+", label: "Active Users", sublabel: "Growing daily" },
              { value: "500K+", label: "Estimates Analyzed", sublabel: "In the past year" },
              { value: "4.8/5", label: "User Rating", sublabel: "Across all platforms" },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className="text-5xl sm:text-6xl font-bold mb-2 group-hover:scale-105 transition-transform drop-shadow-lg">{stat.value}</div>
                <p className="text-lg font-semibold opacity-100 drop-shadow-md">{stat.label}</p>
                <p className="text-sm opacity-90 drop-shadow-sm">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: "How accurate are the estimates?", a: "Our AI achieves 95% accuracy compared to professional appraisals. Photo quality matters – multiple angles and good lighting improve results." },
            { q: "How does the AI evaluate damage?", a: "We use advanced computer vision and machine learning trained on 100,000+ professional assessments. It identifies damaged areas, severity levels, and matches repair costs." },
            { q: "Is my data secure?", a: "Yes. We use military-grade AES-256 encryption for data in transit and at rest. We're GDPR and HIPAA compliant. Your images are never shared or used for training." },
            { q: "Can I use this estimate with my insurance?", a: "Absolutely. Our estimates are accepted by 1000+ insurance companies. You can download a detailed PDF report directly from the app." },
            { q: "What if I'm not satisfied?", a: "We offer a satisfaction guarantee. If the actual repair differs significantly from our estimate, we'll provide a full refund or reanalysis." },
          ].map((faq, idx) => (
            <details
              key={faq.q}
              className="group border border-[color:var(--border)] rounded-xl overflow-hidden hover:border-primary/30 transition-all"
            >
              <summary className="font-semibold text-base flex justify-between items-center p-5 cursor-pointer hover:bg-[color:var(--muted)]/30 transition bg-[color:var(--card)]">
                {faq.q}
                <span className="group-open:rotate-180 transition text-primary text-lg">▼</span>
              </summary>
              <div className="px-5 pb-5 border-t border-[color:var(--border)] bg-[color:var(--card)]/50 text-[color:var(--muted-foreground)]">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 bg-[color:var(--foreground)]">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute w-96 h-96 bg-primary rounded-full blur-3xl top-0 left-0"></div>
          <div className="absolute w-96 h-96 bg-primary rounded-full blur-3xl -bottom-40 -right-40"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[color:var(--background)]">Ready to Get Started?</h2>
          <p className="text-lg text-[color:var(--background)]/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users saving time and money on car damage estimates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-[color:var(--background)] font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Get Free Estimate
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-full border-2 border-[color:var(--background)]/30 text-[color:var(--background)] font-semibold hover:bg-[color:var(--background)]/10 active:scale-95 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[color:var(--border)] bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Features</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Pricing</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">About</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Blog</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Privacy</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Terms</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">Twitter</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-[color:var(--foreground)] transition">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[color:var(--border)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <InsureVisionLogo className="h-6 w-6" />
              <span className="font-bold">InsureVision AI</span>
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              © {new Date().getFullYear()} InsureVision AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
