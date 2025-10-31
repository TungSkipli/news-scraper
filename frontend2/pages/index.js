import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Grid, Button, Stack, Paper, Divider } from '@mui/material'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
// import StatsBar from '../src/components/home/StatsBar'
import FeaturedArticle from '../src/components/home/FeaturedArticle'
import ArticleCard from '../src/components/home/ArticleCard'
import SidebarArticle from '../src/components/home/SidebarArticle'
import MainLoading from '../src/components/home/MainLoading'
import SidebarLoading from '../src/components/home/SidebarLoading'
import EmptyState from '../src/components/home/EmptyState'
import ErrorState from '../src/components/home/ErrorState'
import { HomeProvider, useHomeContext } from '../src/context/HomeContext'

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hours ago`
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const HomePageContent = () => {
  const router = useRouter()
  const { featured, latest, sidebar, stats, loading, error, refetch } = useHomeContext()

  const navigate = useMemo(() => ({
    to: (path) => () => router.push(path)
  }), [router])

  const isEmpty = !loading && !featured && latest.length === 0

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* <StatsBar stats={stats} /> */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} lg={8}>
            {error ? (
              <ErrorState onRetry={refetch} />
            ) : loading ? (
              <MainLoading />
            ) : isEmpty ? (
              <EmptyState onScrape={navigate.to('/scraper')} />
            ) : (
              <>
                {featured && (
                  <FeaturedArticle article={featured} onClick={navigate.to(`/news/${featured.id || featured._id}`)} formatDate={formatDate} />
                )}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Latest News</Typography>
                    <Divider flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                  </Box>
                  <Grid container spacing={3}>
                    {latest.map((article) => (
                      <Grid item xs={12} md={6} key={article.id || article._id}>
                        <ArticleCard article={article} onClick={navigate.to(`/news/${article.id || article._id}`)} formatDate={formatDate} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Button variant="outlined" size="large" onClick={navigate.to('/news')}>
                    View All News →
                  </Button>
                </Box>
              </>
            )}
          </Grid>
          <Grid item xs={12} lg={4} sx={{ display: { xs: 'none', lg: 'block' }}}>
            <Box sx={{ position: 'sticky', top: 96 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent</Typography>
              {loading ? (
                <SidebarLoading />
              ) : (
                <Stack>
                  {sidebar.map((article) => (
                    <SidebarArticle key={article.id || article._id} article={article} onClick={navigate.to(`/news/${article.id || article._id}`)} formatDate={formatDate} />
                  ))}
                </Stack>
              )}
              <Paper elevation={0} sx={{ mt: 4, p: 3, borderRadius: 3, border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Scrape News</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Add new articles from various sources
                </Typography>
                <Button variant="contained" size="small" fullWidth onClick={navigate.to('/scraper')}>
                  Go to Scraper
                </Button>
              </Paper>
              {stats?.categories > 0 && (
                <Paper elevation={0} sx={{ mt: 4, p: 3, borderRadius: 3, border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Categories</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {stats.categories} categories available
                  </Typography>
                  <Button variant="outlined" size="small" fullWidth onClick={navigate.to('/news')}>
                    Browse by Category
                  </Button>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default function Home() {
  const router = useRouter()
  const category = router.isReady ? router.query.category : undefined

  return (
    <HomeProvider category={category}>
      <HomePageContent />
    </HomeProvider>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  }
}
