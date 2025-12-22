import requests
import json

url = "http://127.0.0.1:5000/api/optimize"
payload = {
    "entregas": [
        {"id": "1", "endereco": "Rua A, 1", "bairro": "B", "cliente_nome": "C"},
        {"id": "2", "endereco": "Rua B, 2", "bairro": "B", "cliente_nome": "D"}
    ]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
