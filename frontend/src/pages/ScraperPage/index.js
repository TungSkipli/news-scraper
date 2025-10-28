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
  const [scrapeMode, setScrapeMode] = useState('full');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [scrapeOptions, setScrapeOptions] = useState({
    maxCategories: 2,
    maxPages: 1,
    maxArticlesPerCategory: 5
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const presetSources = [
    'https://vnexpress.net/',
    'https://ngoisao.vnexpress.net/',
    'https://afamily.vn/',
    'https://thanhnien.vn/',
    'https://tinnuocmy.asia/',
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

  const simulateProgress = (totalTime) => {
    setProgress(0);
    const interval = 100;
    const steps = totalTime / interval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 95, 95);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(progressInterval);
      }
    }, interval);

    return progressInterval;
  };

  const handleScrape = async () => {
    if (!homepageUrl) {
      setError('Please enter homepage URL');
      return;
    }

    if (scrapeMode === 'single' && !selectedCategory) {
      setError('Please select a category to scrape');
      return;
    }

    setLoading(true);
    setError(null);
    setScrapeResult(null);
    setProgress(0);
    setProgressMessage('Starting scraper...');

    const estimatedTime = scrapeMode === 'full' 
      ? scrapeOptions.maxCategories * scrapeOptions.maxArticlesPerCategory * 2000
      : scrapeOptions.maxArticlesPerCategory * 2000;

    const progressInterval = simulateProgress(estimatedTime);

    try {
      if (scrapeMode === 'single') {
        const category = detectedData.categories.find(cat => cat.url === selectedCategory);
        setProgressMessage(`Scraping category: ${category?.name || 'Selected category'}...`);
        
        const response = await scrapeSource(homepageUrl, {
          ...scrapeOptions,
          categoryUrl: selectedCategory,
          mode: 'single'
        });

        if (response.success) {
          setScrapeResult(response.data);
          await fetchSources();
          setShowSuccessModal(true);
        } else {
          setError(response.message || 'Failed to scrape category');
        }
      } else {
        setProgressMessage(`Scraping all categories from source...`);
        
        const response = await scrapeSource(homepageUrl, scrapeOptions);
        if (response.success) {
          setScrapeResult(response.data);
          await fetchSources();
          setShowSuccessModal(true);
        } else {
          setError(response.message || 'Failed to scrape source');
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Scraping completed!');
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err.response?.data?.message || 'Error during scraping');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Source News Scraper
          </h1>
          <p className="text-gray-600">
            Thêm nguồn tin tức mới bằng cách nhập URL trang chủ
          </p>
        </div>

  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Thêm nguồn mới</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scrape Mode
            </label>
            <select
              value={scrapeMode}
              onChange={(e) => {
                setScrapeMode(e.target.value);
                setSelectedCategory('');
              }}
              className="select select-bordered w-full mb-4"
              disabled={loading || detecting}
            >
              <option value="full">🌐 Full Source - Scrape all categories</option>
              <option value="single">📂 Single Category - Scrape specific category</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Homepage URL
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

          {scrapeMode === 'single' && detectedData && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category to Scrape
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select select-bordered w-full"
                disabled={loading || detecting}
              >
                <option value="">-- Choose a category --</option>
                {detectedData.categories.map((cat, index) => (
                  <option key={index} value={cat.url}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  Will scrape: {detectedData.categories.find(c => c.url === selectedCategory)?.name}
                </p>
              )}
            </div>
          )}

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
            {scrapeMode === 'full' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Categories
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
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pages per Category
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
                Articles per Category
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
                  Detecting...
                </>
              ) : (
                '🔍 Detect Categories'
              )}
            </button>
            <button
              onClick={handleScrape}
              disabled={loading || detecting || !homepageUrl || (scrapeMode === 'single' && !selectedCategory)}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Scraping...
                </>
              ) : (
                scrapeMode === 'single' ? '📂 Scrape Category' : '🚀 Scrape Full Source'
              )}
            </button>
          </div>

          {loading && progress > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{progressMessage}</span>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 10 && (
                    <span className="text-xs text-white font-semibold">
                      {Math.round(progress)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This may take several minutes depending on the number of articles...
              </p>
            </div>
          )}
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
              ✅ Categories detected from: {detectedData.source.name}
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Domain:</strong> {detectedData.source.domain}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total Categories:</strong> {detectedData.categories.length}
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
              🎉 Scraping completed!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Total Articles</div>
                <div className="stat-value text-primary">{scrapeResult.articles?.total || scrapeResult.totalArticles || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Success</div>
                <div className="stat-value text-success">{scrapeResult.articles?.success || scrapeResult.savedArticles || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Categories</div>
                <div className="stat-value text-secondary">{scrapeResult.categories?.length || scrapeResult.categoriesProcessed || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded">
                <div className="stat-title">Failed</div>
                <div className="stat-value text-error text-2xl">
                  {scrapeResult.articles?.failed || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Added Sources ({sources.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <div key={source.id} className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg mb-2">{source.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{source.domain}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>📰 {source.total_articles || 0} articles</span>
                    <span>📂 {source.total_categories || 0} categories</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSuccessModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-success">✅ Scraping Completed Successfully!</h3>
            <p className="py-4">The scraping process has finished successfully. All articles have been saved to the database.</p>
            <div className="modal-action">
              <button className="btn btn-success" onClick={() => setShowSuccessModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scraper;
