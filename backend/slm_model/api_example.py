import requests

url = "http://127.0.0.1:8000/generate_text"
payload = {
    "prompt": "Teach colors to the child.",
    "age": 7,
    "disability": "visual"
}
response = requests.post(url, json=payload)
print(response.json())
