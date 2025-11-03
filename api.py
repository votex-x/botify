#!/usr/bin/env python3
"""
Botify API - Catálogo Público de Bots
Com Firebase Storage e Realtime Database
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
import firebase_admin
from firebase_admin import credentials, db, storage

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
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

# Initialize Firebase
try:
    firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
    if firebase_creds:
        creds_dict = json.loads(firebase_creds)
        cred = credentials.Certificate(creds_dict)
        firebase_app = firebase_admin.initialize_app(cred, {
            'databaseURL': FIREBASE_CONFIG['databaseURL'],
            'storageBucket': FIREBASE_CONFIG['storageBucket']
        })
        print("✅ Firebase inicializado com sucesso!")
        
        # Get database and storage references
        database_ref = db.reference()
        storage_bucket = storage.bucket()
    else:
        raise Exception("Credenciais do Firebase não encontradas")
except Exception as e:
    print(f"❌ Erro ao inicializar Firebase: {e}")
    raise e

# Temporary directory for processing
TEMP_DIR = tempfile.gettempdir()
UPLOAD_DIR = os.path.join(TEMP_DIR, 'botify_uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Authentication decorator - AGORA PÚBLICO!
def public_access(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Aceita qualquer requisição - catálogo público
        return f(*args, **kwargs)
    return decorated_function

# Routes

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Botify Catalog',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/bots/validate-zip', methods=['POST'])
@public_access
def validate_zip():
    """Validate ZIP file structure"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.zip")
        file.save(temp_path)
        
        try:
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                
                if len(file_list) == 0:
                    return jsonify({'error': 'ZIP file is empty'}), 400
                
                zip_info = {
                    'files': file_list,
                    'file_count': len(file_list),
                    'size': os.path.getsize(temp_path),
                    'valid': True
                }
                
                return jsonify(zip_info), 200
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except zipfile.BadZipFile:
        return jsonify({'error': 'Invalid ZIP file'}), 400
    except Exception as e:
        return jsonify({'error': f'Error validating ZIP: {str(e)}'}), 500

@app.route('/api/bots/publish', methods=['POST'])
@public_access
def publish_bot():
    """Publica um bot no catálogo (AGORA PÚBLICO!)"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        bot_name = request.form.get('bot_name', 'Unnamed Bot')
        description = request.form.get('description', 'No description')
        author = request.form.get('author', 'Anonymous')
        tags = request.form.get('tags', '')
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a ZIP archive'}), 400
        
        # Generate unique bot ID
        bot_id = f"bot_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{bot_id}.zip")
        file.save(temp_path)
        
        try:
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                if len(zip_ref.namelist()) == 0:
                    return jsonify({'error': 'ZIP file is empty'}), 400
                
                # Extract bot info from config files
                bot_info = {}
                config_files = ['bot.json', 'config.json', 'package.json']
                
                for config_file in config_files:
                    try:
                        with zip_ref.open(config_file) as f:
                            bot_info = json.loads(f.read().decode('utf-8'))
                            break
                    except KeyError:
                        continue
                
                # Upload to Firebase Storage
                storage_path = f"bots/{bot_id}.zip"
                blob = storage_bucket.blob(storage_path)
                blob.upload_from_filename(temp_path)
                
                # Make the file publicly accessible
                blob.make_public()
                download_url = blob.public_url
                
                # Create bot data for database
                bot_data = {
                    'id': bot_id,
                    'name': bot_name,
                    'description': description,
                    'author': author,
                    'tags': tags.split(',') if tags else [],
                    'download_url': download_url,
                    'file_size': os.path.getsize(temp_path),
                    'file_count': len(zip_ref.namelist()),
                    'metadata': bot_info,
                    'downloads': 0,
                    'rating': 0,
                    'ratings_count': 0,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                # Save to Firebase Realtime Database
                bots_ref = database_ref.child('bots')
                bots_ref.child(bot_id).set(bot_data)
                
                return jsonify({
                    'success': True,
                    'message': 'Bot publicado com sucesso!',
                    'bot_id': bot_id,
                    'bot_data': bot_data
                }), 200
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return jsonify({'error': f'Error publishing bot: {str(e)}'}), 500

@app.route('/api/bots', methods=['GET'])
@public_access
def get_all_bots():
    """Obtém todos os bots do catálogo"""
    try:
        bots_ref = database_ref.child('bots')
        bots_data = bots_ref.get()
        
        if not bots_data:
            return jsonify({'bots': []}), 200
        
        # Convert to list
        bots_list = []
        for bot_id, bot_data in bots_data.items():
            if bot_data:
                bot_data['id'] = bot_id
                bots_list.append(bot_data)
        
        # Sort by creation date (newest first)
        bots_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'bots': bots_list,
            'count': len(bots_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error getting bots: {str(e)}'}), 500

@app.route('/api/bots/<bot_id>', methods=['GET'])
@public_access
def get_bot(bot_id):
    """Obtém um bot específico"""
    try:
        bot_ref = database_ref.child('bots').child(bot_id)
        bot_data = bot_ref.get()
        
        if not bot_data:
            return jsonify({'error': 'Bot not found'}), 404
        
        bot_data['id'] = bot_id
        return jsonify({'success': True, 'bot': bot_data}), 200
    
    except Exception as e:
        return jsonify({'error': f'Error getting bot: {str(e)}'}), 500

@app.route('/api/bots/<bot_id>/download', methods=['POST'])
@public_access
def download_bot(bot_id):
    """Incrementa contador de downloads e retorna URL"""
    try:
        bot_ref = database_ref.child('bots').child(bot_id)
        bot_data = bot_ref.get()
        
        if not bot_data:
            return jsonify({'error': 'Bot not found'}), 404
        
        # Increment download count
        current_downloads = bot_data.get('downloads', 0)
        bot_ref.update({
            'downloads': current_downloads + 1,
            'updated_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'download_url': bot_data.get('download_url'),
            'bot_name': bot_data.get('name')
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error downloading bot: {str(e)}'}), 500

@app.route('/api/bots/<bot_id>/rate', methods=['POST'])
@public_access
def rate_bot(bot_id):
    """Avalia um bot"""
    try:
        data = request.get_json()
        rating = data.get('rating')
        
        if not rating or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        bot_ref = database_ref.child('bots').child(bot_id)
        bot_data = bot_ref.get()
        
        if not bot_data:
            return jsonify({'error': 'Bot not found'}), 404
        
        current_rating = bot_data.get('rating', 0)
        current_count = bot_data.get('ratings_count', 0)
        
        # Calculate new average rating
        new_rating = ((current_rating * current_count) + rating) / (current_count + 1)
        
        bot_ref.update({
            'rating': round(new_rating, 1),
            'ratings_count': current_count + 1,
            'updated_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'new_rating': round(new_rating, 1),
            'ratings_count': current_count + 1
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error rating bot: {str(e)}'}), 500

@app.route('/api/bots/search', methods=['GET'])
@public_access
def search_bots():
    """Busca bots por nome, tags ou descrição"""
    try:
        query = request.args.get('q', '').lower()
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        bots_ref = database_ref.child('bots')
        bots_data = bots_ref.get()
        
        if not bots_data:
            return jsonify({'bots': []}), 200
        
        results = []
        for bot_id, bot_data in bots_data.items():
            if not bot_data:
                continue
                
            # Search in name, description, tags, and author
            searchable_text = f"""
            {bot_data.get('name', '').lower()}
            {bot_data.get('description', '').lower()}
            {bot_data.get('author', '').lower()}
            {' '.join(bot_data.get('tags', [])).lower()}
            """
            
            if query in searchable_text:
                bot_data['id'] = bot_id
                results.append(bot_data)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error searching bots: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
@public_access
def get_stats():
    """Estatísticas do catálogo"""
    try:
        bots_ref = database_ref.child('bots')
        bots_data = bots_ref.get()
        
        total_bots = len(bots_data) if bots_data else 0
        total_downloads = 0
        total_ratings = 0
        
        if bots_data:
            for bot_data in bots_data.values():
                if bot_data:
                    total_downloads += bot_data.get('downloads', 0)
                    total_ratings += bot_data.get('ratings_count', 0)
        
        return jsonify({
            'success': True,
            'stats': {
                'total_bots': total_bots,
                'total_downloads': total_downloads,
                'total_ratings': total_ratings,
                'average_rating': round(total_ratings / total_bots, 1) if total_bots > 0 else 0
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error getting stats: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Serve frontend
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
