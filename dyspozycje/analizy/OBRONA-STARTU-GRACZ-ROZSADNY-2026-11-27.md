# Obrona startu gracza „rozsądnego" — pomiar REALDEF, runda 2 (2026-11-27), obrona Operatora (runda 3)

Status: **BLOCK dla P1–P3** (P1 nie spełnia n ≥ 20 na ziarno i jest zniekształcony przez harness, patrz §5).
**P0 zmierzone** (kontrola bez wymuszonego fortu, 12 przebiegów). Inwentarz obrony startu: część punktów NIE ZMIERZONO (§3, §8).
Tag: R-WEB-EARLY-DEFENSE-REALISTIC-Q1, runda 2/5 (poprawki po FC r2 w tej samej rundzie). Baza kodu: `478e6795d` (origin/main).
Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `rust-port/`. Zmieniony tylko `gra/tools/realdef-live.cjs`.
Dane zbiorcze: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/` (JSONL, jeden wiersz na przebieg).

## 1. Pytanie

DEFEAT (`dyspozycje/analizy/PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md`): pasywny gracz na maksimum traci jedyne miasto
w 34/37 przebiegów (92%) w turach 8–15, z wymuszonym fortem. Pytanie rundy: czy utrata wynika z pasywności harnessu
(rozsądny gracz buduje jednostkę obronną realną komendą), czy z trudności startu. Odpowiedź w tej rundzie: **nierozstrzygnięta**
(P1 niewiarygodny), patrz §7.

## 2. Ustawienia (maksimum)

- Start: `__settingsLive.startNewGame` z parametrami maksimum: Trudny, dyplomacja „trudna”, Koszty jednostek Wysoki ×4,
  Wzrost ludności Wysoki, kultura „trudny”, barbarzyńcy **Trudny**, mapa Maly/Kontynenty, seed 4242 i 7.
- Readback: `__settingsLive.getSettings()` zapisany w linii `start` każdego przebiegu (pole `settingsReadback`).
- **Bez wymuszonego fortu** (`forceFortLive` nie jest używany, także w P0 — w odróżnieniu od DEFEAT).
- Bez hooków zmieniających stan: `__siegeBlockTestDebug.tryPurchase` (skarbiec 999999) NIE jest używany; `prepareEndTurnGate`
  (podnosi skarbiec) NIE jest używany. Bramka tury = tylko odczyt `gateInfo().canEnd`.
- Brak nowych haków w `gra/src`.

## 3. Inwentarz obrony startu (czego gracz realnie może użyć)

Źródło: panel miasta → zakładka „Jednostki do rekrutacji” (`button[aria-label="Jednostki do rekrutacji"]`), tura 1, seed 4242
(wiersz `recruit` w logu `realdef-p1-s4242-r1.txt`; **logi *.txt nie są commitowane**, więc ten wiersz nie jest weryfikowalny
z repo — traktować jako odnotowany w raporcie operatora, nie jako dowód w danych).

**(a) Czy w turze 1 można kupić jednostkę wojskową? NIE (wg odczytu panelu).** Lista pokazuje 4 jednostki wojskowe i 1 cywilną:

| Jednostka | Pieniądz (×4 Wysoki) | Drewno | Pula rekrutów | Wymóg technologii (`units.json`) | Stan w turze 1 (panel) |
|---|---|---|---|---|---|
| Oszczepnik | 12 | 13 | 2000 („2k”) | brak | wyłączona: Skarb 0, Drewno 0 |
| Łucznik | 12 | 13 | 2000 | Łucznictwo | wyłączona: Skarb 0, Drewno 0 |
| Wojownik | 20 | 13 | 2000 | brak | wyłączona: Skarb 0, Drewno 0 |
| Rydwan (woły) | 60 | 25 | 2000 | Koło | wyłączona: Skarb 0, Drewno 0 |
| Zwiadowca (cywilna) | 16 | — | — | — | nie jest jednostką obronną |

Koszt Pieniądz = baza z `units.json` × 4 (Wysoki): Oszczepnik 3×4, Łucznik 3×4, Wojownik 5×4, Rydwan 15×4; zgodne z wartościami
w wierszach panelu (12, 12, 20, 60, 16). Liczba „2000” to pula rekrutów z panelu; nie była mierzona poza turami 1–6.

**(b) Najwcześniejsza tura, w której Pieniądz pozwala na pierwszego obrońcę — dane z ekonomii BEZ otwartego panelu (P0, 12 przebiegów):**

| Miara (P0, 12 przebiegów) | Wynik |
|---|---|
| Przyrost Skarbu t2→t3 = +2 | 4/12 (seed 4242 r1; seed 7 r3, r5, r6) |
| Przyrost Skarbu t2→t3 = +1 | 8/12 (seed 4242 r2–r6; seed 7 r1, r2, r4) |
| Skarb ≥ 12 (Pieniądz na Oszczepnika) po raz pierwszy w turze 7 | 4/12 (seed 4242 r1; seed 7 r3, r5, r6) |
| Skarb ≥ 12 po raz pierwszy w turze 12 | 1/12 (seed 7 r4) |
| Skarb ≥ 12 do tury 20 | brak w 7/12 |
| Skarb < 12 do tury 6 | 12/12 (maksimum w turze 6 to 11) |

Tempo przyrostu jest **losowe per przebieg** (ten sam seed, różne tempo), a nie zależne od seeda: poprzednia wersja tego
dokumentu (+2 dla 4242, +1 dla 7) była błędna i jest wycofana.

Drewno (13 dla Oszczepnika) NIE ZMIERZONO w ekonomii bez panelu. Jedyny przebieg P1 z Pieniądzem ≥ 12 w turze 7 (seed 4242 r6)
miał 0 zakupów; czy zablokowało go Drewno, czy coś innego, NIE ZMIERZONO w commitowanych danych.

Czas produkcji jednostki po zakupie: NIE ZMIERZONO. Czy zlecenie jednostki bez spełnionego wymogu technologii jest w ogóle możliwe
(przyciski wyłączone z powodu skarbu/drewna): NIE ZMIERZONO.

**(c) Inne środki obrony w turach 1–20:**
- Mury kamienne (Murarstwo): Drewno 80 + Kamień 80, koszt budowy 35. W liście budowy w turze 1, ale Drewno i Kamień = 0 (odczyt panelu).
  Dochód Drewna i Kamienia w ekonomii bez panelu: NIE ZMIERZONO, więc „poza zasięgiem w turach 1–7” jest **NIE ZMIERZONO** (nie wniosek).
- Koszary (Wojskowość): Drewno 40 + Kamień 40. Ich wpływ na dostępność rekrutacji w turze 1–7: NIE ZMIERZONO.
- Fort: wymuszany tylko w DEFEAT (`forceFortLive`); realna ścieżka budowy fortu w tym runnerze NIE ZMIERZONA.
- Awans Zwiadowcy: NIE ZMIERZONO.

**(d) „Panel armii / generał”**: wg raportu r1 rekrutacja z panelu armii wymaga wybranego generała; gracz startuje tylko ze
Zwiadowcą. W tej rundzie NIE ZMIERZONO.

**Wniosek z inwentarza (ograniczony dowodem):** w turze 1 nie da się kupić żadnej jednostki wojskowej (panel). Pieniądz na
najtańszą jednostkę (12) nie jest osiągany przed turą 7 w żadnym przebiegu P0, a w 8/12 przebiegów nie jest osiągany przed turą 8.
Czy w turach 7–8 istnieje realny obrońca, zależy od Drewna (NIE ZMIERZONO) i czasu produkcji (NIE ZMIERZONO). Stwierdzenia
„nie ma środków obrony przed turą 8” **nie da się wyprowadzić z tych danych** i nie jest wnioskiem tego dokumentu.

## 4. Wyniki P0 (pasywny, bez fortu) — 12 przebiegów, 6 na seed, 20 tur

Dane: `dane/dane-r2-p0-p1.jsonl` (wiersze `polityka=p0`).

| Polityka | Seed | Przebiegi | Miasto utracone | Przeżycie po 20 turach | Tura utraty (wartości) | Zdobywca |
|---|---|---|---|---|---|---|
| P0 pasywny, bez fortu | 4242 | 6 | 6/6 | 0/6 | 8, 8, 8, 9, 9, 9 (mediana 8,5) | barbarzyńcy (owner −1) |
| P0 pasywny, bez fortu | 7 | 6 | 5/6 | 1/6 | 8, 9, 10, 13, 14 (1 przebieg do tury 20) | barbarzyńcy (owner −1) |
| **P0 razem** | — | **12** | **11/12** | **1/12** | mediana 9 | barbarzyńcy |

- Porównanie z DEFEAT r2 (z fortem): tabela 2×2, utrata/przeżycie: P0 **11 / 1** vs DEFEAT **34 / 3** (37 przebiegów).
  Test Fishera dwustronny: **p = 1,0** (obliczone ponownie, wynik potwierdzony). Brak różnicy: wymuszony fort nie zmienia
  wyniku pasywnego gracza.
- Tura utraty: w każdym z 24 wierszy JSONL zachodzi `tura_utraty = tury_ukonczone + 1` (sprawdzone na wszystkich wierszach,
  P0 i P1), więc definicja tury jest jednolita w danych.
- Metryka `barbarzyncy_w_poblizu_przy_utracie` = 0 we wszystkich wierszach P0 (pomiar po turze utraty, `foreignNear` r=3) —
  **metryka słaba, nie rozstrzyga**; metryka z początku tury utraty (`barbNearStartUtraty`) jest w runnerze od tej rundy,
  ale NIE ZMIERZONO w commitowanych danych (wiersze r2 jej nie mają).
- `turn-to-first-defender` w P0: null (brak jednostki wojskowej gracza, zgodnie z harnessem pasywnym).

## 5. Wyniki P1 (budowa jednostki obronnej realną ścieżką UI) — NIEWIARYGODNE, n < 20

Przebiegi P1 w danych: seed 4242 — **8** (r1–r8), seed 7 — **4** (r1–r4); łącznie **12**, czyli **nie spełnia n ≥ 20 na ziarno**.
Dodatkowo 4 przebiegi kontrolne w `dane/dane-r2-testy-kontrolne.jsonl` (r11–r13: warianty P1 bez części akcji; r22: P0 z opóźnieniem
1,6 s/turę). Testy kontrolne są oddzielone od P1 i nie są wliczane do n.

Wszystkie 12 przebiegów P1: 0 zakupów, utrata miasta przed bramką tury w turach 5–7, `zdobywca_owner = null` (oznaczone
`wiarygodny: false` w danych). Fisher P0 vs P1 (utrata/przeżycie) daje p = 1,0, ale **nie jest to wynik porównania**: P1 jest
zniekształcony przez harness (dowody niżej).

Dowody zniekształcenia:
1. **Utrata miasta z `owner = null`** (miasto zniknęło z listy miast, licznik tury w `gateInfo` wraca do 1) zamiast
   `owner = −1` (zdobyte przez barbarzyńców) jak w P0. Wygląda na reset stanu sesji, nie na zdobycie; przyczyna NIE ZMIERZONA.
2. **Czas rzeczywisty:** P1 dodaje ok. 1,6 s bezczynności na turę (1,2 s po otwarciu panelu, 0,4 s po zakładce). Przebieg kontrolny
   P0 z dodanym 1,6 s/turę (seed 7, r22) dał utratę miasta w turze 1 z `owner = null`, czyli opóźnienia czasowe same w sobie
   zmieniają wynik harnessu.
3. Panel miasta pozostaje otwarty przez całą grę (przycisk „Wróć na mapę” nie jest klikany, patrz §8). P1 więc nie odtwarza
   zachowania realnego gracza, który zamyka panel.

**Tezy wycofane z poprzedniej wersji tego dokumentu:**
- „Otwarcie panelu zmienia dochód z +2 na +1” — **obalone**. Przyrost +1 występuje w 8/12 przebiegów P0 bez panelu,
  a +2 w 2/12 przebiegów P1 z panelem (seed 4242 r6; seed 7 r4). Różnica jest rozkładem losowym per przebieg, nie efektem panelu.
  Kontrole r11 (+2) i r12 (+1) mieszczą się w tym samym rozkładzie.
- „Skarb +2/turę dla seed 4242, +1 dla seed 7” — **błędne**: patrz tabela w §3(b).

Wniosek: w tym harnessie P1 nie mierzy gry gracza. Nie wolno używać wyników P1 do decyzji o balansie. Dalsze biegi P1 w obecnym
harnessie nie dałyby dowodu (ten sam artefakt), więc n ≥ 20 NIE zostało zrealizowane w tej rundzie.

## 6. P2 i P3

- **P2 (bitwy rozstrzygane przez gracza): NIE ZMIERZONO.** Zależy od P1 (który nie jest wiarygodny). Runner klika wyłącznie
  `data-act="auto"` (auto-rozstrzygnięcie).
- **P3 (P1 + mury): NIE ZMIERZONO.** Mury wymagają 80 drewna i 80 kamienia; zasoby w turach 1–7 nie zostały zmierzone w ekonomii bez panelu.

## 7. Wnioski opisowe (z liczbami)

1. P0 bez fortu reprodukuje DEFEAT: 11/12 miast utraconych (92%), tury 8–14. Wymuszony fort nie wpływa na wynik (Fisher p = 1,0, tabela 11/1 vs 34/3).
2. W turze 1 gracz nie ma żadnej jednostki wojskowej do kupienia (panel: Skarb 0, Drewno 0).
3. Pieniądz na najtańszą jednostkę (12) jest osiągany w turze 7 w 4/12 przebiegów P0 i w turze 12 w 1/12; w 7/12 nie w ogóle do tury 20.
   Czas produkcji i Drewno NIE ZMIERZONO, więc nie wiadomo, czy pierwszy obrońca pojawia się przed utratą miasta w turach 8–14.
4. Odpowiedź na pytanie rundy (czy rozsądny gracz przeżywa 20 tur) **nie jest znana**: P1 nie jest wiarygodny (§5).
5. Ocena „za trudne”: nie oceniam (decyzja właściciela).

## 8. NIE ZMIERZONO (lista)

- P1 z n ≥ 20 na ziarno, bez zniekształcenia harnessu (przyczyna `owner = null` i zależności od czasu, §5).
- P2, P3.
- Czas produkcji jednostki; Drewno w ekonomii bez panelu; Pieniądz/Drewno przy zamkniętym panelu; wpływ podatku („Handel”) na Skarb.
- Czy zlecenie jednostki bez spełnionego wymogu (technologia, budynek) jest możliwe lub wyłączone (przyciski).
- Generał i panel armii (d) w tej rundzie. Awans Zwiadowcy. Fort (realna budowa).
- Mury i Koszary: wpływ na dostępność jednostek w turach 1–7.
- Przycisk „Wróć na mapę” (`civ-v-exit-map-btn`): w wersji pilotażowej runnera (z kliknięciem) stan gry kończył się bez miast;
  po usunięciu kliknięcia P1 nadal traci miasto wcześniej. Czy to błąd gry (stan sesji), czy artefakt haka — NIE ZMIERZONO.
  Zgłoszony defekt „klik przycisku niszczy stan” NIE ma repro w tej rundzie i NIE jest wyodrębniony jako osobny temat.
- Metryka barbarzyńców w pobliżu w turze utraty (liczba jednostek i siła): NIE ZMIERZONO; dane P0 mają 0 (metryka słaba).

## 9. Bramki

Wynik bramek na tym czubku pracy: patrz raport `30-obrona-claude.md` (surowe wyjścia z tej sesji). Kod gry nie został zmieniony.

## 10. Odchylenia od dispatchu

- P1 nie spełnia kryterium n ≥ 20 na ziarno (zrobiono 8 i 4; 12 łącznie). Powód: harness zniekształca P1 (§5); powtórki nie
  dałyby dowodu. **Nie jest to pomiar gracza.**
- P0: 6 przebiegów na seed (12 łącznie), zgodnie z dispatchem. (Poprzednia wersja pisała „12 przebiegów zamiast 6 na ziarno” — błąd, poprawiono.)
- Nie użyto `forceFortLive`, `__siegeBlockTestDebug.tryPurchase`, `prepareEndTurnGate`.
- Brak DECISION_REQUIRED: inwentarz nie dowodzi braku środków przed turą 8 (Drewno i czas produkcji NIE ZMIERZONO, §3).
  Stąd status BLOCK, nie DECISION_REQUIRED.
- Zarzut o niespójnej definicji tury: w danych zachodzi `tura_utraty = tury_ukonczone + 1` w 24/24 wierszach; w runnerze
  dodano pole `definicjaTury` i komentarz, a pole `wiarygodny` oznacza przebiegi z `owner = null`.

## 11. Pliki

- Runner: `gra/tools/realdef-live.cjs` (P0 i P1; P2/P3 nie zaimplementowane). Poprawka: `recruit-error` bez odwołania do
  nieistniejącej zmiennej `opened` (ReferenceError w HEAD, linia 207); pola `barbNearStartUtraty`, `definicjaTury`,
  `wiarygodny`, `powodNiewiarygodnosci` w wierszu wyniku.
- Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-r2-p0-p1.jsonl` (24 wiersze: P0 12, P1 12; P1 oznaczone
  `wiarygodny: false`), `dane-r2-testy-kontrolne.jsonl` (4 testy kontrolne).
- Raport operatora: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/10-operator-claude.md`; odpowiedź na zarzuty:
  `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/30-obrona-claude.md`.
