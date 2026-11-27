# Obrona startu gracza „rozsądnego" — pomiar REALDEF, runda 2 (2026-11-27)

Status: **BLOCK dla P1–P3** (pomiar P1 niewiarygodny w tym harnessie, patrz §4). **P0 zmierzone** (kontrola bez fortu).
Tag: R-WEB-EARLY-DEFENSE-REALISTIC-Q1, runda 2/5. Baza: `478e6795d` (REALDEF r2, origin/main).
Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `rust-port/`. Zmieniony tylko `gra/tools/realdef-live.cjs`.

## 1. Pytanie

DEFEAT (`dyspozycje/analizy/PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md`): pasywny gracz na maksimum traci jedyne miasto
w 34/37 przebiegów (92%) w turach 8–15, z wymuszonym fortem. Pytanie rundy: czy utrata wynika z pasywności harnessu
(rozsądny gracz buduje jednostkę obronną realną komendą), czy z trudności startu.

## 2. Ustawienia (maksimum)

- Start: `__settingsLive.startNewGame` z parametrami maksimum: Trudny, dyplomacja „trudna”, Koszty jednostek Wysoki ×4,
  Wzrost ludności Wysoki, kultura „trudny”, barbarzyńcy **Trudny**, mapa Maly/Kontynenty, seed 4242 i 7.
- Readback: `__settingsLive.getSettings()` zapisany w linii `start` każdego przebiegu (pole `settingsReadback` w logu).
- **Bez wymuszonego fortu** (`forceFortLive` nie jest używany, także w P0 — w odróżnieniu od DEFEAT).
- Bez hooków zmieniających stan (`__siegeBlockTestDebug.tryPurchase` NIE jest używany: ustawia skarbiec 999999).
  `prepareEndTurnGate` NIE jest używany (podnosi skarbiec do 5000). Bramka tury = tylko odczyt `gateInfo().canEnd`.

## 3. Inwentarz obrony startu (czego gracz realnie może użyć)

Pomiar w żywej grze, panel miasta → zakładka „Jednostki do rekrutacji” (`button[aria-label="Jednostki do rekrutacji"]`),
tura 1, seed 4242 (dane: log `realdef-p1-s4242-r1.txt`, wiersz `recruit`).

**(a) Czy w turze 1 można kupić jednostkę wojskową? NIE.** Lista pokazuje 4 jednostki wojskowe i 1 cywilną:

| Jednostka | Pieniądz (×4 Wysoki) | Drewno | Pula rekrutów | Wymóg technologii (dane) | Stan w turze 1 |
|---|---|---|---|---|---|
| Oszczepnik | 12 | 13 | 2000 („2k”) | brak | wyłączona: Skarb 0, Drewno (brak) |
| Łucznik | 12 | 13 | 2000 | Łucznictwo | wyłączona: Skarb 0, Drewno (brak) |
| Wojownik | 20 | 13 | 2000 | brak | wyłączona: Skarb 0, Drewno (brak) |
| Rydwan (woły) | 60 | 25 | 2000 | Koło | wyłączona: Skarb 0, Drewno (brak) |
| Zwiadowca (cywilna) | 16 | — | — | — | nie jest jednostką obronną |

„Rekruci: dostępne 2000” w turach 1–6 (przebiegi P1), potem 0 w turze utraty (§5). Koszt Pieniądz = baza z `units.json` × 4
(Wysoki): Oszczepnik 3×4, Łucznik 3×4, Wojownik 5×4, Rydwan 15×4. Zgodne z wartościami w wierszach panelu (12, 12, 20, 60, 16).

**(b) Najwcześniejsza tura, w której gracz może mieć pierwszego obrońcę** — NIE ZMIERZONO wprost (P1 zniekształcone).
Dane pośrednie z ekonomii **bez otwartego panelu** (przebiegi P0, bez akcji gracza):
- Skarb rośnie +2/turę (seed 4242: 3, 5, 7, 9, 11, **13** w turach 2–7) → **12 Pieniądz osiągane w turze 7**.
- Seed 7 (P0): Skarb +1/turę (2…8) → 12 osiągane w turze 11–12.
- Drewno 13 i pula 2000: stan w P0 NIE ZMIERZONO (wiersze panelu z P1 pokazują „Drewno (brak)” w turach 1–2 i brak
  „(brak)” od tury 3 przy panelu otwartym).
- Czas produkcji jednostki po zakupie: NIE ZMIERZONO.
- Porównanie: miasto gracza w P0 ginie w turach **8–9** (seed 4242) i **8–14** (seed 7).
  Czyli pierwszy kupowalny Oszczepnik pojawia się na granicy okna utraty (seed 4242) lub po jego zamknięciu (seed 7 w części przebiegów),
  zanim doliczony zostanie czas produkcji. Ten wniosek wymaga pomiaru P1 w czystym harnessie.

**(c) Inne środki obrony w turach 1–20** (dane z listy „DOSTĘPNE DO BUDOWY” w turze 1, `buildings.json`):
- Mury kamienne (epoka 1, tech Murarstwo): Drewno 80 + Kamień 80, koszt budowy 35. W liście budowy w turze 1, ale Drewno i Kamień = 0.
- Koszary (epoka 2, tech Wojskowość): Drewno 40 + Kamień 40. Nie są wymagane do wyświetlenia listy rekrutacji (lista jednostek działa bez nich w turze 1).
- Fort: wymuszany tylko w DEFEAT (`forceFortLive`), realna ścieżka budowy fortu NIE ZMIERZONA.
- Awans Zwiadowcy: NIE ZMIERZONO.

**(d) „Panel armii / generał”**: wg raportu r1 rekrutacja z panelu armii wymaga wybranego generała, a gracz startuje tylko ze
Zwiadowcą. W tej rundzie NIE ZMIERZONO ponownie (poza zakresem zmian w tej rundzie).

**Wniosek z inwentarza (opisowy):** w turze 1 nie da się kupić ŻADNEJ jednostki wojskowej (Skarb 0, Drewno 0).
Najtańsza (Oszczepnik) staje się kupowalna dopiero, gdy Skarb osiągnie 12, co w ekonomii bez panelu następuje w turze 7 (seed 4242)
lub później (seed 7). Mury i Koszary wymagają 80/40 drewna i kamienia — poza zasięgiem w pierwszych tygodniach (wg danych turowych).
Ocena „za trudne”: NIE — decyzja właściciela. Wniosek do decyzji: zobacz §6.

## 4. Wyniki P0 (pasywny, bez fortu) — 12 przebiegów, 20 tur

Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-r2-p0-p1.jsonl` (wiersze `polityka=p0`).

| Polityka | Seed | Przebiegi | Miasto utracone | Przeżycie po 20 turach | Tura utraty (wartości) | Zdobywca |
|---|---|---|---|---|---|---|
| P0 pasywny, bez fortu | 4242 | 6 | 6/6 (100%) | 0% | 8, 8, 8, 9, 9, 9 (mediana 8,5) | barbarzyńcy (owner −1) |
| P0 pasywny, bez fortu | 7 | 6 | 5/6 (83%) | 17% | 8, 9, 10, 13, 14 (+1 przeżyła do t20) | barbarzyńcy (owner −1) |
| **P0 razem** | — | **12** | **11/12 (92%)** | **8%** | mediana 9 | barbarzyńcy |

- Porównanie z DEFEAT r2 (z fortem, 34/37): test Fishera dwustronny **p = 1,0** — brak różnicy. Usunięcie wymuszonego fortu
  nie zmienia wyniku pasywnego gracza. Wynik DEFEAT (92%) jest reprodukowany bez fortu.
- Poprzednia kontrola r1 (z fortem, 39/40) — odtworzona w tendencji, nie cytowana jako dowód tej rundy.
- Metryka „barbarzyńcy w pobliżu w turze utraty” (`barbNearAtLoss`): 0 w danych P0 (pole zapisane przez `cityThreatProbe`,
  `foreignNear` w promieniu 3) — słaba metryka, nie rozstrzyga.
- Metryka „turn-to-first-defender” w P0: null (brak jednostki wojskowej w tych przebiegach, zgodnie z definicją).

## 5. Wyniki P1 (budowa jednostki obronnej realną ścieżką UI) — NIEWIARYGODNE, NIE ZMIERZONO

Przebiegi P1: seed 4242 — 8 (runy 1–8), seed 7 — 4 (runy 1–4). Wszystkie: 0 zakupów, utrata miasta przed bramką tury
w turach 5–7 (`wynik=przegrana-miasto`, `zdobywca_owner=null`). Fisher P0 vs P1 (utrata/przeżycie): p = 1,0 — ale **nie jest to wynik
porównania**, bo P1 jest zniekształcony przez harness (poniżej). Wniosek „P1 = P0” NIE jest wiarygodny.

Dowody zniekształcenia (wszystkie w logach `realdef-*-r*.txt`):
1. **Ekonomia zmienia się przy otwartym panelu miasta.** Seed 4242: P0 Skarb +2/turę (3,5,7,9,11,13), P1 +1/turę (2,3,4,5,6,7).
   Linie `[Ekonomia] Tura 2`: P0 `¤=3 Praca=3`, P1 `¤=2 Praca=2`. Przy wyłączonym panelu i zakładce (runa r13) ekonomia wraca do P0 (`¤=3 Praca=3`),
   ale utrata miasta w r13 i tak nastąpiła w turze 7 z `owner=null`.
2. **Utrata miasta z `owner=null`** (miasto zniknęło z listy miast, licznik tury w `gateInfo` wraca do 1) zamiast
   `owner=-1` (zdobyte przez barbarzyńców) jak w P0. To wygląda na reset stanu sesji, nie na zdobycie.
3. **Czas rzeczywisty:** P1 dodaje ok. 1,6 s bezczynności na turę (1,2 s po otwarciu panelu, 0,4 s po zakładce). Test kontrolny
   P0 z dodanym 1,6 s/turę (seed 7, run 22) dał utratę miasta **w turze 1** z `owner=null` — czyli opóźnienia czasowe same w sobie
   zmieniają wynik harnessu. Test z runem 21 nie zwrócił wyniku (brak wiersza `result`).

Wniosek: w tym harnessie P1 nie mierzy gry gracza. Przyczyna NIE ZMIERZONA (możliwy reset stanu zależny od czasu lub efekt
otwarcia panelu — nie ustalone, patrz UWAGI-DLA-ORKIESTRATORA w raporcie). Do decyzji o balansie nie wolno używać wyników P1.

## 6. P2 i P3

- **P2 (bitwy rozstrzygane przez gracza): NIE ZMIERZONO.** Zależy od P1; runner klika wyłącznie `data-act="auto"`.
- **P3 (P1 + mury): NIE ZMIERZONO.** Mury wymagają 80 drewna i 80 kamienia; w turach 1–7 zasobów brak (dane z panelu i z Skarbu).

## 7. Wnioski opisowe (z liczbami)

1. P0 bez fortu reprodukuje DEFEAT: 11/12 miast utraconych (92%), tury 8–14. Wymuszony fort nie wpływa na wynik (p = 1,0).
2. Gracz nie ma w turze 1 żadnej jednostki wojskowej do kupienia (Skarb 0 z 12–60, Drewno 0 z 13–25).
3. Najtańsza jednostka (Oszczepnik, 12 Pieniądz, 13 Drewna, bez technologii) staje się opłacalna przy Skarbie +2/turę w turze 7 (seed 4242),
   czyli na granicy okna utraty miasta (turach 8–9 w P0 seed 4242). Dla seed 7 (Skarb +1/turę) — po turze 11, po większości utrat.
4. Czas produkcji jednostki po zakupie, drewno w ekonomii bez panelu i realne szanse obrony przed turą 8 — NIE ZMIERZONO (P1 zniekształcony).
5. Ocena „za trudne” — decyzja właściciela, nie oceniam.

## 8. NIE ZMIERZONO (lista)

- P1 (wiarygodny pomiar) — harness zniekształca ekonomię i moment utraty (§5).
- P2, P3.
- Czas produkcji jednostki; zasoby drewna w ekonomii bez panelu; wpływ podatku (sliderów „Handel”) na Skarb.
- Generał i panel armii (d) w tej rundzie.
- Przycisk „Wróć na mapę” (`civ-v-exit-map-btn`) w panelu miasta: w wersji pilotażowej runnera (z kliknięciem) stan gry
  kończył się bez miast (`cities = []`). Po usunięciu kliknięcia P1 nadal traci miasto wcześniej (§5). Czy to błąd gry,
  czy artefakt haka — NIE ZMIERZONO.

## 9. Bramki

- `tsc --noEmit -p tsconfig.json` (w `gra/`): **exit 0**, brak błędów.
- `node tools/logic-test.cjs`: **LOGIC OK (213/213)**.
- `node tools/ai-test.cjs`: **297 passed, 0 failed**.
- Kod gry nie został zmieniony w tej rundzie (zmiana tylko w `gra/tools/realdef-live.cjs` i dokumentacji),
  bramki uruchomione na bazie `478e6795d`.

## 10. Odchylenia od dispatchu

- P1 nie spełnia kryterium ≥20 przebiegów na ziarno (zrobiono 8 i 4) — powód: wyniki zniekształcone, dalsze runy nie dałyby wiarygodnego pomiaru.
- P0 zmierzone bez fortu (12 przebiegów zamiast 6 na ziarno): 6 na ziarno, zgodnie z dispatchem.
- Nie użyto `forceFortLive`, `__siegeBlockTestDebug.tryPurchase`, `prepareEndTurnGate` (dispatch r2, pkt 1).
- Fisher: porównanie P0 (bez fortu) vs DEFEAT r2 (z fortem) — p = 1,0. P0 vs P1: p = 1,0, bez znaczenia (§5).

## 11. Pliki

- Runner: `gra/tools/realdef-live.cjs` (P0 i P1; P2/P3 nie zaimplementowane).
- Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-r2-p0-p1.jsonl` (24 wiersze: P0 12, P1 12),
  `dane-r2-testy-kontrolne.jsonl` (4 testy kontrolne: r11–r13 bez panelu/zakładki, r22 z 1,6 s/turę).
- Raport: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/10-operator-claude.md`.
