# 03-final-control — R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, bez kodu)
TEMAT: R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (EKONOMIA-8I2, #180)
GOAL: ustalić, które reguły ekonomii miast (żelazo, dostęp do zasobów) z pinu 07d2fbd72 nie mają odpowiednika w Rust; podział na tematy wykonawcze.
ZMIANY/COMMIT: oceniany commit obrony `84d002da9` (rodzic `0dfdbaf40`, baza `5e8b116e8`). Ancestry: `5e8b116e8` jest przodkiem `84d002da9` (git merge-base --is-ancestor = TAK). Ten plik dodaje commit FC (SHA końcowy w odpowiedzi orkiestratorowi).
Allowlista: `git diff --stat 5e8b116e8 84d002da9` = 3 pliki, wyłącznie `dyspozycje/` (01-operator-r1.md, 02a-obrona.md, plik ROZPOZNANIE). Zero zmian w rust-port/**, gra/**, testach, Cargo.*. OK.
TESTY: NIE DOTYCZY (dokument). Dowody zweryfikowane samodzielnie przez `git show`/`git grep` na pinie i bazie.
BLOKADY: brak blokad FC. Decyzje człowieka niżej.
RUNDY: 1/5
NASTĘPNY KROK: integracja dokumentu przez orkiestratora; pytanie ABC o wartości per-era brązu; zlecić T-A i T-D, potem T-B, T-C.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja zarzutów Evaluatora (werdykt FC na każdy)

| # | Zarzut | Dowód FC | Werdykt |
|---|---|---|---|
| 1 KRYTYCZNY | brąz per-era (`throughputEraParamKeys`) pominięty | Pin `converters.ts:99,100,102` ma `throughputEraParamKeys {2,3}` -> `budynek_huta_braz_epoka2/3_przepustowosc`; konsument `:178-183`, `:226`. Rust `ConverterRecipe` (`turn_economy_resources.rs:41-49`) bez pola; `git grep huta_braz_epoka 5e8b116e8 -- rust-port` = 0. Zbiór pina `:148-152` = 3 wpisy, Rust `:151-158` = 6, mnoży m(e) także brąz. | ODDAL (naprawione w §5.1 wiersze 6, 9b, 10, 16, temat T-A) |
| 2 WYSOKI | cytaty Rust ze starszego pinu | Rust cytuje `converters.ts:81-101` i `:147`; pin ma receptury `:99-104`, zbiór `:148`. Potwierdzone; pochodzenie = hipoteza, oznaczona NIE_ZMIERZONO. | ODDAL (§5.2) |
| 3 WYSOKI | wiersz 18 AI odlewnie | Pin `ai.ts:2335-2346` ma CONVERTER_FOR_RESOURCE/ALTERNATIVES z odlewniami. `git grep -il odlewnia 5e8b116e8 -- rust-port/engine/src` = data/derived.rs, data/economy_society.rs, resource_access.rs, start_position.rs, turn_economy_resources.rs; brak ai*.rs. Gałąź = BRAK. | ODDAL (§5.1 wiersz 18, T-B) |
| 4 WYSOKI | wiersz 17 = lista limitu | Pin `economy-upkeep.ts:405-409` = `OWNER_CAPPED_RESOURCE_KEYS` (14 kluczy). Potwierdzone. | ODDAL (§5.1 wiersz 17, T-D) |
| 5 ŚREDNI | wiersz 14 zawyżony | `auto_improvements.rs:222` tylko `ruda_zelaza`->`kopalnia_zelaza`; brak `zelazo`->`odlewnia_zelaza`. Pin `ai.ts:2727` to mapa zasób->budynek. | ODDAL (CZĘŚCIOWO, T-C) |
| 6 ŚREDNI | wiersze 12, 15, 16 | Skorygowane na CZĘŚCIOWO/NIE_ZMIERZONO. | ODDAL |
| 7 ŚREDNI | podział T1-T4 | Przeliczony na T-A..T-D; szacunki jawnie oznaczone jako szacunek, nie pomiar. | ODDAL |
| 8 NISKI | etykieta 8I2 | Tracker poza repo; wzmianka tylko jako nazwa brancha wip; NIE_ZMIERZONO (§5.4). | ODDAL |

Jeden NAPRAW = FAIL; NAPRAW: brak. Wszystkie zarzuty uznane przez Operatora i poparte dowodem, który FC powtórzył.

## Uwagi (nie blokujące)

1. Dokument ROZPOZNANIE ma §1 i §2 z błędnymi statusami (m.in. §2: "NIE stwierdzono brakującego odpowiednika"), nadpisanymi przez §5. §5 jawnie deklaruje nadpisanie, więc dokument jest logicznie spójny, ale czytelnik §2 bez §5 zostanie wprowadzony w błąd. Zalecenie: dopisać nad §1 zdanie "obowiązuje §5" albo scalić w rundzie dokumentacyjnej. Nie NAPRAW, bo nadpisanie jest jawne.
2. `01-operator-r1.md` jest przestarzały (twierdzi brak potwierdzonych braków); obowiązuje §5 i 02a-obrona.md.
3. Pozostają NIE_ZMIERZONO: wartości liczbowe (ruda, przepustowości, ceny), reguła priorytetu konwertera AI (`ai.ts:2318-2334`), reguła upkeep żelazem, znaczenie etykiety 8I2, historia pinu. To nie jest pełny parytet ekonomii.
4. Kosmetyka: §5.1 wiersz 14 cytuje `ai.ts:2737` jako `ruda_zelaza`; to `zelazo: ['ruda_zelaza']` w mapie UPSTREAM_FOR_PROCESSED_RESOURCE, inna niż `:2727`. Bez wpływu na wniosek.

## Decyzje człowieka

- Wartości przepustowości brązu per epoka (50/75, REPIN-DRYFT 2, #15) przed T-A: wariant pina (klucze per-era, zbiór 3 wpisów) vs utrzymanie stanu Rust (6 wpisów, m(e)).
- Czy wprowadzać port AI odlewni (T-B), skoro dotyka balansu AI (zasada 3 CLAUDE.md).
