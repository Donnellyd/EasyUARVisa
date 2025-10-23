from flask import Flask, send_from_directory, send_file, make_response
import os

app = Flask(__name__)

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

@app.route('/<path:filename>')
def serve_static(filename):
    response = make_response(send_from_directory('.', filename))
    return add_no_cache_headers(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)