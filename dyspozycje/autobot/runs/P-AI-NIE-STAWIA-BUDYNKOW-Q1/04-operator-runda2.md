# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Operator, RUNDA 2

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: wykonać Decyzję 1 ratyfikacji — `upgradeBudowaProfilAutoDefaultsOnLoad` POMIJA
ownera 0; migracja AI/miast-państw, gwarancja barbarzyńska i seed nowej gry bez zmian
ZMIANY/COMMIT: `9d031c77` — `gra/src/game/empire-city-defaults.ts`, `gra/src/main.ts`,
`gra/tools/ai-buduje-budynki-test.cjs`, `dyspozycje/autobot/runs/<ID>/**` (allowlista
dispatchu; `ai.ts`, `owner-utils.ts`, `cities.ts`, `auto-manage.ts` NIETKNIĘTE).
MODEL+EFFORT: Opus 5, effort high (C-052)
RUNDA: 2/5 · BAZA `3983e916` potwierdzona `git log -1` przed pracą
TESTY: `tsc --noEmit` (5.9.3) **0 błędów** · `ai-buduje-budynki-test` **PASS=39 FAIL=0**
(było 35) · referencyjne 213/213, 19/19, 33/33, 13/13, 6/6 · 17 bramek AI/miast zielonych,
wyniki CO DO LICZBY jak w R1 · trzy czerwienie parytetowe bez zmian (287/8, 21/1, 92/1)
BLOKADY: brak
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO

## ZMIANA — jedna linia, dokładnie ta wskazana w ratyfikacji

W pętli `upgradeBudowaProfilAutoDefaultsOnLoad`, po gałęzi barbarzyńskiej:
`if (oid === 0) continue;`. Nic więcej w logice. Poza tym trzy komentarze, bo dotychczasowe
twierdziły po Decyzji 1 nieprawdę („wczytana rozgrywka właściciela"): docstring funkcji i dwa
bloki przy obu wywołaniach migracji w `main.ts` (`:8208`, `:35176`) — ta sama klasa błędu co
zarzut 5 z R1. Argument obrony zapisany jako UZNANY, niewiążący dla ownera 0.

## GRANICA SEED vs MIGRACJA — zmierzona, nie opisana

| ścieżka | gracz | AI / miasta-państwa | asercja |
|---|---|---|---|
| nowa gra, założenie miasta | AUTO | AUTO | A4 (nietknięta) |
| przejęcie (`seedCityOwnerDefaults`) | wg globalnego defaultu | AUTO | A6 |
| wczytanie zapisu SPRZED naprawy | **`'reczny'`** | **AUTO** | **A10 (nowa)** |

A10 obejmuje OBIE strony granicy w jednej asercji — samo „gracz ręczny" zieleniłoby się też
przy wyłączonej migracji (MUT-A), a to nie naprawa. A8/A8b/A9 nietknięte, zielone.

## NIETAUTOLOGICZNOŚĆ A10 — czwarty build MUT-C

MUT-C = żywy kod z cofniętą **wyłącznie** tą jedną linią (kotwica + sanity-asercja). Po
roundtripie: **MUT-C `gracz=["zrownowazone"]`** wobec **FIX `gracz=["reczny"]`** → A10 realnie
czerwienieje (M7); M7b: mutacja nie rusza AI ani miast-państw. MUT-C skrócony do 14 tur.
Po 45 turach: FIX 12/7/**0**/1, MUT-A 4/1/0/0, MUT-B 12/7/**1**/1; pokrycie dużego AI
FIX 5/5, MUT-A 2/9 — jak w R1, więc progi M1/M2/M6 i A7 zostają skalibrowane.

## DWIE POPRAWKI ASERCJI, wymuszone przez Decyzję 1

1. **A4c WYCOFANA** (nie osłabiona): brzmiała „gracz zachowuje AUTO po wczytaniu zapisu
   sprzed naprawy" — przeciwieństwo Decyzji 1; obok A10 jedna z dwóch byłaby zawsze czerwona.
2. **A4b przeformułowana**: przejęcie następuje PO roundtripie, więc mierzy grę ze starego
   zapisu, gdzie gracz celowo zostaje `'reczny'`. Próba dołożenia przejęcia PRZED roundtripem
   **zmieniła świat** (A7 5/5 → 6/9) — cofnięta; powód zapisany w kodzie bramki.

## NOTA (do rejestru, nie do naprawy tutaj)

Decyzja 1 zawęża skutek z Decyzji 2 do NOWYCH partii gracza — przesuwa to punkt odniesienia
`R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1`. W tamten temat nie wchodziłem.
