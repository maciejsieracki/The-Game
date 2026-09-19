const CONTRACT_VERSION = 1;
const EVENT_STATE_CHANGED = 'engine_state_changed';
const TAURI_COMMAND = 'engine_command';

const tauri = window.__TAURI__;
const screens = {
  menu: document.querySelector('#main-menu'),
  newGame: document.querySelector('#new-game'),
  game: document.querySelector('#game-screen'),
};
const menuStatus = document.querySelector('#menu-status');
const wizardContent = document.querySelector('#wizard-content');
const wizardNav = document.querySelector('#wizard-nav');
const stepBar = document.querySelector('#step-bar');
const gameMap = document.querySelector('#game-map');
const gameStatus = document.querySelector('#game-status');
const capitalCard = document.querySelector('#capital-card');
const unitCard = document.querySelector('#unit-card');
const turnNumber = document.querySelector('#turn-number');
const phaseLabel = document.querySelector('#phase-label');
const runtimeNote = document.querySelector('#runtime-note');
const endTurn = document.querySelector('#end-turn');
const startNewGame = document.querySelector('#start-new-game');
const wizardMenuBack = document.querySelector('#wizard-menu-back');
const returnMenu = document.querySelector('#return-menu');
const settingsButton = document.querySelector('#settings-button');
const moreButton = document.querySelector('#more-button');
const moreMenu = document.querySelector('#more-menu');
const aboutButton = document.querySelector('#about-game');
const exitButton = document.querySelector('#exit-game');
const menuPanel = document.querySelector('#menu-panel');
const menuPanelTitle = document.querySelector('#menu-panel-title');
const menuPanelCopy = document.querySelector('#menu-panel-copy');
const menuPanelClose = document.querySelector('#menu-panel-close');

const STEPS = [
  { id: 'intro', label: 'Wprowadzenie' },
  { id: 'epoch', label: 'Epoka' },
  { id: 'civilization', label: 'Cywilizacja' },
  { id: 'settings', label: 'Ustawienia' },
  { id: 'generating', label: 'Generowanie' },
];

const EPOCHS = [
  {
    id: 'kamien',
    title: 'Epoka Kamienia',
    copy: 'Pierwsze osady, zwiad i walka o żyzne równiny.',
    icon: '⌂',
  },
  {
    id: 'braz',
    title: 'Epoka Brązu',
    copy: 'Miasta rosną, a szlaki handlowe łączą regiony.',
    icon: '⚒',
  },
  {
    id: 'zelazo',
    title: 'Epoka Żelaza',
    copy: 'Granice są napięte. Zwycięży najlepiej przygotowana armia.',
    icon: '⚔',
  },
];

const CIVILIZATIONS = [
  {
    id: 'rzymianie',
    name: 'Rzymianie',
    copy: 'Porządek, drogi i silna piechota.',
    icon: '◈',
  },
  {
    id: 'grecy',
    name: 'Grecy',
    copy: 'Miasta-państwa, wiedza i obrona wzgórz.',
    icon: '△',
  },
  {
    id: 'egipcjanie',
    name: 'Egipcjanie',
    copy: 'Rzeka, rolnictwo i monumentalne miasta.',
    icon: '𓂀',
  },
];

const SETTING_OPTIONS = {
  difficulty: ['Łatwy', 'Normalny', 'Trudny'],
  mapSize: ['Malenki', 'Mały', 'Standardowy', 'Duży', 'Ogromny', 'Super Huge'],
  rivals: ['3', '6', '8'],
  worldType: ['Kontynenty', 'Pangea', 'Wyspy', 'Ziemia'],
  civTypesCount: ['4', '6', '8'],
  cityStatesCount: ['4', '6', '8'],
  mapQuality: ['Niska', 'Średnia', 'Wysoka'],
  resourceDensity: ['Mało', 'Normalnie', 'Dużo'],
  riverDensity: ['Mało', 'Normalnie', 'Dużo'],
  desertDensity: ['Mało', 'Normalnie', 'Dużo'],
  forestDensity: ['Mało', 'Normalnie', 'Dużo'],
  reliefDensity: ['Mało', 'Normalnie', 'Dużo'],
  landFractionPercent: ['20', '30', '40', '50'],
  speed: ['Szybka', 'Normalna', 'Epicka'],
  villageRewardsEnabled: ['Włączone', 'Wyłączone'],
};

const SETTING_LABELS = {
  difficulty: 'Trudność',
  mapSize: 'Rozmiar mapy',
  rivals: 'Liczba rywali',
  worldType: 'Typ świata',
  civTypesCount: 'Liczba cywilizacji',
  cityStatesCount: 'Miasta-państwa',
  mapQuality: 'Jakość mapy/renderu',
  resourceDensity: 'Gęstość surowców',
  riverDensity: 'Gęstość rzek',
  desertDensity: 'Gęstość pustyń',
  forestDensity: 'Gęstość lasów',
  reliefDensity: 'Gęstość reliefu',
  landFractionPercent: 'Udział lądu (%)',
  speed: 'Prędkość gry',
  villageRewardsEnabled: 'Chatki z nagrodami',
};

const WORLD_TYPE_IDS = {
  Kontynenty: 'kontynenty',
  Pangea: 'pangea',
  Wyspy: 'wyspy',
  Ziemia: 'ziemia',
};

const QUALITY_IDS = {
  Niska: 'low',
  Średnia: 'medium',
  Wysoka: 'high',
};

const DENSITY_IDS = {
  Mało: 'low',
  Nisko: 'low',
  Normalnie: 'medium',
  Dużo: 'high',
  Wysoko: 'high',
};

const DEFAULT_ADVANCED_PARAMS = {
  barbariansLevel: 'normalny',
  battleAlwaysManual: false,
  victoryMode: 'moc_i_dominacja',
  buildingCostPace: 'niski',
  kosztJednostekPace: 'niski',
  wzrostLudnosciPace: 'wysoki',
  ruchSwiataPace: 'krotki',
  landFractionPercent: 30,
  landFractionCustom: false,
  cityStateDifficultyOverride: null,
  cityLimitBase: 10,
};

const UNSUPPORTED_FEATURES = [
  'rivals:NOT_IMPLEMENTED',
  'difficulty:NOT_IMPLEMENTED',
  'speed:NOT_IMPLEMENTED',
  'worldType:NOT_IMPLEMENTED',
  'typSwiata:NOT_IMPLEMENTED',
  'mapQuality:NOT_IMPLEMENTED',
  'renderQuality:NOT_IMPLEMENTED',
  'mapDetailQuality:NOT_IMPLEMENTED',
  'civTypesCount:NOT_IMPLEMENTED',
  'cityStatesCount:NOT_IMPLEMENTED',
  'worldDensity:NOT_IMPLEMENTED',
  'landFractionPercent:NOT_IMPLEMENTED',
  'advanced:NOT_IMPLEMENTED',
  'selectedAiCivIds:NOT_IMPLEMENTED',
  'villageRewardsEnabled:NOT_IMPLEMENTED',
];

function defaultWizardParams() {
  return {
    civId: 'rzymianie',
    civName: 'Rzymianie',
    epoch: 'Epoka Kamienia',
    epochId: 'kamien',
    difficulty: 'Normalny',
    mapSize: 'Standardowy',
    rivals: '6',
    worldType: 'Kontynenty',
    civTypesCount: '6',
    cityStatesCount: '6',
    mapQuality: 'Średnia',
    resourceDensity: 'Normalnie',
    riverDensity: 'Normalnie',
    desertDensity: 'Normalnie',
    forestDensity: 'Normalnie',
    reliefDensity: 'Normalnie',
    landFractionPercent: '30',
    speed: 'Normalna',
    villageRewardsEnabled: 'Włączone',
    seed: 42,
    advanced: { ...DEFAULT_ADVANCED_PARAMS },
    unsupportedFeatures: [...UNSUPPORTED_FEATURES],
  };
}

const wizard = {
  step: 0,
  error: '',
  generationToken: 0,
  sessionStartInFlight: false,
  params: defaultWizardParams(),
};

let requestNumber = 0;
let gameState = null;
let commandInFlight = false;

function requestId() {
  requestNumber += 1;
  return `desktop-${requestNumber}`;
}

function showScreen(screen) {
  Object.values(screens).forEach((element) => element.classList.remove('active'));
  screen.classList.add('active');
}

function setMenuStatus(message) {
  menuStatus.textContent = message;
}

function closeMoreMenu() {
  if (moreMenu) moreMenu.hidden = true;
  moreButton?.setAttribute('aria-expanded', 'false');
}

function toggleMoreMenu() {
  if (!moreMenu) return;
  const isOpen = moreMenu.hidden === true;
  moreMenu.hidden = !isOpen;
  moreButton?.setAttribute('aria-expanded', String(isOpen));
}

function showMenuPanel(title, copy) {
  closeMoreMenu();
  if (!menuPanel || !menuPanelTitle || !menuPanelCopy) {
    setMenuStatus(copy);
    return;
  }
  menuPanelTitle.textContent = title;
  menuPanelCopy.textContent = copy;
  menuPanel.hidden = false;
}

function closeMenuPanel() {
  if (menuPanel) menuPanel.hidden = true;
}

async function exitDesktop() {
  const getCurrentWindow = tauri?.window?.getCurrentWindow;
  if (typeof getCurrentWindow !== 'function') {
    setMenuStatus('Zamknięcie jest dostępne tylko w uruchomionej aplikacji Tauri.');
    return;
  }
  try {
    await getCurrentWindow().close();
  } catch (error) {
    setMenuStatus(`Nie udało się zamknąć aplikacji: ${prettyError(error)}`);
  }
}

function prettyError(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Nieznany błąd bridge.';
  }
}

function renderStepBar() {
  stepBar.replaceChildren();
  STEPS.forEach((step, index) => {
    const isCurrent = index === wizard.step;
    const isDone = index < wizard.step;
    const element = document.createElement(isDone ? 'button' : 'div');
    element.className = `step${isCurrent ? ' active' : ''}${isDone ? ' done' : ''}`;
    element.setAttribute('aria-current', isCurrent ? 'step' : 'false');
    if (isDone) {
      element.type = 'button';
      element.addEventListener('click', () => {
        wizard.error = '';
        wizard.step = index;
        renderWizard();
      });
    }
    element.innerHTML = `<span class="step-number">${index + 1}</span><span>${step.label}</span>`;
    stepBar.append(element);
  });
}

function choiceCard({ id, title, copy, icon, selected, onSelect }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `choice-card${selected ? ' selected' : ''}`;
  button.dataset.choiceId = id;
  button.setAttribute('aria-pressed', String(selected));
  button.innerHTML = `
    <span class="choice-icon" aria-hidden="true">${icon}</span>
    <span class="choice-title">${title}</span>
    <span class="choice-copy">${copy}</span>
  `;
  button.addEventListener('click', onSelect);
  return button;
}

function renderIntro() {
  wizardContent.innerHTML = `
    <div class="wizard-intro">
      <div>
        <div class="intro-mark" aria-hidden="true">◆</div>
        <h3 class="intro-title">NOWA GRA</h3>
        <p class="intro-copy">
          Zbuduj pierwszą cywilizację, wskaż jej początek i wejdź na deterministyczną
          mapę Rust. Ten kreator prowadzi do działającego scenariusza, a nie do
          ekranu demonstracyjnego.
        </p>
      </div>
    </div>
  `;
}

function renderEpoch() {
  wizardContent.innerHTML = `
    <h3 class="wizard-heading">Wybierz epokę startową</h3>
    <div class="choice-grid" id="epoch-choices"></div>
    <p class="wizard-note">Epoka wpływa na opis scenariusza. Pierwszy slice rozpoczyna grę na tej samej mapie testowej.</p>
  `;
  const choices = wizardContent.querySelector('#epoch-choices');
  EPOCHS.forEach((epoch) => {
    choices.append(
      choiceCard({
        id: epoch.id,
        title: epoch.title,
        copy: epoch.copy,
        icon: epoch.icon,
        selected: wizard.params.epochId === epoch.id,
        onSelect: () => {
          wizard.params.epochId = epoch.id;
          wizard.params.epoch = epoch.title;
          renderWizard();
        },
      }),
    );
  });
}

function renderCivilization() {
  wizardContent.innerHTML = `
    <h3 class="wizard-heading">Wybierz cywilizację</h3>
    <div class="choice-grid" id="civilization-choices"></div>
    <p class="wizard-note">Twój wybór staje się właścicielem stolicy i jednostki widocznych na mapie.</p>
  `;
  const choices = wizardContent.querySelector('#civilization-choices');
  CIVILIZATIONS.forEach((civilization) => {
    choices.append(
      choiceCard({
        id: civilization.id,
        title: civilization.name,
        copy: civilization.copy,
        icon: civilization.icon,
        selected: wizard.params.civId === civilization.id,
        onSelect: () => {
          wizard.params.civId = civilization.id;
          wizard.params.civName = civilization.name;
          renderWizard();
        },
      }),
    );
  });
}

function cycleSetting(key, direction) {
  const options = SETTING_OPTIONS[key];
  const currentIndex = options.indexOf(wizard.params[key]);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  wizard.params[key] = options[nextIndex];
  renderWizard();
}

function worldTypeIdFor(label) {
  return WORLD_TYPE_IDS[label] ?? 'kontynenty';
}

function qualityTierFor(label) {
  return QUALITY_IDS[label] ?? 'medium';
}

function densityValueFor(label) {
  return DENSITY_IDS[label] ?? 'medium';
}

function buildStartGameParams() {
  const worldDensityLabels = {
    resources: wizard.params.resourceDensity,
    rivers: wizard.params.riverDensity,
    desert: wizard.params.desertDensity,
    forest: wizard.params.forestDensity,
    relief: wizard.params.reliefDensity,
  };
  const quality = qualityTierFor(wizard.params.mapQuality);
  return {
    civId: wizard.params.civId,
    civName: wizard.params.civName,
    epoch: wizard.params.epoch,
    epochId: wizard.params.epochId,
    difficulty: wizard.params.difficulty,
    mapSize: wizard.params.mapSize,
    rivals: Number(wizard.params.rivals),
    speed: wizard.params.speed,
    worldType: wizard.params.worldType,
    typSwiata: worldTypeIdFor(wizard.params.worldType),
    seed: wizard.params.seed,
    mapQualityLabel: wizard.params.mapQuality,
    mapQuality: quality,
    renderQualityLabel: wizard.params.mapQuality,
    renderQuality: quality,
    mapDetailQualityLabel: wizard.params.mapQuality,
    mapDetailQuality: quality,
    civTypesCount: Number(wizard.params.civTypesCount),
    cityStatesCount: Number(wizard.params.cityStatesCount),
    worldDensity: Object.fromEntries(
      Object.entries(worldDensityLabels).map(([key, label]) => [key, densityValueFor(label)]),
    ),
    worldDensityLabels,
    landFractionPercent: Number(wizard.params.landFractionPercent),
    advanced: {
      ...wizard.params.advanced,
      landFractionPercent: Number(wizard.params.landFractionPercent),
    },
    selectedAiCivIds: [],
    villageRewardsEnabled: wizard.params.villageRewardsEnabled !== 'Wyłączone',
    unsupportedFeatures: [...wizard.params.unsupportedFeatures],
  };
}

function renderSettings() {
  wizardContent.innerHTML = `
    <h3 class="wizard-heading">Dostosuj scenariusz</h3>
    <div class="settings-grid" id="settings-grid"></div>
    <div class="start-summary">
      <strong>Podsumowanie:</strong> ${wizard.params.civName} · ${wizard.params.epochId} · mapa ${wizard.params.mapSize} · ${wizard.params.difficulty}.
      Rywale: ${wizard.params.rivals} · cywilizacje: ${wizard.params.civTypesCount} · miasta-państwa: ${wizard.params.cityStatesCount} · ląd: ${wizard.params.landFractionPercent}%.
      Seed scenariusza: ${wizard.params.seed}.
      <br /><strong>Status:</strong> część pól ma jawny status NOT_IMPLEMENTED w DTO first slice.
    </div>
  `;
  const grid = wizardContent.querySelector('#settings-grid');
  Object.keys(SETTING_OPTIONS).forEach((key) => {
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `
      <div>
        <span class="setting-label">${SETTING_LABELS[key]}</span>
        <span class="setting-value">${wizard.params[key]}</span>
      </div>
      <div class="setting-control">
        <button class="setting-arrow" type="button" data-direction="-1" aria-label="Poprzednia wartość">‹</button>
        <button class="setting-arrow" type="button" data-direction="1" aria-label="Następna wartość">›</button>
      </div>
    `;
    row.querySelectorAll('.setting-arrow').forEach((button) => {
      button.addEventListener('click', () => cycleSetting(key, Number(button.dataset.direction)));
    });
    grid.append(row);
  });
}

function renderGenerating() {
  if (wizard.error) {
    wizardContent.innerHTML = `
      <div class="generation">
        <div>
          <div class="generation-title">Nie udało się utworzyć sesji</div>
          <p class="generation-copy">${wizard.error}</p>
          <button id="retry-generation" class="wizard-button primary" type="button">Spróbuj ponownie</button>
        </div>
      </div>
    `;
    wizardContent.querySelector('#retry-generation').addEventListener('click', () => {
      wizard.error = '';
      renderWizard();
    });
    return;
  }
  wizardContent.innerHTML = `
    <div class="generation">
      <div>
        <div class="generation-ring" aria-hidden="true"></div>
        <div class="generation-title">Generowanie świata</div>
        <p class="generation-copy">Rust przygotowuje mapę, stolicę i jednostkę gracza…</p>
      </div>
    </div>
  `;
}

function renderWizardNav() {
  if (wizard.step === STEPS.length - 1) {
    wizardNav.innerHTML = wizard.error
      ? '<button id="generation-back" class="wizard-button" type="button">← Ustawienia</button>'
      : '<span class="wizard-step-count">Rust / Tauri</span>';
    wizardNav.querySelector('#generation-back')?.addEventListener('click', () => {
      wizard.error = '';
      wizard.step = STEPS.length - 2;
      renderWizard();
    });
    return;
  }

  const backLabel = wizard.step === 0 ? '← Menu główne' : '← Wstecz';
  const nextLabel = wizard.step === STEPS.length - 2 ? 'Generuj świat →' : 'Dalej →';
  wizardNav.innerHTML = `
    <button id="wizard-back" class="wizard-button" type="button">${backLabel}</button>
    <span class="wizard-step-count">Krok ${wizard.step + 1} z ${STEPS.length - 1}</span>
    <button id="wizard-next" class="wizard-button primary" type="button">${nextLabel}</button>
  `;
  wizardNav.querySelector('#wizard-back').addEventListener('click', () => {
    if (wizard.step === 0) {
      goToMenu();
    } else {
      wizard.step -= 1;
      wizard.error = '';
      renderWizard();
    }
  });
  wizardNav.querySelector('#wizard-next').addEventListener('click', () => {
    wizard.error = '';
    wizard.step += 1;
    renderWizard();
  });
}

function startSession() {
  if (wizard.sessionStartInFlight || wizard.error) return;
  if (!tauri?.core?.invoke) {
    wizard.error = 'Brak aktywnego runtime Tauri. Uruchom aplikację desktopową, aby wejść do gry.';
    renderWizard();
    return;
  }

  wizard.sessionStartInFlight = true;
  const token = wizard.generationToken;
  sendCommand({ kind: 'create_session', params: buildStartGameParams() })
    .then(() => {
      if (token === wizard.generationToken) {
        wizard.sessionStartInFlight = false;
        showScreen(screens.game);
        renderGameState(gameState);
      }
    })
    .catch((error) => {
      if (token !== wizard.generationToken) return;
      wizard.sessionStartInFlight = false;
      wizard.error = prettyError(error);
      renderWizard();
    });
}

function renderWizard() {
  renderStepBar();
  switch (STEPS[wizard.step].id) {
    case 'intro':
      renderIntro();
      break;
    case 'epoch':
      renderEpoch();
      break;
    case 'civilization':
      renderCivilization();
      break;
    case 'settings':
      renderSettings();
      break;
    case 'generating':
      renderGenerating();
      startSession();
      break;
    default:
      renderIntro();
  }
  renderWizardNav();
}

function resetWizard() {
  wizard.step = 0;
  wizard.error = '';
  wizard.sessionStartInFlight = false;
  wizard.params = defaultWizardParams();
}

function showNewGame() {
  resetWizard();
  closeMenuPanel();
  closeMoreMenu();
  showScreen(screens.newGame);
  renderWizard();
}

function goToMenu() {
  wizard.generationToken += 1;
  wizard.sessionStartInFlight = false;
  closeMenuPanel();
  closeMoreMenu();
  showScreen(screens.menu);
  setMenuStatus('');
}

function terrainClass(terrain) {
  return String(terrain ?? 'plains').toLowerCase();
}

function positionKey(position) {
  return `${position.x},${position.y}`;
}

function phaseLabelFor(phase) {
  const labels = {
    StartTurn: 'Początek tury',
    PlayerActions: 'Ruch gracza',
    Diplomacy: 'Dyplomacja',
    Economy: 'Ekonomia',
    Production: 'Produkcja',
    Ai: 'Ruch AI',
    Barbarians: 'Barbarzyńcy',
    Victory: 'Kontrola zwycięstwa',
    EndTurn: 'Koniec tury',
  };
  return labels[phase] ?? phase ?? '—';
}

function entityAt(entities, position) {
  return entities.find((entity) => positionKey(entity.position) === positionKey(position));
}

function onTileClick(position) {
  if (!gameState || commandInFlight) return;
  const unit = entityAt(gameState.units, position);
  if (unit) {
    runGameCommand({ kind: 'select_unit', unit_id: unit.id }, 'Wybrano jednostkę.')
      .catch(() => {});
    return;
  }
  if (gameState.selectedUnitId == null) {
    gameStatus.textContent = 'Najpierw wybierz jednostkę na mapie.';
    return;
  }
  runGameCommand(
    {
      kind: 'move_unit',
      unit_id: gameState.selectedUnitId,
      destination: position,
    },
    'Ruch wykonany.',
  ).catch(() => {});
}

function renderMap(state) {
  const map = state.map;
  gameMap.replaceChildren();
  gameMap.style.gridTemplateColumns = `repeat(${map.width}, minmax(3.1rem, 1fr))`;
  const cities = new Map(state.cities.map((city) => [positionKey(city.position), city]));
  const units = new Map(state.units.map((unit) => [positionKey(unit.position), unit]));

  map.tiles.forEach((tile) => {
    const button = document.createElement('button');
    const key = positionKey(tile.position);
    const city = cities.get(key);
    const unit = units.get(key);
    button.type = 'button';
    button.className = `tile terrain-${terrainClass(tile.terrain)}${unit?.selected ? ' selected' : ''}`;
    button.setAttribute('role', 'gridcell');
    button.setAttribute(
      'aria-label',
      `${tile.terrain} ${tile.position.x},${tile.position.y}${city ? `, ${city.name}` : ''}${unit ? ', jednostka' : ''}`,
    );
    button.title = tile.passable ? 'Heks przejezdny' : 'Heks nieprzejezdny';
    button.innerHTML = `
      ${city ? `<span class="tile-marker" title="${city.isCapital ? 'Stolica' : 'Miasto'}">${city.isCapital ? '★' : '⌂'}</span>` : ''}
      ${unit ? `<span class="tile-marker" title="Jednostka ${unit.id}">⚔</span>` : ''}
      <span class="tile-coord">${tile.position.x},${tile.position.y}</span>
    `;
    button.addEventListener('click', () => onTileClick(tile.position));
    gameMap.append(button);
  });
}

function renderSidebar(state) {
  const player = state.players.find((candidate) => candidate.isHuman) ?? state.players[0];
  const capital = state.cities.find((city) => city.isCapital);
  const selectedUnit = state.units.find((unit) => unit.selected);
  turnNumber.textContent = state.turn;
  phaseLabel.textContent = phaseLabelFor(state.phase);
  gameStatus.textContent = state.status;
  capitalCard.innerHTML = capital
    ? `<strong>★ ${capital.name}</strong><small>Stolica · właściciel: ${player?.name ?? '—'}<br />Pozycja: ${capital.position.x}, ${capital.position.y}</small>`
    : '<strong>Brak stolicy</strong><small>Stan nie zawiera miasta.</small>';
  unitCard.innerHTML = selectedUnit
    ? `<strong>⚔ Wojownik #${selectedUnit.id}</strong><small>Pozycja: ${selectedUnit.position.x}, ${selectedUnit.position.y}<br />Ruch: ${selectedUnit.movement}/${selectedUnit.movementMax}</small>`
    : '<strong>Jednostka</strong><small>Kliknij ⚔ na mapie, aby ją wybrać.</small>';
  runtimeNote.textContent = `Stan v${state.stateVersion} · sesja ${state.sessionId} · kliknij sąsiedni heks, aby wykonać ruch.`;
  endTurn.disabled = commandInFlight;
}

function renderGameState(state) {
  if (!state) return;
  renderMap(state);
  renderSidebar(state);
}

async function sendCommand(command) {
  if (!tauri?.core?.invoke) {
    throw new Error('Tauri runtime unavailable; open this page from the desktop bundle.');
  }
  const response = await tauri.core.invoke(TAURI_COMMAND, {
    request: {
      contractVersion: CONTRACT_VERSION,
      requestId: requestId(),
      command,
    },
  });
  const state = response?.result?.state;
  if (!state) throw new Error('Bridge returned no game state.');
  gameState = state;
  renderGameState(state);
  return state;
}

async function runGameCommand(command, successMessage) {
  commandInFlight = true;
  renderGameState(gameState);
  let failureMessage = '';
  try {
    const state = await sendCommand(command);
    gameStatus.textContent = successMessage || state.status;
    return state;
  } catch (error) {
    failureMessage = `Ruch odrzucony: ${prettyError(error)}`;
    throw error;
  } finally {
    commandInFlight = false;
    renderGameState(gameState);
    if (failureMessage) gameStatus.textContent = failureMessage;
  }
}

function installBridgeListener() {
  if (!tauri?.event?.listen) return;
  tauri.event.listen(EVENT_STATE_CHANGED, (event) => {
    if (event?.payload?.state) {
      gameState = event.payload.state;
      renderGameState(gameState);
    }
  }).catch((error) => {
    setMenuStatus(`Subskrypcja stanu nieudana: ${prettyError(error)}`);
  });
}

startNewGame?.addEventListener('click', showNewGame);
wizardMenuBack?.addEventListener('click', goToMenu);
returnMenu?.addEventListener('click', goToMenu);
settingsButton?.addEventListener('click', () => {
  showMenuPanel(
    'Ustawienia',
    'Ustawienia menu są świadomie ograniczone w pierwszym playable slice. Parametry rozgrywki wybierzesz w kreatorze nowej gry.',
  );
});
moreButton?.addEventListener('click', toggleMoreMenu);
aboutButton?.addEventListener('click', () => {
  showMenuPanel(
    'O grze',
    'Civ The Game — pierwszy grywalny slice Rust/Tauri. Mapa, stolica, jednostka, legalny ruch i koniec tury działają przez wersjonowany bridge Rust. Pełne systemy są osobnymi paczkami.',
  );
});
menuPanelClose?.addEventListener('click', () => {
  closeMenuPanel();
  setMenuStatus('');
});
exitButton?.addEventListener('click', () => {
  exitDesktop().catch((error) => setMenuStatus(`Nie udało się zamknąć aplikacji: ${prettyError(error)}`));
});
endTurn.addEventListener('click', () => {
  runGameCommand({ kind: 'advance_turn' }, 'Tura zakończona.').catch(() => {});
});

installBridgeListener();
if (!tauri?.core?.invoke) {
  setMenuStatus('Podgląd menu gotowy. Uruchom aplikację Tauri, aby rozpocząć sesję Rust.');
  runtimeNote.textContent = 'Runtime Tauri nie jest dostępny w zwykłej karcie przeglądarki.';
} else {
  setMenuStatus('Bridge Rust/Tauri gotowy.');
}

// A narrow probe seam makes the real DOM/event path observable without adding a
// second game state machine. It is harmless in production and useful to shell
// tests that load the same frontend document.
window.__civPlayableSlice = Object.freeze({
  getState: () => gameState,
  getWizardStep: () => STEPS[wizard.step].id,
  getWizardParams: () => buildStartGameParams(),
  showNewGame,
  sendCommand,
});
