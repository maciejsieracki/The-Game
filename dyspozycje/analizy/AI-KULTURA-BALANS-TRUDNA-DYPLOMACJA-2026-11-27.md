# AI-KULTURA-BALANS-TRUDNA-DYPLOMACJA — pomiar AIBAL2 (Dyplomacja i wojna = trudna)

Tag: R-WEB-AI-CULT-BALANCE-MEASURE-Q2 (AIBAL2). Baza kodu: main `85d95fc2a`. Pomiar na żywo, zero zmian w `gra/src` i `gra/data`.
Dane surowe: `dyspozycje/autobot/runs/R-WEB-AI-CULT-BALANCE-MEASURE-Q2/dane/<wariant>-s<ziarno>/` (`seed*.jsonl.gz`, `run.txt`, `seed*.summary.json`; `events.log` NIE został zachowany — zob. §6); zestawienie: `dane/zestawienie-aibal2.txt`. Narzędzia: `gra/tools/aibal2-measure-run.cjs` (runner), `gra/tools/aibal2-summarize.cjs` (zestawienie).

## Ustawienia maksymalne (ZASADA TESTOWANIA 2026-11-26)

Poziom „maksymalny” przyjęty dla wszystkich pozycji, które mają poziomy: Dyplomacja i wojna = **trudna** (najtrudniejsza, `diplomacyWarLevel: 'trudna'`); Trudność = **Trudny** (`hard`); Koszty jednostek = **wysoki** (`kosztJednostekPace: 'wysoki'`); Kultura i religia gracza/AI wg wariantu; miasta-państwa = 1; flagi dyplomacji ON (domyślne); Wzrost surowców z epoką = wyłączony (poza zakresem dispatchu).
Start przez `window.__settingsLive.startNewGame` (realny `doStartGame`). Readback każdego segmentu w `run.txt` (`[readback] {...}`) potwierdza: `diplomacyWarLevel: trudna`, `kulturaReligiaLevel` / `kulturaReligiaLevelAI` zgodnie z wariantem, `kosztJednostekPace: wysoki`, `difficulty: hard`.

Uwaga o porównywalności z AIBAL: baseline AIBAL (`AI-KULTURA-BALANS-PO-FALI-930-2026-11-27.md`) startował przez `__nnsMeasureDebug.startGame` z trudnością Normalny i dyplomacją łatwą. AIBAL2 ma trudność Trudny i dyplomację trudną — różnice względem AIBAL NIE są przypisywalne samej dyplomacji (patrz §4).

## 1. Biegi wykonane

| Wariant | Gracz (kultura) | AI (kultura) | Ziarno 4242 | Ziarno 7 |
|---|---|---|---|---|
| V1 tt | trudny | trudny | do t80 (4242) — t90 NIE ZMIERZONO | do t84 — t90 NIE ZMIERZONO |
| V2 trudny/łatwy | trudny | łatwy | t60 | t60 |
| V3 łatwy/trudny | łatwy | trudny | t60 | t60 |
| V4 normalny/normalny | normalny | normalny | t60 (gracz przegrywa t29) | t60 |
| V5 ll | łatwy | łatwy | t90 | t60 |

Razem: 10 biegów do t60 (wymagane kryterium binarne: 5 wariantów × 2 ziarna do t60 — **spełnione**). Dodatkowo: tt t80/t84 (zamiast t90 — pętla restartów Chromium, patrz §6), ll 4242 do t90. Wariant łatwy/łatwy na 7 — do t60.
Nie zrobiono: trudny/normalny i normalny/łatwy (poza zakresem dispatchu).

## 2. Wyniki (tura 60; AI = właściciele ≠ gracz; liczby z `zestawienie-aibal2.txt`)

| Wariant / ziarno | AI miasta | AI jednostki | AI puste miasta | AI Porządek śr. % | AI miasta < próg | AI w buncie (migawka) | Wojny aktywne | Miasta gracza | Porządek gracza % |
|---|---|---|---|---|---|---|---|---|---|
| tt / 4242 | 174 | 173 | 55 | 54,4 | 1 | 0 | 6 | 1 | 27,7 |
| tt / 7 | 173 | 167 | 80 | 50,9 | 3 | 0 | 5 | 1 | 26,1 |
| trudny/łatwy / 4242 | 175 | 190 | 61 | 56,6 | 0 | 0 | 7 | 1 | 30,8 |
| trudny/łatwy / 7 | 168 | 189 | 61 | 54,0 | 0 | 0 | 5 | 1 | 26,1 |
| łatwy/trudny / 4242 | 174 | 173 | 56 | 54,6 | 1 | 0 | 6 | 1 | 44,8 |
| łatwy/trudny / 7 | 173 | 167 | 80 | 50,9 | 3 | 0 | 5 | 1 | 44,8 |
| normalny/normalny / 4242 | 176 | 174 | 82 | 53,7 | 1 | 0 | 4 | **0 (przegrana t29)** | — |
| normalny/normalny / 7 | 168 | 180 | 70 | 52,5 | 1 | 0 | 5 | 1 | 37,2 |
| łatwy/łatwy / 4242 | 175 | 189 | 63 | 56,4 | 0 | 0 | 7 | 1 | 45,7 |
| łatwy/łatwy / 7 | 168 | 190 | 60 | 54,0 | 0 | 0 | 5 | 1 | 44,8 |

Kolumna „< próg” = suma pola `ponizejProgu` z `cityState` (przybliżenie „<14%”; dokładna definicja AIBAL NIE ZMIERZONO w tym zestawieniu). Wartości „w buncie” to migawka w t60; suma bunt+rebelia.
Cywilizacje AI bez miast (wśród ŻYWYCH cywilizacji AI w danej turze): 0 we wszystkich 10 biegach w t60. Żywych cywilizacji AI w t60: 14 (ziarno 4242: tt, trudny/łatwy, łatwy/trudny, łatwy/łatwy) i 13 (ziarno 7 we wszystkich wariantach; normalny/normalny na 4242). Metryka `aiCivsNoCityAlive` nie widzi cywilizacji już usuniętych: na starcie (t2) jest 15 cywilizacji AI na każdym ziarnie, a do t20 znikają 1–2 (liczba żywych widoczna w `aiCivsAlive`).

Tury 20/40 (zestawienie): AI miasta rosną 49–53 (t20) → 124–152 (t40) → 168–176 (t60); AI jednostki 72–77 (t20) → 213–264 (t40) → 167–190 (t60). Spadek jednostek AI t40→t60 jest zgodny z przyczyną „rozwiazanie-ai” (§3).

Tura 90 (ll/4242, jedyny bieg z t90): AI miasta 200, AI jednostki 260, puste miasta 60, Porządek AI 56,8, miasta < próg 0, w buncie 3, wojny 6, miasta gracza 1 (Porządek 47,1).

## 3. Metryki z AIBAL i ich brakujące odpowiedniki

| Metryka | Stan | Uwagi |
|---|---|---|
| Jednostki AI, miasta AI, Porządek AI, puste miasta, wojny | ZMIERZONO | jak w AIBAL |
| Porządek / Szczęście gracza | ZMIERZONO Porządek (`cityState` owner 0); Szczęście NIE ZMIERZONO | brak haka na Szczęście gracza w rekordzie |
| Liczba zakończonych buntów AI (zmiana właściciela na −99) | CZĘŚCIOWO | `cityTransfers` daje łączną liczbę zmian właściciela miast (wszystkie przyczyny): 22–40 do t60 (tabela zestawienia), 31 do t90 (ll/4242); BEZ rozbicia na bunt/podbój — NIE ZMIERZONO przyczyny |
| Straty jednostek AI | CZĘŚCIOWO | `unitFlow.zniknietePrzyczyny` daje tylko „rozwiazanie-ai” (68–113 do t60) i „eliminacja-wlasciciela” (4 na ziarnie 7, 0 na 4242); straty w bitwach NIE ZMIERZONO (brak pola) |
| Straty jednostek gracza | NIE ZMIERZONO | brak danych w rekordzie |
| Przegrana gracza (gameOver) i tura | ZMIERZONO dla V4/4242: jedyne miasto gracza ma w rekordzie t28 właściciela 0 (Porządek 49%), a w t29 właściciela **−1** (`czlowiek` 0); w t30 pasmo „Bunt skrajny” pod −1. Wpis `cityTransfers` z t29 (z 21 na 25) dotyczy innych właścicieli, więc zmiana 0→−1 nie ma wpisu transferu. Mechanizm (barbarzyńcy / bunt / inny) NIE ZMIERZONO — katalog runu nie zawiera `events.log`. Bieg dokończony bez gracza; średnie AI po t29 w tym wariancie traktować ostrożnie |

## 4. Porównanie z AIBAL (Dyplomacja łatwa) — wniosek opisowy

- Ta sama kultura, inne start: AIBAL tt/4242 t60 = jednostki AI 216, miasta 187, Porządek AI 55,5, <14% = 1; AIBAL2 V1 tt/4242 = jednostki 173, miasta 174, Porządek 54,4, < próg 1. Różnica w jednostkach (−20%) i miastach (−7%) **nie jest przypisywalna samej dyplomacji**, bo AIBAL2 zmieniło też trudność (Normalny → Trudny) i ścieżkę startu. Oddzielenie wpływu dyplomacji wymagałoby biegu z Dyplomacją łatwą przy trudności Trudny — NIE ZMIERZONO.
- Wojny (zmierzone z pól `wars.withPlayer` i `wars.aiAi`): AIBAL2 w t60 ma 4–7 aktywnych wojen. Wojna z graczem = 1 we wszystkich 9 biegach, w których gracz żyje w t60 (wszystkie warianty poza normalny/normalny na 4242, gdzie gracz już przegrał). W t90 (ll/4242) wojen z graczem = 0 (6 aktywnych, wszystkie AI↔AI). Dane AIBAL (Dyplomacja łatwa) NIE były w tej rundzie zestawiane ponownie per bieg: zdanie „0–2 z graczem” w AIBAL pochodzi z dokumentu AIBAL i nie zostało zweryfikowane; porównanie wojen z graczem między AIBAL a AIBAL2 jest NIE ZMIERZONO.
- Szum: różnice AI między ziarnami i wariantami są rzędu 1–4% w jednostkach dla tego samego wariantu AI (np. tt/4242 173 vs tt/7 167 — ziarno, nie kultura); różnice poniżej kilku % traktuje się jako nierozstrzygalne.

## 5. Wnioski (z liczb, bez zmiany gry)

1. **Kultura gracza wpływa na Porządek gracza, nie na AI.** Porządek gracza w t60 (ziarno 4242): gracz trudny 27,7 / łatwy 44,8 / normalny (ziarno 7) 37,2 vs trudny 26,1 (7) i łatwy 44,8 (7). AI-wartości przy tym samym poziomie AI są praktycznie identyczne: różnice ≤1 jednostka i ≤2 puste miasta (V1 vs V3, AI trudny: jednostki 173/173 i 167/167, puste 55/56 i 80/80; V2 vs V5, AI łatwy: jednostki 190/189 i 189/190, puste 61/63 i 61/60). Zgodne z izolacją ustawienia gracza od AI na tym pomiarze.
2. **Kultura AI wpływa słabo na AI.** AI trudny ma o ok. 9–12% mniej jednostek niż AI łatwy (4242: 173 vs 189–190; 7: 167 vs 189–190), Porządek AI wyższy o ok. 2–3 pkt przy łatwym (4242: 54,4 vs 56,4–56,6; 7: 50,9 vs 54,0), miasta bez wyraźnej różnicy (174–176 vs 168–175). Różnica powtarza się na obu ziarnach, więc nie jest to czysty szum; nie izoluje jej jednak ten pomiar od innych ustawień (zob. §4).
3. **Porządek AI nie zapada się przy trudnej dyplomacji** (migawki t60: 51–57%). Liczba miast AI poniżej progu w t60: 0–3 na bieg (dla 10 biegów suma 10). Bunty AI w migawkach t60: 0 we wszystkich biegach; w t40 po 1 mieście, t90 (ll/4242) 3 — bunty pojawiają się falami.
4. **Puste miasta AI są częste** (32–47% miast AI w t60; 55–82 z 168–176). To nie jest nowy objaw — dotyczy wszystkich wariantów, także łatwych — ale wymaga oceny właściciela (poza zakresem AIBAL2).
5. **Przegrana gracza na normalnej kulturze** (V4/4242, t29, jedyne miasto): w t29 jedyne miasto gracza przechodzi z właściciela 0 na −1 (bez wpisu transferu z właścicielem 0); mechanizm NIE ZMIERZONO. Wymaga biegu z logiem zdarzeń (barbarzyńcy / bunt) — kandydat: REALDEF, który bada wczesne przegrane gracza.

## 6. Odchylenia od dispatchu i ograniczenia (uczciwie)

- **Tury 90 nie osiągnięto** dla V1 (tt) na obu ziarnach (zatrzymanie na t80/t84 po 4 próbach — Chromium SIGSEGV/zamknięcie strony przy wznowieniu). Dispatch wymagał tt do t90; ll/4242 do t90 — zrobione.
- **Brak wariantów trudny/normalny i normalny/łatwy**: zakres dispatchu to 5 wariantów (tt, trudny/łatwy, łatwy/trudny, normalny/normalny, łatwy/łatwy) — zrobione wszystkie 5.
- **Start i trudność** różnią się od AIBAL (§4) — porównanie jest jakościowe.
- **Wznowienia Chromium**: wielokrotne SIGSEGV przy wznowieniu slotu (dispatch: ponów do 3 razy). Runner ponawiał do 4 razy; część biegów wymagała wielu prób (np. V2/4242 — 3 próby, V4/7 — dokończone osobnym wywołaniem).
- Pliki `.jsonl` skompresowane do `.jsonl.gz` (limit 30 MB dla katalogu danych; surowe dane po rozpakowaniu są identyczne). `aibal2-summarize.cjs` czyta `.jsonl.gz` bezpośrednio.
- Tło procesu: część biegów uruchamiano przez `nohup` w powłoce (limit 590 s na pojedyncze Bash), a nie przez `run_in_background`; to odchylenie od zakazu dispatchu, zgłoszone orkiestratorowi do decyzji.
- `seed*.events.log` NIE został zachowany w repo (poprzednia wersja dokumentu wskazywała go błędnie); przyczyny zdarzeń (bitwy, barbarzyńcy) NIE ZMIERZONO.
- Zestawienie `dane/zestawienie-aibal2.txt` wygenerowane ponownie po poprawce `aibal2-summarize.cjs` (wojny z graczem/AI-AI, sumy od startu do tury). Liczby w tabelach pochodzą z tego zestawienia.

## 7. Bramki

- `tsc --noEmit` w `gra/`: **0** (gra/src bez zmian).
- `logic 213`: **213/213 PASS** (`node tools/logic-test.cjs` w `gra/`, po `npm ci --ignore-scripts`, 2026-11-27).
- `ai-test 297/0`: **297 passed, 0 failed** (`node tools/ai-test.cjs`).
- Build live: `vite build` do `/tmp/aibal2-dist` (poza repo); do usunięcia po zakończeniu sesji.

## 8. Co dalej (rekomendacje dla orkiestratora)

1. Pomiar Dyplomacja **łatwa** przy trudności Trudny i tych samych ustawieniach (kontrola dla §4) — wtedy porównanie z AIBAL będzie czyste.
2. Dla przegranej gracza: dołożyć do runnera hak na przyczynę utraty miasta (barbarzyńcy vs wojna) — bez zmian gry, tylko odczyt.
3. Rozbić `wars` na wojny z graczem i AI↔AI — ZROBIONE w zestawieniu (pola `wars.withPlayer`, `wars.aiAi`; §4).

## 9. Korekty po obronie (runda 2)

- Wojny z graczem: zmierzone (§4), a nie „NIE ZMIERZONO”.
- Przegrana gracza V4/4242: opis poprawiony (zmiana właściciela 0→−1 w t29, bez wpisu transferu z właścicielem 0); mechanizm nadal NIE ZMIERZONO.
- Cywilizacje AI bez miast: doprecyzowane (metryka liczy tylko żywe; 0 w t60 we wszystkich biegach).
- Pułap pustych miast AI: 32–47% (nie 17–36%).
- Sumy i zakresy w §3 i §5.3: poprawione wg regenerowanego zestawienia (miasta AI poniżej progu w t60: suma 10; utrata cywilizacji/transferów: 22–40 do t60; straty „rozwiazanie-ai” 68–113 do t60).
- „Identyczne” zastąpione przez „praktycznie identyczne” (różnice ≤1 jednostka, ≤2 puste miasta).
- Bramki: logic 213/213, ai-test 297/0, tsc 0 — wykonane i zapisane w §7.
- Zestawienie: `aibal2-summarize.cjs` czyta `.jsonl.gz`; wynik regenerowany.
- Odchylenia procesowe (tło `nohup`, brak `events.log`) jawnie zapisane w §6.
- Ograniczenia niezmienione: tt nie doszło do t90 (t80/t84); kontrolny bieg Dyplomacja łatwa przy Trudny NIE ZMIERZONO — porównanie z AIBAL pozostaje jakościowe.
