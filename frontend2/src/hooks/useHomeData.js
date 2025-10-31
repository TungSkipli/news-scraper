import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { getFeaturedNews, getLatestNews, getNewsStats } from '../api/news'

const initialState = {
  featured: null,
  latest: [],
  sidebar: [],
  stats: null,
  loading: false,
  error: false
}

const actionTypes = {
  START: 'START',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
}

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.START:
      return { ...state, loading: true, error: false }
    case actionTypes.SUCCESS:
      return { ...state, loading: false, ...action.payload }
    case actionTypes.ERROR:
      return { ...initialState, error: true }
    default:
      return state
  }
}

const sliceArticles = (articles) => ({
  latest: articles.slice(0, 8),
  sidebar: articles.slice(8, 11)
})

const useHomeData = (category) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: actionTypes.START })
      const featuredParams = { limit: 1 }
      const latestParams = { limit: 11 }
      if (category) {
        featuredParams.category = category
        latestParams.category = category
      }
      const [featuredRes, latestRes, statsRes] = await Promise.all([
        getFeaturedNews(featuredParams),
        getLatestNews(latestParams),
        getNewsStats()
      ])
      const featuredPayload = featuredRes.data
      const latestPayload = latestRes.data
      const statsPayload = statsRes.data
      const featuredData = featuredPayload?.data || []
      const latestData = latestPayload?.data || []
      const statsData = statsPayload?.data || null
      const payload = {
        featured: featuredPayload?.success && featuredData.length > 0 ? featuredData[0] : null,
        latest: latestPayload?.success ? sliceArticles(latestData).latest : [],
        sidebar: latestPayload?.success ? sliceArticles(latestData).sidebar : [],
        stats: statsPayload?.success && statsData
          ? {
              total: statsData.total || 0,
              sources: Array.isArray(statsData.bySource) ? statsData.bySource.length : 0,
              categories: Array.isArray(statsData.byCategory) ? statsData.byCategory.length : 0
            }
          : null
      }
      dispatch({ type: actionTypes.SUCCESS, payload })
    } catch (error) {
      dispatch({ type: actionTypes.ERROR })
    }
  }, [category])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return useMemo(() => ({
    ...state,
    refetch
  }), [state, refetch])
}

export default useHomeData
