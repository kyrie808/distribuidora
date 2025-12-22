import requests
import json

def test_routing():
    # Mock data: 
    # Origin: (0,0) - implicitly or explicitly
    # A: (10, 0)
    # B: (2, 0)
    # C: (5, 0)
    # Expected order from 0: B (2), C (5), A (10)
    
    # We can't easily mock Geocoding without mocking the get_coordinates function inside index.py or mocking the external API.
    # However, we can send real addresses if we knew they would resolve.
    # Or we can just trust the code logic if we can't run it live.
    
    # Let's try to hit the local server. The user sends command "wsl python3 api/index.py".
    # Assuming it's running on localhost:5000 inside WSL, it might be accessible on localhost:5000 or similar.
    
    url = "http://127.0.0.1:5000/api/optimize"
    
    payload = {
        "origin": "Av. Paulista, 1000, Sao Paulo", # Central
        "entregas": [
            {"id": "longa", "endereco": "Rua da Consolação, 3000, Sao Paulo", "cliente_nome": "Longe"}, # Further
            {"id": "perto", "endereco": "Alameda Santos, 50, Sao Paulo", "cliente_nome": "Perto"}    # Closer (Parallel to Paulista)
        ]
    }
    
    print(f"Testing Routing API at {url}...")
    try:
        response = requests.post(url, json=payload, timeout=15)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_routing()
