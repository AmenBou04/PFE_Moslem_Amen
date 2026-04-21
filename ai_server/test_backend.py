import requests
import json

url = "http://localhost:8000/api/alertes"
data = {
    "type": "TEST_PYTHON",
    "gravite": "MOYENNE",
    "description": "Test depuis Python"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Réponse: {response.json()}")
except Exception as e:
    print(f"Erreur: {e}")