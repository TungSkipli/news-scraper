import { useState, useEffect } from 'react'
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
  InputAdornment,
  Skeleton,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Badge,
  Stack,
  Divider,
  ButtonGroup,
  Avatar
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import HomeIcon from '@mui/icons-material/Home'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import { getNews, getCategories } from '../src/api/news'

export default function NewsPage({ initialArticles, initialCategories, initialPagination, initialFilters }) {
  const router = useRouter()
  const [articles, setArticles] = useState(initialArticles)
  const [categories, setCategories] = useState(initialCategories)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  
  const [search, setSearch] = useState(initialFilters.search)
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category)
  const [sortBy, setSortBy] = useState(initialFilters.sortBy)
  const [dateRange, setDateRange] = useState(initialFilters.dateRange)
  const [currentPage, setCurrentPage] = useState(initialFilters.page)
  const [pagination, setPagination] = useState(initialPagination)
  
  useEffect(() => {
    setArticles(initialArticles)
    setPagination(initialPagination)
  }, [initialArticles, initialPagination])

  useEffect(() => {
    const fetchNews = async () => {
      if (!router.isReady) return
      
      const filters = {
        page: parseInt(router.query.page) || 1,
        limit: 12,
        search: router.query.search || '',
        category: router.query.category || '',
        sortBy: router.query.sortBy || 'desc',
        dateRange: router.query.dateRange || ''
      }

      setSearch(filters.search)
      setSelectedCategory(filters.category)
      setSortBy(filters.sortBy)
      setDateRange(filters.dateRange)
      setCurrentPage(filters.page)

      try {
        setLoading(true)
        const response = await getNews(filters)
        setArticles(response.data?.data?.articles || [])
        setPagination(response.data?.data?.pagination || { total: 0, page: 1, totalPages: 1 })
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [router.isReady, router.query])

  const handleSearch = (e) => {
    const value = e.target.value
    updateURL({ search: value, page: 1 })
  }

  const handleCategoryChange = (value) => {
    updateURL({ category: value, page: 1 })
  }

  const handleSortChange = (e) => {
    const value = e.target.value
    updateURL({ sortBy: value, page: 1 })
  }

  const handleDateRangeChange = (e) => {
    const value = e.target.value
    updateURL({ dateRange: value, page: 1 })
  }

  const handlePageChange = (event, page) => {
    updateURL({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    router.push('/news')
  }

  const updateURL = (params) => {
    const currentQuery = router.query
    
    const query = {
      search: params.search !== undefined ? params.search : currentQuery.search,
      category: params.category !== undefined ? params.category : currentQuery.category,
      sortBy: params.sortBy !== undefined ? params.sortBy : currentQuery.sortBy,
      dateRange: params.dateRange !== undefined ? params.dateRange : currentQuery.dateRange,
      page: params.page !== undefined ? params.page : currentQuery.page,
    }
    
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '' || (key === 'sortBy' && query[key] === 'desc') || (key === 'page' && query[key] <= 1)) {
        delete query[key]
      }
    })
    
    router.push({
      pathname: '/news',
      query
    }, undefined, { shallow: true })
  }

  const handleArticleClick = (article) => {
    router.push(`/news/${article.id || article._id}`)
  }

  const hasActiveFilters = search || selectedCategory || dateRange || sortBy !== 'desc'

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const ArticleSkeleton = ({ variant = 'list' }) => (
    variant === 'list' ? (
      <Card sx={{ display: 'flex', mb: 2 }}>
        <Skeleton variant="rectangular" sx={{ width: 240, height: 160 }} />
        <CardContent sx={{ flex: 1 }}>
          <Skeleton width="60%" height={32} />
          <Skeleton width="100%" />
          <Skeleton width="100%" />
          <Skeleton width="40%" />
        </CardContent>
      </Card>
    ) : (
      <Card>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton width="60%" height={28} />
          <Skeleton width="100%" />
          <Skeleton width="80%" />
        </CardContent>
      </Card>
    )
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Box sx={{ 
        backgroundColor: 'white',
        py: 4,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Container maxWidth="lg">
          <Breadcrumbs 
            sx={{ mb: 2 }}
            aria-label="breadcrumb"
          >
            <Link 
              sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: 'primary.main' }, cursor: 'pointer' }}
              onClick={() => router.push('/')}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            <Typography sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
              <NewspaperIcon sx={{ mr: 0.5 }} fontSize="small" />
              News
            </Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                Discover News
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {pagination.total} articles available
                {selectedCategory && ` in ${selectedCategory}`}
              </Typography>
            </Box>
            <ButtonGroup variant="contained" sx={{ bgcolor: 'white', boxShadow: 2 }}>
              <Tooltip title="List View">
                <Button
                  onClick={() => setViewMode('list')}
                  sx={{ 
                    bgcolor: viewMode === 'list' ? 'primary.main' : 'white',
                    color: viewMode === 'list' ? 'white' : 'primary.main',
                    '&:hover': { bgcolor: viewMode === 'list' ? 'primary.dark' : 'grey.100' }
                  }}
                >
                  <ViewListIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Grid View">
                <Button
                  onClick={() => setViewMode('grid')}
                  sx={{ 
                    bgcolor: viewMode === 'grid' ? 'primary.main' : 'white',
                    color: viewMode === 'grid' ? 'white' : 'primary.main',
                    '&:hover': { bgcolor: viewMode === 'grid' ? 'primary.dark' : 'grey.100' }
                  }}
                >
                  <GridViewIcon />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>
          
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search articles by title, summary..."
                  value={search}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleSearch({ target: { value: '' } })}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={handleSortChange}
                  >
                    <MenuItem value="desc">Newest</MenuItem>
                    <MenuItem value="asc">Oldest</MenuItem>
                    <MenuItem value="title-asc">Title A-Z</MenuItem>
                    <MenuItem value="title-desc">Title Z-A</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4} md={2}>
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

              {hasActiveFilters && (
                <Grid item xs={12} md={1}>
                  <Tooltip title="Clear all filters">
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                    >
                      Clear
                    </Button>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Categories
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant={selectedCategory === '' ? 'contained' : 'text'}
                  sx={{ 
                    justifyContent: 'space-between', 
                    textTransform: 'none',
                    fontWeight: selectedCategory === '' ? 700 : 400
                  }}
                  onClick={() => handleCategoryChange('')}
                >
                  <span>All Categories</span>
                  <Chip 
                    label={pagination.total} 
                    size="small" 
                    color={selectedCategory === '' ? 'primary' : 'default'}
                  />
                </Button>
                
                {categories.slice(0, 8).map((cat) => (
                  <Button
                    key={cat.category}
                    fullWidth
                    variant={selectedCategory === cat.category ? 'contained' : 'text'}
                    sx={{ 
                      justifyContent: 'space-between', 
                      textTransform: 'none',
                      fontWeight: selectedCategory === cat.category ? 700 : 400
                    }}
                    onClick={() => handleCategoryChange(cat.category)}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{cat.category}</span>
                    <Chip 
                      label={cat.count} 
                      size="small" 
                      color={selectedCategory === cat.category ? 'primary' : 'default'}
                    />
                  </Button>
                ))}
              </Stack>

              {categories.length > 8 && (
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  sx={{ mt: 2, textTransform: 'none' }}
                >
                  View all categories ({categories.length})
                </Button>
              )}

              <Divider sx={{ my: 3 }} />

              <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  <TrendingUpIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Quick Actions
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => router.push('/scraper')}
                >
                  Scrape New Articles
                </Button>
              </Paper>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            {hasActiveFilters && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Active filters:
                </Typography>
                {search && (
                  <Chip 
                    label={`Search: "${search}"`} 
                    size="small" 
                    onDelete={() => handleSearch({ target: { value: '' } })}
                  />
                )}
                {selectedCategory && (
                  <Chip 
                    label={`Category: ${selectedCategory}`} 
                    size="small" 
                    onDelete={() => handleCategoryChange('')}
                  />
                )}
                {dateRange && (
                  <Chip 
                    label={`Date: ${dateRange}`} 
                    size="small" 
                    onDelete={() => handleDateRangeChange({ target: { value: '' } })}
                  />
                )}
                {sortBy !== 'desc' && (
                  <Chip 
                    label={`Sort: ${sortBy}`} 
                    size="small" 
                    onDelete={() => handleSortChange({ target: { value: 'desc' } })}
                  />
                )}
              </Box>
            )}

            {loading ? (
              <Box>
                {[1, 2, 3, 4].map((i) => (
                  <ArticleSkeleton key={i} variant={viewMode} />
                ))}
              </Box>
            ) : articles.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                <NewspaperIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                  No articles found
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Try adjusting your filters or search terms
                </Typography>
                <Button variant="contained" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, pagination.total)} of {pagination.total} results
                  </Typography>
                </Box>

                {viewMode === 'list' ? (
                  <Stack spacing={2}>
                    {articles.map((article) => (
                      <Card 
                        key={article.id || article._id}
                        sx={{ 
                          display: 'flex',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-4px)'
                          }
                        }}
                        onClick={() => handleArticleClick(article)}
                      >
                        <CardMedia
                          component="img"
                          sx={{ width: 280, height: 180, objectFit: 'cover' }}
                          image={article.image?.url || article.thumbnail || 'https://via.placeholder.com/280x180?text=No+Image'}
                          alt={article.title}
                        />
                        <CardContent sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                            {article.category && (
                              <Chip 
                                label={article.category} 
                                size="small" 
                                color="primary" 
                                sx={{ textTransform: 'capitalize' }}
                              />
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
                              lineHeight: 1.4,
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            {article.title}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.6
                            }}
                          >
                            {article.summary}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(article.published_at)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={3}>
                    {articles.map((article) => (
                      <Grid item xs={12} sm={6} md={4} key={article.id || article._id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            borderRadius: 2,
                            '&:hover': {
                              boxShadow: 6,
                              transform: 'translateY(-8px)'
                            }
                          }}
                          onClick={() => handleArticleClick(article)}
                        >
                          <CardMedia
                            component="img"
                            height="200"
                            image={article.image?.url || article.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt={article.title}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                              {article.category && (
                                <Chip 
                                  label={article.category} 
                                  size="small" 
                                  color="primary"
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              )}
                            </Box>
                            
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                mb: 1,
                                fontSize: '1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.4,
                                '&:hover': { color: 'primary.main' }
                              }}
                            >
                              {article.title}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                flexGrow: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.6
                              }}
                            >
                              {article.summary}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(article.published_at)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {pagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Pagination 
                      count={pagination.totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
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
