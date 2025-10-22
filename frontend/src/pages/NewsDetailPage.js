import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNewsById } from '../services/newsService';

function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNewsById(id);
      setArticle(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '2rem 1rem'
      }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div style={{
            padding: '2rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Error</h3>
            <p>{error}</p>
              <button
                onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
                Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '2rem 1rem'
      }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Article not found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#374151',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
            ← Back
        </button>

        <article style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem',
            lineHeight: '1.3'
          }}>
            {article.title}
          </h1>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e5e7eb',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <span>📅 {formatDate(article.published_at)}</span>
            {article.authors && <span>✍️ {article.authors}</span>}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.375rem 0.875rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {article.summary && (
            <p style={{
              fontSize: '1.125rem',
              color: '#374151',
              fontWeight: '500',
              marginBottom: '1.5rem',
              lineHeight: '1.7',
              fontStyle: 'italic',
              paddingLeft: '1rem',
              borderLeft: '4px solid #2563eb'
            }}>
              {article.summary}
            </p>
          )}

          {article.image?.url && (
            <figure style={{ marginBottom: '2rem' }}>
              <img
                src={article.image.url}
                alt={article.title}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {article.image.caption && (
                <figcaption style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  {article.image.caption}
                </figcaption>
              )}
            </figure>
          )}

          {article.content && (
            <div style={{
              fontSize: '1rem',
              color: '#374151',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {article.content}
            </div>
          )}

          {article.external_source && (
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <a
                href={article.external_source}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.color = '#2563eb'}
              >
                View original article →
              </a>
            </div>
          )}
        </article>
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

export default NewsDetailPage;
