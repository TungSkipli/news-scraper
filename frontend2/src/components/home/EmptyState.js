import { Paper, Typography, Button } from '@mui/material'

const EmptyState = ({ onScrape }) => (
  <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>No articles found</Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>Start scraping articles to see them here</Typography>
    <Button variant="contained" size="small" onClick={onScrape}>Go to Scraper</Button>
  </Paper>
)

export default EmptyState
