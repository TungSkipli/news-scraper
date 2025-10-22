import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Scraper from './pages/Scraper';
import NewsListPage from './pages/NewsListPage';
import NewsDetailPage from './pages/NewsDetailPage';
import './styles/App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav style={{ 
      backgroundColor: '#2563eb', 
      color: 'white', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '0 1rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>News Scraper</h1>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link
            to="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: location.pathname === '/' ? 'bold' : 'normal',
              opacity: location.pathname === '/' ? 1 : 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = location.pathname === '/' ? 1 : 0.8}
          >
            Dashboard
          </Link>
          <Link
            to="/scraper"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: location.pathname === '/scraper' ? 'bold' : 'normal',
              opacity: location.pathname === '/scraper' ? 1 : 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = location.pathname === '/scraper' ? 1 : 0.8}
          >
            Scraper
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<NewsListPage />} />
          <Route path="/scraper" element={<Scraper />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
