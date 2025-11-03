import { Paper, Typography, Button } from '@mui/material'
import { useTranslation } from 'next-i18next'

const EmptyState = ({ onScrape }) => {
  const { t } = useTranslation('common')
  
  return (
    <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('noArticlesFound')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>{t('startScrapingArticles')}</Typography>
      <Button variant="contained" size="small" onClick={onScrape}>{t('goToScraper')}</Button>
    </Paper>
  )
}

export default EmptyState
