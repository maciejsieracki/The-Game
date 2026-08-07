# PLAYBOOK — Protokół AutoBot (prompt i dokumentacja)
Ostatnia aktualizacja: 2026-08-07 · sesja nr 2

## 0. Pliki robocze projektu
<!-- Lista plików, które mają istnieć na starcie sesji (rytuał, krok 4).
     Aktualizowana przy każdym ZAMKNIĘCIU. -->
| Plik | Rola | Ostatnia aktualizacja |
|---|---|---|
| AUTOBOT-PROMPT.md | protokół — produkt główny (v1.2) | 2026-08-07 |
| AUTOBOT-opis-i-wdrozenie.md | opis działania i wdrożenia (v1.2) | 2026-08-07 |
| playbook.md | pamięć projektu | 2026-08-07 |

## 1. Fakty ustalone
<!-- Liczby i decyzje potwierdzone przez człowieka.
     Agent ich nie zmienia — może tylko zgłosić rozbieżność. -->
| Data | Fakt | Kto/co potwierdziło |
|---|---|---|
| 2026-08-07 | Język promptu i dokumentacji: polski | Naster (odpowiedź na pytanie) |
| 2026-08-07 | Środowisko docelowe: agenci z dostępem do plików (Claude Code, Cowork, Cursor) | Naster (odpowiedź na pytanie) |
| 2026-08-07 | Produkty: AUTOBOT-PROMPT.md (do wklejania) + AUTOBOT-opis-i-wdrozenie.md | Naster (zlecenie) |
| 2026-08-07 | Zasada nadrzędna protokołu: błędu nie popełnia się drugi raz | Naster (zlecenie) |
| 2026-08-07 | Progi cyklu życia zasad: poniżej 30% WYCOFANA, 30–60% W OBSERWACJI, powyżej 60% AKTYWNA; min. 10 zastosowań | materiał źródłowy AutoBot (od Nastera) |
| 2026-08-07 | Kontrola jakości działa w trybie adwokata diabła — walidator ma aktywnie próbować obalić pracę | Naster (polecenie, sesja 2) |

## 2. Zasady
<!-- Statusy: AKTYWNA / W OBSERWACJI / WYCOFANA / CHRONIONA.
     Nowa zasada startuje jako AKTYWNA z licznikiem 0/0.
     Licznik aktualizuj tylko wtedy, gdy zasada miała zastosowanie. -->
| ID | Zasada | Kiedy ma zastosowanie | Sprawdziła się | Zawiodła | Status |
|---|---|---|---|---|---|
| R-001 | Przy progach i przedziałach liczbowych sprawdź, czy pokrywają cały zakres bez luk i nakładek | dokument definiuje progi lub przedziały | 2 | 0 | AKTYWNA |
| R-002 | Po napisaniu dokumentu wykonaj osobne przejście weryfikujące każde odwołanie: numery sekcji, nazwy plików, cytowane polecenia | dokument z odwołaniami krzyżowymi | 1 | 1 | AKTYWNA |
| R-003 | Każde wyliczenie statusów lub kategorii podawaj w pełnej liście albo jawnie zaznacz, że to podzbiór | dokument wprowadza statusy lub kategorie | 1 | 1 | AKTYWNA |
| R-004 | Każdą wielkość, którą każesz liczyć, zdefiniuj wzorem przy pierwszym użyciu — wraz z wejściami wzoru i oknem czasowym | dokument każe coś liczyć lub porównywać | 1 | 1 | AKTYWNA |
| R-005 | Gdy instrukcja każe coś notować, śledzić lub odtwarzać, wskaż konkretne miejsce zapisu tych danych w szablonie | dokument definiuje proces zbierania danych | 1 | 1 | AKTYWNA |
| R-006 | Jedno pojęcie — jedna nazwa: kluczowe terminy identyczne w całym dokumencie i między dokumentami | teksty z terminologią techniczną | 1 | 1 | AKTYWNA |
| R-007 | Przed oddaniem wykonaj przejście korektorskie PL: cudzysłowy „…”, formy w/we, pleonazmy, pisownia łączna, interpunkcja wyrażeń zespolonych | każdy tekst po polsku | 1 | 1 | AKTYWNA |
| R-008 | Czytaj własne instrukcje literalnie, oczami agenta bez kontekstu — testuj pary rozkazów pod kątem sprzeczności i przykłady pod kątem literalnego wykonania | prompty i instrukcje dla agentów | 1 | 1 | AKTYWNA |
| R-009 | Kontrolę jakości prowadzi niezależny walidator w trybie adwokata diabła: aktywnie próbuje obalić pracę, szuka luk, sprzeczności i nadużyć interpretacyjnych | każde oddanie pracy | — | — | CHRONIONA (zatwierdzona poleceniem Nastera) |
| R-010 | Na starcie sesji zweryfikuj istnienie plików z listy „Pliki robocze projektu”; braki zgłoś i odtwórz tylko przy znanym ostatnim stanie | każda sesja pracy na plikach projektu | 0 | 0 | AKTYWNA |
| R-011 | Każdą poprawkę i nowo dopisany fragment sprawdź tą samą listą zasad co treść pierwotną — poprawki to też praca podlegająca playbookowi | każda zmiana w dokumentach projektu | 1 | 0 | AKTYWNA |
| R-012 | Każdy status/stan w mechanice musi mieć pełny cykl życia: jak powstaje, kto go zmienia, jak wraca i co się wtedy dzieje z licznikami | dokument definiuje statusy, stany lub uprawnienia | 1 | 0 | AKTYWNA |

## 3. Rejestr błędów — NIGDY WIĘCEJ
<!-- Najnowsze na górze. Powtórka błędu z tej listy = incydent krytyczny. -->
| Data | Co się stało | Przyczyna | Reguła zapobiegawcza (→ ID zasady) |
|---|---|---|---|
| 2026-08-07 | Rewalidacja v1.2 wykazała trzy drobiazgi: opis podawał węższą regułę przywracania niż prompt (N1), zdanie o rolach przypisywało obu rolom sekcje tylko Ewaluatora (N2), niezręczna fraza „na nich… na kopiach” (N3) | streszczenie w opisie zawężało reguły promptu | opis streszcza, ale nie zawęża → wzmocnienie R-006; naprawione od ręki |
| 2026-08-07 | INCYDENT KRYTYCZNY (recydywa): poprawki v1.1 powtórzyły klasy błędów z rejestru — krok 4 rytuału bez nośnika danych (klasa R-005), wiersz-przykład szablonu do literalnego wykonania (klasa R-008), wyliczenie sekcji playbooka niepełne bez oznaczenia (klasa R-003) | zasady stosowano do treści v1.0, ale nie do własnych, nowo dopisanych fragmentów | poprawki przechodzą tę samą kontrolę → R-011 |
| 2026-08-07 | Sprzeczne imperatywy: „utwórz zasadę natychmiast po błędzie” (sekcja 3) vs „nie zapisuj nowych zasad przed progiem statystycznym” (sekcja 6) | sekcje pisane osobno, bez testu par sprzecznych rozkazów | test par rozkazów → R-008; wyjątek dopisany w sekcjach 3 i 6 |
| 2026-08-07 | Wzór skuteczności bez definicji wejść (kiedy bić „sprawdziła się”/„zawiodła”); „średnia z ostatnich prób” bez okna | definicje uznane za oczywiste | definiuj wejścia i okna → R-004; dopisano „Jak bić liczniki” i okno 10 prób |
| 2026-08-07 | Luki cyklu życia statusów: przywracanie WYCOFANEJ bez procedury (literalny agent wycofałby ją ponownie), CHRONIONA bez wskazanego nadawcy, „Sprawy otwarte” bez wymuszonego przeglądu | mechanika opisana dla przypadku typowego, bez stanów brzegowych | pełny cykl życia każdego statusu → R-012 |
| 2026-08-07 | Edycje v1.1 trafiły w pustkę: pliki robocze z sesji 1 zniknęły między sesjami (folder tymczasowy wyczyszczony), odtworzono je z ostatniego znanego stanu | rytuał startowy nie obejmował weryfikacji istnienia plików roboczych | weryfikacja plików na starcie → R-010; w protokole krok 4 rytuału + sekcja 0 playbooka |
| 2026-08-07 | Luka w progach statusów: zakres 30–40% bez przypisanego statusu, w obu dokumentach | progi przepisane bez testu pokrycia całego zakresu | test pokrycia zakresu → R-001 |
| 2026-08-07 | Rytuał startowy kazał stosować tylko zasady AKTYWNE i W OBSERWACJI, z pominięciem CHRONIONYCH | wyliczenie pisane z pamięci, nie z pełnej listy statusów | pełne listy → R-003 |
| 2026-08-07 | Protokół kazał szukać wyłącznie pliku AUTOBOT.md, choć plik dostarczany nazywa się AUTOBOT-PROMPT.md | brak przejścia weryfikującego odwołania do nazw plików | weryfikacja odwołań → R-002 |
| 2026-08-07 | „Skuteczność” z progami procentowymi bez wzoru, jak ją liczyć | założenie, że czytelnik się domyśli | definicja wzorem → R-004 |
| 2026-08-07 | Instrukcja śledzenia czynników bez wskazania, gdzie je zapisywać w playbooku | mechanizm opisany bez nośnika danych | miejsce zapisu → R-005 |
| 2026-08-07 | „Zadziałały” zamiast „miały zastosowanie” — sugerowało sukces zamiast stosowalności | parafraza zamiast jednolitego terminu | jednolite terminy → R-006 |
| 2026-08-07 | Literalna sprzeczność: „nie ruszaj playbooka” obok nakazu wpisu do „Spraw otwartych”, które są sekcją playbooka | instrukcja nieczytana oczami agenta bez kontekstu | czytanie literalne → R-008 |
| 2026-08-07 | Błędy językowe: „w współpracownika”, „nie-informatyku”, „tydzień czasu”, mieszane cudzysłowy | brak przejścia korektorskiego przed oddaniem | korekta PL → R-007 |

## 4. Dziennik wniosków
<!-- Najnowsze na górze. Ten dziennik jest ważniejszy od samych zasad —
     pokazuje, DLACZEGO zasady wyglądają tak, a nie inaczej.
     Gdy miary jeszcze nie ma, wpisz: „Skutek: oczekuje — patrz Sprawy otwarte”. -->
### 2026-08-07 — sesja 2: praca w protokole AutoBot, walidacja v1.1, wydanie v1.2
- Zrobiono: założono playbook; odtworzono pliki po incydencie zniknięcia (→ R-010);
  przegląd v1.1 własnymi zasadami; walidacja zewnętrzna w trybie adwokata diabła
  (R-009); naprawa wszystkich usterek → v1.2.
- Skutek (miara): walidacja v1.1 — 7 usterek krytycznych i 13 drobnych, w tym
  3 nawroty klas błędów z rejestru (incydent krytyczny — zgłoszony Nasterowi).
  Rewalidacja v1.2 — 7/7 krytycznych naprawionych, 0 nowych krytycznych,
  3 drobiazgi (N1–N3) naprawione od ręki. Rdzeń mechaniki (progi, statusy,
  spójność międzyplikowa, tabele) obronił się w obu atakach.
- Wniosek: samokontrola autora nie zastępuje zewnętrznego ataku — 6 z 8
  zastosowanych zasad przepuściło usterki we własnej domenie mimo świadomego
  stosowania; przy drugim zastosowaniu (już z R-011) te same zasady zadziałały.
  Poprawki muszą przechodzić tę samą kontrolę co treść pierwotna (→ R-011),
  a każdy status wymaga pełnego cyklu życia (→ R-012).

### 2026-08-07 — sesja 1: utworzenie AUTOBOT-PROMPT.md i opisu (v1.0)
- Zrobiono: oba dokumenty napisane od zera z materiału źródłowego; przed oddaniem
  kontrola jakości przez niezależnego podagenta (zasada 8 protokołu, stosowana
  awansem — protokół dopiero powstawał).
- Skutek (miara): walidator znalazł 13 usterek (0 krytycznych, 7 logicznych,
  6 językowych); wszystkie poprawiono przed oddaniem; człowiek przyjął pracę
  bez własnych poprawek.
- Wniosek: pisanie bez list kontrolnych dało ok. 13 usterek na ok. 400 linii;
  świeże oko wyłapało je, zanim trafiły do użytkownika. Każdą usterkę przekuto
  w zasadę zapobiegawczą (R-001…R-008).

## 5. Sprawy otwarte — czekają na dane
<!-- W kolumnie „Kiedy/skąd” podawaj konkretną datę lub zdarzenie.
     Sekcja przeglądana obowiązkowo na starcie każdej sesji (rytuał, krok 2). -->
| Data | Co czeka na weryfikację | Kiedy/skąd przyjdzie wynik |
|---|---|---|
| 2026-08-07 | Czy protokół w praktyce ogranicza powtórki błędów u innych agentów | po pierwszych wdrożeniach przez Nastera |
