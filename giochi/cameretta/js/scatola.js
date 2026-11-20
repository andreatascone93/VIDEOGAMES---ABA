// La scatola degli enigmi del nonno: una cassetta di legno con le fasce d'ottone e quattro serrature sul coperchio.
// Ogni serratura ha una gemma: rossa finché è chiusa, verde quando l'enigma è risolto. Alla quarta il coperchio si alza.
// Accanto, sul pavimento, il biglietto del nonno. Tutto costruito qui, senza modelli esterni.
import * as THREE from 'three';
import { canvasTex } from './stanza.js';
import { tween, tone, noise } from './core.js';

export const SCATOLA = { x: -.75, z: 1.5, larga: .56, fonda: .38 };

export function creaScatola() {
  const W = SCATOLA.larga, H = .26, D = SCATOLA.fonda, HL = .085;
  const g = new THREE.Group(); g.position.set(SCATOLA.x, 0, SCATOLA.z);
  const corpo = new THREE.Group(); g.add(corpo);   // la parte che si scuote e si rovescia
  const venature = (base, righe) => canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(0,0,0,' + (.05 + (i % 2) * .05) + ')'; c.fillRect(0, i * h / 4, w, h / 4 - 3); c.fillStyle = 'rgba(40,22,8,.55)'; c.fillRect(0, (i + 1) * h / 4 - 3, w, 3); }
    c.strokeStyle = righe; c.lineWidth = 1.5;
    for (let i = 0; i < 46; i++) { const y = (i * 53) % h, x = (i * 97) % w; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 40, y + 3, x + 80, y - 3, x + 130, y + 1); c.stroke(); }
  });
  const legno = new THREE.MeshStandardMaterial({ map: venature('#a9703f', 'rgba(70,40,15,.35)'), roughness: .62 });
  const legnoScuro = new THREE.MeshStandardMaterial({ map: venature('#8a5630', 'rgba(50,28,10,.4)'), roughness: .55 });
  const ottone = new THREE.MeshStandardMaterial({ color: 0xe0ab45, roughness: .32, metalness: .65 });
  const ombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  const base = ombra(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), legno)); base.position.y = H / 2; corpo.add(base);
  for (const x of [-W / 2 + .07, W / 2 - .07]) { const f = ombra(new THREE.Mesh(new THREE.BoxGeometry(.035, H + .006, D + .01), ottone)); f.position.set(x, H / 2, 0); corpo.add(f); }
  for (const x of [-1, 1]) for (const z of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .05), ottone); a.position.set(x * (W / 2 - .02), .025, z * (D / 2 - .02)); corpo.add(a); }
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(W - .04, D - .04), new THREE.MeshStandardMaterial({ color: 0x7a2f3a, roughness: .95 })); fondo.rotation.x = -Math.PI / 2; fondo.position.y = H + .002; corpo.add(fondo);   // il velluto dentro

  // coperchio, con il perno sul lato lontano: aprendosi mostra l'interno
  const perno = new THREE.Group(); perno.position.set(0, H, -D / 2); corpo.add(perno);
  const coperchio = ombra(new THREE.Mesh(new THREE.BoxGeometry(W + .024, HL, D + .024), legnoScuro)); coperchio.position.set(0, HL / 2, D / 2); perno.add(coperchio);
  for (const x of [-W / 2 + .07, W / 2 - .07]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.035, HL + .006, D + .034), ottone); f.position.set(x, HL / 2, D / 2); perno.add(f); }
  const gancio = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .012), ottone); gancio.position.set(0, HL * .2, D + .016); perno.add(gancio);
  const gemme = [];
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * .105;
    const piastra = new THREE.Mesh(new THREE.CylinderGeometry(.04, .044, .014, 24), ottone); piastra.position.set(x, HL + .007, D / 2); perno.add(piastra);
    const gemma = new THREE.Mesh(new THREE.SphereGeometry(.021, 18, 12), new THREE.MeshStandardMaterial({ color: 0xef4545, emissive: 0xef4545, emissiveIntensity: .55, roughness: .25 }));
    gemma.scale.y = .6; gemma.position.set(x, HL + .018, D / 2); perno.add(gemma); gemme.push(gemma);
  }

  // dentro: la lettera del nonno e due biglietti colorati, e una luce calda che esce quando si apre
  const dentro = new THREE.Group(); dentro.visible = false; corpo.add(dentro);
  const foglio = (w, h, colore, x, z, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: colore, roughness: .9, side: THREE.DoubleSide })); m.rotation.set(-Math.PI / 2 + .35, 0, r); m.position.set(x, H + .05, z); dentro.add(m); return m; };
  foglio(.22, .15, 0xfff6dc, -.08, -.02, .12); foglio(.15, .065, 0xff7a59, .14, .05, -.3); foglio(.15, .065, 0x3b8cf0, .13, -.04, -.12);
  const luce = new THREE.PointLight(0xffd88a, 0, 2.6, 2); luce.position.set(0, H + .25, 0); corpo.add(luce);

  // il biglietto del nonno
  const biglietto = new THREE.Mesh(new THREE.PlaneGeometry(.2, .27), new THREE.MeshStandardMaterial({ roughness: .9, map: canvasTex(200, 270, (c, w, h) => {
    c.fillStyle = '#f4e8c6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a3c'; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12);
    c.strokeStyle = '#3a2c1c'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(24, 46 + i * 28); c.lineTo(i === 6 ? 110 : 176 - (i * 23) % 40, 46 + i * 28); c.stroke(); }
    c.fillStyle = '#b3261e'; c.beginPath(); c.arc(150, 228, 14, 0, 7); c.fill();
  }) }));
  biglietto.rotation.set(-Math.PI / 2, 0, .45); biglietto.position.set(W / 2 + .2, .007, .1); biglietto.receiveShadow = true; g.add(biglietto);

  // i pezzi che rotolano fuori quando la scatola viene rovesciata
  const pezzi = new THREE.Group(); pezzi.visible = false; g.add(pezzi);
  [[-.5, .25, 0xffc94a], [-.62, -.1, 0x4dabff], [-.38, .42, 0xff5d73], [-.75, .3, 0x6be08a], [-.3, -.22, 0xb98bff], [-.58, .5, 0xe0ab45]].forEach(([x, z, col], i) => {
    const m = ombra(new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(.03, .03, .014, 14) : new THREE.BoxGeometry(.05, .014, .05), new THREE.MeshStandardMaterial({ color: col, roughness: .5 })));
    m.position.set(x, .008, z); m.rotation.y = i * 1.3; pezzi.add(m);
  });

  const colore = (m, aperta) => { const c = aperta ? 0x3fcf7a : 0xef4545; m.material.color.set(c); m.material.emissive.set(c); m.material.emissiveIntensity = aperta ? .9 : .55; };
  return {
    gruppo: g, corpo, coperchio: perno,
    // rimette la scatola com'era: chiusa, dritta, con le prime `n` serrature già aperte
    reset(n = 0, visibile = true) { perno.rotation.x = 0; dentro.visible = false; luce.intensity = 0; corpo.rotation.set(0, 0, 0); corpo.position.set(0, 0, 0); pezzi.visible = false; g.visible = visibile; gemme.forEach((m, i) => colore(m, i < n)); },
    async serratura(i) {
      colore(gemme[i], true); tone(180, .09, 'square', .09); tone(1320, .5, 'sine', .07, .08); tone(1760, .6, 'sine', .05, .16);
      await tween(v => gemme[i].scale.set(v, v * .6, v), 1, 1.9, 180); await tween(v => gemme[i].scale.set(v, v * .6, v), 1.9, 1, 260);
    },
    async apri() {
      dentro.visible = true; tone(140, .25, 'triangle', .1); [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .5, 'sine', .07, .25 + i * .13));
      await tween(v => { perno.rotation.x = -v * 1.95; luce.intensity = v * 2.2; }, 0, 1, 1500);
    },
    async scuoti() {
      noise(.3, .3, 900); tone(90, .25, 'square', .08);
      await tween(k => { corpo.rotation.z = Math.sin(k * Math.PI * 6) * .14 * (1 - k); corpo.position.y = Math.abs(Math.sin(k * Math.PI * 6)) * .03 * (1 - k); }, 0, 1, 520, t => t);
      corpo.rotation.z = 0; corpo.position.y = 0;
    },
    async rovescia() {
      noise(.45, .4, 700); tone(70, .4, 'square', .1); pezzi.visible = true;
      await tween(k => { corpo.rotation.z = k * 1.72; corpo.position.set(-k * .3, Math.sin(k * Math.PI) * .14 + k * .13, 0); }, 0, 1, 420, t => t);
      noise(.2, .3, 1500);
    }
  };
}
