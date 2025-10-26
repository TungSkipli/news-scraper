import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeatured, getLatest, getStats } from '../../services/newsService';
import NewsCard from '../../components/shared/NewsCard';

function HomePage() {
  const navigate = useNavigate();
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [sidebarArticles, setSidebarArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [featuredRes, latestRes, statsRes] = await Promise.all([
        getFeatured(1),
        getLatest(10),
        getStats()
      ]);

      if (featuredRes.data && featuredRes.data.length > 0) {
        setFeaturedArticle(featuredRes.data[0]);
      }
      
      if (latestRes.data && latestRes.data.length > 0) {
        setLatestArticles(latestRes.data.slice(1, 7));
        setSidebarArticles(latestRes.data.slice(7, 10));
      }
      
      setStats(statsRes.data);
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
              <span><strong className="text-base-content">{stats.total}</strong> bài viết</span>
              <span>•</span>
              <span><strong className="text-base-content">{stats.today}</strong> hôm nay</span>
              <span>•</span>
              <span><strong className="text-base-content">{stats.week}</strong> tuần này</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton h-64"></div>
                  ))}
                </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {latestArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onClick={() => navigate(`/news/${article.id}`)}
                    />
                  ))}
                </div>

                <div className="text-center mt-8">
                  <button 
                    className="btn btn-outline btn-primary"
                    onClick={() => navigate('/news')}
                  >
                    Xem tất cả tin tức
                  </button>
                </div>
              </>
            )}
          </main>

          <aside className="hidden lg:block w-80">
            <div className="sticky top-20">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-base-300">
                Mới nhất
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
                <h4 className="font-bold mb-3">Scrape tin mới</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Cập nhật tin tức mới nhất từ VnExpress
                </p>
                <button 
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => navigate('/scraper')}
                >
                  Đi tới Scraper
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
