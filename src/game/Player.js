import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.speed = 8;
    this.sprintMult = 1.8;
    this.position = new THREE.Vector3(0, 0, 8);
    this.velocity = new THREE.Vector3();
    this.keys = {};
    this.active = false;
    this.mesh = this.createMesh();
    scene.add(this.mesh);
    this.mesh.position.copy(this.position);
  }

  createMesh() {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.9, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x00d4aa, emissive: 0x003328, roughness: 0.4 })
    );
    body.position.y = 0.9;
    const group = new THREE.Group();
    group.add(body);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.15, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x1a4a5e })
    );
    visor.position.set(0, 1.35, 0.25);
    group.add(visor);

    return group;
  }

  bindInput(canvas) {
    canvas.tabIndex = 0;
    canvas.addEventListener('click', () => {
      this.active = true;
      canvas.focus();
    });
    canvas.addEventListener('blur', () => { this.active = false; });

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setActive(on) {
    this.active = on;
  }

  update(dt, bounds) {
    const dir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      const speed = this.speed * (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? this.sprintMult : 1);
      this.velocity.x = dir.x * speed;
      this.velocity.z = dir.z * speed;
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
    }

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    if (bounds) {
      this.position.x = THREE.MathUtils.clamp(this.position.x, bounds.minX, bounds.maxX);
      this.position.z = THREE.MathUtils.clamp(this.position.z, bounds.minZ, bounds.maxZ);
    }

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
  }

  getPosition() {
    return this.position;
  }
}