
function NewsCard({ article, onClick }) {
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

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}
    >
      {article.image?.url && (
        <div style={{
          width: '100%',
          height: '200px',
          overflow: 'hidden',
          backgroundColor: '#f3f4f6'
        }}>
          <img
            src={article.image.url}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '0.75rem',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {article.title}
        </h3>

        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: '1rem',
          lineHeight: '1.5',
          flex: 1
        }}>
          {truncateText(article.summary, 150)}
        </p>

        {article.tags && article.tags.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
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

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#9ca3af',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <span>{formatDate(article.published_at)}</span>
          {article.authors && (
            <span style={{ fontWeight: '500' }}>{article.authors}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsCard;
