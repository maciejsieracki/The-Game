# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Final Control

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
MODEL+EFFORT: Opus 5, effort high (dispatch przewidywał Sonnet 5 high — rozbieżność
do wiadomości orkiestratora, nie zarzut wobec wytworu).
BAZA: `f570a91a` · HEAD: `a14b8c1d` · `origin/main`: `00fa9fc9` (`gra/` identyczne z bazą).
IZOLACJA: wszystkie mutacje w KLONIE `--shared` poza worktree; `/home/user/wt-szczescie-skala`
nie był zapisywany ani razu (`git status --porcelain -uall` puste przed i po).

## 1. LICZBY WŁAŚCICIELA — grep po JSON, nie z raportów

Pozycja po pozycji, odczyt z `gra/data/*.json`: kultura/religia `[10,16,23]` na easy/normal/hard ·
podatki −10/+10, próg 90 · zaopatrzenie `_kara` +2/−2 (jedyny nośnik; mnożnik
`szczescie_zaopatrzenie_na_surowiec` usunięty) · wojna −5 · osiedle `[15,12,8,5]` ·
sześć cudów po 6 i **żaden inny cud nie ma `zadowolenie`** · Spichlerz 4+1=5, Świątynia 3,
Teatr 4, Akademia 4 · `szczescie_max_epoka` 20/40/60 · 30/50/70 · 35/55/80 ·
`szczescie_pct_cap` 120 · `szczescie_max_pop_wspolczynnik` 0,04 ×3 ·
`dajeSzczescie` = 19 true / 22 false, zbiory **identyczne** z listami dispatchu, 0 braków ·
7 martwych kluczy + `happinessBucketsFromPct` bez ani jednego odczytu w `gra/src`.
**Ani jednej liczby innej niż w dispatchu.**

## 2. PYTANIE 1 — czy osłabiono asercje

Liczba asercji **wykonanych**, baza vs HEAD (własny przebieg obu drzew):
logic 213→213 · society-breakdown 43→53 · zamożność 60→88 · normalizacja 132→146 ·
building-happiness 8→14 · r-wzrost 52→59 · war-parity 18→21 · wealth 28→36 ·
upkeep 109→109 (R3-B: „109 lub więcej"). **Żaden plik nie spadł.**
`logic-test:1370`: 3 podwarunki → 6 (0,8 / −0,8 / 0 / 1 / −1 / 0,5) + komunikat diagnostyczny.
Przypadek `karaBrakReligii` nie ma następcy, bo G4 właściciela mówi wprost „50/50 = dokładnie
zero"; jest to nazwane w kodzie i w raportach, nie wyciszone. **ODDAL.**
`citizen-resource-upkeep-test`: literały `+2`/`−2` pozostały literałami (R3-B). **ODDAL.**

## 3. PYTANIE 2 — jeden tor panel/silnik (własne mutacje)

Odczyt `cityPanel.ts:3119-3124`: `haCuda` i `atWar` czytane z `cfg.getOrderState().szLines`
(kanał, który silnik już policzył — nie drugie liczenie), `wealthZadowolenie(..., era)`,
`ownCultureShare` i wskaźnik religii oddane do `computeHappinessBreakdown`.
Mutacje własne w klonie HEAD:

| # | mutacja | skutek |
|---|---|---|
| FC-M1 | `atWar` zamrożony na `false` | przebudowa-skali **504/15** |
| FC-M2 | `haCuda` zamrożony na `0` | przebudowa-skali **501/18** |

Luka z zarzutu 2 rundy 1 jest zamknięta i **pilnowana**.

## 4. PYTANIE 3 — czerwone bramki

`tsc --noEmit` zielony. Rodzina wyznaczona greppem po `gra/tools/` (17 plików), wszystkie
zielone: building-happiness 14 · upkeep-obywatele 109 · culture-religion 65 ·
happiness-breakdown 38 · porządek-panel 81 · r-wzrost 59 · society-breakdown 53 ·
**przebudowa-skali 519** · normalizacja 146 · zamożność 88 · war-parity 21 · wealth 36 ·
religia-panel 15 · orderstate-restore 9 · ai-dług-porządki 17 · upkeep 73.
Referencyjne: logic **213/213**, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
Czerwone: `border-march-wygasanie` 22/4 i `unit-resource-upkeep` 3/4 — **oba zmierzone przeze
mnie na czystym `origin/main` z identycznymi liczbami**, żadna nie należy do rodziny. **ODDAL.**

## 5. PYTANIE 4 — zakres

31 plików w `f570a91a..HEAD`, każdy na allowliście dispatchu albo jednej z trzech ratyfikacji.
`gra/src/main.ts` — `git diff --quiet` czysty, **NIETKNIĘTY**. Zero trafień na
`docs/decyzje/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `playbook.json`, `order.ts`,
`post-capture-law`, plikach Prawa. `conquestNoGarrisonLawPenalty` na miejscu i nietknięty.
Edycja `_opis` w bloku `_kara` (`citizen-resource-upkeep.json`) dokumentuje dokładnie te dwie
ratyfikowane liczby i nie zmienia semantyki danych — **ODDAL**.

## 6. IZOLACJA — ślady cudzej pracy

`git status --porcelain -uall` **puste**. Plików `RSZQ1EVAL3-baza-*` **nie ma** (przeszukane
całe drzewo). Pozostałe kropkowe pliki w `gra/tools/` to bundle esbuilda objęte
`.gitignore:62`, generowane przez same bramki. Brak kopii zapasowych bramek, `.bak`, `.orig`.
**Drzewo posprzątane — ODDAL.**

## 7. POZOSTAŁE MUTACJE WŁASNE (dziesięć, wszystkie inne niż Operatora i Evaluatora)

| # | mutacja | skutek |
|---|---|---|
| FC-M3 | `buildings.json` `sad.dajeSzczescie` → false | przebudowa **513/6** |
| FC-M4 | `wonders.json` `posag_peruna` 6 → 5 | przebudowa **518/1** |
| FC-M5 | `szczescie_podatki_prog_pct` normal 90 → 80 | przebudowa **511/3**, zamożność **53/35** |
| FC-M6 | `_kara.szczescieZaBrakujacy` −2 → −1 | upkeep **107/2**, przebudowa **508/11** |
| FC-M7 | `SZMAX_BY_ERA_DEFAULT` `[30,50,70]` → `[30,50,71]` | normalizacja **142/4** (R3-C działa) |
| FC-M8 | powrót TYLKO Spichlerza w `computeGrowthHappinessNetto` | r-wzrost **54/5** (R3-D działa) |
| FC-M9 | `szczescie_max_epoka` hard[2] 80 → 78 | przebudowa **518/1**, normalizacja **145/1** |
| FC-M10 | `SZ_MAX_POP_WSP_DEFAULT` 0,048 → **0,5** | **wszystkie sześć bramek ZIELONE** |
| FC-M11 | `wealth_zadowolenie_max` normal 10 → 9 | przebudowa **504/15** |
| FC-M12 | `szczescie_skala_kultura_religia` normal[1] 16 → 15 | przebudowa **508/11** |

Po każdej mutacji `git diff --quiet` w klonie czysty; worktree tematu nietknięty.

## 8. WERDYKTY

1. **`SZ_MAX_POP_WSP_DEFAULT = 0,048` (`gra/src/game/society-breakdown.ts:243`) rozjechany
   z danymi (0,04) — DO DECYZJI CZŁOWIEKA.** Rozjazd **powstał w tej rundzie**: przed R3-A dane
   miały 0,038/0,048/0,058, więc fallback trafiał w `normal`. Mój pomiar FC-M10 dowodzi, że jest
   **całkowicie niepilnowany** — podmiana na 0,5 (10× obok) zostawia normalizację, przebudowę,
   zamożność, society-breakdown, happiness-breakdown i porządek-panel zielone, bo jedyna asercja
   (`normalizacja:249`) porównuje stałą z samą sobą. Skutek w żywej grze dziś zerowy: wszyscy
   wołający (`cityPanel.ts:2991/3818/5909`, `main.ts:29179`) podają `loadSocietyScaleParams`
   jawnie. **To nie jest zarzut wobec Operatora** — R3-C zawęził rundę 3 do `SZMAX_DEFAULTS`
   („Nic więcej nie ruszaj"), a on się do tego zastosował. Rozstrzygnięcia wymaga intencja,
   której wytwór nie niesie: czy R3-C był jednorazową poprawką, czy zasadą („każdy przyszły
   rozjazd kodu z danymi zaczerwieni bramkę") — w drugim wypadku potrzebna jest ratyfikacja
   rozszerzająca allowlistę o tę jedną linię plus asercja wiążąca ją z `normal`, dokładnie jak
   przy `SZMAX_DEFAULTS`.
2. Osłabienie asercji, w tym `logic-test:1370` — **ODDAL** (pkt 2).
3. Dwa tory Szczęścia — **ODDAL** (pkt 3).
4. Czerwone bramki poza rodziną — **ODDAL** (pkt 4, parytet na `origin/main`).
5. Wyciek zakresu / `main.ts` / `_opis` w `_kara` — **ODDAL** (pkt 5).
6. Śmieci po kolizji izolacji — **ODDAL** (pkt 6).

Zero NAPRAW, jeden DO DECYZJI CZŁOWIEKA → agregat **DECISION_REQUIRED**.

## BLOKADY

Jedna, procesowa, nie techniczna: werdykt 1 wymaga decyzji orkiestratora/właściciela.
Wytwór jest kompletny i zielony — nie ma czego naprawiać przed tą decyzją.

## RUNDY

3/5 zamknięte. Runda 4 potrzebna **wyłącznie** jeśli decyzja z werdyktu 1 brzmi „domknij".

## NASTĘPNY KROK

Decyzja orkiestratora do werdyktu 1. Przy „zostaw jak jest" — integracja allowlist-only
i `READY_FOR_DEPLOY` ręką orkiestratora. Przy „domknij" — wąska runda 4 na tym samym ID.

DEPLOY/PUSH: NIE WYKONANO
