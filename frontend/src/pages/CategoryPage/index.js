import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNews, getNewsByCategory } from '../../services/newsService';
import NewsCard from '../../components/shared/NewsCard';

function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('desc');

  useEffect(() => {
    fetchData();
  }, [categoryId, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let articlesRes;
      
      if (categoryId) {
        articlesRes = await getNewsByCategory(categoryId, { limit: 50, sortBy });
      } else {
        articlesRes = await getNews({ limit: 50, sortBy });
      }

      if (articlesRes && articlesRes.success) {
        setArticles(articlesRes.data.articles || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const categoryName = categoryId || (articles.length > 0 ? articles[0].category : 'All Articles');

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="skeleton h-12 w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-base-100 border-b border-base-300 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-sm breadcrumbs">
            <ul>
              <li>
                <button onClick={() => navigate('/')} className="link link-hover">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/news')} className="link link-hover">
                  News
                </button>
              </li>
              <li className="capitalize">{categoryName}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold capitalize">{categoryName}</h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select select-bordered"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {articles.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles in this category yet</p>
            <button 
              className="btn btn-primary btn-sm mt-4"
              onClick={() => navigate('/scraper')}
            >
              Scrape Articles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={() => navigate(`/news/${article.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;