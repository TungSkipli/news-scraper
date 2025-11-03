import { Paper, Typography, Button } from '@mui/material'
import { useTranslation } from 'next-i18next'

const ErrorState = ({ onRetry }) => {
  const { t } = useTranslation('common')
  
  return (
    <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('unableToLoadData')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>{t('pleaseTryAgain')}</Typography>
      <Button variant="outlined" size="small" onClick={onRetry}>{t('retry')}</Button>
    </Paper>
  )
}

export default ErrorState
