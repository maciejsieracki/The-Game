#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }

  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.disabled = false;
    this.hidden = false;
    this.type = '';
    this._className = '';
    this._classList = new FakeClassList(this);
    this._innerHTML = '';
    this._textContent = '';
  }

  get textContent() { return this._textContent; }
  set textContent(value) { this._textContent = String(value); }
  get className() { return this._className; }
  set className(value) {
    this._className = String(value);
    this._classList.values = new Set(this._className.split(/\s+/).filter(Boolean));
  }
  get classList() { return this._classList; }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.textContent = this._innerHTML.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    this.children = [];
    const tagPattern = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
    let match;
    while ((match = tagPattern.exec(this._innerHTML)) !== null) {
      const [, tag, attributes] = match;
      const child = new FakeElement(tag);
      const idMatch = attributes.match(/\bid=["']([^"']+)["']/i);
      const classMatch = attributes.match(/\bclass=["']([^"']+)["']/i);
      const typeMatch = attributes.match(/\btype=["']([^"']+)["']/i);
      const directionMatch = attributes.match(/\bdata-direction=["']([^"']+)["']/i);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (typeMatch) child.type = typeMatch[1];
      if (directionMatch) child.dataset.direction = directionMatch[1];
      if (/\bdisabled\b/i.test(attributes)) child.disabled = true;
      if (/\bhidden\b/i.test(attributes)) child.hidden = true;
      this.append(child);
    }
  }

  get innerHTML() { return this._innerHTML; }

  append(...elements) {
    elements.flat().forEach((element) => {
      if (!element) return;
      element.parentElement = this;
      this.children.push(element);
    });
  }

  replaceChildren(...elements) {
    this.children = [];
    this.append(...elements);
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }

  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) ?? [];
    callbacks.push(callback);
    this.listeners.set(type, callbacks);
  }

  click() {
    if (this.disabled) return;
    const callbacks = this.listeners.get('click') ?? [];
    callbacks.forEach((callback) => callback({ target: this, currentTarget: this }));
  }

  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }

  querySelectorAll(selector) {
    const result = [];
    const matches = (element) => {
      if (selector.startsWith('#')) return element.id === selector.slice(1);
      if (selector.startsWith('.')) return element.classList.contains(selector.slice(1));
      return element.tagName.toLowerCase() === selector.toLowerCase();
    };
    const visit = (element) => {
      element.children.forEach((child) => {
        if (matches(child)) result.push(child);
        visit(child);
      });
    };
    visit(this);
    return result;
  }
}

class FakeDocument {
  constructor(ids) {
    this.elements = new Map(ids.map((id) => [id, new FakeElement('div', id)]));
    this.elements.get('main-menu').className = 'screen civ-menu active';
    this.elements.get('new-game').className = 'screen civ-newgame';
    this.elements.get('game-screen').className = 'screen game-screen';
    this.elements.get('more-menu').hidden = true;
    this.elements.get('menu-panel').hidden = true;
    this.elements.get('continue-game').disabled = true;
    this.elements.get('load-game').disabled = true;
  }

  querySelector(selector) {
    if (selector.startsWith('#') && this.elements.has(selector.slice(1))) {
      return this.elements.get(selector.slice(1));
    }
    return null;
  }

  createElement(tagName) { return new FakeElement(tagName); }
}

const ids = [
  'main-menu', 'new-game', 'game-screen', 'menu-status', 'wizard-content',
  'wizard-nav', 'step-bar', 'game-map', 'game-status', 'capital-card',
  'unit-card', 'turn-number', 'phase-label', 'runtime-note', 'end-turn',
  'start-new-game', 'wizard-menu-back', 'return-menu', 'settings-button',
  'more-button', 'more-menu', 'continue-game', 'load-game', 'about-game', 'exit-game',
  'menu-panel', 'menu-panel-title', 'menu-panel-copy', 'menu-panel-close',
];
const document = new FakeDocument(ids);
const commands = [];
let exitCalls = 0;
const baseState = {
  stateVersion: 1,
  sessionId: 'grecy-42',
  params: {},
  map: {
    width: 2,
    height: 2,
    tiles: [
      { position: { x: 0, y: 0 }, terrain: 'Water', passable: false },
      { position: { x: 1, y: 0 }, terrain: 'Plains', passable: true },
      { position: { x: 0, y: 1 }, terrain: 'Plains', passable: true },
      { position: { x: 1, y: 1 }, terrain: 'Plains', passable: true },
    ],
  },
  players: [{ id: 1, name: 'Grecy', civilization: 'grecy', isHuman: true }],
  cities: [{ id: 1, ownerId: 1, name: 'Stolica Greków', position: { x: 0, y: 1 }, isCapital: true }],
  units: [{ id: 1, ownerId: 1, kind: 'Warrior', position: { x: 1, y: 0 }, movement: 1, movementMax: 1, selected: false }],
  selectedUnitId: null,
  turn: 1,
  phase: 'PlayerActions',
  lastAdvancedPhases: [],
  status: 'Sesja gotowa. Wybierz jednostkę.',
};

function cloneState() { return JSON.parse(JSON.stringify(baseState)); }
let currentState = cloneState();
const tauri = {
  core: {
    invoke: async (name, payload) => {
      assert.equal(name, 'engine_command');
      const command = payload.request.command;
      commands.push(command);
      if (command.kind === 'create_session') {
        currentState = cloneState();
        currentState.params = command.params;
        currentState.status = `Sesja gotowa dla ${command.params.civName} · ${command.params.epoch}.`;
        currentState.players[0].name = command.params.civName;
        currentState.players[0].civilization = command.params.civId;
        currentState.cities[0].name = `Stolica ${command.params.civName}`;
      }
      return {
        contractVersion: 1,
        requestId: payload.request.requestId,
        result: { kind: 'state', state: currentState },
      };
    },
  },
  event: {
    listen: async () => undefined,
  },
  window: {
    getCurrentWindow: () => ({ close: async () => { exitCalls += 1; } }),
  },
};

const context = {
  window: { __TAURI__: tauri },
  document,
  console,
  setTimeout,
  clearTimeout,
};
context.window.window = context.window;
const repository = path.resolve(__dirname, '..');
const scriptPath = path.join(repository, 'src-tauri', 'frontend', 'main.js');
vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
  const probe = context.window.__civPlayableSlice;
  assert.ok(probe, 'frontend probe seam is installed');

  document.querySelector('#more-button').click();
  assert.equal(document.querySelector('#more-menu').hidden, false);
  assert.equal(document.querySelector('#continue-game').disabled, true);
  document.querySelector('#about-game').click();
  assert.equal(document.querySelector('#menu-panel').hidden, false);
  assert.equal(document.querySelector('#menu-panel-title').textContent, 'O grze');
  document.querySelector('#menu-panel-close').click();
  assert.equal(document.querySelector('#menu-panel').hidden, true);
  assert.equal(document.querySelector('#load-game').disabled, true);
  document.querySelector('#settings-button').click();
  assert.equal(document.querySelector('#menu-panel-title').textContent, 'Ustawienia');
  document.querySelector('#menu-panel-close').click();
  document.querySelector('#exit-game').click();
  await flush();
  assert.equal(exitCalls, 1);

  document.querySelector('#start-new-game').click();
  assert.equal(probe.getWizardStep(), 'intro');
  document.querySelector('#wizard-nav').querySelector('#wizard-next').click();

  const epoch = document.querySelector('#wizard-content').querySelector('#epoch-choices')
    .children.find((choice) => choice.dataset.choiceId === 'braz');
  assert.ok(epoch, 'non-default epoch choice is rendered');
  epoch.click();
  document.querySelector('#wizard-nav').querySelector('#wizard-next').click();

  const civilization = document.querySelector('#wizard-content').querySelector('#civilization-choices')
    .children.find((choice) => choice.dataset.choiceId === 'grecy');
  assert.ok(civilization, 'non-default civilization choice is rendered');
  civilization.click();
  document.querySelector('#wizard-nav').querySelector('#wizard-next').click();

  const settingsGrid = document.querySelector('#wizard-content').querySelector('#settings-grid');
  const difficultyRow = settingsGrid.children[0];
  difficultyRow.querySelectorAll('.setting-arrow')[1].click();
  assert.match(document.querySelector('#wizard-content').textContent, /Trudny/);
  document.querySelector('#wizard-nav').querySelector('#wizard-next').click();
  await flush();

  assert.equal(commands.length, 1);
  assert.equal(commands[0].kind, 'create_session');
  assert.equal(commands[0].params.epochId, 'braz');
  assert.equal(commands[0].params.civId, 'grecy');
  assert.equal(commands[0].params.difficulty, 'Trudny');
  assert.equal(commands[0].params.rivals, 6);
  assert.equal(commands[0].params.typSwiata, 'kontynenty');
  assert.equal(commands[0].params.worldTypeId, undefined);
  assert.equal(commands[0].params.epoch, 'Epoka Brązu');
  assert.equal(commands[0].params.mapQuality, 'medium');
  assert.equal(commands[0].params.renderQuality, 'medium');
  assert.equal(commands[0].params.mapDetailQuality, 'medium');
  assert.equal(commands[0].params.mapQualityLabel, 'Średnia');
  assert.equal(commands[0].params.renderQualityLabel, 'Średnia');
  assert.equal(commands[0].params.mapDetailQualityLabel, 'Średnia');
  assert.equal(commands[0].params.civTypesCount, 6);
  assert.equal(commands[0].params.cityStatesCount, 6);
  assert.deepEqual(JSON.parse(JSON.stringify(commands[0].params.worldDensity)), {
    resources: 'medium',
    rivers: 'medium',
    desert: 'medium',
    forest: 'medium',
    relief: 'medium',
  });
  assert.equal(commands[0].params.landFractionPercent, 30);
  assert.equal(commands[0].params.advanced.landFractionPercent, 30);
  assert.equal(commands[0].params.advanced.kosztJednostekPace, 'niski');
  assert.equal(commands[0].params.advanced.cityLimitBase, 10);
  assert.deepEqual(JSON.parse(JSON.stringify(commands[0].params.selectedAiCivIds)), []);
  assert.equal(commands[0].params.villageRewardsEnabled, true);
  assert.ok(commands[0].params.unsupportedFeatures.includes('difficulty:NOT_IMPLEMENTED'));
  assert.ok(commands[0].params.unsupportedFeatures.includes('advanced:NOT_IMPLEMENTED'));
  assert.equal(document.querySelector('#game-screen').classList.contains('active'), true);
  assert.match(document.querySelector('#game-status').textContent, /Epoka Brązu/);
  assert.equal(currentState.players[0].civilization, 'grecy');
  console.log('frontend contract: PASS (menu controls -> non-default wizard -> full StartGameParams DTO)');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
