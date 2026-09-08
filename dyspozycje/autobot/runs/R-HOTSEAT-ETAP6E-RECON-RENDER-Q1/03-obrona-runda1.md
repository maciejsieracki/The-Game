# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Obrona, runda 1

Odpowiedź na wszystkie 4 zarzuty raportu `02-evaluator-runda1.md`.

## Zarzut 1 — grep ślepy na `= 0`/`?? 0` (C-031-kształt), 4 pominięte miejsca

**PRZYJMUJE.** Świeży `grep -rnE "(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b"
gra/src/render/*.ts` faktycznie zwraca 5 trafień, nie 2: `cities.ts:656`
(`applyFogVisibility(..., playerOwnerId = 0)`), `cities.ts:784` i `:803`
(`options?.playerOwnerId ?? 0`), `cityOkolicaOverlay.ts:298` (`params.ownerId ?? 0`)
oraz już znany `units.ts:6464`. Dodatkowo `grep -n "playerOwnerId:" gra/src/main.ts`
potwierdza 6 dodatkowych literalnych wywołań `cityRenderer.sync(..., playerOwnerId:
0)` (15883, 16025, 19369, 19416, 24543, 24599) zasilających te fallbacki. Poprawiono
§2 i §3B dokumentu recon, dopisano wszystkie znalezione miejsca.

## Zarzut 2 — pominięta bramka `syncOkolicaOverlay` (main.ts:5372)

**PRZYJMUJE.** `sed -n '5364,5373p' gra/src/main.ts` potwierdza
`if (!city || city.ownerId !== 0) { disposeOkolicaOverlay(); return; }` —
strukturalnie identyczne do `refreshTerritoryBorderOverlay` (11844), decyduje o
dodaniu/usunięciu grupy 3D ze sceny. Dopisano do §3B jako pozycję kategorii A/B.

## Zarzut 3 — fałszywe uzasadnienie wykluczenia `computePotegaComponents`

**PRZYJMUJE.** `grep -rn "computePotegaComponents" gra/src/` zwraca wyłącznie
definicję (`main.ts:14952`), zero wywołań. Funkcja jest martwa, nie zasila HUD.
Poprawiono uzasadnienie w §4 — wniosek (wykluczenie z sumy render) pozostaje
trafny, ale z poprawną przesłanką (martwy kod, brak odbiorcy, nie „liczy panelu
Mocy").

## Zarzut 4 — błędny opis stanu worktree 6a jako „NIEZACOMMITOWANE”

**PRZYJMUJE.** `git status` w `/home/user/wt-hotseat-etap6a-input` zwraca „nothing
to commit, working tree clean”; `git log --oneline -3` pokazuje commit `621f353a`.
Poprawiono §6: zmiany są zacommitowane LOKALNIE, niezmergowane do `origin/main` —
nie „niezacommitowane”. Wniosek merytoryczny (izolacja, reużycie `isMe`) bez zmian.

## Poprawki w dokumencie recon (`01-operator-runda1.md`)

- §2: rozszerzony grep, 4 nowe miejsca zamiast twierdzenia „reszta już
  sparametryzowana”.
- §3B: dopisane `main.ts:5372` i 6 wywołań `cityRenderer.sync` z `playerOwnerId: 0`.
- Suma hardkodów: 16 → **~22** (jawnie skorygowana, z rozbiciem liczbowym).
- §4: poprawiona przesłanka wykluczenia `computePotegaComponents`.
- §6: poprawiony opis stanu worktree 6a (zacommitowane lokalnie, niezmergowane).
- §7-§8: sprawdzone i uzupełnione pod kątem spójności z nową sumą (dodane pozycje
  do listy „brak nakładania” w §6, dodane etykieta pigułki/odznaka pracownika do
  planu dowodu no-op w §8).
- Nowa §9 „Obrona runda 1 — podsumowanie korekt” oraz zaktualizowany footer
  STATUS/ZMIANY/RUNDY/NASTĘPNY KROK dokumentu recon.
- Sprawdzono jawnie: KONIEC dokumentu (§9 + footer) jest spójny z poprawionymi
  sekcjami (suma ~22 cytowana identycznie w §3, §6, §9; stan 6a identyczny w §6 i
  §9) — dokładnie ten check, którego zabrakło w pierwszej Obronie Etapu 6b.

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only kategorii render/kamera Etapu 6 (patrz 00-dispatch.md)
ZMIANY/COMMIT: `01-operator-runda1.md` poprawiony (Obrona), ten plik dodany; zero zmian w `gra/`
TESTY: brak (docs-only); zarzuty 1-4 zweryfikowane świeżym grep/sed/git status/git log w tej rundzie
BLOKADY: brak
RUNDY: 1/5
OBRONA: 1 -> PRZYJMUJE (grep poszerzony, 4+6 miejsc dopisanych, dowód: grep -rnE "(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b" gra/src/render/*.ts)
OBRONA: 2 -> PRZYJMUJE (main.ts:5372 dopisane, dowód: sed -n '5364,5373p' gra/src/main.ts)
OBRONA: 3 -> PRZYJMUJE (przesłanka poprawiona, dowód: grep -rn "computePotegaComponents" gra/src/ = tylko definicja)
OBRONA: 4 -> PRZYJMUJE (opis poprawiony, dowód: git status + git log --oneline -3 w /home/user/wt-hotseat-etap6a-input)
NASTĘPNY KROK: kolejny Evaluator (runda 1, po Obronie — R-PROC-AUTOBOT.md §3c)
DEPLOY/PUSH: NIE WYKONANO
