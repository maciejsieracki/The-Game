# R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1
GOAL: domknąć trzy rozbieżności z DODATKU (zdarzenie wspolna_religia, kolejność pokoju 20 vs dZ=5, opisy „−5 Relacja” w diplomacy.json) bez zmiany zachowania gry.
BAZA: a2dc4fa31 (origin/main kandydat), worktree detached.

## 1. wspolna_religia — martwy kod, usunięty

Grep po `gra/src` (wszystkie wywołania `applyDiplomaticEvent` w main.ts, ai.ts, diplomacy-*.ts) — brak emitera:
- `gra/src/game/diplomacy.ts:875` — członek unii `DiplomaticEvent` (usunięty).
- `gra/src/game/diplomacy.ts:1004-1007` — `case 'wspolna_religia': dZ = 1` (usunięty).
- `gra/src/game/diplomacy-factors.ts:67` — etykieta `wspolna_religia: 'Wspólna religia (nawiązanie)'` (osierocona, usunięta).
- `gra/tools/diplomacy-test.cjs:147` — asercja tylko o tym zdarzeniu (usunięta).

Zdarzenie nie było nigdzie wywoływane, więc usunięcie nie zmienia zachowania. Religia dalej nie wpływa na Zaufanie (params `wspolnaReligia_zaufanie_perTura` = 0 bez zmian). Dokumentacja `docs/encyklopedia/pojecia/zaufanie.md:58` już mówi „religia nie wpływa na Zaufanie” — zgodna.

## 2. Kolejność przy pokoju — zaufanie kończy na 20, brak blokady

Źródło: `gra/src/main.ts`, funkcja `finalizePeaceTreatyBetween` (l.12092+, tylko odczyt):
- l.12117-12118: `trustSetpoint = pokoj_zaufanie_ustawienie` (dla pokoju; rozejm → `rozejm_zaufanie_ustawienie`). Wartości: `gra/src/game/diplomacy.ts:170` = 20, `gra/data/diplomacy.json:32` = 20.
- l.12127: `afterPeace = applyDiplomaticEvent(cur, 'pokoj')` — zaufanie = cur + 5 (dZ=5, `diplomacy.ts:940-943`).
- l.12130: `setDiploRelation(..., { ...afterPeace, zaufanie: trustSetpoint })` — zaufanie NADPISANE na 20.
- Między l.12130 a końcem funkcji nie ma już zapisu `zaufanie` dla pary (sprawdzone awk-iem po zakresie 12092-12290; jedyny inny `setDiploRelation` w zakresie to callback `declareWarAfterTruce` l.12283, poza ścieżką pokoju).

Wniosek: końcowa wartość po pokoju = 20 (nie 25, nie 5+20). Dział dZ=5 wpływa tylko na Respekt przez `afterPeace` (dRPeace, zapisany jako `pokoj_respekt`). Ścieżka rozejmu nie wywołuje `'pokoj'` — ustawia 10. BLOKADA: brak.

Uwaga: zdarzenie `'pokoj'` dZ=5 jest czytelnie „martwe dla Zaufania” (wartość zawsze nadpisywana). Nie zmieniałem kodu (poza allowlistą i zgodnie z dispatchem).

## 3. Opisy „−5” w diplomacy.json

a) l.305 (akcja 9. Ultimatum, Efekt „Spełnienie”): kod `ultimatum_spelnione` ma dZ = −5 w Zaufaniu (`diplomacy.ts:1045-1048`). Relacja = Zaufanie + Respekt, więc −5 Zaufanie to też −5 Relacja przy niezmienionym Respekcie. Tekst zmieniony z „−5 Relacja u adresata” na „−5 Zaufanie (a więc także −5 Relacja) u adresata” (wzorzec jak w reszcie pliku). Diff: 1 linia w `gra/data/diplomacy.json`.

   ZAŁOŻENIE / FLAGA DLA ORKIESTRATORA: zdarzenie `ultimatum_spelnione` NIE jest emitowane w `gra/src` (grep: tylko definicja, case i etykieta). Akceptacja ultimatum w `diplomacy-proposals.ts:1865-1871` zwraca `oneShotTrade`, bez zdarzenia zaufania. Tekst opisuje więc regułę zdefiniowaną w kodzie zdarzeń, a nie obserwowane zachowanie w grze. Opis jest zgodny z kodem zdarzeń, ale gracz w praktyce nie widzi −5 Zaufania po spełnieniu ultimatum. Do decyzji (DECYZJA dla orkiestratora): czy usunąć `ultimatum_spelnione` jako martwe (analogicznie do wspolna_religia), czy podpiąć je do akceptacji ultimatum (to jest zmiana zachowania — poza tym tematem).

b) l.471 (wiersz „Złamany pakt przez gracza”, Uwagi): tekst „W kodzie nie znaleziono rozchodzenia się informacji do sąsiadów (brak −5 Relacja u każdego)” jest zgodny z kodem. `breakTreatiesOnWar` (`main.ts:24030-24045`) stosuje wyłącznie `zlamana_obietnica` (dZ = −40 na parze), bez propagacji do sąsiadów. Tekst zostawiony bez zmian.

## 4. Rozszerzenie testu opisów

`gra/tools/diplo-json-descriptions-sync-test.cjs`:
- nowy odczyt `code.ultimatumSpelnione = caseDZ(src,'ultimatum_spelnione')` + check `=== −5`;
- check 8: wiersz ultimatum (Efekt) musi zawierać „−5 Zaufanie” zgodne z kodem;
- check 9: wiersz „Złamany pakt przez gracza” (Zmiana) = `params.zlamanaPaktGracz_zaufanie`;
- 3 nowe mutacje (ultimatum −5→−6; jednostka Zaufania zamieniona na Relację; wiersz pakt −40→−30) — każda wykryta.

## Zmieniane pliki (allowlista)

- gra/src/game/diplomacy.ts (usunięcie członka unii i case)
- gra/src/game/diplomacy-factors.ts (usunięcie osieroconej etykiety)
- gra/tools/diplomacy-test.cjs (usunięcie asercji wspolna_religia)
- gra/data/diplomacy.json (1 linia opisu, pola opisowe)
- gra/tools/diplo-json-descriptions-sync-test.cjs (rozszerzenie)
- dyspozycje/autobot/runs/R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1/10-operator-claude.md (ten raport)

Parametry JSON (sekcja `params`) nietknięte: `git diff gra/data/diplomacy.json` pokazuje jedną zmienioną linię (l.305), zero zmian w bloku `params`.

## TESTY (surowe wyniki, uruchomione z gra/ w worktree)

- `npx tsc --noEmit` → exit 0 (bez wyjścia).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `node tools/diplomacy-test.cjs` → `[diplomacy-test] 148 passed, 0 failed (total 148).`
- `node tools/diplo-civpedia-values-test.cjs` → exit 0.
- `node tools/diplo-json-descriptions-sync-test.cjs` → `WYNIK: 44/44 OK, FAIL: 0` (32 sprawdzeń opisów, 0 niezgodności; 9 mutacji wykrytych).
- `node tools/diplo-relation-tier-trust-test.cjs` → exit 0.
- `git diff --check` → exit 0.

Instalacja: `npm ci --ignore-scripts` w `gra/` (bez `npm run build`/`dev`). Zgłoszenie npm audit (ostrzeżenia zależności) — nie ruszane.

## BLOKADY

Brak blokad technicznych.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie wykonane)

1. Pliki `gra/tools/.dip-run.cjs`, `.dip-run2.cjs`, `.dip-bundle2.cjs` (tracked w git) zawierają jeszcze odwołania do `wspolna_religia` / `ultimatum_spelnione` w asercjach. Nie są w allowliście; nie są w `package.json` ani w tsconfig. Decyzja: usunąć je lub zaktualizować osobnym tematem.
2. `Dyplomacja/Dyplomacja-zasady.md` i `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md` wymieniają `wspolna_religia` (spoza allowlisty). Do aktualizacji osobnym tematem dokumentacyjnym.
3. `gra-robocza/`, `Gra-FINALNA.html`, `UI/Gra-podglad-KREATOR-E2.html` i `gra/src/game/...` kopie — nie dotykane (ZAKAZ).
4. Ultimatum: patrz pkt 3a — decyzja, czy `ultimatum_spelnione` jest martwe, czy ma być podpięte (zmiana zachowania).
5. `wikiBundle.json` nie zawiera zmienionego tekstu (`grep "warunek zrealizowany"` = 0), więc regeneracja nie jest potrzebna.

## RUNDY

1/5 (pierwsza runda; brak FAIL).

## NASTĘPNY KROK

Evaluator: zweryfikować diff (allowlista, zero zmian w `params`), potwierdzić punkt 2 (dowód kolejności) i decyzję o `ultimatum_spelnione` (pkt 3a) przekazać orkiestratorowi.

## DEPLOY/PUSH: NIE WYKONANO
