export interface Coordinates {
    lat: number
    lng: number
}

export interface Coordinates {
    lat: number
    lng: number
}

export async function getCoordinates(address: string): Promise<Coordinates | null> {
    try {
        const query = encodeURIComponent(address)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MassasCRM/1.0 (contato@massascrm.com)' // Identificação requerida pelo Nominatim
            }
        })

        if (!response.ok) return null

        const data = await response.json()

        if (data && data.length > 0) {
            const result = data[0]
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            }
        }

        return null
    } catch (error) {
        console.error('Erro no geocoding (Nominatim):', error)
        return null
    }
}


