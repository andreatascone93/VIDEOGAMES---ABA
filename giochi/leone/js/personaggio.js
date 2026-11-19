// Personaggio animato (modello Kenney "Animated Characters", CC0) con camminata, posture e clip.
import * as THREE from 'three';
import { animated, texture } from './assets.js';

export class Personaggio {
  static async crea({ altezza = 1.42, skin = null } = {}) {
    const { object, clips } = await animated('personaggio/francesco.glb');
    const p = new Personaggio(object, clips, altezza);
    if (skin) await p.setSkin(skin);
    return p;
  }
  constructor(object, clips, altezza) {
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
    this.play('idle');
  }
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
    this.mixer.update(dt);
  }
}
