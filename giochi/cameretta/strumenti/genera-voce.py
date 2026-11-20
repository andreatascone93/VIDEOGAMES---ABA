#!/usr/bin/env python3
"""Registra le frasi dell'episodio (narratrice e personaggi) con una voce naturale.

Usa Kokoro-82M (licenza Apache-2.0), che gira in locale: nessun testo esce dal computer.
Le frasi si leggono da js/testi.js (tramite strumenti/frasi.mjs): ogni frase diventa un MP3 in assets/voce,
chiamato con l'impronta di (voce + testo). Si registrano solo le frasi che mancano; quelle non più usate si tolgono.

Preparazione (una volta):
  pip install kokoro-onnx soundfile numpy            (più sherpa-onnx per --verifica)
  scaricare kokoro-v1.0.onnx e voices-v1.0.bin dalle release di github.com/thewh1teagle/kokoro-onnx
  servono anche node e ffmpeg

Uso:
  python3 strumenti/genera-voce.py --modelli <cartella dei modelli> [--nome Francesco] [--rifai] [--verifica <cartella whisper>]

Le voci dei personaggi nascono dalle due voci italiane di Kokoro (if_sara, im_nicola): quelle dei bambini e della mamma
sono ottenute mescolandole e spostando l'altezza (sintesi più lenta, poi riproduzione più veloce: nessun artefatto).
Per cambiare una voce basta toccare la tabella VOCI e rilanciare con --rifai.
"""
import argparse, difflib, json, os, re, subprocess, sys
import numpy as np

QUI = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(QUI)
USCITA = os.path.join(ROOT, 'assets', 'voce')
SR = 24000

# chi parla → miscela di voci, altezza (1 = naturale, >1 più acuta e "piccola"), velocità finale
VOCI = {
    'n':      {'miscela': {'if_sara': 1},                     'tono': 1.00, 'velocita': 0.92},   # la narratrice: calma, accogliente
    'mamma':  {'miscela': {'if_sara': 1},                     'tono': 0.93, 'velocita': 1.00},
    'papa':   {'miscela': {'im_nicola': 1},                   'tono': 1.00, 'velocita': 0.97},
    'f':      {'miscela': {'if_sara': .7, 'im_nicola': .3},   'tono': 1.20, 'velocita': 1.00},   # Francesco, 9 anni
    'leo':    {'miscela': {'if_sara': .8, 'im_nicola': .2},   'tono': 1.27, 'velocita': 1.04},
    'giulia': {'miscela': {'if_sara': 1},                     'tono': 1.26, 'velocita': 1.03},
}
VERSIONE = 1   # cambia per rifare tutte le registrazioni dopo aver toccato la tabella


def per_la_voce(t):
    """Il testo come va detto: senza virgolette e parentesi, con le esclamazioni allungate rese dicibili."""
    t = re.sub(r'[«»()]', '', t)
    t = re.sub(r'^\s*(…|\.\.\.)\s*', '', t)      # i puntini in testa diventano un suono: si tolgono
    t = t.replace('…', '... ')
    t = re.sub(r'ì{2,}', 'ì', t)
    return re.sub(r'\s+', ' ', t).strip()


def sposta_tono(a, r):
    if abs(r - 1) < 1e-3: return a
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(round(SR * r)), '-ac', '1', '-i', '-', '-ar', str(SR), '-f', 'f32le', '-'],
                       input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def rifinisci(a):
    """Toglie il silenzio ai bordi e porta tutte le frasi allo stesso volume."""
    forte = np.where(np.abs(a) > 0.012)[0]
    if len(forte): a = a[max(0, forte[0] - int(.05 * SR)):min(len(a), forte[-1] + int(.16 * SR))]
    finestra = int(.05 * SR); pezzi = [a[i:i + finestra] for i in range(0, max(1, len(a) - finestra), finestra)]
    rms = np.array([np.sqrt((p ** 2).mean()) for p in pezzi]); parlato = rms[rms > rms.max() * .15]
    a = a * (0.085 / max(1e-6, float(np.sqrt((parlato ** 2).mean()))))
    a = np.tanh(a * 1.15) / 1.15 * 1.0          # i picchi si arrotondano invece di tagliarsi
    n = int(.008 * SR); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)
    return a.astype(np.float32)


def mp3(a, dst):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '48k', '-ar', str(SR), dst],
                   input=a.tobytes(), check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--modelli', required=True); ap.add_argument('--nome', default=None)
    ap.add_argument('--rifai', action='store_true'); ap.add_argument('--verifica', default=None)
    ap.add_argument('--solo', default=None, help='con --rifai: rifà solo questa voce (n, mamma, papa, f, leo, giulia)')
    o = ap.parse_args()
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(o.modelli, 'kokoro-v1.0.onnx'), os.path.join(o.modelli, 'voices-v1.0.bin'))
    elenco = json.loads(subprocess.run(['node', os.path.join(QUI, 'frasi.mjs')] + ([o.nome] if o.nome else []), capture_output=True, check=True, text=True).stdout)
    frasi = elenco['frasi']; os.makedirs(USCITA, exist_ok=True)
    idx_path = os.path.join(USCITA, 'indice.json')
    vecchio = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    rifai_tutto = vecchio.get('versione') != VERSIONE
    stili = {chi: sum(k.get_voice_style(v) * p for v, p in c['miscela'].items()).astype(np.float32) for chi, c in VOCI.items()}
    ascolta = None
    if o.verifica:
        import sherpa_onnx
        M = o.verifica.rstrip('/') + '/'
        rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'small-encoder.int8.onnx', decoder=M + 'small-decoder.int8.onnx', tokens=M + 'small-tokens.txt', language='it', task='transcribe', num_threads=4)
        def ascolta(a):
            n = int(len(a) * 16000 / SR); b = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
            s = rec.create_stream(); s.accept_waveform(16000, b); rec.decode_stream(s); return s.result.text.strip()
    parole = lambda s: re.sub(r'[^a-zàèéìòù0-9 ]', ' ', s.lower()).split()
    durate, dubbi, nuove = {}, [], 0
    for i, f in enumerate(frasi):
        dst = os.path.join(USCITA, f['id'] + '.mp3'); c = VOCI[f['chi']]
        fatta = os.path.exists(dst) and f['id'] in vecchio.get('frasi', {})
        if fatta and not rifai_tutto and not (o.rifai and (not o.solo or o.solo == f['chi'])):
            durate[f['id']] = vecchio['frasi'][f['id']]; continue
        testo = per_la_voce(f['testo'])
        a, sr = k.create(testo, voice=stili[f['chi']], speed=c['velocita'] / c['tono'], lang='it'); assert sr == SR
        a = rifinisci(sposta_tono(a, c['tono'])); mp3(a, dst); durate[f['id']] = round(len(a) / SR, 2); nuove += 1
        riga = f"[{i + 1}/{len(frasi)}] {f['chi']:6s} {durate[f['id']]:5.1f}s  {f['testo'][:70]}"
        if ascolta:
            sentito = ascolta(a); sim = difflib.SequenceMatcher(None, parole(testo), parole(sentito)).ratio()
            if sim < .86: dubbi.append((f, sentito, sim)); riga += f'   ?? {sim:.2f}'
        print(riga, flush=True)
    for nome in os.listdir(USCITA):
        if nome.endswith('.mp3') and nome[:-4] not in durate: os.remove(os.path.join(USCITA, nome)); print('tolta', nome)
    json.dump({'nome': elenco['nome'], 'formato': 'mp3', 'versione': VERSIONE, 'voci': VOCI, 'frasi': durate}, open(idx_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    tot = sum(durate.values()); peso = sum(os.path.getsize(os.path.join(USCITA, x)) for x in os.listdir(USCITA) if x.endswith('.mp3'))
    print(f'\n{len(durate)} frasi ({nuove} nuove), {tot / 60:.1f} minuti, {peso / 1e6:.1f} MB')
    if dubbi:
        print('\nDa riascoltare (la trascrizione automatica non coincide con il testo):')
        for f, sentito, sim in dubbi: print(f"  {f['chi']:6s} {sim:.2f}  testo: {f['testo']}\n{'':17s}sentito: {sentito}")


if __name__ == '__main__':
    main()
