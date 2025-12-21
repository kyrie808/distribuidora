import { useEffect, useRef } from 'react'

/**
 * Hook to persist scroll position in sessionStorage
 * @param key Unique key for this page/view
 * @param isLoading Boolean indicating if content is loading (don't restore scroll yet)
 */
export function useScrollPersistence(key: string, isLoading: boolean) {
    const isRestoring = useRef(false)
    const hasRestored = useRef(false)

    // Reset restored flag strictly on key change (new view)
    useEffect(() => {
        hasRestored.current = false
    }, [key])

    // Save scroll position on unmount
    useEffect(() => {
        const saveScroll = () => {
            // Don't save if we are currently in the process of restoring
            if (isRestoring.current) return
            const position = window.scrollY
            sessionStorage.setItem(`scroll_${key}`, position.toString())
        }

        return () => {
            saveScroll()
        }
    }, [key])

    // Restore scroll position when loading finishes
    useEffect(() => {
        // Only restore if we haven't done so for this key yet
        if (!isLoading && !hasRestored.current) {
            const savedPosition = sessionStorage.getItem(`scroll_${key}`)
            if (savedPosition) {
                const y = parseInt(savedPosition, 10)

                // Only restore if > 0
                if (y > 0) {
                    setTimeout(() => {
                        isRestoring.current = true
                        window.scrollTo(0, y)
                        hasRestored.current = true

                        setTimeout(() => {
                            isRestoring.current = false
                        }, 200)
                    }, 100)
                } else {
                    hasRestored.current = true
                }
            } else {
                hasRestored.current = true
            }
        }
    }, [isLoading, key])
}
