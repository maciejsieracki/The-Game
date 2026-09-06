# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES (etap Evaluatora wykonany; 3 zarzuty → Obrona, werdykt per zarzut wydaje Final Control, §3c)
DOMAIN: GAME
TEMAT: R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1
GOAL: zgodny z 00-dispatch.md (GOAL 1–5); GOAL w raporcie Operatora nie rozjeżdża się z dispatchem (§16a pkt 9 — OK).
MODEL+EFFORT: Opus 5, effort high (R-PROC-AUTOBOT §5a, §9 poz. 6b).
BAZA: a09218ec potwierdzona `git log -1`; HEAD gałęzi e0a2df9d.

## ZMIANY/COMMIT
Diff a09218ec..e0a2df9d: `gra/src/main.ts`, `gra/src/ui/cityCaptureNotice.ts`,
`gra/tools/miasto-zdobycie-raport-test.cjs` (nowy), `runs/.../01-operator-runda1.md`, `dowody/*.png`.
Wszystko w allowliście (§16a pkt 1). `gra/src/game/capital-capture.ts` NIETKNIĘTY —
ekonomia bez zmian, potwierdzone `git diff` wobec bazy (pkt 4 zadania). Brak sekretów, brak usunięć poza GOAL,
brak kolizji z drugim aktywnym worktree (`git worktree list`).

## TESTY (uruchomione przeze mnie, nie streszczone z raportu)
- `tsc --noEmit` — 0 błędów.
- `tools/miasto-zdobycie-raport-test.cjs` — **74 passed, 0 failed**.
- Nietautologiczność, dwie WŁASNE mutacje `main.ts` + przywrócenie: (a) usunięcie guarda
  `if (input.technologie > 0)` + literał `tech(y)` → **7 FAIL** (2d, 2e, 3a, 3f, 4b, 4d, 6a);
  (b) usunięcie `recordCityCaptureEvent` z `resolveSiegeSurrender` → **2 FAIL** (5b, 5d).
  Bramka czerwienieje per lejek. Drzewo po mutacjach czyste (`git status` pusty).
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat OK.
- Rodzina capture/siege/elim (16 bramek) zielona, m.in. elimination-toast-merge 54/54, capital-capture,
  oblezenie 27/27, oblezenie-remis 271/271, post-capture-law 25/25, siege-ai 17/17, mapa-etykieta-stolicy 47/47.
- Parytet na czystej bazie w osobnym worktree a09218ec: `administracja-stolica` 52/1 i
  `barb-city-capture-cluster` 92/1 czerwone TAKŻE na bazie → **nie regres**. `eliminacja-lup-kwoty` na bazie
  **24/24 zielony** → patrz zarzut 1.
- Zrzuty: obejrzałem 01–03. Realny render, zgodne z opisem (01: 7 wierszy etykieta/wartość, bez „tech(y)"/„Power"/zer;
  02: Ludność +3, Budynki +2, Łup brak; 03: trzy karty + skrót „Raport zdobycia →").
- Grep własny: `tech(y)` w `gra/src/` już tylko w DWÓCH komentarzach (main.ts:1399, 26551); `Zdobycze Power` — 0 trafień;
  etykieta Mocy z `mocLabel()` (`MOC_LABEL_PL = 'Moc'`).
- Struktura (pkt 1 zadania) potwierdzona w KODZIE: `reportRowsHtml` (cityCaptureNotice.ts:135-150) generuje
  osobny `.civ-ccn-row` z rozłącznymi `<span>` etykieta/wartość; `eliminatedDetails` renderowane tylko gdy BRAK wierszy.

## ZARZUTY
1. **Regres bramki `gra/tools/eliminacja-lup-kwoty-test.cjs`** (rodzina „elim" wymagana przez kryteria końca
   dispatchu). Na bazie a09218ec: 24/24 zielona. Na gałęzi: 6 FAIL (1a–1f) i twardy `ReferenceError:
   eliminatedDetails is not defined` (crash w `renderEliminatedDetails`, tools/eliminacja-lup-kwoty-test.cjs:92,104),
   exit 1. Narusza §16a pkt 3 i kryterium „bez regresu na bramkach zdobycia/oblężenia/eliminacji". Plik jest POZA
   allowlistą, więc naprawa wymaga decyzji (rozszerzenie allowlisty w rundzie 2 albo świadome wycofanie bramki) —
   kandydat do `DO DECYZJI CZŁOWIEKA`, nie do cichego pominięcia.
2. **Raport dla GRACZA-OFIARY pokazuje jego stratę jako zieloną zdobycz.** `buildCityCaptureReportRows`
   (main.ts:1405-1413) zawsze nadaje `'+'` i `tone: 'gain'`, a `recordCityCaptureEvent` (main.ts:8156, 8164-8177)
   używa TYCH SAMYCH wierszy również gdy `oldOwner === 0`. Gdy AI zdobywa stolicę gracza, karta brzmi
   „Utracono miasto: X — Przejęte przez Rzym — Złoto ze skarbca: +1234", a modal „Miasto utracone" pokazuje
   „BILANS ZDOBYCIA / Złoto ze skarbca +1234" na zielono. Ścieżka realna — widać ją na `dowody/03` („Utracono
   miasto: Gniezno"). To dokładnie ta klasa defektu, którą usuwa GOAL 1 (komunikat zaprzeczający temu, co gra zrobiła),
   tylko po stronie lustrzanej.
3. **Drugie przejęcie tego samego miasta w tej samej turze ginie bez wpisu.** Klucz dedupu to
   `capture-<turn>-<cityId>` + `if (cityCaptureEventDetails.has(evId)) return;` (main.ts:8157-8158), bez rozróżnienia
   pary właścicieli. Gdy gracz zdobywa miasto, a AI odbija je w swojej fazie TEJ SAMEJ tury, wpis „Utracono miasto"
   nie powstaje w ogóle. GOAL 3 wymaga trwałego wpisu dla KAŻDEGO przejęcia; dedup ma chronić przed potrójnym zapisem
   z trzech lejków jednego zdarzenia, nie kasować drugiego zdarzenia.

BLOKADY: brak własnych (zarzut 1 jest blokadą zgłoszoną przez Operatora, potwierdzoną przeze mnie niezależnie).
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (odpowiedź per zarzut 1–3 z dowodem z wytworu) → Final Control (werdykt per zarzut).
DEPLOY/PUSH: NIE WYKONANO
