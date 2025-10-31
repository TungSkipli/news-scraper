import { Paper, Box, Typography, Stack } from '@mui/material'

const CARD_PLACEHOLDER = 'https://via.placeholder.com/400x250'

const ArticleCard = ({ article, onClick, formatDate }) => {
  const image = article?.image?.url || article?.thumbnail || CARD_PLACEHOLDER

  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{ borderRadius: 3, overflow: 'hidden', cursor: 'pointer', backgroundColor: 'background.paper', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
    >
      <Box component="img" src={image} alt={article?.title} sx={{ width: '100%', height: 220, objectFit: 'cover' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article?.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2 }}>
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
      </Box>
    </Paper>
  )
}

export default ArticleCard
