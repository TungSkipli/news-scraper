import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getArticles, getAllSources } from '../../services/sourceService';
import NewsCard from '../../components/shared/NewsCard';

function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('source_id');
  
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [sidebarArticles, setSidebarArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [sourceId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const articlesRes = await getArticles({ 
        source_id: sourceId || undefined, 
        limit: 50 
      });

      const sourcesRes = await getAllSources();

      if (articlesRes.success && articlesRes.data && articlesRes.data.length > 0) {
        setFeaturedArticle(articlesRes.data[0]);
        setLatestArticles(articlesRes.data.slice(1, 9));
        setSidebarArticles(articlesRes.data.slice(9, 12));
      } else {
        setFeaturedArticle(null);
        setLatestArticles([]);
        setSidebarArticles([]);
      }

      if (sourcesRes.success && sourcesRes.data) {
        setSources(sourcesRes.data);
        
        const totalArticles = sourcesRes.data.reduce((sum, s) => sum + (s.total_articles || 0), 0);
        const totalSources = sourcesRes.data.length;
        const totalCategories = sourcesRes.data.reduce((sum, s) => sum + (s.total_categories || 0), 0);
        
        setStats({
          total: totalArticles,
          sources: totalSources,
          categories: totalCategories
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-base-100 border-b border-base-300 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          {stats && (
            <div className="flex gap-6 text-sm text-base-content/70">
              <span><strong className="text-base-content">{stats.total}</strong> articles</span>
              <span>•</span>
              <span><strong className="text-base-content">{stats.sources}</strong> sources</span>
              <span>•</span>
              <span><strong className="text-base-content">{stats.categories}</strong> categories</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex gap-8">
          <main className="flex-1">
            {loading ? (
              <div className="space-y-6">
                <div className="skeleton h-80 w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-64"></div>
                  ))}
                </div>
              </div>
            ) : !featuredArticle && latestArticles.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold mb-2 text-gray-900">No articles found</h3>
                <p className="text-gray-500 text-sm mb-4">This source has no articles yet or try selecting a different source</p>
                {sourceId && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/')}
                  >
                    View All Sources
                  </button>
                )}
              </div>
            ) : (
              <>
                {featuredArticle && (
                  <NewsCard 
                    article={featuredArticle} 
                    variant="featured"
                    onClick={() => navigate(`/news/${featuredArticle.id}`)}
                  />
                )}

                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-base-300">
                    Latest News
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestArticles.map((article) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        onClick={() => navigate(`/news/${article.id}`)}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center mt-8">
                  <button 
                    className="btn btn-outline btn-primary btn-wide"
                    onClick={() => navigate('/news')}
                  >
                    View All News →
                  </button>
                </div>
              </>
            )}
          </main>

          <aside className="hidden lg:block w-80">
            <div className="sticky top-20">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-base-300">
                Recent
              </h3>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-20"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {sidebarArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      variant="horizontal"
                      onClick={() => navigate(`/news/${article.id}`)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-8 p-4 bg-base-200 rounded">
                <h4 className="font-bold mb-3">Manage Sources</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Add and manage news sources
                </p>
                <button 
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => navigate('/scraper')}
                >
                  Go to Scraper
                </button>
              </div>

              {sources.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold mb-3">News Sources</h4>
                  <div className="space-y-2">
                    {sources.slice(0, 5).map(source => (
                      <div 
                        key={source.id}
                        className="text-sm p-2 hover:bg-base-200 rounded cursor-pointer transition-colors"
                        onClick={() => navigate(`/?source_id=${source.id}`)}
                      >
                        <div className="font-semibold">{source.name}</div>
                        <div className="text-xs text-base-content/60">
                          {source.total_articles || 0} articles
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
