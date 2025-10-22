import { useState, useRef, useEffect } from 'react';
import { scrapeNews } from '../services/scrapeService';

function Scraper() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const API_URL = process.env.REACT_APP_API_URL;
    const eventSource = new EventSource(`${API_URL}/scrape-stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.stage === 'done') {
        setResult({ success: true, data: data.results });
        setLoading(false);
        eventSource.close();
      } else if (data.stage === 'error') {
        setError(data.message);
        setLoading(false);
        eventSource.close();
      } else {
        setProgress(data);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Connection was interrupted');
      setLoading(false);
      eventSource.close();
    };
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
              padding: '1.5rem', 
              backgroundColor: '#dbeafe',
              border: '1px solid #93c5fd',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: '#1e40af' }}>
                    {progress?.message || 'Starting...'}
                  </span>
                  {progress?.total > 0 && (
                    <span style={{ color: '#1e40af', fontSize: '0.875rem' }}>
                      {progress?.current}/{progress?.total}
                    </span>
                  )}
                </div>
                
                {progress?.total > 0 && (
                  <div style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #93c5fd'
                  }}>
                    <div style={{
                      width: `${(progress?.current / progress?.total) * 100}%`,
                      height: '100%',
                      backgroundColor: '#2563eb',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {progress?.total > 0 && `${Math.round((progress?.current / progress?.total) * 100)}%`}
                    </div>
                  </div>
                )}

                {progress?.success !== undefined && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginTop: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ color: '#059669' }}>✓ Success: {progress?.success}</span>
                    <span style={{ color: '#dc2626' }}>✗ Failed: {progress?.failed}</span>
                    <span style={{ color: '#d97706' }}>⊘ Skipped: {progress?.skipped}</span>
                  </div>
                )}
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
