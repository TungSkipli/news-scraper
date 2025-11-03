import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Pagination,
  Paper,
  Button,
  CircularProgress,
  InputAdornment
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { getNews, getCategories } from '../src/api/news'

export default function NewsPage({ initialArticles, initialCategories, initialPagination, initialFilters }) {
  const router = useRouter()
  const [articles, setArticles] = useState(initialArticles)
  const [categories, setCategories] = useState(initialCategories)
  const [loading, setLoading] = useState(false)
  
  const [search, setSearch] = useState(initialFilters.search)
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category)
  const [sortBy, setSortBy] = useState(initialFilters.sortBy)
  const [dateRange, setDateRange] = useState(initialFilters.dateRange)
  const [currentPage, setCurrentPage] = useState(initialFilters.page)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialPagination.total / 12))

  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value)
    updateURL({ search: value, page: 1 })
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    setSelectedCategory(value)
    updateURL({ category: value, page: 1 })
  }

  const handleSortChange = (e) => {
    const value = e.target.value
    setSortBy(value)
    updateURL({ sortBy: value, page: 1 })
  }

  const handleDateRangeChange = (e) => {
    const value = e.target.value
    setDateRange(value)
    updateURL({ dateRange: value, page: 1 })
  }

  const handlePageChange = (event, page) => {
    setCurrentPage(page)
    updateURL({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateURL = (params) => {
    const query = {
      search: search || undefined,
      category: selectedCategory || undefined,
      sortBy: sortBy !== 'desc' ? sortBy : undefined,
      dateRange: dateRange || undefined,
      page: currentPage > 1 ? currentPage : undefined,
      ...params
    }
    
    Object.keys(query).forEach(key => query[key] === undefined && delete query[key])
    
    router.push({
      pathname: '/news',
      query
    }, undefined, { shallow: true })
  }

  const handleArticleClick = (article) => {
    router.push(`/news/${article.id || article._id}`)
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      <Box sx={{ backgroundColor: 'white', borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            All News
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search news..."
                value={search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortChange}
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                  <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                  <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={handleDateRangeChange}
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="recent">Last 24h</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ p: 2, position: 'sticky', top: 100 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                Categories
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  variant={selectedCategory === '' ? 'contained' : 'text'}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  onClick={() => handleCategoryChange({ target: { value: '' } })}
                >
                  All Categories
                </Button>
                
                {categories.map((cat) => (
                  <Button
                    key={cat.category}
                    fullWidth
                    variant={selectedCategory === cat.category ? 'contained' : 'text'}
                    sx={{ justifyContent: 'space-between', textTransform: 'none' }}
                    onClick={() => handleCategoryChange({ target: { value: cat.category } })}
                  >
                    <span className="capitalize">{cat.category}</span>
                    <span className="text-xs opacity-60">({cat.count})</span>
                  </Button>
                ))}
              </Box>

              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => router.push('/scraper')}
                >
                  Scrape New Articles
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : articles.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                  No articles found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Try changing filters or search keywords
                </Typography>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {articles.map((article) => (
                    <Card 
                      key={article.id || article._id}
                      sx={{ 
                        display: 'flex',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleArticleClick(article)}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: 240, height: 160, objectFit: 'cover' }}
                        image={article.image?.url || article.thumbnail || 'https://via.placeholder.com/300x200'}
                        alt={article.title}
                      />
                      <CardContent sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {article.tags && article.tags[0] && (
                            <Chip label={article.tags[0]} size="small" variant="outlined" />
                          )}
                        </Box>
                        
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {article.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {article.summary}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          {new Date(article.published_at).toLocaleDateString('vi-VN')}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export async function getServerSideProps(context) {
  const { query } = context
  
  const filters = {
    page: parseInt(query.page) || 1,
    limit: 12,
    search: query.search || '',
    category: query.category || '',
    sortBy: query.sortBy || 'desc',
    dateRange: query.dateRange || ''
  }

  try {
    const [newsResponse, categoriesResponse] = await Promise.all([
      getNews(filters),
      getCategories()
    ])

    return {
      props: {
        initialArticles: newsResponse.data?.data?.articles || [],
        initialCategories: categoriesResponse.data?.data || [],
        initialPagination: newsResponse.data?.data?.pagination || { total: 0, page: 1, totalPages: 1 },
        initialFilters: filters
      }
    }
  } catch (error) {
    console.error('Error fetching news:', error)
    
    return {
      props: {
        initialArticles: [],
        initialCategories: [],
        initialPagination: { total: 0, page: 1, totalPages: 1 },
        initialFilters: filters
      }
    }
  }
}
