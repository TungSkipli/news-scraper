import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews, getTags } from '../../services/newsService';
import NewsCard from '../../components/shared/NewsCard';

function NewsListPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const limit = 12;

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [currentPage, search, selectedTag]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNews({
        page: currentPage,
        limit,
        search,
        tag: selectedTag
      });
      setArticles(response.data.articles);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await getTags();
      setTags(response.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleTagFilter = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

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
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={currentPage === pagination.totalPages}
          className="join-item btn btn-sm"
        >
          »
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-base-100 border-b border-base-300 py-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-3xl font-bold mb-4">Tất cả tin tức</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                value={search}
                onChange={handleSearch}
                className="input input-bordered w-full"
              />
            </div>
            <button
              onClick={() => navigate('/scraper')}
              className="btn btn-primary"
            >
              Scrape tin mới
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags.slice(0, 10).map((tag, index) => (
              <button
                key={index}
                onClick={() => handleTagFilter(tag)}
                className={`badge badge-lg cursor-pointer hover:badge-primary transition-colors ${
                  selectedTag === tag ? 'badge-primary' : 'badge-outline'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(limit)].map((_, index) => (
              <div key={index} className="skeleton h-80"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-content/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Không tìm thấy bài viết</h3>
            <p className="text-base-content/60">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/news/${article.id}`)}
                />
              ))}
            </div>

            <div className="flex justify-center">
              {renderPagination()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NewsListPage;
