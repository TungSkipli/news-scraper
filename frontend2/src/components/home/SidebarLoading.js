import { Stack, Skeleton } from '@mui/material'

const SidebarLoading = () => (
  <Stack spacing={2}>
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
    ))}
  </Stack>
)

export default SidebarLoading
