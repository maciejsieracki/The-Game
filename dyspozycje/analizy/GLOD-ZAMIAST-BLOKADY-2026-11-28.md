# Głód zamiast blokady końca tury (R-WEB-STARVATION-DESIGN-Q42C, tag STARVEQ42C)

**Data:** 2026-11-28 · **Baza:** 42992edde (origin/main, ancestor OK) · **Operator:** HAIKU 5.5, runda 2/5 (obrona po ocenie Evaluatora 73035e211) · **Status:** DECISION_REQUIRED
**Zakres:** dokument i narzędzie modelu (`gra/tools/starvation-model.cjs`). Zero zmian w `gra/src/**` i `gra/data/**`.
**Decyzja właściciela (Q42 = C):** brak blokady „Zakończ turę” z powodu żywności; brak żywności = głód, tura się nie zatrzymuje. Siła i obiekt głodu NIE są ustalone (decyzja o balansie, wybór po turnieju C-018).

## STAN WIĄŻĄCY (przeczytaj najpierw)

1. **Pomiar żywy (Chromium) w tej rundzie NIE został podjęty** (brak próby; nie wykazano niemożliwości pomiaru). Wyniki liczbowe poniżej pochodzą z (a) kodu silnika, (b) danych live z GRACE15FX r3 (dokument `dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md`, dwa ziarna 11 i 7, t16) oraz (c) modelu `gra/tools/starvation-model.cjs` (wyjście: `dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/model-output.txt`). Wszystko, czego nie zmierzono na żywo, oznaczono **NIE ZMIERZONO**.
2. **Istniejący silnik już ma głód — nie trzeba go wymyślać od zera.** Gdy zapas Żywności państwa spada poniżej 0 po kosztach armii, działają dziś: spadek statów bojowych ×0,75 od pierwszej tury, atrycja HP 10% maxHP/turę (Trudny) po 3 turach z rzędu, oraz automatyczne obniżanie racji i rozwiązywanie **jednostek wsparcia** dla **AI** (pętla AI, `gra/src/main.ts` ok. l. 7945–7992). Obrońcy (w mieście, garnizon, wódz, oblężenie, na pokładzie) są dla AI chronieni (`nnsUnitIsDefender`, `main.ts` l. 7780–7784; `no-negative-stocks.ts` l. 622–631). Dla **gracza** automatycznie działa tylko obniżka racji (automat), bez rozwiązywania jednostek.
3. **Ważne dla projektu C:** dziś blokada trwa tak długo, jak gracz ma dźwignię o zysku > 0 — a dźwignią jest zawsze rozwiązanie jednostek wojskowych (`decideEndTurnGate`, `gra/src/game/no-negative-stocks.ts` l. 486–488). Zdjęcie blokady oznacza, że tura **przechodzi z ujemnym zapasem** i uruchamia się istniejący głód (pkt 2). Jednostki gracza nie są już chronione przed głodem przez bramkę.

## 1. Inwentarz kodu: blokada i zmiana końca tury z powodu żywności

Numery linii wg stanu bazy 42992edde.

| # | Miejsce | Co robi dziś z żywnością |
|---|---|---|
| I-1 | `gra/src/main.ts` l. 24010 (`_nnsAutoSpichlerzDelta`), l. 23909–24014 | Reakcja automatu: obniżka racji miast do limitu Spichlerza (`maxSafePoziomRacjiForCity`); wynik = prognoza po automacie minus prognoza gracza |
| I-2 | `gra/src/main.ts` l. 24021–24083 | Dźwignia racji gracza: `_nnsRacjeZysk` (l. 24075) = `fZero − (prognoza + delta automatu)` (poprawka ENDGATELEVER); gdy zysk nie liczony — 0 (l. 24083) |
| I-3 | `gra/src/main.ts` l. 43634–43670 `nnsGateForPlayer()` | Buduje `live` z salda na żywo i przekazuje dźwignie `suwakZywnosc: _nnsRacjeZysk` (l. 43652) oraz `automat` (l. 43665–43667) do `decideEndTurnGate` (l. 43669) |
| I-4 | `gra/src/main.ts` l. 43686 `canPlayerInitiateEndTurn()`; **l. 43739–43742** | Główna blokada: `if (nnsGateForPlayer().blokada) return false` |
| I-5 | `gra/src/main.ts` l. 43803 (`nnsHint`) | Podpowiedź „dlaczego nie można zakończyć” przy blokadzie NNS |
| I-6 | `gra/src/main.ts` l. 33043–33045, 33157, 35170–35182 | HUD/diagnostyka: `forecast`, `gate`, `komunikat`, `racjeZysk`, `autoSpichlerzDelta` |
| I-7 | `gra/src/main.ts` l. 29591, 31003, 33219, 35087 | `canEnd: canPlayerInitiateEndTurn()` — przyciski/okna |
| I-8 | `gra/src/main.ts` l. 49764–49765, 50036 | Strażnik `triggerPlayerEndTurn` / advance: odrzuca koniec tury przy `canPlayerInitiateEndTurn() === false` |
| I-9 | `gra/src/game/no-negative-stocks.ts` l. 463–520 `decideEndTurnGate` | Składa `levers`: `podatek-skarbiec`, **`suwak-zywnosc` (l. 486)**, `rozwiaz-skarbiec`, `rozwiaz-spichlerz`; blokada tylko gdy dźwignie pokrywają brak (`czyRuchNaprawczy`, l. ~505) |
| I-10 | `gra/src/game/no-negative-stocks.ts` l. 218–231 `buildAiLevers` | Dźwignia AI `suwak-zywnosc` (l. 227–230) z `rationZysk` |
| I-11 | `gra/src/game/no-negative-stocks.ts` l. 592–601 | Opisy dźwigni po polsku („obniżka racji żywności: +X”) — tekst komunikatu |
| I-12 | `gra/src/main.ts` l. 7945–7992 (ścieżka AI) | `rationZysk = project({rationsZero:true}).spPo − cur.spPo`; pętla `decideAiOwnerBalance` (do 4 iteracji): obniżka racji **i rozwiązanie jednostek wsparcia** (`disbandAiSupportUnit`, l. ~7985); obronne wyłączone (`obronna: nnsUnitIsDefender`, l. 7955) |
| I-13 | `gra/src/game/empire-food.ts` l. 290–316 `advanceEmpireFood` | Realny tick: `glodWojska = central < 0` (l. 290); `turyUjemnychZapasowPo` (l. 298); `glodWojskaAtrycjaAktywna` = tury ≥ karencja (l. 316). Zapas po ticku clampowany do 0 (brak długu) |
| I-14 | `gra/src/main.ts` l. 44340–44375 | Atrycja HP wojska **dla każdego właściciela** (`applyArmyStarvationHpLoss`, parytet AI/gracz) |
| I-15 | `gra/src/game/army-starvation.ts` l. 60–85 | `loss = max(1, floor(maxHp*frac))`; HP ≤ 0 → jednostka usunięta |
| I-16 | `gra/src/game/population-growth-v85.ts` l. 385–410 `applyHungerPenaltyV85`; wywołanie l. 572–580 | Miasto nienakarmione (`fed=false`) traci 1 ludność za turę (mnożnik `1 + lud_spadek_proc`, min. 1 ludność) |
| I-17 | `gra/src/game/empire-food.ts` l. 260–275 | Miasto jest „nienakarmione”, gdy jego bilans jest ujemny i centralny zapas nie pokrywa deficytu (`fedByCityId`) — przed odjęciem kosztu armii |
| I-18 | `gra/src/game/gold-deficit.ts` (ok. l. 154–227) | Analogiczna atrycja dla Skarbca (`isGoldDeficitStarving`); poza zakresem, dla porównania |
| I-19 | `gra/src/ui/cityPanel.ts` l. 1690–1715, 5562, 5717 | Panel miasta: „głód”, „brak wzrostu — miasto nie jest w pełni nakarmione” |
| I-20 | `gra/data/econ-params.json` l. 108–122 | `glod_wojska_hp_frac` (easy 0,06 / normal 0,08 / hard 0,10), `glod_wojska_karencja_tur` (3 na każdym poziomie), `glod_wojska_stat_mult` (0,75) |

**Testy przypinające dziś zachowanie bramki żywności (kandydaci do zmiany przy implementacji C; treść przeczytana wyrywkowo, wg grep i nazw):**

| Test | Co przypina (potwierdzone grep-em) | Zmiana przy C |
|---|---|---|
| `gra/tools/endgate-lever-baseline-test.cjs` (5 pass) | baza dźwigni racji = prognoza po automacie; kontrakt `suwakZywnosc: _nnsRacjeZysk`; zysk 0 nie tworzy dźwigni | tak — kontrakt bramki znika |
| `gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs` (34 pass) | `decideEndTurnGate` z `suwakZywnosc` 10 i 4/25 (l. 52–54, 127–133) | tak |
| `gra/tools/end-turn-gate-projection-only-test.cjs` (49 pass) | dźwignia racji + automat w projekcji (l. 72–124) | tak |
| `gra/tools/no-negative-stocks-c2-test.cjs` | nagłówek: `decideAiOwnerBalance` (brama tury AI, wstrzymanie zakupów, wybór jednostek wsparcia, brak rozwiązania obronnych), kara deficytu złota | nie — kontrakt AI |
| `gra/tools/end-turn-block-event-test.cjs` (36 pass) | nagłówek: blokada jako wydarzenie w zakładce „Ważne” (jedno wydarzenie, bez duplikatu, znika po ustąpieniu blokady) | tak — UI blokady |
| `gra/tools/no-negative-stocks-endturn-test.cjs` (19 pass) | blokada końca tury przy ujemnym saldzie | tak (kandydat — nazwa) |
| `gra/tools/no-negative-stocks-projection-test.cjs` | nagłówek: projekcja po ticku == realny stan; projekcja nie mutuje stanu | nie — projekcja zostaje |
| `gra/tools/no-negative-stocks-test.cjs` | nagłówek: czysta logika bramki (wolne tury 1–10, blokada od t11, ruch naprawczy znosi blokadę, plan AI) | tak — kontrakt blokady |
| `gra/tools/no-negative-stocks-c3-turn-test.cjs` | nagłówek: realne „Zakończ turę” w bundle, AI z 40 jednostkami, skarbiec ≥ 0 z równoważeniem | tak — scenariusz z równoważeniem |
| `gra/tools/end-turn-gate-live-test.cjs` | nagłówek: żywa gra (Chromium), przycisk/tooltip bramki w scenariuszach a–e | tak — zachowanie przycisku |
| `gra/tools/live-nns-gate-smoke-test.cjs` | nagłówek: N tur przez endTurn, bramka nie zatrzymuje tury (helper przygotowuje stan) | tak — oczekiwanie „bramka nie blokuje” |
| `gra/tools/early-grace-15-test.cjs` (33 pass) | nagłówek: okno łaski 1–15 (start Trudny = 1 Wojownik, barbarzyńcy nie wykonują tury, utrzymanie gracza = 0) | nie bezpośrednio; sprawdzić przy C |

**Testy przypinające hak głodu (zostają przy C; sprawdzić, czy nie zakładają blokady):**

| Test | Co przypina | Wynik dziś |
|---|---|---|
| `gra/tools/glod-wojska-karencja-test.cjs` | karencja 3 tury, atrycja po karencji, stat ×0,75 | 40/0 |
| `gra/tools/army-hunger-combat-test.cjs` | osłabienie bojowe przy głodzie | 13/0 |
| `gra/tools/population-civ-matrix-wiring-test.cjs` | wpięcie `lud_spadek_proc` w głód ludności | 122/0 |
| `gra/tools/citystate-army-food-difficulty-test.cjs`, `empire-food-b5-test.cjs`, `spichlerz-wzrost-test.cjs`, `spichlerz-deficyt-scalenie-test.cjs` | ułamek atrycji wg trudności, głód miast, deficyt Spichlerza | NIE URUCHOMIONO w tej rundzie |
| `gra/tools/siege-starvation-test.cjs`, `siege-starvation-duration-test.cjs` | głód garnizonu w oblężeniu (osobny mechanizm) | NIE URUCHOMIONO |

## 2. Co gra robi dziś przy ujemnym bilansie żywności

**Gracz (tura po zdjęciu blokady, wg kodu):**

- **Jednostki wojskowe:** w tiku z `central < 0` (`empire-food.ts` l. 290) `isArmyHungry` → `efParams.glodWojskaStatMult` = 0,75 przy bitwie (`main.ts` l. 7281–7288, `army-starvation.ts`). Od 3. tury z rzędu (`turyUjemnychZapasowPo >= 3`, l. 316) każda jednostka traci `max(1, floor(maxHp × 0,10))` HP na turę (`main.ts` l. 44360–44375); HP ≤ 0 → jednostka usunięta.
- **Miasta:** miasto staje się „nienakarmione” tylko gdy jego własny bilans jest ujemny i centralny zapas nie pokrywa deficytu (`empire-food.ts` l. 260–275). Wtedy traci 1 ludność za turę (`applyHungerPenaltyV85`, l. 385–410), a wzrost zatrzymuje się. Przy deficycie wojskowym miasta są najpierw karmione z zapasu (odjęcie kosztu armii następuje później, l. 280), więc **sam deficyt armii nie zabiera ludności miastom** — stwierdzone w kodzie, NIE ZMIERZONO na żywo po t16.
- **Zapas:** clampowany do 0 po ticku (`central = Math.max(0, central)`, l. 294–297) — brak długu, brak spirali zapasu w samym silniku.

**AI (wg kodu):**

- Ścieżka AI przed tickiem równoważy saldo: obniżka racji i **rozwiązanie jednostek wsparcia** (`decideAiOwnerBalance`, `disbandAiSupportUnit`, `main.ts` ok. l. 7945–7992); obrońcy nigdy nie są rozwiązywani. Flaga `isNnsAiBalanceEnabled()` domyślnie włączona, `NNS_AI_BALANCE_TURN_MIN = 1` (`no-negative-stocks.ts` l. 351–361).
- Jeśli saldo nadal ujemne po iteracjach, obowiązuje ten sam hak głodu co u gracza (atrycja HP, parytet l. 44340–44375). **AI nie jest zwolnione z głodu**, ale już dziś ma automatyczny odpowiednik kandydata G2.

**Podsumowanie zachowania dziś:** gracz ma blokadę (nie ma głodu do czasu rozwiązania jednostek); AI ma automatyczne rozwiązanie jednostek; przy zdjęciu blokady oba przypadki wpadają w ten sam hak głodu armii, bez utraty ludności miast.

## 3. Pomiar i model (MAKSIMUM: Trudny, koszty Wysoki ×4, barbarzyńcy Trudni)

**Scenariusz:** aktywny gracz, 2 jednostki wojskowe (Wojownik 22 HP, Łucznik 10 HP, `gra/data/units.json`), Zwiadowca = cywil (poza atrycją), t16–t30, deficyt 16–18 żywności/turę po automacie. Dwa ziarna z pomiaru GRACE15FX r3 jako dane wejściowe: S0 = 14 (ziarno 11) i 16 (ziarno 7). Model: `gra/tools/starvation-model.cjs`.

**Wyniki modelu (baseline = obecny silnik po zdjęciu blokady; NIE ZMIERZONO na żywo):**

| Wielkość | Ziarno 11 (S0=14) | Ziarno 7 (S0=16) |
|---|---|---|
| Pierwsza tura głodu | t16 | t16 |
| Stat ×0,75 (osłabienie bojowe) | od t16 do końca głodu | od t16 do końca głodu |
| Pierwsza atrycja HP | t18 (3. tura z rzędu) | t18 |
| Pierwsza utrata jednostki | **t27** (Łucznik) | **t27** (Łucznik) |
| Jednostki utracone do t30 | **2** (Łucznik t27, Wojownik t28) | **1** (Łucznik t27); Wojownik żyje z 2 HP |
| Tury głodu razem (t16–t30) | 13 | 12 |
| Utrata ludności miasta (baseline) | 0 (miasto karmione z zapasu, wg kodu) | 0 |

**Założenia modelu (jawnie) i wrażliwość** (`gra/tools/starvation-model.cjs`; sekcja „WRAŻLIWOŚĆ” w `model-output.txt`):
- S0 (14 lub 16) stałe przez t16–t30: model nie uwzględnia wzrostu miasta, zmian racji ani zapasu Spichlerza (w t16 wg danych = 1, pominięty);
- stały koszt 16 żywności na jednostkę wojskową; dwie jednostki (Wojownik, Łucznik);
- rozbieżność HUD (−30) vs komunikat bramki (−18), na której opiera się model, NIE jest wyjaśniona (OKNO-LASKI pkt 13); tabela wrażliwości obejmuje S0 od 10 do 18;
- wrażliwość (S0 10–18 × HP_FRAC 0,06 / 0,08 / 0,10, 15 wierszy): pierwsza utrata jednostki wypada w **t27 we wszystkich wierszach**; zgony do t30: 1–2 (2 tylko przy HP_FRAC 0,10 i S0 10–14); tury głodu 12–15. Termin „t27” jest stabilny względem tych parametrów; liczba utraconych jednostek zależy od S0 i HP_FRAC;
- model nie zawiera mnożnika `lud_spadek_proc` ani wielu miast (patrz G1).

**Pomiary dla kandydatów G1–G3 (model):**

| Kandydat | Pierwsza utrata | Utrata ludności do t30 | Utrata jednostek do t30 | Tury głodu |
|---|---|---|---|---|
| **G1** (−1 ludności/turę niedoboru, bez zmiany armii) | jak baseline: t27 (armia) | pop_t16 = 3 → −2; 5 → −4; 8 → −7 (= min(tury głodu, pop−1)) | 2 (ziarno 11) / 1 (ziarno 7) | 13 / 12 |
| **G2** (auto-rozwiązanie najsłabszej jednostki do pokrycia) | **t16** | 0 | ziarno 11: 2 (t16 Łucznik + Wojownik); ziarno 7: 1 (t16 Łucznik) | 0 po t16 |
| **G3** (kara produkcji/Szczęścia proporcjonalna do niedoboru) | bez utraty ludności i jednostek **tylko, jeśli atrycja HP zostanie wyłączona** (inaczej jak baseline: t27) | 0 | 0 przy wyłączonej atrycji; inaczej jak baseline | 13 / 12 (kara trwa) |

**NIE ZMIERZONO (listę pomiarów wymaganych przed decyzją):**
- liczba ludności miasta w t16 (potrzebna do G1; model daje tylko wzór);
- wielkość kary produkcji/Szczęścia w G3 (brak wzoru w kodzie — trzeba go zaprojektować);
- pomiar żywy tur 17–30 w każdym wariancie (model nie zawiera wpływu G1/G3 na produkcję żywności, więc spirala nie jest policzona);
- ataki barbarzyńców w czasie głodu (w danych GRACE15FX: brak ataku na gracza do t30, obce jednostki w promieniu 3 pól: 0 w turach 1–30, obozy od t17);
- zachowanie AI w scenariuszu bez blokady (kod: patrz pkt 2; pomiar żywy NIE wykonany);
- poziomy trudności niższe niż maksymalny (NIE ZMIERZONO; reguła: tylko maksimum).

**Poziom maksymalny (zasada testowania):** dla `glod_wojska_hp_frac` maksimum to **Trudny = 0,10** (econ-params `hard`); dla karencji wszystkie poziomy = 3, więc poziom bez znaczenia; dla kosztu jednostek Wysoki ×4 (pace z dyspozycji). Maksimum jest jednoznaczne dla atrycji; dla `lud_spadek_proc` (mnożnik ubytku ludności) przyjęto 0 (domyślne w `civ-matrix`) — maksimum NIE jest zdefiniowane w danych i oznaczono to jako niejednoznaczne.

## 4. Trzej kandydaci projektu głodu

Każdy kandydat działa po zdjęciu blokady; istniejący głód armii (stat ×0,75, atrycja) zostaje, chyba że zaznaczono inaczej.

### G1 — utrata ludności miasta o 1 za każdą turę niedoboru
- **Co zobaczy gracz:** w komunikacie końca tury „Głód: miasto X traci 1 mieszkańca” i licznik ludności spadający co turę; wzrost zatrzymany (już dziś przy `fed=false`).
- **Ile utraci na turę przy deficycie 16–18:** 1 mieszkańca miasta (min. 1 — miasto nie wymiera). Wielkość do t30: 2–7 ludności w zależności od populacji w t16 (NIE ZMIERZONO populacji).
- **Czy gracz ma wpływ:** tak, ale pośredni — przez rozwiązanie jednostek (zmniejsza deficyt), zwiększenie produkcji żywności lub budowę Spichlerza. Nie ma bezpośredniego suwaka.
- **Mnożnik ubytku:** model G1 liczy −1 ludności na turę i ignoruje `lud_spadek_proc`. `applyHungerPenaltyV85` (`population-growth-v85.ts` l. 385–410) dodaje mnożnik do długu (`debt += hungerLossMultiplier`), więc przy mnożniku > 1 ubytek rośnie. Przy 0 (domyślna wartość w `civ-matrix`) wynik się nie zmienia. Sumy dla wielu miast nie liczono — NIE ZMIERZONO.
- **Miejsca kodu:** wymuszenie `fed=false` przy deficycie armii w `empire-food.ts` l. 260–280 (dziś deficyt armii jest odejmowany po karmieniu miast) oraz `population-growth-v85.ts` l. 572–580 (dziś już działa). Trzeba przesunąć odjęcie armii przed karmienie miast lub dodać osobną regułę.
- **Testy do zmiany:** `population-civ-matrix-wiring-test.cjs`, `glod-wojska-karencja-test.cjs` (jeśli zakładają karmienie miast), testy bramki z pkt 1.
- **Szacunek pracy:** mała–średnia (≈1–2 dni roboczo: jedna zmiana kolejności w tiku, testy).
- **Ryzyko dla AI:** AI ma te same zasady tiku — G1 uderzy w miasta AI; AI dziś rozwiązuje jednostki przed tickiem (pkt 2), więc ubytek ludności AI będzie rzadki. NIE ZMIERZONO.
- **Ryzyko spirali:** tak — mniej ludności = mniej produkcji i konsumpcji; efekt netto NIE ZMIERZONO (model nie ma wzoru produkcji od ludności).
- **Koniec okna łaski (t16):** po t15 barbarzyńcy i utrzymanie są zerowe; G1 startuje w t16 razem z blokadą — brak wyjątku.
- **Niższe poziomy:** NIE ZMIERZONO.

### G2 — automatyczne rozwiązanie najsłabszej jednostki wojskowej do pokrycia niedoboru
- **Co zobaczy gracz:** w t16 komunikat „Zabrakło żywności: rozwiązano Łucznika (i Wojownika)”; armia znika bez decyzji, chyba że gracz rozwiąże wcześniej.
- **Ile utraci na turę:** 1–2 jednostki jednorazowo (zależnie od deficytu: ziarno 7 → 1, ziarno 11 → 2), potem zero głodu.
- **Czy gracz ma wpływ:** tak — może rozwiązać wybraną jednostkę przed zakończeniem tury (dziś to ten sam ruch co dźwignia bramki). Automat wybiera najsłabszą (najmniejsze HP; dla gracza to Łucznik 10 HP).
- **Miejsca kodu:** nowa reguła w `main.ts` przed `advanceEmpireFood` (analogicznie do pętli AI l. 7945–7992 — ta logika już istnieje dla AI, można ją przenieść); usunięcie blokady `nnsGateForPlayer` (l. 43739–43742).
- **Testy do zmiany:** wszystkie testy bramki (pkt 1), `endgate-lever-baseline-test.cjs`, `end-turn-gate-projection-only-test.cjs`.
- **Szacunek pracy:** średnia (≈2–3 dni): reużycie logiki AI, testy parytetu.
- **Ryzyko dla AI:** AI ma mechanizm zbliżony, ale z ochroną: `decideAiOwnerBalance` rozwiązuje tylko jednostki wsparcia (`nnsUnitIsDefender`). Model G2 tej ochrony nie ma: w t16 usuwa też obrońcę w mieście (Łucznik kupiony w t5 w pomiarze żywym). Parytet z AI nie jest więc prostą kopią algorytmu — wymaga decyzji, czy obrońca jest chroniony.
- **Ryzyko spirali:** niskie — jednostki znikają raz, zapas wraca do dodatniego, brak dalszego głodu (model: 0 tur głodu po t16).
- **Koniec okna łaski (t16):** G2 zaczyna się w t16, czyli po oknie. Dane GRACE15FX: od t17 pojawiają się obozy i spawny barbarzyńców (12–13 obozów w t17); atak na gracza do t30 NIE zaobserwowano (`foreignNear` = 0 w turach 1–30; miasto bez obrony przetrwało do t31). Czy brak obrony w t17–t30 zwiększa ryzyko — hipoteza, NIE ZMIERZONO.
- **Niższe poziomy:** NIE ZMIERZONO.

### G3 — kara produkcji/Szczęścia proporcjonalna do niedoboru (bez utraty ludności i jednostek)
- **Co zobaczy gracz:** spadek produkcji lub Szczęścia w miastach proporcjonalny do niedoboru („−X% produkcji przy niedoborze żywności”), bez utraty mieszkańców i jednostek.
- **Ile utraci na turę przy deficycie 16–18:** wielkość kary NIE ZMIERZONO (brak wzoru w kodzie; wymaga zaprojektowania przelicznika deficyt → %).
- **Czy gracz ma wpływ:** tak — przez zwiększenie żywności (budowa, racje, budynki) i rozwiązanie jednostek; brak bezpośredniego ruchu „wyjścia z kary” poza tym.
- **Miejsca kodu:** nowa kara w `empire-food.ts` (po obliczeniu `glodWojska`) i tam, gdzie liczona jest produkcja/Szczęście miasta; **i wyłączenie atrycji HP** (`main.ts` l. 44340–44375), jeśli G3 ma nie tracić jednostek — to zmiana zasady już wdrożonej dla AI i gracza (parytet).
- **Testy do zmiany:** `glod-wojska-karencja-test.cjs` (atrycja), `army-hunger-combat-test.cjs`, `citystate-army-food-difficulty-test.cjs`, testy produkcji/Szczęścia.
- **Szacunek pracy:** średnia–duża (≈3–5 dni): projekt wzoru, wyłączenie atrycji, testy parytetu i UI.
- **Ryzyko dla AI:** AI dostaje ten sam spadek produkcji; AI pozostaje bez automatycznego rozwiązania, jeśli nie zmieni się ścieżka AI — trzeba zdecydować, czy AI nadal rozwiązuje jednostki.
- **Ryzyko spirali:** wysokie przy liniowym przelicznika — mniej produkcji → większy deficyt → większa kara. Wymaga limitu kary (np. cap %) — NIE ZMIERZONO.
- **Koniec okna łaski (t16):** kara startuje w t16; łagodniejsza niż G1/G2, ale bez zmiany atrycji armia dalej ginie w t27 (model).
- **Niższe poziomy:** NIE ZMIERZONO.

## 5. DECISION_REQUIRED (jedno zdanie konfliktu na wariant; bez rekomendacji)

- **G1:** przy deficycie żywności każde miasto traci mieszkańca co turę, więc gracz z jednym miastem może stracić większość ludności w kilka tur, a kształt utraty ludności zależy od populacji w t16, której nie zmierzono.
- **G2:** automat rozwiązuje jednostki wojskowe, także obrońcę w mieście, bez decyzji gracza (model: obie jednostki w t16), co zdejmuje obronę, gdy od t17 pojawiają się obozy barbarzyńców (atak na gracza do t30 nie zaobserwowano).
- **G3:** kara produkcji/Szczęścia bez utraty jednostek wymaga wyłączenia atrycji HP (zmiana zasady dla gracza i AI), a jej wielkość i limit spirali nie są jeszcze ustalone.

## 6. UWAGI-DLA-ORKIESTRATORA

- **Ścieżka AI nie jest de facto G2:** pętla `decideAiOwnerBalance` + `disbandAiSupportUnit` (`main.ts` ok. l. 7945–7992) rozwiązuje tylko jednostki wsparcia i chroni obrońców; model G2 rozwiązuje najsłabszą jednostkę bez tej ochrony. Przy wyborze G2 dla gracza trzeba zdecydować, czy parytet ma obejmować ochronę obrońców, czy gracz ma mieć wybór przed automatem.
- **Atrycja HP (`main.ts` l. 44340–44375) zabija jednostki w t27–t28** (model). Jeśli wybrany zostanie wariant bez utraty jednostek, atrycja trzeba wyłączyć albo zmienić zasadę — to osobna decyzja balansu.
- **Przypinanie testów:** część testów przypina zachowanie bramki (lista w pkt 1). Po wyborze kandydata zmiana obejmie co najmniej: `endgate-lever-baseline-test.cjs`, `no-negative-stocks-end-turn-gate-levers-test.cjs`, `end-turn-gate-projection-only-test.cjs`. Nagłówki pozostałych (`no-negative-stocks-c2-test.cjs`, `end-turn-block-event-test.cjs`, `end-turn-gate-live-test.cjs`, `live-nns-gate-smoke-test.cjs`, `early-grace-15-test.cjs`, `no-negative-stocks-c3-turn-test.cjs`, `no-negative-stocks-projection-test.cjs`) przeczytano w rundzie 2 (zob. tabelę w §1); pełnej treści nie czytano — kontrakt do potwierdzenia przy implementacji. `no-negative-stocks-endturn-test.cjs` — nazwa, treść NIE przeczytana.
- **Pre-existing:** `no-negative-stocks-endturn-test.cjs` dziś zielony (19/0) — w czasie ENDGATELEVER był czerwony (TDQ16 już naprawiony).
- **Pliki poza tą rundą:** `FAKTY.md` z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`dyspozycje/autobot/runs/R-WEB-POST-GRACE-UPKEEP-Q42/`) nie istnieje w tym worktree — dane zaczerpnięto z `OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md` (tożsame w treści).
- **Pomiar na żywo nie został wykonany w tej rundzie**; przy wyborze wariantu warto zlecić pomiar G1/G2/G3 na Chromium (maksimum, t16–t30, dwa ziarna) jako osobny temat.

## 7. Bramki (surowy wynik w tym worktree, baza 42992edde)

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` (w `gra/`, po `npm ci --ignore-scripts`) | exit 0 |
| `node gra/tools/endgate-lever-baseline-test.cjs` | 5 passed, 0 failed |
| `node gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs` | 34 passed, 0 failed |
| `node gra/tools/end-turn-gate-projection-only-test.cjs` | 49 passed, 0 failed |
| `node gra/tools/glod-wojska-karencja-test.cjs` | 40 pass, 0 fail |
| `node gra/tools/army-hunger-combat-test.cjs` | 13 pass, 0 fail |
| `node gra/tools/population-civ-matrix-wiring-test.cjs` | 122 passed, 0 failed |
| `node gra/tools/no-negative-stocks-endturn-test.cjs` | 19 passed, 0 failed |
| `node gra/tools/end-turn-block-event-test.cjs` | passed=36 failed=0 |
| `node gra/tools/starvation-model.cjs` | wyjście w `dyspozycje/autobot/runs/R-WEB-STARVATION-DESIGN-Q42C/model-output.txt` |

**Zmiany kodu gry (`gra/src/**`):** brak (0 linii). `gra/data/**`: brak.

## 8. NIE ZMIERZONO (zbiorcza lista)

- Pomiar żywy (Chromium) G1, G2, G3 w tej rundzie (nie podjęty; zob. STAN WIĄŻĄCY pkt 1).
- Populacja miasta w t16 (G1).
- Wielkość kary G3 (brak wzoru).
- Tury 17–30 na żywo w każdym wariancie.
- Zachowanie AI na żywo bez blokady.
- Atak barbarzyńców w czasie głodu (po t30 i przy ataku w głodzie).
- Poziomy trudności niższe niż maksymalny.
- Spirala produkcji przy G1/G3.
- Wpływ suwaka Wyżywienia (już zablokowany na 0 w danych GRACE15FX — stwierdzone, nie zbadane ponownie).
