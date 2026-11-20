// Resa grafica comune: luce d'ambiente riflessa (una stanza calda finta, filtrata da PMREM) e taratura del renderer.
// Costa poco anche sui tablet: la mappa d'ambiente si calcola una volta sola all'avvio.
import * as THREE from 'three';

// una stanza semplice vista dall'interno: soffitto chiaro, pareti color crema, pavimento di legno e una finestra luminosa
function stanzaFinta() {
  const s = new THREE.Scene();
  const box = new THREE.BoxGeometry(1, 1, 1);
  const parete = (c, sx, sy, sz, x, y, z, emiss = 0) => {
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1 + emiss), side: THREE.BackSide }));
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); s.add(m); return m;
  };
  parete(new THREE.Color(0xf3e6d2).multiplyScalar(.38), 12, 6, 12, 0, 3, 0);                       // pareti
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9c6b42).multiplyScalar(.4) })); pav.rotation.x = -Math.PI / 2; pav.position.y = .02; s.add(pav);
  const finestra = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff4de).multiplyScalar(2.6) }));
  finestra.position.set(-1, 2.6, -5.9); s.add(finestra);
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff8ee).multiplyScalar(.6) }));
  cielo.rotation.x = Math.PI / 2; cielo.position.y = 5.9; s.add(cielo);
  const lato = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfd8ff).multiplyScalar(.9) }));
  lato.rotation.y = -Math.PI / 2; lato.position.set(5.9, 2.5, 1); s.add(lato);
  return s;
}

export function ambiente(renderer, scene) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(stanzaFinta(), .035).texture;
    pm.dispose();
  } catch (e) { /* senza mappa d'ambiente il gioco funziona lo stesso */ }
}

// con la luce riflessa la luce emisferica può scendere: ombre più profonde, colori più pieni
export function luci(scene, { emisfera, sole }) {
  if (emisfera) emisfera.intensity = 1.05;
  if (sole) sole.color.set(0xfff0d8);
  // controluce fredda, senza ombre: stacca i personaggi dallo sfondo
  const contro = new THREE.DirectionalLight(0xa9c8ff, .7); contro.position.set(3, 3.2, -4); scene.add(contro);
  return contro;
}
