import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
  }, [user, navigate, location]);

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-indigo-600 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Ba MiFoMa</h1>
        <button><Menu /></button>
      </header>

      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:relative md:w-64 md:border-r md:border-t-0 md:h-screen flex md:flex-col justify-around md:justify-start p-2 md:p-4 z-10">
        <div className="hidden md:block mb-8 px-4">
          <h1 className="text-2xl font-bold text-indigo-600">Ba MiFoMa</h1>
        </div>
        
        <Link to="/" className={`flex flex-col md:flex-row items-center p-2 md:p-3 rounded-lg hover:bg-gray-100 ${location.pathname === '/' ? 'text-indigo-600 md:bg-indigo-50' : 'text-gray-600'}`}>
          <Home className="w-6 h-6 md:mr-3" />
          <span className="text-xs md:text-base mt-1 md:mt-0">Home</span>
        </Link>
        <Link to="/chat" className={`flex flex-col md:flex-row items-center p-2 md:p-3 rounded-lg hover:bg-gray-100 ${location.pathname.startsWith('/chat') ? 'text-indigo-600 md:bg-indigo-50' : 'text-gray-600'}`}>
          <MessageSquare className="w-6 h-6 md:mr-3" />
          <span className="text-xs md:text-base mt-1 md:mt-0">Chat</span>
        </Link>
        <Link to={`/profile/${user.id}`} className={`flex flex-col md:flex-row items-center p-2 md:p-3 rounded-lg hover:bg-gray-100 ${location.pathname.startsWith('/profile') ? 'text-indigo-600 md:bg-indigo-50' : 'text-gray-600'}`}>
          <UserIcon className="w-6 h-6 md:mr-3" />
          <span className="text-xs md:text-base mt-1 md:mt-0">Profile</span>
        </Link>

        <button onClick={() => logout()} className="flex flex-col md:flex-row items-center p-2 md:p-3 rounded-lg text-gray-600 hover:bg-gray-100 md:mt-auto">
          <LogOut className="w-6 h-6 md:mr-3" />
          <span className="text-xs md:text-base mt-1 md:mt-0">Logout</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
