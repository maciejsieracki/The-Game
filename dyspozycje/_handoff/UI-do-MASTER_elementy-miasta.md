# ZAPYTANIE UI -> MIASTO (przez Maciej): elementy widoku miasta z makiety Widok-miasta.html  [2026-06-25]

Kontekst: UI zaimplementowalo pelny widok miasta (cityPanel.ts). Sekcje na realnych danych gotowe
(Plony, Produkcja+Wykup+Wstrzymaj, Kolejka, Budynki/Ulepsz-epokowy, Magazyn zywnosci, Okolica-heksy, Garnizon).
Pozostale panele z bogatej makiety sa na razie LEKKIMI PLACEHOLDERAMI, bo zaleza od mechaniki MIASTA/spoleczenstwa.
Zanim je rozbuduje 1:1 do makiety, prosze MIASTO o odpowiedz PUNKTOWO (1-9): dla kazdego elementu
(a) czy jest w mechanizmie MIASTO (jest / planowane / NIE w v0.1), (b) jaki ksztalt danych/haka UI dostanie,
(c) czy element zostaje wplatany w mechanizm, czy odpada.

1. MIESZKANCY — rozklad nastrojow (Zadowoleni/Kontentni/Niezadowoleni) + premia szczescia.
   Czy order.ts liczy to per miasto? Hak getOrderState juz mam (szczescie/porzadek/T1/T2/bunt) —
   czy wystarczy, czy potrzebny osobny rozklad liczby mieszkancow wg nastroju?
2. SPECJALISCI (Uczony/Poborca/Artysta) — przydzial ludnosci do nauki/pieniadza/kultury.
   Czy jest w mechanizmie? Jak UI ma czytac/USTAWIAC przydzial (akcja + kto przelicza efekt)?
3. ZDROWIE MIASTA (+/- z Akweduktu/Rzeki/Targowiska/Bagna/Zanieczyszczen). Czy modelowane? Jaki hak?
4. PODZIAL HANDLU (suwak Nauka/Pieniadz/Luksus, dzis 60/30/10). economy.podzialHandlu istnieje —
   czy per-miasto EDYTOWALNY z UI? Czy UI ma suwakiem zmieniac podzial i kto przelicza plony?
5. MAGAZYNY SUROWCOW (Drewno/Kamien/Cegla/Braz/Bydlo/Owce z ILOSCIA i pojemnoscia).
   UWAGA: notatki v0.1 mowia "surowiec = DOSTEP (boolean), nie ilosc". Czy magazyny ILOSCIOWE sa w v0.1,
   czy to placeholder na przyszlosc (wtedy UI pokazuje tylko DOSTEP, nie ilosci)?
6. KULTURA I RELIGIA (kultura lacznie, zasieg granic, religia/wyznawcy, zrodla kultury).
   culture-religion.ts — jakie pola UI dostanie (hak)?
7. ZASIEG GRANIC z kultury (progi rozszerzenia terytorium) — czy UI ma to pokazywac i skad dane?
8. WIOSKI (V) w okolicy + przeksztalcanie w miasto — czy mechanika wiosek istnieje?
   Akcja "Przeksztalc w miasto" idzie do kogo (MIASTO/SILNIK)?
9. NAGLOWEK: Zarzadca automatyczny, Zmien nazwe, Widok artystyczny — czy przewidziane?
   Jesli tak, kto realizuje akcje (UI tylko wola callback)?

Po odpowiedzi: elementy "w mechanizmie" rozbuduje w cityPanel z odpowiednim hakiem; "nie w v0.1" zostawie
jako lekki placeholder lub usune z widoku wg decyzji MIASTO.
