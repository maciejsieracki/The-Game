# Którą ścieżką znikają sojusze AI↔AI — R-WEB-ALLIANCE-REMOVAL-PATH-Q1

Data: 2026-11-25 · Baza kodu: origin/main `8f7b4981f` (gra/src bez zmian w repo) · Seed 4242, tryb `--harder 1`, gracz = autopilot.
Raport operatora: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/10-operator-claude.md`.
Dane i SHA256: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/dane/`.

## 1. Wynik w jednym zdaniu

Na bazie `8f7b4981f` (seed 4242, tury 2–67) **nie zaobserwowano utraty żadnego sojuszu AI↔AI**: sojusze 1–4 i 1–16 powstały w turze 38 i trwały do tury 67. Zdarzenie z danych ALLY66 (umowy 1–13 i 1–19 znikające w turach 62–66) **nie odtworzyło się** — na tej bazie te pary nie zawarły sojuszu w ogóle. Ścieżka, którą zniknęły tamte umowy, pozostaje **NIE ZMIERZONO**.

## 2. Wszystkie miejsca usuwające lub zamykające umowę w `activeDeals` (gra/src, baza 8f7b4981f)

| # | Plik:linia | Funkcja (wywołująca) | Ścieżka | Reguła w kodzie |
|---|---|---|---|---|
| 1 | gra/src/main.ts:22806 | resolveAllianceWarCall (22748) | odmowa obowiązku sojuszu (wezwanie do wojny sojusznika odrzucone) | `treatiesBrokenByRefusal` (diplomacy-treaties.ts:365) |
| 2 | gra/src/main.ts:24644 | breakTreatyVoluntarily (24612) | zerwanie dobrowolne (przycisk gracza lub AI) | kara wiarygodności inicjatora; wywoływane też przez tickZeroTrustTreaties (25789 → 25803) |
| 3 | gra/src/main.ts:25662 | breakTreatiesOnWar (25654) | wojna: zerwanie umów z `BREAK_ON_WAR` | `treatiesBrokenByWar` (diplomacy-treaties.ts:424); zbiór `BREAK_ON_WAR` (diplomacy-treaties.ts:399) zawiera PaktNieagresji, SojuszWojskowy, sojusz_defensywny, sojusz_pelny, OtwartGranice, … |
| 4 | gra/src/main.ts:26224 | finalizeAllianceObligationRefusals (26189) | odmowa obowiązku sojuszniczego przy wezwaniu (finalizacja) | `treatiesBrokenByRefusal` |
| 5 | gra/src/main.ts:26615 | runDiplomacyTurnTick (26613) | wygaśnięcie naturalne: `wygasaTura` <= tura | `expireTreaties` (diplomacy-treaties.ts:303: zostaje `wygasaTura === null || wygasaTura > turn`) |
| 6 | gra/src/main.ts:26678 | runDiplomacyTurnTick (26613) | płatność nie wykonana (tribut/handel) | `tickDiplomacyPayments` (diplomacy-economy.ts:78) zwraca `broken` |
| 7 | gra/src/main.ts:27104 | applyProposalOutcomeImpl (27045) | wchłonięcie miasta-państwa (wasal) | `findWasalDeal` |
| 8 | gra/src/main.ts:40244 | eliminateOwner (40109) | eliminacja właściciela: usunięcie wszystkich umów z jego udziałem | filtr `strony.includes(ownerId)` |
| 9 | gra/src/main.ts:11802, 50607, 52837 | reset nowej gry / wczytanie zapisu | `activeDeals = []` | nie ścieżka w trakcie gry |
| 10 | gra/src/main.ts:30637 | hak testowy civTest | `splice` umowy `test-domino-alliance` | tylko test; poza grą |

Uwagi:
- `syncRelationFromDeals` (gra/src/main.ts:24708) **nie usuwa** umów. Ustawia status `sojusz` tylko gdy w `activeDeals` jest umowa sojuszu, a `pokoj` gdy jest PaktNieagresji. Brak gałęzi „else” oznacza, że status `sojusz` **nie jest zdejmowany**, gdy umowa znika. To jest mechanizm opisany w ALLY66 (status vs `activeDeals`) i odpowiada na pytanie ABC #103, które tu tylko opisujemy, nie zadajemy.
- Nie znaleziono innych przypisań `activeDeals =` w gra/src/game/ai-ai-*.ts; ich użycia `activeDeals` są tylko odczytem (prefilter), co potwierdzają komentarze w ai-ai-treaty-tick.ts:104 i ai-ai-alliance-tick.ts:174.

## 3. Pomiar na bazie 8f7b4981f

Instrumentacja: kopia drzewa poza repo (`/tmp/claude-0/aaq1/gra`), patch `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/instrumentacja-AA-REMOVE.patch`. Każde miejsce z tabeli (1–8) wywołuje `removeTreatiesByIdLogged` lub `expireTreatiesLogged`, które zapisują `[AA-REMOVE] tura, ścieżka, id, rodzaj, strony, wygasaTura`. Bundle zbudowany `vite build` poza repo (`--outDir` w /tmp). Runner `diplomacy-harder-measure-run.cjs`, seed 4242, `--harder 1`, odcinki `--stop-at` 40 / 63 / 50 / 67 (jeden Chromium).

Wynik z `seed4242-harder1.jsonl` (66 wierszy, tury 2–67):
- Sojusze AI↔AI (status `sojusz`): zdarzenia tylko **GAIN t38 1-4** i **GAIN t38 1-16**. Żadnej utraty (LOSS) w turach 2–67.
- Pary 1–13 i 1–19: `neutralni` przez cały bieg.
- Plik logu `[AA-REMOVE]` nie powstał (brak wpisów). Patrz ograniczenia.

Porównanie z danymi ALLY66 (`runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt`): tam `sojusz_aiai_1_13_t40` i `sojusz_aiai_1_19_t58` istniały w activeDeals (t58 i dalej). Na bazie 8f7b4981f ten przebieg się nie odtwarza, więc nie da się wskazać ścieżki dla umów 1–13 i 1–19 z tego pomiaru.

## 4. Klasyfikacja

- Dla utrat sojuszu AI 1 w turach 62–66: **brak przypadków na bazie 8f7b4981f** — nic do sklasyfikowania. Klasa dla zdarzenia z ALLY66: **NIE ZMIERZONO** (zdarzenia nie ma w biegu na tej bazie; źródło z danych ALLY66 pochodzi z innego stanu gry).
- Ścieżki 1–8 mają jawną regułę w kodzie (odmowa, zerwanie, wojna, wygaśnięcie, płatność, wasal, eliminacja). Nie zgłaszam żadnej jako ŁAMIE REGUŁĘ, bo nie zaobserwowano jej działania w tym biegu.
- Osobno: status `sojusz` pozostający po zniknięciu umowy (`syncRelationFromDeals`) — to pytanie do właściciela (#103), nie błąd do naprawy w tym temacie.

## 5. Ograniczenia (jawnie)

1. Pełnego dowodu na działanie hooka logującego nie ma: runner otrzymuje konsolę przeglądarki przez `page.on('console')` w kopii `ai-economy-measure-run.cjs`, a plik `aa.log` nie powstał. Brak wpisów `[AA-REMOVE]` może więc oznaczać brak usunięć (dowiedziony tylko dla umów sojuszu przez jsonl), a nie dowód, że hook działa. NIE ZMIERZONO: poprawność przechwytywania konsoli.
2. Bieg z `--harder 1` nie był porównywany z biegiem ALLY66 na identycznej bazie; różnica stanu gry jest faktem, przyczyna nie jest zbadana.
3. Pojedynczy seed (4242); brak powtórki na seedzie 7.

## 6. Pliki

- Raport: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/10-operator-claude.md`
- Patch instrumentacji: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/instrumentacja-AA-REMOVE.patch`
- Dane (SHA256 w `dane/SHA256SUMS.txt`): `seed4242-harder1-base8f7b4981.jsonl.gz`, `seed4242-harder1.summary.json`, logi biegu `run1–4.log`, `build.log`, `tsc.log`
