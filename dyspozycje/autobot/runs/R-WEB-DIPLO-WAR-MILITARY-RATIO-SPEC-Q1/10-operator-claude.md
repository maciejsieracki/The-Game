# R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (specyfikacja; zero zmian kodu)
TEMAT: R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1
GOAL: specyfikacja parametru wojennego „Stosunek militarny” (`militaryRatioWar`) zweryfikowana w kodzie. Wynik to ten dokument. Żadnych zmian w grze.
BAZA: origin/main = 5d0c5f8d1e3e6efd188064419418804779868cfa (worktree detach na tę bazę, potwierdzone `git rev-parse --short HEAD` = 5d0c5f8d1).

Źródła dispatchu: `00-dispatch.md` i `00-dispatch-DODATEK-claude.md` NIE istnieją na origin/main. Oba są na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (commit 277c55369, ścieżka `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/`). Czytano z tej gałęzi. Baza kodu = origin/main.

Konwencja odwołań: `plik:linia` odnosi się do `gra/src/...` chyba że podano inaczej. Linie zweryfikowano `grep -n` / `sed -n` na bazie 5d0c5f8d1. Miejsca oznaczone NIE ZWERYFIKOWANO nie zostały prześledzone w tej rundzie.

---

## 0. Streszczenie dla Evaluatora / orkiestratora

- Dane do parametru ISTNIEJĄ w większości: siła wojskowa (Armia+Rekruci) jest wydzielana flagą `wojskowy` (TAK), pula rekrutów jest liczona w silniku (TAK), start wojny jest zapisywany (TAK, `wojnaStartTura`). Brakuje tylko licznika bitew per para (BRAK).
- Dodatek zawiera 4 wewnętrzne sprzeczności z kodem, które trzeba rozstrzygnąć przed wdrożeniem (szczegóły w p.3): (C1) założenie „aktywny tylko w wojnie” kłóci się z użyciem do „wypowiedzenia wojny”; (C2) obecne `rw` (udział w sile) liczy się z pełnej Mocy, a nie z samej wojskowości; (C3) decyzje pokoju gracza i AI używają DWÓCH różnych miar stosunku siły; (C4) próg 1,5× nie zgadza się z zatwierdzonym progiem 20% w `diplomacy-war-peace-params.json`.
- Clamp wojenny (`clampRelationForWar`) NIE jest tylko etykietą: zmienia zapisywane wartości Zaufania i Respektu (potwierdzone, p.3 zał. 8).
- Nazwa `militaryRatioWar` nie koliduje z istniejącym tekstem ani danymi. Identyfikator `militaryRatio` jest JUŻ używany dla innej miary (p.6).

---

## 1. Miejsca decyzji (wszystkie znalezione)

### 1a. Wypowiedzenie wojny

- AI (silnik decyzji AI): `gra/src/game/ai.ts` — funkcja `decideAIDiplomacy` zaczyna się w linii 6824. Komendy `wypowiedz_wojne` są tworzone w liniach **6852, 6875, 6895, 6919** oraz **7312**. Warunki wejścia to m.in. `forcedRel.hasNapTreaty` / `hasAllianceTreaty` (np. 6852 w kontekście) oraz `score < progMinimalnyRelacja` (ok. 7312).
- Typ komendy: `ai.ts:6579` (`{ type: 'wypowiedz_wojne'; targetId; powod }`).
- Próg AI do wypowiedzenia wojny na `rw`: `ai.ts:6229` `PROG_WOJNA_SILA = 0.6` (komentarz 6227: „0,6 ≈ stosunek sił 1,5:1”). To jest JEDYNY istniejący próg 1,5× i dotyczy wypowiedzenia wojny, a nie pokoju.
- Gracz: hak deklaracji wojny to `main.ts:12325` (`chargeWarDeclarationCredibility`, poprzedzony komentarzem „Nowa wojna deklarowana” w 12319–12324). Miejsce kliknięcia gracza w UI NIE ZWERYFIKOWANO w tej rundzie.
- Wymuszona wojna (hamulec / próg): `main.ts:11820–11870` (okolice `wojnaOdTury` w 11851; „wojna z progu (hamulec)” w 11861–11864). Funkcja-otoczka NIE ZWERYFIKOWANA.
- Wojna wymuszona w pakcie/sojuszu: `gra/src/game/forced-war-*.ts` NIE ZWERYFIKOWANO w szczegółach.
- Namów do wojny (gracz → AI): `diplomacy-proposals.ts` `ProposalActionId` zawiera `'namow_wojne'` (linia 91). Ocena: `evaluateProposal` (`diplomacy-proposals.ts:1104`) — gałąź `namow_wojne` NIE ZWERYFIKOWANA w tej rundzie.

### 1b. Przyjęcie / odrzucenie rozejmu i pokoju

- Ocena propozycji gracza (AI odpowiada): `diplomacy-proposals.ts:1104` `evaluateProposal`, gałąź `case 'pokoj': case 'rozejm'` w linii **1328–1329**.
- Ocena propozycji czekającej (AI→gracz): `diplomacy-proposals.ts:2184` `evaluatePendingFromAI`, gałąź `case 'pokoj': case 'rozejm'` w linii **2279–2281**.
- Bramka „czuje się silniejsze” (odrzuca pokój gracza): `diplomacy-war-peace-profile.ts` `evaluatePeaceAiGate`, odwołania do `peaceBlockedByMilitaryAdvantage` w liniach **396–400**.
- Akceptacja pokoju i finalizacja: `main.ts:12060` `finalizePeaceTreatyBetween`; rozgałęzienie rozejmu w 12083–12104 (`peaceFinalizeTrustEvent`, 0 Zaufania dla rozejmu).
- Gracz rozstrzyga oczekującą ofertę: `main.ts:21564` `resolvePendingDiplomacy(id, accept)`.
- Pomocnicze (rozejm): `gra/src/game/diplomacy-peace-lock.ts` — `aiTruceOrPeaceMode` (143), `truceEndAiAccepts` (170), `peaceFinalizeTrustEvent` (220), bramka wojskowa dla rozejmu (163–180, parametr `prog` z `przewagaMilitarna`).

### 1c. Propozycje pokoju AI

- `ai.ts:7139` `type: 'zaproponuj_pokoj'` (blok 7118–7150). Warunki: `aiAdvantageBlocksPeace` (7118, `peaceBlockedByMilitaryAdvantage`), `aiWeakerByAdvantageProg` (7119, `militaryAdvantageClass === 'niedobor'`), warunek `rel.stanWojny && !aiFeelsStronger && aiPeaceTimeOk && (rw <= progPokojSlabosc || wantsPeace)`.
- Rodzaj rozejm/pokój: `ai.ts:6257` `aiPeaceProposalKind(turnsAtWar)` (fallback po turach), wybór trybu w `aiTruceOrPeaceMode`.
- Typ komendy: `ai.ts:6590` (`zaproponuj_pokoj`, pole `rodzaj?`).
- Zadanie miasta w pokoju (N1b, poza zakresem): `ai.ts` `zada_miasto_za_pokoj` (typ 6576–6578).

### 1d. Podsumowanie miejsc (do wdrożenia parametru)

| Miejsce | Plik:linia | Używa dziś |
|---|---|---|
| AI wypowiada wojnę | ai.ts:6852/6875/6895/6919/7312 | respektWzgledny (`rw`) przez gałęzie |
| AI próg wojny | ai.ts:6229 | `rw ≥ 0,6` |
| Gracz wypowiada wojnę (hak) | main.ts:12325 | — (hak credibility) |
| Ocena pokoju/rozejmu (gracz→AI) | diplomacy-proposals.ts:1328 | `ctx.militaryRatio` (army M, p.3 C3) |
| Ocena pokoju (AI→gracz) | diplomacy-proposals.ts:2279 | `ctx.militaryRatio` |
| AI proponuje pokój | ai.ts:7139 | `rw` (+ bramki przewagi 7118–7119) |
| Finalizacja pokoju | main.ts:12060 | — |
| Rozstrzygnięcie oferty gracza | main.ts:21564 | — |

---

## 2. Dostępność danych (składniki a, b, c)

### (a) Punkty wojskowe per nacja — TAK

- `gra/src/game/power-objective.ts:223` `computeObjectivePower(input, coeff, battleModel, militaryKeys)`.
- Każdy składnik ma pole `military` (`row()` 207–216). Armia: linia **241** (`militaryKeys.has('armia')`). Rekruci: linia **244** (`militaryKeys.has('rekruci')`).
- Zbiór kluczy wojskowych: `loadMilitaryComponentKeys` (`power-objective.ts:194–205`), czyta `skladniki[*].wojskowy === true` z `data/power-params.json`.
- W `data/power-params.json` `wojskowy: true` mają dokładnie: `jednostka_wojskowa` (Armia, pkt 2,5) i `rekrut_ekw_jednostki` (Rekruci, pkt 10). Pozostałe składniki (w tym `wygrana_bitwa`, `ludek`, `miasto`, `tech_zbadane`, `kultura_imperium`, `religia_jednosc`) — brak flagi.
- Wniosek: suma składników z `military === true` = dokładnie Armia + Rekruci, czyli żądana miara (a). Wystarczy sumować `components.filter(c => c.military).map(c => c.points)`.
- UWAGA (C2): obecne `rw` NIE jest oparte na tej sumie — patrz p.3 C2.

### (b) Bitwy między parą od startu wojny — BRAK licznika (start wojny: TAK)

- Start wojny JEST zapisywany: `main.ts:11632–11641` `diploEnsureWarStart(a,b)` ustawia `wojnaStartTura` w `DiploPairMeta` (pole zdefiniowane w typie lokalnym `WarPairMetaR1`, `main.ts:11611–11615`). Zdejmowany przy pokoju w `diploWarStateFor` (`main.ts:11617–11624`). Ustawiany także przy pierwszym zaobserwowaniu wojny w bloku zmiany statusu (`main.ts:11551–11556`). Zapis `wojnaOdTury` (dla deklarującego) w `main.ts:11851` i `main.ts:12361`.
- Zastrzeżenie: stempel ustawiany jest leniwie (przy pierwszym zapytaniu), z tolerancją ≤1 tura (komentarz 11634–11637). Przy wczytywaniu zapisu z trwającą wojną stempel może zostać ustawiony na turę wczytania (ryzyko R3 w p.5).
- Licznik bitew: BRAK. `DiploPairMeta` (`gra/src/game/diplomacy-pn-engine.ts:69` (interfejs od linii 69; pole `wojnaOdTury` w linii 73), `freshDiploPairMeta` 143–145) nie ma pól wygranych/przegranych bitew. Jedyny istniejący hak to `applyMilitaryWinRespectEvent` (`main.ts:12478–12491`) — daje +5 Respektu TYLKO gdy wygrał GRACZ i przeciwnik nie jest barbarzyńcą (`militaryWinRespectPair`, `diplomacy.ts:1126–1138`). Bitwy AI↔AI nie są liczone. Wniosek: licznik trzeba dodać osobno, dla WSZYSTKICH właścicieli (nie tylko gracza).
- Istniejący licznik `wojnaMiasta` (`main.ts:11611–11615`, `utraty`) liczy utracone MIASTA, nie bitwy. Nie nadaje się do (b).
- NIE ZWERYFIKOWANO: dokładna funkcja końca bitwy wołająca `applyMilitaryWinRespectEvent` (miejsce wpięcia nowego licznika). Trzeba je ustalić przed wdrożeniem.

### (c) Pula rekrutów obu stron w chwili decyzji — TAK

- `rekrutEkw = rekrutUnitEquivalents(pobor.rekruci, epoka, mpMults.costMult)` — `main.ts:2795`, `main.ts:2850`, `main.ts:19901`. Funkcja: `gra/src/game/manpower.ts:590` `rekrutUnitEquivalents(rekruci, epoka, maxMult)`.
- Pole wejściowe: `power-objective.ts:39` (`rekrutEkw: number`, „Silnik liczy przed wywołaniem”). Składnik w Mocy: `power-objective.ts:244` (wojskowy).
- Pula jest liczona przy każdym budowaniu wejścia Mocy (per tura). W chwili decyzji dostępna jest wartość z bieżącej tury.

---

## 3. Ocena założeń 1–9 wobec kodu

Legenda: ZGODNE / SPRZECZNE (z dowodem) / BRAK (co dodać).

**Założenie 1 — parametr aktywny TYLKO w wojnie, po pokoju nie wpływa na dyplomację — SPRZECZNE WEWNĘTRZNIE (C1).**
- Założenie 1 mówi „tylko w wojnie”, a założenie 5 mówi, że parametr służy do WYPOWIEDZENIA wojny (`ai.ts:6852` itd. działają przed wojną). Oba nie mogą być prawdziwe dosłownie.
- Kod: pokój AI (`ai.ts:7121`, warunek `rel.stanWojny`) jest rzeczywiście ograniczony do wojny — ZGODNE dla pokoju. Wypowiedzenie wojny (ai.ts:6852–7312) używa `rw` przed wojną.
- Propozycja rozstrzygnięcia (ZAŁOŻENIE, p.8): dla wypowiedzenia wojny `militaryRatioWar` NIE jest definiowany (brak stanu wojny), a decyzja zostaje na obecnym progu `PROG_WOJNA_SILA = 0.6` (`ai.ts:6229`). Parametr działa wyłącznie w wojnie (pokój, rozejm, propozycje pokoju AI).

**Założenie 2 — wartość symetryczna, neutralna przy parytecie — ZGODNE.**
- `militaryPowerRatio(rw) = rw/(1−rw)` (`diplomacy-war-peace-profile.ts:314–318`); `rw` dla A i B sumuje się do 1 (`main.ts:24713`, `respektWzgledny = potProposer/potSum`), więc `ratio(B,A) = 1/ratio(A,B)`. Przy rw = 0,5 wynik = 1 (neutralnie). Zachowanie symetryczne.

**Założenie 3 — składniki (a) Armia+Rekruci, (b) bitwy, (c) pula — (a) SPRZECZNE z obecnym `rw` (C2), (b) BRAK, (c) ZGODNE.**
- (a): suma wojskowa możliwa (p.2a). ALE obecne `rw` pochodzi z PEŁNEJ Mocy: `main.ts:24700` `potProposer = objectivePowerByOwner.get(proposerId)?.power`, `main.ts:24713` `respektWzgledny = potProposer/potSum`. Pełna Moc zawiera gospodarkę, miasta, tech, kulturę (`power-objective.ts:240–258`). Dlatego zmiana na samą wojskowość zmienia także obecne progi AI (ai.ts:6229, 7121) — to decyzja do jawnego zatwierdzenia (p.8, Z-A).
- (b): BRAK licznika (p.2b).
- (c): ZGODNE (p.2c).

**Założenie 4 — start od zera przy wybuchu wojny, tylko bitwy z tej wojny — CZĘŚCIOWO ZGODNE.**
- Start: ZGODNE (`wojnaStartTura`, `main.ts:11632–11641`, czyszczony przy pokoju `main.ts:11621–11622`).
- Zerowanie licznika bitew: BRAK (licznik nie istnieje). Dodać jako pole wyzerowane przy starcie wojny (ten sam punkt co `wojnaStartTura`).

**Założenie 5 — zastosowanie: wypowiedzenie, przyjęcie rozejmu, przyjęcie pokoju, propozycje pokoju AI; ta sama miara dla gracza i AI — SPRZECZNE (C3) dla „tej samej miary”.**
- Gracz (ocena propozycji): `diplomacy-proposals.ts:389, 1222, 1535, 1863` używają `ctx.militaryRatio`, a ten jest liczony w `main.ts:24708` jako `militaryRatioFromArmyM(sumArmyMForOwner(proposerId), sumArmyMForOwner(responderId))` (`main.ts:2764`, armia M, nie Moc).
- AI (decyzje): `ai.ts:6952–6957` liczy `militaryRatio = rw/(1−rw)` z `rw` (udział Mocy, p.3 C2).
- Dwie różne miary dla tej samej decyzji. Wdrożenie „tej samej miary” wymaga ujednolicenia obu ścieżek na nowy parametr.

**Założenie 6 — NIE wchodzi do Power, Respektu, Zaufania, etykiet; brak bonusów +15/−10 i brak zaniku — SPRZECZNE w definicjach, ZGODNE w działaniu.**
- Power: nie zmieniony przez parametr (ZGODNE).
- Respekt: wzór `round(100·P_self/(P_self+P_partner))` (`diplomacy.ts:1701–1712`, `computeRespekt`) zostaje (ZGODNE).
- Bonusy +15/−10: definicje ISTNIEJĄ — `diplomacy.ts:875–876` (typy `przewaga_militarna`, `slabszy_militarnie`), `diplomacy.ts:1017–1024` (przypisanie +15 i −10), `data/diplomacy.json:14–15` (`przewagaMilitarna_respekt: 15`, `slabszyMilitarnie_respekt`), `gra/src/game/diplomacy-factors.ts:73` (etykieta). Wywołania: wyszukiwanie w `gra/src` po `'przewaga_militarna'` i `'slabszy_militarnie'` dało TYLKO definicje, przypisanie i etykietę — brak miejsca, które faktycznie je emituje. Zdarzenia są uśpione. Rekomendacja: usunąć definicje (p.7 K8), nie reaktywować.
- Zanik po 10 turach: brak takiego mechanizmu dla tych zdarzeń (ZGODNE, nie ma czego usuwać).

**Założenie 7 — progi: przewaga od 1,5× (≈50%), słabszy symetrycznie od 1/1,5, między neutralnie — SPRZECZNE (C4).**
- Zatwierdzony próg dla blokady pokoju / „niedoboru”: `data/diplomacy-war-peace-params.json:89` `przewagaMilitarna.prog = 0.2` (20%, epsilon 1e-9), opis z decyzją właściciela 2026-11-09: „liczba 20% nie do negocjacji”. Klasy: `diplomacy-war-peace-profile.ts:327–336` (`militaryAdvantageClass`): przewaga gdy ratio > 1,2; niedobór gdy ratio ≤ 0,8.
- Próg 1,5× (rw ≈ 0,6) istnieje TYLKO jako `PROG_WOJNA_SILA = 0.6` (`ai.ts:6229`) — dotyczy wypowiedzenia wojny.
- Wniosek: 1,5× z dodatku to nie jest wartość z zatwierdzonego progu pokoju (20%). Nie wybieram sam (zakaz z CLAUDE.md §ABC). Patrz ZAŁOŻENIE Z-D.

**Założenie 8 — wynik w UI w panelu wojny, nie wpływa na Respekt — CZĘŚCIOWO ZGODNE / NIE ZWERYFIKOWANO szczegółów.**
- Pomocniki UI: `gra/src/game/diplomacy-display.ts` (`effectiveNastawienieScores` 349–356, `warRelationCapApplies` 360–364). Panel dyplomacji: `gra/src/ui/diplomacyPanel.ts`. Konkretne miejsce panelu wojny NIE ZWERYFIKOWANO. Brak istniejącego pola `militaryRatioWar` w UI (BRAK, do dodania).

**Założenie 9 — nazwa: rekomendacja „Stosunek militarny” (UI), `militaryRatioWar` (kod) — p.6.**

### 3a. Clamp wojenny — odpowiedź na pytanie z dodatku (gdzie wpływa na wartość Respektu)

- `clampRelationForWar` (`diplomacy.ts:1141–1153`): gdy `wojna` i score (Zaufanie + Respekt) > 29 (`WAR_RELATION_SCORE_CAP`, `diplomacy.ts:21`), najpierw obcina Zaufanie, a nadwyżkę odejmuje od Respektu. Zmienia więc ZAPISANE wartości, nie tylko etykietę.
- Wywołania zmieniające zapisany stan: `diplomacy.ts:1094` (`applyDiplomaticEvent`) i `diplomacy.ts:1860` (`tickDiplomacy`). Stąd zapisany Respekt w wojnie jest obcinany do 29 minus Zaufanie.
- Wywołania w ocenie propozycji (progi PN, nie stan): `diplomacy-proposals.ts:713, 1415, 1439–1440, 1475`; komentarz `diplomacy-ai-offer-balance.ts:539`.
- Wyświetlanie: `diplomacy-display.ts:349–352` mówi, że limit nie obcina wartości w panelu. To prawda tylko dla bieżącego odczytu: wartości zapisane w tick są już obcięte. Stąd dodatek (usunięcie clampa) zmieni WARTOŚĆ Respektu w wojnie, nie tylko etykietę. Wymaga jawnej decyzji (Z-B).
- Etykieta „Wrogi” w wojnie opiera się na tym samym limicie (`warRelationCapApplies`, `diplomacy-display.ts:360–364`, dopisek „limit wojenny 29”). Usunięcie clampa z tick wymaga osobnej reguły etykiety, inaczej etykieta w wojnie przestanie gwarantować „co najmniej wrogi”.

### 3b. Respekt AI wobec gracza po przewadze — kontekst

- Respekt jest liczony z `computeRespekt(potProposer, potResponder)` (`main.ts:24702–24703`), czyli z PEŁNEJ Mocy. Wzrost siły wojskowej przy stałej gospodarce zmienia Respekt tylko częściowo.
- Zdarzenie `wygrana_bitwa` (+5): `main.ts:12478–12491` i `diplomacy.ts:1012–1015`. Dotyczy tylko zwycięstw gracza nad nie-barbarzyńcą.

---

## 4. Proponowana struktura danych i wzór (do akceptacji; wartości domyślne = ZAŁOŻENIA)

### 4a. Pola stanu pary (rozszerzenie `DiploPairMeta`, `diplomacy-pn-engine.ts:69`, wszystkie OPCJONALNE)

- `wojnaStartTura?: number` — ISTNIEJE (main.ts:11614), bez zmian.
- `wojnaBitwy?: { od: number; wygraneA: number; przegraneA: number }` — NOWE. Zapis przy zakończeniu bitwy między parą, dla WSZYSTKICH właścicieli (nie tylko gracza). Orientacja „A” = właściciel o niższym id w kluczu pary; przy odczycie z drugiej strony zamiana. Reset przy starcie wojny (ten sam punkt co `wojnaStartTura`, `main.ts:11632–11641`).
- Składnik wojskowy i pula NIE są zapisywane — liczone na żądanie z `computeObjectivePower` (p.2a) i `rekrutUnitEquivalents` (p.2c), żeby nie dublować stanu.

### 4b. Wzór (propozycja; wagi = ZAŁOŻENIE Z-C)

Dla pary (A, B) w wojnie:

- `R_sila = S/(1−S)`, gdzie `S = siłaWojskowa_A / (siłaWojskowa_A + siłaWojskowa_B)` (Armia+Rekruci z p.2a; gdy suma = 0 → R_sila = 1).
- `R_bitwy = (1 + wygraneA) / (1 + przegraneA) ÷ ((1 + wygraneB) / (1 + przegraneB))` — gdzie „wygrane A” to wygrane A nad B. Zero bitew → 1. (Uwaga: w tej postaci liczymy z perspektywy A; dla B odwrotność.)
- `R_pula = (1 + pulaA) / (1 + pulaB)`, pula = rekrutEkw (p.2c). Zero/zero → 1.
- `militaryRatioWar(A→B) = R_sila · R_bitwy · R_pula`.
- Symetria: `militaryRatioWar(B→A) = 1 / militaryRatioWar(A→B)` z konstrukcji (każdy czynnik to iloraz). Neutralność: parytet sił, zero bitew, równe pule → 1.
- Progi (w skali logarytmicznej, żeby zachować symetrię): przewaga gdy `ln(ratio) ≥ ln(1,5)`; słabszy gdy `ln(ratio) ≤ −ln(1,5)`; między — neutralnie. Wartość 1,5 jest ZAŁOŻENIEM Z-D (sprzeczne z 20% w params), nie wpisuję jej w kod bez decyzji.
- Zakres: `(0, +∞)` teoretycznie; w praktyce ograniczyć `clamp(ratio, 1/K, K)` z K = ZAŁOŻENIE (np. 4), żeby jeden czynnik nie zdominował wartości.

### 4c. Gdzie liczyć

- Funkcja czysta (bez silnika) w nowym pliku, np. `gra/src/game/diplomacy-military-ratio-war.ts`, wejście: `{ silaA, silaB, wygraneA, przegraneA, wygraneB, przegraneB, pulaA, pulaB }`. Test jednostkowy w `tools/` w stylu istniejących testów (np. `tools/diplo-peace-balance-accept-test.cjs`).

---

## 5. Ryzyka (z dowodem)

- R1 — Zmiana miary `rw` z pełnej Mocy na wojskowość zmienia progi AI poza wojną: `ai.ts:6229` (PROG_WOJNA_SILA) i `ai.ts:6957` (`militaryRatio`) są używane przy wypowiadaniu wojny (ai.ts:6852–7312). Ryzyko zmian zachowania AI na całej mapie. Test: `tools/diplo-war-peace-sim-test.cjs` (ustawia `przewagaMilitarna.prog = 1000` do wyłączenia klasy; sprawdzić, czy sim zostaje zgodny po zmianie miary).
- R2 — Dwie miary w jednej decyzji (C3): `diplomacy-proposals.ts:389/1222/1863` (army M przez `main.ts:24708`) vs `ai.ts:6957` (rw). Ujednolicenie zmienia wyniki ocen gracza. Dotyczy testów `tools/diplomacy-proposal-test.cjs`.
- R3 — Zapisy gry (migracja): `DiploPairMeta` jest zapisywany w całości (`main.ts:11610`, „save/load przenosi cały obiekt meta”), więc nowe pola opcjonalne są bezpieczne. Ryzyko: wojna trwająca w chwili wczytania zapisu bez `wojnaBitwy` dostanie stempel startu = tura wczytania (`main.ts:11634–11641`, ZAŁOŻENIE ≤1 tura). Efekt: licznik i start od zera przy wczytaniu. Trzeba zdecydować, czy migrować (w zapisach bez pola wstawić `0`), czy akceptować reset (Z-E).
- R4 — Clamp wojenny (`diplomacy.ts:1141`) usunięty z tick (`diplomacy.ts:1860`) i z zastosowania (`diplomacy.ts:1094`): zmiana zapisanego Respektu w wojnie, a także progów PN w propozycjach (`diplomacy-proposals.ts:713, 1415, 1439–1440, 1475`). Testy z limitem: `tools/diplomacy-test.cjs`, `tools/wiarygodnosc-test.cjs`, `tools/diplomacy-respect-true-value-real-render-test.cjs`, `tools/diplomacy-relation-value-mismatch-live-test.cjs`, `tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs`.
- R5 — Etykieta „Wrogi” w wojnie zależy od clampa (`diplomacy-display.ts:360–364`). Bez clampa trzeba osobnej reguły etykiety.
- R6 — Testy zdarzeń Respektu: `tools/diplo-respect-military-events-test.cjs` (wygrana_bitwa, przewaga_militarna). Zmiana definicji `przewaga_militarna`/`slabszy_militarnie` (p.7 K8) wymaga aktualizacji tego testu.
- R7 — Test progu pokoju (20%): `tools/diplo-peace-balance-accept-test.cjs` (P0: `przewagaMilitarna.prog === 0.2`, G7 skrajne rw). Nowy próg 1,5× nie może nadpisać `przewagaMilitarna.prog` bez jawnej decyzji (konflikt z C4).
- R8 — UI: `diplomacy-display.ts` i panel dyplomacji. Nowa pozycja „Stosunek militarny” w panelu wojny: pole nie może zmieniać Respektu (zał. 8).
- R9 — Rust port: `rust-port/` ma lustro logiki dyplomacji (wpisy REPIN dotyczące DYPLOMACJA-DANE, np. #223, #210). Zmiana miary wymaga REPIN; poza tym tematem (zakaz zmian `rust-port/`).

---

## 6. Nazwa

- Rekomendacja „Stosunek militarny” (UI) / `militaryRatioWar` (kod): POTWIERDZAM z zastrzeżeniem.
- Wyszukiwanie kolizji (`gra/src`, `gra/data`, `docs`, `wiki`) dla „Stosunek militarny”, `militaryRatioWar`, „Przewaga wojenna”, `warAdvantage`: ZERO trafień. Brak kolizji tekstowej i identyfikatorowej.
- Kolizja pojęciowa (C8): identyfikator `militaryRatio` jest już w użyciu dla innej miary (`diplomacy-proposals.ts` `ctx.militaryRatio`, `ai.ts:6957`, `diplomacy.ts:83–86`, `main.ts:24708`). `militaryRatioWar` nie koliduje dosłownie, ale rodzina nazw jest myląca. Zalecenie: nie używać `militaryRatio` dla nowej miary; w kodzie zostawić `militaryRatioWar`.
- „Przewaga wojenna” odrzucone słusznie: zbliża się do istniejącego terminu „przewaga militarna” (`przewagaMilitarna`, zdarzenia `przewaga_militarna`), co grozi pomyłką. Rekomendacja pozostaje bez zmian.
- Ryzyko z Polską terminologią: „Stosunek militarny” nie występuje w danych ani wiki (ZERO trafień). Dodać do słownika przy wdrożeniu.

---

## 7. Kolejność wdrożenia (małe kroki)

- K1 — Czysta funkcja `militaryRatioWar` (nowy plik, p.4c) + test w `tools/`. Bez podpięcia. Bramki: tsc + test nowego pliku.
- K2 — Pomocnik sumy wojskowej z `computeObjectivePower` (suma składników `military === true`) + test: suma = Armia + Rekruci (na danych z `data/power-params.json`).
- K3 — Pola `wojnaBitwy` w `DiploPairMeta` (`diplomacy-pn-engine.ts`), reset przy starcie wojny (`main.ts:11632–11641`), zapis przy zakończeniu bitwy dla WSZYSTKICH właścicieli (miejsce do ustalenia, NIE ZWERYFIKOWANO). Test: AI↔AI też zapisuje.
- K4 — Migracja zapisów (Z-E) i test wczytania starego zapisu.
- K5 — Podpięcie do pokoju/rozejmu (ai.ts:7118–7150; diplomacy-proposals.ts:1328, 2279; main.ts:12060, 21564) PO ujednoliceniu miary (C3) i decyzji o C2.
- K6 — Wypowiedzenie wojny (ai.ts:6852–7312) — tylko po rozstrzygnięciu C1 (p.3 zał. 1).
- K7 — UI: pozycja w panelu wojny (`diplomacyPanel.ts` / `diplomacy-display.ts`), bez wpływu na Respekt.
- K8 — Usunięcie uśpionych zdarzeń `przewaga_militarna` / `slabszy_militarnie` (`diplomacy.ts:875–876, 1017–1024`, `data/diplomacy.json:14–15`, `diplomacy-factors.ts:73`) — dopiero po decyzji Z-A.
- K9 — Usunięcie clampa wojennego z tick i zastosowania (`diplomacy.ts:1094, 1860`) + reguła etykiety (R5) — osobny temat, po decyzji Z-B.

---

## 8. Lista ZAŁOŻEŃ DO POTWIERDZENIA (kod nie rozstrzyga; podano wartość domyślną)

- Z-A — Miara dla AI: obecne `rw` (pełna Moc) czy nowa miara wojskowa (Armia+Rekruci) dla decyzji AI. Domyślnie: NOWA miara tylko dla parametru `militaryRatioWar`; `rw` i progi AI (ai.ts:6229, 7121) zostają bez zmian, dopóki nie zapadnie decyzja o zmianie ich miary.
- Z-B — Clamp wojenny: usunięcie z tick (diplomacy.ts:1860) zmienia zapisany Respekt. Domyślnie: clamp zostaje w tick i w zastosowaniu do momentu osobnej decyzji (K9); parametr `militaryRatioWar` NIE zmienia Respektu.
- Z-C — Wagi składników w `militaryRatioWar`: domyślnie równe (wykładnik 1 dla każdego z trzech czynników). Wartość K obcięcia: domyślnie 4.
- Z-D — Próg przewagi: domyślnie NIE 1,5×, lecz osobny parametr w `diplomacy-war-peace-params.json` (nie zmieniać `przewagaMilitarna.prog = 0.2`). Wartość startowa do dyskusji: 1,5× (ln 1,5) dla nowego parametru, zgodnie z dodatkiem, bez zmiany istniejącego 20%.
- Z-E — Zapisy gry: domyślnie stary zapis wczytuje `wojnaBitwy` jako brak = 0 bitew, a stempel startu wojny zostaje jak dziś (akceptacja resetu przy wczytaniu wojny trwającej).
- Z-F — Zdarzenia +15/−10: domyślnie usunąć definicje (K8). Nie reaktywować bonusów.
- Z-G — Start wojny dla wypowiedzenia: domyślnie `militaryRatioWar` nie jest liczony przed wojną (zał. 1); decyzja wypowiedzenia zostaje na `PROG_WOJNA_SILA = 0.6`.

---

## 9. Testy (lista do napisania / sprawdzenia przy wdrożeniu)

- T1 — Symetria: `militaryRatioWar(A→B) · militaryRatioWar(B→A) = 1` dla losowych danych.
- T2 — Parytet: wszystkie czynniki równe → wynik 1; zero bitew, równe pule → wynik = R_sila.
- T3 — Suma wojskowa (K2): Armia + Rekruci z `power-objective.ts`, bez gospodarki.
- T4 — Start od zera: nowa wojna resetuje `wojnaBitwy`; pokój czyści stempel (istniejące `main.ts:11621–11622`).
- T5 — Licznik bitew dla AI↔AI (K3): zapis obu stron.
- T6 — Migracja: stary zapis bez pól wczytuje się bez błędu (wzorzec `freshDiploPairMeta`).
- T7 — Brak wpływu na Respekt/Zaufanie/Power: porównanie przed/po dla pustego licznika bitew.
- T8 — Istniejące testy progu 20% (`tools/diplo-peace-balance-accept-test.cjs`) nadal zielone.
- T9 — Istniejące testy zdarzeń Respektu (`tools/diplo-respect-military-events-test.cjs`) po K8 — zaktualizowane zgodnie z decyzją Z-F.
- T10 — Test wojny AI (`tools/diplo-war-peace-sim-test.cjs`) po K5/K6.

---

## 10. Bramki i dowody

- Zmian kodu NIE wykonano. `tsc` i 5 bramek referencyjnych: NIE_DOTYCZY (zgodnie z dispatchem, „Zmian kodu NIE ma”).
- Allowlista: wyłącznie `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/`. Zero zmian w `gra/`, `gra-robocza/`, `rust-port/`, `WERSJE.md`, `REJESTR`.
- Dowody plik:linia: sprawdzono wszystkie cytowane linie `grep`/`sed` na bazie 5d0c5f8d1. Evaluator powinien sprawdzić przynajmniej 5 losowych odwołań (np. `main.ts:24713`, `diplomacy.ts:1141`, `ai.ts:6229`, `data/diplomacy-war-peace-params.json:89`, `power-objective.ts:244`).
- Kryterium „brak słowa ‘pytanie’ w sekcji ZAŁOŻENIA DO POTWIERDZENIA”: sekcja p.8 nie zawiera tego słowa (sprawdzone przed zapisem commita).

---

RUNDY: 1/5
BLOKADY: brak blokad wykonania. Zastrzeżenia: (1) dispatch nieobecny na origin/main, odczytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; (2) NIE ZWERYFIKOWANO: miejsce wpięcia końca bitwy dla licznika, UI wypowiedzenia wojny przez gracza, funkcje otoczki wojny wymuszonej, szczegóły `forced-war-*.ts`.
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu (allowlista), 5 losowych dowodów plik:linia, kompletność p.1–7. Orkiestrator — decyzje Z-A, Z-B, Z-D przed jakimkolwiek K1.
DEPLOY/PUSH: NIE WYKONANO
