/**
 * main.ts — punkt wejścia szkieletu frontend-v2 (P5.1, UI-Q1=A).
 *
 * Nie jest kopią `gra/src/main.ts` (to spoiwo z logiką gry, P5.13). Montuje tokeny marki
 * (kopia `ui/brandTokenVars.ts`), podpina kontroler z atrapą MOCK i pokazuje jawną etykietę MOCK.
 * Panele zależne od logiki (PORTING-QUEUE.md) dochodzą w kolejnych tematach.
 *
 * P5.2: przed jakimkolwiek panelem instaluje `StaticCatalogDto` (z `get_view { staticCatalog }`),
 * diagnostykę D-UI-7 i usługę slotów zapisu — atrapy MOCK (ZAŁOŻENIE P5.2-Z1: panele poziomu 0
 * czytające katalog przy ewaluacji modułu są importowane dopiero po instalacji).
 */
import { ensureBrandRootTokens } from './ui/brandTokenVars';
import { formatLiczbaPl } from './ui/formatPl';
import {
  createController,
  createMockAudioService,
  createMockDiplomacyQueries,
  createMockEmpireQueries,
  createMockNewGameQueries,
  createMockSaveSlotsService,
  createMockTransport,
  installAudioService,
  installDiplomacyQueries,
  installEmpireQueries,
  installNewGameQueries,
  installPerfDiagnostics,
  installSaveSlotsService,
  installStaticCatalog,
  MOCK_LABEL,
  MOCK_PERF_DIAGNOSTICS,
} from './controller';
import type { StaticCatalogDto } from './viewmodel/types';
import type { MockViewPayload } from './controller/mock';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

async function boot(): Promise<void> {
  ensureBrandRootTokens();
  const app = document.getElementById('app');
  if (!app) throw new Error('frontend-v2: brak #app w index.html');

  const controller = createController(createMockTransport());
  installStaticCatalog(await controller.getView<StaticCatalogDto>({ kind: 'staticCatalog' }));
  installPerfDiagnostics(MOCK_PERF_DIAGNOSTICS);
  installSaveSlotsService(createMockSaveSlotsService());
  // P5.6: atrapy MOCK zapytań koszyka PW (`controller/diplomacyQueries.ts`) i muzyki nakładek (`controller/audio.ts`).
  installDiplomacyQueries(createMockDiplomacyQueries());
  installAudioService(createMockAudioService());
  // P5.7: atrapa MOCK zapytań suwaków panelu imperium (`controller/empireQueries.ts`).
  installEmpireQueries(createMockEmpireQueries());
  // P5.7 r2: atrapa MOCK zapytań kreatora nowej gry (`controller/newGameQueries.ts`).
  installNewGameQueries(createMockNewGameQueries());

  const shell = el('section', undefined, 'v2-shell');
  shell.style.cssText =
    'display:flex;flex-direction:column;gap:8px;padding:16px 20px;border:1px solid #555;border-radius:8px;min-width:320px;';
  const badge = el('span', controller.source, 'v2-mock-badge');
  badge.setAttribute('data-source', controller.source);
  badge.style.cssText = 'align-self:flex-start;padding:2px 8px;border-radius:4px;background:#b8860b;color:#000;font-weight:bold;';
  shell.append(el('h1', 'Civ The Game — frontend-v2 (szkielet P5.1)'), badge);

  const view = await controller.getView<MockViewPayload>({ kind: 'city', id: 1 });
  const mockTag = view.mock === MOCK_LABEL ? ` [${MOCK_LABEL}]` : '';
  shell.append(
    el('p', `Miasto: ${view.city?.name ?? '—'}${mockTag}`),
    el('p', `Wzrost/turę (DTO): ${view.growth ? formatLiczbaPl(view.growth.pctPerTurn) : '—'}%${mockTag}`),
  );
  // P5.2: panele poziomu 0 ładowane po instalacji katalogu (ZAŁOŻENIE P5.2-Z1); nic nie montują.
  const level0 = await import('./ui/portLevel0');
  shell.append(el('p', `Panele poziomu 0 (P5.2): ${level0.PORTED_LEVEL0.length}${mockTag}`));
  // P5.3: panele poziomu 1 bez cyklu — jw., nic nie montują.
  const level1a = await import('./ui/portLevel1a');
  shell.append(el('p', `Panele poziomu 1 bez cyklu (P5.3): ${level1a.PORTED_LEVEL1A.length}${mockTag}`));
  // P5.4: cykl C4 (karty encji + nauka) — jw., nic nie montują.
  const cycleC4 = await import('./ui/portCycleC4');
  shell.append(el('p', `Moduły cyklu C4 (P5.4): ${cycleC4.PORTED_CYCLE_C4.length}${mockTag}`));
  // P5.5: poziom 2 (+ przechodnie poziomu 1 i poziom 3 bez cyklu) — jw., nic nie montują.
  const level2 = await import('./ui/portLevel2');
  shell.append(el('p', `Panele poziomu 2 (P5.5): ${level2.PORTED_LEVEL2.length}${mockTag}`));
  // P5.6: cykle C2, C5 + `hexContextTooltip.ts`, `preBattle.ts` — jw., nic nie montują.
  const cycles = await import('./ui/portCycles');
  shell.append(el('p', `Moduły cykli C2/C5 i poziomu 4–7 (P5.6): ${cycles.PORTED_CYCLES.length}${mockTag}`));
  // P5.7 r1: cykl C3 (`hud.ts`, panel imperium) + `sceneTimingReport.ts` — jw., nic nie montują.
  const hudEmpire = await import('./ui/portHudEmpire');
  shell.append(el('p', `Moduły cyklu C3 i diagnostyki (P5.7): ${hudEmpire.PORTED_HUD_EMPIRE.length}${mockTag}`));
  // P5.7 r2: kreator nowej gry (`newGameFlow.ts`) — jw., nic nie montuje.
  const newGame = await import('./ui/portNewGame');
  shell.append(el('p', `Kreator nowej gry (P5.7 r2): ${newGame.PORTED_NEW_GAME.length}${mockTag}`));
  // P5.7 r3: ramka panelu miasta (`cityUxFrame.ts`, cykl C1; `cityPanel.ts` → r4 przez most) — jw., nic nie montuje.
  const cityUx = await import('./ui/portCityUx');
  shell.append(el('p', `Ramka panelu miasta (P5.7 r3): ${cityUx.PORTED_CITY_UX.length}${mockTag}`));
  const status = el('p', `Źródło danych: ${controller.source}`, 'v2-status');
  shell.append(status);

  await controller.onStateChanged<{ revision?: { turn: number } }>((event) => {
    status.textContent = `Źródło danych: ${controller.source} · tura ${event.state.revision?.turn ?? '?'}`;
  });
  const endTurn = el('button', 'Koniec tury (MOCK)');
  endTurn.type = 'button';
  endTurn.addEventListener('click', () => {
    void controller.send({ kind: 'advance_turn' });
  });
  shell.append(endTurn);

  app.replaceChildren(shell);
}

void boot();
