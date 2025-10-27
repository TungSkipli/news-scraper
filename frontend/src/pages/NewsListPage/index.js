import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getArticles, getAllCategories, getAllSources } from '../../services/sourceService';
import NewsCard from '../../components/shared/NewsCard';

function NewsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  const limit = 12;

  useEffect(() => {
    fetchCategories();
    fetchSources();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    setSelectedCategory(categoryFromUrl || '');
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, search, selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getArticles({
        category_id: selectedCategory || undefined,
        limit: 100
      });

      if (response.success) {
        let filteredArticles = response.data;

        if (search) {
          const searchLower = search.toLowerCase();
          filteredArticles = filteredArticles.filter(article => 
            article.title?.toLowerCase().includes(searchLower) ||
            article.summary?.toLowerCase().includes(searchLower)
          );
        }

        setTotalArticles(filteredArticles.length);
        const startIndex = (currentPage - 1) * limit;
        const paginatedArticles = filteredArticles.slice(startIndex, startIndex + limit);
        setArticles(paginatedArticles);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
    }
  };

  const fetchSources = async () => {
    try {
      const response = await getAllSources();
      if (response.success) {
        setSources(response.data);
      }
    } catch (err) {
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setCurrentPage(1);
    if (categoryId) {
      navigate(`/news?category=${categoryId}`);
    } else {
      navigate('/news');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groupCategoriesBySource = () => {
    const grouped = {};
    
    sources.forEach(source => {
      grouped[source.id] = {
        source: source,
        categories: categories.filter(cat => cat.source_id === source.id)
      };
    });
    
    return grouped;
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalArticles / limit);
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`join-item btn btn-sm ${i === currentPage ? 'btn-active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="join">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="join-item btn btn-sm"
        >
          «
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="join-item btn btn-sm"
        >
          »
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1130px] mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">All News</h1>
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={handleSearch}
            className="input input-bordered w-full max-w-md"
          />
        </div>
      </div>

      <div className="max-w-[1130px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded sticky top-20">
              <h3 className="font-bold text-sm mb-3 pb-2 border-b">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                    selectedCategory === '' ? 'bg-[#9f224e] text-white hover:bg-[#9f224e]' : ''
                  }`}
                >
                  All
                </button>
                
                {Object.values(groupCategoriesBySource()).map(({ source, categories: sourceCategories }) => (
                  <div key={source.id} className="space-y-1">
                    <div className="font-semibold text-xs text-gray-700 px-3 py-2">
                      {source.name}
                    </div>
                    {sourceCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryFilter(category.id)}
                        className={`w-full text-left pl-6 pr-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                          selectedCategory === category.id ? 'bg-[#9f224e] text-white hover:bg-[#9f224e]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-400">({category.total_articles || 0})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <button 
                  onClick={() => navigate('/scraper')}
                  className="btn btn-primary btn-sm w-full"
                >
                  Scrape New Articles
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-4 bg-white p-3 rounded">
              <select 
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.total_articles || 0})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(limit)].map((_, index) => (
                  <div key={index} className="skeleton h-64 bg-white"></div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="bg-white rounded p-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold mb-2 text-gray-900">No articles found</h3>
                <p className="text-gray-500 text-sm">Try changing filters or search keywords</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div 
                      key={article.id}
                      className="bg-white rounded hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/news/${article.id}`)}
                    >
                      <div className="flex gap-4 p-4">
                        <div className="flex-shrink-0 w-48 h-32 overflow-hidden rounded">
                          <img
                            src={article.image?.url || article.thumbnail || 'https://via.placeholder.com/300x200'}
                            alt={article.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {article.tags && article.tags[0] && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {article.tags[0]}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-[#9f224e] transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.summary}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(article.published_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalArticles > limit && (
                  <div className="flex justify-center mt-6">
                    {renderPagination()}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default NewsListPage;
