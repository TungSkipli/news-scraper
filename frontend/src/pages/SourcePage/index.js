import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNews, getStats } from '../../services/newsService';
import NewsCard from '../../components/shared/NewsCard';

function SourcePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sourceInfo, setSourceInfo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In new structure, sources are embedded in articles
      // So we fetch all articles and filter client-side by source
      const articlesRes = await getNews({ limit: 100 });

      if (articlesRes.success && articlesRes.data.articles) {
        // Filter articles by source (id could be source_name or source_domain)
        const filteredArticles = articlesRes.data.articles.filter(article => 
          article.source_name === id || 
          article.source_domain === id ||
          article.source_name?.toLowerCase().includes(id.toLowerCase())
        );
        
        setArticles(filteredArticles);

        // Extract source info from first article
        if (filteredArticles.length > 0) {
          const firstArticle = filteredArticles[0];
          setSourceInfo({
            name: firstArticle.source_name || id,
            domain: firstArticle.source_domain || id,
            total_articles: filteredArticles.length
          });
        }
      }

      // If no articles found, try to get source info from stats
      if (articles.length === 0) {
        const statsRes = await getStats();
        if (statsRes.success && statsRes.data?.bySource) {
          const sourceFromStats = statsRes.data.bySource.find(s => 
            s.source_name === id || s.source_domain === id
          );
          if (sourceFromStats) {
            setSourceInfo(sourceFromStats);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch source data');
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

  if (!sourceInfo && !loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Source not found</h2>
          <p className="text-gray-500 mb-4">No articles found from this source</p>
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
      <div className="bg-gradient-to-r from-[#9f224e] to-[#c82e5f] text-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl font-bold mb-2">{sourceInfo?.name || id}</h1>
          <p className="text-white/80 mb-4">{sourceInfo?.domain || ''}</p>
          <div className="flex gap-6 text-sm">
            <span>📰 {sourceInfo?.total_articles || articles.length} articles</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

       {articles.length === 0 && !loading ? (
          <div  className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles from this source yet</p>
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

export default SourcePage;