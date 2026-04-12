import { ShieldCheck, Heart, Terminal, Cpu } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-col bg-main py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Left Side: Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-main uppercase tracking-[0.2em] opacity-40">
              © {new Date().getFullYear()} Syncodalyze AI
            </span>
            <div className="h-1 w-1 bg-col rounded-full opacity-30"></div>
            <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest opacity-60">
              Personalized Cloud Edition
            </span>
          </div>
        </div>

        {/* Center/Right: System Meta */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-primary-500/5 border border-primary-500/10 rounded-full">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span className="text-[9px] font-black text-sec uppercase tracking-widest">
              End-to-End Encrypted Session
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-bold text-sec">
            <a href="#" className="hover:text-primary-500 transition-colors uppercase tracking-tighter">Documentation</a>
            <a href="#" className="hover:text-primary-500 transition-colors uppercase tracking-tighter">Support</a>
          </div>

          <div className="h-4 w-px bg-col hidden sm:block"></div>

          <div className="flex items-center gap-2 group cursor-default">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-main uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
              Platform Stable
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
