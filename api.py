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

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db, storage
import requests

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Firebase configuration
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyBglmC1ru_cmEjBlT_LuGNnEOoBO-iOO78",
    "authDomain": "firehx-786aa.firebaseapp.com",
    "databaseURL": "https://firehx-786aa-default-rtdb.firebaseio.com",
    "projectId": "firehx-786aa",
    "storageBucket": "firehx-786aa.appspot.com",
    "messagingSenderId": "504229083597",
    "appId": "1:504229083597:web:eb9435991138c47eb12c84",
}

# Initialize Firebase Admin SDK
try:
    # Check if Firebase is already initialized
    firebase_admin.get_app()
except ValueError:
    # Initialize Firebase with credentials
    # For Render, use environment variable for credentials
    firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
    if firebase_creds:
        creds_dict = json.loads(firebase_creds)
        creds = credentials.Certificate(creds_dict)
    else:
        # Fallback: use service account file if it exists
        if os.path.exists('serviceAccountKey.json'):
            creds = credentials.Certificate('serviceAccountKey.json')
        else:
            # For development without credentials
            print("Warning: Firebase credentials not found. Some features may not work.")
            creds = None
    
    if creds:
        firebase_admin.initialize_app(creds, {
            'databaseURL': FIREBASE_CONFIG['databaseURL'],
            'storageBucket': FIREBASE_CONFIG['storageBucket']
        })

# Temporary directory for processing
TEMP_DIR = tempfile.gettempdir()
UPLOAD_DIR = os.path.join(TEMP_DIR, 'botify_uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Verify token with Firebase
        try:
            # For now, we'll accept any token
            # In production, verify with Firebase Auth
            pass
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
        
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


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
