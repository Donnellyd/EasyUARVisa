from flask import Flask, send_from_directory, send_file, make_response, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

# Dubai VISA AI configuration
DUBAI_VISA_API_URL = 'https://dubai-visa-ai-duane16.replit.app'
DUBAI_VISA_API_KEY = os.environ.get('DUBAI_VISA_API_KEY', '365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059')

def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/')
def serve_index():
    response = make_response(send_file('index.html'))
    return add_no_cache_headers(response)

@app.route('/application.html')
def serve_application():
    response = make_response(send_file('application.html'))
    return add_no_cache_headers(response)

@app.route('/status.html')
def serve_status():
    response = make_response(send_file('status.html'))
    return add_no_cache_headers(response)

@app.route('/payment.html')
def serve_payment():
    response = make_response(send_file('payment.html'))
    return add_no_cache_headers(response)

@app.route('/payment-success.html')
def serve_payment_success():
    response = make_response(send_file('payment-success.html'))
    return add_no_cache_headers(response)

# Proxy payment API requests to Node backend
@app.route('/api/payments/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_payment_api(path):
    backend_url = f'http://localhost:3000/api/payments/{path}'
    
    if request.method == 'GET':
        resp = requests.get(backend_url, params=request.args.to_dict())
    elif request.method == 'POST':
        resp = requests.post(backend_url, json=request.get_json(), headers={'Content-Type': 'application/json'})
    elif request.method == 'PUT':
        resp = requests.put(backend_url, json=request.get_json(), headers={'Content-Type': 'application/json'})
    else:  # DELETE
        resp = requests.delete(backend_url)
    
    return resp.content, resp.status_code, {'Content-Type': resp.headers.get('Content-Type', 'application/json')}

# Proxy Dubai VISA AI API requests
@app.route('/api/visa/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_visa_api(path):
    backend_url = f'{DUBAI_VISA_API_URL}/api/website/{path}'
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': DUBAI_VISA_API_KEY
    }
    
    try:
        if request.method == 'GET':
            resp = requests.get(backend_url, params=request.args.to_dict(), headers=headers, timeout=10)
        elif request.method == 'POST':
            resp = requests.post(backend_url, json=request.get_json(), headers=headers, timeout=10)
        elif request.method == 'PUT':
            resp = requests.put(backend_url, json=request.get_json(), headers=headers, timeout=10)
        else:  # DELETE
            resp = requests.delete(backend_url, headers=headers, timeout=10)
        
        return resp.content, resp.status_code, {'Content-Type': resp.headers.get('Content-Type', 'application/json')}
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    response = make_response(send_from_directory('.', filename))
    return add_no_cache_headers(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)