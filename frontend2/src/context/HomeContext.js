import { createContext, useContext } from 'react'
import useHomeData from '../hooks/useHomeData'

const HomeContext = createContext(null)

export const HomeProvider = ({ category, children }) => {
  const value = useHomeData(category)
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>
}

export const useHomeContext = () => {
  const context = useContext(HomeContext)
  if (!context) {
    throw new Error('useHomeContext must be used within HomeProvider')
  }
  return context
}

export default HomeContext
