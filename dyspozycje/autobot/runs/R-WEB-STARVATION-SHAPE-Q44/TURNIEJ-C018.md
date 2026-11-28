# Turniej C-018 Q44 (zwycięzca: SYNTEZA; 2 projekty Haiku + Sędzia Sonnet)

## Naruszenia

**PROJEKT 1**
1. Fałsz wobec FAKTY: w Sytuacji pisze, że blokada końca tury „jest już zdjęta". FAKTY mówią, że to tylko decyzja właściciela, a blokada nadal istnieje w kodzie (zdjęcie to praca do wykonania). Skutek uboczny: wariant A ma w „Konsekwencji implementacyjnej" „brak nowych reguł, tylko zatwierdzić obecny stan". Pomija to pracę nad zdjęciem blokady, choć ta sama pozycja mówi, że testy bramki zmienią się we wszystkich wariantach.
2. Wariant B, „Za: jednostki zostają, więc armia nie znika" jest sprzeczne z FAKTY. Kandydat G1 jest „bez zmiany armii", więc głód wojska działa dalej (osłabienie od 1. tury, pierwsza utrata jednostki w 27. turze). Przeciw B: „kara trafia w rozwój miast, a nie w wojsko" również pomija, że wojsko dalej głoduje. B jest karą dodatkową, a nie zamiast.
3. Wariant C: „był to jeden przebieg" nie ma oparcia w FAKTY. Dane pochodzą z dwóch ziaren (11 i 7), a FAKTY nie mówią, że obserwacja ataku dotyczy jednego przebiegu.
4. Wariant A: „ok. kilku godzin pracy" to wymyślony szacunek. FAKTY nie dają żadnego dla opcji bez zmian (G1 = 1–2 dni, G2 = 2–3 dni).
5. „Miasta nie tracą mieszkańców" jest podane jako pewnik. FAKTY: wynika to z kodu (miasta karmione przed odjęciem kosztu wojska), nie zmierzono na żywo po 16. turze. Miasto z własnym ujemnym bilansem, którego zapas nie pokrywa, nadal głoduje.
6. Brak jawnego zdania pytania (jest tytuł i „Sytuacja"). Nie wyjaśnia, dlaczego „16. tura" (kończy się początkowy okres bez kosztów utrzymania wojska) ani jaki scenariusz modelu (2 jednostki bojowe, niedobór ok. 16–18 na turę).
7. „Dlaczego teraz" jest retoryczne i bez konkretu. Wariant C zawiera ukrytą drugą decyzję („trzeba ustalić, czy obrońca jest chroniony"), co łamie zasadę jednej decyzji.
8. Czysto: brak zakazanych nazw w zdaniach i opisach opcji, odnośniki tylko w jednej linii „Szczegóły", poprawna liczba za/przeciw, rekomendowany wariant pierwszy. Nie twierdzi, że głodu nie ma.

**PROJEKT 2**
1. Wariant C jest wewnętrznie sprzeczny. „Przeciw" mówi, że automat może usunąć jedynego obrońcę. „Konsekwencja implementacyjna" i „testowa" zakładają „dodatkową ochronę obrońców" (nowa praca i test ochrony). Model G2 z FAKTY tej ochrony nie ma. Powstaje ukryta druga decyzja, a rekomendacja sama przyznaje, że „gra jeszcze nie rozstrzyga" ochrony.
2. Wariant A, „zasady działają tak samo dla gracza i komputerowych przeciwników" jest przesadą. Atrycja zdrowia jest wspólna, ale komputer dodatkowo automatycznie rozwiązuje jednostki wsparcia, a gracz nie.
3. Wariant A: „około 1 dnia" to szacunek spoza FAKTY. „Miasto nic nie czuje, więc gracz może przez kilkanaście tur nie zauważyć" to domysł spoza FAKTY.
4. Rekomendacja: „jedyne skutki policzone bez niewiadomych" to przesada. A też ma niezmierzone elementy: liczba utraconych jednostek zależy od ziarna i trudności, nie zmierzono na żywo. „Zapowiedź końca gry" w Celu jest wymyślonym ozdobnikiem.
5. Podaje „16–18 żywności na turę" jako pewnik. FAKTY wskazują niewyjaśnioną rozbieżność (ekran −30 vs komunikat −18).
6. Odnośniki do plików są wpisane w każdym wariancie osobno („Szczegóły:" w środku opcji), zamiast jednej linii pod pytaniem. Brak jawnego zdania pytania. Podobnie jak w P1, „Miasta nie tracą mieszkańców" podane bez zastrzeżenia, że to z kodu, a nie zmierzone.
7. Czysto: poprawnie mówi, że blokada dopiero zostanie zdjęta, a w A uwzględnia jej usunięcie. Wariant B jest zgodny z FAKTY (wojsko dalej głoduje: „wojsko przestaje być jedynym miejscem"). Brak zakazanych nazw w opisach opcji. Nie twierdzi, że głodu nie ma.

Zwyciezca: SYNTEZA (podstawa P2, bo poprawnie opisuje stan blokady i wariant B; z P1 czytelniejsze za/przeciw; usunięte błędy obu projektów, ochrona obrońcy wyłączona z wariantu C do osobnej decyzji)

