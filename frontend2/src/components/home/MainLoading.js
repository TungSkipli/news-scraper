import { Stack, Skeleton, Grid } from '@mui/material'

const MainLoading = () => (
  <Stack spacing={4}>
    <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3 }} />
    <Grid container spacing={3}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  </Stack>
)

export default MainLoading
