import { Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="text-center z-10 max-w-4xl max-auto mt-10 sm:mt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dark-600 bg-dark-800/50 backdrop-blur-md mb-8">
          <Sparkles className="h-4 w-4 text-primary-400" />
          <span className="text-sm text-gray-300">Powered by advanced AI models</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Code reviews, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-purple-400">
            supercharged by AI
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Automate your code review process. Detect vulnerabilities, squash bugs, and receive intelligent suggestions in real-time.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
            Start Reviewing Now
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="btn-secondary text-lg px-8 py-4">
            Learn More
          </a>
        </div>
      </div>

      {/* Feature Section */}
      <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mt-32 z-10">
        <div className="glass-panel p-8 text-left hover:border-primary-500/50 transition-colors">
          <div className="h-12 w-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
            <Zap className="h-6 w-6 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Feedback</h3>
          <p className="text-gray-400 leading-relaxed">
            Get lightning-fast code analysis directly in your browser. No complex CI/CD setup required for the MVP.
          </p>
        </div>
        <div className="glass-panel p-8 text-left hover:border-purple-500/50 transition-colors">
          <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">AI Suggestions</h3>
          <p className="text-gray-400 leading-relaxed">
            Our AI not only finds bugs but suggests optimal rewrites to improve performance and readability.
          </p>
        </div>
        <div className="glass-panel p-8 text-left hover:border-emerald-500/50 transition-colors">
          <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Security First</h3>
          <p className="text-gray-400 leading-relaxed">
            Detect common vulnerabilities before they make it to production. Ensure your codebase remains secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
