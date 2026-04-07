import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="glass-panel w-full max-w-md p-8 z-10">
        <div className="h-14 w-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="h-7 w-7 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-2">Forgot Password?</h2>
        <p className="text-gray-400 text-center mb-8">
          Enter your email and we'll send you a reset code.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input"
              placeholder="name@example.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <Link to="/auth" className="mt-6 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 justify-center">
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
