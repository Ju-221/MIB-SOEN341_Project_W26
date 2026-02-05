import { useState, useEffect } from 'react'

type Page = 'signin' | 'signup'

export function useHashNavigation(defaultPage: Page = 'signin') {
  const [currentPage, setCurrentPage] = useState<Page>(defaultPage)

  useEffect(() => {
    const updatePageFromHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'signup' || hash === 'signin') {
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
