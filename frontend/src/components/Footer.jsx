import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-col bg-sec p-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs">
        <div className="flex items-center gap-4">
          <p className="text-sec font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Syncodalyze AI</p>
          <span className="h-1 w-1 bg-col rounded-full hidden sm:block"></span>
          <p className="text-sec font-medium">Built with <Heart className="h-3 w-3 inline text-rose-500 animate-pulse" /> for Developers</p>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sec hover:text-primary-500 font-black uppercase tracking-tighter transition-colors">Privacy</a>
          <a href="#" className="text-sec hover:text-primary-500 font-black uppercase tracking-tighter transition-colors">Terms</a>
          <a href="#" className="text-sec hover:text-primary-500 font-black uppercase tracking-tighter transition-colors">Docs</a>
          <div className="flex items-center gap-2 px-3 py-1 bg-ter border border-col rounded-full">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
             <p className="text-[9px] font-black text-main uppercase tracking-widest">System Operational</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
