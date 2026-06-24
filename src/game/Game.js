import * as THREE from 'three';
import { Player } from './Player.js';
import { World, ZONE } from './World.js';
import { UI } from './UI.js';

export class Game {
  constructor(canvas, data) {
    this.data = data;
    this.ui = new UI();
    this.clock = new THREE.Clock();
    this.interactPressed = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e14);
    this.scene.fog = new THREE.Fog(0x0a0e14, 20, 55);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 12, 16);

    this.setupLights();
    this.world = new World(this.scene, data);
    this.player = new Player(this.scene);
    this.player.bindInput();
    this.player.position.set(0, 0, 8);

    this.ui.setZone(this.world.getZoneName());

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => this.onKey(e));

    this.animate();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    this.scene.add(sun);

    const fill = new THREE.PointLight(0x00d4aa, 0.4, 40);
    fill.position.set(0, 8, 0);
    this.scene.add(fill);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onKey(e) {
    if (e.code === 'KeyE' && !this.interactPressed) {
      this.interactPressed = true;
      this.handleInteract();
    }
    if (e.code === 'Escape') {
      this.ui.hidePanel();
      if (this.world.zone === ZONE.MODULE) {
        this.world.setZone(ZONE.PISCINE);
        this.player.position.set(0, 0, 0);
        this.ui.setZone(this.world.getZoneName());
      } else if (this.world.zone !== ZONE.HUB) {
        this.world.setZone(ZONE.HUB);
        this.player.position.set(0, 0, 8);
        this.ui.setZone(this.world.getZoneName());
      }
    }
    if (e.code === 'KeyE') {
      setTimeout(() => { this.interactPressed = false; }, 300);
    }
  }

  async handleInteract() {
    const target = this.world.getNearestInteractable(this.player.getPosition());
    if (!target) return;

    if (target.type === 'info') {
      const html = this.data.intro.sections
        .map((s) => `<p><span class="highlight">${s.heading}</span><br/>${s.text}</p>`)
        .join('');
      this.ui.showPanel(this.data.intro.title, html);
      return;
    }

    if (target.type === 'portal') {
      this.world.setZone(target.target);
      this.player.position.set(0, 0, target.target === ZONE.HUB ? 8 : 0);
      this.ui.setZone(this.world.getZoneName());
      this.ui.hidePanel();
      return;
    }

    if (target.type === 'module') {
      this.world.setZone(ZONE.MODULE, target.module);
      this.player.position.set(0, 0, 6);
      this.ui.setZone(this.world.getZoneName());
      return;
    }

    if (target.type === 'exercise') {
      this.ui.showLaunching();
      try {
        const res = await fetch('/api/enter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: target.module.id,
            exerciseId: target.exercise.id,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          this.ui.showPanel(
            'Terminal Ready',
            `<p>Workspace: <span class="highlight">${json.workspace}</span></p>
             <p>Your terminal is open. Code the exercise, then test.</p>
             <p>${target.module.type === 'c' ? 'From the module folder run <kbd>mini</kbd> to moulinette.' : 'Run your script when ready.'}</p>`
          );
        } else {
          this.ui.showPanel('Error', `<p>${json.error}</p>`);
        }
      } catch (err) {
        this.ui.showPanel('Error', `<p>${err.message}</p>`);
      } finally {
        this.ui.hideLaunching();
      }
    }
  }

  updateCamera() {
    const p = this.player.getPosition();
    const target = new THREE.Vector3(p.x, 0, p.z);
    const offset = new THREE.Vector3(0, 11, 13);
    this.camera.position.lerp(target.clone().add(offset), 0.08);
    this.camera.lookAt(target);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();
    this.player.update(dt, this.world.bounds);
    this.updateCamera();

    const near = this.world.getNearestInteractable(this.player.getPosition());
    const panelOpen = !this.ui.panel.classList.contains('hidden');
    if (panelOpen) {
      this.ui.hidePrompt();
    } else if (near) {
      this.ui.showPrompt(near.label);
    } else {
      this.ui.hidePrompt();
    }

    this.renderer.render(this.scene, this.camera);
  }
}