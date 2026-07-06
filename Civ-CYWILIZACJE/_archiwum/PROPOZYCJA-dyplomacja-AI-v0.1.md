# PROPOZYCJA: Dyplomacja · AI · Cywilizacje — projekt v0.1

> **ARCHIWUM:** kopia w `_archiwum/PROPOZYCJA-dyplomacja-AI-v0.1.md` (2026-06-26).  
> Aktualny kanon: `SPEC-Respekt.md`, `D3-dyplomacja.md`, `diplomacy.ts`.

> **Autor:** Analityk CYWILIZACJE (Sonnet)  
> **Data:** 2026-06-25  
> **Status:** Propozycja projektowa — czeka na decyzje Macieja (§5)  
> **Źródła:** `Dyplomacja-szablon.md`, `Dyplomacja-zasady.md`, `diplomacy.ts`, `ai.ts`, `civs.json`, `diplomacy.json` (panel A–F), `DOKUMENTACJA-DEV-CYWILIZACJE.md`  
> **Reguła:** ten plik = tylko projekt/propozycja; nie modyfikuje kodu ani danych JSON

---

## 1. STAN OBECNY (szczera ocena)

### 1.1 Co JEST i działa (przetestowane)

**Model dyplomacji (`diplomacy.ts` + `diplomacy.json`):**

- `Relacja = Zaufanie + Respekt` (0–200), dwie składowe 0–100; clampowane; immutable
- **Zaufanie** sparametryzowane: 21 zdarzeń jednorazowych (`DiplomaticEvent`), 8 stanów per-turę — wszystkie wartości w `DIPLOMACY_PARAMS` z override z `diplomacy.json["params"]`; odczyt z panelu Excel działa przez `loadDiplomacyParams()`
- **12 akcji dyplomatycznych** — zdefiniowane w `Dyplomacja-szablon.md` i `diplomacy.json["akcje_dyplomatyczne"]`; warunki dostępności i progi udokumentowane
- **`aiDiplomacyStance()`** — zwraca `{ willingnessWar, willingnessPeace, willingnessTrade, willingnessAlly }` ∈ [0,1]; obsługuje 8 archetyp. + DrobnaCywilizacja; logika na Zaufanie/Respekt/archetyp/turysWojny/militaryRatio
- **Tiery relacji** `relationTier()`: 5 poziomów (Wojna → Sojusz); `status` nadrzędny nad wynikiem
- **Startery relacji** `initialRelation()`: korekty za rywalizację w typie (−20 Zaufanie) i różnicę kulturową (−5 Zaufanie)
- **90 asercji** w `diplomacy-test.cjs` — test zielony, `tsc` czysty (strict)

**Model AI (`ai.ts`):**

- `decideAITurn()` — produkcja (priorytety per faza + zagrożenie + archetyp + trudność), ruch (osadnik/wojsko/fallback 4f), atak, eksploracja wiosek, patrol
- `chooseAIResearch()` — heurystyka punktowa z prereq-check, archetype-delta, faza, zagrożenie
- `loadDifficultyParams()` — 3 poziomy trudności (bonusy produkcja/nauka/jednostki/walk)
- Archetypy: 9 cyw. mapowane na AI-params; delta `{wojsko, nauka, ekonomia, obrona}` per archetyp

**Dane (`civs.json`, `diplomacy.json`):**

- 9 cywilizacji: styl, jednostka spec., bonus (freetext), religia, klaster (10 nazw), mnożnikHandelPieniądz, ikonaId
- Panel dyplomacji A–F w JSON: wagi Respektu (A), stałe modelu (B), progi akcji (C), tempo Zaufania per-turę (D), mnożniki (E), kalkulator (F)

**Testy łącznie:** ~200 asercji (diplomacy: ~100, ai: ~55, research: ~22, barbarians: ~25).

---

### 1.2 Czego BRAK lub co jest MARTWE

| Obszar | Status | Skutek |
|--------|--------|--------|
| **Respekt nie jest liczony** | Panel A definiuje wagi (25/20/18/15/12/10%), ale ŻADEN moduł nie wywołuje formuły zbierającej dane wejściowe (ratio wojsk, bitwy, miasta, gospodarka, epoka) | Respekt w praktyce zmienia się tylko przez zdarzenia jednorazowe (`wygrana_bitwa +5`, `przewaga_militarna +15`); brak automatycznej aktualizacji z gamestate |
| **Brak tury dyplomacji (tick)** | `applyDiplomaticEvent()` jest czyste — per-turowe delty (`+1 handel`, `−2 ekspansja` itp.) nie są wywoływane przez żaden silnik | Zaufanie nie zmienia się co turę nawet gdy umowy handlowe są aktywne |
| **AI nie inicjuje dyplomacji** | `aiDiplomacyStance()` istnieje, ale `decideAITurn()` nie wywołuje jej i nie generuje komend dyplomatycznych (`AIDiplomacyCommand` — nie istnieje jako typ) | AI nigdy samo nie proponuje pokoju, handlu, sojuszu; dyplomacja = tylko reakcja na gracza |
| **`decideAIDiplomacy()` — nie istnieje** | Brak funkcji mapującej `AIDiplomacyStance` → konkretną decyzję/propozycję | Logika stance jest obliczona, ale nigdy nie przekładana na akcję |
| **Handel niezmechanizowany** | Parametry umów handlowych są opisane w JSON; brak modelu stanu umowy (typ, czas, wartość transferu) | AI i gracz nie mogą faktycznie zawrzeć umowy z efektami ekonomicznymi |
| **Bonusy cywilizacji opisowe (freetext)** | `civs.json["Bonus startowy"]` = string; `ai.ts` archetyp = delta priorytety produkcji/nauki — to jedyny mechaniczny efekt; inne bonusy (np. „silna obrona piechoty Greków", „bonus w lesie Inkowie") nie istnieją w kodzie | Każda cywilizacja oprócz AI-priorytetu ma takie same mechaniczne zasady |
| **Wszystko NIEWPIĘTE do pętli tury** | Dyplomacja, AI-dyplomacja, per-turowe delty — kontrakt między CYWILIZACJE a SILNIK opisany w dokumentacji, ale SILNIK nie wywołuje tych funkcji | Gra działa, ale AI gra bez dyplomacji i bez efektów cywilizacji |
| **Brak systemu negocjacji** | Model akcja→efekt (jednorazowo); brak wielokadencyjnych negocjacji z kontrpropozycjami dla głównych rywali | Dyplomacja = kliknij akcję → dostaniesz delta; bez targowania |
| **Enum `TypCywilizacji`** | Zawiera 7 typów + `DrobnaCywilizacja`; brak Celtów i Germanów (są w civs.json i ai-params.json, ale nie w enumie); `Babilon` jest bridge dla Sumerów | Mismatch danych i kodu; fallback na archetyp Greków dla Celtów/Germanów |

---

## 2. WIZJA — jak to widzę (konkretna, per temat)

### 2.1 Respekt — jak liczyć

**Dane wejściowe z panelu A (`diplomacy.json["respekt_-_czynniki"]`):**

| Czynnik | Waga | Źródło danych |
|---------|------|---------------|
| Stosunek wojska (ratio) | 25% | UNITS: liczba jed. bojowych self / liczba jed. partner |
| Wygrane bitwy (historia) | 20% | UNITS/SILNIK: kumulatywny licznik `victoriesCount` |
| Absolutna liczba jednostek | 18% | UNITS: `myUnits.length` (bojowych) |
| Liczba miast + terytorium | 15% | MIASTO/EKONOMIA: `myCities.length` |
| Gospodarka / surowce | 12% | EKONOMIA: poziom ekonomiczny (Pieniądz/tura lub liczba dostępnych surowców) |
| Epoka tech. | 10% | CYWILIZACJE: indeks najwyższej zbadanej epoki (0=Kamień, 1=Brąz, …) |

**Wzór `computeRespekt(inputs, partner_inputs, wagi)` → liczba 0–100:**

```
rawScore =
  wagi.wojskoRatio  × clamp(self.militaryCount / (partner.militaryCount || 1), 0, 3) / 3
+ wagi.bitwy        × clamp(self.victoriesCount / 20, 0, 1)
+ wagi.absolutnaArm × clamp(self.militaryCount / 15, 0, 1)
+ wagi.miasta       × clamp(self.citiesCount / 10, 0, 1)
+ wagi.gospodarka   × clamp(self.economyLevel / 100, 0, 1)
+ wagi.epoka        × (self.eraIndex / 3)

Respekt = clamp(rawScore × 100, 0, 100)
```

Respekt jest liczony **względem konkretnego partnera** (wartość `militaryCount` partnera wchodzi do mianownika ratio). To oznacza, że ta sama cywilizacja może mieć Respekt 70 wobec słabego sąsiada i 20 wobec mocniejszego.

**Kto agreguje:** CYWILIZACJE dostarcza czystą funkcję `computeRespekt(inputs, partnerInputs, wagi)`. SILNIK odpytuje poszczególne moduły (UNITS → militaryCount/victories; MIASTO → citiesCount; EKONOMIA → economyLevel; CYWILIZACJE → eraIndex) i wywołuje funkcję **raz per turę per para** aktywnych graczy. Wynik jest zapisywany do `RelacjaDyplomatyczna.respekt` przez SILNIK przez `applyDiplomaticEvent('przewaga_militarna'/'slabszy_militarnie')` lub bezpośrednie przypisanie — decyzja architektoniczna dla SILNIKA.

**Kiedy liczyć:** raz per tura, na końcu tury; zmiana Respektu o ≥5 punktów → trigger eventu (np. flaga „przewaga militarna" lub „gracz słabszy") wywoływana przez SILNIK.

---

### 2.2 Zaufanie — stan obecny i dostrojenie

Mechanizm jest kompletny i przetestowany. Poniżej lista zdarzeń budujących (+) i niszczących (−) Zaufanie — z podziałem na jednorazowe i per-turę:

**Jednorazowe (`applyDiplomaticEvent`):**

| Zdarzenie | Δ Zaufanie |
|-----------|-----------|
| Zawarcie umowy handlowej | +2 |
| Podarunek (dar) | +6 × mnożnik |
| Pomoc sojusznikowi | +10 |
| Wspólny wróg (nawiązanie) | +5 |
| Wymiana tech gratis | +5 |
| Pokój | +5 |
| Złamany pakt przez gracza | −40 |
| Zdrada / atak z zaskoczenia | −50 |
| Złamany pakt przez AI | −20 |
| Wypowiedzenie wojny (bez c.b.) | −20 |
| Ultimatum bezpodstawne | −10 |
| Trybut odmowa | −10 |
| Rywalizacja tego samego typu (start) | −20 |
| Różnica kulturowa (start) | −5 |

**Per-turę (SILNIK musi wywoływać):**

| Stan | Δ/turę | Max |
|------|--------|-----|
| Aktywny handel | +1 | — |
| Aktywny pakt (NAP/sojusz) | +1 | — |
| Efekt podarunku | +1 | 5 tur |
| Wspólny wróg (kooperacja) | +1 | — |
| Wspólna religia | +0.5 | +15 |
| Odmienna religia | −0.5 | −10 |
| Ekspansja przy granicy | −2 | — |
| Urazy historyczne (zanikające) | −2 | co 20 tur zanika |

**Dostrojenie:** model jest dobrze skalibrowany. Jedyna kwestia do rozważenia: aktualny start Zaufania = 20 (neutralni) oznacza, że gracze tego samego typu startują z Zaufaniem = 0 (po korekcie −20) — Relacja = 30, tuż nad progiem dyplomacji (30). To celowe (napięcie rywalizacyjne), ale warto to potwierdzić grając.

---

### 2.3 Wymiana handlowa — reguły

Handel jest zdefiniowany w `Dyplomacja-szablon.md §1.5` i panelu akcji, ale niezmechanizowany. Poniżej propozycja modelu:

**Co może być przedmiotem wymiany:**
- Pieniądz (wymaga Waluty u obu stron)
- Surowce strategiczne (dostęp boolean, epoka Brąz+)
- Praca (rzadko; jednorazowe transakcje)

**Typy umów:**
1. **Jednorazowa:** natychmiastowy transfer X za Y; brak stanu długotrwałego
2. **Wieloturowa** (tylko Główni rywale): stan `{czas_trwania, self_daje_per_tura, partner_daje_per_tura}`; trwa N tur

**Efekty na relacje:**
- Zawarcie: `handel` → +2 Zaufanie jednorazowo
- Co turę aktywnej umowy: +1 Zaufanie/turę (SILNIK)
- +2 Relacja ogólna/turę (z opisu akcji 5 w Dyplomacja-szablon) — to jest suma: +1 Zaufanie + +1 Respekt/turę (?), lub po prostu +2 Zaufanie? Rekomendacja: traktować jako +1 Zaufanie/turę (spójne z `DIPLOMACY_PARAMS.handel_zaufanie_perTura = 1`) + Respekt bez zmiany
- Zerwanie przez gracza: `zlamana_obietnica` → −40 Zaufanie; przez AI: `zlamana_obietnica_ai` → −20 Zaufanie; +15 Relacja kara z szablonu rozbita na: −15 Zaufanie (nie −40) — **tu jest niespójność między szablonem (−15 ogólna) a kodem (−40)**; do decyzji czy wzmocnić

**Styk z EKONOMIA:** transfer Pieniędzy/surowców musi przechodzić przez EKONOMIA (skarbiec gracza/AI). CYWILIZACJE definiuje warunki, SILNIK wykonuje transfer.

---

### 2.4 Rozmowy między nacjami (negocjacje)

**Architektura:** model akcja→efekt (jednorazowy), bez negocjacji wielokadencyjnych. Dla v0.1 jest to odpowiednie.

**12 akcji dyplomatycznych z dostępnością per tier i reakcją AI:**

| Akcja | Warunek gracza | Reakcja AI (`willingnessX`) | Dostęp dla Drobnych |
|-------|---------------|------------------------------|---------------------|
| 1. Nawiązanie kontaktu | — | — | TAK |
| 2. Pakt NAP | Relacja ≥ 30 | willingnessPeace > 0.3 | UPR (auto 10 tur) |
| 3. Sojusz wojskowy | Zaufanie ≥ 60, Relacja ≥ 120 | willingnessAlly > 0.5 | NIE |
| 4. Otwarte granice | Relacja ≥ −10 (= 0+) | willingnessTrade > 0.4 | UPR (cywilne) |
| 5. Umowa handlowa | Relacja ≥ 30 | willingnessTrade > 0.5 | UPR (jednorazowa) |
| 6. Wymiana technologii | Zaufanie ≥ 70 | willingnessAlly > 0.6 | NIE |
| 7. Wspólny wróg | Relacja ≥ 10 | spec. logika (relacja vs cel) | NIE |
| 8. Trybut (żądanie) | Respekt self ≥ partner + 20 | fearFactor > 0.7 | TAK |
| 9. Ultimatum | Respekt ≥ 50 lub c.b. | fearFactor | UPR (poddanie) |
| 10. Pokój | w stanie `'wojna'` | willingnessPeace > 0.4 | TAK |
| 11. Wypowiedzenie wojny | — | — | TAK |
| 12. Wasalizacja/wchłonięcie | Respekt ≥ 70 / ≥ 90 | fearFactor > 0.8 | TAK |

**Model reakcji AI:** TAK/NIE (bez kontrpropozycji) dla v0.1. AI akceptuje gdy `willingnessX > próg`; inaczej odrzuca. Progi ww. należy skalibrować w testach. Wielokadencyjne negocjacje z kontrpropozycjami — v0.2+.

---

### 2.5 AI uprawia dyplomację — zarys `decideAIDiplomacy()`

Aktualnie ta funkcja **nie istnieje**. `aiDiplomacyStance()` zwraca gotowości, ale nikt ich nie konsumuje. Poniżej zarys funkcji do zaimplementowania:

```typescript
// Nowa funkcja (nie istnieje jeszcze w ai.ts)
export function decideAIDiplomacy(
  aiPlayerId: number,
  allPlayers: Player[],
  relations: Map<string, RelacjaDyplomatyczna>,
  ctx: { currentTurn: number; militaryRatios: Map<string, number>; turnsAtWar: Map<string, number> }
): AIDiplomacyCommand[]
```

**Logika decyzji (pseudokod):**

```
Dla każdego gracza-partnera P (z którym AI ma nawiązany kontakt):
  stance = aiDiplomacyStance(AI, P, rel, ctx)
  
  JEŚLI status='pokoj' I stance.willingnessWar > 0.7 I brak aktywnych paktów:
    → deklaruj wojnę (komenda: `wypowiedzWojne`)
  
  JEŚLI status='wojna' I stance.willingnessPeace > 0.5:
    → proponuj pokój (komenda: `proponujPokoj`)
    (priorytet: pokój > sojusz > handel)
  
  JEŚLI status='pokoj' I stance.willingnessTrade > 0.6 I relacja ≥ 30 I brak aktywnej umowy:
    → proponuj handel (komenda: `proponujHandel(wartość=AI_economy×0.1)`)
  
  JEŚLI status='pokoj' I stance.willingnessAlly > 0.5 I Zaufanie ≥ 60:
    → proponuj sojusz (komenda: `proponujSojusz`)
  
  JEŚLI status='pokoj' I Respekt[AI wobec P] > Respekt[P wobec AI] + 20:
    → żądaj trybutu (komenda: `zadajTrybut(kwota=10 Pieniędzy/turę)`)
```

**Częstotliwość:** AI inicjuje dyplomację raz na N tur (np. co 10 tur) per partner. Zapobiega to spamowi propozycji.

**Archetyp wpływa na priorytety:** Zulusi (agresja 0.90) wcześniej osiągają próg `willingnessWar > 0.7`; Chińczycy (handel 0.85) wcześniej proponują handel; Inkowie (lojalność) rzadziej inicjują wojnę.

---

### 2.6 Bonusy cywilizacji — struktura efektów

Aktualnie `civs.json["Bonus startowy"]` to freetext, a jedynym mechanicznym efektem per-cyw są AI-priorytety produkcji w `ai.ts`. Poniżej propozycja typowanego schematu:

**Proponowany schemat (nie w JSON jeszcze):**
```typescript
interface CivBonus {
  typ: 'walka_pechota' | 'walka_dystans' | 'walka_kawaleria' | 'walka_las' | 'walka_szarza'
     | 'produkcja_budowle' | 'produkcja_drogi'
     | 'nauka_bonus' | 'kultura_bonus'
     | 'ruch_bonus' | 'zasieg_dystans'
     | 'handel_mnoznik' | 'ekonomia_surowce';
  cel?: string;           // id jednostki/budynku/terenu lub null = globalnie
  wartosc: number;        // np. 0.2 = +20%, lub 1 = +1 pkt, lub 'bool'
  opis?: string;          // humanistyczny (dla UI)
}
interface CivData {
  // ...
  bonusy: CivBonus[];
  jednostkaSpecjalna: { id: string; stats: {...}; }
}
```

**Aktualne bonusy per cywilizacja (z freetext do mechanizacji):**

| Cywilizacja | Kluczowy bonus | Typ | Dział wykonawczy |
|-------------|---------------|-----|-----------------|
| Grecy | +Obrona piechoty; odpieranie szarży | `walka_pechota`, obrona +20% | UNITS/walka |
| Rzymianie | +Atak + pancerz; szybsza budowa | `walka_pechota` atak+10%, `produkcja_budowle` −20% koszt | UNITS, MIASTO |
| Chińczycy | +Atak/zasięg łuczników; lepsza konnica | `walka_dystans` +20%, `walka_kawaleria` +15% | UNITS |
| Inkowie | +Nauka/Kultura; bonus w lesie/dżungli | `nauka_bonus` +15%, `walka_las` +25% | CYWILIZACJE/nauka, UNITS |
| Zulusi | +Ruch piechoty; siła w grupie | `ruch_bonus` +1 dla piechoty, `walka_pechota` +10% morale | UNITS |
| Egipt | +Atak dystansowy; rydwany z dist. | `walka_dystans` łucznicy +20%, rydwany `zasieg_dystans` +1 | UNITS |
| Sumerowie | +Obrona ciężkiej piechoty; ciężkie rydwany | `walka_pechota` HP+20%, `walka_kawaleria` rydwany +15% | UNITS |
| Celtowie | +Atak w szarży; długie miecze | `walka_szarza` +25%, `walka_pechota` uderzenie +15% | UNITS |
| Germanie | +Walka w lesie; zasadzka (furia) | `walka_las` +30%, `walka_szarza` pierwszy cios +20% | UNITS |

---

### 2.7 Trudność — wpływ na AI

Aktualny model (`loadDifficultyParams()`):

| Poziom | Mechanizm | Spryt AI |
|--------|-----------|---------|
| 1 Prosty | Brak bonusów | Taki sam algorytm co Normal |
| 2 Normalny | +10% produkcja, +1 jed. startowa | Taki sam |
| 3 Trudny | +25% produkcja, +1 miasto startowe, +5% walka | Taki sam |

Trudność wpływa tylko na **bonusy startowe i produkcyjne** — nie na spryt decyzyjny. Decyzje AI są identyczne na wszystkich poziomach. To jest celowe uproszczenie v0.1 (mniejszy koszt implementacji, łatwiejsze debugowanie).

---

## 3. TURNIEJE

> **RUBRYKA oceniania (0–3 każde kryterium, suma /15):**
> - **[A]** Spójność ze Spec / `PROJEKT-GRY-master.md` — czy pasuje do istniejącej architektury
> - **[B]** Grywalność / „czuć różnicę" — czy gracz zauważy wpływ mechanizmu
> - **[C]** Koszt + ryzyko implementacji — mniej = lepiej (3 = małe, 0 = ogromne)
> - **[D]** Brak martwych elementów / progów — czy wszystko jest aktywne
> - **[E]** Skalowalność — łatwa rozbudowa w przyszłości

---

### T1 — Respekt: kto liczy + wzór

#### Kandydat A: SILNIK agreguje, CYWILIZACJE daje `computeRespekt(inputs, wagi)`

SILNIK odpytuje moduły (UNITS, MIASTO, EKONOMIA, CYWILIZACJE) o poszczególne składniki, składa `inputs`, wywołuje czystą `computeRespekt()` z CYWILIZACJE (lub bezpośrednio z diplomacy.ts). Respekt = f(ratio_wojsk, bitwy, absolutne_wojsko, miasta, gospodarka, epoka), względem partnera.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 3 | Dokładnie odpowiada wagi z panelu A `diplomacy.json`; czyste API dip.ts (no DOM, no side effects); pasuje do kontraktu CYWILIZACJE→SILNIK z DOKUMENTACJA-DEV |
| [B] Grywalność | 3 | Gracz rzeczywiście czuje, że armia, bitwy, gospodarka i epoka przekładają się na siłę dyplomatyczną; Respekt zmienia się płynnie i sensownie |
| [C] Koszt implementacji | 2 | Wymaga 4 danych wejściowych z 4 działów; SILNIK musi je zebrać raz/turę per para; umiarkowany koszt integracji |
| [D] Brak martwych progów | 3 | Wszystkie 6 czynników z panelu A jest aktywnych; żaden nie „wisi" w spec bez użycia |
| [E] Skalowalność | 3 | Wagi są w `diplomacy.json["params"]` — zmiana bez rekompilacji; nowy czynnik = nowe pole w `inputs` i waga w panelu |
| **SUMA** | **14 / 15** | |

#### Kandydat B: Dedykowany moduł Power (osobny `power.ts`)

Osobny moduł oblicza zagregowaną Potęgę cywilizacji (skalar), Respekt = f(PowerSelf / PowerPartner). Power = suma ważona wszystkich składników.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 2 | Spec mówi o Respekcie względem partnera — Power jako agregat jest opcjonalny w panelu (waga=0); nowy plik `power.ts` to dodatkowa warstwa poza istniejącą architekturą |
| [B] Grywalność | 3 | Jeden skalar Power jest zrozumiały i czytelny (np. w UI); różnica sił wyrażona jednoznacznie |
| [C] Koszt implementacji | 1 | Nowy moduł, nowe typy, nowe testy, integracja; ryzyko desynchronizacji Power i faktycznych mechanik walki |
| [D] Brak martwych progów | 2 | Power agreguje, ale może ukrywać skrajne przypadki (słaba armia + silna gospodarka = średni Power) — mniej transparentne |
| [E] Skalowalność | 2 | Dodanie nowego czynnika wymaga zmiany w power.ts i ponownej kalibracji całej skali |
| **SUMA** | **10 / 15** | |

#### Kandydat C: Proxy v0.1 — tylko militaryRatio + bonus za bitwy

Respekt ≈ `clamp(militaryRatio × 50 + victoriesBonus × 25, 0, 100)`. Reszta wag ignorowana do v0.2.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 1 | Panel A definiuje 6 czynników — proxy ignoruje 4 z nich; niespójność z dokumentacją |
| [B] Grywalność | 2 | Gracz rozumie siłę militarną jako kluczowy czynnik; ale brakuje wpływu miast, gospodarki, epoki |
| [C] Koszt implementacji | 3 | Minimalne: tylko 2 inputs z UNITS; szybkie do wdrożenia w v0.1 |
| [D] Brak martwych progów | 1 | 4 z 6 czynników w panelu A są martwe; panel jest mylący jeśli wagi tam są, a nie działają |
| [E] Skalowalność | 2 | Łatwe dodawanie czynników; ale wymagają przebudowania formuły i rekalibracji |
| **SUMA** | **9 / 15** | |

**Zwycięzca T1: Kandydat A (14/15)**

---

### T2 — Zakres v0.1: AI dyplomacja + bonusy cywilizacji

#### Kandydat A: Pełna dyplomacja AI w v0.1 + bonusy zmechanizowane

Wszystkie 5 decyzji AI (wojna/pokój/sojusz/handel/trybut) + `decideAIDiplomacy()` + bonusy cywilizacji jako typowane pola `bonusy: CivBonus[]` mechanizowane przez odpowiednie działy.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 3 | Pełna spec dyplomacji jest gotowa; CYWILIZACJE mają styk z każdym działem; wszystko opisane |
| [B] Grywalność | 3 | Pełna dyplomacja AI + realne bonusy = najlepsza grywalność; każda cyw. gra inaczej |
| [C] Koszt implementacji | 0 | Ogromny: `decideAIDiplomacy()` (nowy), typowany schemat bonusów (nowy), mechanizacja 9 cyw. × ~3-4 efekty = ~30-40 nowych wywołań w walce/mieście/ekonomii; integracja ze SILNIK; ryzyko regresji |
| [D] Brak martwych progów | 3 | Nic nie wisi — ale tylko jeśli wszystko jest faktycznie wdrożone i przetestowane |
| [E] Skalowalność | 3 | Schemat `CivBonus[]` jest rozszerzalny; `decideAIDiplomacy()` przyjmuje nowe typy komend |
| **SUMA** | **12 / 15** | |

#### Kandydat B: v0.1 militarne + dyplomacja podgląd + bonusy opisowe/2-3 kluczowe

AI inicjuje tylko decyzje militarne (wojna/pokój); panel dyplomacji read-only (gracz widzi stany, ale AI nie proponuje umów/sojuszy); bonusy: freetext zostaje + 2-3 kluczowe efekty zakodowane (np. Grecy: +20% Obrona piechoty, Zulusi: +1 Ruch piechoty, Chińczycy: +20% Zasięg łuczników).

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 2 | Spec mówi o pełnej dyplomacji; tryb read-only nie jest opisany jako etap przejściowy — może stwarzać nieporozumienia |
| [B] Grywalność | 2 | Gracz widzi dyplomację, ale AI nie gra nią aktywnie — „czuć różnicę" ograniczone; 2-3 bonusy to odczuwalnie więcej niż 0 |
| [C] Koszt implementacji | 2 | Umiarkowany: AI war/peace + kilka hardkodowanych bonusów w walce; bez pełnego schematu CivBonus |
| [D] Brak martwych progów | 2 | Handel/sojusz AI są martwe; progi `willingnessTrade`/`willingnessAlly` obliczone, ale nieużywane |
| [E] Skalowalność | 2 | Hardkodowane 2-3 bonusy trudne do rozszerzenia bez refaktoru; read-only panel wymaga przepisania gdy AI „ożyje" |
| **SUMA** | **10 / 15** | |

#### Kandydat C: Rdzeń dyplomacji — AI min. (wojna/pokój + trybut), bez sojuszy/handlu wieloturowego; bonusy: jednostki spec. + 2-3 efekty

AI inicjuje: wypowiedzenie wojny, propozycja pokoju, żądanie trybutu. Bez sojuszy, bez handlu wieloturowego. Bonusy: jednostka specjalna (przez UNITS, osobny rekord jednostki) + 2-3 efekty walki per cyw.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 2 | Spec opisuje kompletną dyplomację; rdzeń jest podzbiorem; ale Dyplomacja-zasady.md §7 mówi o etapowości: „wpięcie = SILNIK" — rdzeń jest rozsądnym krokiem 1 |
| [B] Grywalność | 3 | Gracz czuje aktywną dyplomację AI (zagrożenie wojną, żądanie trybutu); jednostki spec. są widoczne i odczuwalne w walce |
| [C] Koszt implementacji | 2 | Trzy decyzje AI (`decideAIDiplomacy` okrojona) + jednostki spec. w UNITS (istniejący mechanizm) + 2-3 efekty per dział; wykonalne w 1-2 sesjach |
| [D] Brak martwych progów | 2 | Handel/sojusz pozostają obliczone ale nieaktywne dla AI; `willingnessTrade`/`willingnessAlly` są martwe do v0.2 |
| [E] Skalowalność | 3 | Jasna ścieżka do pełnej dyplomacji: kolejne typy komend do `decideAIDiplomacy()`; schemat bonusów można rozszerzać |
| **SUMA** | **12 / 15** | |

**Wynik T2:** Kandydat A (12) = Kandydat C (12) **REMIS** — patrz §4 REKOMENDACJE.

---

### T3 — Bonusy cywilizacji: struktura + dział

#### Kandydat A: Strukturalny schemat efektów per cyw (typowane `{typ, cel, wartosc}`), mechanizowane przez właściwe działy

Pełny schemat `CivBonus[]` w `civs.json` per cywilizacja; UNITS/MIASTO/EKONOMIA/CYWILIZACJE odczytują i stosują swoje efekty.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 3 | `civs.json` już ma structurę per-cywilizacja; rozszerzenie o `bonusy[]` jest naturalnym krokiem; DOKUMENTACJA-DEV opisuje granice działów |
| [B] Grywalność | 3 | Gracz naprawdę czuje różnicę między cywilizacjami — każda ma inne charakterystyki w walce, produkcji, nauce |
| [C] Koszt implementacji | 1 | Wysoki: nowe pole w JSON, nowe typy TS, każdy dział musi odczytać i zastosować swoje efekty; ~30-40 wywołań; ryzyko desynchronizacji działów |
| [D] Brak martwych progów | 3 | Wszystko jest aktywne i mechanicznie skuteczne |
| [E] Skalowalność | 3 | Nowe typy bonusów = nowy string w unii `typ`; nowe cywilizacje = nowy wpis w JSON |
| **SUMA** | **13 / 15** | |

#### Kandydat B: Freetext zostaje + 2-3 kluczowe efekty hardkodowane

Obecny `"Bonus startowy"` string pozostaje; w kodzie walki/miast/ekonomii dodane `if (civType === 'grecy') { defense *= 1.2 }` per cywilizacja.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 1 | Hardkodowane ify per cywilizacja = antywzorzec; Spec preferuje dane → efekty przez dane |
| [B] Grywalność | 2 | 2-3 odczuwalne efekty per cyw to wyraźna poprawa vs brak; ale nie pełna różnorodność |
| [C] Koszt implementacji | 3 | Minimalne: kilka warunków w istniejących funkcjach; szybkie do wdrożenia |
| [D] Brak martwych progów | 2 | Freetext nie ma martwych progów (nie jest mechanizmem), ale hardkody są kruche i trudne do rozszerzenia |
| [E] Skalowalność | 1 | Każda nowa cywilizacja = nowe ify w wielu miejscach; nowy typ bonusu = zmiany w 3-5 plikach |
| **SUMA** | **9 / 15** | |

#### Kandydat C: Hybryda — schemat strukturalny w JSON, w v0.1 wypełniony tylko dla efektów realnych (Kamień/Brąz), reszta opisowa

Schemat `bonusy: CivBonus[]` dodany do `civs.json` od razu; w v0.1 wypełniony tylko dla bonusów mechanizowanych w Kamieniu i Brązie (~2-3 per cyw); późniejsze efekty (epoka Żelazo+) = freetext → puste w schemacie lub `wartosc: 0`.

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| [A] Spójność ze Spec | 3 | Schemat od razu poprawny; dane gotowe do uzupełniania; spójne z pipeline `civs.json` |
| [B] Grywalność | 2 | W v0.1 tylko część bonusów mechaniczna; różnica zauważalna, ale nie pełna |
| [C] Koszt implementacji | 2 | Schemat JSON bez kodu → małe ryzyko; mechanizacja 2-3 efektów per cyw = umiarkowany koszt |
| [D] Brak martwych progów | 2 | Puste pola w schemacie to „przyszłościowe miejsca" — nie są martwymi progami, ale nie działają |
| [E] Skalowalność | 3 | Dokładnie taka sama skalowalność co Kandydat A; schemat jest już poprawny |
| **SUMA** | **12 / 15** | |

**Zwycięzca T3: Kandydat A (13/15)**

---

## 4. REKOMENDACJE

### T1 — Respekt: **Kandydat A wygrywa (14/15)**

Rekomendacja: `computeRespekt(inputs, partnerInputs, wagi)` jako czysta funkcja w `diplomacy.ts`, dane agregowane przez SILNIK raz/turę per para. Wagi z panelu A (`diplomacy.json`) — zmienne bez rekompilacji. To jest spójne z istniejącym API i filozofią modułu (pure functions, no side effects).

**Dla CYWILIZACJE:** napisać funkcję i eksportować; dane wejściowe (`inputs`) to prosty interfejs; nie trzeba czekać na SILNIK by ją przetestować (można mockować inputs w teście).

---

### T2 — Zakres v0.1: **REMIS A=C (oba 12/15)** — rekomendacja: Kandydat C

Kandydat A ma wyższy potencjał grywalności, ale koszt = 0/3 (ogromny). Kandydat C = 12/15 przy koszcie 2/3. W kontekście projektu (v0.1, iteracyjne wdrożenie, SILNIK jeszcze nie integruje dyplomacji) lepiej jest dostarczyć działający rdzeń niż spektakularny plan bez implementacji.

**Rekomendacja: Kandydat C** — AI minimum: `decideAIDiplomacy()` z 3 decyzjami (wojna/pokój/trybut), jednostka specjalna per cywilizacja, 2-3 efekty walki. Sojusze i handel wieloturowy → v0.2 gdy SILNIK będzie wpiętym.

---

### T3 — Bonusy cywilizacji: **Kandydat A wygrywa (13/15)**

Rekomendacja: schemat `CivBonus[]` od razu, ale wypełniony w v0.1 tylko dla efektów Kamień/Brąz (faktycznie = Kandydat C implementacyjnie, ale pod architekturą A). Różnica z Kandydatem C jest tu minimalna — w praktyce: dodaj schemat do JSON teraz, mechanizuj stopniowo.

**Dla CYWILIZACJE:** zdefiniować typy `CivBonus` w `civs.json` i/lub osobnym pliku TS; UNITS/MIASTO/EKONOMIA implementują konsumpcję swojego zakresu. CYWILIZACJE = tylko schemat + dane.

---

### Trudność: rekomendacja bez pełnego turnieju

**Opcja A: Tylko bonusy** (aktualny stan) — szybki dostęp, nieodczuwalna różnica strategiczna.  
**Opcja B: Bonusy + spryt** — AI na Trudnym podejmuje lepsze decyzje (np. wyższy próg akceptacji pokoju, szybsza eskalacja do trybutu).  
**Opcja C: Tiered v0.1 bonusy, spryt później** — w v0.1 pozostajemy przy Opcji A, w v0.2 dodajemy spryt.

**Rekomendacja: Opcja C** — uzasadnienie: aktualny `loadDifficultyParams()` jest dobrze zaimplementowany; dodanie sprytu (modyfikatory progów decyzji w `aiDiplomacyStance`) wymaga dodatkowego parametru `difficultlyMultiplier` w funkcjach i kalibracji. To jest niska wartość dla v0.1, wysoka dla v0.2 gdy dyplomacja AI będzie aktywna. Bonusy (produkcja, jednostki startowe) są wystarczające by różnica trudności była odczuwalna na tym etapie.

---

## 5. DECYZJE DLA MACIEJA

> Format: numer + litera. Rekomendacja oznaczona `(rec)`. Jeśli zgadzasz się z rekomendacją, zaznacz ją — jeśli nie, zaznacz swoją i ewentualnie wyjaśnij w komentarzu.

---

**1) Respekt — wzór i kto liczy:**

- **A** — `computeRespekt(inputs, wagi)` jako czysta funkcja w `diplomacy.ts`, SILNIK agreguje dane z modułów i wywołuje raz/turę per para. *(rec — zwycięzca T1: 14/15)*
- **B** — Osobny moduł `power.ts` z zagregowaną Potęgą, Respekt = f(Power self / Power partner). *(10/15)*
- **C** — Proxy v0.1: Respekt ≈ militaryRatio × 50 + bitwy × 25; reszta wag później. *(9/15)*

Twój wybór: `[A]`

> **ZATWIERDZONE przez Macieja 2026-06-25 = A**

---

**2) Zakres v0.1 dyplomacji AI + bonusy:**

- **A** — Pełna dyplomacja AI (war/peace/sojusz/handel/trybut) + pełny schemat bonusów zmechanizowanych przez działy. *(12/15 — duży koszt)*
- **B** — AI tylko militarnie (war/peace); panel dyplomacji read-only; 2-3 bonusy opisowe zakodowane na sztywno. *(10/15)*
- **C** — AI rdzeń: war/peace/trybut; jednostki specjalne per cyw.; 2-3 kluczowe efekty walki. *(rec — ex aequo A, ale koszt 2/3 vs 0/3; 12/15)*

Twój wybór: `[ ]`

---

**3) Bonusy cywilizacji — struktura:**

- **A** — Pełny schemat `{typ, cel, wartosc}` per cyw., mechanizowane przez właściwe działy już teraz. *(rec — 13/15)*
- **B** — Freetext zostaje + 2-3 efekty hardkodowane w kodzie walki. *(9/15)*
- **C** — Schemat strukturalny w JSON od razu; w v0.1 mechanizowane tylko efekty Kamień/Brąz; reszta opisowa. *(12/15 — kompromis)*

Twój wybór: `[A]`

> **ZATWIERDZONE przez Macieja 2026-06-25 = A**

---

**4) Trudność:**

- **A** — Tylko bonusy startowe/produkcyjne (aktualny stan, bez zmian).
- **B** — Bonusy + spryt (modyfikatory progów decyzji AI w dyplomacji i walce).
- **C** — Aktualny stan (bonusy) w v0.1; spryt dodany w v0.2 gdy dyplomacja AI będzie aktywna. *(rec)*

Twój wybór: `[ ]`

---

*— Analityk CYWILIZACJE, 2026-06-25*
