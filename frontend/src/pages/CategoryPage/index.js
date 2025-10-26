import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticles, getSourceById } from '../../services/sourceService';
import NewsCard from '../../components/shared/NewsCard';

function CategoryPage() {
  const { sourceId, categoryId } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [sourceId, categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [articlesRes, sourceRes] = await Promise.all([
        getArticles({ 
          source_id: sourceId, 
          category_id: categoryId,
          limit: 50 
        }),
        getSourceById(sourceId)
      ]);

      if (articlesRes.success) {
        setArticles(articlesRes.data);
      }

      if (sourceRes.success) {
        setSource(sourceRes.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const categoryName = articles.length > 0 ? articles[0].category_name : 'Category';

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
              {source && (
                <li>
                  <button onClick={() => navigate(`/source/${sourceId}`)} className="link link-hover">
                    {source.name}
                  </button>
                </li>
              )}
              <li>{categoryName}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        {source && (
          <p className="text-gray-600 mb-6">
            From source: <span className="text-primary font-semibold">{source.name}</span>
          </p>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles yet</p>
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