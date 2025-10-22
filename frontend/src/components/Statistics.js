import React from 'react';

function Statistics({ stats }) {
  if (!stats) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {stats.topTags && stats.topTags.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Top Tags
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.topTags.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  flex: 1
                }}>
                  {item.tag}
                </span>
                <div style={{
                  flex: 2,
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(item.count / stats.topTags[0].count) * 100}%`,
                    height: '100%',
                    backgroundColor: '#2563eb',
                    borderRadius: '4px'
                  }}></div>
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#2563eb',
                  minWidth: '30px',
                  textAlign: 'right'
                }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, bgColor }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: color
      }}>
        {value}
      </div>
    </div>
  );
}

export default Statistics;
