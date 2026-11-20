#!/usr/bin/env python3
"""Prepara una copia del gioco per l'anteprima pubblicata su claude.ai.

L'anteprima accetta solo alcuni tipi di file (html, js, css, json, png, jpg, txt...):
i modelli .glb e .gltf+.bin vengono convertiti in glTF JSON con i dati incorporati
(stesso contenuto, estensione .json). Il gioco li carica uguale: index.html riceve
data-modelli="json" e assets.js cambia l'estensione al volo.

Anche le registrazioni della voce (assets/voce/*.mp3) non passano come file audio: vengono
raccolte in pochi "pacchi" JSON (pacco-N.json, ogni frase in base64), nell'ordine della storia.
indice.json dice in quale pacco sta ogni frase, e narrazione.js scarica il pacco quando serve.

Uso: python3 strumenti/prepara-anteprima.py <cartella-di-uscita>
"""
import base64, json, os, shutil, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', '..', '..', 'anteprima-cameretta'))
SALTA_DIR = {'strumenti'}
SALTA_EST = {'.fbx', '.patch', '.webmanifest', '.mp3'}
PACCO_MAX = 430_000   # byte di MP3 per pacco (circa 600 kB di JSON)
VENDOR_ADDONS = ['loaders/GLTFLoader.js', 'utils/BufferGeometryUtils.js', 'utils/SkeletonUtils.js']


def data_uri(b, mime='application/octet-stream'):
    return 'data:' + mime + ';base64,' + base64.b64encode(b).decode()


def glb_a_json(src):
    b = open(src, 'rb').read()
    assert b[:4] == b'glTF', src
    off, js, binc = 12, None, b''
    while off < len(b):
        ln, tipo = struct.unpack('<II', b[off:off + 8]); dati = b[off + 8:off + 8 + ln]
        if tipo == 0x4E4F534A: js = json.loads(dati)
        elif tipo == 0x004E4942: binc = dati
        off += 8 + ln
    if js.get('buffers'): js['buffers'][0]['uri'] = data_uri(binc)
    return js


def gltf_a_json(src):
    js = json.load(open(src))
    cart = os.path.dirname(src)
    for buf in js.get('buffers', []):
        if 'uri' in buf and not buf['uri'].startswith('data:'):
            buf['uri'] = data_uri(open(os.path.join(cart, buf['uri']), 'rb').read())
    return js


if os.path.exists(OUT): shutil.rmtree(OUT)
for cart, dirs, files in os.walk(ROOT):
    rel = os.path.relpath(cart, ROOT)
    dirs[:] = [d for d in dirs if not (rel == '.' and d in SALTA_DIR)]
    if rel.startswith(os.path.join('vendor', 'three', 'addons')): continue
    for f in files:
        src = os.path.join(cart, f); base, est = os.path.splitext(f)
        dst_dir = os.path.join(OUT, rel); os.makedirs(dst_dir, exist_ok=True)
        if est.lower() in SALTA_EST or (est == '.bin' and os.path.exists(os.path.join(cart, base + '.gltf'))): continue
        if est == '.glb': json.dump(glb_a_json(src), open(os.path.join(dst_dir, base + '.json'), 'w'), separators=(',', ':'))
        elif est == '.gltf': json.dump(gltf_a_json(src), open(os.path.join(dst_dir, base + '.json'), 'w'), separators=(',', ':'))
        elif f == 'LICENSE': shutil.copy(src, os.path.join(dst_dir, 'LICENSE.txt'))
        else: shutil.copy(src, os.path.join(dst_dir, f))
for a in VENDOR_ADDONS:
    d = os.path.join(OUT, 'vendor', 'three', 'addons', a); os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copy(os.path.join(ROOT, 'vendor', 'three', 'addons', a), d)
# la voce: le registrazioni in pacchi JSON, nell'ordine in cui la storia le usa
voce = os.path.join(ROOT, 'assets', 'voce'); vi = os.path.join(voce, 'indice.json')
if os.path.exists(vi):
    ind = json.load(open(vi)); dst = os.path.join(OUT, 'assets', 'voce'); os.makedirs(dst, exist_ok=True)
    pacchi, peso, dove = [{}], 0, {}
    for fid in ind['frasi']:
        b = open(os.path.join(voce, fid + '.mp3'), 'rb').read()
        if peso and peso + len(b) > PACCO_MAX: pacchi.append({}); peso = 0
        pacchi[-1][fid] = base64.b64encode(b).decode(); peso += len(b); dove[fid] = len(pacchi) - 1
    for i, pk in enumerate(pacchi): json.dump(pk, open(os.path.join(dst, 'pacco-%d.json' % i), 'w'), separators=(',', ':'))
    ind['formato'] = 'pacchi'; ind['pacco'] = dove
    json.dump(ind, open(os.path.join(dst, 'indice.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('Voce:', len(dove), 'frasi in', len(pacchi), 'pacchi')
idx = os.path.join(OUT, 'index.html')
s = open(idx).read().replace('<html lang="it">', '<html lang="it" data-modelli="json">', 1)
open(idx, 'w').write(s)
n = sum(len(f) for _, _, f in os.walk(OUT))
print('Anteprima pronta in', OUT, '-', n, 'file')
