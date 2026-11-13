STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ANNEX-CITYSTATE-SPOILS-Q1
GOAL: aneksja (wchłonięcie) państwa-miasta przenosi majątek MP na przejmującego jak eliminacja przez zdobycie (surowce, Praca, Nauka, złoto, żywność do pojemności Spichlerza), komunikat pokazuje komplet.

## 1. Znalezisko (baza origin/main b89ecee44)
- Jedyna funkcja aneksji: `annexCityStateToOwner` (`gra/src/main.ts` ok. :32295). Wołana z 3 miejsc: propozycja `wchloniecie` gracz/AI (:22428), AI→MP `instant_annex|annex` (:38259; obejmuje też wasalizację→aneksję), AI→major `instant_annex` (:38334). Cesja ostatniego miasta NIE ma osobnej ścieżki — jedyne `eliminateOwner` to aneksja i `runCapitalCapturePlunder` (:32803).
- Dziś przenosiła tylko miasta (`ownerId`, a z nimi `City.surowce` i budynki fizycznie); skarbiec/Praca/Nauka/Spichlerz MP ginęły w `eliminateOwner` (kasuje `aiSkarbiecByOwner`, pule). Cena aneksji zapłacona graczem do skarbca MP też ginęła.
- Eliminacja przez zdobycie: `applyCapitalCapturePlunder` (`capital-capture.ts`), logika wbudowana inline.

## 2. Zmiany (commit 7f5285dd4)
- `capital-capture.ts`: wydzielony wspólny rdzeń `transferWholeEstateToWinner` (skarbiec, Praca, surowce sumowane po miastach, Spichlerz z limitem, Nauka; ofiara zerowana) — eliminacja (Zdarzenie 2) woła go teraz zamiast kodu inline (zachowanie identyczne; techy nadal tylko przy eliminacji). Nowe `applyAnnexCityStateSpoils` (guard: sam/barbarzyński MP → null; barbarzyński wchłaniający → zapisy DO niego no-op, MP traci).
- `main.ts` (tylko aneksja): `annexCityStateToOwner` woła rdzeń z tymi samymi akcesorami (`capitalCaptureResourceAccess`) PRZED `eliminateOwner`; komunikat (karta Wydarzeń gracza) = zdanie dotychczasowe + wiersze `buildCityCaptureReportRows(kind:'eliminacja')` (te same co okno „Bilans zdobycia”). W gałęzi propozycji `wchloniecie` cena zapłacona do MP jest odejmowana ze skarbca MP przed przejęciem (żeby nie wracała do płatnika; dawniej znikała).
- Bez zmian: relacje, kary wojenne, Moc (`zdobyczePowerByOwner`), technologie, sygnatura `annexCityStateToOwner`.
- ZAŁOŻENIA: (1) technologie NIE kopiowane (dispatch ich nie wymienia; MP nie są zdobyciem); (2) Moc nie dopisywana; (3) pojemność nieznana (0) = bez przycięcia (jak w eliminacji); (4) barbarzyńca-wchłaniający: ofiara traci, barbarzyńca nic nie dziedziczy (spójnie z `barbarianCaptorResourceAccess`); (5) komunikat tylko dla annexer=gracz (jak dotąd).
- Testy zaktualizowane z uzasadnieniem: `elimination-full-spoils-test.cjs` — kotwica mutacji „surowce nie są zbierane” przeniesiona na nową linię w rdzeniu (zbieranie surowców wydzielone, sumowanie po miastach).

## 3. Testy
- `node ./node_modules/typescript/bin/tsc --noEmit`: EXIT=0 (`gate-tsc.txt`).
- Nowy `gra/tools/annex-citystate-spoils-test.cjs`: PO 79 passed / 0 failed (`gate-annex-po.txt`); PRZED (src z bazy) crash `applyAnnexCityStateSpoils is not a function`, EXIT=1 (`gate-annex-przed.txt`). Pokrycie: 8 surowców+500 zł+1200 żywności+Praca 300+Nauka 900 → stan przejmującego +pozycje, MP wyzerowane (gracz i AI), limit Spichlerza (częściowy/pełny/nieznany), wiele miast MP, barbarzyńcy, idempotencja, komunikat zawiera komplet, wiązanie main.ts po źródle (przed `eliminateOwner`, brak relacji/kar/techów, cena odjęta), brak regresji eliminacji, 7 mutacji rdzenia czerwieni test.
- Regresje (`*annex*|*city-state*|*capital-capture*|*elimination*|*diplomacy*|*spoils*`, 83 pozycje, timeout 60 s): PRZED vs PO IDENTYCZNE (`gate-regresje-przed/po.txt`); istniejące FAIL w obu: city-state-offensive(-normal-easy), city-state-start-units-live, civ-matrix-ai-diplomacy-wiring, diplomacy-audience-close-flush, -lista-podglad-przed-wizyta, -negotiation-table, -package-ai-counter-actionable, -proposal, pr141-hotseat-diplomacy-owner, oraz 4× live TIMEOUT. Po zmianie PASS: capital-capture 107/107, elimination-toast-merge 56/56, elimination-full-spoils 114/114.

## 4. NIE_ZMIERZONO / UWAGI
- Brak weryfikacji w przeglądarce (zakaz build/dev, main.ts jednym domknięciem); dowód = prawdziwy rdzeń + prawdziwy blok raportu + wiązanie po źródle. Do zmierzenia w Final Control/orkiestratorze.
- UWAGA PROCESOWA: uruchomienie całego zestawu regresji w worktree samo cofnęło edycję `main.ts` i zmodyfikowało/utworzyło kilka PNG w `dyspozycje/autobot/runs/` (efekt uboczny istniejących testów; pliki przywrócone, nie w commicie). Dlatego PO-regresję puszczono na czystym `git archive` commita. Edycje main.ts odtworzono i zacommitowano przed tym uruchomieniem.
- Zero zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`. `node_modules` w worktree do usunięcia po pracy.

COMMIT: 7f5285dd4 (kod+test); logi i ten raport w kolejnym commicie
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) — weryfikacja przeglądarkowa i ocena założeń (techy/Moc/barbarzyńcy)
DEPLOY/PUSH: NIE WYKONANO
