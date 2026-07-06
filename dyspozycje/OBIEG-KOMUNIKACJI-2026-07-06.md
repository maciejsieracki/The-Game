# OBIEG KOMUNIKACJI v2 — obowiązuje WSZYSTKICH (Cowork + wszystkie grupy Cursor)

Ogłoszenie Macieja, 2026-07-06. Zastępuje wcześniejsze protokoły komunikacji.
Powstał z lekcji nocy 5/6.07 i samokrytyki mastera Cursora (5 grzechów → 5 reguł).

## DO WKLEJENIA KAŻDEMU CZATOWI/GRUPIE (jedno zdanie):
„Przeczytaj dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md i dyspozycje/START-TU.md,
stosuj od zaraz, potwierdź wpisem w swojej skrzynce."

## 1. PIĘĆ REGUŁ (z błędów starego obiegu — łamanie = powtórka katastrofy)

1. **NAJPIERW PLIKI, POTEM ROZMOWA.** Każdą turę operacyjną zaczynasz od przeczytania
   swojej skrzynki i kanału. Odpowiadasz dopiero, gdy znasz stan z plików, nie z pamięci.
2. **DOMYKAJ PĘTLĘ W TEJ SAMEJ TURZE.** Skończyłeś krok → NATYCHMIAST wpis (meldunek,
   dziennik, status). Nie ma „domknę później" — później = zgubione.
3. **CZYSTOŚĆ RÓL.** Do każdego celu publikuje dokładnie JEDEN wykonawca:
   robocza = INTEGRATOR (Cowork), kanon i finalna = master Cursor (tylko promocje
   z pakietów DO-KANONU, na hasło Macieja). Nikt inny nie wgrywa NICZEGO.
4. **JEDNA PRAWDA O WERSJACH.** Numery (md5/stemple) żyją TYLKO w `dyspozycje/WERSJE.md`.
   Wpisuje publikujący zaraz po publishu. Wszyscy inni linkują, nigdy nie kopiują.
5. **RÓB, NIE ROZPRAWIAJ.** Na decyzję Macieja — wykonanie, nie esej. Pytania do
   Macieja: max 3 naraz, format A/B/C, wpisem w skrzynce/kanale.
6. **CZAS POLSKI WSZĘDZIE (Europe/Warsaw).** Każda godzina/data we wpisach kanału,
   stemplach buildów, WERSJE.md i meldunkach = czas polski. Sandboxy mają zegar
   amerykański/UTC — w bashu ZAWSZE `TZ=Europe/Warsaw date`; host-side zegar jest OK.
   Wpis z czasem z innej strefy = błąd protokołu (myli Macieja co do dni).

## 2. KTO CZYTA CO, KTO PISZE GDZIE

| Rola | Czyta na starcie tury | Pisze do |
|---|---|---|
| **MASTER (Cowork czat 1)** | KANAL-PRACA + skrzynki + WERSJE | KANAL-PRACA (zadania), DO-KANONU (pakiety), raporty dla Macieja |
| **INTEGRATOR (Cowork czat 2)** | KANAL-PRACA | KANAL-PRACA (meldunki), WERSJE (po publishu roboczej) |
| **UX (Cowork czat 3)** | KANAL-PRACA + ROLA-UX | KANAL-PRACA (meldunki UX-GOTOWE) |
| **master Cursor (Grupa G)** | DO-KANONU + WERSJE + KANAL-PRACA (tylko odczyt) | WERSJE (po promocji kanon/finalna), CURSOR-DO-MASTERA.md (sprawy do Cowork) |
| **Grupy Cursor A–F, 0** | START-TU + dyspozycja od swojego mastera | swoja skrzynka `<GRUPA>-DO-MASTERA.md` (jak dotąd) — masterem grup jest master Cursor |
| **Maciej** | nic nie musi | mówi czatom „sprawdź kanał/skrzynkę"; decyzje w rozmowie |

## 3. PLIKI OBIEGU (wszystkie w `dyspozycje/`)
- `START-TU.md` — punkt wejścia każdej sesji (role, zasady, mapa plików)
- `_handoff/KANAL-PRACA.md` — kanał operacyjny Cowork (zadania ↔ meldunki, append-only,
  wpisy `[HH:MM] OD → DO`, stopka `CZEKAM-NA:`)
- `_handoff/DO-KANONU.md` — pakiety promocyjne robocza→kanon (pisze MASTER Cowork,
  czyta master Cursor przed KAŻDĄ promocją)
- `WERSJE.md` — rejestr wersji (jedyne miejsce z md5/stemplami)
- `_handoff/CURSOR-DO-MASTERA.md` — skrzynka mastera Cursor do MASTERA Cowork
  (pytania/ustalenia międzysystemowe; NOWA — zamiast przeklejania przez Macieja)
- skrzynki grup Cursor `*-DO-MASTERA.md` — bez zmian (wewnętrzne dla Cursora)

## 4. ŁAŃCUCH WERSJI I GRANICE (przypomnienie)
robocza (`gra-robocza\Gra-ROBOCZA.html` + PLAYTEST-* + hub START.html; buduje INTEGRATOR)
→ kanon (`gra-kanon\`; promuje master Cursor z pakietu DO-KANONU, na hasło Macieja)
→ finalna (root; promuje master Cursor). Testuje wyłącznie Maciej. TYLKO DO PRZODU:
zero restore/backupów — braki dopisujemy kodem. Determinizm generatora nietykalny.

## 5. POTWIERDZENIA
Każdy czat/grupa po przeczytaniu potwierdza JEDNYM wpisem w swojej skrzynce/kanale:
„OBIEG v2 przyjęty — <rola>". Brak potwierdzenia = grupa nie pracuje, aż potwierdzi.

## 6. STARY SYSTEM ŻYJE — TO USPRAWNIENIE, NIE REWOLUCJA (korekta Macieja 2026-07-06)
NIE rozwalamy dotychczasowego przepływu — usprawniamy go i wpinamy role Cowork.
Skrzynki `*-DO-MASTERA.md`, handoffy `_handoff/`, STAN-y i DZIENNIK działają DALEJ
jako kanały i archiwum. Bannery „NIEAKTUALNE/HISTORYCZNE" znaczą wyłącznie:
w sprawach RÓL, PUBLISHU, WERSJI i KOMEND pierwszeństwo mają pliki v2 (START-TU,
OBIEG, ROLE-I-ZAKRESY, KANAL-PRACA, WERSJE). Wszystko inne — merytoryka, decyzje
projektowe, kontrakty — obowiązuje jak dotąd. Nic się nie kasuje. KTO robi dany
temat (UX w Cowork czy grupa w Cursorze) ustala Maciej z MASTEREM na bieżąco —
ważne, żeby flow był jeden i nic się nie wykluczało.

## 7. WYKONUJ, NIE AUDYTUJ (lekcje z zastoju lane UI — obowiązuje każdy lane/czat)
1. Dyspozycja = EDYCJA PLIKÓW, nie raport. Audyt/inwentaryzacja tylko, gdy zadanie
   wprost o to prosi. „Czytał i opisał" ≠ postęp.
2. Twardy podział na starcie zadania: A = mam materiały → KODUJĘ od razu;
   B = brak materiałów (np. mockupu) → formalne zlecenie do właściciela braku
   (wpis w kanale/skrzynce), a ja robię równolegle listę A. Nie czekam biernie.
3. Jeden subagent = jeden temat = jeden plik. Bez sesji-kombajnów.
4. Każde zakończone zadanie MUSI mieć meldunek „GOTOWE" (kanał/skrzynka) z listą
   zmienionych plików i AC — bez tego praca „nie istnieje" dla reszty systemu.
5. Lane nie publikuje, ale ma obowiązek flagi „→ GOTOWE do wpięcia" — stagnacja
   i gotowość mają wyglądać INACZEJ.

## 8. KOLEJKI ZAMIAST POJEDYNCZYCH ZADAŃ (minimalizacja budzenia przez Macieja)
Agenci nie widzą zmian w plikach sami — budzi ich Maciej. Dlatego jedno obudzenie
MUSI starczać na całą sesję pracy:
1. Każde GO („sprawdź kanał") = obowiązek pętli: wykonaj zadanie → meldunek →
   PONOWNIE przeczytaj kanał/kolejkę → weź następne → … aż kolejka pusta albo
   twarda blokada (wtedy wpis CZEKAM-NA i stop).
2. MASTER pisze zadania jako KOLEJKI (numerowane pozycje z AC), nie pojedyncze prośby.
3. Praca wielorolowa w obrębie JEDNEGO zadania = subagenty wewnątrz czatu (tam
   komunikacja jest aktywna), nie przerzucanie między czatami.
4. Miara jakości obiegu: liczba obudzeń Macieja na jeden skończony batch. Cel: ≤2.

## 9. SANDBOX ZAWSZE ODTWARZALNY Z DYSKU (decyzja Macieja 2026-07-06)
Sandbox jest ULOTNY (restart aplikacji/komputera = czysty /tmp) i Maciej może
wyłączyć komputer w każdej chwili. Dlatego:
1. Po KAŻDYM ukończonym kroku czat składa na dysk (bash cp) do SWOJEGO katalogu
   `gra-robocza\_sandbox\<ROLA>\` wszystko wytworzone w /tmp, co nie jest lustrem
   na dysku (skrypty, runnery, harnessy; NIGDY node_modules/bundli) + aktualizuje
   `STAN-SANDBOXA.md` (zawartość /tmp + jedna komenda odtworzenia + [HH:MM PL]).
   Meldunek bez tego = krok niedomknięty.
2. Komenda Macieja „zabezpiecz" = natychmiastowy pełny zrzut (szczegóły KOMENDY.md).
3. Po każdym resecie: odtworzenie wyłącznie ze STAN-SANDBOXA/skryptów — zero
   odtwarzania „z głowy".

## 9. NIC NIEDOKOŃCZONEGO NIE JEST „ZROBIONE" (reguła Macieja 2026-07-06)
Coś, co nam uciekło/umknęło — przeoczony bug, luka, pole które się nie domknęło,
temat którego nie wiemy jeszcze jak rozwiązać — jest **NIEWYKONANE**. Nie „zrobione",
nie „częściowo i zapominamy". Zostaje na liście jako **OTWARTE**, dopóki Maciej nie
zdecyduje, co z tym zrobić. Zakaz odhaczania „zrobione" i puszczania tematu w niepamięć.
- W raportach: takie punkty ZAWSZE w sekcji C (wymaga działania / OTWARTE), NIGDY w A.
- „Zrobione" = DOPIERO po werdykcie Macieja (OK po playteście). Do tego czasu = otwarte.
- To, że kod się zbudował/wdrożył/przeszedł tsc, NIE znaczy „temat zamknięty".
- Domykając pętlę w kanale wymieniaj też to, co UMKNĘŁO/zostało otwarte — stopka
  „OTWARTE:" obok „CZEKAM-NA:", żeby nic nie ginęło między turami.
