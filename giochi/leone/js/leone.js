// Rocco, il leone scappato dal recinto. Costruito con forme semplici, proporzioni da cartone animato:
// testa grande, occhi grandi, criniera morbida. È insistente e goffo, non feroce: vuole il panino nello zaino.
// Niente denti in vista, niente artigli, niente sangue. Quando "raggiunge" Andrea lo fa cadere sul sedere e gli ruba lo zaino.
import * as THREE from 'three';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...o });
function mesh(geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }

export class Leone {
  constructor() {
    const pelo = mat(0xe0a64a), chiaro = mat(0xf3d39a), crin = mat(0xa8551f), crin2 = mat(0xc4692a), scuro = mat(0x3a2414), bianco = mat(0xffffff, { roughness: .4 }), naso = mat(0x6b3b2a, { roughness: .5 });
    this.root = new THREE.Group();
    const corpo = this.corpo = new THREE.Group(); corpo.position.y = .62; this.root.add(corpo);
    // tronco
    const tronco = mesh(new THREE.CapsuleGeometry(.36, .75, 6, 14), pelo); tronco.rotation.x = Math.PI / 2; corpo.add(tronco);
    const pancia = mesh(new THREE.CapsuleGeometry(.27, .6, 6, 12), chiaro, 0, -.12, .02); pancia.rotation.x = Math.PI / 2; corpo.add(pancia);
    // zampe: gruppi con il perno in alto, così oscillano camminando
    this.zampe = [];
    for (const [x, z] of [[-.22, .42], [.22, .42], [-.22, -.42], [.22, -.42]]) {
      const g = new THREE.Group(); g.position.set(x, -.12, z); corpo.add(g);
      const gamba = mesh(new THREE.CapsuleGeometry(.11, .34, 4, 10), pelo, 0, -.26, 0); g.add(gamba);
      const piede = mesh(new THREE.SphereGeometry(.14, 14, 10), chiaro, 0, -.47, .05); piede.scale.set(1, .6, 1.25); g.add(piede);
      this.zampe.push(g);
    }
    // coda con il ciuffo
    const coda = this.coda = new THREE.Group(); coda.position.set(0, .12, -.62); corpo.add(coda);
    const c1 = mesh(new THREE.CylinderGeometry(.035, .045, .62, 8), pelo, 0, .2, -.22); c1.rotation.x = -1.0; coda.add(c1);
    const ciuffo = mesh(new THREE.SphereGeometry(.1, 12, 10), crin, 0, .44, -.42); ciuffo.scale.set(1, 1.3, 1); coda.add(ciuffo);
    // testa
    const testa = this.testa = new THREE.Group(); testa.position.set(0, .42, .62); corpo.add(testa);
    for (let i = 0; i < 16; i++) {           // criniera: due giri di sfere morbide
      const a = i / 16 * Math.PI * 2, r = .42;
      const s = mesh(new THREE.SphereGeometry(.17, 12, 10), i % 2 ? crin : crin2, Math.cos(a) * r, Math.sin(a) * r, -.1); testa.add(s);
    }
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; testa.add(mesh(new THREE.SphereGeometry(.14, 10, 8), crin2, Math.cos(a) * .27, Math.sin(a) * .27, -.2)); }
    const faccia = mesh(new THREE.SphereGeometry(.33, 20, 16), pelo, 0, 0, .04); faccia.scale.set(1, .95, .85); testa.add(faccia);
    const muso = mesh(new THREE.SphereGeometry(.16, 16, 12), chiaro, 0, -.1, .27); muso.scale.set(1.25, .8, .8); testa.add(muso);
    const nas = mesh(new THREE.SphereGeometry(.06, 12, 8), naso, 0, -.03, .39); nas.scale.set(1.3, .8, .8); testa.add(nas);
    // bocca: un sorrisetto, si apre un po' per il ruggito (finto)
    this.bocca = mesh(new THREE.SphereGeometry(.07, 12, 8), scuro, 0, -.2, .3); this.bocca.scale.set(1.3, .25, .5); testa.add(this.bocca);
    for (const s of [-1, 1]) {
      const occhio = mesh(new THREE.SphereGeometry(.085, 14, 10), bianco, s * .13, .09, .27); testa.add(occhio);
      const pupilla = mesh(new THREE.SphereGeometry(.05, 12, 8), scuro, s * .125, .085, .335); testa.add(pupilla);
      const luce = mesh(new THREE.SphereGeometry(.016, 6, 6), bianco, s * .11, .11, .38); testa.add(luce);
      const ciglio = mesh(new THREE.BoxGeometry(.13, .025, .03), scuro, s * .13, .2, .3); ciglio.rotation.z = -s * .18; testa.add(ciglio);
      const orecchio = mesh(new THREE.SphereGeometry(.09, 12, 8), pelo, s * .24, .3, .02); orecchio.scale.set(1, 1, .5); testa.add(orecchio);
    }
    this.root.scale.setScalar(1.05);
    this.t = Math.random() * 10; this.velocita = 0; this.stato = 'fermo'; this.target = null; this.onArrive = null;
  }
  // va verso un punto; restituisce una promessa che si risolve all'arrivo
  vaiA(x, z, v = 2.2) { this.target = new THREE.Vector3(x, 0, z); this.vel = v; return new Promise(r => { this.onArrive = r; }); }
  guarda(x, z) { const d = Math.atan2(x - this.root.position.x, z - this.root.position.z); this._gira = d; }
  // un "ruggito" buffo: testa indietro, bocca aperta
  ruggisci() { this._rug = 1.2; }
  update(dt) {
    this.t += dt;
    let passo = 0;
    if (this.target) {
      const d = this.target.clone().sub(this.root.position); d.y = 0; const dist = d.length();
      if (dist < .05) { this.target = null; const r = this.onArrive; this.onArrive = null; r && r(); }
      else { d.normalize(); const s = Math.min(dist, this.vel * dt); this.root.position.addScaledVector(d, s); passo = this.vel; this._gira = Math.atan2(d.x, d.z); }
    }
    if (this._gira != null) { let diff = this._gira - this.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); this.root.rotation.y += diff * Math.min(1, dt * 6); }
    this.velocita += (passo - this.velocita) * Math.min(1, dt * 6);
    const k = Math.min(1, this.velocita / 2), f = this.t * (4 + this.velocita * 2.2);
    this.zampe.forEach((z, i) => { z.rotation.x = Math.sin(f + (i === 0 || i === 3 ? 0 : Math.PI)) * .6 * k; });
    this.corpo.position.y = .62 + Math.abs(Math.sin(f)) * .05 * k + Math.sin(this.t * 2) * .01;
    this.coda.rotation.x = Math.sin(this.t * 3) * .25; this.coda.rotation.z = Math.sin(this.t * 2.2) * .3;
    // annusa l'aria quando è fermo
    let tx = Math.sin(this.t * 1.7) * .06 * (1 - k), ty = 0, bocca = .25;
    if (this._rug > 0) { this._rug -= dt; const r = Math.sin(Math.min(1, (1.2 - this._rug) / 1.2) * Math.PI); tx = -.35 * r; bocca = .25 + r * 1.3; ty = Math.sin(this.t * 30) * .04 * r; }
    this.testa.rotation.x = tx; this.testa.rotation.z = ty; this.bocca.scale.y = bocca;
  }
}
