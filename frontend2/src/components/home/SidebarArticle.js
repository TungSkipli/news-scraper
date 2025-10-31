import { Stack, Typography, Box, Paper, Chip } from '@mui/material'

const SIDEBAR_PLACEHOLDER = 'https://via.placeholder.com/200x120'

const SidebarArticle = ({ article, onClick, formatDate }) => {
  const image = article?.image?.url || article?.thumbnail || SIDEBAR_PLACEHOLDER

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box component="img" src={image} alt={article?.title} sx={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
        <Stack spacing={1} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {article?.source_name && (
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: 0.5 }}>
                {article.source_name}
              </Typography>
            )}
            {article?.category_name && (
              <Chip label={article.category_name} size="small" color="secondary" variant="outlined" sx={{ height: 22 }} />
            )}
          </Stack>
          <Typography className="title" variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article?.title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'success.main' }} />
            <Typography variant="caption">{formatDate(article?.published_at)}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default SidebarArticle
