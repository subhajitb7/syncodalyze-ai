import { Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Code2, 
  Terminal, 
  Cpu, 
  Globe, 
  Layers, 
  MessageSquare,
  GitBranch,
  CheckCircle2,
  Search
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const features = [
    {
      title: "AI Logic Auditor",
      desc: "Deep structural analysis of your logic, not just syntax. Detect race conditions and memory leaks before they hit stage.",
      icon: <Cpu className="h-6 w-6 text-primary-500" />,
      color: "blue"
    },
    {
      title: "VulnShield Security",
      desc: "Automated security auditing for OWASP Top 10 vulnerabilities. Real-time scanning for SQL injection and XSS.",
      icon: <ShieldCheck className="h-6 w-6 text-purple-500" />,
      color: "purple"
    },
    {
      title: "Real-time Collaboration",
      desc: "Synchronous peer reviews powered by Socket.io. See comments and edits as they happen with zero latency.",
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      color: "amber"
    },
    {
      title: "Contextual AI Chat",
      desc: "An integrated coding assistant that understands your entire project context. Ask 'How do I optimize this?' and get answers.",
      icon: <MessageSquare className="h-6 w-6 text-emerald-500" />,
      color: "emerald"
    },
    {
      title: "Universal Repo Sync",
      desc: "Seamless integration with GitHub and GitLab. Pull your entire codebase for comprehensive cross-file architectural reviews.",
      icon: <GitBranch className="h-6 w-6 text-rose-500" />,
      color: "rose"
    },
    {
      title: "Developer Analytics",
      desc: "Track your engineering velocity and code health trends over time with high-fidelity charts and automated reports.",
      icon: <Layers className="h-6 w-6 text-indigo-500" />,
      color: "indigo"
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center bg-main relative overflow-x-hidden pt-20">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-600/5 rounded-full blur-[150px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 max-w-5xl px-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5 backdrop-blur-md mb-8 shadow-inner animate-in fade-in zoom-in duration-1000">
          <Sparkles className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary-500 font-black">Syncodalyze AI — Built for the Modern Engineer</span>
        </div>

        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-main">
          Ship better code, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 via-purple-500 to-emerald-500 drop-shadow-sm px-2">
            faster than ever.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-sec mb-12 max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
          The all-in-one AI platform for automated code reviews, security auditing, and real-time engineering collaboration.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
          <Link to="/auth" className="h-14 px-10 rounded-xl bg-primary-600 hover:bg-primary-500 text-white flex items-center gap-3 group transition-all font-black tracking-widest text-[11px] uppercase shadow-[0_15px_40px_rgba(37,99,235,0.3)]">
            Launch Your First Review <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="h-14 px-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-black tracking-widest text-[11px] uppercase text-white/60 hover:text-white flex items-center justify-center">
            Explore Capabilities
          </a>
        </div>
      </motion.div>

      {/* Social Proof Placeholder */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="w-full max-w-6xl px-6 mb-32 z-10"
      >
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700 pb-16 border-b border-col/30">
           <div className="flex items-center gap-2 font-black text-xl">
             <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.003-.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
             GITHUB
           </div>
           <div className="flex items-center gap-2 font-black text-xl"><Terminal className="h-6 w-6" /> LINUX</div>
           <div className="flex items-center gap-2 font-black text-xl"><Code2 className="h-6 w-6" /> VERCEL</div>
           <div className="flex items-center gap-2 font-black text-xl"><Globe className="h-6 w-6" /> AWS</div>
        </div>
      </motion.div>

      {/* Target Analysis Terminal (Transition Asset) */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="w-full max-w-5xl px-6 relative mb-48 group z-10"
      >
         <div className="absolute -inset-20 bg-primary-600/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary-600/10 transition-colors"></div>
         <div className="glass-panel p-2 border-col/60 shadow-2xl relative overflow-hidden">
            <div className="bg-main/80 backdrop-blur-3xl rounded-xl border border-col p-8 sm:p-12 pb-16 text-left relative overflow-hidden">
               {/* Header Badges */}
               <div className="flex justify-between items-center mb-12 border-b border-col pb-8">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-ter/80 rounded-lg flex items-center justify-center border border-col text-primary-500 shadow-inner">
                        <Terminal className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-sec uppercase tracking-[0.3em] mb-1 opacity-50">Target Analysis</p>
                        <p className="text-xs font-bold text-main tracking-tight">Logic_Validator_v4.js</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="px-4 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest shadow-sm">Integrity: 100%</div>
                     <div className="px-4 py-1.5 rounded bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[9px] font-black uppercase tracking-widest shadow-sm">Nodes Active</div>
                  </div>
               </div>

               {/* Terminal Content */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-mono text-sm leading-relaxed relative">
                  {/* Code Panel (Static & Professional) */}
                  <div className="space-y-4 relative z-10">
                     {[
                       { line: "01", type: "comment", content: "# Initialize Structural Audit" },
                       { line: "02", type: "keyword", content: "async function", main: "AuditNode", other: "(cluster) {" },
                       { line: "03", type: "indent", content: "const", main: "result", other: "= await scan(cluster);" },
                       { line: "04", type: "indent", content: "if", main: "(result.vulnerabilities)", other: "{" },
                       { line: "05", type: "indent2", content: "triggerIsolation(cluster);" },
                       { line: "06", type: "indent", content: "}" },
                       { line: "07", type: "base", content: "}" }
                     ].map((l, i) => (
                       <div key={i} className="flex gap-6 relative group/line">
                          <span className="opacity-20 text-[10px] w-4">{l.line}</span>
                          <div>
                             {l.type === "comment" && <span className="text-primary-500 italic">{l.content}</span>}
                             {l.type === "keyword" && <><span className="text-emerald-500">{l.content}</span> <span className="text-main">{l.main}</span> <span className="opacity-40">{l.other}</span></>}
                             {l.type === "indent" && <>&nbsp;&nbsp;<span className="text-amber-500">{l.content}</span> <span className="text-main">{l.main}</span> <span className="opacity-40">{l.other}</span></>}
                             {l.type === "indent2" && <>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-main">{l.content}</span></>}
                             {l.type === "base" && <span className="opacity-40">{l.content}</span>}
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="relative pb-6">
                     <div className="absolute -left-6 top-0 bottom-0 w-px bg-col/30"></div>
                     <div className="space-y-6">
                        {/* AI Visual Processor Box */}
                        <div className="p-1 whitespace-nowrap bg-black border border-col rounded-2xl relative overflow-hidden shadow-2xl min-h-[200px]">
                            {/* Internal Code Scanning Animation (Seamless Infinite Marquee) */}
                            <div className="absolute inset-0 font-mono text-[8px] p-6 leading-[1.4] z-0 pt-14 flex flex-col">
                               <motion.div 
                                 animate={{ y: ["0%", "-50%"] }}
                                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                 className="text-emerald-500/80"
                               >
                                  {/* Render two sets of lines for infinite loop */}
                                  {[...Array(60)].map((_, i) => (
                                    <div key={i} className="flex gap-4">
                                       <span className="opacity-20">{`0x${(i*16).toString(16).toUpperCase()}`}</span>
                                       <span className={i % 5 === 0 ? "text-primary-400 font-bold" : "text-emerald-400"}>
                                          {i % 5 === 0 ? `>> VULNERABILITY_DETECTED_0x${(i*4).toString(16).toUpperCase()}` : 
                                           i % 7 === 0 ? `>> LOGIC_OPTIMIZED_SUCCESS` : 
                                           `>> SCANNING_WORKSPACE_BLOCK_${i}`}
                                       </span>
                                    </div>
                                  ))}
                                  {/* Identical second set for seamless wrap-around */}
                                  {[...Array(60)].map((_, i) => (
                                    <div key={`dup-${i}`} className="flex gap-4 border-t border-transparent">
                                       <span className="opacity-20">{`0x${(i*16).toString(16).toUpperCase()}`}</span>
                                       <span className={i % 5 === 0 ? "text-primary-400 font-bold" : "text-emerald-400"}>
                                          {i % 5 === 0 ? `>> VULNERABILITY_DETECTED_0x${(i*4).toString(16).toUpperCase()}` : 
                                           i % 7 === 0 ? `>> LOGIC_OPTIMIZED_SUCCESS` : 
                                           `>> SCANNING_WORKSPACE_BLOCK_${i}`}
                                       </span>
                                    </div>
                                  ))}
                               </motion.div>
                            </div>

                            {/* Internal Laser Line (Intense High Visibility) */}
                            <motion.div 
                              animate={{ top: ["-5%", "105%"] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 w-full h-[2px] bg-emerald-400 z-10 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                            />

                           {/* Fixed Header Overlay */}
                           <div className="absolute top-0 left-0 right-0 z-20 px-6 py-3.5 bg-black border-b border-col pointer-events-none">
                              <div className="flex items-center gap-3">
                                 <motion.div 
                                   animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                   transition={{ duration: 0.8, repeat: Infinity }}
                                   className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                                 />
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Active Logical Sweep</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-sec opacity-30 animate-pulse mt-8">
                           <Zap className="h-3 w-3" /> System heartbeat: 4ms latency peak
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </motion.div>

      {/* Feature Grid */}
      <div id="features" className="w-full max-w-7xl px-6 mb-40 z-10">
        <div className="text-center mb-20">
           <h2 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-4">Core Intelligence</h2>
           <h3 className="text-4xl sm:text-5xl font-black text-main tracking-tight">Everything you need to scale <br/> code quality.</h3>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="glass-panel p-10 group hover:border-primary-500/40 transition-all duration-500 cursor-default relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-all"></div>
              
              <div className="h-14 w-14 bg-ter/50 rounded-2xl flex items-center justify-center mb-8 border border-col group-hover:scale-110 group-hover:border-primary-500/20 transition-all duration-500">
                {feature.icon}
              </div>
              
              <h4 className="text-xl font-bold mb-4 text-main">{feature.title}</h4>
              <p className="text-sec text-sm leading-relaxed font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* How it Works */}
      <div className="w-full max-w-6xl px-6 mb-48 z-10 relative">
        <div className="absolute inset-0 bg-primary-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="glass-panel p-12 sm:p-20 relative overflow-hidden">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mb-6">Workflow Optimization</h2>
                 <h3 className="text-4xl font-black text-main tracking-tight mb-8">From code to production <br/> in 3 simple steps.</h3>
                 
                 <div className="space-y-8">
                    {[
                      { step: "01", title: "Connect Workspace", desc: "Paste code directly or connect your Git repositories via OAuth." },
                      { step: "02", title: "AI Analysis", desc: "Our engine audits your logic, security, and architectural patterns." },
                      { step: "03", title: "Scale Velocity", desc: "Apply suggestions, squash bugs, and ship with extreme confidence." }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-6 items-start">
                         <span className="text-2xl font-black text-primary-500/40 font-mono tracking-tighter">{step.step}</span>
                         <div>
                            <h5 className="font-bold text-main mb-1">{step.title}</h5>
                            <p className="text-sm text-sec font-medium opacity-70">{step.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="hidden lg:block relative">
                 <div className="relative rounded-2xl border border-col bg-main p-4 shadow-2xl skew-x-[-1deg] skew-y-[2deg] rotate-1">
                    <div className="flex gap-1.5 mb-4 px-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                    </div>
                    <div className="font-mono text-[10px] text-sec/60 space-y-2 leading-tight">
                       <div className="flex gap-4"><span className="opacity-30">1</span> <span className="text-emerald-500">const</span> analyze = async () =&gt; &#123;</div>
                       <div className="flex gap-4"><span className="opacity-30">2</span> &nbsp;&nbsp;<span className="text-purple-500">await</span> ai.audit(code);</div>
                       <div className="flex gap-4"><span className="opacity-30">3</span> &nbsp;&nbsp;<span className="text-amber-500">if</span> (vulnsFound) &#123;</div>
                       <div className="flex gap-4"><span className="opacity-30">4</span> &nbsp;&nbsp;&nbsp;&nbsp;suggestFix();</div>
                       <div className="flex gap-4"><span className="opacity-30">5</span> &nbsp;&nbsp;&#125;</div>
                       <div className="flex gap-4"><span className="opacity-30">6</span> &#125;;</div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 glass-panel p-4 animate-bounce duration-[3s]">
                       <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking_widest">
                          <CheckCircle2 className="h-4 w-4" /> Logic Audited
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-4xl px-6 mb-40 z-10 text-center">
         <h3 className="text-4xl sm:text-5xl font-black text-main tracking-tight mb-8">Ready to supercharge your <br/> codebase?</h3>
         <p className="text-sec font-medium mb-12 opacity-70 max-w-xl mx-auto">Join the next generation of engineers using Syncodalyze AI to audit logic and secure applications.</p>
         <Link to="/auth" className="btn-primary text-lg px-12 py-5 inline-flex items-center gap-3 group shadow-2xl shadow-primary-500/30">
            Get Started Free <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-col bg-sec/10 backdrop-blur-xl z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter text-main">Syncodalyze <span className="text-primary-500">AI</span></h2>
            <p className="text-sm text-sec font-medium leading-relaxed opacity-70">
              Transforming code reviews with high-fidelity AI analysis and real-time security insights for modern engineering teams.
            </p>
            <div className="flex gap-4">
              {[GitBranch, Globe, Terminal].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-xl bg-ter flex items-center justify-center text-sec hover:text-primary-500 hover:scale-110 transition-all border border-col">
                  {i === 0 ? <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.003-.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg> : <Icon className="h-5 w-5" />}
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Product", links: ["AI Auditor", "Security Shield", "Team Hub", "API"] },
            { title: "Resources", links: ["Docs", "Changelog", "Roadmap", "Community"] },
            { title: "Company", links: ["About", "Privacy", "Terms", "Support"] }
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-main opacity-50">{col.title}</h4>
              <ul className="space-y-4 text-sm text-sec font-bold">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="hover:text-primary-500 transition-colors uppercase tracking-tight text-[11px]">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-col/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-sec font-black uppercase tracking-widest opacity-40">
            © 2026 Syncodalyze AI Platform. All rights reserved.
          </p>
          <div className="flex gap-8 text-[10px] text-sec font-black uppercase tracking-[0.2em] opacity-30">
             <span>Security First</span>
             <span>Privacy Guaranteed</span>
             <span>Engineering Velocity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
