#!/usr/bin/env python3
"""
Botify API - Python backend for bot ZIP management and processing
Runs on Render.com with Flask
"""

import os
import json
import zipfile
import tempfile
import shutil
from datetime import datetime
from pathlib import Path
from functools import wraps

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Firebase configuration (opcional - remova se não for usar)
try:
    import firebase_admin
    from firebase_admin import credentials, db, storage
    
    FIREBASE_CONFIG = {
        "apiKey": "AIzaSyBglmC1ru_cmEjBlT_LuGNnEOoBO-iOO78",
        "authDomain": "firehx-786aa.firebaseapp.com",
        "databaseURL": "https://firehx-786aa-default-rtdb.firebaseio.com",
        "projectId": "firehx-786aa",
        "storageBucket": "firehx-786aa.appspot.com",
        "messagingSenderId": "504229083597",
        "appId": "1:504229083597:web:eb9435991138c47eb12c84",
    }

    # Initialize Firebase only if credentials are available
    firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
    if firebase_creds:
        creds_dict = json.loads(firebase_creds)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred, {
            'databaseURL': FIREBASE_CONFIG['databaseURL'],
            'storageBucket': FIREBASE_CONFIG['storageBucket']
        })
        print("Firebase initialized successfully")
    else:
        print("Firebase credentials not found - running without Firebase")
except ImportError:
    print("Firebase admin not installed - running without Firebase")
except Exception as e:
    print(f"Firebase initialization failed: {e}")

# Temporary directory for processing
TEMP_DIR = tempfile.gettempdir()
UPLOAD_DIR = os.path.join(TEMP_DIR, 'botify_uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Authentication decorator (simplificado para deploy)
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Basic token validation - expand as needed
        if not token or len(token) < 10:
            return jsonify({'error': 'Invalid token format'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


# Routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Botify API',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/bots/validate-zip', methods=['POST'])
@require_auth
def validate_zip():
    """
    Validate a ZIP file structure
    Expected: multipart/form-data with 'file' field
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        # Save temporarily and validate
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.zip")
        file.save(temp_path)
        
        try:
            # Validate ZIP structure
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                
                # Check if ZIP is valid
                if len(file_list) == 0:
                    return jsonify({'error': 'ZIP file is empty'}), 400
                
                # Get ZIP info
                zip_info = {
                    'files': file_list,
                    'file_count': len(file_list),
                    'size': os.path.getsize(temp_path),
                    'valid': True
                }
                
                return jsonify(zip_info), 200
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except zipfile.BadZipFile:
        return jsonify({'error': 'Invalid ZIP file'}), 400
    except Exception as e:
        return jsonify({'error': f'Error validating ZIP: {str(e)}'}), 500


@app.route('/api/bots/extract-info', methods=['POST'])
@require_auth
def extract_bot_info():
    """
    Extract bot information from ZIP file
    Looks for bot.json or config.json in the root
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.zip")
        file.save(temp_path)
        
        try:
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                bot_info = {}
                
                # Try to read bot.json
                config_files = ['bot.json', 'config.json', 'package.json']
                
                for config_file in config_files:
                    try:
                        with zip_ref.open(config_file) as f:
                            bot_info = json.loads(f.read().decode('utf-8'))
                            break
                    except KeyError:
                        continue
                
                return jsonify({
                    'success': True,
                    'bot_info': bot_info,
                    'files': zip_ref.namelist()
                }), 200
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return jsonify({'error': f'Error extracting info: {str(e)}'}), 500


@app.route('/api/bots/process', methods=['POST'])
@require_auth
def process_bot():
    """
    Process bot ZIP file
    - Validate structure
    - Extract metadata
    - Prepare for storage
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id')
        bot_id = request.form.get('bot_id')
        
        if not user_id or not bot_id:
            return jsonify({'error': 'Missing user_id or bot_id'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.zip")
        file.save(temp_path)
        
        try:
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                # Validate ZIP
                if len(zip_ref.namelist()) == 0:
                    return jsonify({'error': 'ZIP file is empty'}), 400
                
                # Extract metadata
                bot_info = {}
                for config_file in ['bot.json', 'config.json']:
                    try:
                        with zip_ref.open(config_file) as f:
                            bot_info = json.loads(f.read().decode('utf-8'))
                            break
                    except KeyError:
                        continue
                
                # Create processing result
                result = {
                    'success': True,
                    'bot_id': bot_id,
                    'user_id': user_id,
                    'file_size': os.path.getsize(temp_path),
                    'file_count': len(zip_ref.namelist()),
                    'metadata': bot_info,
                    'processed_at': datetime.now().isoformat()
                }
                
                return jsonify(result), 200
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return jsonify({'error': f'Error processing bot: {str(e)}'}), 500


@app.route('/api/bots/<bot_id>/versions', methods=['GET'])
@require_auth
def get_bot_versions(bot_id):
    """Get all versions of a bot"""
    try:
        # Query Firebase for bot versions
        # This would be implemented with actual Firebase queries
        versions = []
        
        return jsonify({
            'bot_id': bot_id,
            'versions': versions
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error getting versions: {str(e)}'}), 500


@app.route('/api/bots/<bot_id>/update', methods=['POST'])
@require_auth
def update_bot(bot_id):
    """Update bot with new ZIP file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Missing user_id'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        # Verify user owns the bot
        # This would be implemented with Firebase queries
        
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.zip")
        file.save(temp_path)
        
        try:
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                if len(zip_ref.namelist()) == 0:
                    return jsonify({'error': 'ZIP file is empty'}), 400
                
                result = {
                    'success': True,
                    'bot_id': bot_id,
                    'version': datetime.now().isoformat(),
                    'file_size': os.path.getsize(temp_path),
                    'file_count': len(zip_ref.namelist())
                }
                
                return jsonify(result), 200
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return jsonify({'error': f'Error updating bot: {str(e)}'}), 500


@app.route('/api/bots/<bot_id>/download', methods=['GET'])
def download_bot(bot_id):
    """Download bot ZIP file"""
    try:
        # Get bot from Firebase Storage
        # This would be implemented with actual Firebase Storage operations
        
        return jsonify({'error': 'Bot not found'}), 404
    
    except Exception as e:
        return jsonify({'error': f'Error downloading bot: {str(e)}'}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get API statistics"""
    try:
        stats = {
            'total_bots': 0,
            'total_users': 0,
            'total_downloads': 0,
            'api_version': '1.0.0',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': f'Error getting stats: {str(e)}'}), 500


@app.route('/api/python-api', methods=['POST'])
@require_auth
def handle_python_api():
    """
    Handle Python API code submission
    Users can submit Python code to be executed for their bot API
    """
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({'error': 'No code provided'}), 400
        
        bot_id = data.get('bot_id')
        user_id = data.get('user_id')
        code = data.get('code')
        
        if not bot_id or not user_id:
            return jsonify({'error': 'Missing bot_id or user_id'}), 400
        
        # Validate Python code (basic syntax check)
        try:
            compile(code, '<string>', 'exec')
        except SyntaxError as e:
            return jsonify({'error': f'Syntax error in code: {str(e)}'}), 400
        
        # Store code in Firebase
        # This would be implemented with actual Firebase operations
        
        result = {
            'success': True,
            'bot_id': bot_id,
            'message': 'Python API code saved successfully',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': f'Error handling Python API: {str(e)}'}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


# Rota principal para servir o frontend
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Servir arquivos estáticos
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
