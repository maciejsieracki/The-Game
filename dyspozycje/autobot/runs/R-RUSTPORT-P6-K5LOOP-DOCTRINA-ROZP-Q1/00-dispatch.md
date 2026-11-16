# DISPATCH R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1 (runda 1) — rozpoznanie doktryny, strzelca i muru w ProdBody (#112)

DOMENA: GAME (odczyt). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, Final Control) — reguła projektu dla silnika.
TRYB: WYŁĄCZNIE ODCZYT. Nie pisz kodu, nie uruchamiaj cargo, nie zmieniaj `rust-port/` ani `gra/`. Jedyny zapis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/` (jawny `git add`).
BAZA: `origin/rust-port/parity-v2` = `59746d373` (zapisz SHA w raporcie). Pin: `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Temat #112 (K5LOOP-DOCTRINA-STRZELEC) odblokował się po integracji OUTCOME (#226, `c3e3617b2` jest w parity). Przed portem trzeba wiedzieć, co pin robi w gałęziach doktryny AUTO, strzelca i muru oblężniczego, i jak to odwzorowuje Rust. Rozpoznanie ma wskazać podział na tematy portu z allowlistami.

## PUNKTY STARTOWE W PINIE (zweryfikuj, nie ufaj bezkrytycznie)
- `battleScene.ts:6071-6097`: gałąź doktryny AUTO w `_activateUnit`; wyjątki `siegeDefenderNeverDoctrine` (obrońca przy murze) i `siegeMachineNeverDoctrine` (taran/wieża atakującego, `isSiegeUnit`); wywołanie `_executeGroupDoctrineStep`.
- `battleScene.ts:6794`: `lineAllowsRangedStep` (doktryna steady, strzelec w linii).
- `battleScene.ts:8138-8140`: prowadzenie szeregu w doktrynie Attack (`steady`), pomija `mounted` i machiny oblężnicze.
- `battleScene.ts:8176`: strzelec w doktrynie steady (`rangedBase`).
- `battleScene.ts:8193-8195`: `_effectiveMetaForUnit` / `_isUnitDoctrineAuto` (dziedziczenie doktryny z grupy, domyślnie `steady`).
- `battleScene.ts:1938`, `:2040-2059`: typ `GroupDoctrine` i pola meta.
Szukaj też `_executeGroupDoctrineStep` (jego definicja w pinie) — zmapuj ją w całości.

## ZAKRES
1. Zmapuj w pinie każdą gałąź doktryny AUTO (`_executeGroupDoctrineStep` i wołane z niej funkcje `this._*`), strzelca (zasięg, wybór celu, strzał) i wyjątki muru (`siegeWallCol`, `onWallWalkway`, `isSiegeUnit`). Dla każdej: plik:linia pinu, wejście, wyjście, czy zmienia stan gry (NIE: animacja, komunikat).
2. Dla każdej gałęzi: odpowiednik w Rust (`git grep -n "<nazwa>" origin/rust-port/parity-v2 -- rust-port/engine/src`), klasyfikacja PORT-JEST / BRAK / ROZBIEŻNE / UI (UI = NIE_ZMIERZONO z uzasadnieniem).
3. Ustal, co już jest w Rust: `doctrine`, `steady`, `rangedBase`, `siege_wall`, `strongest_ranged_unit_for_era` (`city_towers`), `siege_tactics_tower` i inne moduły `siege_tactics_*` — tylko `git grep`, bez zgadywania.
4. Wskaż, które wektory pinu już istnieją w `rust-port/engine/tests/` (nazwy plików), a których brakuje dla doktryny i strzelca.
5. Zaproponuj podział na tematy portu (jeden temat = jedna funkcja logiki + wektory), z kolejnością, allowlistami plików i jawnym wskazaniem, które tematy mogą iść równolegle.

## KRYTERIA KOŃCA
1. Raport `01-rozpoznanie.md` z tabelą: wywołanie | plik:linia pinu | klasyfikacja | odpowiednik Rust (plik:linia) lub BRAK | uwagi.
2. Każdy wpis z odtwarzalnym `git grep` (polecenie w raporcie).
3. Sekcja „Propozycja podziału” z kolejnością tematów i allowlistami.
4. Commit tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/` (jawny `git add`), bez push do parity.
5. Brak rozstrzygnięcia w webie = NIE_ZMIERZONO. Decyzji gameplay nie podejmuj — zapisz je jako pytanie do orkiestratora.
