import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNewsById } from '../../services/newsService';

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
      if (response.success) {
        setArticle(response.data);
      } else {
        setError(response.message || 'Failed to fetch article');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${weekday}, ${dateStr}, ${time}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-base-content/60">Article not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[680px] mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-4 py-6 bg-white mt-4">
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 uppercase">{article.tags[0]}</span>
          </div>
        )}

        <h1 className="text-[28px] leading-[1.4] font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-[15px] leading-[1.6] text-gray-700 font-normal mb-5">
            {article.summary}
          </p>
        )}

        <div className="text-xs text-gray-500 mb-5 pb-5 border-b border-gray-200">
          {article.source_name && (
            <div className="mb-2">
              <span className="font-semibold text-primary">Source:</span>{' '}
              <button 
                onClick={() => navigate(`/source/${article.source_id}`)}
                className="text-primary hover:underline"
              >
                {article.source_name}
              </button>
              {article.category_name && (
                <>
                  {' • '}
                  <span className="text-secondary">{article.category_name}</span>
                </>
              )}
            </div>
          )}
          <div>
            {formatDate(article.published_at)}
            {article.authors && (
              <span className="ml-3">
                - {article.authors}
              </span>
            )}
          </div>
        </div>

        {article.image?.url && (
          <figure className="mb-5">
            <img
              src={article.image.url}
              alt={article.title}
              className="w-full"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {article.image.caption && (
              <figcaption className="text-xs text-gray-500 italic mt-1">
                {article.image.caption}
              </figcaption>
            )}
          </figure>
        )}

        {article.content && (
          <div className="text-[15px] leading-[1.8] text-gray-800 whitespace-pre-wrap">
            {article.content}
          </div>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {article.external_source && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <a
              href={article.external_source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              View Original Article →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsDetailPage;
