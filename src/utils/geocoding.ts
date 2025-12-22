export interface Coordinates {
    lat: number
    lng: number
}

export async function getCoordinates(address: string): Promise<Coordinates | null> {
    try {
        // Use our own backend proxy (Nominatim) to avoid CORS and ensure valid headers
        const query = encodeURIComponent(address)
        // Note: Vite proxy forwards /api to localhost:5000
        const url = `/api/geocode?q=${query}`

        const response = await fetch(url)
        if (!response.ok) return null

        const data = await response.json()

        if (data && data.lat && data.lng) {
            return {
                lat: data.lat,
                lng: data.lng
            }
        }

        return null
    } catch (error) {
        console.error('Erro no geocoding:', error)
        return null
    }
}


