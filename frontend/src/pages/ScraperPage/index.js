import { useState, useEffect } from 'react';
import { detectCategories, scrapeSource, getAllSources } from '../../services/sourceService';

function Scraper() {
  const [homepageUrl, setHomepageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [scrapeOptions, setScrapeOptions] = useState({
    maxCategories: 2,
    maxPages: 1,
    maxArticlesPerCategory: 5
  });

  const presetSources = [
    'https://vvnm.vietbao.com/',
    'https://ngoisao.vnexpress.net/',
    'https://afamily.vn/',
    'https://rangdongatlanta.com/',
    'https://tinnuocmy.asia/',
    'https://nguoi-viet.com/',
    'https://saigonnhonews.com/'
  ];

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await getAllSources();
      if (response.success && response.data) {
        setSources(response.data);
      }
    } catch (error) {
    }
  };

  const handleDetect = async () => {
    if (!homepageUrl) {
      setError('Vui lòng nhập URL trang chủ');
      return;
    }

    setDetecting(true);
    setError(null);
    setDetectedData(null);
    setScrapeResult(null);

    try {
      const response = await detectCategories(homepageUrl);
      if (response.success) {
        setDetectedData(response.data);
      } else {
        setError(response.message || 'Không thể phát hiện danh mục');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phát hiện danh mục');
    } finally {
      setDetecting(false);
    }
  };

  const handleScrape = async () => {
    if (!homepageUrl) {
      setError('Vui lòng nhập URL trang chủ');
      return;
    }

    setLoading(true);
    setError(null);
    setScrapeResult(null);

    try {
      const response = await scrapeSource(homepageUrl, scrapeOptions);
      if (response.success) {
        setScrapeResult(response.data);
        await fetchSources();
      } else {
        setError(response.message || 'Không thể scrape nguồn');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi scrape nguồn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Source News Scraper
          </h1>
          <p className="text-gray-600">
            Thêm nguồn tin tức mới bằng cách nhập URL trang chủ
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Thêm nguồn mới</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL trang chủ
            </label>
            <input
              type="url"
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              placeholder="https://example.com"
              className="input input-bordered w-full"
              disabled={loading || detecting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hoặc chọn từ danh sách có sẵn:
            </label>
            <div className="flex flex-wrap gap-2">
              {presetSources.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setHomepageUrl(url)}
                  className="btn btn-sm btn-outline"
                  disabled={loading || detecting}
                >
                  {new URL(url).hostname.replace('www.', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số danh mục tối đa
              </label>
              <input
                type="number"
                value={scrapeOptions.maxCategories}
                onChange={(e) => setScrapeOptions({...scrapeOptions, maxCategories: parseInt(e.target.value)})}
                className="input input-bordered w-full"
                min="1"
                max="20"
                disabled={loading || detecting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số trang mỗi danh mục
              </label>
              <input
                type="number"
                value={scrapeOptions.maxPages}
                onChange={(e) => setScrapeOptions({...scrapeOptions, maxPages: parseInt(e.target.value)})}
                className="input input-bordered w-full"
                min="1"
                max="10"
                disabled={loading || detecting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số bài mỗi danh mục
              </label>
              <input
                type="number"
                value={scrapeOptions.maxArticlesPerCategory}
                onChange={(e) => setScrapeOptions({...scrapeOptions, maxArticlesPerCategory: parseInt(e.target.value)})}
                className="input input-bordered w-full"
                min="1"
                max="50"
                disabled={loading || detecting}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDetect}
              disabled={detecting || loading || !homepageUrl}
              className="btn btn-outline btn-primary"
            >
              {detecting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Đang phát hiện...
                </>
              ) : (
                '🔍 Phát hiện danh mục'
              )}
            </button>
            <button
              onClick={handleScrape}
              disabled={loading || detecting || !homepageUrl}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Đang scrape...
                </>
              ) : (
                '🚀 Bắt đầu Scrape'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {detectedData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              ✅ Đã phát hiện danh mục từ: {detectedData.source.name}
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Domain:</strong> {detectedData.source.domain}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Số danh mục:</strong> {detectedData.categories.length}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detectedData.categories.map((cat, index) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="font-semibold text-sm mb-1">{cat.name}</div>
                  <div className="text-xs text-gray-500 truncate">{cat.url}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scrapeResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">
              🎉 Scraping hoàn tất!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Tổng bài viết</div>
                <div className="stat-value text-primary">{scrapeResult.totalArticles || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Thành công</div>
                <div className="stat-value text-success">{scrapeResult.savedArticles || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Danh mục</div>
                <div className="stat-value text-secondary">{scrapeResult.categoriesProcessed || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Thời gian</div>
                <div className="stat-value text-accent text-2xl">
                  {scrapeResult.totalTime ? `${Math.round(scrapeResult.totalTime / 1000)}s` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Nguồn tin đã thêm ({sources.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <div key={source.id} className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg mb-2">{source.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{source.domain}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>📰 {source.total_articles || 0} bài viết</span>
                    <span>📂 {source.total_categories || 0} danh mục</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scraper;
