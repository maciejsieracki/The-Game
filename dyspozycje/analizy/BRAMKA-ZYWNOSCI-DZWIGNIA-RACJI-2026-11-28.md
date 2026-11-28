# Bramka żywności: dźwignia „obniżka racji żywności” (ENDGATELEVER, R-WEB-ENDGATE-RATION-LEVER-Q1)

**Data:** 2026-11-28 · **Baza:** c834d3eb8 (origin/main) · **Operator:** runda 1/5 (Haiku 5.5)
**Stan wiążący:** TAK, POTWIERDZONY NA ŻYWO (runda 2, sekcja 8): w bazie c834d3eb8 komunikat bramki obiecuje „obniżkę racji żywności: +12”, której suwak nie wykona (min = max = 0). Naprawa minimalna w `gra/src/main.ts` (wyliczenie `extra.suwakZywnosc`, jedna linia), test wiązania z mutacją czerwoną/zieloną. Brak deployu i brak pushu (bramka orkiestratora).

Runda 1 (Operator) opierała wynik na kodzie i danych r3. Runda 2 (obrona) odtworzyła błąd na żywo (sekcja 8: ziarno 11, t16, maksimum); pozycje oznaczone poniżej „NIE ZMIERZONO” nadal nie są zmierzone.

## 1. Skąd bierze się „obniżka racji +12”

| Krok | Miejsce | Co liczy |
|---|---|---|
| Baza prognozy gracza | `gra/src/main.ts` ok. l.23732 (`_nnsHumanForecast`) | prognoza po turze na zapisanych racjach |
| Reakcja automatu (Auto-Żywienie + clamp do limitu Spichlerza) | `gra/src/main.ts` ok. l.23909–24013 (`_nnsAutoSpichlerzDelta`) | `fAuto.spichlerzPo − _nnsHumanForecast.spichlerzPo`, po obniżeniu racji miast do `maxSafePoziomRacjiForCity` (clamp dla WSZYSTKICH miast gracza) |
| Dźwignia racji (przed poprawką) | `gra/src/main.ts` l.24071 | `fZero.spichlerzPo − _nnsHumanForecast.spichlerzPo`, gdzie `fZero` = projekcja z racjami wszystkich miast = 0 (tylko gdy któreś miasto ma `poziomRacji !== 0`) |
| Przekazanie do bramki | `gra/src/main.ts` ok. l.43632 (`suwakZywnosc: _nnsRacjeZysk`) | `decideEndTurnGate(live, …, levers)` |
| Dźwignia w komunikacie | `gra/src/game/no-negative-stocks.ts` l.227–231 (`buildAiLevers`), l.486 (`decideEndTurnGate`, `id: 'suwak-zywnosc'`), l.594 (`OPIS_DZWIGNI_ID`: „obniżka racji żywności”) | `zysk = extra.suwakZywnosc` gdy > 0 |

Wartość `zysk` (`extra.suwakZywnosc`) jest więc różnicą spichlerza między „racje = 0” a „baza bez korekty automatu”.

**Kiedy może być > 0 mimo suwaka na minimum:** suwak miasta ma `min = 0` i `max = maxSafe / krok` (`gra/src/ui/cityPanel.ts` ok. l.5611–5630). Gdy `maxSafe = 0` (deficyt Spichlerza), suwak jest zablokowany na 0 i pokazuje `min(poziomRacji, maxSafe)`. Stored `poziomRacji` może wtedy nadal wynosić > 0 (np. 1,5) — wyświetlane 0, a rzeczywiste racje obniża dopiero clamp (live przy otwarciu panelu albo na koniec tury). Dźwignia `fZero` widzi tę różnicę jako zysk, choć gracz suwakiem nie może jej wykonać.

## 2. Podwójne liczenie (mechanizm błędu)

Bramka liczy prognozę PO automacie (`pPoAutomacie.spichlerzPo = extra.automat.spichlerzPo`, `no-negative-stocks.ts` ok. l.446–452), a potem dodaje dźwignię racji mierzoną od prognozy PRZED automatem. Ten sam zysk (obniżenie racji do limitu) trafia więc do bilansu dwa razy: raz w prognozie po automacie, raz jako dźwignia „obniżka racji”. Komunikat bramki obiecuje wtedy +12, które już jest w prognozie (automat je wykonał) albo którego gracz nie może wykonać (suwak zablokowany).

Zgodność z dokumentacją kodu: komentarz `decideEndTurnGate` mówi „NAJPIERW automat zarządzania przetwarza turę … DOPIERO wynik po automacie jest oceniany”, a `NnsEndTurnLevers.automat` — „prognoza PO reakcji automatu zarządzania (Dodatek 3: najpierw automat, potem gracz)”. Dźwignia gracza powinna więc być mierzona od prognozy po automacie. Obecna baza tego nie robi.

## 3. Dowód (częściowy)

- **Test wiązania (deterministyczny):** `gra/tools/endgate-lever-baseline-test.cjs` — 5/5 zielone po poprawce; mutacja (cofnięcie bazy do `_nnsHumanForecast.spichlerzPo`) → 3 FAIL (a, b, c), 2/5 zielone. Przywrócenie → 5/5.
- **Dane z pomiaru (NIE ZMIERZONO ponownie):** w OKNO-LASKI-15-TUR-SKUTKI-2026-11-27 (r3, t16, ziarno 11): dźwignia „obniżka racji +12”; po otwarciu panelu miasta poziom racji 1,5 → 0 i prognoza Spichlerza −30 → −18 (zmiana +12 = ta sama wielkość co dźwignia). To zgadza się z hipotezą: zysk racji zostaje zrealizowany przez automat/clamp, a bramka pokazuje go jako dodatkową dźwignię.
- Konkretne wartości w biegu (runda 2, sekcja 8): dźwignia `_nnsRacjeZysk` = 12 w bazie, prognoza −30 → −18 po przycięciu racji 1,5 → 0. Wartość `_nnsAutoSpichlerzDelta` nie jest logowana wprost; wynika z różnicy prognoz (+12).

## 4. Naprawa (minimalna, jedno miejsce)

`gra/src/main.ts` l.24071 (miejsce wyliczenia `extra.suwakZywnosc`):

```ts
_nnsRacjeZysk = Math.max(0, fZero.spichlerzPo - (_nnsHumanForecast.spichlerzPo + (_nnsAutoSpichlerzDelta ?? 0)));
```

Baza dźwigni = prognoza PO reakcji automatu (ta sama baza co `automat.spichlerzPo` w bramce). Gdy automat już obniżył racje do limitu, `fZero` ≈ prognoza po automacie i dźwignia wynosi 0 — suwak-zywnosc znika z komunikatu. Gdy automat nie ruszył racji (`_nnsAutoSpichlerzDelta` undefined), zachowanie jest identyczne jak wcześniej. Uzasadnienie zakresu: jedyna zmiana w `gra/src/main.ts` to ta linia z komentarzem; `no-negative-stocks.ts` bez zmian (logika bramki poprawna przy poprawnej bazie).

Zmiana NIE dotyka balansu, reguł utrzymania ani pytania Q42.

## 5. Bramki (surowe wyjście, ten worktree, po poprawce)

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` | exit 0 |
| logic-test | LOGIC OK (213/213) |
| ai-test | 297 passed, 0 failed |
| early-grace-15-test | 33 passed, 0 failed |
| no-negative-stocks-end-turn-gate-levers-test | 34 passed, 0 failed |
| no-negative-stocks-c2-test | 44 passed, 0 failed |
| no-negative-stocks-ai-test | 8 passed, 0 failed |
| no-negative-stocks-ai-from-turn1-test | 27 passed, 0 failed |
| no-negative-stocks-ai-t2-test | 11 passed, 0 failed |
| no-negative-stocks-projection-test | 49 passed, 0 failed |
| no-negative-stocks-test | 25 passed, 0 failed |
| end-turn-gate-projection-only-test | 49 passed, 0 failed |
| no-negative-stocks-endturn-test | 18 passed, **1 failed** — (f) `canPlayerInitiateEndTurn` … ; TĘ SAMĄ porażkę daje baza c834d3eb8 przed zmianą (PRE-EXISTING, nie z tej poprawki) |
| no-negative-stocks-ai-t2-behavior-test, no-negative-stocks-c3-turn-test | NIE WYKONANO: wymagają bundla `--dist` (build wykluczony regułami) |
| tech-tree-test | 20 pass, 0 fail |
| research-test | ALL GREEN |
| unit-replace-test | WSZYSTKIE TESTY ZIELONE (21/21) |
| combat-test | All sanity checks passed. |
| endgate-lever-baseline-test (nowy) | 5 passed, 0 failed; mutacja 2/5 (czerwona), przywrócona 5/5 |

## 6. Zakres i nieobjęte

- ZMIERZONE na żywo (sekcja 8): komunikat bramki po poprawce nie zawiera dźwigni racji (t16, ziarno 11, maksimum).
- NIE ZMIERZONO: tury 17–30, inne ziarna, inne tryby podatku.
- Ścieżka AI (`rationZysk`, l. 7945–7991): przeanalizowana w kodzie (sekcja 8) — bez członu automatu, bez podwójnego liczenia; pomiar AI na żywo NIE ZMIERZONO.
- Opcjonalnie (poza zakresem tej rundy): komunikat `cityPanel.ts` mógłby wskazywać zablokowany suwak. Nie zmieniano.
- Pytanie Q42 (co po 15. turze) — osobne, nie ruszane.

## 7. UWAGI-DLA-ORKIESTRATORA

- Pre-existing czerwony test `no-negative-stocks-endturn-test` (f) jest w bazie c834d3eb8; nie wynika z tej zmiany. Warto przydzielić osobny temat.
- Tymczasowe pliki `endgate-lever-baseline-entry/bundle` są usuwane przez test; `gra/node_modules` zainstalowano (`npm ci --ignore-scripts`), nie jest śledzone przez git.

## 8. Pomiar na żywo (runda 2, obrona) — ZMIERZONE

**Warunki:** Chromium headless, runner `gra/tools/grace15fx-active3-live.cjs` bez zmian (konfiguracja maksymalna jak GRACE15FX r3: Trudny, barbarzyńcy Trudny, kultura trudny, dyplomacja trudna, Wysoki ×4, mapa Standardowy, 1 rywal), ziarno 11, tryb `tax100`, tura 16 (blokada „Zakończ turę”). Baza: `c834d3eb8` wyeksportowana przez `git archive` do katalogu poza repo (bundle z tego samego runnera). Poprawka: `a447f25ac` (worktree). Surowe logi: `runs/R-WEB-ENDGATE-RATION-LEVER-Q1/31-*` (baza) i `32-*` (poprawka).

**Odczyt przy blokadzie (t16, tura od początku blokady, przed otwarciem panelu miasta):**

| Wielkość | Baza c834d3eb8 | Poprawka a447f25ac |
|---|---|---|
| Dźwignie w komunikacie bramki | obniżka racji żywności **+12**; rozwiązanie jednostek (złoto) +32; rozwiązanie jednostek (żywność) +32 | rozwiązanie jednostek (złoto) +32; rozwiązanie jednostek (żywność) +32 (**brak** dźwigni racji) |
| Komunikat | „…po zakończeniu tury zabraknie 18. Pomogą: obniżka racji żywności: +12 …” | „…po zakończeniu tury zabraknie 18. Pomogą: rozwiązanie jednostek (złoto) +32 …; (żywność) +32 …” |
| Wartość `extra.suwakZywnosc` (`_nnsRacjeZysk`) | 12 | 0 (pominięta) |
| Racje miasta `city0` | 1,5 (auto) | 1,5 (auto) |
| Pole `forecast.spichlerzPo` (prognoza gracza, bez reakcji automatu) | −30 | −30 |

**Odczyt po otwarciu panelu miasta i ustawieniu suwaka Wyżywienie na minimum (lever `a-wyzywienie-min`):**

| Wielkość | Baza | Poprawka |
|---|---|---|
| Suwak Wyżywienie: min / max / wartość | 0 / 0 / 0 (zablokowany na limicie) | 0 / 0 / 0 (zablokowany na limicie) |
| Racje `city0` po otwarciu panelu | 0 (automat przyciął 1,5 → 0) | 0 |
| Prognoza Spichlerza po otwarciu panelu | −18 (+12 względem −30) | −18 (+12 względem −30) |

**Po użyciu dźwigni „rozwiązanie jednostek (żywność)” (+32):** prognoza Spichlerza −2 po pierwszej jednostce, 14 po drugiej — identycznie w bazie i w poprawce.

**WERDYKT (pytanie z sekcji 0 runda 1, „czy komunikat obiecuje obniżkę racji, której gracz nie może wykonać”): TAK w bazie.** Dźwignia +12 jest liczona jako różnica „racje = 0” minus „prognoza bez reakcji automatu”, a jednocześnie prognoza −18, na której stoi komunikat „zabraknie 18”, już zawiera te +12 (automat przyciął racje do limitu Spichlerza). Suwak Wyżywienia jest zablokowany na 0 (min = max = 0), więc gracz nie może wykonać tej dźwigni; efekt +12 pojawia się tylko przez automat. Poprawka usuwa dźwignię, a liczby komunikatu są spójne: −18 + 32 = 14 ≥ 0.

**Mechanizm (kod, poprawka):** `_nnsRacjeZysk = max(0, fZero.spichlerzPo − (_nnsHumanForecast.spichlerzPo + (_nnsAutoSpichlerzDelta ?? 0)))` (`gra/src/main.ts`, wyliczenie przy `fZero`). Gdy automat nie zmienił racji, `_nnsAutoSpichlerzDelta` jest `undefined` i wynik jest jak dotąd.

**Ścieżka AI (`gra/src/main.ts` ok. l. 7945–7991):** NIE DOUBLE-COUNT. `rationZysk = project({ rationsZero: true }).spPo − cur.spPo`, gdzie `project()` to zwykła projekcja bez członu automatu; po zastosowaniu dźwigni racji (`ov.rations`, racje = 0) pętla przelicza `cur = project()`. Dźwignia AI jest więc zastosowana realnie w stanie, a nie obiecana. Pomiar AI na żywo: NIE ZMIERZONO.

**Zakres pomiaru:** jedno ziarno (11), jedna tura (16), jeden tryb podatku (`tax100`). Tury 17–30 i ziarna inne niż 11 NIE ZMIERZONO.
