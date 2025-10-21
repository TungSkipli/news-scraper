import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Scraper from './pages/Scraper';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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
            alignItems: 'center'
          }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>News Scraper</h1>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Scraper />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
