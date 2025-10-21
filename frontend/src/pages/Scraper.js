import { useState } from 'react';
import { scrapeNews } from '../services/scrapeService';

function Scraper() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await scrapeNews();
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to scrape');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold', 
            marginBottom: '1.5rem',
            color: '#1f2937'
          }}>
            VnExpress Tech News Scraper
          </h1>

          <button
            onClick={handleScrape}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>

          {loading && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#dbeafe',
              border: '1px solid #93c5fd',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #2563eb',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.75rem'
                }}></div>
                <p style={{ color: '#1e40af' }}>Scraping in progress... This may take a while.</p>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px'
            }}>
              <h3 style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>Error</h3>
              <p style={{ color: '#b91c1c' }}>{error}</p>
            </div>
          )}

          {result && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem',
              backgroundColor: '#d1fae5',
              border: '1px solid #86efac',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#065f46', 
                marginBottom: '1rem',
                fontSize: '1.25rem'
              }}>
                Scraping Completed!
              </h3>
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #86efac'
                }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Total Articles:</span>
                  <span style={{ color: '#111827' }}>{result.data?.total || 0}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #86efac'
                }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Successfully Saved:</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>{result.data?.success || 0}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #86efac'
                }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Failed:</span>
                  <span style={{ color: '#dc2626' }}>{result.data?.failed || 0}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem 0'
                }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Skipped:</span>
                  <span style={{ color: '#d97706' }}>{result.data?.skipped || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Scraper;
