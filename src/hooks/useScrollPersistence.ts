import { useEffect, useRef } from 'react'

/**
 * Hook to persist scroll position in sessionStorage
 * Uses a debounced scroll listener to avoid StrictMode double-mount issues.
 * @param key Unique key for this page/view
 * @param isLoading Boolean indicating if content is loading (don't restore scroll yet)
 */
export function useScrollPersistence(key: string, isLoading: boolean) {
    const hasRestored = useRef(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Reset restored flag strictly on key change (new view)
    useEffect(() => {
        hasRestored.current = false
    }, [key])

    // Save scroll position on SCROLL (Debounced)
    useEffect(() => {
        const handleScroll = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)

            timeoutRef.current = setTimeout(() => {
                const position = window.scrollY
                // Only save if we have a meaningful position or if we really are at top
                // But generally, we trust the debounce to settle on the stable position
                sessionStorage.setItem(`scroll_${key}`, position.toString())
            }, 300)
        }

        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [key])

    // Restore scroll position when loading finishes
    useEffect(() => {
        // Only restore if we haven't done so for this key yet
        if (!isLoading && !hasRestored.current) {
            const savedPosition = sessionStorage.getItem(`scroll_${key}`)

            if (savedPosition) {
                const targetY = parseInt(savedPosition, 10)

                if (targetY > 0) {
                    // Retry logic to ensure the page has height to scroll to
                    let attempts = 0
                    const maxAttempts = 50 // Try for ~5 seconds

                    const tryScroll = () => {
                        window.scrollTo(0, targetY)

                        const currentY = window.scrollY
                        const docHeight = document.documentElement.scrollHeight

                        const atTarget = Math.abs(currentY - targetY) < 50
                        const atBottom = (window.innerHeight + currentY) >= docHeight - 50

                        if (atTarget || atBottom || attempts >= maxAttempts) {
                            hasRestored.current = true
                        } else {
                            attempts++
                            setTimeout(tryScroll, 100)
                        }
                    }
                    setTimeout(tryScroll, 100)

                } else {
                    hasRestored.current = true
                }
            } else {
                hasRestored.current = true
            }
        }
    }, [isLoading, key])
}
