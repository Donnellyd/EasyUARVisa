from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__)

@app.route('/')
def serve_index():
    return send_file('index.html')

@app.route('/application.html')
def serve_application():
    return send_file('application.html')

@app.route('/status.html')
def serve_status():
    return send_file('status.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)