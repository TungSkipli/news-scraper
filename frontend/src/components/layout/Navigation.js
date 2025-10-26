import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllSources } from '../../services/sourceService';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const searchParams = new URLSearchParams(location.search);
  const currentTag = searchParams.get('tag');
  const currentSourceId = searchParams.get('source_id');

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (currentSourceId && sources.length > 0) {
      const source = sources.find(s => s.id === currentSourceId);
      setSelectedSource(source || null);
    } else {
      setSelectedSource(null);
    }
  }, [currentSourceId, sources]);

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
    setMobileMenuOpen(false);
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
      subcategories: [
        { name: 'All', tag: '' },
        { name: 'Technology', tag: 'technology' },
        { name: 'Science', tag: 'science' },
        { name: 'Business', tag: 'business' },
        { name: 'Entertainment', tag: 'entertainment' },
      ]
    },
    {
      title: 'World',
      path: '/news',
      defaultTag: 'world',
      subcategories: [
        { name: 'International', tag: 'international' },
        { name: 'Asia', tag: 'asia' },
        { name: 'Europe', tag: 'europe' },
        { name: 'America', tag: 'america' },
      ]
    },
    {
      title: 'Technology',
      path: '/news',
      defaultTag: 'technology',
      subcategories: [
        { name: 'AI & Machine Learning', tag: 'ai' },
        { name: 'Mobile', tag: 'mobile' },
        { name: 'Computer', tag: 'computer' },
        { name: 'Internet', tag: 'internet' },
      ]
    },
    {
      title: 'Scraper',
      path: '/scraper',
      subcategories: []
    }
  ];

  const handleSubcategoryClick = (path, tag) => {
    if (tag) {
      navigate(`${path}?tag=${tag}`);
    } else {
      navigate(path);
    }
  };

  const isActive = (category) => {
    if (location.pathname !== category.path) return false;
    
    if (category.subcategories.length === 0) {
      return true;
    }
    
    if (category.defaultTag) {
      return currentTag === category.defaultTag;
    }
    
    return !currentTag || currentTag === '';
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
              <div key={index} className="relative group h-full flex items-center">
                <Link
                  to={category.defaultTag ? `${category.path}?tag=${category.defaultTag}` : category.path}
                  className={`px-4 h-full flex items-center text-[13px] hover:text-[#9f224e] transition-colors border-b-2 ${
                    isActive(category)
                      ? 'text-[#9f224e] border-[#9f224e] font-semibold' 
                      : 'border-transparent'
                  }`}
                >
                  {category.title}
                </Link>
                
                {category.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-lg min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {category.subcategories.map((sub, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleSubcategoryClick(category.path, sub.tag)}
                        className="block w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#9f224e] transition-colors"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div key={index} className="border-b border-gray-100">
                <Link
                  to={category.defaultTag ? `${category.path}?tag=${category.defaultTag}` : category.path}
                  className={`block px-4 py-3 text-sm hover:bg-gray-50 ${
                    isActive(category) ? 'text-[#9f224e] font-semibold bg-gray-50' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.title}
                </Link>
                {category.subcategories.length > 0 && (
                  <div className="bg-gray-50 pl-8">
                    {category.subcategories.map((sub, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => {
                          handleSubcategoryClick(category.path, sub.tag);
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs text-gray-600 hover:text-[#9f224e]"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navigation;
