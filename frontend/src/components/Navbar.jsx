import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Code2, LogOut, User as UserIcon, MessageSquare, Shield, ChevronDown,
  Users, FileText, BarChart3, Brain, FolderOpen, LayoutDashboard, Menu, X, Sun, Moon
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef(null);
  const adminRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); };

  useEffect(() => {
    const handleOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user?.role === 'admin';

  const NavLink = ({ to, label, icon: Icon, mobile }) => {
    const active = isActive(to);
    return (
      <Link to={to} className={`flex items-center gap-1.5 text-sm font-medium transition-colors relative ${
        mobile ? 'px-4 py-3 hover:bg-dark-800 w-full' : 'pb-0.5'
      } ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        {active && !mobile && <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-primary-500 rounded-full"></span>}
      </Link>
    );
  };

  // Primary links always visible
  const primaryLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderOpen },
    { to: '/teams', label: 'Teams', icon: Users },
  ];

  // Secondary links go in "More" dropdown on desktop
  const secondaryLinks = [
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/ai-logs', label: 'AI Logs', icon: Brain },
  ];

  return (
    <nav className="border-b border-dark-700 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className={`p-2 rounded-lg transition-all ${isAdmin
                ? 'bg-gradient-to-br from-yellow-500 to-amber-600 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                : 'bg-gradient-to-br from-primary-500 to-primary-600 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}>
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:inline">
                AICodeReview
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-5">
                {primaryLinks.map((l) => <NavLink key={l.to} {...l} />)}

                {/* More dropdown */}
                <div className="relative" ref={moreRef}>
                  <button onClick={() => setMoreOpen(!moreOpen)}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                      secondaryLinks.some((l) => isActive(l.to)) ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}>
                    More <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute top-full mt-3 left-0 w-48 glass-panel shadow-2xl overflow-hidden z-50">
                      {secondaryLinks.map((l) => (
                        <Link key={l.to} to={l.to} onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-dark-700/50 transition-colors ${
                            isActive(l.to) ? 'text-primary-400 bg-primary-500/5' : 'text-gray-300'
                          }`}>
                          <l.icon className="h-4 w-4" /> {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin dropdown */}
                {isAdmin && (
                  <div className="relative" ref={adminRef}>
                    <button onClick={() => setAdminOpen(!adminOpen)}
                      className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md transition-all ${
                        isActive('/admin')
                          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          : 'text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-400'
                      }`}>
                      <Shield className="h-3.5 w-3.5" /> Admin
                      <ChevronDown className={`h-3 w-3 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {adminOpen && (
                      <div className="absolute top-full mt-3 left-0 w-52 glass-panel shadow-2xl overflow-hidden z-50">
                        <div className="px-3 py-2 border-b border-dark-700">
                          <p className="text-[10px] uppercase text-yellow-500/60 font-semibold tracking-wider">Admin Controls</p>
                        </div>
                        {[
                          { to: '/admin', label: 'Platform Stats', icon: BarChart3, desc: 'Overview metrics' },
                          { to: '/admin?tab=users', label: 'Manage Users', icon: Users, desc: 'Roles & access' },
                          { to: '/admin?tab=reviews', label: 'Manage Reviews', icon: FileText, desc: 'All reviews' },
                        ].map((item) => (
                          <Link key={item.label} to={item.to} onClick={() => setAdminOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-dark-700/50 transition-colors group">
                            <div className="h-8 w-8 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                              <item.icon className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200">{item.label}</p>
                              <p className="text-[11px] text-gray-500">{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="hidden lg:block">
                  <SearchBar />
                </div>
                <Link to="/new-review" className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap shrink-0">
                  New Review
                </Link>
                <button 
                  onClick={toggleTheme} 
                  className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-2 ml-1 shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isAdmin
                      ? 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30'
                      : 'bg-primary-500/15 text-primary-400'
                  }`}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-sm font-medium text-gray-200 leading-tight">{user.name}</p>
                    <p className={`text-[10px] leading-tight font-medium ${isAdmin ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {isAdmin ? '★ Admin' : 'Member'}
                    </p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Sign out">
                  <LogOut className="h-5 w-5" />
                </button>

                {/* Mobile menu toggle */}
                <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="text-gray-300 hover:text-white transition-colors font-medium">Sign In</Link>
                <Link to="/auth" className="btn-primary">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-dark-700 bg-dark-900/95 backdrop-blur-md">
          {[...primaryLinks, ...secondaryLinks].map((l) => (
            <NavLink key={l.to} {...l} mobile />
          ))}
          {isAdmin && (
            <>
              <div className="h-px bg-dark-700 mx-4"></div>
              <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-yellow-400 hover:bg-dark-800">
                <Shield className="h-3.5 w-3.5" /> Admin Panel
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
