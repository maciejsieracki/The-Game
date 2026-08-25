# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T2`
GOAL: Rozróżnić wizualnie Soldurii i Gaesatae (Żelazo, Celtowie) — dziś obie
jednostki renderują się identycznym modelem `buildCeltWarrior()`.
MODEL WYKONAWCZY: **Opus 5 (`claude-opus-5[1m]`)**, odczytany ze środowiska sesji,
nie z założenia (C-062, §5a — wymóg Opus 5 dla tematu wizualnego spełniony).

ZMIANY/COMMIT:

- `gra/src/render/units.ts` — dispatch Soldurii→`buildSoldurii()`, Gaesatae→`buildGaesatae()`;
  naprawa orientacji `addTallOvalShield()`; nowa `buildSoldurii()` + sekcja S1-S8;
  przebudowa `buildGaesatae()` + sekcja K1-K7; `namePrefix` (opcjonalny, bez zmiany
  geometrii) w `addLongSwordRight`/`addSpearRight`.
- `gra/tools/zelazo-celtowie-soldurii-gaesatae-real-render-test.cjs` — nowy test
  real-render (Playwright/Chromium), 42 asercje.
- `buildCeltWarrior()` NIETKNIĘTY (zweryfikowane `diff` ciała funkcji wobec `origin/main`).

TESTY:

- `tsc --noEmit` — 0 błędów.
- `vite build` (C-001, binarka z `node_modules`, `--outDir /tmp/civ-zelazo-t2-dist`) — OK.
- `zelazo-celtowie-soldurii-gaesatae-real-render-test` — **42/42**.
- `zelazo-konnica-asyryjska-real-render-test` (T1, sąsiedni) — **31/31**.
- Bramki referencyjne: logic 213/213, tech-tree 19/19, research ALL GREEN (33/33),
  unit-replace 13/13, combat 6/6.
- Regresja pełna: 75 jednostek `units.json` × 8 kategorii, porównanie geometrii
  wobec `origin/main` — **73/75 bajtowo identyczne**; różnią się wyłącznie
  Soldurii i Gaesatae.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej — tak; deploy — nie).

## Cztery twarde błędy geometryczne znalezione w audycie

Zmierzone w żywym Three.js, nie wyczytane ze źródła.

1. **Tarcza obu jednostek była NIEWIDOCZNA.** `addTallOvalShield` używało
   `rotation.z = π/2`, więc lico tarczy patrzyło w bok (±X). Kamera gry ma stały
   azymut 0 (`camera.ts:131`), czyli widziała tarczę krawędzią. Pomiar PRZED:
   `[0.0166, 0.156, 0.296]×HEX_R` — 0.0166 szerokości przy 0.296 głębokości.
   To dokładnie ten sam błąd, który naprawiono **2026-08-06** dla tarczy hide w
   tym samym pliku; poprawka nigdy nie trafiła do tego helpera. Dowód, że
   `rotation.x` była pierwotną intencją autora: wektor `scale (1.0, 0.92, 1.85)`
   ma sens wyłącznie przy `rotation.x` (szerokość/grubość/wysokość).
2. **Spina tarczy wisiała w powietrzu** — 0.255 wysokości przy tarczy mającej
   w osi Y tylko 0.156; wystawała 0.0495 nad i pod nią.
3. **Włócznia Gaesatae była krótsza od wojownika** — czubek grotu y=0.5655 przy
   czubku głowy y=0.58. Broń ginęła w obrysie tokena. Po zmianie 0.50→0.62: y=0.6855.
4. **Hełm Soldurii ścinał oczy** (błąd nowego kodu, złapany pomiarem przed
   commitem) — dolna krawędź czaszy y=0.527 przy górze oczu y=0.5325.

Dodatkowo: nakładka nagich nóg Gaesatae kryła nogawkę tylko w 0.98 wysokości,
zostawiając ciemny rant u kostki i biodra (0.98→1.02).

## Decyzje projektowe

- **Soldurii — ścieżka (b), własna geometria.** Powód: decyzja właściciela dla
  całej serii wymaga modelu bespoke; modyfikacja `buildCeltWarrior()` zmieniłaby
  przy okazji „Wojownika celtyckiego". Nowa `buildSoldurii()` zostawia tamtą
  funkcję nietkniętą. Elita: kolczuga (wynalazek celtycki, Ciumeşti III w. p.n.e.),
  hełm Montefortino, brązowy torc, długi miecz, tarcza w barwie właściciela.
- **Gaesatae — nagość + gaesum, zgodnie z decyzją właściciela** („nago/półnago,
  uzbrojeni w gaesum", `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`) i
  Polibiuszem (II 28-30, Telamon 225 p.n.e.). Złoty torc + naramienniki —
  poświadczone wprost w tym samym ustępie.
- **Poza włóczni: pięta oparta o ziemię, nie zamach do rzutu** (pkt K5).
  `units.json` daje Gaesatae `Atak dystansowy = 0`; poza rzutu obiecywałaby
  graczowi zdolność, której jednostka nie ma.

## Do rozstrzygnięcia poza tym tematem (zgłoszone, nie naprawione)

1. **`units.json` — pole `Uwagi` Gaesatae jest nieaktualne.** Brzmi „Rename
   Wojownik celtycki → Gaesatae; (...) długi miecz sieczny + owalna tarcza;
   **tunika** + torc", czyli opisuje jednostkę SPRZED zmiany nazwy i przeczy
   decyzji właściciela o nagości. `units.json` jest poza allowlistą tego tematu.
2. **`Typ: "Swordsman"` przy jednostce z włócznią** — również dziedzictwo tego
   samego rename; wpływa na tabele kontr (`Bonus vs Spearman: 15`). Decyzja
   danych/balansu, nie modelu.
3. **Broń nie dotyka pięści** — `addLongSwordRight`/`addSpearRight` stawiają
   drzewce 0.005×HEX_R obok dłoni (ok. 0.34 px przy rozmiarze tokena). Dotyczy
   wielu jednostek; nie ruszane (§14, zmiana poniżej progu widoczności).

## Uwaga dla Evaluatora — zakres

`addTallOvalShield` nie jest wymieniony w allowliście z nazwy. Ma **dokładnie
trzech wywołujących**: `buildCeltWarrior`, `buildGaesatae`, `buildSoldurii` —
czyli wyłącznie jednostki tego tematu plus legacy „Wojownik celtycki", którego
`units.json` już nie zna (został przemianowany na Gaesatae). Bez tej naprawy
kryterium 1 jest nieosiągalne: sztandarowy wspólny element obu jednostek —
wysoka owalna tarcza celtycka — jest w grze niewidoczny. Zmiana w „Wojowniku
celtyckim" to wyłącznie 3 mesh tarczy (ta sama liczba mesh, te same barwy,
poprawiona orientacja) — zmierzone, nie deklarowane.
