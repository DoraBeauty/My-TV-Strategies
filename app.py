from flask import Flask, render_template
import requests

app = Flask(__name__)

@app.route('/')
def index():
    api_url = "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=0"
    error_message = None
    games = []

    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data:
            games = data
    except requests.exceptions.RequestException as e:
        error_message = "無法獲取限免遊戲清單，請稍後再試。"
        print(f"API Error: {e}")

    return render_template('index.html', games=games, error_message=error_message)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
