STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1
GOAL: Tekst efektów cudów (modal CUD UKOŃCZONY, karta cudu) pokazuje nazwy wyświetlane z danych zamiast id snake_case, przez jeden resolver; audyt przecieków; strażnik testowy.
ZMIANY/COMMIT: kod 60f31fc82 (baza: origin/main 7b201afcd). Allowlista: gra/src/game/text-names.ts (nowy, resolver), gra/src/game/wonders-effects-text.ts (nowy, generator tekstu), gra/src/main.ts (wonderEffectsLabel deleguje do wonderEffectsText; usunięte lokalne WONDER_YIELD_LABELS i formatWonderYieldBonus; tylko źródło tekstu), gra/src/ui/entityCards/wonderAdapter.ts (Cywilizacje, Wymagany teren, etykieta i warunek teren przez resolver), gra/tools/wonder-text-no-raw-ids-test.cjs (nowy strażnik). Dane (wonders.json, wikiBundle.json) NIEZMIENIONE. Brak zmian liczb i efektów cudów. Brak WERSJE.md, gra-robocza, git add -A.
TESTY:
- npx tsc --noEmit (gra/): exit 0.
- node tools/wonder-text-no-raw-ids-test.cjs: 88 ok, 0 FAIL (wszystkie 19 cudów z wonders.json: tekst efektów i karta bez snake_case i bez znanych id terenów; piramidy -> "Pustynia +2 złota, +2 produkcji" i "Mała rzeka +2 złota, +2 produkcji"; wiszace_ogrody -> "Farma +2 żywności"; mundo_perdido -> "Tropiki +2 nauki, +2 zadowolenia"; resolver lowie_rybackie -> "Łowiska rybackie", laka -> "Łąka", nieznany_id_x -> "Nieznany id x").
- Regresja, exit 0: wonder-yields, wonder-availability, wonder-civ-tech, wonder-early-return-highlight, wonder-haamonga-no-dead-bonuses, wonder-map-build, terrain-names-equivalence, building-cards-top5, civpedia-* poza dwoma niżej wymienionymi (budynki-historia, cross-link-style, cuda-historia, gra-id-mostek, historia-infra, jednostki-j1, jednostki-j2, karty-spojnosc-q1-c, technologie-rys-historyczny, ulepszenia-historia-batch, wikihubhud-rys-historyczny-duplikacja).
- Exit != 0, NIE spowodowane tym tematem (testy sprawdzają dane i teksty, których ten temat nie zmienia; komunikaty testów opisują stan zastany): terminology-trade-vs-tax-test (Łodzie rybackie 6/6/6 vs oczekiwane 2/3/3 z R-WEB-FISHING-BOATS; Sztuka wojenna Top3 NIE_USTALONO), tech-cards-top5-test i jego --check (Sztuka wojenna Top3 NIE_USTALONO), wonder-transfer-on-conquest-test (asercje "owinięta migawkami" dla aneksji i cesji w main.ts; tych ścieżek nie dotknięto), civpedia-karty-nazwa-przyciskiem-test (karta budynku: 0 linków krzyżowych; test sam oznacza to jako stan zastany), civpedia-caly-wiersz-przyciskiem-test (kind=unit: klik w Technologia otwiera jednostkę, nie technologię).
- NIE_ZMIERZONO: przebieg w Chromium (modal CUD UKOŃCZONY w grze); w tej rundzie nie uruchomiono przeglądarki.
- NIE_ZMIERZONO: czysty baseline origin/main dla 5 testów niezielonych (nie tworzono drugiego worktree). Wniosek o niezwiązaniu opiera się na zakresie zmian i treści komunikatów testów.
BLOKADY:
1. KONFLIKT KRYTERIUM z decyzją: dispatch wymaga, by "Kamień Ha'amonga zawierał Łowiska rybackie i Łąka". Aktualne dane (commit d0f08d184; decyzja R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1, wariant A, lista #197) usunęły te wpisy z bonusy.teren, bo id nie istnieje albo silnik nie nalicza. Zgodnie z decyzją NIE przywrócono martwych wpisów. Strażnik sprawdza, że bonusy.teren Ha'amonga jest puste i że tekst zawiera blok miasta ("Miasto +3 kultury, +3 żywności (× każde miasto)"). DO ROZSTRZYGNIĘCIA przez orkiestratora/właściciela: czy nazwy "Łowiska rybackie"/"Łąka" mają wrócić do tekstu Ha'amonga. Wymagałoby to decyzji o naliczaniu, czego ten temat nie robi.
2. Audyt przecieków (pkt 2 celu) tylko CZĘŚCIOWY. Grep po wzorcach ${typTerenu|terenBazowy|zloze|nakladka|improvementKey|wonderId|...} w src/ dał trafienia będące kluczami wewnętrznymi (pending-improvements, buildHighlight, wonderRenderer) albo logami silnika AI (d.log w diplomacy-ai-forced-peace.ts:371 i war-weariness.ts:295, console w main.ts:4354). To nie jest tekst dla gracza. NIE_ZMIERZONO: pełny audyt kart budynków, ulepszeń i odkryć, tooltipów, powiadomień i CIVPEDIA w formie tabeli plik:linia. Wymaga osobnego przebiegu.
3. Identyfikatory cywilizacji w karcie cudu (np. "egipt, sumer") były wyciekiem; naprawione przez nazwaCywilizacji. W tekście modalu nie wystąpiły.
RUNDY: 1/5
ŚWIADOMIE NIEZROBIONE (pkt 3, żargon; wypisane jako C do ABC, NIE zmieniano):
- "NIE zwiększa Daniny miasta" w opisach handel_procent (Petra, Kolos, Brama Narodów, Pałac Weiyang, Ha'amonga). Wymaga decyzji terminologicznej wg R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1.
- "(cywilizacja)" w opisach specjalnych cudów.
- "× każde miasto" w modalu: sens zachowany, bez zmiany.
- "+10 podatku, utrzymanie ÷2" w main.ts: zgodne z R-WEB-TERMINOLOGY-TRADE-VS-TAX, bez zmiany.
ZAŁOŻENIA (luki rozstrzygnięte w dokumencie):
- Nazwy robocze dla rzeka_mala, rzeka_sasiad i tropiki (brak definicji w danych gry): "Mała rzeka", "Rzeka w sąsiedztwie", "Tropiki". Do zatwierdzenia przez właściciela; są w tabeli gra/src/game/text-names.ts.
- Ulepszenia biorą nazwę z terrain-improvements.json (pole nazwa). Teren i warunki z tabeli w text-names.ts.
- "Łowiska rybackie" dla id lowie_rybackie jest w tabeli zgodnie z dispatchem, choć to id nie występuje obecnie w danych cudów.
- Temat nie zmienia liczb, bonusów ani treści historia i uwagi.
- Istniejący gra/src/game/display-names.ts (etykiety państw i miast-państw) pozostawiono bez zmian. Nowy resolver to text-names.ts.
NASTĘPNY KROK: Orkiestrator: (a) rozstrzygnąć blokadę 1 (Ha'amonga); (b) zatwierdzić nazwy robocze z ZAŁOŻEŃ; (c) zlecić osobny temat audytu przecieków z pkt 2 (karty budynków, ulepszeń i odkryć, tooltipy, powiadomienia, CIVPEDIA) oraz przebieg w Chromium; (d) Evaluator i Final Control: Sonnet.
DEPLOY/PUSH: NIE WYKONANO
