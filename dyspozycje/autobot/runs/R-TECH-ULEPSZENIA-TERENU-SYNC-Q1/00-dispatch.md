# 00-dispatch — R-TECH-ULEPSZENIA-TERENU-SYNC-Q1

**Data:** 2026-08-21
**Pochodzenie:** wynik recon tematu `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`
(`dyspozycje/autobot/runs/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1/01-operator-recon.md`),
zlecony przez właściciela w czacie orkiestratora, 2026-08-21.
**Izolacja:** branch `autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` (NIE `main`), bez push.

## GOAL

Naprawić dwa potwierdzone, aktywne w `main` (FALA 300) bugi karty odkrycia technologii
(`gra/src/ui/techDiscoveryNotice.ts`), sekcja „Ulepszenia terenu":

**Bug A — widmowe/nieaktualne nazwy ulepszeń terenu (dane, `gra/data/tech.json`):**
4 technologie mają w polu `Odblokowuje ulepszenie terenu` nazwy niezgodne z
`gra/data/terrain-improvements.json` (kanoniczne źródło bramek, decyzja
`B1-tech-MACIEJ-2026-06-29.md`):

| Technologia | Dziś w `tech.json` | Rzeczywisty stan w `terrain-improvements.json` | Typ |
|---|---|---|---|
| Brązownictwo | „Popalnia brązu" | brak jakiegokolwiek pokrycia (realne: Kopalnia miedzi, Kopalnia cyny — inne nazwy) | WIDMO |
| Murarstwo | „Kopalnia" | brak pokrycia (realne dla Murarstwa: Kamieniołom, już osobno wymieniony) | WIDMO |
| Oswojenie zwierząt | „Bydło" | rekord `bydlo` istnieje, ale `nazwa` = „Trzoda" | DRYF NAZWY |
| Wojskowość | „Fort / umocnienia" | rekord `fort` istnieje, `nazwa` = „Fort" (bez dopisku) | DRYF NAZWY |

Naprawa: zsynchronizować WYŁĄCZNIE te 4 pola w `tech.json` z rzeczywistym stanem
`terrain-improvements.json` — usunąć widma, poprawić dryfujące etykiety. Widma
(Brązownictwo, Murarstwo) — do decyzji Operatora: usunąć całkowicie z pola, czy
zostawić resztę listy nietkniętą i usunąć TYLKO widmowy fragment (dla Murarstwa pole
ma dziś „Kopalnia, Kamieniołom, Posterunek (Strażnica)" — usunąć tylko „Kopalnia",
zostawić resztę; dla Brązownictwa pole ma dziś WYŁĄCZNIE „Popalnia brązu" — po
usunięciu pole staje się puste/null, sekcja przestaje się renderować dla tej
technologii, co jest poprawnym zachowaniem zgodnie z istniejącym kodem
`accordionSection()` — `count === 0` już dziś ukrywa sekcję).

**NIE dotykać `gra/data/terrain-improvements.json`** — to źródło poprawne (kanon
`B1-tech-MACIEJ-2026-06-29.md`), zmiana idzie WYŁĄCZNIE w `tech.json`.

**Uwaga informacyjna, POZA zakresem tego tematu (nie naprawiać tutaj):**
`Hutnictwo żelaza` ma odwrotny problem — `Odblokowuje ulepszenie terenu: null` mimo
że `terrain-improvements.json` ma realny wpis `kopalnia_zelaza` z `tech: "Hutnictwo
żelaza"`. To brak informacji (nieszkodliwy), nie fałszywa informacja — świadomie
odłożone poza allowlistę tego tematu, do osobnego zgłoszenia jeśli właściciel uzna
za potrzebne.

**Bug B — zła ikona dla WSZYSTKICH ulepszeń terenu w tej sekcji (kod,
`gra/src/ui/techDiscoveryNotice.ts`):**
`improvementIconSvg(name)` (wywołanie ~linia 368) dostaje etykietę czytelną dla
gracza (np. „Farma", „Trzoda") zamiast wewnętrznego `ImprovementKey` (np. `farma`,
`bydlo`) — mapa ikon w `brandAssets.ts` jest kluczowana po `ImprovementKey`, nie po
polskiej etykiecie, więc DOPASOWANIE NIGDY nie trafia i kod cicho fallbackuje do
`imp-farm` (ikona farmy) dla KAŻDEGO ulepszenia terenu w tej sekcji, niezależnie od
Bugu A — dotyczy ok. 13 technologii z niepustym tym polem.

Naprawa: zmapować nazwę z `tech.json` na `ImprovementKey` przed wywołaniem
`improvementIconSvg()`. Wzorzec poprawnego użycia (nazwa→klucz albo iteracja po
`terrain-improvements.json` filtrowanym po `tech`) już istnieje w kodzie — sprawdzić
`buildModeHud.ts` (wskazane w recon) oraz jak sekcje „Budynki"/„Jednostki" w TYM SAMYM
pliku (`techDiscoveryNotice.ts`) już poprawnie łączą dane z dwóch źródeł (`buildings`
filtrowane po `b.techUnlock === tech.Technologia`, `units` po `u.Tech ===
tech.Technologia`) — rozważyć analogiczne podejście: iterować
`terrain-improvements.json` filtrowane po polu `tech` (po synchronizacji z Bugiem A)
zamiast parsować tekstowe pole `tech.json`, co rozwiązałoby oba bugi jedną, spójną
zmianą architektoniczną. Operator decyduje, które podejście jest bezpieczniejsze i
mniejsze ryzykiem — uzasadnić wybór w raporcie.

## Allowlista

- `gra/data/tech.json` (wyłącznie 4 pola „Odblokowuje ulepszenie terenu" wskazane w Bug A)
- `gra/src/ui/techDiscoveryNotice.ts` (dopasowanie ikony/źródła danych sekcji ulepszeń, Bug B)
- test wizualny/danych dla tego pliku, jeśli istnieje (`gra/tools/technology-discovery-card-visual-test.cjs`
  — sprawdzić i rozszerzyć jeśli dotyczy tej sekcji)
- `dyspozycje/autobot/runs/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1/`

Nic poza tym. Zero zmian w `terrain-improvements.json`, `main.ts`, innych kartach
(`unitInfoCard.ts`, `sidePanelHud.ts`, `bottomBarHud.ts`).

## Kryteria końca / testy

1. Dla Brązownictwa i Murarstwa: sekcja „Ulepszenia terenu" NIE pokazuje już
   widmowych nazw („Popalnia brązu", „Kopalnia") — albo sekcja znika (Brązownictwo,
   pole puste), albo pokazuje wyłącznie realne pozycje (Murarstwo → tylko
   Kamieniołom, ewentualnie Posterunek jeśli dotyczy).
2. Dla Oswojenia zwierząt i Wojskowości: sekcja pokazuje aktualne nazwy („Trzoda",
   „Fort") zamiast przestarzałych.
3. Dla WSZYSTKICH technologii z niepustym polem: ikona w sekcji „Ulepszenia terenu"
   odpowiada realnemu ulepszeniu (nie domyślnej farmie) — zweryfikować programowo
   dla min. 3 różnych technologii (np. Rolnictwo→Farma, Oswojenie zwierząt→Trzoda,
   Górnictwo/Murarstwo→Kamieniołom, jeśli takie technologie mają niepuste pole).
4. `tsc` bez nowych błędów.
5. Istniejący test wizualny karty (`technology-discovery-card-visual-test.cjs`,
   17/17 wg historii FALI 300) bez regresji, jeśli dotyczy tej sekcji — rozszerzyć
   o nowe asercje z punktów 1-3 jeśli plik istnieje i pasuje strukturą.
6. Żadna inna sekcja karty (Budynki, Jednostki, Kolejne technologie, Zmiany
   ekonomiczne) nie zmienia zachowania.

## Model / effort (kanon R-PROC-AUTOBOT.md §5a)

Operator → Sonnet 5, effort Medium. Evaluator → Sonnet 5, effort High. Final Control →
Sonnet 5, effort High, OSOBNY subagent (R-AUTOBOT-FINALCONTROL-SUBAGENT-Q1).

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora NA BRANCHU
`autobot/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`. Limit 5 rund (`R-AUTOBOT-LIMIT-5-RUND-Q1`).
Bez integracji do `main`, bez push, do czasu wyraźnej autoryzacji właściciela.
