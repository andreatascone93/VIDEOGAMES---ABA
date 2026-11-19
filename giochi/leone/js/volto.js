// Espressioni del viso dipinte sulla texture del personaggio (atlante Kenney 1024×1024).
// La rabbia si vede: sopracciglia, occhi, bocca e rossore cambiano con il livello.
import * as THREE from 'three';
import { BASE } from './assets.js';

// coordinate del viso nella texture originale
const OCCHI = [[287, 223], [357, 223]], BOCCA = [322, 271], CENTRO = [322, 245];

function caricaImmagine(src) {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}

export class Volto {
  static async crea(personaggio, skin) {
    const img = await caricaImmagine(BASE + 'personaggio/skins/' + skin + '.png');
    return new Volto(personaggio, img);
  }
  constructor(personaggio, img) {
    this.img = img;
    this.c = document.createElement('canvas'); this.c.width = img.width; this.c.height = img.height;
    this.g = this.c.getContext('2d', { willReadFrequently: true });
    this.k = img.width / 1024;
    this.g.drawImage(img, 0, 0);
    const px = (x, y) => { const d = this.g.getImageData(x * this.k, y * this.k, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    this.pelle = px(300, 252);
    this.tex = new THREE.CanvasTexture(this.c);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.flipY = true; this.tex.anisotropy = 4;
    personaggio.model.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.map = this.tex; o.material.needsUpdate = true; } });
    this.umore = null; this.rossore = 0;
    this.set('felice', 0);
  }
  // umore: felice | normale | seccato | arrabbiato | furioso | calmo ; rossore 0..1
  set(umore, rossore = this.rossore) {
    rossore = Math.round(rossore * 20) / 20;
    if (umore === this.umore && rossore === this.rossore) return;
    this.umore = umore; this.rossore = rossore;
    const g = this.g, k = this.k, ink = '#2a1414';
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
    g.drawImage(this.img, 0, 0);
    g.setTransform(k, 0, 0, k, 0, 0);
    const pelle = this.pelle;
    const copri = (x, y, rx, ry) => { g.fillStyle = pelle; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    g.lineCap = 'round'; g.lineJoin = 'round';

    const ciglia = { seccato: [6, 2], arrabbiato: [13, 5], furioso: [18, 7] }[umore];
    const socchiusi = umore === 'arrabbiato' || umore === 'furioso';
    // 1) copre i tratti originali che cambiano
    if (ciglia) { g.fillStyle = pelle; g.fillRect(260, 176, 124, 26); }
    if (umore === 'calmo') OCCHI.forEach(([x, y]) => copri(x, y, 15, 15));
    if (socchiusi) {
      const d = umore === 'furioso' ? 8 : 5;
      OCCHI.forEach(([x, y], i) => {
        const s = i === 0 ? 1 : -1; g.fillStyle = pelle; g.beginPath();
        g.moveTo(x - 16, y - 18); g.lineTo(x + 16, y - 18); g.lineTo(x + 16 * s, y - 2 + d); g.lineTo(x - 16 * s, y - 13 + d); g.closePath(); g.fill();
      });
    }
    if (umore !== 'felice') copri(BOCCA[0], BOCCA[1] - 1, 26, 16);

    // 2) rossore del viso, sfumato
    if (rossore > 0) {
      g.globalCompositeOperation = 'multiply';
      const gr = g.createRadialGradient(CENTRO[0], CENTRO[1] + 12, 20, CENTRO[0], CENTRO[1] + 12, 115);
      gr.addColorStop(0, `rgba(255,95,80,${.6 * rossore})`); gr.addColorStop(.55, `rgba(255,110,95,${.42 * rossore})`); gr.addColorStop(1, 'rgba(255,140,120,0)');
      g.fillStyle = gr; g.fillRect(CENTRO[0] - 130, CENTRO[1] - 120, 260, 250);
      if (rossore > .5) { // guance accese
        const a = (rossore - .5) * .9;
        [[268, 262], [376, 262]].forEach(([x, y]) => { const c = g.createRadialGradient(x, y, 2, x, y, 22); c.addColorStop(0, `rgba(235,60,60,${a})`); c.addColorStop(1, 'rgba(235,60,60,0)'); g.fillStyle = c; g.fillRect(x - 24, y - 24, 48, 48); });
      }
      g.globalCompositeOperation = 'source-over';
    }

    // 3) nuovi tratti
    if (ciglia) {
      g.strokeStyle = ink; g.lineWidth = 9;
      [[-1, 285], [1, 359]].forEach(([s, cx]) => {
        g.beginPath(); g.moveTo(cx + s * 19, 187 + ciglia[1] - ciglia[0] * .4); g.lineTo(cx - s * 15, 187 + ciglia[1] + ciglia[0] * .6); g.stroke();
      });
    }
    if (umore === 'calmo') OCCHI.forEach(([x, y]) => { g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.arc(x, y - 4, 10, .2 * Math.PI, .8 * Math.PI); g.stroke(); });
    if (umore !== 'felice') {
      const [x, y] = BOCCA; g.strokeStyle = ink; g.lineWidth = 5;
      if (umore === 'normale') { g.beginPath(); g.moveTo(x - 13, y - 2); g.quadraticCurveTo(x, y + 7, x + 13, y - 2); g.stroke(); }
      else if (umore === 'calmo') { g.beginPath(); g.moveTo(x - 15, y - 3); g.quadraticCurveTo(x, y + 9, x + 15, y - 3); g.stroke(); }
      else if (umore === 'seccato') { g.beginPath(); g.moveTo(x - 13, y + 2); g.quadraticCurveTo(x - 4, y - 2, x + 3, y + 1); g.quadraticCurveTo(x + 9, y + 3, x + 13, y - 1); g.stroke(); }
      else if (umore === 'arrabbiato') { // denti stretti
        g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 17, y - 7, 34, 15, 5); g.fill(); g.lineWidth = 3.5; g.stroke();
        g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.stroke();
        for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(x + dx, y - 6); g.lineTo(x + dx, y + 7); g.stroke(); }
      } else if (umore === 'furioso') { // urla
        g.fillStyle = '#4a1010'; g.beginPath(); g.ellipse(x, y + 2, 17, 13, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = 3.5; g.stroke();
        g.fillStyle = '#fff'; g.fillRect(x - 12, y - 10, 24, 5);
        g.fillStyle = '#d9485a'; g.beginPath(); g.ellipse(x, y + 9, 9, 4, 0, 0, Math.PI * 2); g.fill();
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    this.tex.needsUpdate = true;
  }
}
