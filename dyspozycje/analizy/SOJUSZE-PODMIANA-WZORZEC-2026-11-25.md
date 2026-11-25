# Podmiana sojuszy AI↔AI (1-13 t33→t40, 1-19 t33→t58) — ścieżka usunięcia i limit 2 (R-WEB-ALLIANCE-REPLACE-PATTERN-Q1)

Data: 2026-11-25 · Baza kodu: origin/main 8707b063b (= ALLYPATH) · Runda 1/5 · Operator HAIKU 5.5 · Zero zmian w gra/src i gra/data.

## Wynik w skrócie

- Wzorzec podmiany (umowa `sojusz_aiai_<a>_<b>_t<T1>` znika, ta sama para podpisuje `sojusz_aiai_<a>_<b>_t<T2>`) **widać w logu ALLY66** (`runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt`), ale **log nie zawiera ścieżki usunięcia**: linie `[AA-REMOVE]` nie istnieją w tym logu (użyty był przed instrumentacją ALLYPATH; 67 linii `[ALLIANCE-SYNC]` i 63 `[ALLIANCE-PLAN]`, zero `AA-REMOVE`).
- ALLYPATH (baza 8f7b4981f, seed 4242, harder 0, t2–67) **nie odtworzył** podmiany pary 1-13 ani 1-19 (zero sojuszu tych par; patrz analiza ZNIKANIE-SOJUSZY-AI-2026-11-25.md). Dlatego dla żadnej z podmian nie da się wskazać ścieżki usunięcia z danych pomiarowych.
- Klasyfikacja: **NIE ZMIERZONO** (dla obu podmian i dla limitu tura po turze). Nie stwierdzono ŁAMANIA REGUŁY. Brak kandydata R-WEB-* z minimalnym odtworzeniem na tym etapie (bez dowodu, że reguła jest łamana).
- Wniosek strukturalny z kodu (ZGODNE z kodem, nie zweryfikowane biegiem): sojusz AI↔AI jest bezterminowy (`wygasaTura = null`), więc ścieżka `expireTreaties` (`wygasaTura <= tura`) **nie może** usunąć sojuszu. Kandydaci usunięcia podmiany to pozostałe ścieżki z listy ALLYPATH, a najbardziej prawdopodobny z nich w kontekście dopłaty D to `platnosc-broken-tickDiplomacyPayments` (patrz niżej). To hipoteza, nie wynik.

## 1. Ścieżka usunięcia dla podmian (klasyfikacja)

| Podmiana | Log ALLY66 (dowód) | Ścieżka usunięcia | Status |
|---|---|---|---|
| 1-13: `sojusz_aiai_1_13_t33` → `_t40` | t33: deal `sojusz_aiai_1_13_t33` (`statusPrzed=neutralni`); t40: deal `sojusz_aiai_1_13_t40` (`statusPrzed=sojusz`), t33 już nieobecny. Brak SYNC między t33 a t40 dla pary. | NIE ZMIERZONO (brak `[AA-REMOVE]` w logu). Kandydaci z listy ALLYPATH: `gra/src/main.ts:24644` zerwanie-dobrowolne, `:25662` wojna-breakTreatiesOnWar, `:22806` odmowa-obowiazku, `:26224` odmowa-sojuszu-finalize, `:26678` platnosc-broken, `:40244` eliminateOwner. `:26615` wygasniecie-expireTreaties odpada (sojusz `wygasaTura=null`, `ai-ai-alliance-tick.ts` linia 19). | NIE ZMIERZONO |
| 1-19: `sojusz_aiai_1_19_t33` → `_t58` | t33 deal obecny; t38 i t53 obecny (`statusPrzed=sojusz`); t58: deal `sojusz_aiai_1_19_t58`, `t33` nieobecny. Usunięcie w oknie t54–t58 (brak SYNC w oknie). | NIE ZMIERZONO, te same kandydaci | NIE ZMIERZONO |

Uwaga o hipotezie płatności: `ai-ai-alliance-tick.ts` (linia 19) mówi, że przy akceptacji sojuszu dopłata D idzie ZŁOTEM z płatnika, a skarbiec płatnika nie schodzi poniżej zera. Jeśli płatność nie może być zrealizowana, `tickDiplomacyPayments` zwraca `broken` i `main.ts:26678` usuwa umowę (`removeTreatiesById`). To mogłoby dać usunięcie sojuszu bez zerwania przez właściciela, a potem ponowne zawarcie przez tor `tickAiAiAllianceRequests`, gdy para znów jest „neutralna”. To jest **hipoteza do sprawdzenia biegiem z hakiem `[AA-REMOVE]`**, nie ustalenie.

Reguła do cytowania: w kodzie `expireTreaties` działa tylko dla `wygasaTura` niepustego (zostają `wygasaTura === null || wygasaTura > tura`). Zgodność podmian z regułami przewodnika/rejestru nie była sprawdzana w tej rundzie (nie czytałem rejestru reguł); stąd NIE ZMIERZONO.

## 2. Limit 2 sojuszy na cywilizację, tura po turze

Dane z logu ALLY66 (tylko wiersze `[ALLIANCE-SYNC]`, które pokazują obecne traktaty na wybranej parze w danej turze):

- t33: civ 1 ma sojusze z 19 (`sojusz_aiai_1_19_t33`) i z 13 (`sojusz_aiai_1_13_t33`) → 2 sojusze, limit spełniony.
- t33–t40: w logu brak wpisu o tym, czy `sojusz_aiai_1_13_t33` zniknął przed zawarciem `_t40`. Okno bez umowy albo podwójna umowa: **NIE ZMIERZONO** (SYNC nie pokrywa tury po turze).
- t40–t53: civ 1 ma 1-13 (`_t40`, obecny w t43, t58) i 1-19 (`_t33`, obecny w t38, t53) → 2, limit spełniony w synchronizowanych turach.
- t54–t58: 1-19 zmienia umowę na `_t58`. Okno: NIE ZMIERZONO.
- t64 `sojusz_aiai_10_19_t64`: civ 19 ma wtedy 1-19 (`_t58`, zakładając obecność po t58, NIE SYNC-weryfikowane po t58) + 10-19 = 2. Civ 10 ma tylko 10-19.
- t66 `sojusz_aiai_7_13_t66`: civ 13 ma 1-13 (`_t40`, NIE SYNC-weryfikowane po t58) + 7-13 = 2.

Wniosek: w synchronizowanych turach limit 2 nie jest przekroczony; zachowania w oknach między SYNC (w tym moment podmiany) nie da się rozstrzygnąć z tego logu. Dowód tura po turze wymaga logu z hakiem na każdej turze (`[AA-REMOVE]` + licznik sojuszy na civ przy zawarciu i usunięciu).

## 3. Pozostałe dane z ALLYPATH (do obserwacji, nie o podmianie)

W `runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/dane/seed4242-harder0.alliance-log.txt` (96 wierszy `[AA-REMOVE]`):

- `sojusz_siostry_40_41` (`zawarta=40`) usunięty przez `odmowa-sojuszu-finalize` w t55, a w t56 `[AA-REMOVE]` pokazuje to samo id z `zawarta=55`, czyli sojusz został ponownie zawarty w t55 i usunięty w t56. Dwa usunięcia tego samego id w dwóch turach wymagają wyjaśnienia (możliwe: wpis duplikowany przez hak albo realne podwójne zawarcie). NIE ZMIERZONO.
- `sojusz_siostry_11_12` usunięty w t55 przez `eliminateOwner` (zawarta=40). Poza zakresem tego tematu.

## 4. Ograniczenia (NIE ZMIERZONO)

- Brak biegu z hakiem `[AA-REMOVE]` na bazie, w której para 1-13 lub 1-19 zawiera sojusz (ALLY66 był na bazie b610e71a wg dispatchu; baza ALLYPATH to 8f7b4981f, bez tych zdarzeń).
- Brak sprawdzenia, czy `tickDiplomacyPayments` rzeczywiście zrywa sojusze z dopłatą D (hipoteza z punktu 1).
- Nie czytałem rejestru reguł ani przewodnika w tej rundzie; klasyfikacja ZGODNE/ŁAMIE wymaga cytatu reguły.

## 5. Kandydat na następny temat (dla orkiestratora, bez decyzji o grze)

Bieg seed 4242 (harder 0, ta sama baza co ALLY66) z hakiem `[AA-REMOVE]` i z wpisem licznika sojuszy civ przy każdej zmianie traktatu, t30–t70, zapis wyniku pod `dane/`. Pozwala sprawdzić hipotezę płatności i rozstrzygnąć okno z punktu 2. Pytanie ABC o decyzję gry nie jest potrzebne (pomiar, bez zmiany gry).
