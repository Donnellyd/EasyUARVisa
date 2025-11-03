from flask import Flask, send_from_directory, send_file, make_response, request, jsonify
from app import app, db
from models import Payment
from payment_utils import (
    get_payfast_config, get_paygate_config, get_peach_config,
    generate_payfast_signature, generate_paygate_checksum, generate_peach_signature
)
import os
import requests
from datetime import datetime
from sqlalchemy.exc import IntegrityError

def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/health')
def health_check():
    """Health check endpoint for deployment"""
    return jsonify({'status': 'healthy', 'service': 'UAE Visa Portal'}), 200

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

@app.route('/paygate-return.html')
def serve_paygate_return():
    response = make_response(send_file('paygate-return.html'))
    return add_no_cache_headers(response)

@app.route('/peach-return.html')
def serve_peach_return():
    response = make_response(send_file('peach-return.html'))
    return add_no_cache_headers(response)

@app.route('/api/payments/start', methods=['POST'])
def start_payment():
    """Initiate PayFast payment"""
    try:
        data = request.get_json()
        print(f'💳 Payment request received: {data}')
        
        application_id = data.get('application_id')
        applicant_name = data.get('applicant_name')
        applicant_email = data.get('applicant_email')
        amount = data.get('amount')
        country = data.get('country', 'Unknown')
        description = data.get('description', 'UAE Visa Application Fee')
        
        if not all([application_id, applicant_name, applicant_email, amount]):
            return jsonify({
                'error': 'Missing required fields: application_id, applicant_name, applicant_email, amount'
            }), 400
        
        clean_name = applicant_name.strip()
        clean_email = applicant_email.strip()
        
        name_parts = [p for p in clean_name.split() if p]
        first_name = name_parts[0] if name_parts else clean_name
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else clean_name
        
        reference = f"UAE-PAY-{int(datetime.now().timestamp() * 1000)}"
        
        config = get_payfast_config()
        
        app_base_url = os.environ.get('REPLIT_DEV_DOMAIN')
        if app_base_url:
            app_base_url = f"https://{app_base_url}"
        else:
            app_base_url = 'http://localhost:5000'
        
        payment_data = {
            'merchant_id': config['merchant_id'],
            'merchant_key': config['merchant_key'],
            'name_first': first_name,
            'name_last': last_name,
            'email_address': clean_email,
            'm_payment_id': reference,
            'amount': f"{float(amount):.2f}",
            'item_name': description,
            'item_description': f"{description} - {application_id}",
            'return_url': f"{app_base_url}/payment-success.html?ref={reference}",
            'cancel_url': f"{app_base_url}/payment.html?ref={application_id}&name={applicant_name}&email={applicant_email}&amount={amount}",
            'notify_url': f"{app_base_url}/api/payments/verify",
            'custom_str1': application_id,
            'custom_str2': country
        }
        
        payment_data['signature'] = generate_payfast_signature(payment_data, config['passphrase'])
        
        payment = Payment()
        payment.reference = reference
        payment.application_id = application_id
        payment.amount = float(amount)
        payment.currency = 'ZAR'
        payment.email = clean_email
        payment.name = applicant_name
        payment.country = country
        payment.status = 'pending'
        
        db.session.add(payment)
        db.session.commit()
        
        print(f'✅ Payment initiated: {reference}')
        
        return jsonify({
            'success': True,
            'paymentUrl': config['base_url'],
            'formData': payment_data,
            'reference': reference,
            'gateway': 'payfast',
            'sandbox': config['sandbox']
        })
        
    except Exception as e:
        print(f'❌ Payment start error: {str(e)}')
        db.session.rollback()
        return jsonify({
            'error': 'Failed to initiate payment',
            'detail': str(e)
        }), 500

@app.route('/api/payments/verify', methods=['POST'])
def verify_payment():
    """PayFast ITN (Instant Transaction Notification)"""
    try:
        print('📡 Payment verification callback received')
        data = request.form.to_dict()
        print(f'Body: {data}')
        
        config = get_payfast_config()
        
        received_signature = data.pop('signature', None)
        calculated_signature = generate_payfast_signature(data, config['passphrase'])
        
        if received_signature != calculated_signature:
            print('❌ Invalid signature')
            return 'Invalid signature', 400
        
        reference = data.get('m_payment_id')
        payment_status = data.get('payment_status')
        payment_id = data.get('pf_payment_id')
        
        status = 'pending'
        if payment_status == 'COMPLETE':
            status = 'paid'
        elif payment_status == 'FAILED':
            status = 'failed'
        elif payment_status == 'CANCELLED':
            status = 'cancelled'
        
        payment = Payment.query.filter_by(reference=reference).first()
        if payment:
            payment.status = status
            payment.payment_id = payment_id
            payment.updated_at = datetime.utcnow()
            db.session.commit()
            print(f'✅ Payment updated: {reference} -> {status}')
        
        return 'OK', 200
        
    except Exception as e:
        print(f'❌ Payment verification error: {str(e)}')
        db.session.rollback()
        return 'Error', 500

@app.route('/api/payments/status/<reference>', methods=['GET'])
def get_payment_status(reference):
    """Get payment status by reference"""
    try:
        payment = Payment.query.filter_by(reference=reference).first()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        return jsonify(payment.to_dict())
        
    except Exception as e:
        print(f'❌ Get payment status error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/paygate/initiate', methods=['POST'])
def initiate_paygate():
    """Initiate PayGate payment"""
    try:
        data = request.get_json()
        print(f'💳 PayGate request received: {data}')
        
        application_id = data.get('application_id')
        applicant_name = data.get('applicant_name')
        applicant_email = data.get('applicant_email')
        amount = data.get('amount')
        country = data.get('country', 'Unknown')
        
        if not all([application_id, applicant_name, applicant_email, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        reference = f"UAE-PAY-{int(datetime.now().timestamp() * 1000)}"
        
        config = get_paygate_config()
        
        app_base_url = os.environ.get('REPLIT_DEV_DOMAIN')
        if app_base_url:
            app_base_url = f"https://{app_base_url}"
        else:
            app_base_url = 'http://localhost:5000'
        
        amount_cents = int(float(amount) * 100)
        
        initiate_data = {
            'PAYGATE_ID': config['paygate_id'],
            'REFERENCE': reference,
            'AMOUNT': str(amount_cents),
            'CURRENCY': 'ZAR',
            'RETURN_URL': f"{app_base_url}/paygate-return.html",
            'TRANSACTION_DATE': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'LOCALE': 'en-za',
            'COUNTRY': 'ZAF',
            'EMAIL': applicant_email
        }
        
        initiate_data['CHECKSUM'] = generate_paygate_checksum(initiate_data, config['encryption_key'])
        
        payment = Payment()
        payment.reference = reference
        payment.application_id = application_id
        payment.amount = float(amount)
        payment.currency = 'ZAR'
        payment.email = applicant_email
        payment.name = applicant_name
        payment.country = country
        payment.status = 'pending'
        
        db.session.add(payment)
        db.session.commit()
        
        print(f'📤 Sending to PayGate: {initiate_data}')
        response = requests.post(config['initiate_url'], data=initiate_data)
        
        print(f'📥 PayGate Response Status: {response.status_code}')
        print(f'📥 PayGate Response Text: {response.text}')
        
        result = dict(item.split('=') for item in response.text.split('&'))
        
        if result.get('PAY_REQUEST_ID'):
            payment_url = f"{config['process_url']}?PAY_REQUEST_ID={result['PAY_REQUEST_ID']}"
            return jsonify({
                'success': True,
                'paymentUrl': payment_url,
                'reference': reference,
                'gateway': 'paygate'
            })
        else:
            return jsonify({'error': 'PayGate initiation failed', 'detail': result}), 500
        
    except Exception as e:
        print(f'❌ PayGate initiation error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/peach/initiate', methods=['POST'])
def create_peach_checkout():
    """Create Peach Payments checkout"""
    try:
        data = request.get_json()
        print(f'💳 Peach Payments request received: {data}')
        
        application_id = data.get('application_id')
        applicant_name = data.get('applicant_name')
        applicant_email = data.get('applicant_email')
        amount = data.get('amount')
        country = data.get('country', 'Unknown')
        
        if not all([application_id, applicant_name, applicant_email, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        reference = f"UAE-PAY-{int(datetime.now().timestamp() * 1000)}"
        
        config = get_peach_config()
        
        if not config['entity_id'] or not config['access_token']:
            return jsonify({'error': 'Peach Payments not configured'}), 500
        
        app_base_url = os.environ.get('REPLIT_DEV_DOMAIN')
        if app_base_url:
            app_base_url = f"https://{app_base_url}"
        else:
            app_base_url = 'http://localhost:5000'
        
        checkout_data = {
            'entityId': config['entity_id'],
            'amount': f"{float(amount):.2f}",
            'currency': 'ZAR',
            'paymentType': 'DB',
            'merchantTransactionId': reference,
            'customer.email': applicant_email,
            'customer.givenName': applicant_name.split()[0] if applicant_name.split() else applicant_name,
            'customer.surname': ' '.join(applicant_name.split()[1:]) if len(applicant_name.split()) > 1 else applicant_name,
            'customParameters[SHOPPER_applicationId]': application_id,
            'shopperResultUrl': f"{app_base_url}/peach-return.html"
        }
        
        headers = {
            'Authorization': f"Bearer {config['access_token']}",
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        payment = Payment()
        payment.reference = reference
        payment.application_id = application_id
        payment.amount = float(amount)
        payment.currency = 'ZAR'
        payment.email = applicant_email
        payment.name = applicant_name
        payment.country = country
        payment.status = 'pending'
        
        db.session.add(payment)
        db.session.commit()
        
        response = requests.post(
            f"{config['api_url']}/v1/checkouts",
            data=checkout_data,
            headers=headers
        )
        
        result = response.json()
        
        if result.get('id'):
            payment_url = f"{config['api_url']}/v1/paymentWidgets.js?checkoutId={result['id']}"
            return jsonify({
                'success': True,
                'paymentUrl': payment_url,
                'checkoutId': result['id'],
                'reference': reference,
                'gateway': 'peach',
                'testMode': config['test_mode']
            })
        else:
            return jsonify({'error': 'Peach checkout creation failed', 'detail': result}), 500
        
    except Exception as e:
        print(f'❌ Peach checkout error: {str(e)}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    response = make_response(send_from_directory('.', filename))
    return add_no_cache_headers(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
