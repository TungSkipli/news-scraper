import React from 'react';

function NewsCard({ article, onClick, variant = 'default' }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (variant === 'featured') {
    return (
      <div 
        className="flex flex-col md:flex-row gap-4 pb-6 mb-6 border-b border-base-300 cursor-pointer hover:bg-base-200 transition-colors p-4 -m-4"
        onClick={onClick}
      >
        <div className="md:w-2/3">
          <img
            src={article.thumbnail || 'https://via.placeholder.com/800x400'}
            alt={article.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        </div>
        <div className="md:w-1/3 flex flex-col">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-base-content/70 mb-4 line-clamp-4 flex-grow">
            {article.summary}
          </p>
          <div className="flex items-center gap-3 text-sm text-base-content/60">
            <span>{formatDate(article.published_at)}</span>
            {article.tags && article.tags[0] && (
              <>
                <span>•</span>
                <span className="text-primary">{article.tags[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div 
        className="flex gap-4 pb-4 mb-4 border-b border-base-300 cursor-pointer group"
        onClick={onClick}
      >
        <div className="w-32 h-20 flex-shrink-0">
          <img
            src={article.thumbnail || 'https://via.placeholder.com/200x120'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <span className="text-xs text-base-content/60">
            {formatDate(article.published_at)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-3 overflow-hidden">
        <img
          src={article.thumbnail || 'https://via.placeholder.com/400x250'}
          alt={article.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="font-bold mb-2 line-clamp-3 group-hover:text-primary transition-colors">
        {article.title}
      </h3>
      <p className="text-sm text-base-content/70 mb-2 line-clamp-2">
        {article.summary}
      </p>
      <div className="flex items-center gap-2 text-xs text-base-content/60">
        <span>{formatDate(article.published_at)}</span>
        {article.tags && article.tags[0] && (
          <>
            <span>•</span>
            <span className="text-primary">{article.tags[0]}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default NewsCard;
