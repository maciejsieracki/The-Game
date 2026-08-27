# 02-evaluator — P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1
MODEL+EFFORT: Opus 5, effort high · RUNDY: 1/5
GOAL (zgodny z `00-dispatch.md` co do słowa, §16a p.9): klik „Zbadano: <tech>" otwiera kartę TEJ
technologii (A); karta ulepszenia z „Szczegóły →" pojawia się OBOK karty technologii, obie widoczne (B).
Worktree `/home/user/wt-ev-wydarzenia` (detached `2cc7b8b9` — gałąź trzymał worktree Operatora).
Artefakt: `/tmp/civ-dist-ev-zbadano-q1`.

## Werdykt per defekt — pomiar INNĄ metodą niż Operator

**(A) POTWIERDZONY.** Operator dowodził klikiem; ja czytam STAN DOM + `getComputedStyle` po kliku
i biorę WSZYSTKIE technologie, nie dwie. Slugi z samej gry (`.civ-ttv-tn[data-id]`): **32, unikalne**.
Każda z 32 kart: „Karta technologii →", `cursor:pointer`, `role=button`, `tabindex=0`, `pointer-events≠none`.
Realny `page.mouse.click` z hit-testem dla 6 technologii (w tym „ł"→`owiectwo`): `visibility:visible`,
`opacity:1`, niezerowa, 1 host, **0 obcych `.entity-card-backdrop`**, a nazwa z `H2` wraca do TEGO
SAMEGO slugu. ODWROTNIE (d): ✕ usuwa kartę, **nie** otwiera karty i kasuje wpis **trwale** z `warEventLog`.

**(B) POTWIERDZONY.** Operator dowodził rect-ami; ja sprawdzam OSIĄGALNOŚĆ MYSZĄ. Hit-test w środku
satelity trafia w satelitę; realny klik w nią nie przelatuje do tła; ✕ satelity zamyka TYLKO ją,
karta technologii zostaje otwarta i klikalna (akordeon reaguje); link krzyżowy z satelity podmienia
satelitę (2 karty, 0 backdropów); klik w `.tdn-back` zamyka obie bez sierot.

**Trzy rodziny audytu (f), mój pomiar:** `war-*`→„Dyplomacja →"+lista, `elim-cs-*`→„Szczegóły →"+modal,
`border-march-*`→„Pokaż na mapie →"+kamera na dokładnym heksie. Konwencja afordancji bez zmian.

Harness Evaluatora `runs/<ID>/ev-harness/ev-weryfikacja.cjs` — **46/0**, zero błędów konsoli, pełna
scena (artefakt `vite build`, `?playtest=mapa`, prawdziwy panel i stos Esc).

## Bramki (moją ręką)

`tsc` **0** · `vite build --outDir /tmp/civ-dist-ev` **czysty** · logic **213/213** · tech-tree **19/0** ·
research **33/33** · unit-replace **13/13** · combat **6/6**. Bramka tematu **77/0**.
16 bramek obszaru kart/wydarzeń/CivPedii zmierzonych PRZED (worktree na `0ad2c20a`) i PO —
**wszystkie identyczne**: 75/0, 24/0, 31/0, 19/0, PASS, 52/0, 39/0, 26/0, 13/0, 12/0, 48/0, 19/0,
33/33, 23/0, 51/0, 43/0. `wikiBundle.json` przestemplowany tylko polem `generated` — przywrócony.
**Integracja:** merge-base `0ad2c20a`; próbny `merge --no-ff` z `origin/main`=`8d0eafac` (niesie oba
tematy równoległe) — **czysty**, scalone drzewo `tsc` **0**. Kolizji §2b brak.

## Mutacje powtórzone moją ręką (e)

M1 **70/7** · M2 **76/1** · M3 **4 fail + przerwanie**, `strayBackdrops:1` · M4 **77/0 — NIE czerwieni**
· M5 **76/1** — wszystkie zgodne z raportem Operatora, łącznie z ujawnioną przez niego M4.
**M-EV (moja, spoza jego listy):** powrót `openEntityCardBeside` do `openEntityCard(...,{mode:'dialog'})`
→ czerwona bramka tematu **i** czerwony mój harness, z dokładnym odtworzeniem defektu (`side=null`,
`strayBackdrops:1`). Obie asercje (B) nietautologiczne.

## Granice i allowlista

Diff wobec `0ad2c20a`: `gra/src/main.ts`, `gra/src/ui/techDiscoveryNotice.ts`,
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` (NOWY), raport. **`renderer.ts`,
`buildingAdapter.ts`, `sidePanelHud.ts` NIETKNIĘTE** — warunek „(B) bez `renderer.ts`" spełniony.
`gra/data/**`, `WERSJE.md`, `gra-robocza/**` nietknięte. Zero sekretów, zero usunięć spoza GOAL,
zero `npx`/`npm run build|dev`/`git add -A`, `map-gen-regression-test` nieuruchamiany, każde
wywołanie w `timeout`. Żadna z 10 granic §9 nie naruszona.

## NOTY (dlaczego PASS-WITH-NOTES)

1. **BRAK DOWODU (§13a) na emiter w żywej rozgrywce — POTWIERDZAM, nie zieleni się.** Mój niezależny
   pomiar: `?playtest=mapa` startuje w epoce 2/24 tech.; pierwszy `endTurn` domyka badanie **z awansem
   epoki** (2→3, gałąź bez karty), a od tury 2 gra stoi na blokującej karcie `prod-empty-city0` —
   25 kolejnych `endTurn` nie ruszyło stanu. Objaw inny niż u Operatora (u niego odroczona bitwa),
   wniosek ten sam. Zamknięcie luki = osobny temat infrastrukturalny (hak „ukończ technologię bez
   awansu epoki"), poza allowlistą.
2. **Trzy odstępstwa od allowlisty** (ujawnione przez Operatora — potwierdzam ocenę, nie warunek rundy):
   `handleSidePanelEventDismiss` ~`:19029` (13 linii, wprost wymóg 5); resolver `tech-done-*` w
   `main.ts` ~`:19090` zamiast `game/side-panel-event-link.ts` (poza allowlistą) — przeprowadzka to
   osobny temat; `getEventLink` ~`:19662` w tym samym bloku co `onEventClick`.
3. **Limit 8 wpisów `warEventLog`** — istniejąca konwencja, nie regres tego tematu, ale dotyka
   DOKŁADNIE karty ze zgłoszenia: `tech-done-*` wchodzi na `:26302`/obcięcie `:26310`, a hinty EOT są
   `unshift`-owane PÓŹNIEJ (`:29531-29535`, to samo obcięcie). W turze z ≥8 hintami świeża karta
   „Zbadano" zostaje wypchnięta. Ta sama ekspozycja dotyczy `era-*`. Osobny temat.
4. **Higiena (proces, nie kod):** `/tmp/civ-dist-ev` nadpisał mi w trakcie build BEZ zmiany (najpewniej
   równoległa sesja innego tematu); dwa pomiary pośrednie były przez to nieważne, wykryte i powtórzone
   na `/tmp/civ-dist-ev-zbadano-q1`. Rekomendacja: unikalny `--outDir` per TEMAT, nie per ROLA.
5. Bez skutku: `getEventLink` konsultuje `techDoneEventLinkFor` także dla kart `blocking` (dawniej
   `null` bezwarunkowo) — prefiksy rozłączne, `tech-done-*` nigdy nie jest blokująca.
6. Obawa Operatora o `-` w slugu bezprzedmiotowa: `techDoneEventTechName` tnie po PIERWSZYM `-`,
   więc slug z myślnikiem i tak wróciłby w całości.

ZMIANY-COMMIT: brak zmian w kodzie gry (rola Evaluatora). Dodane: `02-evaluator.md` oraz
`ev-harness/ev-weryfikacja.cjs` (artefakt runu, NIE kod gry — nie należy do `gra/`).
BLOKADY: brak technicznych; otwarte — nota 1.
NASTĘPNY KROK: **Final Control** (Opus 5 high). Najpierw noty 1 i 2 — czy idą do integracji jako noty,
czy wracają do Operatora.
DEPLOY/PUSH: NIE WYKONANO.
