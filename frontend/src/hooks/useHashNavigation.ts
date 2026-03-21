import { useState, useEffect } from 'react'

type Page = 'home' | 'signin' | 'signup' | 'profile' | 'calendar'

export function useHashNavigation(defaultPage: Page = 'home') {
  const [currentPage, setCurrentPage] = useState<Page>(defaultPage)

  useEffect(() => {
    const updatePageFromHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'home' || hash === 'signup' || hash === 'signin' || hash === 'profile' || hash === 'calendar') {
        setCurrentPage(hash as Page)
      } else {
        setCurrentPage(defaultPage)
      }
    }

    updatePageFromHash()
    window.addEventListener('hashchange', updatePageFromHash)
    return () => window.removeEventListener('hashchange', updatePageFromHash)
  }, [defaultPage])

  return currentPage
}
