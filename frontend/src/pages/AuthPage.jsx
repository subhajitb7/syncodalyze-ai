import { useState, useContext } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react'; 
import GithubIcon from '../components/GithubIcon';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register(name, email, password);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else if (result.needsVerification) {
      navigate('/verify-otp', { state: { email: result.email || email } });
    } else if (result.requires2fa) {
      navigate('/verify-otp', { state: { email: result.email || email, type: '2fa' } });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 z-10 mt-10 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2 text-main">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-sec font-medium text-center mb-8">
          {isLogin ? 'Sign in to continue to Syncodalyze AI' : 'Get started with Syncodalyze AI today'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-sec">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="glass-input" placeholder="John Doe" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-sec">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="name@example.com" />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-bold text-sec">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="glass-input" placeholder="••••••••" />
            {!isLogin && password && (
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: '6-8 Chars', met: password.length >= 6 && password.length <= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(password) },
                  { label: 'Lowercase', met: /[a-z]/.test(password) },
                  { label: 'Number', met: /\d/.test(password) },
                  { label: 'Symbol (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
                ].map((req) => (
                  <span 
                    key={req.label} 
                    className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border transition-colors ${
                      req.met 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                        : 'bg-red-500/5 text-red-500/40 border-red-500/10'
                    }`}
                  >
                    {req.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isLogin && (
            <div className="text-right -mt-2">
              <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                Forgot Password?
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/.test(password))} 
            className="btn-primary mt-2 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary-500/10"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-col"></div></div>
          <span className="relative px-4 text-xs font-bold text-sec uppercase bg-sec tracking-widest rounded-full border border-col">OR</span>
        </div>

        <a 
          href="http://localhost:5001/api/auth/github" 
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-col bg-ter hover:bg-sec hover:border-text-main transition-all font-bold text-main group shadow-sm"
        >
          <GithubIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span>Continue with GitHub</span>
        </a>

        <div className="mt-6 text-center text-sm text-sec font-medium">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="ml-2 text-primary-600 hover:text-primary-700 transition-colors font-bold border-b border-transparent hover:border-primary-700">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
