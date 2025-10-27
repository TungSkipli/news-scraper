import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllSources } from '../../services/sourceService';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sources, setSources] = useState([]);
  
  const searchParams = new URLSearchParams(location.search);
  const currentSourceId = searchParams.get('source_id');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await getAllSources();
      if (response.success && response.data) {
        setSources(response.data);
      }
    } catch (error) {
    }
  };

  const handleSourceChange = (sourceId) => {
    if (sourceId) {
      navigate(`/?source_id=${sourceId}`);
    } else {
      navigate('/');
    }
  };

  const categories = [
    {
      title: 'Home',
      path: '/',
      subcategories: []
    },
    {
      title: 'News',
      path: '/news',
      subcategories: []
    },
    {
      title: 'Scraper',
      path: '/scraper',
      subcategories: []
    }
  ];

  const isActive = (category) => {
    return location.pathname === category.path;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1130px] mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-[26px] font-bold text-[#9f224e] tracking-tight">
            NewsHub
          </Link>

          {/* Source Filter Dropdown */}
          <div className="hidden md:block mx-4">
            <select 
              value={currentSourceId || ''} 
              onChange={(e) => handleSourceChange(e.target.value)}
              className="select select-bordered select-sm text-[13px] w-[180px] border-gray-300 focus:border-[#9f224e] focus:outline-none"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          
          <nav className="hidden md:flex items-center h-full">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.path}
                className={`px-4 h-full flex items-center text-[13px] hover:text-[#9f224e] transition-colors border-b-2 ${
                  isActive(category)
                    ? 'text-[#9f224e] border-[#9f224e] font-semibold' 
                    : 'border-transparent'
                }`}
              >
                {category.title}
              </Link>
            ))}
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.path}
                className={`block px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 ${
                  isActive(category) ? 'text-[#9f224e] font-semibold bg-gray-50' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navigation;
