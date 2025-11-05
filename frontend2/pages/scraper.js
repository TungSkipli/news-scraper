import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Stack,
  Collapse,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import SearchIcon from '@mui/icons-material/Search'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CategoryIcon from '@mui/icons-material/Category'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import InfoIcon from '@mui/icons-material/Info'
import { scrapeSingleArticle, scrapeSource, detectCategories } from '../src/api/scraper'

const PRESET_SOURCES = [
  { name: 'VnExpress', url: 'https://vnexpress.net/' },
  { name: 'Ngôi Sao', url: 'https://ngoisao.vnexpress.net/' },
  { name: 'Afamily', url: 'https://afamily.vn/' },
  { name: 'Thanh Niên', url: 'https://thanhnien.vn/' },
]

export default function ScraperPage() {
  const router = useRouter()
  
  const [scrapeMode, setScrapeMode] = useState('full')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  
  const [detecting, setDetecting] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [detectedData, setDetectedData] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [scrapeOptions, setScrapeOptions] = useState({
    maxCategories: 2,
    maxPages: 1,
    maxArticlesPerCategory: 5
  })
  
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleDetectCategories = async () => {
    if (!homepageUrl) {
      setError('Please enter homepage URL')
      return
    }

    setDetecting(true)
    setError(null)
    setDetectedData(null)

    try {
      const response = await detectCategories(homepageUrl)
      if (response.data?.success) {
        setDetectedData(response.data.data)
        setError(null)
      } else {
        setError(response.data?.message || 'Failed to detect categories')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error detecting categories')
    } finally {
      setDetecting(false)
    }
  }

  const simulateProgress = (totalTime) => {
    setProgress(0)
    const interval = 100
    const steps = totalTime / interval
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep++
      const newProgress = Math.min((currentStep / steps) * 95, 95)
      setProgress(newProgress)

      if (currentStep >= steps) {
        clearInterval(progressInterval)
      }
    }, interval)

    return progressInterval
  }

  const handleScrapeSingleArticle = async () => {
    if (!articleUrl) {
      setError('Please enter article URL')
      return
    }

    setScraping(true)
    setError(null)
    setResult(null)
    setProgress(0)
    setProgressMessage('Scraping article...')

    const progressInterval = simulateProgress(5000)

    try {
      const response = await scrapeSingleArticle(articleUrl)
      
      clearInterval(progressInterval)
      setProgress(100)
      setProgressMessage('Article scraped successfully!')

      if (response.data?.success) {
        setResult(response.data.data)
        setShowSuccessModal(true)
        setArticleUrl('')
      } else {
        setError(response.data?.message || 'Failed to scrape article')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setProgress(0)
      setError(err.response?.data?.message || 'Error scraping article')
    } finally {
      setScraping(false)
      setTimeout(() => {
        setProgress(0)
        setProgressMessage('')
      }, 3000)
    }
  }

  const handleScrapeSource = async () => {
    if (!homepageUrl) {
      setError('Please enter homepage URL')
      return
    }

    if (scrapeMode === 'single' && !selectedCategory) {
      setError('Please select a category to scrape')
      return
    }

    setScraping(true)
    setError(null)
    setResult(null)
    setProgress(0)
    setProgressMessage('Starting scraper...')

    const estimatedTime = scrapeMode === 'full'
      ? scrapeOptions.maxCategories * scrapeOptions.maxArticlesPerCategory * 2000
      : scrapeOptions.maxArticlesPerCategory * 2000

    const progressInterval = simulateProgress(estimatedTime)

    try {
      const options = {
        ...scrapeOptions,
        mode: scrapeMode,
        ...(scrapeMode === 'single' ? { categoryUrl: selectedCategory } : {})
      }

      const response = await scrapeSource(homepageUrl, options)
      
      clearInterval(progressInterval)
      setProgress(100)
      setProgressMessage('Scraping completed!')

      if (response.data?.success) {
        setResult(response.data.data)
        setShowSuccessModal(true)
      } else {
        setError(response.data?.message || 'Failed to scrape source')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setProgress(0)
      setError(err.response?.data?.message || 'Error scraping source')
    } finally {
      setScraping(false)
      setTimeout(() => {
        setProgress(0)
        setProgressMessage('')
      }, 3000)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setResult(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Box sx={{ backgroundColor: 'white', py: 4, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
            <Link
              sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: 'primary.main' }, cursor: 'pointer' }}
              onClick={() => router.push('/')}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            <Typography sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
              <CloudUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Scraper
            </Typography>
          </Breadcrumbs>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            News Scraper
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Add new articles from various sources using AI-powered scraping
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Scrape Mode
              </Typography>
              <ButtonGroup fullWidth variant="outlined" sx={{ mb: 3 }}>
                <Button
                  variant={scrapeMode === 'article' ? 'contained' : 'outlined'}
                  onClick={() => setScrapeMode('article')}
                  startIcon={<ArticleIcon />}
                  disabled={scraping || detecting}
                >
                  Single Article
                </Button>
                <Button
                  variant={scrapeMode === 'single' ? 'contained' : 'outlined'}
                  onClick={() => setScrapeMode('single')}
                  startIcon={<CategoryIcon />}
                  disabled={scraping || detecting}
                >
                  Single Category
                </Button>
                <Button
                  variant={scrapeMode === 'full' ? 'contained' : 'outlined'}
                  onClick={() => setScrapeMode('full')}
                  startIcon={<SearchIcon />}
                  disabled={scraping || detecting}
                >
                  Full Source
                </Button>
              </ButtonGroup>

              {scrapeMode === 'article' ? (
                <Box>
                  <TextField
                    fullWidth
                    label="Article URL"
                    placeholder="https://example.com/article-url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    disabled={scraping}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleScrapeSingleArticle}
                    disabled={scraping || !articleUrl}
                    startIcon={scraping ? null : <PlayArrowIcon />}
                  >
                    {scraping ? 'Scraping...' : 'Scrape Article'}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="Homepage URL"
                    placeholder="https://example.com"
                    value={homepageUrl}
                    onChange={(e) => setHomepageUrl(e.target.value)}
                    disabled={scraping || detecting}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Quick select:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {PRESET_SOURCES.map((source) => (
                        <Chip
                          key={source.url}
                          label={source.name}
                          onClick={() => setHomepageUrl(source.url)}
                          disabled={scraping || detecting}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {scrapeMode === 'single' && detectedData && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        label="Select Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={scraping || detecting}
                      >
                        <MenuItem value="">-- Choose a category --</MenuItem>
                        {detectedData.categories.map((cat, index) => (
                          <MenuItem key={index} value={cat.url}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      size="small"
                    >
                      Advanced Options
                    </Button>
                    <Collapse in={showAdvanced}>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {scrapeMode === 'full' && (
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Max Categories"
                              value={scrapeOptions.maxCategories}
                              onChange={(e) => setScrapeOptions({ ...scrapeOptions, maxCategories: parseInt(e.target.value) })}
                              inputProps={{ min: 1, max: 20 }}
                              disabled={scraping || detecting}
                            />
                          </Grid>
                        )}
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Pages per Category"
                            value={scrapeOptions.maxPages}
                            onChange={(e) => setScrapeOptions({ ...scrapeOptions, maxPages: parseInt(e.target.value) })}
                            inputProps={{ min: 1, max: 10 }}
                            disabled={scraping || detecting}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Articles per Category"
                            value={scrapeOptions.maxArticlesPerCategory}
                            onChange={(e) => setScrapeOptions({ ...scrapeOptions, maxArticlesPerCategory: parseInt(e.target.value) })}
                            inputProps={{ min: 1, max: 50 }}
                            disabled={scraping || detecting}
                          />
                        </Grid>
                      </Grid>
                    </Collapse>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleDetectCategories}
                      disabled={detecting || scraping || !homepageUrl}
                      startIcon={detecting ? null : <SearchIcon />}
                      sx={{ minWidth: 180 }}
                    >
                      {detecting ? 'Detecting...' : 'Detect Categories'}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleScrapeSource}
                      disabled={scraping || detecting || !homepageUrl || (scrapeMode === 'single' && !selectedCategory)}
                      startIcon={scraping ? null : <PlayArrowIcon />}
                    >
                      {scraping ? 'Scraping...' : scrapeMode === 'single' ? 'Scrape Category' : 'Scrape Full Source'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {(scraping || progress > 0) && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {progressMessage}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    This may take several minutes depending on the number of articles...
                  </Typography>
                </Box>
              )}
            </Paper>

            {detectedData && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Categories Detected: {detectedData.source.name}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Domain:</strong> {detectedData.source.domain}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Total Categories:</strong> {detectedData.categories.length}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  {detectedData.categories.map((cat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {cat.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                            {cat.url}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  How It Works
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>1</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Choose scrape mode"
                    secondary="Single article, category, or full source"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>2</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Enter URL"
                    secondary="Paste article or homepage URL"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>3</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Detect categories (optional)"
                    secondary="For source scraping only"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>4</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary="Start scraping"
                    secondary="AI will auto-classify articles"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="caption">
                  Articles are automatically classified using AI and saved to Firebase. The process may take a few minutes.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => router.push('/news')}
              >
                View All News
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={showSuccessModal} onClose={handleCloseSuccessModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
          Scraping Completed!
        </DialogTitle>
        <DialogContent>
          {result && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {result.articles?.total || result.totalArticles || result.savedArticles || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Articles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {result.articles?.success || result.savedArticles || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {result.articles?.failed > 0 && (
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {result.articles.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {result.articles?.duplicates > 0 && (
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {result.articles.duplicates}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duplicates
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessModal}>Close</Button>
          <Button variant="contained" onClick={() => {
            handleCloseSuccessModal()
            router.push('/news')
          }}>
            View News
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
