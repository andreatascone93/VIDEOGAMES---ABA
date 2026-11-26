// Personaggio animato: scheletro e animazioni Kenney "Animated Characters" (CC0), aspetto disegnato in aspetto.js.
// Sopra le animazioni c'è uno strato di "carattere": respiro, dondolio della testa, spalle che salgono con la rabbia,
// testa che accompagna le parole. Ogni personaggio ha il suo ritmo (vedi ASPETTI[nome].carattere).
import * as THREE from 'three';
import { animated, texture } from './assets.js';
import { vesti, ASPETTI } from './aspetto.js';

export class Personaggio {
  // aspetto: francesco | mamma | papa | leo | giulia. Con skin (e senza aspetto) resta il vecchio modello a blocchi.
  static async crea({ altezza = 1.42, skin = null, aspetto = null } = {}) {
    const { object, clips } = await animated('personaggio/francesco.glb');
    if (!aspetto && !skin) aspetto = 'francesco';
    const p = new Personaggio(object, clips, altezza, aspetto);
    if (skin && !aspetto) await p.setSkin(skin);
    return p;
  }
  constructor(object, clips, altezza, aspetto = null) {
    this.root = new THREE.Group();
    this.model = object;
    // normalizza l'altezza misurando lo scheletro in posa di riposo
    this.root.add(object);
    this.mixer = new THREE.AnimationMixer(object);
    this.actions = {};
    for (const c of clips) this.actions[c.name] = this.mixer.clipAction(c);
    // posa "seduto rilassato": gambe della posa di guida, braccia della posa di riposo
    const byName = Object.fromEntries(clips.map(c => [c.name, c]));
    if (byName.racingIdle && byName.idle) {
      const braccia = t => /Shoulder|Arm|Hand/.test(t.name);
      const sit = new THREE.AnimationClip('sit', -1, [...byName.racingIdle.tracks.filter(t => !braccia(t)), ...byName.idle.tracks.filter(braccia)]);
      this.actions.sit = this.mixer.clipAction(sit);
    }
    this.ossa = {}; object.traverse(o => { if (o.isBone) this.ossa[o.name] = o; });
    this.mixer.update(0);
    object.updateMatrixWorld(true);
    const box = new THREE.Box3();
    object.traverse(o => { if (o.isBone) box.expandByPoint(o.getWorldPosition(new THREE.Vector3())); });
    const h = box.max.y - box.min.y || 1;
    this.scala = altezza / (h * 1.08);
    object.scale.multiplyScalar(this.scala);
    object.position.y -= box.min.y * this.scala;
    this.corrente = null;
    this.target = null; this.onArrive = null; this.speed = 1.6;
    this.altezzaVera = altezza; this.viso = null; this.tempo = Math.random() * 10;
    if (aspetto && ASPETTI[aspetto]) {
      const v = vesti(this, aspetto);
      this.viso = v.viso; this.ombra = v.ombra; this.misure = v.misure; this.carattere = ASPETTI[aspetto].carattere; this.aspetto = aspetto;
    }
    this.strato = ['Head', 'Neck', 'LeftShoulder', 'RightShoulder', 'Spine'].filter(n => this.ossa[n]).map(n => ({ osso: this.ossa[n], q: new THREE.Quaternion(), n }));
    this.play('idle');
  }
  // espressione del viso (felice, normale, calmo, seccato, arrabbiato, furioso, sorpreso, preoccupato, serio, sorriso)
  espressione(umore, rossore) { if (this.viso) this.viso.set(umore, rossore); }
  // bocca e testa che si muovono mentre il personaggio parla
  parla(on = true) { this.parlando = !!on; if (this.viso) this.viso.parla(on); }
  async setSkin(nome) {
    const t = await texture('personaggio/skins/' + nome + '.png'); t.flipY = true; t.needsUpdate = true;
    this.model.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.map = t; o.material.needsUpdate = true; } });
  }
  play(nome, { fade = .25, once = false, speed = 1 } = {}) {
    const a = this.actions[nome]; if (!a) return;
    if (this.corrente === a && !once) return;
    a.reset(); a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1);
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
    if (this.corrente && this.corrente !== a) a.crossFadeFrom(this.corrente, fade, true);
    a.play(); this.corrente = a;
    return once ? new Promise(r => { const f = e => { if (e.action === a) { this.mixer.removeEventListener('finished', f); r(); } }; this.mixer.addEventListener('finished', f); }) : null;
  }
  walkTo(x, z, { run = false } = {}) {
    this.target = new THREE.Vector3(x, this.root.position.y, z);
    this.speed = run ? 3.2 : 1.6;
    this.play(run ? 'run' : 'walk', { speed: run ? 1 : 1.15 });
    return new Promise(r => { this.onArrive = r; });
  }
  // posizione nel mondo di un osso (es. 'LeftHand', 'Head')
  punto(osso, out = new THREE.Vector3()) { const b = this.ossa[osso]; return b ? b.getWorldPosition(out) : this.root.getWorldPosition(out); }
  stop() { this.target = null; this.onArrive = null; }
  faceTo(angle, ms = 300) { this._turn = { a0: this.root.rotation.y, a1: angle, t: 0, ms }; }
  update(dt) {
    if (this.target) {
      const d = this.target.clone().sub(this.root.position); d.y = 0; const dist = d.length();
      if (dist < .04) {
        this.target = null; this.play('idle'); const r = this.onArrive; this.onArrive = null; if (r) r();
      } else {
        d.normalize(); this.root.position.addScaledVector(d, Math.min(dist, this.speed * dt));
        const want = Math.atan2(d.x, d.z); let diff = want - this.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.root.rotation.y += diff * Math.min(1, dt * 10);
      }
    }
    if (this._turn) { const t = this._turn; t.t += dt * 1000; const k = Math.min(1, t.t / t.ms); let diff = t.a1 - t.a0; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); this.root.rotation.y = t.a0 + diff * k; if (k >= 1) this._turn = null; }
    // lo strato di carattere si somma all'animazione: prima si toglie quello del fotogramma precedente
    for (const s of this.strato) if (s.fatto) { s.osso.quaternion.copy(s.q); s.fatto = false; }
    this.mixer.update(dt);
    if (this.viso) { this.carattereVivo(dt); this.viso.update(dt); }
    if (this.ombra) this.ombra.visible = Math.abs(this.root.position.y) < .03;
  }
  carattereVivo(dt) {
    const c = this.carattere || {}, t = (this.tempo += dt), r = this.viso.rosso || 0, e = c.energia || .6;
    const fermo = !this.target && (!this.corrente || /idle|sit|racing/.test(this.corrente.getClip().name));
    const e1 = new THREE.Euler(), q = new THREE.Quaternion();
    for (const s of this.strato) {
      s.q.copy(s.osso.quaternion); s.fatto = true;
      let x = 0, y = 0, z = 0;
      if (s.n === 'Head') {
        if (fermo) { x = Math.sin(t * .9 * (.6 + e)) * (c.dondola || .03) * .6; z = Math.sin(t * .55 + 1) * (c.dondola || .03); y = Math.sin(t * .31) * (c.dondola || .03) * 1.2; }
        if (this.parlando) { x += Math.sin(t * 9) * .035 + Math.sin(t * 3.1) * .03; z += Math.sin(t * 2.3) * .03; }
        x += r * .1;                                  // con la rabbia la testa va giù, sguardo da sotto
      } else if (s.n === 'Neck') { x = r * .06; }
      else if (s.n === 'LeftShoulder' || s.n === 'RightShoulder') {
        const lato = s.n === 'LeftShoulder' ? 1 : -1;  // spalle che salgono e si irrigidiscono
        z = lato * r * .18 + lato * Math.sin(t * (1.6 + r * 3)) * .012 * (fermo ? 1 : 0);
      } else if (s.n === 'Spine') { x = (fermo ? Math.sin(t * (1.6 + r * 2.4)) * .012 : 0) + r * .05; }   // respiro, più corto quando è arrabbiato
      if (x || y || z) { q.setFromEuler(e1.set(x, y, z)); s.osso.quaternion.multiply(q); }
    }
  }
}
