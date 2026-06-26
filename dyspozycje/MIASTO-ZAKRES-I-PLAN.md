# Civ-MIASTO — pełny zakres odpowiedzialności + plan (wer. 2026-06-22)

> Źródło prawdy: `Status-projektu-The-Game.xlsx` → „Taski" + zakładka „Civ-MIASTO".
> Domena: **miasto + budynki + produkcja + SPOŁECZEŃSTWO (porządek / kultura / religia)**.
> To dokument planistyczny (nie kod). Czeka na „start" do realizacji.

---

## 1. Za co odpowiadam — mapa domeny

| Obszar | Plik logiki (lane) | Panel sterowania → JSON | Stan |
|---|---|---|---|
| A. Miasto jako obiekt | `game/cities.ts` | — | zakładanie GOTOWE, wpięte |
| B. Produkcja (kolejka) | `game/production.ts` | (pośrednio Budynki.xlsx) | logika gotowa, NIEwpięta |
| C. Budynki | (dane) | `Budynki.xlsx` → `data/buildings.json` | 15 budynków, model do zmiany |
| D. Porządek (społeczeństwo) | `game/order.ts` | `Społeczeństwo-parametry.xlsx` → `data/society-params.json` | jest bug + niewpięte |
| E. Kultura i religia | `game/culture-religion.ts` | `Społeczeństwo-parametry.xlsx` → `society-params.json` | niewpięte |

Dwa panele sterowania = **Budynki.xlsx** i **Społeczeństwo-parametry.xlsx**.
`main.ts` / pętlę tury rusza tylko SILNIK — ja dostarczam logikę + dane + handoff.

---

## 2. Obszary szczegółowo

### A. Miasto jako obiekt — `cities.ts`
- Zakładanie: `canFoundCity` (poza mapą / morze / góry / dystans ≥5), `foundCity`, `cityName`. GOTOWE, wpięte w main.ts.
- Wzrost populacji: magazyn żywności, próg wzrostu (rośnie z populacją), Spichlerz (50% po wzroście, ×5 pojemności), Akwedukt (wzrost >6 ludności). Formuły liczbowe = `turn-economy.ts` (styk EKONOMIA); ja: model obiektu, trigger wzrostu, efekt.
- Granice / zasięg okolicy: siatka ~10×10, +1 pole co epokę; rozszerzanie przez kulturę (styk z E).
- Wioski → przekształcenie w miasto bez osadnika (wioska + dystans ≥5); osadnik tylko poza zasięgiem.
- Tożsamość: stolica (★, brak korupcji), nazwa, właściciel, epoka.

### B. Produkcja — `production.ts`
- Kolejka: co miasto buduje (budynek/jednostka), postęp wg Pracy/turę, ukończenie → dodaje obiekt.
- API (czyste, gotowe): `availableProduction`, `advanceProduction`, `enqueue/dequeue`, `frontItem`, `itemCost`, `buildingProductionItem/unitProductionItem`.
- Koszt: budynek = `kosztBudowy + (poziom−1)×przyrostKosztu`; jednostka = „Pieniądz (koszt)" / fallback per rola.
- DO ZAPROJEKTOWANIA (spec Schemat §3.1): suwak **% Pracy** = budynki vs prace w terenie; `Wykup` (Pieniądz 1:1), `Wstrzymaj`; rekrutacja jednostki = −1 ludność.

### C. Budynki — `Budynki.xlsx` → `buildings.json`
- 15 budynków, kategorie: Produkcja, Pieniądz, Żywność, Kultura, Nauka, Zdrowie, Obrona, Wojsko, Administracja.
- Efekty: `baza{praca, pieniadz, zywnosc, nauka, kultura, zadowolenie, obrona, mnoznik}`.
- Epoka wejścia (1=Kamień…10=Informacyjna), maks poziom, nazwy poziomów.
- **Model poziomów — NOWA decyzja Maciej (4a):** poziom = epoka_miasta − epokaWejścia + 1; awans o 1/epokę; efekt = `baza × 1,10^(poziom−1)` (procent składany). To **zastępuje** liniowe pole `Przyrost` z obecnego arkusza.
- Odblokowania per tech/epoka (Schemat §3.4): Garncarstwo, Murarstwo, Brązownictwo, Religia, Pismo, Waluta, Budownictwo…

### D. Porządek — `order.ts` (SPOŁECZEŃSTWO)
- Wzór (panel „Porządek"): `Porządek = waga_szczescie×Szczęście + waga_prawo×Prawo` (domyślnie 0,5/0,5; Prawo=0 dopóki brak podsystemu).
- Progi: **T1** (Porządek < T1 → niepokój: kara produkcji/wzrostu, ryzyko buntu), **T2** (≥ T2 → bonus produkcji/handlu), między → neutralnie. Wartości per trudność (Easy/Normal/Hard).
- Wpływ garnizonu / budynków (Mury, Świątynia) na porządek.
- **BUG do naprawy (krok 4):** test „loadOrderParams scales by difficulty" (logic 124/125) — przed wpięciem.

### E. Kultura i religia — `culture-religion.ts` (SPOŁECZEŃSTWO)
- Kultura/turę: Pałac, Świątynia, Biblioteka, Amfiteatr, Cud (wartości w panelu „Kultura"). Kumulacja → **rozszerzanie granic** miasta (styk z A).
- Religia: próg dominacji %, szerzenie (miast/turę, maks dystans heksów, bonus ze Świątyni), zadowolenie z religii dominującej (styk z D).
- Konwersja podbitych miast przez Świątynie.
- Religie cywilizacji: 7 zdefiniowanych (Grecy, Rzym, Chiny, Inka, Zulu, Egipt + …) z bonusami — panel „Religie cywilizacji". UWAGA: możliwy dublet z `civs.json` (lane DANE) → do uzgodnienia.

---

## 3. PANELE STEROWANIA (parametry → JSON) — temat do rozmowy

### Panel 1 — `Budynki.xlsx` → `buildings.json`
- Obecnie: kolumny `Baza *` + 8× `Przyrost *` (per pole), formuła liniowa `Baza + (N−1)×Przyrost`.
- **Konflikt z decyzją 4a:** compound +10%/epokę jest JEDNĄ regułą globalną → kolumny `Przyrost *` (per pole) stają się zbędne.
- Propozycja modyfikacji panelu:
  - zostawić tylko `Baza *` (wartości poziomu 1) + epoka + maks poziom + nazwy poziomów;
  - dodać 1 kolumnę/stałą `mnożnik awansu` = 1,10 (gdyby kiedyś różnicować per budynek);
  - koszt awansu = `kosztBudowy × 1,10^(poziom−1)` (compound — DECYZJA Maciej); kolumna `przyrostKosztu` → legacy/zbędna.

### Panel 2 — `Społeczeństwo-parametry.xlsx` → `society-params.json`
- 6 zakładek: Zdrowie, Szczęście, Kultura, Religia, Religie cywilizacji, Porządek.
- Format WZORCOWY: `Parametr | Easy | Normal | Hard | Jednostka | Opis`. Gotowy; do zweryfikowania, że `order.ts` + `culture-religion.ts` czytają go bez błędu.

### Jak parametry trafiają do JSON — DECYZJA Maciej: opcja A
- **Excel `Budynki.xlsx` + bezpieczny eksport per-panel** — arkusz zostaje źródłem; dokładam skrypt eksportu TYLKO `buildings.json` (NIE globalny `export-data.py` — ma zaszytą ścieżkę i nadpisuje cudze JSON-y).
- (Odrzucone na teraz: B = panel HTML single-file; C = hybryda Excel+HTML.)

---

## 4. Styki z innymi sesjami (komunikuję przez mastera)
- **EKONOMIA:** budynki dające plony (praca/pieniądz) — efekt skalowany compound; wspólna formuła. Produkcja zużywa Pracę z `turn-economy`.
- **UI:** panel miasta renderuje produkcję + budynki + (docelowo) porządek/kulturę. Paczka kontraktu już wysłana.
- **SILNIK:** wpięcie `production/order/culture-religion` w pętlę tury + `getEpoch` (poziom budynku z epoki).
- **UNITS:** rekrutacja jednostek z kolejki — koszty z `units.json` (czytam, nie piszę).
- **DANE:** religie cywilizacji — `civs.json` vs panel „Religie cywilizacji" → uzgodnić jedno źródło.
- **Rozbieżność doc do wyjaśnienia:** stary brief SILNIK twierdzi, że bug `order.ts` naprawia SILNIK; Excel przypisuje to MIASTO (krok 4). Trzymam się Excela (źródło prawdy).

---

## 5. Proponowana kolejność prac (po „start"; Maciej wybrał: panel budynków najpierw)
1. **Budynki.xlsx** — przebuduj pod compound model + bezpieczny eksport `buildings.json`.
2. **production.ts** — wepnij poziom z epoki + helper `buildingEffect(def, poziom)` (compound), gotowe do handoffu SILNIK.
3. **order.ts** — napraw bug + Porządek wg `society-params` (T1/T2, kary/bonusy).
4. **culture-religion.ts** — granice/zadowolenie/konwersja + religie cywilizacji.
5. Handoffy do SILNIK (wpięcie) i UI (render) po każdym etapie.
