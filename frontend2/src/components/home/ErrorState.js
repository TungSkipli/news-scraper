import { Paper, Typography, Button } from '@mui/material'

const ErrorState = ({ onRetry }) => (
  <Paper elevation={0} sx={{ textAlign: 'center', py: 8, px: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Unable to load data</Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>Please try again in a moment</Typography>
    <Button variant="outlined" size="small" onClick={onRetry}>Retry</Button>
  </Paper>
)

export default ErrorState
