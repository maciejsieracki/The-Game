TEMAT:  P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow) — osobny Operator per temat (żądanie właściciela 2026-08-29), model sędziego (R-PROC-AUTOBOT.md §3c) obowiązuje od tego dispatchu
MODEL + EFFORT per rola: Operator **Opus 5** effort=medium / Evaluator **Opus 5** effort=high / Final Control Sonnet 5 effort=high — wyjątek graficzny/wizualny (`R-PROC-AUTOBOT.md` §5a, decyzja właściciela 2026-08-22): temat jest czysto CSS/layout/pozycjonowanie, nie logika/dane.

## WYZWALACZ
Właściciel, żywa rozmowa 2026-08-29, zrzut ekranu panelu „Ulepszenia terenu"
(Farma, Trzoda, Owce, Stadnina, Kopalnia miedzi...): ikonka info „ⓘ" stoi zbyt
blisko klikalnego obszaru samego ulepszenia — częste przypadkowe kliknięcia.
Żądanie: przenieść ikonkę CAŁKOWICIE na prawą stronę wiersza; etykietę kosztu
uprościć z „E1 · 40 P" na samo „40 P" (usunąć prefiks ery „E1", który wygląda
jak dziwny kod).

## RECON WŁASNY ORKIESTRATORA (2026-08-29, zweryfikuj przed edycją)
Dokładny kod: `gra/src/ui/buildModeHud.ts:690-701` (funkcja renderująca listę
`.civ-build-item` w panelu budowy/ulepszeń terenu):

```ts
html += '<div class="civ-build-item' + sel + (locked ? ' locked' : '') + '" data-key="' + t.key + '"'
  + (locked && hint ? ' data-lock-hint="' + hint.replace(/"/g, '&quot;') + '"' : '')
  + ' title="' + (locked && hint ? hint : t.label) + '">'
  + '<span class="ic">' + ic + '</span>'
  + '<span>' + t.label + '</span>'
  + '<span class="civ-build-info-ic" role="button" tabindex="0" title="Podgląd karty ulepszenia"'
  + ' aria-label="Podgląd karty: ' + t.label + '">ⓘ</span>'
  + '<span class="meta">' + (locked && hint ? (hintTechIcWrap + hint) : ('E' + t.epoka + ' · ' + costLabel + techHint)) + '</span></div>';
```

Dzisiejszy porządek DOM: [ikona][nazwa][ⓘ info — TUŻ PO NAZWIE, PRZED kosztem]
[meta: „E{epoka} · {koszt}"]. Ikonka `ⓘ` ma już własny `stopPropagation` (patrz
komentarz linia 695-698, wzorzec `.ttv-info-ic` w `techTreeView.ts`) — problem
to WYŁĄCZNIE POZYCJA w wierszu, nie brak izolacji kliknięcia. Cały wiersz
`.civ-build-item` ma osobny listener kliknięcia (linia 723) wybierający typ
budowy — stąd bliskość dwóch klikalnych stref.

## GOAL
W tym samym wierszu `.civ-build-item`: kolejność wizualna (nie musi być
identyczna z kolejnością DOM, o ile CSS/flex tak ułoży) to
[ikona][nazwa]．．．[koszt „{N} P"][ⓘ info] — ikonka info na SAMYM KOŃCU wiersza,
odseparowana od nazwy/ikony ulepszenia. Etykieta kosztu pokazuje WYŁĄCZNIE
`costLabel` (np. „40 P" albo „FREE") — bez prefiksu „E{epoka} · ". Zachowanie
przy `locked` (blokada tech/za mało Pracy — dziś `hintTechIcWrap + hint`)
NIE jest w zakresie tego tematu — zostaje bez zmian.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Zrzut ekranu z ŻYWEJ przeglądarki (Playwright/Chromium) panelu „Ulepszenia
   terenu" pokazuje ikonkę ⓘ na prawym końcu wiersza, wizualnie odseparowaną
   od strefy klikalnej nazwy/ikony ulepszenia — nie tuż przy nazwie jak dziś.
2. Ten sam zrzut pokazuje etykietę kosztu jako samo „{N} P" (albo „FREE"),
   BEZ „E{epoka} · " przed nią, dla co najmniej jednej odblokowanej i jednej
   niezablokowanej pozycji.
3. Klik w ⓘ nadal otwiera kartę encji ulepszenia (title="Podgląd karty
   ulepszenia"), klik w resztę wiersza nadal wybiera typ budowy — oba
   zachowania NIEZMIENIONE, tylko pozycja wizualna się zmienia.
4. Zachowanie `locked` (blokada technologii / za mało Pracy, hint z ikoną
   technologii) renderuje się identycznie jak dziś — nie w zakresie tematu.
5. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
6. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/19), research-test (33/33), unit-replace-test (13/13),
   combat-test (6/6).
7. Istniejące testy dotykające `buildModeHud.ts`/panelu ulepszeń terenu (jeśli
   asercje odwołują się do dokładnej struktury HTML/kolejności elementów w
   `.civ-build-item` albo do stringa „E{epoka} · ") zielone — z jawnie
   zaktualizowanymi oczekiwanymi wartościami, jeśli test sprawdzał starą
   kolejność/etykietę wprost.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (temat wizualny — obowiązkowa)
Zakaz uznania tematu za zamknięty na podstawie samego diffu CSS/HTML bez
zrzutu z ŻYWEGO Chromium (Playwright) pokazującego rzeczywisty układ PO
zmianie — test kontraktowy/jsdom nie renderuje faktycznego wyglądu (dokładnie
ta luka spowodowała regres T10 migracji CivPedia, `civ-autobot/SKILL.md`
tabela „Nasze tryby samooszukiwania"). Evaluator (Opus 5) dodatkowo
weryfikuje realnym zrzutem, nie tylko czytaniem kodu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/buildModeHud.ts` (wyłącznie fragment renderujący `.civ-build-item`,
linie ok. 690-701, plus towarzyszący CSS jeśli w tym samym pliku/module —
zweryfikuj gdzie faktycznie żyje styl `.civ-build-info-ic`/`.civ-build-item`
przed edycją), plik(i) testowe z kryterium 7 jeśli wymagają aktualizacji.
Zakazane bezwzględnie: `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładny plik/funkcję/CSS z błędem; runda N+1 na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, model sędziego §3c) → Operator (obrona, jeśli
zarzuty) → Final Control (werdykt per zarzut, osobne wywołanie Workflow) →
integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
