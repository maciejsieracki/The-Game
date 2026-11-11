# Kolejka WEB do realizacji po skończeniu obecnych operatorów — 2026-11-11

Polecenie właściciela 2026-11-11: najpierw skończyć WSZYSTKIE tematy web; Rust nie startuje nowych tematów, dopóki web nie jest skończony. Źródła: `origin/main` (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `PRZEKAZANIE-AUTOBOT-CODEX-2026-11-11.md`, `autobot/STAN-ZADAN-CODEX-20261110.md`), gałęzie `origin/codex/*`, taski sesji. Skrypt dispatchu: `scratchpad/WEB-FINISH.js` (tryby `fc` / `eval` / `full`); dodatki `00-dispatch-DODATEK-claude.md` na gałęzi docs. Limit: do 4 tematów naraz, web ≥4 GB wolnego, po każdym temacie push + sprzątanie.

> POLECENIE WŁAŚCICIELA 2026-11-11: WSZYSTKIE pozycje §1–§4 są w pętli autonomicznej i realizowane na bieżąco (do 4 tematów naraz, sekwencja wg plików). Audyty (§2) = próba reprodukcji z dowodem, nie „naprawa”; długi testowe (§4) = osobne małe tematy (Haiku); decyzje (§3) zadawane przez AskUserQuestion; tematy zależne od odpowiedzi czekają, reszta idzie dalej.

## 0. W toku / do wdrożenia (stan 2026-11-11 ~12:00)
| Temat | Stan | Następny krok |
|---|---|---|
| R-WEB-CAVALRY-IRON-ONLY-Q1 | FC PASS-WITH-NOTES, kod `12737d11c` (baza 4919be9dc) | integracja + deploy ROBOCZA (jedna fala z pozostałymi) |
| R-WEB-EMPIRE-RECRUIT-AFFORDABILITY-SUMMARY-Q1 | FC PASS-WITH-NOTES, kod `f87985d7c` (baza 1e48b8282) | j.w.; uzupełnić raporty 01/20/50 na gałęzi |
| R-WEB-MELEE-CROSS-TYPE-NEXT-ERA-REPLACEMENT-Q1 | FC PASS (Codex), kod `e42266cf1` (baza 186d0f03b) | j.w. |
| R-BITWA-DEAD-UNIT-DISAPPEARS-Q2 | Operator Sonnet r2 w toku (odtworzenie ducha) | wynik → Evaluator → FC; jeśli NIE_ODTWORZONO — uczciwy raport, bez „naprawione” |

## 1. Zarejestrowane, bez operatora (kolejność startu; ograniczenia plikowe = sekwencyjnie)
1. `R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1` — ocalali przegranej armii cofają się 2 heksy; bez kasowania/teleportu przy braku trasy (dispatch na main). Pliki bitwy — NIE równolegle z DEAD-UNIT.
2. `R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1` — kandydat `f20b81654` na `codex/trade-resume` czeka na Evaluatora (fairness przed/po exact payload; test fairwood200/iron10). Tryb `eval`.
3. `R-WEB-IRON-STUD-ADJACENCY-Q1` — stadnina bez naturalnego Konia w Żelazie tylko przy istniejącej stadninie (AI/manual/autobudowa). Po CAVALRY (dane jednostek).
4. `R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1` — Armia/Rekrutacja dziedziczą wspólne „Idź do wodza”, zamówienie bezpośrednie domyślnie OFF. Po RECRUIT-AFFORDABILITY (ten sam panel).
5. `R-WEB-BRICK-CYCLES-75-100-Q1` — cykle 75 Brąz / 100 Żelazo (nie liczba cegieł); plik converters.ts.
6. `R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1` — on/off budynków surowcowych + lista miast na końcu panelu Miasta; po BRICK-CYCLES (zasoby/konwertery).
7. `R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1` — komunikat od 20. tury po wejściu nacji w Brąz, 3× barbarzyńców.
8. `R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1` (dług z Rust L-1: 21/23 awansów INFANTRY) — tylko po ustaleniu, czy web to wymaga.

## 2. Audyty bez dowodu błędu (NIE oznaczać jako naprawione bez reprodukcji)
- `R-WEB-AI-BRONZE-STOCK-EXCESS-Q1` (24 818 Inkowie; brak historii zapasu).
- `R-WEB-WORK-ALLOCATION-POOL-DOUBLE-CREDIT-Q1` (audyt `90c485a1c` na `codex/work-pool`; potrzebny snapshot jednej tury).

## 3. Decyzje właściciela (AskUserQuestion, po polsku)
- `R-WEB-ADMINISTRATOR-AUTOBUILD-GATE-Q1` — jaki budynek i zakres (budynki/ulepszenia); Ratusz był tylko propozycją.
- #201 podpowiedź „Przydziel obywatela?” — przycisk/centrowanie kamery i zakładka Ważne.
- `R-WEB-SIEGE-ENGINES-…`/AIREPL (#185) limit 10% armii/turę → ai-params.json (potwierdzić).

## 4. Dalszy backlog web (starsze, do weryfikacji względem main przed startem)
- Audyt PL `R-WEB-POLISH-UI-ROUTES-AUDIT-Q3` (`codex/polish-ui-q3` `3e90dd47f`, wstrzymany) i `R-WEB-POLISH-LANGUAGE-AUDIT-Q1` (#122).
- #138 AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST (AI: główna armia/decyzje).
- #165 RENDER-FALANGA-UNIT-MODEL-PHALANGITE (Opus, grafika).
- #204 TERMINOLOGY-C-FOLLOWUP; #205 UNIT-CARD-RANGED-MULT (karty z mnożnikiem Procarz ×3 / Łucznik ×2).
- #187 EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY.
- Dług testowy: #112 glod-wojska-karencja (29/10), #191 battle-loot (4 FAIL)/weterani (1 FAIL), #192 ai-major-economy / pr141-f04, #193 D-FOG-F (3 skrypty measure bez opcji F), live-test rekrutacji L16–L18 (20/23 na bazie).
- Końcowy test dużego imperium, docelowy model muru ceglanego (FUTURE), nowe epoki (#57 — wstrzymane do nowej wersji Rust).
- Stare wpisy z `PYTANIA-OTWARTE.md` (komenda §0c daje ~73 trafień; większość historyczna) — weryfikować pojedynczo względem main, nie dispatchować hurtem.

## 5. Zasady
Deploy tylko ROBOCZA po FC: merge kandydatów FC do main → `dep3.sh` → sidecar → `finalize2.sh` → rejestr+WERSJE → push → odczyt Raw+MD5 → sprzątanie. Modele: Haiku domyślnie, Sonnet po uzasadnieniu/2 nieudanych rundach, FC/Evaluator Sonnet.

## 6. Nowe z fali 620–621 (dopisane)
- `wipeDefenderOnCityCenter`: ocalali obrońcy z HP>0 w zdobytym mieście giną zamiast cofać się 2 heksy (ABC, wyszło przy SURVIVOR-RETREAT).
- e2e: AUTO w oblężeniu (timeout swiftshader), wyłom muru + replay + bitwa ręczna bez Skip, `_skipInstantFallback`.
- AI-TRADE: wiring `main.ts` end-to-end, realny tick dostaw, UI/Chromium, stare zapisy.
- Karty konnicy po zmianie Żelaza w przeglądarce (FC nie uruchomił).
- Raporty 01/20/50 na gałęzi `codex/recruit-affordability` nieaktualne (dokumentacja).

## 7. Nowe zgłoszenia i decyzje właściciela (2026-11-11 popołudnie)
- DECYZJE ABC: duchy zabitych = A (zamknięte NIE_ODTWORZONO); garnizon w zdobytym mieście giną; wycofanie ocalałych TYLKO w walce w polu (w mieście giną) — DODATEK 3 SURVIVOR-RETREAT; #201 = „2 b+c” (przycisk centrujący kamerę + zakładka Ważne).
- `R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1` (#201 wykonanie) — dispatch w runs/.
- `R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1` — lista budynków w panelu miasta: ikony surowców + liczby zamiast nazw (zrzut właściciela w evidence/).
- `R-WEB-CITY-ADMINISTRATOR-Q1` (zastępuje ADMINISTRATOR-AUTOBUILD-GATE): administrator miasta (Pałac I–III / Dom Starszyzny / Dwór Zarządcy / Pretorium), 1 na miasto, utrzymanie z budżetu państwa, efekty korupcja −10% / produkcja +3% / podatki +3% ×tier, autobudowa budynków tylko z administratorem, przycisk obok „Ustaw jako stolicę”.
- `R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1`: administrator ulepszeń rekrutowany w panelu ulepszeń; auto-ulepszenia tylko z nim (po CITY-ADMINISTRATOR).
- `R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1`: automatyczna rekrutacja tylko z wybranym generałem w panelu Rekrutacja; nowe jednostki idą do niego.
Kolejność: ICONS i FARM-HINT (małe, Haiku) teraz → CITY-ADMINISTRATOR (Sonnet) → IMPROVEMENT-ADMINISTRATOR → ARMY-AUTO-RECRUIT-GENERAL (sekwencyjnie: wspólna automatyzacja/ustawienia).

- Ikona administratora (decyzja/pomysł właściciela): pieczęć/laur z literą „A” — włączona do dispatchów CITY-ADMINISTRATOR i IMPROVEMENT-ADMINISTRATOR.
- FALA 623 wdrożona: IRON-STUD-ADJACENCY (main 681a0a828, MD5 be5d3e417eae4afa10bdac9141016adc).
