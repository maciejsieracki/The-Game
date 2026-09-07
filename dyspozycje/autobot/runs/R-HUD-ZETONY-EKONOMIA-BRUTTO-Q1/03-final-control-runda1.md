STATUS: PASS
DOMAIN: GAME
TEMAT: R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1
GOAL: Trzy żetony HUD (Praca, Skarbiec, Nauka) na mapie świata + nagłówki analogicznych
sekcji w `empireDetailPanel.ts` pokazują ŁĄCZNY PRZYROST (brutto), nie netto. Redukcja do
finalnego netto zostaje WYŁĄCZNIE w rozpisce/tooltipie/tabeli bilansu. Liczba zapasu
("stock") nietknięta. Praca dociągnięta o brakujący drenaż "Cuda na mapie".

ZMIANY/COMMIT: zweryfikowano SAMODZIELNIE `a417f361` (Operator) i `5d681924` (Evaluator)
na `autobot/R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1`, baza `f2809766`, worktree
`/home/user/wt-hud-zetony-brutto`. `git log -1 --oneline` = `5d681924`, `git status
--short` puste (guard wstępny §2b — OK).

Weryfikacja per punkt zlecenia (a–g), wszystkie sprawdzone bezpośrednio w kodzie/diffie/
uruchomieniu, nie tylko odczytane z raportów:

(a) WSZYSTKIE TRZY żetony pokazują brutto — potwierdzone czytaniem `renderBarD1B()`
(hud.ts): Skarbiec `signed(s.bogactwoWplywyBrutto ?? s.bogactwoRate ?? 0)`, Praca
`signed(pracaWplywBrutto(s))` (nowa funkcja = netto+utrzymanie+autoUlepszenia+
cudaNaMapie), Nauka `signed(s.naukaRate ?? 0)` — NIEZMIENIONE, ale sprawdzone w main.ts
(`grep _lastNaukaRate\s*=`), że `_lastNaukaRate = playerEcon.nauka` bez ŻADNEGO
kolejnego odjęcia w całym pliku — więc brutto=netto dla Nauki jest faktem kodu, nie
tylko twierdzeniem Operatora; żeton Nauka pokazuje więc już brutto bez potrzeby zmiany.

(b) Zapas ("stock") nietknięty — w diffie `hud.ts`/`empireDetailPanel.ts` zmieniają się
WYŁĄCZNIE pola `rate:`/deltaHtml (drugi argument), nigdy `value:`/`stock` (pierwszy człon
"48"/"88"/"500"/"310"/"480"). Potwierdzone też wprost na zrzucie: liczby zapasu
500/88/480/310 identyczne przed i po (patrz (f)).

(c) `_lastPracaCudaKoszt` — potwierdzone w `git diff f2809766 a417f361 -- main.ts`:
deklaracja z komentarzem, akumulacja `_lastPracaCudaKoszt += usedPlayer` w tym samym
bloku co istniejące `_lastPracaRate -= usedPlayer` (drenaż "Cuda na mapie",
`advanceOwnerWonderMapBuilds`), wystawienie w `buildHudState()` jako
`pracaCudaKoszt: Math.round(_lastPracaCudaKoszt)`, reset do 0 w DOKŁADNIE 3 miejscach
(policzone: linie obok resetów `_lastPracaAutoUlepszeniaKoszt = 0;`). `hud.ts`:
`pracaWplywBrutto()` i `pracaChipTitle()` liczą identyczny wzór z 4 składnikami. Kod
przeczytany, nie tylko zrzut.

(d) Zero dotknięcia REGRES2/3 — `git diff f2809766 5d681924 -- gra/src/main.ts | grep
REGRES2\|REGRES3` zwraca WYŁĄCZNIE jedną linię kontekstu diffu (niezmienioną, część
istniejącego komentarza), zero linii `+`/`-` przy tych markerach. Potwierdzone też, że
w żywym pliku wszystkie 6 wystąpień REGRES2/REGRES3 (main.ts) to nadal ten sam,
historyczny kod/komentarz.

(e) Rozpiska/tooltip nadal pokazuje pełną ścieżkę brutto→netto — `skarbiecChipTitle()`
NIETKNIĘTA (diff nie dotyka jej ciała), kończy się "Razem netto"; `pracaChipTitle()`
dostała czwartą pozycję "Cuda na mapie", nadal kończy się "Razem netto"; w
`empireDetailPanel.ts` wiersz "Netto skarbiec" (linie 929/1060, tabela bilansu)
NIETKNIĘTY — sprawdzone grepem po całym pliku, oba wystąpienia nadal obecne.

(f) Zrzut PNG otwarty samodzielnie (`zrzut-runda1-trzy-zetony-brutto.png`) — treść:
"Skarbiec500+40Praca88+113Spichlerz480Nauka310+15…" — potwierdza WSZYSTKIE TRZY żetony
jednocześnie z brutto (Skarbiec +40 zamiast netto +9, Praca +113 zamiast netto +22,
Nauka +15 niezmienione), zapasy 500/88/480/310 nietknięte. Zgodne 1:1 z cytatem z
raportu Operatora i Evaluatora.

(g) Bramki uruchomione SAMODZIELNIE w tej rundzie (nie tylko odczytane z raportów):
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów, ~22 s.
- `node tools/hud-zetony-ekonomia-brutto-live-test.cjs` — **5 pass, 0 fail** (realny
  Chromium, realny `renderBarD1B`, realny scenariusz z dispatchu — potwierdzony tekst
  renderu identyczny z (f)).
- `node tools/praca-auto-ulepszenia-koszt-split-test.cjs` — **20 pass, 0 fail**.
- Dodatkowo, próbka NIEZALEŻNA od tego co uruchamiał Evaluator (Evaluator odpalił
  live-test/split-test/tooltip-mounted-panels; poniższe cztery Evaluator NIE uruchamiał
  sam, tylko zaufał raportowi Operatora):
  - `node tools/praca-pula-rate-parity-test.cjs` — 20 pass, 0 fail (12+8).
  - `node tools/empire-skarbiec-panel-coverage-test.cjs` — OK (12/12).
  - `node tools/empire-praca-panel-coverage-test.cjs` — OK (15/15).
  - `node tools/empire-nauka-panel-coverage-test.cjs` — OK (15/15).
  - `node tools/resource-usage-breakdown-test.cjs` — 100 passed, 0 failed.
- `git status --short` po wszystkich uruchomieniach — puste (worktree nie zabrudzony).

TESTY: jak wyżej w (g); wszystkie zielone, zero rozbieżności z raportami Operatora/
Evaluatora na sprawdzonej próbce.

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: integracja allowlist-only przez orkiestratora (allowlista z dispatchu:
`gra/src/main.ts`, `gra/src/ui/hud.ts`, `gra/src/ui/empireDetailPanel.ts`,
`gra/tools/hud-zetony-ekonomia-brutto-live-test.cjs`, artefakty runu) → rejestracja
nowej bramki w `R-PROC-AUTOBOT.md` §6 (obowiązek integracji, nie osobne zadanie) →
`READY_FOR_DEPLOY`.

GOTOWOŚĆ DO INTEGRACJI: TAK.
DEPLOY/PUSH: NIE WYKONANO
