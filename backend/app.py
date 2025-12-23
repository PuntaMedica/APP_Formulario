# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import io
import zipfile
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
EXCEL_FILE   = 'records.xlsx'

# --- Ruta para subir un PDF y asignar número automáticamente ---
@app.route('/upload', methods=['POST'])
def upload():
    f = request.files.get('file')
    if not f:
        return jsonify({'error': 'No se recibió archivo'}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # 1) Cuenta cuántos formularios ya existen
    existing = [
        fn for fn in os.listdir(UPLOAD_FOLDER)
        if fn.endswith('_Formulario.pdf')
    ]
    next_num = len(existing) + 1

    # 2) Guarda con nombre "<número>_Formulario.pdf"
    fname = f"{next_num}_Formulario.pdf"
    path = os.path.join(UPLOAD_FOLDER, fname)
    f.save(path)

    # 3) Registra en el Excel
    ts = datetime.now().isoformat()
    if os.path.exists(EXCEL_FILE):
        df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
    else:
        df = pd.DataFrame(columns=['numero','filename','uploaded_at'])

    new = pd.DataFrame([{
        'numero': next_num,
        'filename': fname,
        'uploaded_at': ts
    }])
    df = pd.concat([df, new], ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False, engine='openpyxl')

    return jsonify({'status':'ok','numero': next_num}), 200


# --- Ruta para listar documentos subidos ---
@app.route('/files', methods=['GET'])
def list_files():
    if os.path.exists(EXCEL_FILE):
        df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
        return jsonify(df[['numero','filename']].to_dict(orient='records'))
    return jsonify([])


# --- Ruta para descargar rangos, todos o seleccionados en ZIP ---
@app.route('/download', methods=['GET', 'POST'])
def download():
    # Determina qué archivos incluir
    if request.method == 'GET':
        start = request.args.get('start')
        if start == 'all':
            df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
            filenames = df['filename'].tolist()
        else:
            s = int(request.args.get('start', 0))
            e = int(request.args.get('end', 0))
            df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
            filenames = df[(df['numero']>=s)&(df['numero']<=e)]['filename'].tolist()

    else:  # POST: JSON con lista de números
        numeros = request.json.get('numeros', [])
        df = pd.read_excel(EXCEL_FILE, engine='openpyxl')
        filenames = df[df['numero'].isin(numeros)]['filename'].tolist()

    # Empaqueta en un ZIP en memoria
    mem = io.BytesIO()
    with zipfile.ZipFile(mem, 'w', zipfile.ZIP_DEFLATED) as z:
        for fn in filenames:
            full_path = os.path.join(UPLOAD_FOLDER, fn)
            if os.path.exists(full_path):
                z.write(full_path, arcname=fn)
    mem.seek(0)

    return send_file(
        mem,
        download_name='documentos.zip',
        as_attachment=True,
        mimetype='application/zip'
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6200, debug=True)
