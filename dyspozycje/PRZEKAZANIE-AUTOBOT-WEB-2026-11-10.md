# Przekazanie pętli AutoBot (web `gra/`) — stan 2026-11-10

Dla agenta, który przejmuje pracę. Właściciel (Maciej) komunikuje się po polsku; odpowiadaj krótko i uczciwie (NIE_ZMIERZONO tam, gdzie nie zmierzono). Zasady stałe: `CLAUDE.md` + `README.md` + `docs/decyzje/R-PROC-AUTOBOT.md`.

## 1. Zasady, które właściciel powtarza (nie łam)
- Cała praca merytoryczna WYŁĄCZNIE przez Workflow (Operator → Evaluator → Obrona → Final Control, max 5 rund; FAIL wraca do TEGO SAMEGO ID z dopiskiem w `00-dispatch.md` i BAZĄ). Orkiestrator nie poprawia kodu gry ani konfliktów w kodzie ręcznie.
- Modele operatorów: **Haiku 5.5 domyślnie**; Sonnet tylko bardzo trudne tematy albo po 2 nieudanych rundach Haiku (z zapisem uzasadnienia w dispatchu); grafika (render, modele jednostek) = **Opus 5.5**. Evaluator/Final Control Sonnet.
- **Zawsze 4 tematy w toku.** Po każdym zakończonym: deploy na ROBOCZĄ → `git push` → sprzątanie dysku → start następnego z kolejki.
- Deploy WYŁĄCZNIE na ROBOCZĄ (nigdy KANON/FINALNA).
- Decyzje produktowe / progi liczbowe → `AskUserQuestion` po polsku (max 4 pytania naraz, rekomendacja pierwsza). Nie wybieraj progów sam.
- Każde zgłoszenie błędu od właściciela → od razu wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` + task + dispatch.
- Przed startem tematu sprawdź w `origin/main`, czy już nie jest wdrożony (2 pomyłki: TERMINOLOGY-TRADE-VS-TAX, rozejm) — `git log origin/main --grep=<ID>` i kod.
- Nie nazywaj skryptów workflow tym samym tytułem (poprawione w `mkport.sh`).

## 2. Mechanika (skrypty w scratchpadzie sesji)
Katalog: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (może zniknąć — odtwórz wg opisu).
- `mkport.sh <ID> PORT-R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1` → skrypt workflow z `meta.name = ID`. Start: `Workflow({scriptPath, args:{id,tag,split:false,round:N,opModel}})`. Po restarcie/padzie: `resumeFromRunId` (cache wyników agentów).
- Dispatch zapisany i wypchnięty PRZED startem: `dyspozycje/autobot/runs/<ID>/00-dispatch.md`.
- Zapis FC: `git branch -f web-wip/<NAZWA> <kod>`; `git update-ref refs/keep/<ID>-fc <SHA FC>`; `git push origin web-wip/<NAZWA>`; potem `git worktree remove --force .claude/worktrees/wf_*`.
- Deploy: `dep3.sh "<SHA kodu>" "<testy>"` (merge do `/home/user/integ`, build do `/tmp/civ-deploy-out`, log `/tmp/vbuild.log`; konflikt w generowanym `gra/src/data/wikiBundle.json` → NIE rozwiązuj ręcznie, wróć do workflow: merge main + `node gra/tools/bundle-wiki-for-game.cjs`) → `node tools/audio-sidecar-test.cjs --dist /tmp/civ-deploy-out` (w tle, czekaj na `audio-sidecar-test: PASS`) → `finalize2.sh <FALA> "tytuł" "zakres" "weryfikacja" "limity" "źródła"` (push main, odczyt GitHub Raw + MD5; sidecary MD5 5b990bc3…, 0a9a1047…, 9e88be9f… muszą być bez zmian) → wpis w rejestrze + `git push` → `rm -rf /home/user/integ /tmp/civ-deploy-out; git worktree prune`.
- Gałąź dokumentacji: `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (rejestr, dispatche). NIE rebase'uj na main (tysiące commitów). Scalenie dokumentacji do main zrobione 2026-11-10 (`7b201afcd`): merge w osobnym worktree, konflikty tylko w dokumentach (CLAUDE.md/rejestr/PYTANIA-OTWARTE: obie strony; pliki dispatch: wersja z gałęzi). Kod gry (`gra/`, `gra-robocza/`) tej gałęzi nie dotyka.
- **Dysk to wąskie gardło** (limit ~35 GB użytych; przy 0 GB padają worktree Final Control). Każdy temat web trzyma ~2,5 GB worktree. Przed startem web ≥ 4 GB wolnego. Sprzątaj `.claude/worktrees/wf_*` po zapisie refs. Nie buduj wdrożenia, gdy temat zaraz tworzy worktree FC. Stare przebiegi workflow w `/root/.claude/projects/.../subagents` zajmują ~2,7 GB — kasować tylko za zgodą właściciela (stracisz możliwość wznowienia).
- Heartbeat: cykliczny trigger `trig_011XWDWaiy4BmwWoqPtfJFMj` (co godzinę) przypomina o pętli.

## 3. Wdrożone na ROBOCZĄ w tej sesji (FALA 589–606, ostatni main `d0ccc260e`) — NIE ROBIĆ PONOWNIE
589 BATSKIP + AIREPL · 590 łodzie rybackie 6/6/6 · 591 Respekt (prawdziwa wartość) · 592 karta listy dyplomacji „Rekruci” · 593 etykiety dyplomacji (Rekruci „jedn.”, Obywatele, dopisek limitu wojennego) · 594 Garncarstwo (4 prereq, koszt 5 PN) · 595 „Ruda miedzi”/×0 + podpowiedź „Przydziel obywatela?” (tryb ręczny) · 596 drogi gracza = AI · 597 Ha'amonga (martwe bonusy) · 598 ceramika w utrzymaniu 4 budynków (Spichlerz II, Akwedukt, Łaźnia, Port; 2/t) · 599 wznowienie marszu (powiadomienie + wskaźnik „trasa wstrzymana”) · 600 oblężenie bez wyłomu = remis po 150 turach (Pomiń = AUTO). · 601 RAW-IDS + PROMOTAB (resolver nazw, tabela awansów) · 602 TERMINOLOGY-C (podatek zamiast handlu) · 603 RANGED-DAMAGE-MULT (Procarz ×3, Łucznik ×2) · 604 DAMAGE-COLORS (straty gracza czerwone, wroga żółte) · 605 TRUCE-IMPL (rozejm 5/10/15, propozycja pokoju po końcu, akceptacja wg siły 20%) · 606 SIEGELOCK (sąsiad nieoblegający nie blokowany; dołączanie do armii oblegającej). Szczegóły: rejestr `REJESTR-PROSB-I-ZADAN.md`.
## 4. W TOKU / gotowe, nie wdrożone
**Nic nie jest w toku ani gotowe do wdrożenia** (stan po FALA 606; żaden workflow nie działa, worktree/integ/out wyczyszczone).
Jedyne drobiazgi: `c6b0a58d5` (ref `web-wip/TERMTAX-test`) — jednolinijkowa poprawka testu terminology-trade-vs-tax, niewdrożona; R-WEB-UNIT-CARD-RANGED-MULT-Q1 (#205) — dispatch gotowy, run zatrzymany, nie wdrożony.

## 5. Kolejka (w kolejności; grupy konfliktów)
Grupa **battle/siege** (sekwencyjnie, pliki `battle/*`, `siege*`): [SIEGELOCK wdrożony FALA 606] · R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 (do bitwy dołączają wszystkie jednostki wokół miasta) · R-WEB-BATTLE-DAMAGE-COLORS-PLAYER-RED-ENEMY-YELLOW-Q1 · R-WEB-BATTLE-SKIP-TICK-LOOP-UNIFY-Q1 (dług: straty SKIP≠AUTO w oblężeniu z wyłomem; zadanie #202).
Grupa **ai.ts** (sekwencyjnie): R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1 (dispatch + dodatki 1–2; czeka na potwierdzenie podsumowania) · R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1 · R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1 · R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1 · dług AIREPL: limit 10% armii/turę do `ai-params.json` (#185).
UI/tekst: R-WEB-POLISH-LANGUAGE-AUDIT-Q1 · R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1 (#187: właściciel nie widział „Rekrutuj wszystkie” — kod jest w main i w `Gra-ROBOCZA.html`; sprawdzić w Chromium panel z HUD vs lista w panelu armii).
Długi testowe: battle-loot-test (4 FAIL), weterani-test (1 FAIL), ai-major-economy-test, pr141-f04-yields-activation-test, D-FOG-F (3 skrypty measure wciskają F bez opcji), glod-wojska-karencja-test, 4 testy czerwone na bazie (terminology-trade-vs-tax, tech-cards-top5, civpedia-karty-nazwa-przyciskiem, wonder-transfer-on-conquest). Drobne: komentarz `research.ts:21` o Garncarstwie; encyklopedia kosztów technologii niezgodna z tech.json (wymiana/brązownictwo/pismo/religia); encyklopedia Ha'amongi „×3 plony”; tag „rybołówstwo” w `wonders.json`; poprawka 1 linii testu terminology (`web-wip/TERMTAX-test`, `c6b0a58d5`).
**Na samym końcu / po odnowieniu limitu:** R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1 (model Falangi: włócznia w obu rękach + tarcza; **Opus 5.5**, wyniki r1 w `wf_30cb9be1-ea1`; zadanie #165, WSTRZYMANE przez właściciela).

## 6. Decyzje czekające na właściciela (do paczki AskUserQuestion)
- Podpowiedź „Przydziel obywatela?” (#201): przycisk/centrowanie kamery na polu? zakładka „Ważne” zamiast „Inne”? (wymaga pola akcji w SidePanelEvent).
- Marsz: opcja B powiadomień (obstacle/no_path/blocked_city w „Ważne”; no_movement i mgła cicho) — potwierdzić; kasowanie planu przy limicie stosu = tylko toast (dodać powiadomienie?).
- Terminologia klasa C — wykonywana teraz (decyzje właściciela już zapisane w rejestrze, ok. linii 9111).
- Nazwy robocze „Mała rzeka”, „Rzeka w sąsiedztwie”, „Tropiki” (RAW-IDS, brak definicji w danych).
- „×0” przy Soli/Koniu (surowce-dostępy): kosmetyka; alternatywa „×N tylko dla ilościowych”.
- Interpretacja 20% w rozejmie (patrz wyżej).
- Pomiar: skąd AI ma Brąz ×1994 (audyt kodu nie wykazał luki w rekrutacji; NIE_ZMIERZONO w symulacji).

## 7. Długi cross-cutting
- **REPIN Rust**: każdy temat web zmienia dane/UI/logikę — port Rust (`rust-port/`, branch `parity-v2`) wstrzymany; REPIN dopiero po końcu kolejki web (osobna pętla, ≥4 operatorów Haiku, sparse-checkout).
- Weryfikacja wizualna w Chromium: większość tematów UI ma NIE_ZMIERZONO (brak przeglądarki w workflow); sprawdzić po deployu na ROBOCZEJ.
- Rejestr i taski: `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (źródło prawdy zgłoszeń), lista tasków sesji (#194 = opis pętli i kolejki).
