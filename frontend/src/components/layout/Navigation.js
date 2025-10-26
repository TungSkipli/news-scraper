import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const currentTag = searchParams.get('tag');

  const categories = [
    {
      title: 'Trang chủ',
      path: '/',
      subcategories: []
    },
    {
      title: 'Tin tức',
      path: '/news',
      subcategories: [
        { name: 'Tất cả', tag: '' },
        { name: 'Công nghệ', tag: 'technology' },
        { name: 'Khoa học', tag: 'science' },
        { name: 'Kinh doanh', tag: 'business' },
        { name: 'Giải trí', tag: 'entertainment' },
      ]
    },
    {
      title: 'Thế giới',
      path: '/news',
      defaultTag: 'world',
      subcategories: [
        { name: 'Quốc tế', tag: 'international' },
        { name: 'Châu Á', tag: 'asia' },
        { name: 'Châu Âu', tag: 'europe' },
        { name: 'Châu Mỹ', tag: 'america' },
      ]
    },
    {
      title: 'Công nghệ',
      path: '/news',
      defaultTag: 'technology',
      subcategories: [
        { name: 'AI & Machine Learning', tag: 'ai' },
        { name: 'Điện thoại', tag: 'mobile' },
        { name: 'Máy tính', tag: 'computer' },
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
