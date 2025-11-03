import { Container, Typography, Box } from '@mui/material'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function News() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Hello Page News
        </Typography>
      </Container>
    </Box>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  }
}
