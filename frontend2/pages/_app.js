import { CacheProvider } from '@emotion/react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { appWithTranslation } from 'next-i18next'
import Head from 'next/head'
import { createEmotionCache } from '../src/utils/createEmotionCache'
import theme from '../src/theme'
import Header from '../src/components/layout/Header'
import '../styles/globals.css'

const clientSideEmotionCache = createEmotionCache()

function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }) {
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  )
}

export default appWithTranslation(MyApp)
