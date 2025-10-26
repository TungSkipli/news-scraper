import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-base-300 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-primary">
            NewsHub
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary font-semibold' : ''}`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/news" 
              className={`hover:text-primary transition-colors ${location.pathname === '/news' ? 'text-primary font-semibold' : ''}`}
            >
              Tin tức
            </Link>
            <Link 
              to="/scraper" 
              className={`hover:text-primary transition-colors ${location.pathname === '/scraper' ? 'text-primary font-semibold' : ''}`}
            >
              Scraper
            </Link>
          </nav>

          <div className="md:hidden">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-3">
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/news">Tin tức</Link></li>
                <li><Link to="/scraper">Scraper</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navigation;
