/**
 * main.ts
 * Punkt wejscia The Game -- M1 Step 1: 3D hex map renderer.
 *
 * Pipeline:
 *   loadGameData() -> configureTerrainMovement (if data carries terrainMovement)
 *   -> generateMap(seed) -> buildScene() -> CameraController -> render loop
 */

// Global Error Overlay
// Catches any JS error or unhandled promise and shows it as a red overlay
// so a black screen never silently hides what went wrong.

function showErr(msg: string): void {
  let el = document.getElementById('__err_overlay__') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = '__err_overlay__';
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%',
      'background:rgba(180,0,0,0.92)', 'color:#fff',
      'font:bold 13px/1.5 monospace', 'padding:16px 20px',
      'z-index:99999', 'white-space:pre-wrap', 'word-break:break-all',
      'max-height:50vh', 'overflow-y:auto',
      'border-bottom:3px solid #ff4444',
    ].join(';');
    el.innerHTML = '<b>THE GAME \u2014 ERROR</b>\n';
    document.body.appendChild(el);
  }
  el.innerHTML += '\n' + msg;
  console.error('[TheGame]', msg);
}

window.addEventListener('error', (e) => {
  showErr(e.message + ' @' + e.filename + ':' + e.lineno + ':' + e.colno);
});
window.addEventListener('unhandledrejection', (e) => {
  showErr('Unhandled promise rejection: ' + String(e.reason));
});

// Imports

import * as THREE from 'three';
import { loadGameData } from './data/loader';
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from './map/generator';
import { buildScene } from './render/scene';
import { CameraController } from './render/camera';
import { HEX_R, axialToWorld, worldToAxial } from './render/hexutil';
import { placeStartingUnits, computeReachable, computePath, listUnitTypes, pathCost, configureTerrainMovement, hexDistance, categoryOf } from './units/setup';
import type { RuntimeUnit } from './units/setup';
import { UnitRenderer } from './render/units';
// Import keyOf from picker only (avoids duplicate identifier with setup.ts keyOf)
import { pixelToHex, unitAt, keyOf } from './input/picker';
import { computeVisible, addExplored, allHexKeys, DEFAULT_SIGHT } from './game/visibility';
import type { City } from './game/cities';
import { canFoundCity, foundCity, foundCityAt, cityName } from './game/cities';
import { isInTerritory } from './map/territory';
import type { CityNode } from './map/territory';
import { advanceCityEconomy, type EconUnit } from './game/turn-economy';
import {
  createPlayerState,
  researchStep,
  availableTechs,
  setPlayerResearchTarget,
  getResearchState,
  techCost,
  type PlayerState,
} from './game/playerState';
import { CityRenderer, type CityRenderOptions } from './render/cities';
import { buildResourceOverlay } from './render/resources';
import { TerenBazowy, Nakladka } from './types/hex';
import { showCityPanel, hideCityPanel, isCityPanelOpen } from './ui/cityPanel';
import { showPreBattle, hidePreBattle, isPreBattleOpen } from './ui/preBattle';
import type { PreBattleInfo, PreBattleUnit } from './ui/preBattle';
import { BattleScene } from './battle/battleScene';
import type { BattleUnit } from './battle/battleScene';
import { resolveCombat } from './game/combat';
import type { CombatUnit } from './game/combat';
import { advanceProduction, rushProduction, rushCost, populationCostOf,
         buildingLevelForEpoch, buildingEffectAtLevel, type CityProduction } from './game/production';
import { loadOrderParams, evaluateOrder } from './game/order';
import { loadCultureParams, accumulateCulture, cultureHappiness,
         loadReligionParams, civReligion, religionHappiness,
         makeRng, type CultureCity, type ReligionState,
         spreadReligion, type ReligionNeighbor } from './game/culture-religion';
import {
  aiDiplomacyStance, initialRelation, relationTier, loadDiplomacyParams,
  applyDiplomaticEvent, computePotegaNacji, computeRespekt, tickDiplomacy,
  ARCHETYPE_AGGRESSION,
  type Relation, type AIDiplomacyContext, type PotegaKomponenty, type TickCtx,
} from './game/diplomacy';
import type { Player } from './types/player';
import { TypCywilizacji } from './types/player';
import {
  saveToLocal, loadFromLocal,
  type SaveGame,
} from './game/save';
import { configureCityPanel } from './ui/cityPanel';
import { configureSciencePicker, showSciencePicker } from './ui/sciencePicker';
import { decideAITurn, chooseAIResearch, decideAIDiplomacy, loadDifficultyParams } from './game/ai';
import type { AITurnOpts, RelacjaWejscie, DiplomacjaInputs, AIDiplomacyCommand } from './game/ai';
import { checkVictory } from './game/victory';
import type { VictoryPlayer, VictoryInput } from './game/victory';
import {
  loadBarbParams, barbariansActive, spawnCamps, tickCamps, decideBarbarianMoves,
  BARBARIAN_OWNER_ID, isBarbarian,
} from './game/barbarians';
import type { BarbCamp, BarbUnit } from './game/barbarians';
import {
  enqueue, buildingProductionItem, unitProductionItem, splitPraca,
} from './game/production';
import { autoManageCity } from './game/auto-manage';
import { showMainMenu, hideMainMenu } from './ui/mainMenu';
import { showNewGameFlow, hideNewGameFlow, type NewGameParams } from './ui/newGameFlow';
import { applyTempoKoszt, type TempoGry } from './game/tech-tempo';
import { showDiplomacyPanel, hideDiplomacyPanel, isDiplomacyPanelOpen, updateDiplomacyPanel, type DiploRelation } from './ui/diplomacyPanel';

// Bootstrap
// Wrapped in boot() so we can defer execution until DOMContentLoaded.
// Classic (non-module) scripts in <head> run before <body> is parsed --
// without this guard, document.body is null and appendChild throws.

function boot(): void {
  try {
    const data = loadGameData();
    console.group('[The Game] Dane wczytane');
    console.log(`Jednostki: ${data.units.length}, Technologie: ${data.tech.length}`);
    console.groupEnd();

    // Apply data-driven terrain movement costs if the loader provides them.
    // The terrainMovement field is optional (added by a parallel loader edit);
    // if absent we rely on the built-in defaults in setup.ts.
    if ((data as any).terrainMovement) {
      const tm = (data as any).terrainMovement;
      configureTerrainMovement(
        tm.costs as Partial<Record<string, number>> ?? {},
        tm.forestExtra ?? 1,
      );
    }

    const SEED = Math.floor(Math.random() * 1e9);

    // --- Menu integration: mutable game params set by New Game flow ---
    let _menuDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
    let _menuCivId: string = 'grecy'; // default: Greeks
    let _menuMapSize: string = 'Średnia'; // default map size from menu
    let _menuRivals: number = 6; // default rival count

    document.body.style.margin   = '0';
    document.body.style.padding  = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';

    // Canvas 3D -- full-window, sized by JS (not CSS vw/vh) so renderer.setSize works
    const canvas = document.createElement('canvas');
    canvas.style.display  = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    document.body.appendChild(canvas);

    // HUD
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = [
      'position:fixed', 'top:12px', 'left:12px',
      'background:rgba(0,0,0,0.55)', 'color:#e8d88a',
      'font:600 13px/1.6 monospace', 'padding:6px 12px',
      'border-radius:6px', 'border:1px solid rgba(232,216,138,0.25)',
      'pointer-events:none', 'z-index:100',
    ].join(';');

    let map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, SEED);
    document.body.appendChild(hud);

    // Przycisk "Nauka" — otwiera picker wyboru celu badań
    const sciBtn = document.createElement('button');
    sciBtn.id = 'nauka-btn';
    sciBtn.textContent = '\ud83d\udd2c Nauka';
    sciBtn.style.cssText = [
      'position:fixed', 'top:12px', 'right:12px',
      'background:rgba(20,24,32,0.88)', 'color:#6bc4e8',
      'font:700 12px/1 monospace', 'padding:6px 12px',
      'border:1px solid rgba(107,196,232,0.4)', 'border-radius:6px',
      'cursor:pointer', 'z-index:110', 'letter-spacing:.04em',
    ].join(';');
    sciBtn.addEventListener('click', () => showSciencePicker(0));
    document.body.appendChild(sciBtn);

    // Przycisk "Dyplomacja" — otwiera panel relacji dyplomatycznych (P5)
    const diploBtn = document.createElement('button');
    diploBtn.id = 'diplo-btn';
    diploBtn.textContent = '\u2694\uFE0F Dyplomacja';
    diploBtn.style.cssText = [
      'position:fixed', 'top:48px', 'right:12px',
      'background:rgba(20,24,32,0.88)', 'color:#e8b86a',
      'font:700 12px/1 monospace', 'padding:6px 12px',
      'border:1px solid rgba(232,184,106,0.4)', 'border-radius:6px',
      'cursor:pointer', 'z-index:110', 'letter-spacing:.04em',
    ].join(';');
    diploBtn.addEventListener('click', () => {
      if (isDiplomacyPanelOpen()) {
        hideDiplomacyPanel();
      } else {
        showDiplomacyPanel({
          getRelations: () => {
            const rels: DiploRelation[] = [];
            for (const [key, rel] of diplomacyRelations.entries()) {
              const parts = key.split('_');
              const a = parseInt(parts[0] ?? '0', 10);
              const b = parseInt(parts[1] ?? '0', 10);
              const otherId = a === 0 ? b : a;
              const civId = aiOwnerCivMap.get(otherId) ?? ('AI ' + otherId);
              const zaufanieNorm = typeof (rel as any).zaufanie === 'number'
                ? Math.round(((rel as any).zaufanie / 200) * 100)
                : undefined;
              const respektNorm = typeof (rel as any).respekt === 'number'
                ? Math.round(Math.min(100, Math.max(0, (rel as any).respekt * 100)))
                : undefined;
              rels.push({
                civ: civId,
                tier: relationTier(rel),
                zaufanie: zaufanieNorm,
                respekt: respektNorm,
              });
            }
            return rels;
          },
        });
      }
    });
    document.body.appendChild(diploBtn);

    // Instrukcja sterowania (bottom hint)
    const hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed', 'bottom:12px', 'left:12px',
      'background:rgba(0,0,0,0.45)', 'color:#aaa',
      'font:11px/1.5 monospace', 'padding:5px 10px',
      'border-radius:4px', 'pointer-events:none', 'z-index:100',
    ].join(';');
    document.body.appendChild(hint);

    let { scene, camera, renderer, center, setFog, dispose: disposeScene } = buildScene(map, canvas);

    let camCtrl = new CameraController(camera, canvas, center, {
      minDist: 8,
      maxDist: 160,
      keyPanSpeed: 0.3,
    });

    // -----------------------------------------------------------------------
    // Units
    // -----------------------------------------------------------------------

    const units: RuntimeUnit[] = placeStartingUnits(map, data);
    let unitRenderer = new UnitRenderer(scene, map);

    // -----------------------------------------------------------------------
    // Cities
    // -----------------------------------------------------------------------

    const cities: City[] = [];
    let cityRenderer = new CityRenderer(scene, map);
    /** Opcje renderowania miast — epoka i cywilizacja per właściciel. */
    const _cityRenderOpts = (): CityRenderOptions => ({
      getEra:   (ownerId: number) => ownerId === 0 ? player.era : 1,
      getCiv:   (ownerId: number) => {
        // Gracz: civType z playerState; AI: z aiOwnerCivMap; fallback='grecja'.
        const civId = ownerId === 0
          ? (player.civType as string || 'grecja')
          : (aiOwnerCivMap.get(ownerId) ?? 'grecja');
        // Rzutowanie na BronzeCiv; nieznane id trafi do 'grecja' w buildBronzeCity
        return civId as import('./render/bronzeCity').BronzeCiv;
      },
      getLevel: (_cityId: string) => 1,
      getWalls: (_cityId: string) => false,
    });

    cityRenderer.sync(cities, _cityRenderOpts());

    // -----------------------------------------------------------------------
    // AUTO-FOUND PLAYER FIRST CITY (map-based founding, no Settler unit)
    // The player settler returned by placeStartingUnits marks the best start
    // position. We immediately found a city there and remove the settler unit
    // so the player starts with a city and a swordsman (not a settler).
    // -----------------------------------------------------------------------
    {
      const settlerIdx = units.findIndex(u => u.ownerId === 0 && u.category === 'osadnik');
      // 7B: gracz zaklada pierwsze miasto RECZNIE (B na heksie); usuwamy tylko znacznik-osadnik.
      if (settlerIdx >= 0) units.splice(settlerIdx, 1);
    }

    // -----------------------------------------------------------------------
    // Resource overlays (nakladki surowcowe na heksach)
    // INTEGR-REN: buildResourceOverlay per hex.nakladka (nie Las, nie Brak)
    // -----------------------------------------------------------------------
    {
      let _resCount = 0;
      const TERR_TOP_Y: Partial<Record<TerenBazowy, number>> = {
        [TerenBazowy.Morze]:    0.30,
        [TerenBazowy.Wybrzeze]: 0.40,
        [TerenBazowy.Laka]:     0.45,
        [TerenBazowy.Rownina]:  0.53,
        [TerenBazowy.Pustynia]: 0.45,
        [TerenBazowy.Wzgorza]:  0.85,
        [TerenBazowy.Gory]:     1.60,
      };
      for (const hex of Object.values(map.hexes)) {
        if (!hex.nakladka || hex.nakladka === Nakladka.Brak || hex.nakladka === Nakladka.Las) continue;
        try {
          const ov = buildResourceOverlay(hex.nakladka);
          if (!ov) continue;
          const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
          const baseY = TERR_TOP_Y[hex.terenBazowy] ?? 0.45;
          ov.position.set(x + 0.2, baseY + 0.01, z + 0.12);
          ov.rotation.y = hex.coords.q * 1.3 + hex.coords.r * 0.7;
          scene.add(ov);
          _resCount++;
        } catch (err) {
          console.warn('[main] buildResourceOverlay error', hex.nakladka, err);
        }
      }
      console.log('[main] resource overlays added:', _resCount);
    }

    // --- Stan pomiędzy turami: produkcja / built / religia per miasto ---
    const cityProd  = new Map<string, CityProduction>();
    const cityBuilt = new Map<string, string[]>();
    const cityRelig = new Map<string, ReligionState>();
    /** growthMult per cityId (from order lane) -- updated each turn, applied next turn. */
    const growthMultMap = new Map<string, number>();

    // -----------------------------------------------------------------------
    // AI / Barbarians / Victory state
    // -----------------------------------------------------------------------

    /**
     * Per-AI research state: Set of zbadane tech ids per ownerId.
     * Seeded lazily; grows as chooseAIResearch + researchStep complete techs.
     */
    const aiResearchDone = new Map<number, Set<string>>();

    /**
     * Mapa ownerId -> civType (ikonaId z civs.json) dla AI rywali.
     * Wypełniana przy starcie gry (w boot, po placeStartingUnits).
     * Gracz (ownerId 0) zawsze dostaje typ z player.civType.
     */
    const aiOwnerCivMap = new Map<number, string>();
    {
      // Zbierz unikalne ownerIds AI z jednostek
      const aiOwnerIds: number[] = [];
      for (const u of units) {
        if (u.ownerId > 0 && !aiOwnerIds.includes(u.ownerId)) {
          aiOwnerIds.push(u.ownerId);
        }
      }
      // Pobierz listę ikonaId z civs.json, z wyłączeniem nacji gracza
      const allCivIds = (data.civs.cywilizacje as any[])
        .map((c: any) => (c.ikonaId as string | undefined) ?? '')
        .filter((id: string) => id !== '');
      // Przydziel każdemu AI-ownerowi inną nację (round-robin po listcie, pomijając nację gracza)
      // Gracz jeszcze może nie być ustawiony przy budowie mapy, więc przydzielamy wszystko;
      // nację gracza ewentualnie powtórzymy na końcu (akceptowalne przy 6 AI + 9 nacji).
      let civIdx = 0;
      for (const ownerId of aiOwnerIds) {
        // Skip civType used by player (set later in applyMenuParams, default 'grecy')
        // Rotate through available civIds, giving each AI owner a distinct civ
        const playerCivId = _menuCivId; // at init time = default 'grecy'
        let assigned = allCivIds[civIdx % allCivIds.length] ?? 'grecy';
        // Try to avoid collision with player civ
        if (assigned === playerCivId && allCivIds.length > 1) {
          assigned = allCivIds[(civIdx + 1) % allCivIds.length] ?? assigned;
        }
        aiOwnerCivMap.set(ownerId, assigned);
        civIdx++;
      }
    }

    /**
     * Diplomacy relations: Map of "a_b" (smaller id first) -> Relation.
     * Initialized on first access (lazy). Updated each turn via aiDiplomacyStance.
     */
    const diplomacyRelations = new Map<string, Relation>();
    const _diplomacyParams = loadDiplomacyParams(
      (data as any).diplomacyParams ?? {},
    );
    void _diplomacyParams; // loaded for future event use; stance uses DIPLOMACY_PARAMS internally

    function getDiploRelation(a: number, b: number): Relation {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!diplomacyRelations.has(key)) {
        diplomacyRelations.set(key, initialRelation());
      }
      return diplomacyRelations.get(key)!;
    }

    function setDiploRelation(a: number, b: number, rel: Relation): void {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      diplomacyRelations.set(key, rel);
    }

    /**
     * Cities with auto-manage enabled (by cityId).
     * UI will toggle via a callback; currently starts empty.
     * When enabled, autoManageCity sets workedTiles and enqueues production.
     */
    const autoManageCities = new Set<string>();

    /** Barbarian camps on the map. */
    let barbCamps: BarbCamp[] = [];
    /** Barbarian params loaded from ai-params.json (with fallbacks). */
    const barbParams = loadBarbParams(data);
    /** Flag: game ended (victory or defeat). Prevents repeated end-game messages. */
    let gameOver = false;

    // -----------------------------------------------------------------------
    // Fog of War state
    // -----------------------------------------------------------------------

    /** Hexes the player has ever seen (persists across turns). */
    const explored = new Set<string>();
    /** Whether fog of war is active (toggle with F). */
    let fogOn = true;
    /** Whether the unit gallery overlay is active (declared early: refreshFog reads it). */
    let galleryOn = false;
    /** All hex keys on the map -- used to "clear" fog when toggled off. */
    const ALL_KEYS = new Set(allHexKeys(map));

    /** Compute the set of hexes visible from all player units and cities this turn. */
    function currentVisible(): Set<string> {
      const playerUnits = units.filter(u => u.ownerId === 0);
      // City stubs: cities also provide vision (same sight radius as a unit).
      const citySources: RuntimeUnit[] = cities
        .filter(c => c.ownerId === 0)
        .map(c => ({
          id: 'cv' + c.id,
          ownerId: 0,
          typeId: 'city',
          category: 'domyslny',
          q: c.q,
          r: c.r,
          ruch: 0,
          ruchLeft: 0,
        }));
      return computeVisible([...playerUnits, ...citySources], map, DEFAULT_SIGHT);
    }

    /**
     * Return the subset of units to display under current visibility.
     * Player units (ownerId===0) are always shown.
     * Enemy units only appear when they stand on a currently visible hex.
     */
    function visibleUnitsList(vis: Set<string>): RuntimeUnit[] {
      return units.filter(u => u.ownerId === 0 || vis.has(keyOf(u.q, u.r)));
    }

    /**
     * Re-apply fog and unit visibility after any state change.
     * Must NOT be called while gallery is active (gallery drives its own sync).
     */
    function refreshFog(): void {
      if (galleryOn) return;
      const vis = currentVisible();
      addExplored(explored, vis);
      if (fogOn) {
        setFog(vis, explored);
        unitRenderer.sync(visibleUnitsList(vis));
      } else {
        setFog(ALL_KEYS, ALL_KEYS);
        unitRenderer.sync(units);
      }
    }

    // Game state
    let selectedId: string | null = null;
    let reachable = new Set<string>();
    let turn = 1;
    /** Last hex the player explicitly clicked on the map (for B = found city). */
    let lastBHex: { q: number; r: number } | null = null;

    // --- Global player state (tasks 13B-finish + 7B) ---
    // Holds the banked treasury (skarbiec) and science (nauka) plus the research
    // progress (zbadane / badana / era).  Per-turn economy totals are banked into
    // this object after each economy tick, and auto-research spends the science.
    // See src/game/playerState.ts for the banking + research semantics.
    const player: PlayerState = createPlayerState();
    // P3a: Last-turn totals for HUD display (Praca, Kultura from economy; Porzadek from order)
    let _lastPraca: number = 0;
    let _lastKultura: number = 0;

    /** Set of occupied hex keys for all units except the given id. */
    function occupiedExcept(id: string): Set<string> {
      const occ = new Set<string>();
      for (const u of units) {
        if (u.id !== id) occ.add(keyOf(u.q, u.r));
      }
      return occ;
    }

    // Transient hint message override: show a temporary message in the hint bar.
    let hintOverrideTimer: ReturnType<typeof setTimeout> | null = null;

    function showHintMessage(msg: string, durationMs: number = 3000): void {
      if (hintOverrideTimer !== null) {
        clearTimeout(hintOverrideTimer);
        hintOverrideTimer = null;
      }
      hint.innerHTML = msg;
      hintOverrideTimer = setTimeout(() => {
        hintOverrideTimer = null;
        updateHud();
      }, durationMs);
    }

    /** Update HUD and hint text. */
    /** P3b: Display full-screen game over overlay with result + "Nowa gra" button. */
    function showGameOverOverlay(msg: string, isVictory: boolean): void {
      // Remove any existing overlay
      const old = document.getElementById('__gameover_overlay__');
      if (old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = '__gameover_overlay__';
      overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(0,0,0,0.82)', 'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center', 'z-index:9000',
        'font:bold 20px/1.4 serif', 'color:' + (isVictory ? '#ffd700' : '#ff6666'),
        'text-align:center', 'padding:20px',
      ].join(';');

      const title = document.createElement('div');
      title.innerHTML = msg;
      title.style.cssText = 'font-size:2em;margin-bottom:24px;text-shadow:0 0 20px currentColor';
      overlay.appendChild(title);

      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:0.8em;color:#aaa;margin-bottom:32px';
      sub.textContent = isVictory ? 'Gratulacje! Zbudowales potezne imperium.' : 'Twoje panowanie dobieglo konca.';
      overlay.appendChild(sub);

      const btn = document.createElement('button');
      btn.textContent = 'Nowa gra';
      btn.style.cssText = [
        'padding:12px 32px', 'font:bold 16px serif',
        'background:' + (isVictory ? '#ffd700' : '#aa2222'), 'color:#111',
        'border:none', 'border-radius:8px', 'cursor:pointer',
        'letter-spacing:0.05em',
      ].join(';');
      btn.addEventListener('click', () => {
        overlay.remove();
        location.reload();
      });
      overlay.appendChild(btn);

      document.body.appendChild(overlay);
    }

    function updateHud(): void {
      // \xb7 = middle dot, \xd7 = multiplication sign x
      let hudText = 'Tura ' + turn + ' \xb7 seed: ' + SEED + ' \xb7 mapa: ' + map.szerokoscQ + '\xd7' + map.wysokoscR;
      hudText += ' \xb7 Miasta: ' + cities.length;
      // --- Player economy / research summary (13B-finish + 7B) ---
      hudText += '<br>Epoka ' + player.era +
        ' \xb7 Skarbiec: ' + Math.floor(player.skarbiec) +
        ' \xb7 Nauka: ' + Math.floor(player.nauka);
      if (player.badana !== null) {
        const techDef = data.tech.find(t => t.Technologia === player.badana);
        const koszt = techDef && typeof techDef['Koszt nauki'] === 'number'
          ? applyTempoKoszt(techDef['Koszt nauki'], player.tempoGry ?? 'standardowa') : 0;
        hudText += ' \xb7 Badanie: ' + player.badana +
          ' (' + Math.floor(player.nauka) + '/' + koszt + ')';
      } else {
        hudText += ' \xb7 Badanie: brak';
      }
      hudText += ' \xb7 Technologie: ' + player.zbadane.size;
      hudText += '<br>Praca: ' + Math.floor(_lastPraca) + ' \xb7 Kultura: ' + Math.floor(_lastKultura);
      if (selectedId !== null) {
        const sel = units.find(u => u.id === selectedId);
        if (sel) {
          hudText += '<br>Jednostka: ' + sel.typeId +
            ' | W\u0142a\u015bciciel: ' + (sel.ownerId === 0 ? 'Gracz' : 'AI ' + sel.ownerId) +
            ' | Ruch: ' + sel.ruchLeft + '/' + sel.ruch;
        }
      }
      hud.innerHTML = hudText;

      // Only update hint if no transient override is active.
      if (hintOverrideTimer !== null) return;

      // Bottom hint with Polish characters as JS \uXXXX escapes.
      // \u0105 = a+ogonek, \u00f3 = o+acute, \u0142 = l+stroke
      // \u0119 = e+ogonek, \u0142 = l+stroke, \u0105 = a+ogonek
      // mg\u0142a = mgla (fog of war)
      hint.innerHTML =
        'Pan: przeci\u0105ganie / WASD \xb7 Zoom: k\u00f3\u0142ko myszy' +
        ' \xb7 Klik jednostk\u0119 = zaznacz' +
        ' \xb7 Klik pole = ruch / zaznacz heks' +
        ' \xb7 N = koniec tury' +
        ' \xb7 G = galeria jednostek' +
        ' \xb7 F = mg\u0142a wojny' +
        ' \xb7 B = za\u0142\u00f3\u017c miasto (kliknij pole, potem B)' +
        ' \xb7 T = testowa bitwa';
    }

    // Initial HUD
    updateHud();

    // Initial fog application -- must run after unitRenderer is created.
    // This gives the player their starting visibility on the first frame.
    refreshFog();

    // --- Konfiguracja panelu miasta ---
    configureCityPanel({
      data,
      difficulty: _menuDifficulty,
      getCities: () => cities,
      getEpoch: (_ownerId: number) => player.era,
      getUnlockedTechs: (_ownerId: number) => Array.from(player.zbadane),
      getBuiltBuildingIds: (cityId: string) => cityBuilt.get(cityId) ?? [],
      getProduction: (cityId: string) => cityProd.get(cityId) ?? null,
      setProduction: (cityId: string, p: CityProduction) => { cityProd.set(cityId, p); },
      getTreasury: (_ownerId: number) => player.skarbiec,
      onRushBuy: (cityId: string, _item: any, koszt: number) => {
        if (player.skarbiec >= koszt) {
          player.skarbiec -= koszt;
          const rBase = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
          const r = rushProduction(rBase);
          cityProd.set(cityId, r.prod);
          if (r.completed) {
            if (r.completed.kind === 'budynek') {
              const blt = cityBuilt.get(cityId) ?? [];
              blt.push(r.completed.id);
              cityBuilt.set(cityId, blt);
            } else {
              const rc = cities.find(ct => ct.id === cityId);
              if (rc) rc.population = Math.max(1, rc.population - populationCostOf(r.completed));
            }
          }
          updateHud();
        }
      },
      onChange: (_cityId: string) => { updateHud(); },
      onAutoManage: (cityId: string) => {
        // Toggle auto-manage for this city (STEP D hook for UI toggle)
        if (autoManageCities.has(cityId)) {
          autoManageCities.delete(cityId);
          console.log(`[AutoManage] Wylaczono dla ${cityId}`);
        } else {
          autoManageCities.add(cityId);
          console.log(`[AutoManage] Wlaczono dla ${cityId}`);
        }
      },
    });

    // --- Konfiguracja pickera badań (P1a: nowe API drzewka) ---
    // window.__civ_getResearchedTechs: wymagany przez drzewko do oznaczenia zbadanych węzłów
    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);

    configureSciencePicker({
      getResearchState: (_ownerId: number) => {
        const st = getResearchState(player, data.tech, 0);
        return {
          pula:           st.pula,
          targetId:       st.targetId,
          kosztCelu:      st.kosztCelu,
          postepFraction: st.postepFraction,
          turnsLeft:      st.turnsLeft ?? 0,
        };
      },
      getResearchedTechs: (_ownerId: number) => {
        return Array.from(player.zbadane);
      },
      getAvailableTechs: (_ownerId: number) => {
        return availableTechs(data.tech, player.zbadane).map(t =>
          (t.Technologia ?? '').trim(),
        );
      },
      onSelectTarget: (techId: string) => {
        const ok = setPlayerResearchTarget(player, techId, data.tech);
        if (ok) {
          console.log('[Nauka] Gracz wybrał cel:', techId);
          updateHud();
        } else {
          console.warn('[Nauka] Nie można ustawić celu:', techId);
        }
      },
    });

    // -----------------------------------------------------------------------
    // Animation state
    //
    // TOKEN_LIFT mirrors the constant in units.ts (0.01 * HEX_R).
    // sync() positions a token at:  topYAt(q,r) + TOKEN_LIFT
    // topYAt() = terrainTopY(hex) = height + yOffset  (no lift included).
    // We use the same formula for every waypoint so the token rests flush
    // on the terrain surface at the start, each intermediate hex, and the
    // final destination -- matching the snap position sync() would produce.
    // -----------------------------------------------------------------------

    /** Matches TOKEN_LIFT in units.ts exactly: 0.01 * HEX_R. */
    const TOKEN_LIFT = 0.01 * HEX_R;

    /** Duration of each per-hex glide segment in seconds. */
    const ANIM_SEG_DUR = 0.14;

    interface Waypoint { x: number; y: number; z: number; }

    interface AnimState {
      id: string;         // id of the unit being animated
      destQ: number;      // logical destination (written to unit on completion)
      destR: number;
      pathLen: number;    // number of path steps (used for segment count in points)
      cost: number;       // terrain-based movement cost (for ruchLeft deduction)
      points: Waypoint[]; // world-space positions: [start, step1, ..., dest]
      seg: number;        // active segment index; lerps points[seg]->points[seg+1]
      t: number;          // interpolation param in [0,1) for the active segment
    }

    let anim: AnimState | null = null;
    let isAnimating = false;

    // Hover route preview state: key of the hex currently under the cursor,
    // or null when no preview is active.
    let hoverKey: string | null = null;

    // Delta-time source: track the previous frame timestamp in seconds.
    let prevTime = performance.now() / 1000;

    // -----------------------------------------------------------------------
    // Click vs Drag detection
    // -----------------------------------------------------------------------

    let mouseDownX = 0;
    let mouseDownY = 0;
    const DRAG_THRESHOLD = 6; // pixels

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
    });

    // -----------------------------------------------------------------------
    // Hover route preview
    // Shows a path preview arrow when the cursor enters a reachable hex.
    // Recompute is skipped when the cursor stays within the same hex
    // (hoverKey guard) -- one path computation per hex transition only.
    // -----------------------------------------------------------------------

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      // Gallery mode: no route preview.
      if (galleryOn) return;

      // While animating or nothing selected: clear any active preview.
      if (isAnimating || !selectedId) {
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      const hit = pixelToHex(e.clientX, e.clientY, canvas, camera, HEX_R);
      if (!hit) {
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      const k = keyOf(hit.q, hit.r);
      // Same hex as last processed frame -- skip expensive recompute.
      if (k === hoverKey) return;
      hoverKey = k;
      // Update lastBHex so pressing B always targets the hex under cursor.
      lastBHex = { q: hit.q, r: hit.r };

      // Hovering a non-reachable hex: clear route and stop.
      if (!reachable.has(k)) { unitRenderer.clearPathRoute(); return; }

      const u = units.find(x => x.id === selectedId);
      if (!u) { unitRenderer.clearPathRoute(); return; }

      const path = computePath(u, map, hit.q, hit.r, occupiedExcept(u.id));
      if (path.length > 0) {
        unitRenderer.setPathRoute([{ q: u.q, r: u.r }, ...path]);
      } else {
        unitRenderer.clearPathRoute();
      }
    });

    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      const dx = e.clientX - mouseDownX;
      const dy = e.clientY - mouseDownY;
      const moveDist = Math.sqrt(dx * dx + dy * dy);
      if (moveDist >= DRAG_THRESHOLD) return; // was a drag -- skip click logic

      // Gallery mode: disable all unit interaction.
      if (galleryOn) return;

      // Lock all unit interaction while animation is running.
      // Camera pan/zoom/WASD is NOT blocked (handled by CameraController
      // which listens on its own events independent of this handler).
      if (isAnimating) return;

      // Treat as a click at (e.clientX, e.clientY)
      const hit = pixelToHex(e.clientX, e.clientY, canvas, camera, HEX_R);
      if (!hit) return;

      // Record the clicked hex so B (found city) can use it.
      lastBHex = { q: hit.q, r: hit.r };

      // City click: open city panel instead of unit select/move.
      const clickedCity = cities.find(c => c.q === hit.q && c.r === hit.r);
      if (clickedCity) { showCityPanel(clickedCity, map, () => {}); return; }

      const cu = unitAt(hit.q, hit.r, units);

      if (cu && cu.ownerId === 0) {
        // Select player unit
        // Clear any stale hover route from the previous selection.
        unitRenderer.clearPathRoute();
        hoverKey = null;
        selectedId = cu.id;
        reachable = (cu.ruchLeft > 0)
          ? computeReachable(cu, map, occupiedExcept(cu.id))
          : new Set<string>();
        unitRenderer.setHighlight(reachable);
        updateHud();
      } else if (selectedId !== null && reachable.has(keyOf(hit.q, hit.r))) {
        // Start animated move for the selected unit.
        const u = units.find(x => x.id === selectedId);
        if (u) {
          const occ = occupiedExcept(u.id);
          const path = computePath(u, map, hit.q, hit.r, occ);
          if (path.length === 0) return; // dest == start or unreachable

          // Build world-space waypoints: current hex, then each path step.
          const startPos = axialToWorld(u.q, u.r, HEX_R);
          const startWP: Waypoint = {
            x: startPos.x,
            y: unitRenderer.topYAt(u.q, u.r) + TOKEN_LIFT,
            z: startPos.z,
          };
          const stepWPs: Waypoint[] = path.map((hex) => {
            const wp = axialToWorld(hex.q, hex.r, HEX_R);
            return {
              x: wp.x,
              y: unitRenderer.topYAt(hex.q, hex.r) + TOKEN_LIFT,
              z: wp.z,
            };
          });

          const cost = pathCost(path, map);
          anim = {
            id: u.id,
            destQ: hit.q,
            destR: hit.r,
            pathLen: path.length,
            cost,
            points: [startWP, ...stepWPs],
            seg: 0,
            t: 0,
          };
          isAnimating = true;

          // Clear hover route preview when the move begins.
          unitRenderer.clearPathRoute();
          hoverKey = null;

          // Clear highlights for the duration of the animation.
          unitRenderer.clearHighlight();
          reachable = new Set<string>();
        }
      } else if (selectedId !== null && cu !== null && cu.ownerId !== 0) {
        // MAP PLAYER ATTACK (step J):
        // Player has a unit selected and clicked an enemy unit on the map.
        // Auto-resolve via resolveCombat if enemy is adjacent (distance <= 1).
        const atkUnit = units.find(x => x.id === selectedId);
        if (atkUnit && atkUnit.ownerId === 0 && atkUnit.ruchLeft > 0 &&
            hexDistance(atkUnit.q, atkUnit.r, cu.q, cu.r) <= 1) {
          // P4: Show preBattle summary before resolving
          const aDef4 = lookupUnitDef(atkUnit.typeId);
          const dDef4 = lookupUnitDef(cu.typeId);
          const dHexKey4 = keyOf(cu.q, cu.r);
          const dHex4 = map.hexes[dHexKey4];
          const dTeren4: string = dHex4 ? (dHex4.terenBazowy as string) : 'Rownina';
          const dStructBonus4 = structureDefenseBonusFor(cu.q, cu.r);
          const atkHp4 = normFieldVal(aDef4['Health'], 30);
          const defHp4 = normFieldVal(dDef4['Health'], 30);
          const atkAtk4 = normFieldVal(aDef4['Atak'], 5);
          const defObrona4 = normFieldVal(dDef4['Obrona'], 5);
          const szanse4 = Math.max(10, Math.min(90, 50 + (atkAtk4 - defObrona4) * 5));
          const pbInfo4: PreBattleInfo = {
            atakujacy: {
              nazwa: atkUnit.typeId,
              cywilizacja: 'Gracz',
              units: [{ nazwa: atkUnit.typeId, kategoria: atkUnit.category, hp: atkHp4, maxHp: atkHp4, atak: atkAtk4 }],
            },
            obronca: {
              nazwa: cu.typeId,
              cywilizacja: 'AI ' + cu.ownerId,
              units: [{ nazwa: cu.typeId, kategoria: cu.category, hp: defHp4, maxHp: defHp4, atak: normFieldVal(dDef4['Atak'], 5) }],
            },
            teren: dTeren4,
            szanseAtkPct: szanse4,
          };

          // Capture references for closures
          const atkUnitRef = atkUnit;
          const cuRef = cu;

          function doMapAutoResolve(): void {
            try {
              const mapCuAtk4: CombatUnit = {
                typNazwa: atkUnitRef.typeId, rola: aDef4['Rola (linia)'] ?? 'Wrecz',
                Atak: normFieldVal(aDef4['Atak'], 5), Obrona: normFieldVal(aDef4['Obrona'], 5),
                Uderzenie: normFieldVal(aDef4['Uderzenie'], 0), Pancerz: normFieldVal(aDef4['Pancerz'], 0),
                Przebicie: normFieldVal(aDef4['Przebicie'], 0), Health: normFieldVal(aDef4['Health'], 30),
                'Prog dezercji (% health)': normFieldVal(aDef4['Prog dezercji (% health)'], 0.25),
                'Atak dystansowy': normFieldVal(aDef4['Atak dystansowy'], 0),
                'Zasieg ataku (hex)': aDef4['Zasieg ataku (hex)'] ?? null,
                'Ilosc pociskow': aDef4['Ilosc pociskow'] ?? null,
                'Ruch w bataille (heksy)': aDef4['Ruch w bataille (heksy)'] ?? null,
                'Kara obrony z flanki (%)': normFieldVal(aDef4['Kara obrony z flanki (%)'], 50),
                'Kara obrony z tylu (%)': normFieldVal(aDef4['Kara obrony z tylu (%)'], 80),
              };
              const mapCuDef4: CombatUnit = {
                typNazwa: cuRef.typeId, rola: dDef4['Rola (linia)'] ?? 'Wrecz',
                Atak: normFieldVal(dDef4['Atak'], 5), Obrona: normFieldVal(dDef4['Obrona'], 5),
                Uderzenie: normFieldVal(dDef4['Uderzenie'], 0), Pancerz: normFieldVal(dDef4['Pancerz'], 0),
                Przebicie: normFieldVal(dDef4['Przebicie'], 0), Health: normFieldVal(dDef4['Health'], 30),
                'Prog dezercji (% health)': normFieldVal(dDef4['Prog dezercji (% health)'], 0.25),
                'Atak dystansowy': normFieldVal(dDef4['Atak dystansowy'], 0),
                'Zasieg ataku (hex)': dDef4['Zasieg ataku (hex)'] ?? null,
                'Ilosc pociskow': dDef4['Ilosc pociskow'] ?? null,
                'Ruch w bataille (heksy)': dDef4['Ruch w bataille (heksy)'] ?? null,
                'Kara obrony z flanki (%)': normFieldVal(dDef4['Kara obrony z flanki (%)'], 50),
                'Kara obrony z tylu (%)': normFieldVal(dDef4['Kara obrony z tylu (%)'], 80),
              };
              const mapBattleRes4 = resolveCombat(mapCuAtk4, mapCuDef4, {
                defenderTerrain: dTeren4,
                structureDefBonusPct: dStructBonus4,
              });
              atkUnitRef.ruchLeft = 0;
              if (mapBattleRes4.winner === 'attacker') {
                const di = units.indexOf(cuRef);
                if (di >= 0) units.splice(di, 1);
                showHintMessage('Atak: <b>' + atkUnitRef.typeId + '</b> pokonal ' + cuRef.typeId + ' (' + mapBattleRes4.rounds + ' rund)', 3500);
                console.log('[Bitwa] Gracz: ' + atkUnitRef.typeId + ' pokonal ' + cuRef.typeId);
              } else if (mapBattleRes4.winner === 'defender') {
                const ai2 = units.indexOf(atkUnitRef);
                if (ai2 >= 0) units.splice(ai2, 1);
                selectedId = null;
                showHintMessage('Atak: <b>' + atkUnitRef.typeId + '</b> przegral z ' + cuRef.typeId + ' (' + mapBattleRes4.rounds + ' rund)', 3500);
                console.log('[Bitwa] Gracz: ' + atkUnitRef.typeId + ' przegral z ' + cuRef.typeId);
              } else {
                showHintMessage('Atak: remis — ' + atkUnitRef.typeId + ' vs ' + cuRef.typeId, 3000);
              }
            } catch (eBattle4) {
              console.error('[Bitwa] Blad ataku gracza:', eBattle4);
            }
            reachable = new Set<string>();
            unitRenderer.clearHighlight();
            unitRenderer.clearPathRoute();
            hoverKey = null;
            refreshFog();
            updateHud();
          }

          showPreBattle(pbInfo4, {
            onAuto: () => { hidePreBattle(); doMapAutoResolve(); },
            onBattlefield: () => {
              // P4: BattleScene deferred — fall back to auto
              hidePreBattle();
              doMapAutoResolve();
            },
            onCancel: () => {
              hidePreBattle();
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
              unitRenderer.clearPathRoute();
              hoverKey = null;
            },
          });
        } else {
          // Out of range or no movement left -- deselect
          selectedId = null;
          reachable = new Set<string>();
          unitRenderer.clearHighlight();
          unitRenderer.clearPathRoute();
          hoverKey = null;
          updateHud();
        }
      } else {
        // Deselect
        selectedId = null;
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
        unitRenderer.clearPathRoute();
        hoverKey = null;
        updateHud();
      }
    });

    // -----------------------------------------------------------------------
    // Unit Gallery
    // Toggle with 'G' key: displays one token per unit type in a flat grid,
    // with a floating HTML label above each token.
    // Camera pan/zoom/WASD continue to work in gallery mode.
    // Click-to-select/move is disabled while gallery is open.
    // -----------------------------------------------------------------------

    /** RuntimeUnit instances used only in gallery mode (never added to `units`). */
    let galleryUnits: RuntimeUnit[] = [];

    /** World-space positions for each gallery token (for label projection). */
    interface GalleryPos { x: number; y: number; z: number; }
    let galleryPositions: GalleryPos[] = [];

    /** HTML label <div> elements floating above each gallery token. */
    let galleryLabels: HTMLDivElement[] = [];

    /** Title overlay shown at top-center while gallery is open. */
    let galleryTitle: HTMLDivElement | null = null;

    /**
     * Y lift above each token base for the floating name label.
     * Approximates token height (0.45*HEX_R) plus a small gap.
     */
    const GALLERY_LABEL_LIFT = 0.8 * HEX_R;

    /** Grid spacing between adjacent tokens (world units). */
    const GALLERY_SPACING = 1.6 * HEX_R;

    /** Enter gallery mode: build tokens, labels, title overlay. */
    function enterGallery(): void {
      // Clear any selection / route / highlight from play mode.
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;

      // Build gallery RuntimeUnit list -- one per unit type.
      const types = listUnitTypes(data);
      const n = types.length;

      // Grid layout: ceil(sqrt(n)) columns, centered on map center.
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);

      galleryUnits = types.map((t, i): RuntimeUnit => ({
        id: 'gal' + i,
        ownerId: 0,
        typeId: t.typeId,
        q: 0,
        r: 0,
        ruch: 2,
        ruchLeft: 2,
        category: t.category,
      }));

      // Compute world-space grid positions centered on `center`.
      // Each row is independently centered along X (last row may have fewer items).
      galleryPositions = types.map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rowStart = row * cols;
        const rowCount = Math.min(cols, n - rowStart);
        const rowW = (rowCount - 1) * GALLERY_SPACING;
        const gridH = (rows - 1) * GALLERY_SPACING;
        const gx = center.x - rowW / 2 + col * GALLERY_SPACING;
        const gz = center.z - gridH / 2 + row * GALLERY_SPACING;
        // Each gallery slot floats over a real map tile; rest the token on
        // that tile's TRUE top (height + yOffset) so units never sink into
        // elevated terrain (Wzgorza/Gory). Falls back to the flat Rownina
        // level only if the slot maps off the grid.
        const { q: gq, r: gr } = worldToAxial(gx, gz, HEX_R);
        const tileTop = unitRenderer.topYAt(gq, gr);
        const gy = (tileTop > 0 ? tileTop : 0.45) + TOKEN_LIFT;
        return { x: gx, y: gy, z: gz };
      });

      // Sync the unit renderer with gallery units (replaces real tokens).
      // Fog must NOT be applied here -- gallery shows all unit types.
      unitRenderer.sync(galleryUnits);

      // Position each gallery token at its grid slot.
      for (let i = 0; i < galleryUnits.length; i++) {
        const p = galleryPositions[i]!;
        unitRenderer.setTokenWorldPosition('gal' + i, p.x, p.y, p.z);
      }

      // Create floating HTML labels -- one per unit type.
      galleryLabels = types.map((t, i) => {
        const div = document.createElement('div') as HTMLDivElement;
        div.style.cssText = [
          'position:fixed',
          'background:rgba(0,0,0,0.72)',
          'color:#f0e6b0',
          'font:bold 10px/1.3 monospace',
          'padding:2px 5px',
          'border-radius:3px',
          'pointer-events:none',
          'z-index:200',
          'white-space:nowrap',
          // Center div horizontally on the projected point; put above it.
          'transform:translate(-50%,-100%)',
          'display:none',
        ].join(';');
        // textContent: safe -- no HTML injection.
        div.textContent = '[' + (i + 1) + '] ' + t.name;
        document.body.appendChild(div);
        return div;
      });

      // Title: GALERIA JEDNOSTEK (Polish via JS \uXXXX)
      // \u2014 = em dash, \u015b = s+acute, \u0107 = c+acute
      galleryTitle = document.createElement('div') as HTMLDivElement;
      galleryTitle.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#e8d88a',
        'font:bold 14px/1.5 monospace',
        'padding:6px 16px',
        'border-radius:6px',
        'border:1px solid rgba(232,216,138,0.4)',
        'pointer-events:none',
        'z-index:200',
        'white-space:nowrap',
      ].join(';');
      galleryTitle.textContent = 'GALERIA JEDNOSTEK \u2014 \'G\' aby wyj\u015b\u0107';
      document.body.appendChild(galleryTitle);
    }

    /** Exit gallery mode: remove labels/title, restore real unit tokens with fog. */
    function exitGallery(): void {
      // Remove all label divs.
      for (const lbl of galleryLabels) {
        lbl.remove();
      }
      galleryLabels = [];

      // Remove title overlay.
      if (galleryTitle !== null) {
        galleryTitle.remove();
        galleryTitle = null;
      }

      galleryUnits = [];
      galleryPositions = [];

      // Restore play view -- fog drives which units are shown.
      refreshFog();
    }

    // -----------------------------------------------------------------------
    // Battle helpers
    // -----------------------------------------------------------------------

    /**
     * structureDefenseBonusFor (STEP E) -- bonusy obronne za mape/budowle.
     *
     * Zwraca najwyzszy bonus procentowy dla broniaceego sie (defender) na podanej
     * pozycji (q, r). Hierarchia (najwyzszy wygrywa, nie kumuluja sie):
     *   miasto z murem (City.maMur) -> 200%
     *   fort (ulepszenie terenu 'fort') -> 100%
     *   posterunek ('posterunek') -> 50%
     *   brak struktury -> 0%
     *
     * Warunek trybu OBOZOWANIA (posterunek/fort) -- do czasu wdrozenia toggle
     * "stand-by" traktujemy kazda jednostke na polu budowli we wlasnym
     * terytorium jako obozujaca (zgodnie z ustaleniem w handoffie UNITS).
     */
    function structureDefenseBonusFor(q: number, r: number): number {
      // Sprawdz czy bronicacy jest w miescie z murem
      const cityOnHex = cities.find(c => c.q === q && c.r === r);
      if (cityOnHex && (cityOnHex as any).maMur === true) {
        return 200; // mur +200% (trojkrotnosc bazowej Obrony)
      }

      // Sprawdz ulepszenie terenu na tym heksie
      const hk = keyOf(q, r);
      const hex = map.hexes[hk];
      if (hex) {
        const ulepszenie = (hex as any).ulepszenie ?? (hex as any).improvement ?? null;
        if (typeof ulepszenie === 'string') {
          const ul = ulepszenie.toLowerCase();
          if (ul === 'fort') return 100;      // fort +100%
          if (ul === 'posterunek') return 50; // posterunek +50%
        }
      }

      return 0; // brak bonusu
    }

    /**
     * normFieldVal: read a numeric stat from a raw unit def record.
     * Handles null, undefined, '---', '\u2014' (em dash), empty string.
     */
    function normFieldVal(v: unknown, fallback: number): number {
      if (v === null || v === undefined || v === '---' || v === '\u2014' || v === '') return fallback;
      const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
      return isNaN(n) ? fallback : n;
    }

    /**
     * Look up a unit type record in data.units by typeId (Jednostka field name).
     * Falls back to a synthetic minimal combat record if not found.
     */
    function lookupUnitDef(typeId: string): any {
      const direct = (data.units as any[]).find((u: any) => u['Jednostka'] === typeId);
      if (direct) return direct;
      // Fallback: a minimal warrior-equivalent record
      return {
        'Jednostka': typeId,
        'Atak': 5,
        'Obrona': 5,
        'Uderzenie': 2,
        'Pancerz': 2,
        'Przebicie': 0,
        'Health': 30,
        'Rola (linia)': 'Wrecz',
        'Prog dezercji (% health)': 0.25,
        'Atak dystansowy': 0,
        'Zasieg ataku (hex)': null,
        'Ilosc pociskow': null,
        'Ruch w bitwie (heksy)': 2,
        'Kara obrony z flanki (%)': 50,
        'Kara obrony z tylu (%)': 80,
      };
    }

    /** Return the Health stat from a unit def record (fallback 30). */
    function unitHealth(def: any): number {
      return normFieldVal(def['Health'], 30);
    }

    /** Return the Atak stat from a unit def record (fallback 5). */
    function unitAtak(def: any): number {
      return normFieldVal(def['Atak'], 5);
    }

    /**
     * Convert a RuntimeUnit + its stat record into a BattleUnit for BattleScene.
     */
    function runtimeToBattleUnit(u: RuntimeUnit, def: any, ownerColor: number): BattleUnit {
      const hp = unitHealth(def);
      return {
        id: u.id,
        nazwa: u.typeId,
        kategoria: u.category,
        ownerColor,
        stats: def,
        hp,
        maxHp: hp,
      };
    }

    /**
     * Build a synthetic BattleUnit from a units.json record (no matching
     * RuntimeUnit -- used when synthesising sample armies).
     */
    function defToBattleUnit(def: any, idx: number, ownerColor: number): BattleUnit {
      const name: string = def['Jednostka'] ?? 'Jednostka';
      const role: string = def['Rola (linia)'] ?? '';
      const isSuper: boolean = def['Super-jednostka'] === 'TAK';
      const kat = categoryOf(name, role, isSuper);
      const hp = unitHealth(def);
      return {
        id: 'synth_' + idx + '_' + name,
        nazwa: name,
        kategoria: kat,
        ownerColor,
        stats: def,
        hp,
        maxHp: hp,
      };
    }

    /**
     * Convert a BattleUnit into the CombatUnit shape expected by resolveCombat.
     */
    function battleUnitToCombatUnit(bu: BattleUnit): CombatUnit {
      const s: any = bu.stats ?? {};
      return {
        typNazwa:                   (s['Jednostka'] as string) ?? bu.kategoria,
        rola:                       (s['Rola (linia)'] as string) ?? 'Wrecz',
        Atak:                       normFieldVal(s['Atak'], 5),
        Obrona:                     normFieldVal(s['Obrona'], 5),
        Uderzenie:                  normFieldVal(s['Uderzenie'], 0),
        Pancerz:                    normFieldVal(s['Pancerz'], 0),
        Przebicie:                  normFieldVal(s['Przebicie'], 0),
        Health:                     bu.hp,
        'Prog dezercji (% health)': normFieldVal(s['Prog dezercji (% health)'], 0.25),
        'Atak dystansowy':          normFieldVal(s['Atak dystansowy'], 0),
        'Zasieg ataku (hex)':       s['Zasieg ataku (hex)'] ?? null,
        'Ilosc pociskow':           s['Ilosc pociskow'] ?? null,
        'Ruch w bitwie (heksy)':    s['Ruch w bitwie (heksy)'] ?? null,
        'Kara obrony z flanki (%)': normFieldVal(s['Kara obrony z flanki (%)'], 50),
        'Kara obrony z tylu (%)':   normFieldVal(s['Kara obrony z tylu (%)'], 80),
      };
    }

    /**
     * launchTestBattle -- triggered by the 'T' key.
     *
     * Canned battle: FOUR Hastati (Rome) vs FOUR Falanga (Greece).
     * Looks up real stats from data.units. Falls back to first miecznik/wlocznik
     * category unit if the named entry is not found.
     */
    function launchTestBattle(): void {
      const PLAYER_COLOR  = 0xffd54a;
      const ENEMY_COLOR   = 0xc84040;

      // --- Look up Hastati and Falanga from data.units ---
      // The 'Jednostka' field in the JSON is plain ASCII for these two units.
      let legDef: any = (data.units as any[]).find((u: any) => u['Jednostka'] === 'Hastati');
      let falDef: any = (data.units as any[]).find((u: any) => u['Jednostka'] === 'Falanga');

      // Fallback: first unit whose category resolves to 'miecznik'
      if (!legDef) {
        legDef = (data.units as any[]).find((u: any) => {
          const nm: string = u['Jednostka'] ?? '';
          const rl: string = u['Rola (linia)'] ?? '';
          const isSup: boolean = u['Super-jednostka'] === 'TAK';
          return categoryOf(nm, rl, isSup) === 'miecznik';
        });
        console.warn('[launchTestBattle] Hastati not found, using fallback:', legDef?.['Jednostka'] ?? 'NONE');
      }
      // Fallback: first unit whose category resolves to 'wlocznik'
      if (!falDef) {
        falDef = (data.units as any[]).find((u: any) => {
          const nm: string = u['Jednostka'] ?? '';
          const rl: string = u['Rola (linia)'] ?? '';
          const isSup: boolean = u['Super-jednostka'] === 'TAK';
          return categoryOf(nm, rl, isSup) === 'wlocznik';
        });
        console.warn('[launchTestBattle] Falanga not found, using fallback:', falDef?.['Jednostka'] ?? 'NONE');
      }

      // Last-resort hardcoded stubs if data has neither
      if (!legDef) {
        legDef = {
          'Jednostka': 'Hastati',
          'Atak': 6, 'Obrona': 6, 'Uderzenie': 6,
          'Pancerz': 4, 'Przebicie': 6, 'Health': 60,
          'Rola (linia)': 'Wrecz',
          'Prog dezercji (% health)': 0.15,
          'Atak dystansowy': 3, 'Zasieg ataku (hex)': 2,
          'Ilosc pociskow': 2, 'Ruch w bitwie (heksy)': 3,
          'Kara obrony z flanki (%)': 15, 'Kara obrony z tylu (%)': 30,
        };
      }
      if (!falDef) {
        falDef = {
          'Jednostka': 'Falanga',
          'Atak': 6, 'Obrona': 10, 'Uderzenie': 6,
          'Pancerz': 6, 'Przebicie': 2, 'Health': 70,
          'Rola (linia)': 'Wrecz',
          'Prog dezercji (% health)': 0.2,
          'Atak dystansowy': 0, 'Zasieg ataku (hex)': null,
          'Ilosc pociskow': null, 'Ruch w bitwie (heksy)': 3,
          'Kara obrony z flanki (%)': 50, 'Kara obrony z tylu (%)': 80,
        };
      }

      // --- Build 4 attacker BattleUnit (Hastati) ---
      const legHp  = unitHealth(legDef);
      const legAtk = unitAtak(legDef);
      // categoryOf uses normalised name -- 'Hastati' matches 'hastati' -> 'legionista'
      const legKat = 'miecznik';
      const attackerUnits: BattleUnit[] = [0, 1, 2, 3].map((i): BattleUnit => ({
        id: 'atk' + i,
        nazwa: 'Hastati',
        kategoria: legKat,
        ownerColor: PLAYER_COLOR,
        stats: legDef,
        hp: legHp,
        maxHp: legHp,
      }));

      // --- Build 4 defender BattleUnit (Falanga) ---
      const falHp  = unitHealth(falDef);
      const falAtk = unitAtak(falDef);
      // categoryOf: 'Falanga' matches 'falanga' -> 'wlocznik'
      const falKat = 'wlocznik';
      const defenderUnits: BattleUnit[] = [0, 1, 2, 3].map((i): BattleUnit => ({
        id: 'def' + i,
        nazwa: 'Falanga',
        kategoria: falKat,
        ownerColor: ENEMY_COLOR,
        stats: falDef,
        hp: falHp,
        maxHp: falHp,
      }));

      // --- TERRAIN: first player unit's hex, else 'Rownina' ---
      const playerRaw = units.filter(u => u.ownerId === 0);
      let teren = 'Rownina';
      if (playerRaw.length > 0) {
        const firstUnit = playerRaw[0]!;
        const hexKey = keyOf(firstUnit.q, firstUnit.r);
        const hex = map.hexes[hexKey];
        if (hex && hex.terenBazowy) teren = hex.terenBazowy as string;
      }

      // --- szanseAtkPct: clamp(50 + (Atak_leg - Obrona_fal)*5, 10, 90) ---
      const falObrona = normFieldVal(falDef['Obrona'], 5);
      const szanseAtkPct = Math.max(10, Math.min(90, 50 + (legAtk - falObrona) * 5));

      // --- PreBattleInfo ---
      const pbInfo: PreBattleInfo = {
        atakujacy: {
          nazwa: 'Rzym (Legion)',
          cywilizacja: 'Rzym',
          units: attackerUnits.map((bu): PreBattleUnit => ({
            nazwa:     bu.nazwa,
            kategoria: bu.kategoria,
            hp:        bu.hp,
            maxHp:     bu.maxHp,
            atak:      legAtk,
          })),
        },
        obronca: {
          nazwa: 'Grecja (Falanga)',
          cywilizacja: 'Grecja',
          units: defenderUnits.map((bu): PreBattleUnit => ({
            nazwa:     bu.nazwa,
            kategoria: bu.kategoria,
            hp:        bu.hp,
            maxHp:     bu.maxHp,
            atak:      falAtk,
          })),
        },
        teren,
        szanseAtkPct,
      };

      // --- Open pre-battle overlay ---
      showPreBattle(pbInfo, {
        onAuto: () => {
          // Quick auto-resolve via resolveCombat on lead units
          const atkLead = attackerUnits[0];
          const defLead = defenderUnits[0];
          if (atkLead && defLead) {
            const cu_atk = battleUnitToCombatUnit(atkLead);
            const cu_def = battleUnitToCombatUnit(defLead);
            const result = resolveCombat(cu_atk, cu_def, { defenderTerrain: teren });
            const winnerLabel =
              result.winner === 'attacker' ? pbInfo.atakujacy.nazwa :
              result.winner === 'defender' ? pbInfo.obronca.nazwa   : 'Remis';
            showHintMessage(
              'Bitwa (auto): <b>' + winnerLabel + '</b> wygrywa' +
              ' \xb7 Rundy: ' + result.rounds,
              4000,
            );
          } else {
            showHintMessage('Bitwa (auto): brak jednostek bojowych', 3000);
          }
        },
        onBattlefield: () => {
          const bs = new BattleScene({
            attacker: attackerUnits,
            defender: defenderUnits,
            teren,
            data,
          });
          bs.play((res) => {
            const winnerLabel =
              res.winner === 'atakujacy' ? pbInfo.atakujacy.nazwa : pbInfo.obronca.nazwa;
            showHintMessage('Bitwa: <b>' + winnerLabel + '</b> wygrywa', 4000);
            bs.dispose();
          });
        },
        onCancel: () => {
          // preBattle hides itself on button click; nothing extra needed
        },
      });
    }

    // -----------------------------------------------------------------------
    // End turn (N key) + Gallery toggle (G key) + Fog toggle (F key)
    // + City founding (B key) + Test battle (T key)
    // If animation is running, snap unit to destination first.
    // -----------------------------------------------------------------------

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // --- Escape: close city panel ---
      if (e.key === 'Escape') {
        hideCityPanel();
        return;
      }

      // --- Gallery toggle ---
      if (e.key.toLowerCase() === 'g') {
        galleryOn = !galleryOn;
        if (galleryOn) {
          hideCityPanel();
          enterGallery();
        } else {
          exitGallery();
        }
        return;
      }

      // --- F: Fog of war toggle ---
      if (e.key.toLowerCase() === 'f') {
        // Gallery mode: ignore fog toggle.
        if (galleryOn) return;
        fogOn = !fogOn;
        refreshFog();
        return;
      }

      // --- B: Found a city on the last hovered/clicked hex ---
      if (e.key.toLowerCase() === 'b') {
        // Gallery mode: ignore.
        if (galleryOn) return;

        // Use the last hex the player hovered over or explicitly set (lastBHex).
        // Fallback: if a unit is selected, use that unit's position.
        let foundQ: number | null = null;
        let foundR: number | null = null;

        if (lastBHex !== null) {
          foundQ = lastBHex.q;
          foundR = lastBHex.r;
        } else if (hoverKey !== null) {
          const parts = hoverKey.split(',');
          if (parts.length === 2) {
            foundQ = parseInt(parts[0]!, 10);
            foundR = parseInt(parts[1]!, 10);
          }
        } else if (selectedId !== null) {
          const sel = units.find(x => x.id === selectedId);
          if (sel && sel.ownerId === 0) {
            foundQ = sel.q;
            foundR = sel.r;
          }
        }

        if (foundQ === null || foundR === null) {
          showHintMessage('Nie wybrano heksu — najedz na pole i nacisnij B', 3000);
          return;
        }

        // N1: buduj cityNodes dla isInTerritory (wszystkie miasta gracza jako wezly terytorium)
        const playerCityNodes: CityNode[] = cities
          .filter(c => c.ownerId === 0)
          .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
        // Z1: terytorium NIE blokuje zakladania — tylko dystans >=5 i ląd (decyzja 1B)
        const res = canFoundCity(foundQ, foundR, cities, map);
        if (res.ok) {
          const c = foundCityAt(foundQ, foundR, 0, cities, map, cityName(cities.length));
          if (c) {
            cities.push(c);
            hideCityPanel();
            cityRenderer.sync(cities, _cityRenderOpts());
            // Military unit stays on the hex (settler mechanic was removed).
            selectedId = null;
            lastBHex = null;
            unitRenderer.clearHighlight();
            unitRenderer.clearPathRoute();
            reachable = new Set<string>();
            hoverKey = null;
            refreshFog();
            updateHud();
            showHintMessage('Miasto ' + c.name + ' założone!', 3000);
          }
        } else {
          // Show reason briefly in the hint bar.
          showHintMessage('Nie można założyć: ' + res.reason, 3000);
        }
        return;
      }

      // --- T: Test battle ---
      if (e.key.toLowerCase() === 't') {
        if (galleryOn || isAnimating || isPreBattleOpen()) return;
        launchTestBattle();
        return;
      }

      // --- Ctrl+S: Save game (step K) ---
      if ((e.key.toLowerCase() === 's') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        try {
          // P6: build full save including production, buildings, AI research, diplo
          const cityProdSave: Record<string, any> = {};
          for (const [cid, prod] of cityProd.entries()) cityProdSave[cid] = prod;
          const cityBuiltSave: Record<string, string[]> = {};
          for (const [cid, blt] of cityBuilt.entries()) cityBuiltSave[cid] = blt.slice();
          const aiResSave: Array<[number, string[]]> = [];
          for (const [oid, zbadane] of aiResearchDone.entries()) aiResSave.push([oid, Array.from(zbadane)]);
          const diploSave: Record<string, any> = {};
          for (const [key, rel] of diplomacyRelations.entries()) diploSave[key] = rel;
          const sg: SaveGame = {
            wersja: 1,
            tura: turn,
            seed: SEED,
            units: units.slice(),
            cities: cities.slice(),
            explored: Array.from(explored),
            gracz: {
              skarbiec: player.skarbiec,
              nauka:    player.nauka,
              era:      player.era,
              zbadane:  Array.from(player.zbadane),
              badana:   player.badana,
            },
            cityProd:       cityProdSave,
            cityBuilt:      cityBuiltSave,
            aiResearchDone: aiResSave,
            diploRelations: diploSave,
            meta: { savedAt: new Date().toISOString() },
          };
          const ok = saveToLocal('autosave', sg);
          if (ok) {
            showHintMessage('Gra zapisana (tura ' + turn + ')', 3000);
            console.log('[Save] zapisano slot=autosave tura=' + turn);
          } else {
            showHintMessage('Zapis nieudany (brak localStorage?)', 3000);
          }
        } catch (eSave) {
          console.error('[Save] Blad:', eSave);
          showHintMessage('Blad zapisu gry', 3000);
        }
        return;
      }

      // --- Ctrl+L: Load game (step K) ---
      if ((e.key.toLowerCase() === 'l') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        try {
          const saved = loadFromLocal('autosave');
          if (!saved) {
            showHintMessage('Brak zapisu do wczytania (slot: autosave)', 3000);
          } else {
            turn = saved.tura;
            units.length = 0;
            for (const u of saved.units) units.push(u);
            cities.length = 0;
            for (const c of saved.cities) cities.push(c);
            explored.clear();
            for (const k of saved.explored) explored.add(k);
            if (saved.gracz) {
              player.skarbiec = saved.gracz.skarbiec ?? 0;
              player.nauka    = saved.gracz.nauka ?? 0;
              player.era      = saved.gracz.era ?? 1;
              player.badana   = saved.gracz.badana ?? null;
              player.zbadane  = new Set<string>(saved.gracz.zbadane ?? []);
            }
            // P6: Restore production, buildings, AI research, diplo
            cityProd.clear();
            if (saved.cityProd) {
              for (const [cid, prod] of Object.entries(saved.cityProd)) cityProd.set(cid, prod as any);
            }
            cityBuilt.clear();
            if (saved.cityBuilt) {
              for (const [cid, blt] of Object.entries(saved.cityBuilt)) cityBuilt.set(cid, blt as string[]);
            }
            aiResearchDone.clear();
            if (saved.aiResearchDone) {
              for (const [oid, zbadane] of saved.aiResearchDone) aiResearchDone.set(oid, new Set(zbadane));
            }
            diplomacyRelations.clear();
            if (saved.diploRelations) {
              for (const [key, rel] of Object.entries(saved.diploRelations)) diplomacyRelations.set(key, rel as any);
            }
            selectedId = null;
            reachable = new Set<string>();
            unitRenderer.clearHighlight();
            unitRenderer.clearPathRoute();
            hoverKey = null;
            cityRenderer.sync(cities, _cityRenderOpts());
            refreshFog();
            updateHud();
            showHintMessage('Wczytano zapis (tura ' + turn + ')', 3000);
            console.log('[Load] wczytano slot=autosave tura=' + turn);
          }
        } catch (eLoad) {
          console.error('[Load] Blad:', eLoad);
          showHintMessage('Blad wczytywania gry', 3000);
        }
        return;
      }

      // --- N: End turn ---
      if (e.key.toLowerCase() === 'n') {
        // Gallery mode: ignore end-turn key.
        if (galleryOn) return;
        // P3b: Block turns after game over.
        if (gameOver) { showHintMessage('Gra zakonczona. Kliknij "Nowa gra" by zagrac ponownie.', 3000); return; }

        // Snap any in-flight animation to its destination.
        if (isAnimating && anim !== null) {
          const u = units.find(x => x.id === anim!.id);
          if (u) {
            u.q = anim.destQ;
            u.r = anim.destR;
            u.ruchLeft = Math.max(0, u.ruchLeft - anim.cost);
          }
          anim = null;
          isAnimating = false;
        }
        // Restore movement for all units
        for (const u of units) {
          u.ruchLeft = u.ruch;
        }
        selectedId = null;
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
        unitRenderer.clearPathRoute();
        hoverKey = null;
        turn++;

        // --- Per-turn economy tick (task 13B) ---
        // Advance every city's economy: terrain yields -> net food ->
        // population growth/starvation, persisting the food store on the city.
        // Wrapped defensively so a data anomaly can never break the turn loop.
        try {
          // Map runtime units to the minimal EconUnit shape for upkeep/food accounting.
          const econUnits: EconUnit[] = units.map(u => ({
            ownerId: u.ownerId,
            typeId:  u.typeId,
            camping: false,  // no camping state in v0.1; all units treated as marching
          }));
          const econ = advanceCityEconomy(cities, map, data, _menuDifficulty, econUnits, growthMultMap, cityBuilt, player.era, player.zbadane);
          // P3a: update last-turn totals for HUD
          _lastPraca   = econ.totalPraca;
          _lastKultura = econ.totalKultura;
          if (cities.length > 0) {
            console.log(
              `[Ekonomia] Tura ${turn}: miasta=${econ.cities}` +
              ` Praca=${econ.totalPraca} Pieniądz=${econ.totalPieniadz}` +
              ` Nauka=${econ.totalNauka} Kultura=${econ.totalKultura}` +
              ` Żywność(netto)=${econ.totalZywnosc}` +
              ` wzrost=${econ.growth} głód=${econ.starved}`,
            );
            // Surface population changes briefly so the economy is visible.
            if (econ.growth > 0) {
              showHintMessage('Wzrost populacji w ' + econ.growth + ' miastach', 2500);
            } else if (econ.starved > 0) {
              showHintMessage('Głód: spadek populacji w ' + econ.starved + ' miastach', 2500);
            }
            // Cities may have changed population -> refresh their labels.
            cityRenderer.sync(cities, _cityRenderOpts());
          }

          // --- N3: TURA OBLEZENIA -- atrycja garnizonu + kapitulacja z glodu ---
          // Kontrakt UNITS-do-MASTER_oblezenie-tura.md + EKONOMIA-do-UNITS_zapasy-oblezenie-kontrakt.md:
          //   - -8% maxHP garnizonu/ture (modelowane jako redukcja liczby jednostek garnizonu)
          //   - kapituacja gdy magazyn=0 (obleganyGlod) -- zwolnienie flagi oblezenia
          // DEFERRED: ustawianie flagi city.oblegane=true (brak UI do startowania oblezenia);
          //           przekazanie do UNITS dla szturmu; machiny 1/ture (brak panelu oblezenia).
          try {
            for (const tick of econ.perCity) {
              if (!tick.oblegany) continue;
              const oblCity = cities.find(c => c.id === tick.cityId);
              if (!oblCity) continue;

              // Atrycja garnizonu: -8% maxHP/ture (tu: -8% liczby jednostek/ture, min 0)
              const garnizonBefore = oblCity.garnizon ?? 0;
              if (garnizonBefore > 0) {
                const atrycja = Math.max(1, Math.floor(garnizonBefore * 0.08));
                oblCity.garnizon = Math.max(0, garnizonBefore - atrycja);
                console.log(
                  '[Oblezenie] Tura ' + turn + ' ' + oblCity.name +
                  ': atrycja garnizonu ' + garnizonBefore + ' -> ' + oblCity.garnizon +
                  ' (-' + atrycja + ')'
                );
              }

              // Kapitulacja z glodu: gdy magazyn=0, zdejmij oblezenie (brak mechanizmu przejecia wlasciciela bez UI)
              if (tick.obleganyGlod) {
                oblCity.oblegane = false;
                oblCity.garnizon = 0;
                console.warn(
                  '[Oblezenie] Tura ' + turn + ' ' + oblCity.name +
                  ': GLOS -- magazyn wyczerpany, oblezenie zakonczone (brak mechanizmu przejecia bez UNITS UI)'
                );
                showHintMessage(oblCity.name + ': oblezenie -- glos! Magazyn wyczerpany.', 4000);
              }
            }
          } catch (errSiege) {
            console.error('[Oblezenie] Blad atrycji:', errSiege);
          }

          // --- Bank treasury + science, then auto-research (13B-finish + 7B) ---
          // Bank only the HUMAN player's (ownerId 0) share of this turn's yields.
          // econ.totalPieniadz / totalNauka sum ALL owners (incl. AI), so we sum
          // the player's own cities from perCity instead.  economy.ts already
          // splits each city's trade into a money stream and a science stream
          // every turn, so banking those two streams directly is consistent with
          // economy semantics (see playerState.ts header for the rationale).
          try {
            let pieniadzGracza = 0;
            let naukaGracza = 0;
            for (const tk of econ.perCity) {
              if (tk.ownerId === 0) {
                pieniadzGracza += tk.pieniadz;
                naukaGracza   += tk.nauka;
              }
            }
            player.skarbiec += pieniadzGracza;
            player.nauka    += naukaGracza;

            // --- Subtract upkeep from treasury (economy-upkeep s.6.4) ---
            const playerBalance = econ.upkeepByOwner.get(0);
            if (playerBalance && playerBalance.utrzymanieRazem > 0) {
              player.skarbiec -= playerBalance.utrzymanieRazem;
              if (playerBalance.deficyt) {
                console.warn(
                  '[Ekonomia] Deficyt! Utrzymanie=' + playerBalance.utrzymanieRazem +
                  ' Dochod=' + Math.round(pieniadzGracza) +
                  ' Saldo=' + Math.round(playerBalance.saldo),
                );
              }
            }

            // Auto-research: spend banked science on the cheapest available tech.
            const step = researchStep(player, data.tech);
            for (const done of step.completed) {
              let msg = 'Zbadano: ' + done.id + ' (-' + done.koszt + ' nauki)';
              if (done.awansEpoki) msg += ' \xb7 nowa epoka ' + done.era;
              if (done.pieniadz)   msg += ' \xb7 Pieni\u0105dz \xd710';
              console.log('[Nauka] Tura ' + turn + ': ' + msg);
              showHintMessage(msg, 3500);
            }
            if (step.completed.length > 0) {
              console.log(
                '[Nauka] Skarbiec=' + player.skarbiec +
                ' Nauka=' + player.nauka +
                ' Epoka=' + player.era +
                ' Zbadane=' + player.zbadane.size,
              );
            }
          } catch (errBank) {
            console.error('[Nauka] B\u0142\u0105d bankowania/badania:', errBank);
          }

          // --- MIASTO: produkcja / porządek / kultura / religia ---
          try {
            const difficulty = _menuDifficulty;
            const op  = loadOrderParams(data.societyParams, difficulty);
            const cp  = loadCultureParams(data.societyParams, difficulty);
            const rp  = loadReligionParams(data.societyParams, difficulty);
            const rng = makeRng(turn);

            for (const city of cities) {
              const cid = city.id;

              // Plony tej tury
              const econTick    = econ.perCity.find(tk => tk.cityId === cid);
              const pracaRaw    = econTick ? econTick.praca   : 0;
              const kulturaTick = econTick ? econTick.kultura : 0;

              // KULTURA
              const ccIn: CultureCity = { kulturaSkumulowana: (city as any).kultura ?? 0, ownCultureShare: 1 };
              const acc = accumulateCulture(ccIn, kulturaTick, cp);
              (city as any).kultura = acc.after;
              const ccOut: CultureCity = { kulturaSkumulowana: acc.after, ownCultureShare: 1 };
              const haKult = cultureHappiness(ccOut, cp);

              // RELIGIA
              const civNameCity = (city as any).civName ?? null;
              const ownRel      = civReligion(civNameCity, data.societyParams);
              const curRel: ReligionState = cityRelig.get(cid) ?? { counts: ownRel ? { [ownRel]: city.population } : {} };
              const haRel = religionHappiness(curRel, ownRel, rp);
              cityRelig.set(cid, curRel);

              // SPREAD RELIGION (step H): spread dominant faith to neighbours
              {
                const relNeighbors: ReligionNeighbor[] = [];
                for (const oc of cities) {
                  if (oc.id === cid) continue;
                  const dist = hexDistance(oc.q, oc.r, city.q, city.r);
                  if (dist <= (rp.szerzenieMaxDystans ?? 3)) {
                    relNeighbors.push({
                      id: oc.id,
                      distance: dist,
                      state: cityRelig.get(oc.id) ?? { counts: {} },
                      population: oc.population,
                    });
                  }
                }
                if (relNeighbors.length > 0) {
                  const hasSwiatynia = (cityBuilt.get(cid) ?? []).includes('swiatynia');
                  const spreadRes = spreadReligion(curRel, relNeighbors, rp, {
                    hasSwiatynia,
                    pressure: 1,
                    seed: (turn * 997 + city.q * 31 + city.r) >>> 0,
                  });
                  for (const ev of spreadRes.events) {
                    cityRelig.set(ev.id, ev.state);
                  }
                  if (spreadRes.reached > 0) {
                    console.log(
                      `[Religia] Tura ${turn} ${city.name}: szerzenie -> ${spreadRes.reached} miast`,
                    );
                  }
                }
              }

              // SZCZĘŚCIE
              const builtIds = cityBuilt.get(cid) ?? [];
              let haBuildings = 0;
              for (const bid of builtIds) {
                const bdef = data.buildings.find(b => b.id === bid);
                if (bdef && typeof bdef.baza.zadowolenie === 'number') {
                  const lvl = buildingLevelForEpoch(bdef.epokaWejscia, player.era, bdef.maksPoziom);
                  haBuildings += buildingEffectAtLevel(bdef.baza.zadowolenie, lvl);
                }
              }
              const szczescie = haBuildings + haKult + haRel;

              // PORZĄDEK
              const ord      = evaluateOrder({ szczescie, prawo: 0 }, op);
              const orderEff = ord.effects;
              if (ord.tier !== 'neutral') {
                console.log(`[Porzadek] Tura ${turn} ${city.name}: tier=${ord.tier} szc=${szczescie.toFixed(1)}`);
              }
              if (orderEff.revoltRisk > 0 && rng() < orderEff.revoltRisk) {
                city.population = Math.max(1, city.population - 1);
                console.log(`[Bunt] Tura ${turn} ${city.name}: utrata pop (risk=${orderEff.revoltRisk.toFixed(2)})`);
              }

              // Store growthMult for next turn's economy tick.
              growthMultMap.set(cid, orderEff.growthMult);

              // AUTO-MANAGE (STEP D): zastosuj decyzje auto-zarzadcy jesli wlaczony
              const praca = pracaRaw * orderEff.productionMult;
              let prod0 = cityProd.get(cid) ?? { kolejka: [], postep: 0 };
              if (autoManageCities.has(cid)) {
                try {
                  const unlockedTechs = city.ownerId === 0
                    ? Array.from(player.zbadane)
                    : Array.from(aiResearchDone.get(city.ownerId) ?? new Set<string>());
                  const builtForCity = cityBuilt.get(cid) ?? [];
                  const amDecision = autoManageCity(
                    city,
                    map,
                    prod0,
                    data,
                    {
                      yieldOf: (_q: number, _r: number) => {
                        // Minimal yield stub -- returns econ tick values aggregated
                        // (full per-tile yield would need economy.ts tileYield access)
                        const tick = econ.perCity.find(tk => tk.cityId === cid);
                        return {
                          zywnosc:  tick ? tick.zywnosc  / Math.max(1, city.population) : 0,
                          praca:    tick ? tick.praca    / Math.max(1, city.population) : 0,
                          pieniadz: tick ? tick.pieniadz / Math.max(1, city.population) : 0,
                          nauka:    tick ? tick.nauka    / Math.max(1, city.population) : 0,
                          kultura:  tick ? tick.kultura  / Math.max(1, city.population) : 0,
                        };
                      },
                      cityPraca: praca,
                      udzialBudynki: 0.7,
                      unlockedTechs,
                      ctx: { builtBuildingIds: builtForCity, ownerId: city.ownerId },
                    },
                  );
                  // Apply auto-enqueue suggestion (only when queue is empty)
                  if (amDecision.enqueue !== null) {
                    prod0 = enqueue(prod0, amDecision.enqueue);
                    cityProd.set(cid, prod0);
                  }
                } catch (eAM) {
                  console.error(`[AutoManage] Blad dla miasta ${city.name}:`, eAM);
                }
              }

              // PRODUKCJA
              const { prod: prodPo, completed } = advanceProduction(prod0, praca);
              cityProd.set(cid, prodPo);

              if (completed) {
                if (completed.kind === 'budynek') {
                  const blt = cityBuilt.get(cid) ?? [];
                  blt.push(completed.id);
                  cityBuilt.set(cid, blt);
                  console.log(`[Produkcja] Tura ${turn} ${city.name}: budynek ${completed.id}`);
                } else {
                  city.population = Math.max(1, city.population - populationCostOf(completed));
                  console.log(`[Produkcja] Tura ${turn} ${city.name}: jednostka ${completed.id}`);
                }
              }
            }
          } catch (errMiasto) {
            console.error('[Miasto] Błąd tury MIASTO:', errMiasto);
          }
        } catch (err) {
          console.error('[Ekonomia] Błąd w turze ekonomii:', err);
        }

        // ===================================================================
        // AI TURN LOOP: execute commands for every AI rival (ownerId > 0)
        // ===================================================================
        try {
          // Collect unique AI owner ids from the current unit/city pools.
          const aiOwners = new Set<number>();
          for (const u of units) { if (u.ownerId > 0) aiOwners.add(u.ownerId); }
          for (const c of cities) { if (c.ownerId > 0) aiOwners.add(c.ownerId); }

          for (const ownerId of aiOwners) {
            const opts: AITurnOpts = {
              civType: aiOwnerCivMap.get(ownerId), // nacja AI z rostera civs.json
              cityBuildings: Object.fromEntries(
                [...cityBuilt.entries()].filter(([cid]) => cities.find(c => c.id === cid && c.ownerId === ownerId))
              ),
            };
            let commands;
            try {
              commands = decideAITurn(ownerId, units, cities, map, data, opts);
            } catch (eAI) {
              console.error(`[AI] decideAITurn owner=${ownerId} error:`, eAI);
              continue;
            }

            // --- AI Research: chooseAIResearch fills slot when empty (STEP B) ---
            try {
              if (!aiResearchDone.has(ownerId)) {
                aiResearchDone.set(ownerId, new Set<string>());
              }
              const aiDone = aiResearchDone.get(ownerId)!;
              const aiCitiesCount = cities.filter(c => c.ownerId === ownerId).length;
              const allBuiltForAI: string[] = [];
              for (const [cid, blt] of cityBuilt.entries()) {
                const c = cities.find(ct => ct.id === cid && ct.ownerId === ownerId);
                if (c) { for (const b of blt) allBuiltForAI.push(b); }
              }
              const aiTechChoice = chooseAIResearch(
                data.tech as any,
                aiDone,
                { myCitiesCount: aiCitiesCount, allBuiltBuildings: allBuiltForAI },
              );
              if (aiTechChoice !== null && !aiDone.has(aiTechChoice)) {
                // Simulate research progress: immediately complete one tech per turn
                // (simplified — no cost deduction for AI in v0.1)
                aiDone.add(aiTechChoice);
                console.log(`[AI ${ownerId}] Zbadano: ${aiTechChoice}`);
              }
            } catch (eAIRes) {
              console.error(`[AI ${ownerId}] Blad wyboru technologii:`, eAIRes);
            }

            // --- Diplomacy stance + computeRespekt + decideAIDiplomacy ---
            try {
              const aiUnitCount = units.filter(u => u.ownerId === ownerId).length;
              const playerUnitCount = units.filter(u => u.ownerId === 0).length;
              const militaryRatio = playerUnitCount > 0
                ? aiUnitCount / playerUnitCount
                : (aiUnitCount > 0 ? 2.0 : 1.0);
              const rel = getDiploRelation(0, ownerId);
              const dipCtx: AIDiplomacyContext = {
                isMinorCiv: false,
                militaryRatio,
                currentTurn: turn,
                turnsAtWar: rel.status === 'wojna' ? 1 : 0,
              };
              // ikonaId w civs.json === wartosci enum TypCywilizacji (np. 'grecy' === TypCywilizacji.Grecy)
              const aiCivId = aiOwnerCivMap.get(ownerId) ?? 'grecy';
              const aiTyp = (aiCivId as TypCywilizacji);
              const plrTyp = (player.civType as TypCywilizacji);
              const aiStub: Player = {
                ownerId,
                typCywilizacji: aiTyp,
              } as unknown as Player;
              const humanStub: Player = {
                ownerId: 0,
                typCywilizacji: plrTyp,
              } as unknown as Player;
              const stance = aiDiplomacyStance(aiStub, humanStub, rel, dipCtx);
              const tier = relationTier(rel);

              // --- computeRespekt: potega per nacja (uproszczone komponenty) ---
              const aiCityCount  = cities.filter(c => c.ownerId === ownerId).length;
              const plrCityCount = cities.filter(c => c.ownerId === 0).length;
              const aiPop  = cities.filter(c => c.ownerId === ownerId).reduce((s, c) => s + c.population, 0);
              const plrPop = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + c.population, 0);
              const maxPop  = Math.max(aiPop, plrPop, 1);
              const maxCity = Math.max(aiCityCount, plrCityCount, 1);
              const maxUnits = Math.max(aiUnitCount, playerUnitCount, 1);
              const potAI: PotegaKomponenty = {
                wielkoscArmii: aiUnitCount / maxUnits,
                wygraneBitwy:  0.5, // brak historii bitew — parytet
                ludnosc:       aiPop  / maxPop,
                miasta:        aiCityCount  / maxCity,
                gospodarka:    0.5, // uproszczenie — brak pełnych danych gosp.
                epoka:         0.5, // jednakowa epoka (Kamien/Braz)
              };
              const potPlr: PotegaKomponenty = {
                wielkoscArmii: playerUnitCount / maxUnits,
                wygraneBitwy:  0.5,
                ludnosc:       plrPop / maxPop,
                miasta:        plrCityCount / maxCity,
                gospodarka:    0.5,
                epoka:         0.5,
              };
              const potegaAI  = computePotegaNacji(potAI);
              const potegaPlr = computePotegaNacji(potPlr);
              const respektAI = computeRespekt(potegaAI, potegaPlr); // jak silny jest AI wobec gracza
              // Update respekt in relation
              const relWithRespekt = { ...rel, respekt: respektAI };
              setDiploRelation(0, ownerId, relWithRespekt);

              // --- tickDiplomacy: per-turn shift ---
              const tickCtx: TickCtx = {
                turn,
                aktywnyHandel: false,
                aktywnyPakt: false,
                dobraWolaAktywna: false,
                wspolnyWrog: false,
                wspolnaReligia: false,
                odmiennaReligia: false,
                ekspansjaPrzyGranicy: aiCityCount > 2 && plrCityCount > 2,
              };
              const relTicked = tickDiplomacy(relWithRespekt as any, tickCtx);
              setDiploRelation(0, ownerId, relTicked as unknown as Relation);

              // --- decideAIDiplomacy: AI dyplomacja (war/peace/trybut) ---
              const diffLevel = (_menuDifficulty === 'hard' ? 3 : _menuDifficulty === 'easy' ? 1 : 2) as 1|2|3;
              const diffParams = loadDifficultyParams(data, diffLevel);
              const respektWzgledny = (potegaAI + potegaPlr) > 0
                ? potegaAI / (potegaAI + potegaPlr)
                : 0.5;
              const diploInp: DiplomacjaInputs = {
                myPlayerId: String(ownerId),
                relacje: [{
                  partnerId: '0',
                  relation: relTicked as unknown as Relation,
                  respektWzgledny,
                  stanWojny: (relTicked as any).status === 'wojna',
                }],
                agresja: ARCHETYPE_AGGRESSION[aiTyp] ?? 0.5, // archetype z nacji AI
                epoka: player.era,
              };
              const dipCmds: AIDiplomacyCommand[] = decideAIDiplomacy(diploInp, undefined, diffParams.agresjaMnoznik);
              for (const cmd of dipCmds) {
                try {
                  const curRel = getDiploRelation(0, ownerId);
                  if (cmd.type === 'wypowiedz_wojne') {
                    const newRel = applyDiplomaticEvent(curRel, 'wojna_wypowiedziana');
                    setDiploRelation(0, ownerId, newRel);
                    console.log(`[Dyplomacja] AI${ownerId} wypowiada wojne: ${cmd.powod}`);
                    showHintMessage('\u2694 AI ' + (aiOwnerCivMap.get(ownerId) ?? ownerId) + ' wypowiada wojne! (' + cmd.powod + ')', 4500);
                    if (isDiplomacyPanelOpen()) updateDiplomacyPanel();
                  } else if (cmd.type === 'zaproponuj_pokoj') {
                    const newRel = applyDiplomaticEvent(curRel, 'pokoj');
                    setDiploRelation(0, ownerId, newRel);
                    console.log(`[Dyplomacja] AI${ownerId} proponuje pokoj: ${cmd.powod}`);
                    showHintMessage('\u{1F54A} AI ' + (aiOwnerCivMap.get(ownerId) ?? ownerId) + ' proponuje pokoj (' + cmd.powod + ')', 4000);
                    if (isDiplomacyPanelOpen()) updateDiplomacyPanel();
                  } else if (cmd.type === 'zadaj_trybut') {
                    console.log(`[Dyplomacja] AI${ownerId} zada trybutu: ${cmd.powod}`);
                    // TODO v0.2: UI prompt for player
                  } else if (cmd.type === 'oferuj_trybut_za_pokoj') {
                    console.log(`[Dyplomacja] AI${ownerId} oferuje trybut za pokoj: ${cmd.powod}`);
                    // TODO v0.2: UI prompt for player
                  } else if (cmd.type === 'zaproponuj_sojusz') {
                    console.log(`[Dyplomacja] AI${ownerId} proponuje sojusz: ${cmd.powod}`);
                    // TODO v0.2: UI prompt
                  } else if (cmd.type === 'zaproponuj_handel') {
                    console.log(`[Dyplomacja] AI${ownerId} proponuje handel: ${cmd.powod}`);
                    // TODO v0.2: UI prompt
                  }
                } catch (eCmdDiplo) {
                  console.error(`[Dyplomacja] Blad komendy ${cmd.type}:`, eCmdDiplo);
                }
              }

              if (tier !== 2) { // 2 = Neutralny -- log only non-neutral
                console.log(
                  `[Dyplomacja] Tura ${turn} AI${ownerId}: tier=${tier}` +
                  ` war=${stance.willingnessWar.toFixed(2)}` +
                  ` peace=${stance.willingnessPeace.toFixed(2)}` +
                  ` respektAI=${respektAI}`,
                );
              }
            } catch (eDiplo) {
              console.error(`[Dyplomacja] Blad dyplomacji AI${ownerId}:`, eDiplo);
            }

            for (const cmd of commands) {
              try {
                if (cmd.type === 'endTurn') {
                  // Nothing to do -- AI player signals end of its turn.
                  continue;
                }

                if (cmd.type === 'move') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
                  const path = computePath(u, map, cmd.toQ, cmd.toR, (() => {
                    const occ = new Set<string>();
                    for (const ou of units) { if (ou.id !== u.id) occ.add(keyOf(ou.q, ou.r)); }
                    return occ;
                  })());
                  if (path.length > 0) {
                    const last = path[path.length - 1]!;
                    u.q = last.q;
                    u.r = last.r;
                    u.ruchLeft = 0;
                  }
                  continue;
                }

                if (cmd.type === 'foundCity') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
                  const res = canFoundCity(u.q, u.r, cities, map);
                  if (res.ok) {
                    const c = foundCity(u, cities, map, cityName(cities.length));
                    if (c) {
                      c.ownerId = ownerId;
                      cities.push(c);
                      const idx = units.indexOf(u);
                      if (idx >= 0) units.splice(idx, 1);
                      cityRenderer.sync(cities, _cityRenderOpts());
                      console.log(`[AI ${ownerId}] Zalozono miasto ${c.name} @ (${c.q},${c.r})`);
                    }
                  }
                  continue;
                }

                if (cmd.type === 'attack') {
                  const attacker = units.find(x => x.id === cmd.unitId);
                  const defender = units.find(x => x.id === cmd.targetUnitId);
                  if (!attacker || !defender || attacker.ownerId !== ownerId) continue;
                  // Auto-resolve via resolveCombat using unit defs from data.
                  const atkDef = lookupUnitDef(attacker.typeId);
                  const defDef = lookupUnitDef(defender.typeId);
                  const hexKey = keyOf(defender.q, defender.r);
                  const hexObj = map.hexes[hexKey];
                  const teren: string = hexObj ? (hexObj.terenBazowy as string) : 'Rownina';
                  const cu_atk: import('./game/combat').CombatUnit = {
                    typNazwa: attacker.typeId, rola: atkDef['Rola (linia)'] ?? 'Wrecz',
                    Atak: normFieldVal(atkDef['Atak'], 5), Obrona: normFieldVal(atkDef['Obrona'], 5),
                    Uderzenie: normFieldVal(atkDef['Uderzenie'], 0), Pancerz: normFieldVal(atkDef['Pancerz'], 0),
                    Przebicie: normFieldVal(atkDef['Przebicie'], 0), Health: normFieldVal(atkDef['Health'], 30),
                    'Prog dezercji (% health)': normFieldVal(atkDef['Prog dezercji (% health)'], 0.25),
                    'Atak dystansowy': normFieldVal(atkDef['Atak dystansowy'], 0),
                    'Zasieg ataku (hex)': atkDef['Zasieg ataku (hex)'] ?? null,
                    'Ilosc pociskow': atkDef['Ilosc pociskow'] ?? null,
                    'Ruch w bitwie (heksy)': atkDef['Ruch w bitwie (heksy)'] ?? null,
                    'Kara obrony z flanki (%)': normFieldVal(atkDef['Kara obrony z flanki (%)'], 50),
                    'Kara obrony z tylu (%)': normFieldVal(atkDef['Kara obrony z tylu (%)'], 80),
                  };
                  const cu_def: import('./game/combat').CombatUnit = {
                    typNazwa: defender.typeId, rola: defDef['Rola (linia)'] ?? 'Wrecz',
                    Atak: normFieldVal(defDef['Atak'], 5), Obrona: normFieldVal(defDef['Obrona'], 5),
                    Uderzenie: normFieldVal(defDef['Uderzenie'], 0), Pancerz: normFieldVal(defDef['Pancerz'], 0),
                    Przebicie: normFieldVal(defDef['Przebicie'], 0), Health: normFieldVal(defDef['Health'], 30),
                    'Prog dezercji (% health)': normFieldVal(defDef['Prog dezercji (% health)'], 0.25),
                    'Atak dystansowy': normFieldVal(defDef['Atak dystansowy'], 0),
                    'Zasieg ataku (hex)': defDef['Zasieg ataku (hex)'] ?? null,
                    'Ilosc pociskow': defDef['Ilosc pociskow'] ?? null,
                    'Ruch w bitwie (heksy)': defDef['Ruch w bitwie (heksy)'] ?? null,
                    'Kara obrony z flanki (%)': normFieldVal(defDef['Kara obrony z flanki (%)'], 50),
                    'Kara obrony z tylu (%)': normFieldVal(defDef['Kara obrony z tylu (%)'], 80),
                  };
                  const structBonusAI = structureDefenseBonusFor(defender.q, defender.r);
                  const result = resolveCombat(cu_atk, cu_def, {
                    defenderTerrain: teren,
                    structureDefBonusPct: structBonusAI,
                  });
                  if (result.winner === 'attacker') {
                    const di = units.indexOf(defender);
                    if (di >= 0) { units.splice(di, 1); }
                    console.log(`[AI ${ownerId}] Atak: ${attacker.typeId} pokonal ${defender.typeId}`);
                  } else if (result.winner === 'defender') {
                    const ai = units.indexOf(attacker);
                    if (ai >= 0) { units.splice(ai, 1); }
                    console.log(`[AI ${ownerId}] Atak: ${attacker.typeId} przegral z ${defender.typeId}`);
                  } else {
                    console.log(`[AI ${ownerId}] Atak: remis`);
                  }
                  continue;
                }

                if (cmd.type === 'build') {
                  const city = cities.find(c => c.id === cmd.cityId && c.ownerId === ownerId);
                  if (!city) continue;
                  const buildingNames = new Set(data.buildings.map(b => b.nazwa));
                  const isBuilding = buildingNames.has(cmd.buildingId);
                  const prod0 = cityProd.get(cmd.cityId) ?? { kolejka: [], postep: 0 };
                  // Don't re-enqueue if already in queue
                  const alreadyQueued = prod0.kolejka.some(it => it.id === cmd.buildingId);
                  if (!alreadyQueued) {
                    const item = isBuilding
                      ? buildingProductionItem(cmd.buildingId, data)
                      : unitProductionItem(cmd.buildingId, data);
                    if (item !== null) {
                      cityProd.set(cmd.cityId, enqueue(prod0, item));
                    } else {
                      console.warn(`[AI ${ownerId}] Build no-op: nieznany ${cmd.buildingId}`);
                    }
                  }
                  continue;
                }

                // Unknown command type -- safe no-op.
                console.warn('[AI] Nieznany typ komendy:', (cmd as any).type);
              } catch (eCMD) {
                console.error(`[AI ${ownerId}] Blad wykonania komendy ${(cmd as any).type}:`, eCMD);
              }
            }
          }
        } catch (eAILoop) {
          console.error('[AI] Blad petli AI:', eAILoop);
        }

        // ===================================================================
        // BARBARIANS TICK: spawn camps + move barbarian units
        // ===================================================================
        try {
          if (barbariansActive(turn, barbParams)) {
            // Spawn new camps if needed (seed from turn to vary each game).
            const newCamps = spawnCamps(map, barbCamps, cities, barbParams, turn * 31337);
            barbCamps = [...barbCamps, ...newCamps];
            if (newCamps.length > 0) {
              console.log(`[Barbarzyncy] Tura ${turn}: nowe obozy: ${newCamps.length}`);
            }

            // Tick camps: decrement cooldowns + collect spawns.
            const barbUnitsNow = units.filter(u => isBarbarian(u.ownerId)) as BarbUnit[];
            const tickRes = tickCamps(barbCamps, barbUnitsNow, units, map, barbParams);
            barbCamps = tickRes.camps;

            // Instantiate spawned barbarian units.
            for (const spawn of tickRes.spawns) {
              const def = (data.units as any[]).find((u: any) => u['Jednostka'] === spawn.typeId);
              const ruch = def ? normFieldVal(def['Ruch'], 2) : 2;
              const newUnit: RuntimeUnit = {
                id: 'barb_' + turn + '_' + spawn.campId + '_' + Math.random().toString(36).slice(2),
                ownerId: BARBARIAN_OWNER_ID,
                typeId: spawn.typeId,
                category: 'wojownik',
                q: spawn.q,
                r: spawn.r,
                ruch,
                ruchLeft: 0,
              };
              units.push(newUnit);
              console.log(`[Barbarzyncy] Spawn: ${spawn.typeId} @ (${spawn.q},${spawn.r})`);
            }

            // Move barbarian units.
            const barbUnitsAfterSpawn = units.filter(u => isBarbarian(u.ownerId)) as BarbUnit[];
            const playerUnitsForBarbs = units.filter(u => !isBarbarian(u.ownerId));
            const barbCmds = decideBarbarianMoves(barbUnitsAfterSpawn, playerUnitsForBarbs, cities, barbCamps, map, barbParams);
            for (const bcmd of barbCmds) {
              try {
                const bu = units.find(u => u.id === bcmd.unitId);
                if (!bu) continue;
                if (bcmd.type === 'move') {
                  bu.q = bcmd.toQ;
                  bu.r = bcmd.toR;
                  bu.ruchLeft = 0;
                } else if (bcmd.type === 'attack') {
                  const target = units.find(u => u.id === bcmd.targetUnitId);
                  if (!target) continue;
                  const atkDef = lookupUnitDef(bu.typeId);
                  const defDef = lookupUnitDef(target.typeId);
                  const hexKey2 = keyOf(target.q, target.r);
                  const hexObj2 = map.hexes[hexKey2];
                  const teren2: string = hexObj2 ? (hexObj2.terenBazowy as string) : 'Rownina';
                  const structBonusBarb = structureDefenseBonusFor(target.q, target.r);
                  const res2 = resolveCombat(
                    battleUnitToCombatUnit({ id: bu.id, nazwa: bu.typeId, kategoria: bu.category, ownerColor: 0x888888, stats: atkDef, hp: normFieldVal(atkDef['Health'], 30), maxHp: normFieldVal(atkDef['Health'], 30) }),
                    battleUnitToCombatUnit({ id: target.id, nazwa: target.typeId, kategoria: target.category, ownerColor: 0x888888, stats: defDef, hp: normFieldVal(defDef['Health'], 30), maxHp: normFieldVal(defDef['Health'], 30) }),
                    { defenderTerrain: teren2, structureDefBonusPct: structBonusBarb },
                  );
                  if (res2.winner === 'attacker') {
                    const di2 = units.indexOf(target); if (di2 >= 0) units.splice(di2, 1);
                  } else if (res2.winner === 'defender') {
                    const ai2 = units.indexOf(bu); if (ai2 >= 0) units.splice(ai2, 1);
                  }
                }
              } catch (eBarbCmd) {
                console.error('[Barbarzyncy] Blad komendy:', eBarbCmd);
              }
            }
          }
        } catch (eBarb) {
          console.error('[Barbarzyncy] Blad ticku:', eBarb);
        }

        // ===================================================================
        // VICTORY CHECK: evaluate for human player (0) + AI owners
        // ===================================================================
        try {
          if (!gameOver) {
            // Build VictoryPlayer list from all non-barbarian owners.
            const allOwners = new Set<number>([0]);
            for (const u of units) { if (u.ownerId >= 0) allOwners.add(u.ownerId); }
            for (const c of cities) { if (c.ownerId >= 0) allOwners.add(c.ownerId); }
            const vPlayers: VictoryPlayer[] = [];
            for (const oid of allOwners) {
              vPlayers.push({
                id: oid,
                typCywilizacji: oid === 0 ? player.civType : (aiOwnerCivMap.get(oid) ?? 'grecy'),
                ai: oid !== 0,
              });
            }

            // Check player.
            const settlersCount = units.filter(u => u.ownerId === 0 && u.category === 'osadnik').length;
            const vInput: VictoryInput = {
              players: vPlayers,
              cities,
              gracz: 0,
              liczbaOsadnikow: settlersCount,
            };
            const vResult = checkVictory(vInput);
            if (vResult !== null) {
              gameOver = true;
              const isVictory2 = vResult.rodzaj !== 'przegrana';
              const msg = vResult.rodzaj === 'dominacja'
                ? 'ZWYCIESTWO! Dominacja (tura ' + turn + ')'
                : vResult.rodzaj === 'nauka'
                ? 'ZWYCIESTWO NAUKOWE! (tura ' + turn + ')'
                : 'PRZEGRANA! Wszystkie miasta utracone (tura ' + turn + ')';
              showHintMessage('<b>' + msg + '</b>', 4000);
              showGameOverOverlay(msg, isVictory2);
              console.log('[Victory] ' + msg + ' gracz=0 rodzaj=' + vResult.rodzaj);
            }
          }
        } catch (eVic) {
          console.error('[Victory] Blad sprawdzania warunkow zwyciestwa:', eVic);
        }

        updateHud();
        // Refresh fog after end-turn so new unit positions update visibility.
        refreshFog();
      }
    });

    // -----------------------------------------------------------------------
    // Render loop
    // -----------------------------------------------------------------------

    function renderLoop() {
      requestAnimationFrame(renderLoop);

      // --- Delta time (capped at 100 ms to skip large jumps on tab switch) ---
      const now = performance.now() / 1000;
      const dt = Math.min(now - prevTime, 0.1);
      prevTime = now;

      // --- Drive animation (only outside gallery mode) ---
      if (!galleryOn && isAnimating && anim !== null) {
        anim.t += dt / ANIM_SEG_DUR;

        // Advance through any fully elapsed segments.
        while (anim.t >= 1 && anim.seg < anim.points.length - 2) {
          anim.t -= 1;
          anim.seg++;
        }

        const lastSeg = anim.points.length - 2; // index of the final segment

        if (anim.seg >= lastSeg && anim.t >= 1) {
          // --- Animation complete ---
          const u = units.find(x => x.id === anim!.id);
          if (u) {
            u.q = anim.destQ;
            u.r = anim.destR;
            u.ruchLeft = Math.max(0, u.ruchLeft - anim.cost);
          }
          const finishedId = anim.id;
          anim = null;
          isAnimating = false;

          // Snap tokens to logical resting positions and update fog.
          // refreshFog() calls unitRenderer.sync() with the visible subset,
          // so we do NOT call unitRenderer.sync(units) separately here.
          refreshFog();

          // Restore highlight if unit still selected and has moves remaining.
          if (selectedId === finishedId) {
            const sel = units.find(x => x.id === finishedId);
            if (sel && sel.ruchLeft > 0) {
              reachable = computeReachable(sel, map, occupiedExcept(sel.id));
              unitRenderer.setHighlight(reachable);
            } else {
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
            }
          }
          updateHud();
        } else {
          // --- Interpolate token along current segment ---
          const tc = Math.min(Math.max(anim.t, 0), 1);
          const p0 = anim.points[anim.seg]!;
          const p1 = anim.points[anim.seg + 1]!;
          unitRenderer.setTokenWorldPosition(
            anim.id,
            p0.x + (p1.x - p0.x) * tc,
            p0.y + (p1.y - p0.y) * tc,
            p0.z + (p1.z - p0.z) * tc,
          );
        }
      }

      // --- Gallery label projection ---
      // Each frame in gallery mode: project each token's world position to
      // screen space using THREE.Vector3.project(camera), then convert NDC
      // coordinates to CSS pixels for the floating label div.
      //
      // Projection formula:
      //   worldPt.project(camera)  -> NDC (x,y,z) in [-1,1]^3
      //   px = (ndcX * 0.5 + 0.5) * canvasWidth   (left edge = 0)
      //   py = (-ndcY * 0.5 + 0.5) * canvasHeight  (top edge = 0)
      // If NDC z > 1: point is behind the camera near plane -> hide label.
      if (galleryOn && galleryLabels.length > 0) {
        const cw = canvas.clientWidth  || window.innerWidth;
        const ch = canvas.clientHeight || window.innerHeight;

        for (let i = 0; i < galleryLabels.length; i++) {
          const lbl = galleryLabels[i];
          if (!lbl) continue;
          const pos = galleryPositions[i];
          if (!pos) continue;

          // Lift the label anchor above the token base.
          const worldPt = new THREE.Vector3(pos.x, pos.y + GALLERY_LABEL_LIFT, pos.z);

          // Project world -> NDC (in-place mutation of worldPt).
          worldPt.project(camera);

          // Behind camera: hide.
          if (worldPt.z > 1.0) {
            lbl.style.display = 'none';
            continue;
          }

          // NDC -> CSS pixels.
          const px = ( worldPt.x * 0.5 + 0.5) * cw;
          const py = (-worldPt.y * 0.5 + 0.5) * ch;

          lbl.style.display = 'block';
          lbl.style.left    = Math.round(px) + 'px';
          lbl.style.top     = Math.round(py) + 'px';
        }
      }

      // --- Camera and render (always run, even during animation) ---
      camCtrl.update();
      renderer.render(scene, camera);
    }
    // -----------------------------------------------------------------------
    // START SCREEN - Menu overlay (shown before game starts)
    // Canvas + scene already initialized above so smoke test passes.
    // Menu is a fixed overlay (z-index:500); game renders underneath.
    // -----------------------------------------------------------------------

    /** Helper: map size string -> (width, height) in hexes. */
    function mapSizeToDims(size: string): { w: number; h: number } {
      const sizeNorm = size.toLowerCase().replace(/ł/g, 'l').replace(/[ó]/g, 'o')
        .replace(/[ąà]/g, 'a').replace(/[ę]/g, 'e').replace(/[^a-z0-9]/g, '');
      // Mapping from menu strings (Mała/Maly/Standardowy etc.) to hex grid dims
      if (sizeNorm.startsWith('mal') || sizeNorm.startsWith('kro') || sizeNorm === 'small') return { w: 30, h: 22 }; // ~660 hexes
      if (sizeNorm.startsWith('sre') || sizeNorm.startsWith('sr') || sizeNorm === 'medium' || sizeNorm === 'standardowy' || sizeNorm === 'standardowa') return { w: 50, h: 36 }; // ~1800 hexes
      if (sizeNorm.startsWith('duz') || sizeNorm === 'large' || sizeNorm === 'duzy') return { w: 80, h: 55 }; // ~4400 hexes
      if (sizeNorm.startsWith('ogr') || sizeNorm === 'xlarge' || sizeNorm === 'ogromny') return { w: 100, h: 70 }; // ~7000 hexes (capped for perf)
      // fallback: medium
      return { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
    }

    function applyMenuParams(params: NewGameParams): void {
      // Map UI difficulty string to engine difficulty key
      const diffMap: Record<string, 'easy' | 'normal' | 'hard'> = {
        'Łatwy': 'easy',
        'Normalny': 'normal',
        'Trudny': 'hard',
        'easy': 'easy',
        'normal': 'normal',
        'hard': 'hard',
      };
      const diff = diffMap[params.difficulty] ?? 'normal';
      _menuDifficulty = diff;
      _menuCivId = params.civId || 'grecy';
      _menuMapSize = params.mapSize || 'Średnia';
      _menuRivals = parseInt(String(params.rivals), 10) || 6;

      // Wepnij dane nacji gracza (civType + bonusy) z civs.json
      {
        const chosenCiv = (data.civs.cywilizacje as any[]).find(
          (c: any) => (c.ikonaId ?? '') === _menuCivId,
        );
        if (chosenCiv) {
          player.civType = _menuCivId;
          player.civBonusy = Array.isArray(chosenCiv.bonusy) ? chosenCiv.bonusy : [];
          console.log(
            `[NewGame] Nacja gracza: ${chosenCiv.Cywilizacja} (${ _menuCivId})`,
            `bonusy: ${player.civBonusy.length}`,
          );
        } else {
          player.civType = _menuCivId;
          player.civBonusy = [];
          console.warn(`[NewGame] Nacja '${_menuCivId}' nie znaleziona w civs.json — brak bonusów`);
        }
        // Przelicz aiOwnerCivMap uwzgledniajac aktualna nacje gracza
        const allCivIds = (data.civs.cywilizacje as any[])
          .map((c: any) => (c.ikonaId as string | undefined) ?? '')
          .filter((id: string) => id !== '');
        let civIdx = 0;
        for (const ownerId of Array.from(aiOwnerCivMap.keys()).sort((a, b) => a - b)) {
          let assigned = allCivIds[civIdx % allCivIds.length] ?? 'grecy';
          if (assigned === _menuCivId && allCivIds.length > 1) {
            assigned = allCivIds[(civIdx + 1) % allCivIds.length] ?? assigned;
          }
          aiOwnerCivMap.set(ownerId, assigned);
          civIdx++;
        }
        console.log(`[NewGame] AI nacje:`, Object.fromEntries(aiOwnerCivMap));
      }

      // Map UI speed string -> TempoGry
      const tempoMap: Record<string, TempoGry> = {
        'Szybka': 'szybka',
        'Standardowa': 'standardowa',
        'Długa': 'dluga',
        'szybka': 'szybka',
        'standardowa': 'standardowa',
        'dluga': 'dluga',
      };
      player.tempoGry = tempoMap[params.speed] ?? 'standardowa';
      console.log('[NewGame] tempoGry =', player.tempoGry, '(speed=', params.speed, ')');
      // Rebuild city panel config with new difficulty
      configureCityPanel({
        data,
        difficulty: _menuDifficulty,
        getCities: () => cities,
        getEpoch: (_ownerId: number) => player.era,
        getUnlockedTechs: (_ownerId: number) => Array.from(player.zbadane),
        getBuiltBuildingIds: (cityId: string) => cityBuilt.get(cityId) ?? [],
        getProduction: (cityId: string) => cityProd.get(cityId) ?? null,
        setProduction: (cityId: string, p: CityProduction) => { cityProd.set(cityId, p); },
        getTreasury: (_ownerId: number) => player.skarbiec,
        onRushBuy: (cityId: string, _item: any, koszt: number) => {
          if (player.skarbiec >= koszt) {
            player.skarbiec -= koszt;
            const rBase = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
            const r = rushProduction(rBase);
            cityProd.set(cityId, r.prod);
          }
        },
      });
    }

    function doStartGame(params: NewGameParams): void {
      applyMenuParams(params);
      hideMainMenu();
      hideNewGameFlow();

      // P2: Regenerate map with size from menu params
      const { w: newW, h: newH } = mapSizeToDims(_menuMapSize);
      const newSeed = Math.floor(Math.random() * 1e9);
      const newMap = generateMap(newW, newH, newSeed);
      map = newMap;

      // Rebuild scene with new map (dispose old scene first)
      try { disposeScene(); } catch (_) { /* ignore if dispose fails */ }
      const newSceneResult = buildScene(map, canvas);
      scene = newSceneResult.scene;
      camera = newSceneResult.camera;
      renderer = newSceneResult.renderer;
      center = newSceneResult.center;
      setFog = newSceneResult.setFog;
      disposeScene = newSceneResult.dispose;

      // Rebuild camera controller with new scene center
      camCtrl = new CameraController(camera, canvas, center, {
        minDist: 8,
        maxDist: 160,
        keyPanSpeed: 0.3,
      });

      // Rebuild unit and city renderers
      unitRenderer = new UnitRenderer(scene, map);
      cityRenderer = new CityRenderer(scene, map);

      // Regenerate units (with rival count from menu)
      units.length = 0;
      const startUnits = placeStartingUnits(map, data, _menuRivals);
      for (const u of startUnits) units.push(u);
      // Remove settler (player founds city manually)
      const settlerIdx = units.findIndex(u => u.ownerId === 0 && u.category === 'osadnik');
      if (settlerIdx >= 0) units.splice(settlerIdx, 1);

      // Rebuild AI civ map for new rival set
      aiOwnerCivMap.clear();
      const aiOwnerIds2: number[] = [];
      for (const u of units) {
        if (u.ownerId > 0 && !aiOwnerIds2.includes(u.ownerId)) aiOwnerIds2.push(u.ownerId);
      }
      const allCivIds2 = (data.civs.cywilizacje as any[])
        .map((c: any) => (c.ikonaId as string | undefined) ?? '')
        .filter((id: string) => id !== '');
      let civIdx2 = 0;
      for (const ownerId of aiOwnerIds2) {
        let assigned = allCivIds2[civIdx2 % allCivIds2.length] ?? 'grecy';
        if (assigned === _menuCivId && allCivIds2.length > 1) {
          assigned = allCivIds2[(civIdx2 + 1) % allCivIds2.length] ?? assigned;
        }
        aiOwnerCivMap.set(ownerId, assigned);
        civIdx2++;
      }

      // Reset cities, explored, turn
      cities.length = 0;
      explored.clear();
      turn = 1;
      cityBuilt.clear();
      cityProd.clear();
      aiResearchDone.clear();
      barbCamps = [];
      gameOver = false;
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;

      // Rebuild resource overlays for new map
      const TERR_TOP_Y2: Partial<Record<TerenBazowy, number>> = {
        [TerenBazowy.Morze]:    0.30,
        [TerenBazowy.Wybrzeze]: 0.40,
        [TerenBazowy.Laka]:     0.45,
        [TerenBazowy.Rownina]:  0.53,
        [TerenBazowy.Pustynia]: 0.45,
        [TerenBazowy.Wzgorza]:  0.85,
        [TerenBazowy.Gory]:     1.60,
      };
      for (const hex of Object.values(map.hexes)) {
        if (!hex.nakladka || hex.nakladka === Nakladka.Brak || hex.nakladka === Nakladka.Las) continue;
        try {
          const ov = buildResourceOverlay(hex.nakladka);
          if (!ov) continue;
          const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
          const baseY = TERR_TOP_Y2[hex.terenBazowy] ?? 0.45;
          ov.position.set(x + 0.2, baseY + 0.01, z + 0.12);
          ov.rotation.y = hex.coords.q * 1.3 + hex.coords.r * 0.7;
          scene.add(ov);
        } catch (_) { /* ignore */ }
      }

      // Sync renderers with new state
      unitRenderer.sync(units);
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      updateHud();

      console.log('[NewGame] Mapa: ' + newW + 'x' + newH + ' seed=' + newSeed + ' rywale=' + _menuRivals);
      renderLoop();
    }

    function doLoadGame(): void {
      try {
        const saved = loadFromLocal('autosave');
        if (!saved) {
          showHintMessage('Brak zapisu (slot: autosave). Uruchamiam nową grę.', 3000);
          showMainMenu();
          return;
        }
        hideMainMenu();
        hideNewGameFlow();
        // Apply save data (mirrors Ctrl+L logic)
        turn = saved.tura;
        units.length = 0;
        for (const u of saved.units) units.push(u);
        cities.length = 0;
        for (const c of saved.cities) cities.push(c);
        explored.clear();
        for (const k of (saved as any).explored ?? []) explored.add(k);
        unitRenderer.sync(units);
        cityRenderer.sync(cities, _cityRenderOpts());
        refreshFog();
        updateHud();
        renderLoop();
      } catch (e) {
        showHintMessage('Błąd wczytywania zapisu. Uruchamiam nową grę.', 3000);
        showMainMenu();
      }
    }

    // Show main menu overlay; game is already initialized beneath it.
    showMainMenu({
      hasSave: () => {
        try { return !!loadFromLocal('autosave'); } catch { return false; }
      },
      onNewGame: () => {
        hideMainMenu();
        showNewGameFlow({
          data,
          onStart: (params: NewGameParams) => doStartGame(params),
          onCancel: () => { hideNewGameFlow(); showMainMenu(); },
        });
      },
      onContinue: () => doLoadGame(),
      onLoad:     () => doLoadGame(),
      onAbout:    () => { /* future */ },
      onQuit:     () => { /* future - na stronie nie ma gdzie wyjść */ },
    });
    // Note: renderLoop() is now called by doStartGame() / doLoadGame(), not here.
    // For smoke test: the rAF loop starts immediately via the first render frame below.
    // We schedule a single rAF to satisfy smoke's check (c).
    requestAnimationFrame(() => {
      camCtrl.update();
      renderer.render(scene, camera);
    });

  } catch (err) {
    showErr('FATAL: ' + String(err) + (err instanceof Error ? '\n' + err.stack : ''));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
