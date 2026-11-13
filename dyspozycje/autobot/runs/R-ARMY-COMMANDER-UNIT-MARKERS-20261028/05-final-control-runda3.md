# Final Control — R-ARMY-COMMANDER-UNIT-MARKERS-20261028, runda 3/5

WERDYKT BINARNY: **FAIL**  
BAZA: `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
WORKTREE: `/tmp/the-game-commander-markers-20261028`  
NASTĘPNY ETAP: **Operator runda 4/5**, domknięcie dowodu wizualnego w rzeczywistym widoku mapy i ponowne przekazanie do niezależnego Evaluatora oraz Final Control. Brak zgody na integrację na podstawie tej rundy.

## Kontrola pięciu kryteriów

1. **SCOPE — PASS.** Diff względem wskazanej bazy zawiera dokładnie cztery śledzone pliki produktowe z allowlisty: `gra/src/game/armyMerge.ts`, `gra/src/render/unitStatPlate.ts`, `gra/src/render/unitVeteranBadges.ts` i `gra/src/render/units.ts`. Nowy `gra/tools/commander-star-emblem-test.cjs` również jest dozwolony. Artefakty runu to dispatch, raport Operatora, raport Evaluatora, zrzut i niniejszy raport. Nie ma innych zmienionych ani nieśledzonych plików. `git diff --check` przechodzi. `gra/src/game/generals.ts` i `gra/src/main.ts` nie mają diffu.
2. **NO-SIDE-EFFECT — PASS.** Zmiany realizują tylko agregację `hasCommander`, osobną gwiazdę wodza, przekazanie flagi do renderera i emblemat o boku `0.80 * HEX_R`. Selektor Stone `stoneGeneralUnitId(hasWheel)` jest już w bazie i pozostaje nietknięty. Potwierdzam brak hunka `main.ts`; nie przeniesiono zmian rekrutacji, bitwy ani AI. Nie wykonano operacji Git zmieniających stan.
3. **NO-REGRESSION — PASS-WITH-NOTES nie jest tu dopuszczalny; kryterium STRICT — FAIL.** Kod i testy zachowują wcześniej istniejący selektor Stone, a odtworzone testy przypadków dowódcy przechodzą. Jednak raport nie zawiera porównania pełnej listy sąsiednich testów na czystej bazie i kandydacie. Brakuje więc wymaganego przez ścisły protokół pomiaru baseline'u; sama inspekcja diffu nie jest takim pomiarem.
4. **METRYKI KOMPLETNE — FAIL (STRICT).** Niezależnie odtworzone: celowany test **11 passed, 0 failed**; `tsc --noEmit` — exit 0; Vite production build — exit 0, 916 modułów, 23.55 s; `git diff --check` — exit 0. Nie ma jednak pomiaru sąsiednich testów na czystej bazie ani ukończonej weryfikacji końcowego artefaktu w gotowym ekranie mapy. Próba Chromium utknęła na `6/10 · Rzeki — główne`; komponentowy harness nie wypełnia tej bramki.
5. **JAKOŚĆ TESTÓW — PASS.** Test uruchamia produkcyjne `stackVitals()` i `applyUnitCommanderStar()`. Sprawdza brak gwiazdy bez dowódcy, dowódcę jako innego członka stosu, usunięcie po utracie dowódcy, odrębność od trzech gwiazdek XP, idempotencję, proporcję 4× i test helpera Stone. Pokrywa ścieżki negatywne i zmianę stanu; nie zapisuje nowego trwałego pola jednostki.

## Ocena dowodu wizualnego

Obejrzałem `06-chromium-component-preview.png` (1440×900). Pokazuje produkcyjne funkcje renderera na testowym żetonie: gwiazdę wodza nad trzema gwiazdami XP oraz powiększony emblemat. To przydatny dowód kompozycji komponentów, ale **nie jest zrzutem gry w rzeczywistej skali użycia**: żeton stoi na izolowanej testowej podstawie, bez kamery mapy, sąsiednich jednostek i kontekstu gotowego ekranu. Obraz nie zawiera też pomiaru pikseli/kolorów ani widoku przed/po. Liczbę 4× potwierdza kod `0.80 / 0.20` i asercja testu, nie pomiar screenshotu.

Zgodnie z `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` §3, praca render/UI wymaga zrzutu w realnej skali użycia obejrzanego i zmierzonego; §5 STRICT nakazuje FAIL, gdy kryterium tego dowodu nie spełnia. Dlatego komponent preview **nie wystarcza**. To jest **FAIL**, a nie PASS-WITH-NOTES: brak dowodu wynika z bieżącego tematu i nie jest udokumentowaną porażką pre-istniejącą poza zakresem. Notatka Evaluatora trafnie nazywa ograniczenie, ale jego `PASS-WITH-NOTES` nie spełnia reguły STRICT.

## Warunki następnej rundy

Operator powinien dostarczyć zrzut gotowego widoku mapy z jednostką i rzeczywistą kamerą gry (kamera 52° zgodnie z regułą render/UI), z widoczną gwiazdą dowódcy, rzędem XP i emblematem. Należy obejrzeć i podać pomiary pikselowe/kolorystyczne dla czytelności i skali oraz uruchomić zbudowany artefakt do stanu gotowej mapy bez błędu startu. Należy też porównać wymagany zestaw testów sąsiadujących na czystej bazie `85f8c5f0` i kandydacie; wynik 11/0 dla nowego testu pozostaje zapisany, ale nie zastępuje baseline'u.

Nie wykonano commit, push, merge, integracji ani deployu.
