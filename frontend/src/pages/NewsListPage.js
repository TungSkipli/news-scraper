import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews, getStats, getTags } from '../services/newsService';
import NewsCard from '../components/NewsCard';
import Statistics from '../components/Statistics';

function NewsListPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const limit = 12;

  useEffect(() => {
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const response = await getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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

  const handleTagFilter = (e) => {
    setSelectedTag(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            News Dashboard
          </h1>
          <button
            onClick={() => navigate('/scraper')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            Scrape News
          </button>
        </div>

        <Statistics stats={stats} />

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
              <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={handleSearch}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <select
              value={selectedTag}
              onChange={handleTagFilter}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
            >
              <option value="">All tags</option>
              {tags.map((tag, index) => (
                <option key={index} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[...Array(limit)].map((_, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#e5e7eb',
                  animation: 'shimmer 1.5s infinite'
                }}></div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{
                    height: '1.5rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '0.75rem',
                    animation: 'shimmer 1.5s infinite'
                  }}></div>
                  <div style={{
                    height: '1rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    width: '80%',
                    animation: 'shimmer 1.5s infinite'
                  }}></div>
                  <div style={{
                    height: '1rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    width: '60%',
                    animation: 'shimmer 1.5s infinite'
                  }}></div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      height: '1.5rem',
                      width: '60px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '12px',
                      animation: 'shimmer 1.5s infinite'
                    }}></div>
                    <div style={{
                      height: '1.5rem',
                      width: '80px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '12px',
                      animation: 'shimmer 1.5s infinite'
                    }}></div>
                  </div>
                  <div style={{
                    height: '0.875rem',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    width: '50%',
                    animation: 'shimmer 1.5s infinite'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                No articles found
              </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/news/${article.id}`)}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2rem'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  Previous
                </button>

                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          backgroundColor: page === currentPage ? '#2563eb' : 'white',
                          color: page === currentPage ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontWeight: page === currentPage ? '600' : '400'
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} style={{ padding: '0.5rem' }}>...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: currentPage === pagination.totalPages ? '#f3f4f6' : 'white',
                    cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === pagination.totalPages ? '#9ca3af' : '#374151'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-color: #e5e7eb;
          }
          50% {
            background-color: #f3f4f6;
          }
          100% {
            background-color: #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}

export default NewsListPage;
