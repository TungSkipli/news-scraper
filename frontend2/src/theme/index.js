// d:\Learning\Scaper\news-scraper\frontend2\src\theme\index.js
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#9f224e',  // Màu chính từ frontend
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      paper: '#ffffff',
      default: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontSize: '1.5rem',
      fontWeight: 700
    }
  }
})

export default theme
