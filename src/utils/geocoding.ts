export interface Coordinates {
    lat: number
    lng: number
}

export interface Coordinates {
    lat: number
    lng: number
}

export async function getCoordinates(_address: string): Promise<Coordinates | null> {
    try {
        // [CORS FIX] Geocoding client-side is blocked by browsers. 
        // We would need a backend proxy (e.g. Supabase Edge Function) for this.
        // Returning null for now to avoid console errors.

        // const query = encodeURIComponent(address)
        // const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
        // const response = await fetch(url, { ... })
        // ...

        return null
    } catch (error) {
        // Suppress scary errors for user, just warn in console
        console.warn('Geocoding indisponível ou falhou (Nominatim):', error)
        return null
    }
}


