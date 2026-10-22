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
  createMockSaveSlotsService,
  createMockTransport,
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
