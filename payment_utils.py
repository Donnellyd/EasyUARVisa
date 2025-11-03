import hashlib
import hmac
import urllib.parse
import os

def get_payfast_config():
    """Get PayFast configuration from environment"""
    config = {
        'merchant_id': os.environ.get('PAYFAST_MERCHANT_ID', '10000100'),
        'merchant_key': os.environ.get('PAYFAST_MERCHANT_KEY', '46f0cd694581a'),
        'passphrase': os.environ.get('PAYFAST_PASSPHRASE', 'jt7NOE43FZPn'),
        'sandbox': os.environ.get('PAYFAST_SANDBOX', 'true').lower() != 'false',
    }
    config['base_url'] = 'https://sandbox.payfast.co.za/eng/process' if config['sandbox'] else 'https://www.payfast.co.za/eng/process'
    return config

def get_paygate_config():
    """Get PayGate configuration from environment (uses PayFast sandbox infrastructure)"""
    sandbox = os.environ.get('PAYGATE_SANDBOX', 'true').lower() != 'false'
    return {
        'merchant_id': os.environ.get('PAYGATE_ID', '10043233'),
        'merchant_key': os.environ.get('PAYGATE_MERCHANT_KEY', 'ldt9a8d3l0dhe'),
        'passphrase': os.environ.get('PAYGATE_ENCRYPTION_KEY', 'Paygatetest7456'),
        'sandbox': sandbox,
        'base_url': 'https://sandbox.payfast.co.za/eng/process' if sandbox else 'https://www.payfast.co.za/eng/process'
    }

def get_peach_config():
    """Get Peach Payments configuration from environment"""
    test_mode = os.environ.get('PEACH_TEST_MODE', 'true').lower() != 'false'
    return {
        'entity_id': os.environ.get('PEACH_ENTITY_ID', ''),
        'access_token': os.environ.get('PEACH_ACCESS_TOKEN', ''),
        'api_url': 'https://testsecure.peachpayments.com' if test_mode else 'https://secure.peachpayments.com',
        'test_mode': test_mode
    }

def generate_payfast_signature(data, passphrase=None):
    """Generate MD5 signature for PayFast using documented field order - RAW VALUES, NO URL ENCODING"""
    field_order = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'cell_number',
        'm_payment_id', 'amount', 'item_name', 'item_description',
        'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
        'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
        'email_confirmation', 'confirmation_address', 'payment_method',
        'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles'
    ]
    
    params = []
    for key in field_order:
        if key in data and data[key] not in [None, '']:
            value = str(data[key]).strip()
            # Use RAW values for PayFast signature - DO NOT URL encode
            params.append(f"{key}={value}")
    
    param_string = '&'.join(params)
    
    if passphrase:
        # Add passphrase as raw value
        param_string += f"&passphrase={passphrase.strip()}"
    
    signature = hashlib.md5(param_string.encode()).hexdigest()
    print(f"🔐 PayFast Signature: {signature}")
    return signature

def generate_paygate_signature(data, passphrase=None):
    """Generate MD5 signature for PayGate - RAW VALUES, NO URL ENCODING (same as PayFast)"""
    # PayGate uses same field order as PayFast
    field_order = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'cell_number',
        'm_payment_id', 'amount', 'item_name', 'item_description',
        'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
        'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
        'email_confirmation', 'confirmation_address', 'payment_method',
        'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles'
    ]
    
    params = []
    for key in field_order:
        if key in data and data[key] not in [None, '']:
            value = str(data[key]).strip()
            # Use RAW values for PayGate signature - DO NOT URL encode
            params.append(f"{key}={value}")
    
    param_string = '&'.join(params)
    
    if passphrase:
        # Add passphrase as raw value
        param_string += f"&passphrase={passphrase.strip()}"
    
    signature = hashlib.md5(param_string.encode()).hexdigest()
    print(f"🔐 PayGate Signature: {signature}")
    return signature

def generate_peach_signature(params, secret_token):
    """Generate HMAC SHA-256 signature for Peach Payments"""
    sorted_params = '&'.join(f"{k}={v}" for k, v in sorted(params.items()))
    signature = hmac.new(
        secret_token.encode(),
        sorted_params.encode(),
        hashlib.sha256
    ).hexdigest()
    print(f"🔐 Peach Signature: {signature}")
    return signature
