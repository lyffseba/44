import * as THREE from 'three';

const ZONE = { HUB: 'hub', INTRO: 'intro', PISCINE: 'piscine', MODULE: 'module' };

export class World {
  constructor(scene, data) {
    this.scene = scene;
    this.data = data;
    this.zone = ZONE.HUB;
    this.currentModule = null;
    this.interactables = [];
    this.zoneMeshes = {};
    this.bounds = { minX: -12, maxX: 12, minZ: -4, maxZ: 20 };

    this.buildHub();
    this.buildIntro();
    this.buildPiscineYard();
    this.setZone(ZONE.HUB);
  }

  setZone(zone, module = null) {
    this.zone = zone;
    this.currentModule = module;

    for (const [name, group] of Object.entries(this.zoneMeshes)) {
      group.visible = false;
    }

    if (zone === ZONE.HUB) {
      this.zoneMeshes.hub.visible = true;
      this.bounds = { minX: -14, maxX: 14, minZ: -6, maxZ: 22 };
    } else if (zone === ZONE.INTRO) {
      this.zoneMeshes.intro.visible = true;
      this.bounds = { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    } else if (zone === ZONE.PISCINE) {
      this.zoneMeshes.piscine.visible = true;
      const count = this.data.modules.length;
      this.bounds = { minX: -count * 2.5, maxX: count * 2.5, minZ: -6, maxZ: 14 };
    } else if (zone === ZONE.MODULE && module) {
      this.buildModuleZone(module);
      this.zoneMeshes.module.visible = true;
      const n = module.exercises.length;
      this.bounds = { minX: -n * 1.8, maxX: n * 1.8, minZ: -6, maxZ: 10 };
    }

    this.rebuildInteractables();
  }

  rebuildInteractables() {
    this.interactables = [];

    if (this.zone === ZONE.HUB) {
      this.interactables.push(
        { pos: new THREE.Vector3(-10, 0, 0), radius: 3, type: 'portal', target: ZONE.INTRO, label: 'Enter — 42 Introduction' },
        { pos: new THREE.Vector3(10, 0, 0), radius: 3, type: 'portal', target: ZONE.PISCINE, label: 'Enter — The Piscine' }
      );
    } else if (this.zone === ZONE.INTRO) {
      this.interactables.push(
        { pos: new THREE.Vector3(0, 0, 6), radius: 2.5, type: 'info', label: 'Read — 42 & The Piscine' },
        { pos: new THREE.Vector3(0, 0, -6), radius: 2, type: 'portal', target: ZONE.HUB, label: 'Return — Hub' }
      );
    } else if (this.zone === ZONE.PISCINE) {
      this.interactables.push(
        { pos: new THREE.Vector3(0, 0, -4), radius: 2, type: 'portal', target: ZONE.HUB, label: 'Return — Hub' }
      );
      this.data.modules.forEach((mod, i) => {
        const x = (i - (this.data.modules.length - 1) / 2) * 5;
        this.interactables.push({
          pos: new THREE.Vector3(x, 0, 4),
          radius: 2.2,
          type: 'module',
          module: mod,
          label: `Enter — ${mod.name}`,
        });
      });
    } else if (this.zone === ZONE.MODULE && this.currentModule) {
      this.interactables.push(
        { pos: new THREE.Vector3(0, 0, -4), radius: 2, type: 'portal', target: ZONE.PISCINE, label: 'Return — Piscine Yard' }
      );
      this.currentModule.exercises.forEach((ex, i) => {
        const x = (i - (this.currentModule.exercises.length - 1) / 2) * 3.5;
        this.interactables.push({
          pos: new THREE.Vector3(x, 0, 3),
          radius: 1.8,
          type: 'exercise',
          module: this.currentModule,
          exercise: ex,
          label: `Start — ${ex.id}: ${ex.title}`,
        });
      });
    }
  }

  getNearestInteractable(playerPos) {
    let nearest = null;
    let minDist = Infinity;
    for (const item of this.interactables) {
      const d = playerPos.distanceTo(item.pos);
      if (d < item.radius && d < minDist) {
        minDist = d;
        nearest = item;
      }
    }
    return nearest;
  }

  makeGround(width, depth, color) {
    const geo = new THREE.PlaneGeometry(width, depth);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  makePortal(x, z, color, label) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.12, 8, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2;
    group.add(ring);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x30363d })
    );
    pillar.position.y = 2;
    group.add(pillar);

    const sprite = this.makeLabel(label);
    sprite.position.set(0, 4.5, 0);
    group.add(sprite);

    return group;
  }

  makeLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(10,14,20,0.85)';
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(6, 0.75, 1);
    return sprite;
  }

  buildHub() {
    const group = new THREE.Group();
    group.add(this.makeGround(40, 40, 0x1a2332));

    const spawn = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0x00d4aa, emissive: 0x00d4aa, emissiveIntensity: 0.2, side: THREE.DoubleSide })
    );
    spawn.rotation.x = -Math.PI / 2;
    spawn.position.set(0, 0.02, 8);
    group.add(spawn);

    const title = this.makeLabel('44 — PISCINE WORLD');
    title.position.set(0, 5, 8);
    title.scale.set(8, 1, 1);
    group.add(title);

    group.add(this.makePortal(-10, 0, 0x4fc3f7, '42 INTRO'));
    group.add(this.makePortal(10, 0, 0x00d4aa, 'PISCINE'));

    this.zoneMeshes.hub = group;
    this.scene.add(group);
  }

  buildIntro() {
    const group = new THREE.Group();
    group.add(this.makeGround(20, 20, 0x152238));

    const monolith = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 1),
      new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x1a3a4a, emissiveIntensity: 0.15 })
    );
    monolith.position.set(0, 3, -2);
    group.add(monolith);

    const label = this.makeLabel('42');
    label.position.set(0, 7, -2);
    group.add(label);

    group.add(this.makePortal(0, -6, 0x8b949e, 'HUB'));

    this.zoneMeshes.intro = group;
    this.scene.add(group);
  }

  buildPiscineYard() {
    const group = new THREE.Group();
    const w = this.data.modules.length * 5 + 10;
    group.add(this.makeGround(w, 24, 0x14201a));

    this.data.modules.forEach((mod, i) => {
      const x = (i - (this.data.modules.length - 1) / 2) * 5;
      const col = new THREE.Color(mod.color);

      const podium = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.2 })
      );
      podium.position.set(x, 0.2, 4);
      group.add(podium);

      const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 })
      );
      beacon.position.set(x, 2.5, 4);
      group.add(beacon);

      const lbl = this.makeLabel(mod.id);
      lbl.position.set(x, 4.2, 4);
      group.add(lbl);
    });

    group.add(this.makePortal(0, -4, 0x8b949e, 'HUB'));

    this.zoneMeshes.piscine = group;
    this.scene.add(group);
  }

  buildModuleZone(module) {
    if (this.zoneMeshes.module) {
      this.scene.remove(this.zoneMeshes.module);
    }

    const group = new THREE.Group();
    const w = module.exercises.length * 3.5 + 8;
    group.add(this.makeGround(w, 18, 0x1a1a28));

    const col = new THREE.Color(module.color);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.2, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 })
    );
    arch.position.set(0, 3, -1);
    group.add(arch);

    const title = this.makeLabel(module.name);
    title.position.set(0, 5.5, -1);
    title.scale.set(7, 1, 1);
    group.add(title);

    module.exercises.forEach((ex, i) => {
      const x = (i - (module.exercises.length - 1) / 2) * 3.5;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25 })
      );
      cube.position.set(x, 0.8, 3);
      group.add(cube);

      const exLabel = this.makeLabel(ex.id);
      exLabel.position.set(x, 2.2, 3);
      exLabel.scale.set(3, 0.5, 1);
      group.add(exLabel);
    });

    group.add(this.makePortal(0, -4, 0x8b949e, 'BACK'));

    this.zoneMeshes.module = group;
    this.scene.add(group);
  }

  getZoneName() {
    const names = {
      [ZONE.HUB]: 'Hub',
      [ZONE.INTRO]: '42 Introduction',
      [ZONE.PISCINE]: 'Piscine Yard',
      [ZONE.MODULE]: this.currentModule?.name ?? 'Module',
    };
    return names[this.zone] ?? 'Unknown';
  }
}

export { ZONE };