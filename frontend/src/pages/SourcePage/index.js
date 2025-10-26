import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSourceById, getSourceCategories, getArticles } from '../../services/sourceService';
import NewsCard from '../../components/shared/NewsCard';

function SourcePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [sourceRes, categoriesRes, articlesRes] = await Promise.all([
        getSourceById(id),
        getSourceCategories(id),
        getArticles({ 
          source_id: id, 
          category_id: selectedCategory || undefined,
          limit: 50 
        })
      ]);

      if (sourceRes.success) {
        setSource(sourceRes.data);
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }

      if (articlesRes.success) {
        setArticles(articlesRes.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

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

  if (!source) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Source not found</h2>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9f224e] to-[#c82e5f] text-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl font-bold mb-2">{source.name}</h1>
          <p className="text-white/80 mb-4">{source.domain}</p>
          <div className="flex gap-6 text-sm">
            <span>📰 {source.total_articles || 0} articles</span>
            <span>📂 {source.total_categories || 0} categories</span>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="bg-base-100 border-b border-base-300 py-4">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`btn btn-sm ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline'}`}
                >
                  {category.name} ({category.total_articles || 0})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

export default SourcePage;