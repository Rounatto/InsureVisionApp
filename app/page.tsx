import Link from "next/link";
import InsureVisionLogo from "@/components/InsureVisionLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* ─── Navigation ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[color:var(--foreground)] backdrop-blur-lg border-b border-[color:var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <InsureVisionLogo className="h-7 w-7 text-[color:var(--background)]" />
            <span className="font-bold text-xl hidden sm:inline text-[color:var(--background)]">
              InsureVision AI
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-[color:var(--background)] hover:opacity-80 transition text-sm font-medium">
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-semibold">
              Sign Up
            </Link>
            <div className="text-[color:var(--background)]">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Estimate your car damage in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                seconds
              </span>
            </h1>
            <p className="text-lg text-[color:var(--muted-foreground)] mb-8 leading-relaxed">
              Use artificial intelligence to get an accurate estimate of repair costs. Simply photograph the damage and receive a complete report.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-center">
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-lg border-2 border-[color:var(--border)] font-semibold hover:bg-[color:var(--muted)] transition text-center">
                Learn More
              </a>
            </div>
          </div>

          <div className="bg-[color:var(--muted)] rounded-2xl h-96 flex items-center justify-center border border-[color:var(--border)]">
            <p className="text-6xl">📱</p>
          </div>
        </div>
      </section>
      {/* ─── How it Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[color:var(--muted)] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How does it work?</h2>
          <p className="text-center text-[color:var(--muted-foreground)] mb-16 max-w-2xl mx-auto">
            Three simple steps to get a reliable estimate in less than a minute.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "📸", title: "Take a Photo", desc: "Photograph the damage to your vehicle from different angles for a complete analysis." },
              { icon: "🤖", title: "AI Analyzes", desc: "Our artificial intelligence examines the images and evaluates the extent of the damage in depth." },
              { icon: "💰", title: "Get an Estimate", desc: "Receive a detailed report with the estimated repair cost and affected parts." },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-20 h-20 mx-auto bg-[color:var(--background)] rounded-full flex items-center justify-center mb-6 text-4xl border border-[color:var(--border)]">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-[color:var(--muted-foreground)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Why choose InsureVision?</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: "⚡", title: "Fast", desc: "Get an estimate in less than a minute without having to visit a garage.", color: "blue" },
            { icon: "🎯", title: "Accurate", desc: "Thanks to advanced AI, our estimates have exceptional accuracy compared to traditional methods.", color: "purple" },
            { icon: "🔒", title: "Secure", desc: "Your data is encrypted and protected. No sharing without your consent.", color: "green" },
            { icon: "📱", title: "Available 24/7", desc: "Available on all devices, anytime, anywhere for your insurance needs.", color: "orange" },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-[color:var(--muted)] flex items-center justify-center">
                  <span className="text-2xl">{item.icon}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[color:var(--muted-foreground)] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-white text-center">
            {[
              { value: "50K+", label: "Satisfied Users" },
              { value: "100K+", label: "Estimated Claims" },
              { value: "4.8/5", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-bold mb-2">{stat.value}</div>
                <p className="text-lg opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {[
            { q: "What is InsureVision?", a: "InsureVision is an artificial intelligence application that analyzes photos of car damage and provides an accurate estimate of repair costs in seconds." },
            { q: "How does the AI evaluate damage?", a: "Our AI uses computer vision and machine learning to analyze images. It identifies damaged areas, assesses severity, and estimates costs based on a repair database." },
            { q: "Is my data secure?", a: "Yes, your data is encrypted in transit and at rest. We comply with GDPR standards and never share your information without explicit consent." },
            { q: "How accurate are the estimates?", a: "Our estimates have an average accuracy of 95% compared to professional quotes. Photo quality affects accuracy, so multiple angles help." },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group border border-[color:var(--border)] rounded-xl p-5 cursor-pointer hover:bg-[color:var(--muted)] transition"
            >
              <summary className="font-bold text-base flex justify-between items-center">
                {faq.q}
                <span className="group-open:rotate-180 transition text-[color:var(--muted-foreground)]">⌄</span>
              </summary>
              <p className="text-[color:var(--muted-foreground)] mt-4 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[color:var(--foreground)] text-[color:var(--background)] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg opacity-80 mb-8">
            Create your account now and get your first estimate for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Sign Up for Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg border-2 border-[color:var(--background)] font-semibold hover:bg-[color:var(--background)] hover:text-[color:var(--foreground)] transition"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[color:var(--border)] bg-[color:var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:opacity-70 transition">About Us</a></li>
                <li><a href="#" className="hover:opacity-70 transition">Blog</a></li>
                <li><a href="#" className="hover:opacity-70 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:opacity-70 transition">Help Center</a></li>
                <li><a href="#" className="hover:opacity-70 transition">Contact</a></li>
                <li><a href="#" className="hover:opacity-70 transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:opacity-70 transition">Privacy</a></li>
                <li><a href="#" className="hover:opacity-70 transition">Terms</a></li>
                <li><a href="#" className="hover:opacity-70 transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><a href="#" className="hover:opacity-70 transition">Twitter</a></li>
                <li><a href="#" className="hover:opacity-70 transition">LinkedIn</a></li>
                <li><a href="#" className="hover:opacity-70 transition">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[color:var(--border)] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <InsureVisionLogo className="h-5 w-5" />
              <span className="text-sm font-bold">InsureVision AI</span>
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
