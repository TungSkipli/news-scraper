import { Container, Box, Stack, Typography } from '@mui/material'

const StatsBar = ({ stats }) => {
  if (!stats) return null

  return (
    <Box sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider', py: 2 }}>
      <Container maxWidth="lg">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: 'text.secondary', flexWrap: 'wrap', typography: 'body2' }}>
          <Typography component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{stats.total}</Box>
            articles
          </Typography>
          <Typography component="span">•</Typography>
          <Typography component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{stats.sources}</Box>
            sources
          </Typography>
          <Typography component="span">•</Typography>
          <Typography component="span" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{stats.categories}</Box>
            categories
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

export default StatsBar
