import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import {
  LogOut, User as UserIcon, Shield, ChevronDown,
  Users, FolderOpen, LayoutDashboard, Menu, X, 
  Sun, Moon, History, Settings
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user?.role === 'admin';

  const NavLink = ({ to, label, icon: Icon, mobile }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 text-[10px] sm:text-[11px] font-black transition-all relative whitespace-nowrap tracking-[0.2em] uppercase ${
          mobile ? 'px-8 py-5 hover:bg-sec/10 border-b border-col/30' : 'px-4 py-2'
        } ${active ? 'text-primary-500' : 'text-sec hover:text-main'}`}
      >
        {label}
        {active && !mobile && (
          <motion.div 
            layoutId="nav-line"
            className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary-500"
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          />
        )}
      </Link>
    );
  };

  const navLinks = [
    { to: '/dashboard', label: 'Monitor' },
    { to: '/projects', label: 'Projects' },
    { to: '/teams', label: 'Teams' },
    { to: '/reviews', label: 'Insights' },
  ];

  return (
    <>
      <nav className="border-b border-col bg-main/90 backdrop-blur-2xl fixed top-0 left-0 right-0 z-[100] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 md:h-16">
            
            {/* Left: Logo Section */}
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                   <img src="/premium_logo_v2.png" alt="S" className="h-5 w-5 brightness-0 invert" 
                        onError={(e) => { e.target.src = "/logo.png"; }} />
                </div>
                <span className="text-lg lg:text-xl font-black tracking-tighter text-main uppercase">
                  Syncodalyze <span className="text-primary-500">AI</span>
                </span>
              </Link>
            </div>

            {/* Center: Navigation Links (Desktop) */}
            {user && (
              <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2">
                  {navLinks.map((link) => <NavLink key={link.to} {...link} />)}
                </div>
              </div>
            )}

            {/* Right: Actions Section */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-sec hover:text-main transition-colors"
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>

                  <div className="relative ml-2" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 group"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                        isAdmin 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-primary-500 text-white'
                      } group-hover:scale-105 transition-transform shadow-md border border-white/10`}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className={`h-3 w-3 text-sec transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full mt-4 right-0 w-56 glass-panel shadow-2xl p-1 border-col overflow-hidden"
                        >
                          <div className="p-4 border-b border-col mb-1 bg-ter/30 rounded-xl">
                             <p className="text-[10px] font-black text-sec uppercase tracking-widest opacity-50 mb-0.5">Session Operator</p>
                             <p className="text-xs font-black text-main truncate tracking-tight">{user.name}</p>
                          </div>
                          
                          <div className="p-1">
                            <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-sec hover:text-main hover:bg-primary-500/5 rounded-lg transition-all uppercase tracking-widest">
                              <Settings className="h-3.5 w-3.5" /> Account Settings
                            </Link>
                            {isAdmin && (
                              <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-yellow-600 hover:bg-yellow-500/5 rounded-lg transition-all uppercase tracking-widest">
                                <Shield className="h-3.5 w-3.5" /> Admin Console
                              </Link>
                            )}
                            <div className="h-px bg-col mx-2 my-1"></div>
                            <button onClick={() => { setShowLogoutConfirm(true); setUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all uppercase tracking-widest text-left">
                              <LogOut className="h-3.5 w-3.5" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-sec hover:text-main ml-1">
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Link to="/auth" className="text-[11px] font-black uppercase text-sec hover:text-main tracking-widest transition-colors">Sign In</Link>
                  <Link to="/auth" className="bg-primary-500 text-white px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary-500/10 hover:bg-primary-600 transition-all">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {user && mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-main border-b border-col overflow-hidden"
            >
              <div className="flex flex-col">
                {navLinks.map((link) => <NavLink key={link.to} {...link} mobile />)}
                <div className="p-8 flex flex-col gap-4">
                   <Link to="/profile" className="text-[10px] font-black text-sec uppercase tracking-widest flex items-center gap-3"><Settings className="h-4 w-4" /> Profile</Link>
                   <button onClick={() => setShowLogoutConfirm(true)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-3 text-left"><LogOut className="h-4 w-4" /> Sign Out</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-sm p-10 text-center border-col shadow-2xl"
            >
              <h2 className="text-xl font-black text-main tracking-tight mb-2 uppercase tracking-wide">End Session?</h2>
              <p className="text-sec font-medium mb-8 text-xs leading-relaxed max-w-[240px] mx-auto">Are you sure you want to terminate your current node connection?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary h-10 text-[10px] font-black uppercase tracking-widest">Abort</button>
                <button onClick={handleLogout} className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg h-10 text-[10px] font-black uppercase tracking-widest transition-all">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
