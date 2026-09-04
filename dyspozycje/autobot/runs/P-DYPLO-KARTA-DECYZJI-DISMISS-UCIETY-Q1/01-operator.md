# 01-operator — P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1
GOAL: karta blokująca „Wymaga decyzji" w pełni widoczna (stopka akcji nieucięta) przy braku
miejsca w `.sp-scroll` + „✕" (dismiss) w prawym górnym rogu karty, wzorem kart informacyjnych;
zero zmian w logice `onEventDismiss`/`main.ts`.

## ZMIANY / COMMIT

Commit: `3ea65f33` (gałąź `autobot/P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1`, worktree
`/home/user/wt-dyplo-karta-dismiss-uciety`, baza `origin/main` = `b1775c34`). NIE zintegrowany,
NIE pushnięty.

- `gra/src/ui/sidePanelHud.ts`
  1. **Geometria (GOAL 1).** W regule `.sp-event.sp-blocking.sp-expanded` dodane
     `min-height:min-content;flex-shrink:0;` + komentarz z przyczyną. `overflow:hidden`
     ZOSTAJE (potrzebne dla `border-radius:12px`) — to ono zerowało automatyczne minimum
     elementu flex w kolumnie `.sp-scroll`, przez co przeglądarka ściskała kartę zamiast
     przewijać kontener. Przywrócone minimum treści + zakaz kurczenia ⇒ nadmiar przewija
     cały `.sp-scroll`, karta zostaje kompletna. Zaokrąglone rogi bez zmian.
  2. **„✕" (GOAL 2).** W nagłówku karty (`.sp-blk-body`, po bloku tytułu) renderowany
     `<span class="sp-close" data-dismiss="<id>" title="Zamknij" aria-label="Zamknij
     powiadomienie">✕</span>` — DOKŁADNIE ten sam znacznik, klasa, atrybuty i gating
     (`config.onEventDismiss !== undefined`) co na kartach informacyjnych, więc łapie go
     istniejący listener `.sp-close[data-dismiss]` → `config.onEventDismiss`. Nowa reguła CSS
     `.sp-blocking.sp-expanded .sp-close` powiększa tylko cel kliknięcia (13px zamiast 10px)
     do skali rozwiniętej karty; `margin-left:auto` z reguły bazowej odpycha „✕" na prawy
     kraniec nagłówka. **Zero zmian w `main.ts`** (GOAL 4).
  3. **Zdublowany link (GOAL 3).** `data-sp-ignore` „Odłóż na później" USUNIĘTY ze stopki —
     wołał dokładnie ten sam `onEventDismiss` co nowe „✕", a był drugim elementem walczącym
     o miejsce w tej samej stopce (bezpośrednia przyczyna zgłoszenia). Link buntu
     „Zignoruj — bunt potrwa dalej" ZOSTAJE: jego etykieta niesie własną, nieoczywistą
     informację o skutku, więc nie jest duplikatem „✕".
  4. `isDeferrableDiploEvent()` — **logika warunku nietknięta**, funkcja zachowana, ale bez
     konsumenta w renderze; powód udokumentowany w jej docbloku. Sprawdzone w danych, że
     rozróżnienie „ta karta NIE jest deferrable" nie ma czego rozstrzygać: KAŻDY kształt id
     karty blokującej (`diplo-pend-*`, `negot-*`, `revolt-*`, `prod-empty-*`) trafia w
     `handleSidePanelEventDismiss` (main.ts:19886+) do gałęzi domyślnej z miękkim,
     jednoturowym `dismissedSidePanelEventIds.add(id)` — nie istnieje karta blokująca, dla
     której „✕" byłby semantycznie błędny. Dlatego „✕" przysługuje wszystkim kartom
     blokującym, tak jak dziś wszystkim informacyjnym (jawna instrukcja GOAL 3).
- `gra/tools/sidepanel-blocking-card-cutoff-real-render-test.cjs` — NOWA bramka (37 asercji).
- `gra/tools/sidepanel-diplo-dismiss-real-render-test.cjs` — kontrakt zaktualizowany z linku
  tekstowego na „✕" (ten sam handler, ta sama semantyka; zmienił się wyłącznie klikany
  element). Rozszerzony o kontrolę „✕" na karcie buntu i `prod-empty`: 30 → 35 asercji.

## TESTY (wszystkie uruchomione na żywo w tym worktree)

| Bramka | Wynik |
|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów |
| `tools/sidepanel-blocking-card-cutoff-real-render-test.cjs` (NOWA) | **37/37** |
| `tools/sidepanel-diplo-dismiss-real-render-test.cjs` | **35/35** (było 30/30) |
| `tools/sidepanel-events-toolbar-test.cjs` | 19/19 |
| `tools/sidepanel-hud-deadzone-test.cjs` | 43/43 |
| `tools/sidepanel-event-przekierowania-real-render-test.cjs` | 51/51 |
| `tools/sidepanel-event-header-wydarzenie-real-render-test.cjs` | 23/23 |
| `tools/logic-test.cjs` | 213/213 |
| `tools/tech-tree-test.cjs` | 19/19 |
| `tools/research-test.cjs` | 33/33 |
| `tools/unit-replace-test.cjs` | 13/13 |
| `tools/combat-test.cjs` | 6/6 |

Build wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`
(C-001); zero `npm run build`/`dev`.

## KRYTERIA KOŃCA — dowód na każde

1. **Żywy zrzut Chromium, karta bez ucięcia.** Scenariusze A (`diplo-pend-*`, viewport
   1280×700) i B (`negot-*`, 1280×640) z realnym kształtem karty z `collectTurnEvents()`
   (kotwice 0a/0b pilnują zgodności z main.ts) + karty informacyjne wypełniające panel.
   Asercja A1/B1 wymusza, żeby `.sp-scroll` FAKTYCZNIE przewijał (`scrollHeight >
   clientHeight`) — bez tego scenariusz byłby pusty i dałby fałszywy PASS. Pomiary:
   `card.scrollHeight <= card.clientHeight` (bezpośredni wykrywacz obcięcia przy
   `overflow:hidden`), `.sp-action-bar` w całości w prostokącie karty, cała karta w widocznym
   obszarze `.sp-scroll`, „Otwórz →" trafialny przez `document.elementFromPoint`.
   Zrzuty: `A-karta-blokujaca.png`, `A-panel.png`, `A-viewport.png` (i B-*) — karta z „✕"
   w prawym górnym rogu i pełnym „OTWÓRZ →" w kadrze.
2. **Klik „✕" chowa kartę na tę turę.** AB6/BB6 w nowej bramce (żywy klik → karta znika),
   oraz A4/A5/B4/B5 + kontrola różnicowa w zaktualizowanej
   `sidepanel-diplo-dismiss-real-render-test.cjs` (klikana znika, bliźniacza nieklikana
   zostaje) — ta sama ścieżka `onEventDismiss` → `handleSidePanelEventDismiss` co dawniej.
3. **„OTWÓRZ →" bez regresji.** C3: klik na realnej karcie `prod-empty-<id_prawdziwego_miasta>`
   otwiera REALNY panel miasta, czytane predykatem gry `openViews().cityPanel` +
   `cityPanelCityId`, nie klasami CSS. Dodatkowo A5/B5: przycisk w całości widoczny i
   trafialny (elementFromPoint) na kartach dyplomatycznych.
4. **Karty informacyjne bez zmian.** D1: `.sp-close` z niezmienionym `title="Zamknij"` /
   `aria-label="Zamknij powiadomienie"`; D2: klik nadal chowa kartę. Plus 51/51 i 23/23
   w istniejących bramkach kart informacyjnych.
5. `tsc --noEmit` czysty, wszystkie bramki referencyjne i sidepanelowe zielone (tabela wyżej).

## DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT §9 pkt 6a)

Z `sidePanelHud.ts` usunięta linia `min-height:min-content;flex-shrink:0;`, bundel przebudowany
(`/tmp/civ-dist-mut`), źródło przywrócone, bramka uruchomiona na zmutowanym artefakcie:

```
FAIL (A2) card.scrollHeight=207 vs card.clientHeight=24     <- karta zgnieciona
FAIL (A3) .sp-action-bar bottom=363.8 vs card bottom=184    <- cala stopka poza karta
FAIL (A5) "Otworz ->" elementFromPoint => "sp-sub"          <- przycisk niedostepny
FAIL (B2) card.scrollHeight=165 vs card.clientHeight=0
FAIL (B3) .sp-action-bar bottom=321.8 vs card bottom=160
FAIL (BB4) srodek "✕" przykryty inna karta
```

Bramka faktycznie czerwienieje bez fixu — nie jest tautologiczna. (A1 również czerwienieje w
mutancie, bo zgnieciona karta przestaje wywoływać przewijanie — skutek buga, nie wada testu.)

## BLOKADY

Brak.

## RUNDY

1/5

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — `02-evaluator.md`.

DEPLOY/PUSH: NIE WYKONANO
