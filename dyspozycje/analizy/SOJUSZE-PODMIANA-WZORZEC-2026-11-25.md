# Podmiana sojuszy AI↔AI (1-13 t33→t40, 1-19 t33→t58) — ścieżka usunięcia i limit 2 tura po turze (R-WEB-ALLIANCE-REPLACE-PATTERN-Q1)

Data: 2026-11-25 · Baza kodu: origin/main 8707b063b (= ALLYPATH) · Kandydat obrony: runda 2 Operatora (Haiku 5.5) po FAIL rundy 1 · Zero zmian w gra/src i gra/data.

## Wynik w skrócie

- **Limit 2 sojuszy na cywilizację: ZGODNE w danych (tura po turze).** Z 63 wierszy `[ALLIANCE-PLAN]` (t38–t67) maksymalna wartość licznika na cywilizację wynosi 2 (34 wystąpienia `,2]`, brak wartości 3 lub wyższej). Okna bez umowy istnieją i trwają dokładnie jedną turę (sekcja 2), nie są podwójną umową.
- **Ścieżka usunięcia dla obu podmian: NIE ZMIERZONO.** Log ALLY66 (`runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt`) nie ma wpisów `[AA-REMOVE]` (0 z 130 linii). ALLYPATH (`seed4242-harder0.alliance-log.txt`, 96 wpisów) nie odtworzył żadnej z dwóch par. Ścieżki dla 1-13 i 1-19 pozostają nieznane.
- **Najmocniejszy zaobserwowany trop (tylko dla innej pary):** w ALLYPATH jedyne usunięcie umowy typu `sojusz_aiai_*` to `odmowa-sojuszu-finalize` (`sojusz_aiai_1_16_t30`, t55, `gra/src/main.ts:26189` funkcja `finalizeAllianceObligationRefusals`, wywołanie usunięcia `main.ts:26224`). To nie jest dowód dla podmian 1-13 ani 1-19.
- **Klasyfikacja podmian (ZGODNE / ŁAMIE REGUŁĘ): NIE ZMIERZONO.** Nie stwierdzono łamania reguły. Brak dowodu ścieżki usunięcia uniemożliwia klasyfikację.
- **Hipoteza `platnosc-broken-tickDiplomacyPayments` odrzucona jako nieuzasadniona w danych** (sekcja 1): wszystkie 30 usunięć tą ścieżką dotyczy `rodzaj=wasalizacja`, zero dotyczy `sojusz_pelny`.

## 1. Ścieżka usunięcia dla podmian

| Podmiana | Dowód z logu ALLY66 | Ścieżka usunięcia | Status |
|---|---|---|---|
| 1-13: `sojusz_aiai_1_13_t33` → `_t40` | SYNC t33 13-1: deal `sojusz_aiai_1_13_t33` (`statusPrzed=neutralni`). SYNC t40 13-1: deal `sojusz_aiai_1_13_t40`, `statusPrzed=sojusz`, t33 nieobecny. Usunięcie t33 leży w oknie między snapshotem PLAN t39 a PLAN t40 (sekcja 2). | Nieznana. Brak `[AA-REMOVE]` w logu ALLY66. | NIE ZMIERZONO |
| 1-19: `sojusz_aiai_1_19_t33` → `_t58` | SYNC t53 1-19: `sojusz_aiai_1_19_t33` obecny. SYNC t58 19-1: `sojusz_aiai_1_19_t58`, `statusPrzed=sojusz`, t33 nieobecny. Usunięcie leży w oknie PLAN t57→t58. | Nieznana. Brak `[AA-REMOVE]` w logu ALLY66. | NIE ZMIERZONO |

Kandydaci z listy ALLYPATH, rangowani na danych (bez dowodu dla podmian):

1. `odmowa-sojuszu-finalize` (`main.ts:26189`/`26224`): jedyny zaobserwowany przypadek usunięcia `sojusz_aiai_*` (`sojusz_aiai_1_16_t30`, ALLYPATH linia 77, t55, civ 1). Nie ma dowodu, że działa na pary 1-13 lub 1-19.
2. `eliminateOwner` (`main.ts:40244`): w ALLYPATH usuwa tylko `sojusz_siostry_11_12` (linia 78); zero sojuszy AI↔AI.
3. `platnosc-broken-tickDiplomacyPayments` (`main.ts:26678`): **odrzucony jako hipoteza.** W `seed4242-harder0.alliance-log.txt` 30 wpisów tą ścieżką, wszystkie `rodzaj=wasalizacja` (np. linie 4 i 31), zero `sojusz_pelny`. Wcześniejsza hipoteza „najbardziej prawdopodobna” nie ma oparcia w danych.
4. `wojna-breakTreatiesOnWar` (`main.ts:25662`), `zerwanie-dobrowolne` (`main.ts:24644`, funkcja `breakTreatyVoluntarily` od linii 24612), `odmowa-obowiazku` (`main.ts:22806`): nie wystąpiły w danych dla sojuszy AI↔AI; bez obserwacji.
5. `wygasanie-expireTreaties` (`main.ts:26615`) odpada: sojusz AI↔AI ma `wygasaTura = null` (`gra/src/game/ai-ai-alliance-tick.ts:19`, `:106`, `:274`), a `expireTreaties` dotyczy tylko `wygasaTura` niepustego.

Mechanizm stanu relacji (obserwacja, nie dowód przyczyny):
- `syncRelationFromDeals` (`gra/src/main.ts:24708`–`24722`) ustawia `sojusz` tylko gdy w deals jest sojusz, `pokoj` tylko gdy jest pakt o nieagresji. **Brak gałęzi `else`:** gdy nie ma żadnej z umów, status nie jest czyszczony.
- W logu: SYNC t40 13-1 i SYNC t58 19-1 mają `statusPrzed=sojusz`, a stare umowy (t33) już nie są w deals. Relacja `sojusz` przetrwała zniknięcie umowy. To zgodne z kodem, ale nie wyjaśnia, dlaczego umowa zniknęła (pytanie #103 pozostaje otwarte).

## 2. Limit 2 sojuszy na cywilizację, tura po turze

Źródło reguły: limit `maxSojuszyNaCywilizacje`/`maxSojuszy` (`gra/src/game/ai-ai-alliance-limit.ts:36`, `:57`–`:62`; `gra/src/game/ai-ai-alliance-tick.ts:14`). Opis wspólnego limitu we wszystkich ścieżkach zawierania: `dyspozycje/WERSJE.md:223` (FALA 865).

Wartości licznika z wierszy `[ALLIANCE-PLAN]` (format `[civ, liczba sojuszy]`; wartości na początku tury T, przed podpisaniem umów w tej samej turze T, wnioskowane z zestawienia z SYNC t40 i t58):

| Para | Tura | Licznik civ | Zdarzenie |
|---|---|---|---|
| 1-13 | t39 | civ 1 = 2, civ 13 = 1 | 1-13 `_t33` i 1-19 `_t33` obecne |
| 1-13 | t40 | civ 1 = 1, civ 13 = 0 | okno: 1-13 `_t33` zniknęło, 1-13 `_t40` podpisane w t40 (SYNC) |
| 1-13 | t41 | civ 1 = 2, civ 13 = 1 | limit zachowany |
| 1-19 | t57 | civ 1 = 2, civ 19 = 1 | |
| 1-19 | t58 | civ 1 = 1, civ 19 = 0 | okno: 1-19 `_t33` zniknęło, 1-19 `_t58` podpisane w t58 (SYNC) |
| 1-19 | t59 | civ 1 = 2, civ 19 = 1 | limit zachowany |
| 10-19 | t64 | civ 10 = 0, civ 19 = 1 | 10-19 podpisane w t64 (SYNC) |
| 10-19 | t65 | civ 10 = 1, civ 19 = 2 | limit zachowany (2 na civ 19: 1-19 `_t58` + 10-19 `_t64`) |
| 1-13 | t65 | civ 1 = 2, civ 13 = 1 | 1-13 `_t40` obecne |
| 1-13 | t66 | civ 1 = 1, civ 13 = 0 | **utrata 1-13 `_t40` (zdarzenie ALLY66)**; 7-13 `_t66` podpisane w t66 (SYNC) |
| 7-13 | t67 | civ 7 = 1, civ 13 = 1 | limit zachowany |

Wniosek: w każdej turze z danych PLAN licznik nie przekracza 2. Każdy spadek do 1 odpowiada usunięciu jednej umowy i jest trwały tylko jedną turę, potem licznik wraca do 2 po podpisaniu nowej umowy. Nie znaleziono podwójnej umowy (licznik 3+).

Ograniczenie: PLAN jest snapshotem przed podpisaniem w danej turze, więc okno między snapshotami T−1 i T obejmuje moment usunięcia. Log nie zawiera momentu usunięcia w obrębie tury, więc kolejność w tej samej turze nie jest wykazana.

## 3. Pozostałe dane z ALLYPATH (do obserwacji, nie o podmianie)

W `runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/dane/seed4242-harder0.alliance-log.txt` (96 wierszy `[AA-REMOVE]`):

- `sojusz_aiai_1_16_t30` usunięty w t55 przez `odmowa-sojuszu-finalize` (linia 77). To jedyne usunięcie sojuszu AI↔AI w tym logu.
- `sojusz_siostry_40_41` usunięty w t55 przez `odmowa-sojuszu-finalize` (`zawarta=40`) i w t56 z `zawarta=55` (linie 83–84). Dwa usunięcia tego samego id w dwóch turach wymagają wyjaśnienia (duplikat hooka albo realne podwójne zawarcie). NIE ZMIERZONO.
- `sojusz_siostry_11_12` usunięty w t55 przez `eliminateOwner` (linia 78), poza zakresem tego tematu.

Rozbieżność harder: `seed4242-harder0.summary.json` ma `"harder": 0` dla logu z `[AA-REMOVE]`. Wpis „--harder 1” w `10-operator-claude.md` ALLYPATH dotyczy innego biegu (66 wierszy jsonl, bez `aa.log`). Nie ma sprzeczności w danych, był to błąd opisu.

## 4. Ograniczenia (NIE ZMIERZONO)

- Brak biegu z hakiem `[AA-REMOVE]` na bazie, w której para 1-13 lub 1-19 zawiera sojusz. ALLY66 był na bazie z innym stanem, ALLYPATH nie odtworzył podmiany.
- Brak sprawdzenia, czy `odmowa-sojuszu-finalize` działa na pary AI↔AI z 1-13/1-19 (pojedynczy przypadek, inna para).
- Brak zmierzonej kolejności zdarzeń wewnątrz tury (usunięcie vs. podpisanie).
- Mechanizm „relacja `sojusz` zostaje po zniknięciu umowy” (sekcja 1) potwierdzony w kodzie i logu, ale nie zmierzony jako przyczyna podmiany.

## 5. Kandydat na następny temat (dla orkiestratora, bez decyzji o grze)

Bieg seed 4242 (harder 0, ta sama baza co ALLYPATH) z hakiem `[AA-REMOVE]` i wpisem licznika sojuszy civ przy każdym `[ALLIANCE-SYNC]`, zakres t30–t70, wynik pod `dane/`. Pozwala rozstrzygnąć ścieżkę dla 1-13 i 1-19 oraz kolejność w turze. Pytanie ABC o grę nie jest potrzebne (pomiar, bez zmiany gry). Pytanie #103 (czy relacja `sojusz` ma być czyszczona po zniknięciu umowy) należy do właściciela wg zasad ABC, bo dotyczy mechaniki.
