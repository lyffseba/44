export class UI {
  constructor() {
    this.zoneLabel = document.getElementById('zone-label');
    this.prompt = document.getElementById('prompt');
    this.promptText = document.getElementById('prompt-text');
    this.panel = document.getElementById('panel');
    this.panelTitle = document.getElementById('panel-title');
    this.panelBody = document.getElementById('panel-body');
    this.panelClose = document.getElementById('panel-close');

    this.panelClose.addEventListener('click', () => this.hidePanel());
  }

  setZone(name) {
    this.zoneLabel.textContent = name;
  }

  showPrompt(text) {
    this.promptText.textContent = text;
    this.prompt.classList.remove('hidden');
  }

  hidePrompt() {
    this.prompt.classList.add('hidden');
  }

  showPanel(title, html) {
    this.panelTitle.textContent = title;
    this.panelBody.innerHTML = html;
    this.panel.classList.remove('hidden');
  }

  hidePanel() {
    this.panel.classList.add('hidden');
  }

  showLaunching() {
    const el = document.createElement('div');
    el.className = 'launching';
    el.id = 'launching';
    el.textContent = 'Opening terminal… workspace ready.';
    document.body.appendChild(el);
  }

  hideLaunching() {
    document.getElementById('launching')?.remove();
  }
}