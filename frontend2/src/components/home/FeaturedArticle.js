import { Paper, Box, Stack, Typography } from '@mui/material'

const FEATURED_PLACEHOLDER = 'https://via.placeholder.com/800x400'

const FeaturedArticle = ({ article, onClick, formatDate }) => {
  const image = article?.image?.url || article?.thumbnail || FEATURED_PLACEHOLDER

  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, pb: 3, mb: 4, borderRadius: 3, border: 1, borderColor: 'divider', cursor: 'pointer', overflow: 'hidden', backgroundColor: 'background.paper', transition: 'background-color 0.2s', '&:hover': { backgroundColor: 'action.hover' } }}
    >
      <Box sx={{ flexBasis: { md: '65%' }, flexGrow: 1 }}>
        <Box component="img" src={image} alt={article?.title} sx={{ width: '100%', height: { xs: 320, md: 380 }, objectFit: 'cover' }} />
      </Box>
      <Stack spacing={2} sx={{ flexBasis: { md: '35%' }, px: { xs: 3, md: 0 }, pr: { md: 3 }, py: { xs: 3, md: 0 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{article?.title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
          {article?.summary || article?.description || ''}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', typography: 'caption' }}>
          {article?.source_name && (
            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{article.source_name}</Typography>
          )}
          {article?.source_name && article?.published_at && <Typography component="span">•</Typography>}
          {article?.published_at && <Typography component="span">{formatDate(article.published_at)}</Typography>}
          {article?.category_name && (
            <>
              <Typography component="span">•</Typography>
              <Typography component="span" sx={{ color: 'secondary.main' }}>{article.category_name}</Typography>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default FeaturedArticle
