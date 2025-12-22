from flask import Flask, request, jsonify
import os
from groq import Groq
import json
from dotenv import load_dotenv
import requests
import time

load_dotenv()

app = Flask(__name__)

def get_coordinates(address):
    """
    Geocodes an address using Nominatim API.
    Returns (lat, float) or (0, 0) if not found.
    Respects Nominatim's usage policy (1.5s delay).
    """
    try:
        # Nominatim usage policy requires a valid User-Agent
        headers = {'User-Agent': 'MassasCRM_RouteOptimizer/1.0'}
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'limit': 1
        }
        
        # Respect rate limiting (1.5 request per second)
        time.sleep(1.5)
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
                
        print(f"Geocoding falhou para: {address} - Status: {response.status_code}")
        return 0.0, 0.0
        
    except Exception as e:
        print(f"Erro no geocoding para {address}: {e}")
        return 0.0, 0.0

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two points on the Earth surface.
    Returns distance in kilometers.
    """
    R = 6371  # Earth radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2)**2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

@app.route('/api/geocode', methods=['GET'])
def geocode_proxy():
    address = request.args.get('q')
    if not address:
        return jsonify({"error": "Endereço não fornecido"}), 400
    
    # Clean address similarly to frontend to ensure best match
    address = address.replace(", ,", ",")
    
    print(f"🌍 Proxy Geocoding (Nominatim): '{address}'")
    lat, lng = get_coordinates(address)
    
    if lat == 0.0 and lng == 0.0:
         # Return 200 OK but with error/null to avoid console red 404s (better DX)
         return jsonify({"error": "Endereço não encontrado", "lat": None, "lng": None}), 200
         
    return jsonify({"lat": lat, "lng": lng})

@app.route('/api/optimize', methods=['POST'])
def optimize_route():
    try:
        data = request.json
        entregas = data.get('entregas', [])
        origin_address = data.get('origin', '')
        
        if not entregas:
            return jsonify({"error": "Nenhuma entrega fornecida"}), 400

        print(f"📥 REQUEST RECEBIDO: {len(entregas)} entregas. Origem: {origin_address}")

        # 1. Geocode Origin
        origin_lat = data.get('origin_lat')
        origin_lng = data.get('origin_lng')

        # If coordinates not provided in payload, geocode
        if not origin_lat or not origin_lng:
             origin_lat, origin_lng = 0.0, 0.0
             if origin_address:
                print(f"🌍 Geocoding Origem: '{origin_address}'...")
                origin_lat, origin_lng = get_coordinates(origin_address)
        else:
             print(f"📍 Usando coordenadas de origem fornecidas: {origin_lat}, {origin_lng}")
        
        # If origin fails or is empty, default to first delivery's roughly or 0,0 (stops will just be sorted relative to 0,0 which is bad, but better than crash)
        # Ideally user provides a valid origin.
        
        current_lat = origin_lat
        current_lng = origin_lng

        # 2. Geocode Deliveries & Separate Valid/Invalid
        valid_stops = []
        failed_stops = []

        for e in entregas:
            endereco_busca = e.get("endereco", "")
            if e.get("bairro"):
                endereco_busca += f", {e.get('bairro')}"
            
            # Use provided coordinates if available
            lat = e.get("latitude") or e.get("lat")
            lng = e.get("longitude") or e.get("lng")
            
            if lat is None or lng is None:
                print(f"🌍 Geocoding Item {e.get('id')}: '{endereco_busca}'...")
                lat, lng = get_coordinates(endereco_busca)
            else:
                print(f"📍 Usando coordenadas do banco para Item {e.get('id')}: {lat}, {lng}")
            
            # Ensure float conversion
            try:
                lat = float(lat)
                lng = float(lng)
            except (ValueError, TypeError):
                lat, lng = 0.0, 0.0
            
            item_data = {
                "id": e.get("id"),
                "lat": lat,
                "lng": lng,
                "endereco": endereco_busca
            }

            if lat != 0.0 and lng != 0.0:
                 valid_stops.append(item_data)
                 print(f" ✅ Sucesso: {lat}, {lng}")
            else:
                 failed_stops.append(item_data)
                 print(f" ❌ Falha (será movido para o final)")

        # 3. Nearest Neighbor Algorithm
        # Only route valid stops. Failed stops go to the end.
        optimized_order_ids = []
        
        # Start looking from the Origin coordinates
        # If origin failed (0,0), it will match closest to 0,0 if any, or just pick one.
        
        unvisited = valid_stops[:]

        while unvisited:
            closest_stop = None
            min_dist = float('inf')
            
            for stop in unvisited:
                dist = haversine_distance(current_lat, current_lng, stop['lat'], stop['lng'])
                if dist < min_dist:
                    min_dist = dist
                    closest_stop = stop
            
            if closest_stop:
                optimized_order_ids.append(closest_stop['id'])
                current_lat = closest_stop['lat']
                current_lng = closest_stop['lng']
                unvisited.remove(closest_stop)
                print(f" 📍 Próxima parada: {closest_stop['id']} (Dist: {min_dist:.2f}km)")

        # 4. Append failed stops at the end
        for stop in failed_stops:
            optimized_order_ids.append(stop['id'])
            print(f" ⚠️ Adicionando parada sem coordenadas no final: {stop['id']}")

        print(f"📤 Retornando {len(optimized_order_ids)} itens ordenados.")
        return jsonify(optimized_order_ids)

    except Exception as e:
        error_msg = str(e)
        print(f"⚠️ Erro Crítico na otimização: {error_msg}")
        # Return empty list or 500? Use original order fallback to be safe.
        original_ids = [e.get("id") for e in entregas] if 'entregas' in locals() else []
        return jsonify(original_ids), 200

# Vercel requires the app to be exposed as `app`
if __name__ == '__main__':
    app.run(debug=True)
