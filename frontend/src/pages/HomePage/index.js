import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getNews, getStats, getFeatured, getLatest } from '../../services/newsService';
import NewsCard from '../../components/shared/NewsCard';

function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [sidebarArticles, setSidebarArticles] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [category]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch featured article
      const featuredRes = await getFeatured(1);
      if (featuredRes.success && featuredRes.data && featuredRes.data.length > 0) {
        setFeaturedArticle(featuredRes.data[0]);
      }

      // Fetch latest articles
      const latestRes = await getLatest(11);
      if (latestRes.success && latestRes.data) {
        setLatestArticles(latestRes.data.slice(0, 8));
        setSidebarArticles(latestRes.data.slice(8, 11));
      }

      // Fetch stats
      const statsRes = await getStats();
      if (statsRes.success && statsRes.data) {
        const data = statsRes.data;
        setStatsData({
          total: data.total || 0,
          sources: data.bySource?.length || 0,
          categories: data.byCategory?.length || 0
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
          {statsData && (
            <div className="flex gap-6 text-sm text-base-content/70">
              <span><strong className="text-base-content">{statsData.total}</strong> articles</span>
              <span>•</span>
              <span><strong className="text-base-content">{statsData.sources}</strong> sources</span>
              <span>•</span>
              <span><strong className="text-base-content">{statsData.categories}</strong> categories</span>
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
                <p className="text-gray-500 text-sm mb-4">Start scraping articles to see them here</p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/scraper')}
                >
                  Go to Scraper
                </button>
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
                <h4 className="font-bold mb-3">Scrape News</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Add new articles from various sources
                </p>
                <button 
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => navigate('/scraper')}
                >
                  Go to Scraper
                </button>
              </div>

              {statsData && statsData.categories > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold mb-3">Categories</h4>
                  <p className="text-sm text-base-content/70">
                    {statsData.categories} categories available
                  </p>
                  <button 
                    className="btn btn-outline btn-sm w-full mt-2"
                    onClick={() => navigate('/news')}
                  >
                    Browse by Category
                  </button>
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
