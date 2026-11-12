# DIRYAW-DECYZJA — czy yaw modelu (dirYaw) wchodzi do wektorów i portu

- TEMAT: R-RUSTPORT-P6-DYRAW-DECYZJA-Q1 (runda 1, Operator)
- PIN (tylko odczyt): `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, plik `gra/src/battle/battleScene.ts` (20771 linii)
- BAZA: `59ff97106` (origin/rust-port/parity-v2)
- Zakres: wyłącznie analiza, bez zmian kodu.

## Pytanie

Czy `dirYaw(d: Dir)` (kąt obrotu modelu 3D, `rotation.y`) wpływa na wynik symulacji
(trafienia, kierunek ciosu, łuk, stan jednostki), czy tylko na render.

## Wynik

**Rekomendacja: (a) render-only.** `dirYaw` i `rotation.y` nie wchodzą do żadnej ścieżki
symulacji. Yaw nie jest wejściem wektorów i nie trzeba go portować. Stan prawdy symulacji
to pole `facing: Dir` (N/E/S/W) i jego pochodne liczone na siatce.

### Definicja yaw (render)

- `gra/src/battle/battleScene.ts:1927` — `function dirYaw(d: Dir): number` zwraca
  `Math.atan2(w.x, w.z)` z `cellToWorld(...)`. Wynik to wyłącznie kąt Three.js.

### Miejsca zapisu `rotation.y` (wyłącznie zapis, bez odczytu)

Wszystkie wywołania `dirYaw(...)` przypisują wynik do `group.rotation.y` lub `ru.group.rotation.y`:
`:4506`, `:4675`, `:5412`, `:8340`, `:9105`, `:9140`, `:9186`, `:9817`, `:17193`.
Dodatkowo `:11401` i `:11412` ustawiają `rotation.y = angle` dla overlay rozkazów
(kąt z `Math.atan2(dir.x, dir.z)` wektora pozycji, nie ze stanu jednostki).
Również `:4095` (`wallGroup.rotation.y`) i `:4373`, `:4390`, `:4398`, `:4925`, `:4933`,
`:5147` (dummy/InstancedMesh, jitter z `tileJitter`) są wyłącznie renderem.

Grep po całym pinie: w wyrażeniach nie ma odczytu `*.rotation.y` po stronie logiki
(poza przypisaniami wymienionymi wyżej). Brak `rotation` w ścieżkach `resolveCombat`
i fazach AI.

### Miejsca, w których o wyniku decyduje `facing: Dir` (sim, nie yaw)

- `:347` `facingToward(dCol, dRow, fallback)` — czysto siatkowa, zwraca `Dir`.
- `:385` `relativeHit(defenderFacing, ...)` — klasyfikacja `front` / `flank` / `rear`
  z `facingToward` i `oppositeDir`. Używana w trafieniach i łuku.
- Wywołania `relativeHit` (lista z grepa; wszystkie czytają `Dir`, nie każde przeczytano w całości):
  `:6366`, `:8213`, `:8405`, `:8516` (`_firstStepTowardDirectedAttack`, wybór kroku C-FLANK),
  `:8880` (`hitArc`), `:17563`, `:20451` (`arc`).
- `_canStrikeTargetFrom` (`:8487`) i `_firstStepTowardDirectedAttack` (`:8509`) — BFS
  do kafelka z ciosem z zadanego kierunku, oparty o `target.facing`, nie o yaw.

Każda z tych ścieżek czyta `Dir`, nie `rotation.y`. Zmiana yaw nie zmienia wyniku.

### Uzasadnienie

1. Yaw jest funkcją jednego `Dir` (`dirYaw(d)`), czyli kolejną reprezentacją tego samego stanu.
   Stan autorytatywny to `facing: Dir`, a sim (trafienia, łuk, C-FLANK) czyta właśnie jego.
2. Brak odczytu `rotation.y` w logice: grep po pinie nie znajduje takiego odczytu.
3. Wizualna zgodność (model obraca się ku kierunkowi) to wymóg renderu, nie parytetu.

## Konsekwencje dla portu

- Yaw NIE wchodzi do wektorów parytetu i NIE jest portowany do `rust-port`.
- Port trzyma `facing: Dir` jako stan. Konwersja `Dir -> yaw` należy do warstwy
  prezentacji (Three.js / web), nie do crate'a Rust.
- Gdyby kiedyś kierunek w sim zaczął zależeć od kąta ciągłego (np. ciosy pod kątem
  nie-siatkowym), ta decyzja wymaga ponownego otwarcia. Dziś tak nie jest.

## NIE_ZMIERZONO

- Nie zmierzono w przeglądarce, czy render wygląda poprawnie po ewentualnym przeniesieniu
  konwersji. Ta decyzja nie zmienia renderu.
- Nie uruchomiono `cargo` ani testów. Temat dokumentacyjny, bez zmian kodu.
- Brak dowodu runtime, że nie istnieje dynamiczny odczyt `rotation` przez `eval`, refleksję
  lub przez obiekt przekazany do zewnętrznej biblioteki. Grep po statycznym tekście pinu
  takiego odczytu nie wykrył.
