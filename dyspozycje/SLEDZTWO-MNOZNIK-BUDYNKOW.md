# ŚLEDZTWO: pole `mnoznik` w budynkach (`gra/data/buildings.json`)

**Data śledztwa:** 2026-07-25. **Zadanie:** `R-MNOZNIK-BUDYNKI` (`dyspozycje/REJESTR-PROSB-I-ZADAN.md:178`). Tryb: archiwalny, read-only — bez zmian w kodzie/danych.

**Metoda:** przeszukanie `dyspozycje/` (30 plików z trafieniem), `docs/` (42 pliki), `panele-sterowania/`, historii gita (`git log -S`) na `gra/data/buildings.json` i `gra/src`, oraz porównanie żywego JSON-a z zamrożoną migawką dokumentacji `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` i `docs/encyklopedia/budynki/*.md` (obie wygenerowane z `buildings.json`, rev. E, **2026-07-03** — 6 dni PRZED korzeniem historii gita tego repo).

---

## (A) Werdykt: do czego miał służyć mnożnik

**Ustalone jednoznacznie — to NIE był jeden mechanizm, tylko 5 osobnych, budynkozależnych % bonusów**, każdy opisany wprost w polu `uwagi` danego budynku. Pole `mnoznik` (liczba w `baza`/`przyrost`, ten sam wzorzec skalowania co `praca`/`pieniadz`/... — poziom 1 = `baza`, każdy kolejny += `przyrost`) było **kontenerem liczbowym**, a `uwagi` niosło **semantykę** tego, co dana wartość miała mnożyć. Dowody (cytaty z `gra/data/buildings.json`, stan bieżący):

| Budynek | `baza`(+przyrost) | `uwagi` (dosłowny cytat) | Kategoria efektu |
|---|---|---|---|
| `kuznia` (buildings.json:91-122) | 5(+2) | „Mnoznik % dotyczy **sily jednostek produkowanych w miescie**" | Siła jednostek (produkcja) |
| `kuznia_zelaza` (:1053-1085) | 8(+3) | „Mnoznik % dotyczy **sily jednostek zelaznych produkowanych w miescie**; wymaga dostepu do zelaza" | Siła jednostek żelaznych |
| `wielka_kuznia` (:1093-1125) | 23(+7) | dziś: „Upgrade Kuźnia żelaza → Wielka Kuźnia; suma bonusów w JSON" — **ale patrz niżej, tekst pierwotny inny** | Siła + koszt produkcji WSZYSTKICH jednostek (patrz B) |
| `koszary` (:813-844) | 5(+2) | „Mnoznik % dotyczy **sily i exp jednostek szkolonych w miescie**" | Siła + EXP jednostek |
| `akademia_wojskowa` (:1476-1507) | 20(+6) | dziś: „Upgrade Koszary → Akademia wojskowa; suma bonusów w JSON" — pierwotny tekst (patrz B): „Mnoznik % dotyczy **sily i exp WSZYSTKICH jednostek szkolonych w miescie**; prereq elitarnych jednostek top-tier Zelaza" | Siła + EXP wszystkich jednostek |
| `warsztat_oblezniczy` (:1171-1202) | 10(+3) | brak wzmianki o mnożniku (ani dziś, ani w archiwalnym poradniku) — **NIEUDOKUMENTOWANE**, patrz uwaga niżej | Prawdopodobnie j.w. (Wojsko), ale nigdy nie opisane |
| `targowisko` (:209-251) | 0(+3) | „Mnoznik % dotyczy **przychodow z handlu w miescie**" | Dochód z handlu (lokalny) |
| `karawanseraj` (:336-367) | 8(+3) | „Mnoznik % dotyczy **handlu ladowego** (szlaki miedzy miastami)" | Dochód z handlu lądowego (trasy) |
| `akademia` (:1211-1242) | 10(+3) | dziś: „ABC-21 B: merge Biblioteka+Akademia+Teatr — suma w JSON" — pierwotny tekst (patrz B): „Mnoznik % dotyczy **globalnej puli nauki** (nadbudowka nad Biblioteka)" | Mnożnik globalnej puli nauki (imperium) |
| `pretorium` (:1327-1358) | 5(+2) | „(...) **mnoznik % do przychodu podatkowego**" | Dochód podatkowy |
| `lazaret` (:1441-1472) | 5(+2) | „(...) **mnoznik % do tempa regeneracji** [HP] - styk UNITS" | Tempo regeneracji HP jednostek w mieście |

Dowód pomocniczy (ten sam sens innymi słowami, poza JSON-em): `dyspozycje/SUROWCE-KANON-2026-07-22.md:90` — „`kuznia_zelaza` → `wielka_kuznia` (**mnożnik wojska** + stal)" — potwierdza gałąź wojskową.

**Wniosek:** design jest spójny i celowy — pole `mnoznik` to ósmy, „elastyczny" slot liczbowy w schemacie `baza`/`przyrost` (obok `praca/pieniadz/zywnosc/nauka/kultura/zadowolenie/obrona`), którego **znaczenie zależy od kategorii budynku**: Wojsko → siła/EXP jednostek, Handel → dochód z handlu, Nauka (Akademia) → globalna pula nauki, Administracja (Pretorium) → podatki, Zdrowie+Wojsko (Lazaret) → regeneracja HP. Nigdy nie miał jednego uniwersalnego znaczenia „×N do wszystkiego".

**Efekt uboczny odkryty przy okazji:** generator dokumentacji gracza (`docs/PORADNIK-GRACZA/45-katalog-budynkow.md`, `docs/encyklopedia/budynki/*.md`, sekcja „Wiki-M") nakleja na KAŻDY budynek z niezerowym `mnoznik` ten sam, generyczny szablonowy podpis „**+N % mnożnika handlu**" — niezależnie od realnego znaczenia z `uwagi` (np. Akademia, Lazaret, Pretorium dostają etykietę „mnożnik handlu", choć ich `uwagi` mówi o nauce/regeneracji/podatkach). To dodatkowy dowód, że nikt nigdy nie dociągnął generatora do specyfiki per-budynek — bo mechanizm i tak nie działał w silniku, więc etykieta nie miała gdzie się „wysypać" w praktyce gry.

---

## (B) Czy kiedykolwiek był zaimplementowany

**Nie — w śledzonej historii gita NIGDY.** Ustalenia:

1. `git log --all -S "baza.mnoznik" -- gra/src` i `git log --all -S "przyrost.mnoznik" -- gra/src` → **jedyny commit to `1341975`** (korzeń repo, `git rev-list --max-parents=0 --all` potwierdza brak rodzica). Oznacza to, że kod UI odczytujący te pola (`gra/src/ui/cityPanel.ts:4610-4612`, `:4967-4969`; `gra/src/game/building-upgrades.ts:51` `STAT_KEYS`) istnieje **od pierwszego widocznego stanu repo, bez zmian** — nigdy nie było wersji z realną konsumpcją w silniku, która później zniknęła (w śledzonej historii).
2. Typ jest sformalizowany: `gra/src/game/economy.ts:57-70` definiuje `BuildingYieldKey`/`BuildingYields` z polem `mnoznik: number` na równi z `praca/pieniadz/...`, ale **żadne wystąpienie `.mnoznik` poza deklaracją typu** w `economy.ts` ani `gra/src/data/loader.ts` (zero trafień na wzorzec dostępu do wartości). Silnik ekonomii (`economy.ts:604-700`, opisany w `dyspozycje/AUDYT-WERYFIKACJA-53-WERDYKTY.md:221-229`) liczy plony przez zupełnie inne, nazwane mnożniki (`mennicaMnoznik`, `walutaMnoznik`, `civHandelMult`, `civNaukaMult`, Porządek/`applyOrderYieldMults`) — żaden z nich nie czyta `BuildingRecord.baza.mnoznik`.
3. **Repo ma jeden problem metodologiczny**: cały tracked git log zaczyna się `1341975` (9 lipca 2026, squash/import z fazy Cursor — dowód: `.cursor/hooks/pre-compact-sync.py` dodany w tym samym commicie). **Nie da się w gicie zobaczyć niczego sprzed tej daty.** Dlatego pytanie „czy zniknął w konkretnym commicie" ma częściową odpowiedź:
   - Dla 9 z 11 budynków (kuznia, kuznia_zelaza, koszary, targowisko, karawanseraj, warsztat_oblezniczy, pretorium, lazaret) — tekst `uwagi` opisujący sens mnożnika jest **identyczny od korzenia repo do dziś** (zero driftu, sprawdzone `git log -S "Mnoznik %" -- gra/data/buildings.json` → tylko `1341975`).
   - Dla **2 budynków sens ZAGINĄŁ, ale przed erą gita**: `wielka_kuznia` i `akademia`. Dowód: `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` (adnotacja „Wygenerowano z buildings.json ... rev. E 2026-07-03") oraz `docs/encyklopedia/budynki/wielka_kuznia.md`, `akademia.md` zawierają **starszy, bogatszy tekst `uwagi`**, którego już nie ma w dzisiejszym `buildings.json`:
     - `wielka_kuznia` (rev. E 2026-07-03): „Mnoznik % dotyczy **sily i kosztu produkcji wszystkich jednostek w miescie**; wymaga dostepu do stali" → dziś (od korzenia repo `1341975`, czyli od 9 lipca): „Upgrade Kuźnia żelaza → Wielka Kuźnia; suma bonusów w JSON" (`buildings.json:1125`).
     - `akademia` (rev. E 2026-07-03): „Mnoznik % dotyczy **globalnej puli nauki** (nadbudowka nad Biblioteka)" → dziś: „ABC-21 B: merge Biblioteka+Akademia+Teatr — suma w JSON; Teatr ukryty z produkcji" (`buildings.json:1242`).
     - `git log --all -S "globalnej puli nauki"` i `-S "sily i kosztu produkcji wszystkich jednostek"` na `buildings.json` → **zero trafień w całej śledzonej historii** — czyli podmiana nastąpiła **między 2026-07-03 a 2026-07-09**, w fazie Cursor sprzed importu do gita (prawdopodobnie przy scalaniu ABC-13 „Piec hutniczy→Odlewnia żelaza" i ABC-21 „merge Biblioteka+Akademia+Teatr" — oba ślady widoczne w dzisiejszych `uwagi` innych budynków z tych samych partii). **Nie da się wskazać konkretnego hasha** — commit nie istnieje w tym repo.
4. Jedyne dotknięcia `mnoznik` w `buildings.json` w śledzonej historii gita to: dodawanie kosztów surowcowych/pól przy okazji (`2d9f173`, `1119b45`, `450394c`, `80d4287`), oraz świadome wyzerowanie błędnego duplikatu w Pałacach (`019f6a2`, 2026-07-25 — „wyzeruj bledny 'mnoznik' (byl duplikatem kultury 5/8/11, nieuzywany przez silnik)"). **Żaden z tych commitów nie dodawał ani nie usuwał konsumpcji w silniku** — tylko dane.

**Podsumowanie (B):** Mechanizm nigdy nie zadziałał w kodzie, odkąd repo jest śledzone. Jego *opisowa* treść (co miał robić) była kompletna i spójna dla 9/11 budynków od zawsze; dla 2/11 (Wielka Kuźnia, Akademia) oryginalny opis zaginął w nieudokumentowanym scaleniu sprzed importu do gita — ale sam **numer** (`mnoznik`) przetrwał niezmieniony, więc dane liczbowe nie ucierpiały, tylko wyjaśnienie w `uwagi`.

---

## (C) Skąd pochodzą wartości

- **Nie z panelu Excel.** `panele-sterowania/gen-panel-b.py:25` (`BAZA_KEYS = [..., "mnoznik"]`) tylko **kopiuje** klucz `mnoznik` z `buildings.json` do arkusza „Budynki" jako zwykłą kolumnę `baza.mnoznik`/`przyrost.mnoznik` — bez żadnego dodatkowego opisu/nagłówka wyjaśniającego sens (nagłówek arkusza to ogólne `ID/Parametr/Opis/Wartość/Zakres/Jednostka/Wpływ/Plik`, wypełniane z samego JSON-a). Kierunek przepływu w tym repo to zawsze JSON→Excel (zgodnie z zasadą #2 CLAUDE.md), więc panel nie mógł być źródłem — jest tylko lustrem.
- **Arkusz „Budynki-eco"** (`gen-panel-b.py:302`, źródło `econ-params.json`, etykieta „economy.ts mnozniki") to **INNY, niepowiązany system** — realne, konsumowane mnożniki ekonomii (`budynek_mennica_mnoznik`, `waluta_mnoznik`, `mennica_mnoznik_po_walucie` itd. w `econ-params.json` + `economy.ts`). Nie mylić z polem `mnoznik` w `baza`/`przyrost` budynków — to źródło częstych fałszywych trafień przy grepowaniu „mnoznik" w repo.
- **Najbardziej prawdopodobne pochodzenie:** ręczne/generowane przez agenta LLM dane wpisane bezpośrednio do `buildings.json` w fazie przedgitowej (Cursor, przed 2026-07-09), zgodnie ze wzorcem „każdy budynek ma 8 wymiarów liczbowych (`praca...obrona` + `mnoznik`), opisanych słownie w `uwagi`" — widocznym jednolicie we WSZYSTKICH budynkach od korzenia repo. Brak śladu innego źródła (nie ma go w `panele-sterowania/`, nie ma w `gra/tools/gen-panel-*.py` jako specjalnie obsłużone pole, nie ma osobnego pliku źródłowego typu `mnoznik-budynki.csv`).

---

## (D) Rekomendacja dla właściciela

Pole jest **martwe kosmetycznie od zawsze** (widoczne w karcie budynku jako chip „×N mnożnik", ale bez wpływu na rozgrywkę), a jego znaczenie **różni się per budynek** — to nie jest jeden brakujący if w silniku, tylko **5 osobnych mechanizmów do dopisania**, każdy w innym miejscu kodu:

| Grupa | Budynki | Gdzie trzeba by wpiąć | Złożoność |
|---|---|---|---|
| Siła/EXP jednostek | kuznia, kuznia_zelaza, wielka_kuznia, koszary, akademia_wojskowa, (warsztat_oblezniczy?) | `combat.ts` / tworzenie jednostki w mieście (`main.ts`?) — trzeba dociągnąć „miasto pochodzenia" do statystyk jednostki | Średnia-wysoka (dotyka walki, jednostek stacjonujących vs nowo tworzonych — patrz niejasność „produkowanych" vs „wszystkich w mieście") |
| Dochód z handlu | targowisko, karawanseraj | `economy.ts` (obok istniejących `budynekTargowiskoBonusHandlu` w `econ-params.json` — być może **duplikuje** już istniejący mechanizm bonusu Targowiska!) | Niska, ale ryzyko podwójnego liczenia z istniejącym `budynek_targowisko_bonus_handlu` |
| Globalna pula nauki | akademia | `turn-economy.ts` (pula imperium) | Średnia |
| Podatki | pretorium | `economy.ts` / `wealth.ts` | Niska |
| Regeneracja HP | lazaret | logika stacjonowania/regeneracji jednostek (styk UNITS, poza obecnym zakresem v0.1 — Lazaret ma `epokaWejscia:4`, poza cap Żelaza) | Niska, ale odłożona razem z całym budynkiem |

**Trzy opcje:**

- **(A) Zaimplementować w pełni, osobno dla każdej grupy** — zgodnie z formułą `bonus% = baza + przyrost×(poziom-1)`, stosowaną multiplikatywnie do właściwej wartości (np. `sila_jednostki *= (1 + mnoznik/100)`). **Za:** przywraca zamierzony, spójny design (11 budynków przestaje być kosmetyką); karty budynków przestają kłamać (chip „×N mnożnik" faktycznie coś robi). **Przeciw:** to 5 osobnych zmian w 4-5 różnych plikach silnika, w tym w walce (combat.ts) — ryzykowne bez pełnego przetestowania; ryzyko podwójnego liczenia z istniejącym bonusem Targowiska (`budynek_targowisko_bonus_handlu`); Warsztat oblężniczy ma wartość, ale zero udokumentowanego zamiaru — wymaga decyzji właściciela co ona ma robić.
- **(B) Usunąć pole z kart/danych** (wyzerować jak Pałace w `019f6a2`, docelowo usunąć z JSON i UI) — najprostsze rozwiązanie zgodne z zasadą #5 CLAUDE.md („najprostsze rozwiązanie wygrywa", „nie twórz problemów, których nie ma"). **Za:** zero ryzyka regresji; koniec z kłamiącym UI (chip sugerujący nieistniejący efekt); upraszcza schemat budynku do faktycznie działających 7 wymiarów. **Przeciw:** trwale rezygnuje z 11 zaplanowanych bonusów budynków wojskowych/handlowych/naukowych/administracyjnych/zdrowotnych, które wydają się przemyślanym elementem progresji (np. sens „upgrade Kuźni → Wielkiej Kuźni" częściowo opiera się na tym bonusie, nie tylko na surowych `praca/pieniadz`).
- **(C) Zostawić jak jest (status quo), ale poprawić etykietę w UI** tak, by nie sugerowała działającego efektu (np. dopisek „(nieaktywne — planowane)" przy chipie), i zdecydować o (A)/(B) później, gdy pojawi się przepustowość na balans wojska/handlu/nauki. **Za:** nie blokuje bieżącej pracy, nie wymaga decyzji pod presją. **Przeciw:** kontynuuje mylącą kartę budynku (choć złagodzoną etykietą); odkłada dług.

**Rekomendacja: (C) na teraz, z celem (A) później** — pole opisuje spójny, zamierzony design (5 dowiedzionych mechanizmów + 1 niejasny: Warsztat oblężniczy), więc kasowanie (B) wyrzuciłoby przemyślaną robotę koncepcyjną; ale pełna implementacja (A) to osobny epik dotykający walki i ekonomii naraz — nie robić „przy okazji". Najpierw: zablokować mylące UI (dopisek „planowane"/ukryć chip), potem osobna decyzja ABC per grupa (wojsko / handel / nauka / podatki / regeneracja), zaczynając od najtańszej (Pretorium — podatki, brak dotknięcia walki).

**Otwarte pytanie do właściciela:** czym miał być mnożnik w **Warsztacie oblężniczym** (10/+3) — jedyny budynek z niezerową wartością bez ŻADNEGO śladu opisu (ani w `uwagi`, ani w archiwalnym poradniku). Hipoteza (nieudowodniona): ten sam wzorzec co inne budynki Wojska (siła jednostek oblężniczych — Katapulta/Taran/Wieża) — ale to zgadywanie, nie ustalony fakt.
