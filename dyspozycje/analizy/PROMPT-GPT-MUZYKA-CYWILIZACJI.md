# Prompt dla GPT: muzyka dyplomacji dla 15 cywilizacji (przywitanie + negocjacje)

Skopiuj cały blok poniżej do czata GPT. Lista cywilizacji i ich charakter pochodzą z `gra/data/civs.json`.
Gra odtwarza w panelu dyplomacji jeden utwór w pętli na cywilizację (katalog `gra/src/audio/utwory/dyplomacja/<civId>/`).

```text
Jesteś kompozytorem i reżyserem dźwięku gier strategicznych (typ Civilization). Przygotuj muzykę dyplomacji dla 15 cywilizacji starożytnych w grze 3D w stylu low-poly. Dla KAŻDEJ cywilizacji przygotuj DWA utwory:

1) PRZYWITANIE (powitanie wodza gracza, audiencja): krótki motyw 30–45 s, który od pierwszych sekund wyraźnie ogłasza charakter cywilizacji. Ma brzmieć powitalnie, z godnością, bez agresji.
2) NEGOCJACJE (rozmowa, handel, układy, pakt): pętla 2–3 min, spokojniejsza i bardziej stonowana niż powitanie, z poczuciem namysłu i napięcia dyplomatycznego, ale bez dramatycznych szczytów. Musi się dać zapętlić bez słyszalnego szwu i nie męczyć przy wielokrotnym słuchaniu.

KLUCZOWE OGRANICZENIE EPOKI (obowiązuje bezwzględnie): cała muzyka ma brzmieć jak muzyka z epoki BRĄZU, ŻELAZA albo ANTYKU (ok. 3000 p.n.e. – V w. n.e.), czyli jak rekonstrukcja muzyki archeologicznej i starożytnej, a NIE jak współczesny utwór:
- zakazane: nowoczesny zestaw perkusyjny, bas elektryczny, gitara (akustyczna i elektryczna), fortepian, syntezatory i pady, smyczki orkiestry symfonicznej w stylu filmowym, „epicka” muzyka filmowa i growy trailer, elektronika, pop, rock, jazz, muzyka klasyczna z XVIII–XIX w., harmonia funkcyjna z kadencjami dur-moll i akordami współczesnymi;
- wymagane: tryby i skale starożytne (np. dorycki, frygijski, pentatonika, tetrachordy, skale bliskowschodnie, tryby anatolijskie), monofonia lub heterofonia z burdonem (drone) zamiast współczesnej harmonii, instrumenty, które istniały w tej epoce (liry, harfy, aulos, flety trzcinowe i kościane, rogi, bębny ramkowe i skórzane, sistrum, dzwonki i cymbały z brązu), ludzki, nierówny, „żywy” rytm bez kwantyzacji i bez nagrań studyjnych o współczesnym brzmieniu;
- dla generatora muzyki dodawaj tagi: `ancient`, `archaeological reconstruction`, `Bronze Age` lub `Iron Age` lub `Antiquity`, `modal`, `drone`, `acoustic`, `field recording feel`, a w polu wykluczeń: `modern, cinematic, orchestral hollywood, electronic, synthesizer, electric guitar, piano, pop, rock, drum kit, chord progression, EDM`;
- jeśli istnieje historyczny wzorzec (np. Hymn Hurycki nr 6, Epitafium Seikilosa, pieśni mezopotamskie, egipskie pieśni z harfą, rzymskie sygnały cornu), wskaż go jako inspirację stylistyczną, ale nie kopiuj melodii.

Wymagania wspólne:
- tylko muzyka instrumentalna; dopuszczalne bezsłowne wokalizy (aa, oo), BEZ tekstu śpiewanego;
- brzmienie historyczne zgodnie z KLUCZOWYM OGRANICZENIEM EPOKI powyżej; orkiestracja oszczędna, miejsce na ciszę;
- każda cywilizacja ma brzmieć WYRAŹNIE inaczej: inna skala/tryb, inne instrumenty, inny puls; unikaj klisz „epickiej orkiestry Hollywood”;
- głośność i gęstość mają pozwalać na rozmowę w grze (muzyka tła, nie solowy popis); bez gwałtownych skoków głośności;
- format docelowy: plik mp3 w jakości ok. 192 kbps, ok. 3–5 MB na utwór (jedna cywilizacja ≈ 1–2 utwory).

Dla każdej cywilizacji podaj osobno:
A) opis stylu (2–3 zdania): jaka to muzyka, jaki nastrój, skala/tryb, tempo (BPM), metrum;
B) instrumentarium (lista 4–7 instrumentów) i ich role (melodia, drone, rytm);
C) GOTOWY PROMPT DO GENERATORA MUZYKI (Suno/Udio, po angielsku, 1–2 zdania opisu stylu + lista tagów), osobno dla PRZYWITANIA i dla NEGOCJACJI, z dopiskiem „instrumental, no vocals, loopable” dla negocjacji;
D) 3 rzeczy, których NIE robić (np. anachronizmy, nastrój niepasujący do cywilizacji);
E) nazwa pliku w formacie `<civId>_przywitanie.mp3` i `<civId>_negocjacje.mp3`.

Cywilizacje, ich charakter w grze i kierunek muzyczny (zachowaj ten kierunek, możesz go rozwinąć):

1. Grecy (grecy) — defensywna piechota (falanga), politeizm olimpijski. Kierunek: obywatelska powaga i spokój agory; lutnia-lira, aulos, bęben ramkowy, harfa; tryb dorycki, tempo umiarkowane, miarowy puls jak marsz falangi, ale łagodnie.
2. Rzymianie (rzymianie) — ofensywna piechota i inżynieria, kult państwa. Kierunek: senacka majestatyczność, zdyscyplinowany marsz; cornu i tuba (blacha), bębny, lira, flet; tryb miksolidyjski, solidny, równy rytm; godność władzy, nie bitewny zgiełk.
3. Chińczycy (chinczycy) — łucznicy i kawaleria, konfucjanizm i taoizm. Kierunek: harmonia, wstrzemięźliwość, przestrzeń; guzheng, erhu, dizi, gong, cienkie bębenki; skala pentatoniczna; powolne, medytacyjne tempo, melodie „oddychające”.
4. Inkowie (inkowie) — nauka, kultura, elitarna piechota, kult Słońca Inti. Kierunek: wyniosła, solarna, wysokogórska; quena, zampoña (flet Pana), ocarina, bębny skórzane, grzechotki; pentatonika andyjska, powolne tempo, przestrzenny pogłos górski; BEZ charango i gitary (anachronizm).
5. Zulusi (zulusi) — szybka agresywna piechota, kult przodków. Kierunek: żywiołowy, rytmiczny, pełen energii, w negocjacjach opanowany; wielowarstwowa perkusja, uhadi (łuk muzyczny), grzechotki, bezsłowny chór w stylu call-and-response; polirytmia; w przywitaniu duma, w negocjacjach zmniejszona gęstość rytmu.
6. Egipt (egipt) — rydwany i łucznicy, faraon-bóg. Kierunek: procesyjna, hipnotyczna, święta; harfa łukowa, ney (flet), sistrum, lutnia, bębny; tryb frygijski dominanta; powolny uroczysty puls, drone w tle.
7. Sumerowie (sumerowie) — ciężka piechota, łucznicy, rydwany; religia mezopotamska. Kierunek: archaiczna, rytualna, surowa; lira z Ur, flet trzcinowy, bębny ramkowe, dzwonki; skala orientalna, powolne tempo, powtarzalne frazy jak formuły rytualne.
8. Celtowie (celtowie) — agresywna piechota z bronią sieczną, druidyzm. Kierunek: dzika, szlachetna, leśna; harfa celtycka, low whistle, bodhrán, carnyx (dęty rytualny), skrzypce rebec; tryb eolski/dorycki; w przywitaniu brawura, w negocjacjach liryczna melancholia.
9. Germanie (germanie) — piechota leśna, zasadzki, Wotan/Odyn. Kierunek: mroczna, leśna, ciężka; lur (rogi), tagelharpa, głębokie bębny, drone gardłowy (bezsłowny); tryb eolski, wolne tempo, napięcie pod powierzchnią.
10. Harappa (harappa) — miasta-plan, handel, obrona murów, niska agresja. Kierunek: spokojna, rzemieślnicza, handlowa; bansuri (flet), proste bębny z gliny, wczesna lutnia/wina, drone; skala modalna typu raga, powolny medytacyjny puls, łagodność.
11. Hetyci (hetyci) — rydwany, fortyfikacje górskie, traktaty, obrona. Kierunek: surowa, górska, dyplomatyczna; duduk, lutnia typu saz, bębny, dzwonki metalowe; tryby anatolijskie, metrum nieparzyste (np. 7/8); powaga traktatów.
12. Słowianie (slowianie) — osady leśne, liczna piechota, ekspansja na wschód, pogaństwo słowiańskie. Kierunek: ludowa, leśna, rytualna; gęśle, fujarka, kobza/dudy, bębny, bezsłowny chór; tryb dorycki, taneczny ale stonowany puls; ciepło i ziemistość.
13. Babilonia (babilonia) — prawo, astronomia, kapłani, nauka i dyplomacja. Kierunek: wyrafinowana, matematyczna, kapłańska; harfa, lira, flety, cymbały; skala bliskowschodnia, precyzyjne, symetryczne frazy, spokojne tempo, nastrój „gwiaździstego nieba”.
14. Asyria (asyria) — imperium oblężnicze, łucznicy, podbój. Kierunek: potężna, nieustępliwa, groźna; ciężkie bębny, rogi, tuby, niskie smyczki starożytne; tryb molowy, ostinato, marsz oblężniczy; w negocjacjach groźna cisza i nacisk, nie hałas.
15. Fenicjanie (fenicjanie) — handel morski, kolonie, barter. Kierunek: jasna, żywa, portowa; lutnia, aulos, bębny ręczne, tamburyn; makam lewantyński, lekki taneczny puls, nastrój targu i morza.

Na końcu dodaj:
- tabelę zbiorczą (civ, tryb/skala, BPM, 3 kluczowe instrumenty), aby sprawdzić, że żadne dwie cywilizacje nie brzmią podobnie;
- listę kontrolną jakości (pętla bez szwu, brak anachronizmów i nowoczesnych elementów, poziom głośności, brak tekstu śpiewanego);
- propozycję kolejności generowania (od cywilizacji najłatwiejszych do najtrudniejszych do uchwycenia).
```

## Uwagi do użycia
- Jeśli GPT skraca odpowiedź, poproś o kontynuację po 5 cywilizacji naraz (1–5, 6–10, 11–15).
- Same utwory powstaną w generatorze muzyki (Suno/Udio); GPT dostarcza prompty i opis stylu, nie plik audio.
- Waga w grze: każdy plik rośnie o ok. 33% w bundlu (base64), więc 15 cywilizacji × 2 utwory to 30 plików, ok. 90–150 MB w pliku wejściowym; przed wdrożeniem ustalamy limit (np. 1 utwór na cywilizację w pętli, ok. 3 MB).
