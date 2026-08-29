# 08-dispatch-T1-wznowienie — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T1 KONTRAKT-KARTA-ENCJI (wznowienie po BLOCK)

Poprzedni Operator zatrzymał się z BLOCK na realnym dryfie slugify — pełny opis w
`07-operator-T1.md`. ECHO właściciela (Pytanie 5 w `docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md`)
= **C**: nowy, niezależny, POPRAWNY `entityCards/slug.ts` (pełna tabela `PL_DIACRITICS`,
wzorem `research.ts:199`), używany WYŁĄCZNIE przez nowy system kart. `TECH_MAP`/
`sciencePicker.ts` (drzewko technologii) i `improvementGateMet`/`research.ts` (gating
budowy ulepszeń) **zostają całkowicie nietknięte** na swoich dzisiejszych wariantach —
NIE zastępuj ich, NIE migruj ich na nowy slug w tym kroku.

GOAL: dokończ CAŁY fundament T1 (patrz `06-dispatch-T1-kontrakt.md` dla pełnego zakresu):
`types.ts`, `slug.ts` (teraz z jawną decyzją C), `registry.ts` (resolver `technology`
REUŻYWA istniejący `TECH_MAP`/`techNameFromSlug` z `sciencePicker.ts` — NIE nowy `slug.ts` —
dokładnie jak w oryginalnym dispatchu; resolver `unit` jest NOWY, buduje własną
`Map<slug, UnitDef>` przy starcie używając nowego skonsolidowanego `slug.ts`, bo dla
jednostek nie ma dziś żadnego istniejącego sluga do zachowania kompatybilności — patrz plan
architektury §2), `renderer.ts` (`renderEntityCard`, `openEntityCard`, tryb `dialog`),
adaptery-szkielety (4 kinds), test fixture (`gra/tools/entity-card-contract-test.cjs` lub
podobny) weryfikujący renderer na przykładowych danych wszystkich 4 kinds.

Zero edycji `unitInfoCard.ts`, `cityPanel.ts`, `techDiscoveryNotice.ts`, `scienceHubHud.ts`,
`techTreeView.ts`, `sciencePicker.ts`, `research.ts` — to nadal WYŁĄCZNIE nowe pliki w
`gra/src/ui/entityCards/**` plus jeden nowy plik testu.

## Kryterium ukończenia

Jak w `06-dispatch-T1-kontrakt.md`: `tsc --noEmit` czysty; test fixture zielony dla
wszystkich 4 kinds w trybie `dialog`; zero zmian w 7 plikach wymienionych wyżej (w tym
`sciencePicker.ts`/`research.ts` — pierwotny dispatch ich nie wymieniał explicite, ale ECHO=C
czyni to teraz jawnym ograniczeniem).

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (kontynuacja, HEAD po tym dispatchu
zawiera już BLOCK poprzedniego Operatora + to wznowienie).
