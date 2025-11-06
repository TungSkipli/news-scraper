import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  Container,
  Box,
  Typography,
  Chip,
  Paper,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Avatar
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ShareIcon from '@mui/icons-material/Share'
import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import LinkIcon from '@mui/icons-material/Link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LanguageIcon from '@mui/icons-material/Language'
import { getNewsById, getNews } from '../../src/api/news'

export default function ArticleDetail() {
  const router = useRouter()
  const { id } = router.query
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchArticle()
    }
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getNewsById(id)
      if (response.data.success) {
        setArticle(response.data.data)
        if (response.data.data.category) {
          fetchRelatedArticles(response.data.data.category, id)
        }
      } else {
        setError('Article not found')
      }
    } catch (err) {
      console.error('Error fetching article:', err)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedArticles = async (category, currentId) => {
    try {
      const response = await getNews({ category, limit: 4 })
      if (response.data.success) {
        const filtered = response.data.data.articles.filter(
          a => (a.id || a._id) !== currentId
        ).slice(0, 3)
        setRelatedArticles(filtered)
      }
    } catch (err) {
      console.error('Error fetching related articles:', err)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleShare = (platform) => {
    const url = window.location.href
    const title = article?.title || ''
    
    let shareUrl = ''
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      default:
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  const handleRelatedArticleClick = (relatedArticle) => {
    router.push(`/news/${relatedArticle.id || relatedArticle._id}`)
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error || !article) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 8 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Article not found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/news')}
          >
            Back to News
          </Button>
        </Container>
      </Box>
    )
  }

  return (
    <>
      <Head>
        <title>{article.title} - News Scraper</title>
        <meta name="description" content={article.summary || article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary || article.description} />
        <meta property="og:image" content={article.image?.url || article.thumbnail} />
      </Head>

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Box sx={{ 
          backgroundColor: 'white',
          py: 3,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/news')}
                sx={{ mr: 2 }}
              >
                Back
              </Button>
              <Breadcrumbs aria-label="breadcrumb">
                <Link 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'text.secondary', 
                    textDecoration: 'none', 
                    '&:hover': { textDecoration: 'underline', color: 'primary.main' }, 
                    cursor: 'pointer' 
                  }}
                  onClick={() => router.push('/')}
                >
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Home
                </Link>
                <Link 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'text.secondary', 
                    textDecoration: 'none', 
                    '&:hover': { textDecoration: 'underline', color: 'primary.main' }, 
                    cursor: 'pointer' 
                  }}
                  onClick={() => router.push('/news')}
                >
                  <NewspaperIcon sx={{ mr: 0.5 }} fontSize="small" />
                  News
                </Link>
                <Typography sx={{ color: 'text.primary' }}>
                  Article
                </Typography>
              </Breadcrumbs>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, borderRadius: 2 }}>
                {article.category && (
                  <Chip 
                    label={article.category} 
                    color="primary" 
                    sx={{ mb: 2, textTransform: 'capitalize' }}
                  />
                )}

                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.3 }}>
                  {article.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(article.published_at)}
                    </Typography>
                  </Box>
                  
                  {article.source && (
                    <>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LanguageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {article.source.name || article.source}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                {article.summary && (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500, 
                      mb: 3, 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderLeft: 4, 
                      borderColor: 'primary.main',
                      fontStyle: 'italic',
                      color: 'text.secondary'
                    }}
                  >
                    {article.summary}
                  </Typography>
                )}

                {(article.image?.url || article.thumbnail) && (
                  <Box sx={{ mb: 4 }}>
                    <img
                      src={article.image?.url || article.thumbnail}
                      alt={article.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        maxHeight: '500px',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ 
                  '& p': { mb: 2, lineHeight: 1.8, fontSize: '1.05rem' },
                  '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 2 },
                  '& h2': { mt: 3, mb: 2, fontWeight: 700 },
                  '& h3': { mt: 2, mb: 1.5, fontWeight: 600 },
                  '& ul, & ol': { mb: 2, pl: 4 },
                  '& li': { mb: 1 }
                }}>
                  {article.content ? (
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Full content not available. 
                      {article.url && (
                        <> <Link href={article.url} target="_blank" rel="noopener">Read more on source</Link></>
                      )}
                    </Typography>
                  )}
                </Box>

                {article.tags && article.tags.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Tags:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {article.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                {article.url && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Button
                      variant="outlined"
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<LanguageIcon />}
                    >
                      View Original Article
                    </Button>
                  </>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <ShareIcon sx={{ mr: 1 }} />
                  Share Article
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FacebookIcon />}
                    onClick={() => handleShare('facebook')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TwitterIcon />}
                    onClick={() => handleShare('twitter')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    fullWidth
                    variant={copied ? 'contained' : 'outlined'}
                    startIcon={<LinkIcon />}
                    onClick={() => handleShare('copy')}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </Button>
                </Stack>

                {relatedArticles.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Related Articles
                    </Typography>
                    <Stack spacing={2}>
                      {relatedArticles.map((related) => (
                        <Card 
                          key={related.id || related._id}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                          onClick={() => handleRelatedArticleClick(related)}
                        >
                          <CardMedia
                            component="img"
                            height="140"
                            image={related.image?.url || related.thumbnail || 'https://via.placeholder.com/280x140?text=No+Image'}
                            alt={related.title}
                          />
                          <CardContent>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 1
                              }}
                            >
                              {related.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(related.published_at)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
}
