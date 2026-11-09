'use strict';
/**
 * card-text-corrections.cjs — R-WEB-CARDS-RESOURCE-PURPOSE-Q1.
 *
 * Jedna, audytowalna warstwa korekt treści kart TOP 5 (odkrycia + budynki), nakładana na wynik
 * generatorów `gen-tech-cards-top5.cjs` i `gen-building-cards-top5.cjs` PO ich własnych warstwach
 * (CSV + zdania/korekty). Trzy klasy korekt (DODATKI 1–3 dispatchu):
 *   R = brakujące „do czego służy surowiec” (dowód: plik:linia w polu `dowod`),
 *   J = język (zdanie niezrozumiałe / bez orzeczenia / żargon / kalka),
 *   A = PODATEK zamiast „pieniądza” (budynek/pole/ulepszenie daje PODATEK — w silniku
 *       `baza.pieniadz` budynków wchodzi do `handelBazowy` = baza podatku, economy.ts:881-920;
 *       `pieniadz` ulepszenia terenu wpada w `yld.handel` = podatek, terrain-improvements.ts:177).
 * Klasa B (skarbiec, wynik Mennicy, koszty/utrzymanie płacone z kasy) i C (niejednoznaczne,
 * m.in. premia morska Portu liczona z tras) ZOSTAJĄ bez zmian — patrz raport tematu.
 *
 * Każdy wpis: { k: klucz karty, p: ścieżka pola, z: tekst zamieniany (musi wystąpić DOKŁADNIE raz),
 *               na: nowy tekst, c: klasa, r: powód }. Brak trafienia = błąd generatora (nic nie
 * znika po cichu). Ścieżka `p`: top5.<i>.tytul | top5.<i>.zdanie | cmz.<i>.czynnosc | cmz.<i>.korzysc
 * (i = indeks 0-based w FINALNEJ liście karty). Pole `liczba` jest przeliczane po zmianie tytułu.
 */

const A_PODATEK = 'A: produkcja budynku/pola zasila PODATEK (economy.ts:881-920), nie pieniądz; pieniądz powstaje po podziale podatku / w Mennicy.';
const J_ZDANIE = 'J: zdanie/tytuł trudne do przeczytania jako naturalne polskie zdanie.';

/** @type {Array<{k:string,p:string,z:string,na:string,c:string,r:string}>} */
const TECH = [
  // ---------- DODATEK 2: przykład właściciela (Wymiana) ----------
  { k: 'Wymiana', p: 'top5.0.tytul', z: 'bez Wymiany żadnych tras handlowych', na: 'bez Wymiany nie ma tras handlowych', c: 'J', r: 'brak orzeczenia („bez X żadnych Y”); wskazanie właściciela.' },
  { k: 'Wymiana', p: 'top5.0.zdanie', z: 'Wymiana jest bramką całego handlu szlakowego — dopiero po niej wyznaczysz trasy handlowe.', na: 'Wymiana jest warunkiem handlu — dopiero po niej wyznaczysz trasy handlowe.', c: 'J', r: '„bramka handlu szlakowego” to kalka/żargon; wskazanie właściciela.' },
  { k: 'Wymiana', p: 'cmz.0.korzysc', z: 'bez Wymiany handel szlakowy jest zablokowany', na: 'bez Wymiany nie ma tras handlowych', c: 'J', r: 'spójnie z tytułem: „handel szlakowy jest zablokowany” → wprost.' },
  // ---------- DODATEK 3: PODATEK zamiast pieniądza (A) ----------
  { k: 'Wymiana', p: 'top5.4.tytul', z: '+5 pieniądza', na: '+5 podatku', c: 'A', r: A_PODATEK + ' Targowisko: baza.pieniadz 5 (buildings.json).' },
  { k: 'Wymiana', p: 'top5.4.zdanie', z: 'Stały dochód budynku rośnie z każdym poziomem (do 3).', na: 'Podatek z budynku rośnie z każdym poziomem (do 3).', c: 'A', r: A_PODATEK },
  { k: 'Łowiectwo', p: 'top5.0.tytul', z: '+1 żywności, +1 Pracy, +1 pieniądza, +2 podatku', na: '+1 żywności, +1 Pracy, +3 podatku', c: 'A', r: 'A: ulepszenie terenu: bonus.pieniadz=1 + bonus.handel=2 wpadają do jednego strumienia TileYield.handel = podatek (terrain-improvements.ts:176-177) → razem +3 podatku w Kamieniu.' },
  { k: 'Łowiectwo', p: 'top5.0.zdanie', z: 'jedno pole daje naraz żywność, Pracę, pieniądz i podatek.', na: 'jedno pole daje naraz żywność, Pracę i podatek.', c: 'A', r: A_PODATEK },
  { k: 'Łowiectwo', p: 'cmz.0.korzysc', z: '+1 żywności, +1 Pracy, +1 pieniądza, +2 podatku', na: '+1 żywności, +1 Pracy, +3 podatku', c: 'A', r: A_PODATEK },
  { k: 'Handel', p: 'top5.3.tytul', z: '+8 pieniądza', na: '+8 podatku', c: 'A', r: A_PODATEK + ' Emporion: baza.pieniadz 8.' },
  { k: 'Handel', p: 'top5.3.zdanie', z: 'Stały dochód budynku rośnie z jego poziomem.', na: 'Podatek z budynku rośnie z jego poziomem.', c: 'A', r: A_PODATEK },
  { k: 'Handel', p: 'top5.4.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK + ' Magazyn: baza.pieniadz 1.' },
  { k: 'Handel', p: 'top5.4.zdanie', z: 'Drobny stały dochód Pracy i pieniądza w mieście.', na: 'Drobny stały przychód Pracy i podatku w mieście.', c: 'A', r: A_PODATEK },
  { k: 'Kodeks', p: 'top5.3.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'Kodeks', p: 'top5.3.zdanie', z: 'Stały dochód pieniądza, Kultury i Pracy w mieście regionalnym.', na: 'Stały przychód podatku, Kultury i Pracy w mieście regionalnym.', c: 'A', r: A_PODATEK },
  { k: 'Kodeks', p: 'top5.4.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'Kodeks', p: 'top5.4.zdanie', z: 'Drobny dochód i zadowolenie w mieście z Trybunałem.', na: 'Drobny przychód podatku i zadowolenie w mieście z Trybunałem.', c: 'A', r: A_PODATEK },
  { k: 'Inżynieria', p: 'top5.3.tytul', z: '+10 pieniądza', na: '+10 podatku', c: 'A', r: A_PODATEK },
  { k: 'Inżynieria', p: 'top5.3.zdanie', z: 'więcej dochodu i dodatkowa trasa.', na: 'więcej podatku i dodatkowa trasa handlowa.', c: 'A', r: A_PODATEK },
  { k: 'Inżynieria', p: 'cmz.2.korzysc', z: 'podwoić dochód portu (+10 pieniądza)', na: 'podwoić podatek z portu (+10 podatku)', c: 'A', r: A_PODATEK },
  { k: 'Oblężnictwo', p: 'top5.3.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'Oblężnictwo', p: 'top5.3.zdanie', z: 'Stały dochód Pracy i pieniądza w mieście z Warsztatem.', na: 'Stały przychód Pracy i podatku w mieście z Warsztatem.', c: 'A', r: A_PODATEK },
  { k: 'Prawo', p: 'top5.3.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'Prawo', p: 'top5.3.zdanie', z: 'Stały dochód Kultury, pieniądza i zadowolenia.', na: 'Stały przychód Kultury, podatku i zadowolenia.', c: 'A', r: A_PODATEK },
  { k: 'Prawo', p: 'top5.4.tytul', z: '+3 pieniądza', na: '+3 podatku', c: 'A', r: A_PODATEK },
  { k: 'Prawo', p: 'top5.4.zdanie', z: 'Stały dochód pieniądza, Kultury i Pracy w mieście regionalnym.', na: 'Stały przychód podatku, Kultury i Pracy w mieście regionalnym.', c: 'A', r: A_PODATEK },
  { k: 'Sztuka wojenna', p: 'top5.1.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'Sztuka wojenna', p: 'top5.1.zdanie', z: 'Stały dochód Pracy i pieniądza w mieście.', na: 'Stały przychód Pracy i podatku w mieście.', c: 'A', r: A_PODATEK },
  { k: 'Waluta', p: 'top5.4.tytul', z: '+3 pieniądza', na: '+3 podatku', c: 'A', r: A_PODATEK + ' Mennica: baza.pieniadz 3 — wchodzi do bazy podatku i jest mnożona ×1,50 przez samą Mennicę (economy.ts:920-955).' },
  { k: 'Waluta', p: 'top5.4.zdanie', z: 'Stały dochód pieniądza rośnie z poziomem Mennicy.', na: 'Podatek z budynku rośnie z poziomem Mennicy.', c: 'A', r: A_PODATEK },
  // ---------- DODATEK 2: język ----------
  { k: 'Waluta', p: 'cmz.0.korzysc', z: '(pieniądz i nauka)', na: '(a z podatku powstają pieniądz i nauka)', c: 'J', r: 'B zostaje (pieniądz po podziale), ale zapis „(pieniądz i nauka)” wisiał bez orzeczenia.' },
  { k: 'Waluta', p: 'top5.2.tytul', z: '(zużywa 1 złota/turę)', na: '(zużywa 1 sztukę złota na turę)', c: 'J', r: '„1 złota/turę” to skrót bez rzeczownika.' },
  { k: 'Łucznictwo', p: 'top5.2.tytul', z: 'Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami', na: 'Łucznicy Brązu (nubijski, akadyjski, asyryjski) wymagają Koszar', c: 'J', r: 'wiszące „— z Koszarami” bez orzeczenia.' },
  { k: 'Jeździectwo', p: 'top5.0.tytul', z: 'Stadnina: +25 koni/turę — koszt 1 jednostki konnej', na: 'Stadnina: +25 koni na turę (tyle kosztuje 1 jednostka konna)', c: 'J', r: 'równoważnik zdania „— koszt 1 jednostki konnej” bez sensu bez orzeczenia (koszt: units.json, Konnica 25 koni).' },
  { k: 'Brązownictwo', p: 'cmz.0.korzysc', z: 'wytwarzać brąz — bez niego i bez Koszar brak wojska epoki Brązu', na: 'wytwarzać brąz (bez brązu i Koszar nie zrekrutujesz wojska epoki Brązu)', c: 'J', r: '„brak wojska” bez orzeczenia; fakt: brąz jest kosztem jednostek Brązu (units.json, „Surowiec”=Brąz, 34 jednostki), Koszary są bramką rekrutacji.' },
  // ---------- DODATEK 1 (surowce): do czego służy ----------
  { k: 'Garncarstwo', p: 'top5.2.zdanie', z: 'Przerabia glinę i drewno na ceramikę, której potrzebuje Spichlerz.', na: 'Przerabia glinę i drewno na ceramikę; Spichlerz zużywa jej 25 na turę, a bez niej nie daje bonusów ludności.', c: 'R', r: 'ceramika: econ-params.json:390-398 (budynek_spichlerz_zuzywa_ceramika = 25/turę; brak surowca → brak bonusów ludności).' },
  { k: 'Garncarstwo', p: 'top5.3.zdanie', z: 'Cegielnia jest dostępna od epoki Brązu; cegła jest potrzebna m.in. do zbadania Pisma.', na: 'Cegielnia jest dostępna od epoki Brązu; cegła jest kosztem budowy m.in. Akademii, Sądu, Łaźni publicznej i Kuźni żelaza.', c: 'R', r: 'cegła: koszt_surowce.cegla w buildings.json (odlewnia_zelaza 50, kuznia_zelaza 50, akademia 70, sad 50, pretorium 50, laznia_publiczna 60, akademia_wojskowa 70, palac_iii 70). Dawne zdanie „do zbadania Pisma” było NIEPRAWDĄ — Pismo wymaga budynku Cegielni, nie cegły.' },
  { k: 'Garncarstwo', p: 'top5.4.zdanie', z: 'Ulepszenie na złożu soli; sól trafia do magazynu państwa.', na: 'Ulepszenie na złożu soli; sól trafia do magazynu państwa, a Spichlerz Królewski wymaga jej i zużywa 25 na turę — za to armia poza własnym terytorium zjada o połowę mniej żywności.', c: 'R', r: 'sól: econ-params.json:400-402 (budynek_spichlerz_ii_zuzywa_sol 25/turę), building-resource-gate.ts:70 (Spichlerz II wymaga Ceramiki i Soli), :553-554 (armia poza terytorium 2→1 gdy Spichlerz II płaci sól), turn-economy.ts:1409.' },
  { k: 'Garncarstwo', p: 'cmz.3.korzysc', z: 'wytwarzać cegłę i otworzyć badanie Pisma', na: 'wytwarzać cegłę (na Akademię, Sąd, Łaźnię i Kuźnię żelaza) i otworzyć badanie Pisma', c: 'R', r: 'cegła ma zastosowanie (koszt budowy) — jak w top5.3; otwarcie Pisma = wymóg budynku Cegielni (prawda).' },
  { k: 'Obróbka drewna', p: 'top5.2.zdanie', z: 'działa na drewno całego państwa.', na: 'działa na drewno całego państwa (budowy i rekrutacja).', c: 'R', r: 'drewno: koszt_surowce.drewno w buildings.json (40 budynków) i „Surowiec”=Drewno w units.json (15 jednostek).' },
  { k: 'Murarstwo', p: 'top5.1.zdanie', z: 'działa na kamień całego państwa.', na: 'działa na kamień całego państwa (mury, świątynie i inne budowle).', c: 'R', r: 'kamień: koszt_surowce.kamien w buildings.json (mury 80, swiatynia 40, fort 100, baszta 100 …).' },
];

/** @type {Array<{k:string,p:string,z:string,na:string,c:string,r:string}>} */
const BUD = [
  // ---------- DODATEK 3: PODATEK zamiast pieniądza (A) ----------
  { k: 'kuznia', p: 'top5.2.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'kuznia', p: 'top5.2.zdanie', z: 'Stały dochód miasta niezależny od epoki.', na: 'Stały przychód Pracy i podatku niezależny od epoki.', c: 'A', r: A_PODATEK },
  { k: 'odlewnia_zelaza', p: 'top5.1.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'targowisko', p: 'top5.0.tytul', z: '+5 pieniądza w mieście', na: '+5 podatku w mieście', c: 'A', r: A_PODATEK + ' Przykład właściciela (zrzut karty Targowiska).' },
  { k: 'targowisko', p: 'top5.0.zdanie', z: 'Stały dochód, rośnie o 3 z każdą epoką.', na: 'Stały podatek budynku, rośnie o 3 z każdą epoką.', c: 'A', r: A_PODATEK },
  { k: 'targowisko', p: 'cmz.0.korzysc', z: 'dać miastu 5 pieniądza', na: 'dać miastu +5 podatku', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'top5.0.tytul', z: '+5 pieniądza', na: '+5 podatku', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'top5.0.zdanie', z: 'Stały dochód miasta nad wodą.', na: 'Stały podatek miasta nad wodą.', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'top5.3.tytul', z: '+10 pieniądza', na: '+10 podatku', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'top5.3.zdanie', z: 'rozbudowa podwaja dochód portu.', na: 'rozbudowa podwaja podatek z portu.', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'cmz.0.korzysc', z: 'dać miastu 5 pieniądza', na: 'dać miastu +5 podatku', c: 'A', r: A_PODATEK },
  { k: 'port', p: 'cmz.1.korzysc', z: 'podwoić dochód portu (+10 pieniądza)', na: 'podwoić podatek z portu (+10 podatku)', c: 'A', r: A_PODATEK },
  { k: 'port_wielki', p: 'top5.0.tytul', z: '+10 pieniądza', na: '+10 podatku', c: 'A', r: A_PODATEK },
  { k: 'port_wielki', p: 'top5.0.zdanie', z: 'Podwaja dochód Portu handlowego, który zastępuje.', na: 'Podwaja podatek z Portu handlowego, który zastępuje.', c: 'A', r: A_PODATEK },
  { k: 'port_wielki', p: 'cmz.0.korzysc', z: 'podwoić dochód portu (+10 pieniądza)', na: 'podwoić podatek z portu (+10 podatku)', c: 'A', r: A_PODATEK },
  { k: 'port_wielki', p: 'top5.1.zdanie', z: 'Po rozbudowie miasto nie traci slotu trasy ani +1 pieniądza za trasę morską.', na: 'Po rozbudowie miasto nie traci miejsca na trasę handlową ani premii +1 pieniądza za trasę morską.', c: 'J', r: '„slot trasy” to żargon. „+1 pieniądza za trasę morską” = klasa C (dochód z tras liczony osobno, trade-routes.ts:1740-1790) — zostaje bez zmiany (DECISION_REQUIRED).' },
  { k: 'emporion', p: 'top5.0.tytul', z: '+8 pieniądza', na: '+8 podatku', c: 'A', r: A_PODATEK },
  { k: 'emporion', p: 'top5.0.zdanie', z: 'Większy dochód niż Targowisko (+5).', na: 'Więcej podatku niż Targowisko (+5).', c: 'A', r: A_PODATEK },
  { k: 'emporion', p: 'cmz.0.korzysc', z: 'dać miastu 8 pieniądza', na: 'dać miastu +8 podatku', c: 'A', r: A_PODATEK },
  { k: 'magazyn', p: 'top5.1.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'magazyn', p: 'top5.1.zdanie', z: 'Drobny dochód miasta, rośnie z epoką.', na: 'Drobny przychód Pracy i podatku w mieście, rośnie z epoką.', c: 'A', r: A_PODATEK },
  { k: 'mennica', p: 'top5.1.tytul', z: '+3 pieniądza w stolicy', na: '+3 podatku w stolicy', c: 'A', r: A_PODATEK + ' Mennica: baza.pieniadz 3 (podatek, mnożony ×1,50 przez samą Mennicę).' },
  { k: 'mennica', p: 'top5.1.zdanie', z: 'Mały stały dochód stolicy.', na: 'Niewielki stały przyrost podatku w stolicy.', c: 'A', r: A_PODATEK },
  { k: 'sad', p: 'top5.3.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'sad', p: 'top5.3.zdanie', z: 'Stały dochód kultury i nastrojów.', na: 'Stały przyrost podatku, kultury i nastrojów.', c: 'A', r: A_PODATEK },
  { k: 'dom_starszyzny', p: 'top5.2.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'dom_starszyzny', p: 'top5.2.zdanie', z: 'Drobny dochód miasta.', na: 'Drobny stały przychód Pracy, podatku i Kultury w mieście.', c: 'A', r: A_PODATEK },
  { k: 'dwor_zarzadcy', p: 'top5.2.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'pretorium', p: 'top5.2.tytul', z: '+3 pieniądza', na: '+3 podatku', c: 'A', r: A_PODATEK },
  { k: 'trybunal', p: 'top5.2.tytul', z: '+1 pieniądza', na: '+1 podatku', c: 'A', r: A_PODATEK },
  { k: 'trybunal', p: 'top5.2.zdanie', z: 'W epoce Żelaza +2 pieniądza i +3 Szczęścia.', na: 'W epoce Żelaza +2 podatku i +3 Szczęścia.', c: 'A', r: A_PODATEK },
  { k: 'warsztat_oblezniczy', p: 'top5.1.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'warsztat_oblezniczy', p: 'top5.1.zdanie', z: 'Drobny dochód miasta.', na: 'Drobny stały przychód Pracy i podatku w mieście.', c: 'A', r: A_PODATEK },
  { k: 'akademia_wojskowa', p: 'top5.1.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  { k: 'akademia_wojskowa', p: 'top5.1.zdanie', z: 'Drobny dochód miasta.', na: 'Drobny stały przychód Pracy i podatku w mieście.', c: 'A', r: A_PODATEK },
  { k: 'kuznia_zelaza', p: 'top5.2.tytul', z: '+2 pieniądza', na: '+2 podatku', c: 'A', r: A_PODATEK },
  // ---------- DODATEK 1 (surowce): do czego służy ----------
  { k: 'stolarnia', p: 'top5.0.zdanie', z: '(Stolarnie sumują się).', na: '(Stolarnie sumują się); drewno idzie na budowy i rekrutację.', c: 'R', r: 'drewno: koszt_surowce.drewno w buildings.json i „Surowiec”=Drewno w units.json.' },
  { k: 'kamieniarski', p: 'top5.0.zdanie', z: '(warsztaty sumują się).', na: '(warsztaty sumują się); kamień idzie na mury, świątynie i inne budowle.', c: 'R', r: 'kamień: koszt_surowce.kamien w buildings.json (mury 80, swiatynia 40, fort 100 …).' },
  { k: 'garncarnia', p: 'top5.0.zdanie', z: 'każdy Spichlerz zużywa jej 25 na turę.', na: 'każdy Spichlerz zużywa jej 25 na turę, a bez niej nie daje bonusów ludności.', c: 'R', r: 'econ-params.json:390-398.' },
  { k: 'cegielnia', p: 'top5.0.zdanie', z: 'Zamienia 2 gliny i 1 drewno w 2 cegły; od epoki Brązu +50% bazy na epokę — cegła buduje budynki epoki Żelaza.', na: 'Zamienia 2 gliny i 1 drewno w 2 cegły (od epoki Brązu +50% bazy na epokę); cegła jest kosztem budowy budynków epoki Żelaza, takich jak Akademia, Sąd, Łaźnia publiczna czy Kuźnia żelaza.', c: 'R', r: 'cegła: koszt_surowce.cegla w buildings.json (wszystkie budynki z cegłą mają epokaWejscia 3); J: „od epoki Brązu +50% bazy na epokę” przeniesione w nawias (zdanie miało brak orzeczenia).' },
  { k: 'cegielnia', p: 'cmz.0.korzysc', z: 'wytwarzać cegłę na budynki epoki Żelaza', na: 'wytwarzać cegłę na Akademię, Sąd, Łaźnię publiczną i Kuźnię żelaza (budynki epoki Żelaza)', c: 'R', r: 'jak wyżej.' },
  { k: 'spichlerz_ii', p: 'top5.0.zdanie', z: 'Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców.', na: 'Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców; zużywa 25 ceramiki i 25 soli na turę.', c: 'R', r: 'ceramika i sól: econ-params.json:400-412; building-resource-gate.ts:70.' },
  // ---------- DODATEK 2: język ----------
  { k: 'odlewnia_brazu', p: 'top5.2.zdanie', z: 'Po Hutnictwie żelaza rozbudowa daje drugi konwerter — żelazo.', na: 'Po Hutnictwie żelaza rozbudowa pozwala wytapiać także żelazo na wojsko epoki Żelaza.', c: 'J', r: '„drugi konwerter” to żargon silnika.' },
  { k: 'port', p: 'top5.4.zdanie', z: 'Ryczałt Szczęścia za budynek szczęściodajny.', na: 'Stały dodatek Szczęścia w mieście.', c: 'J', r: '„ryczałt … szczęściodajny” to żargon i nie-słowo.' },
  { k: 'port_wielki', p: 'top5.2.zdanie', z: 'Ryczałt Szczęścia za budynek szczęściodajny.', na: 'Stały dodatek Szczęścia w mieście.', c: 'J', r: 'jak wyżej.' },
  { k: 'biblioteka', p: 'top5.4.zdanie', z: 'Ryczałt Szczęścia za budynek szczęściodajny.', na: 'Stały dodatek Szczęścia w mieście.', c: 'J', r: 'jak wyżej.' },
  { k: 'spichlerz', p: 'top5.3.zdanie', z: 'Najwyższy ryczałt Szczęścia wśród budynków Kamienia.', na: 'Najwięcej Szczęścia spośród budynków epoki Kamienia.', c: 'J', r: '„ryczałt” to żargon.' },
  { k: 'studnia', p: 'top5.3.zdanie', z: 'Ryczałt +1 i +1 zadowolenia na poziom.', na: 'Stałe +1 Szczęścia oraz +1 zadowolenia na każdy poziom.', c: 'J', r: '„Ryczałt +1 i +1 zadowolenia” — niezrozumiałe, czego +1.' },
  { k: 'akwedukt', p: 'top5.2.zdanie', z: 'Ryczałt +1 i +2 zadowolenia.', na: 'Stałe +1 Szczęścia oraz +2 zadowolenia.', c: 'J', r: 'jak wyżej.' },
  { k: 'akwedukt', p: 'top5.0.zdanie', z: 'Najwyższy próg drabinki: bez budynku 5 → Spichlerz 8 → Spichlerz Królewski 12 → Akwedukt 20.', na: 'Najwyższy próg limitu ludności: bez budynku 5 → Spichlerz 8 → Spichlerz Królewski 12 → Akwedukt 20.', c: 'J', r: '„drabinka” to żargon.' },
  { k: 'kamienne_kregi', p: 'top5.1.zdanie', z: 'Po 1 Kultury i zadowolenia więcej z każdą epoką.', na: 'Z każdą epoką dochodzi po 1 Kultury i zadowolenia.', c: 'J', r: '„Po 1 … więcej” — szyk niezrozumiały.' },
  { k: 'warsztat_oblezniczy', p: 'top5.0.zdanie', z: 'Trzecia warstwa ścieżki parametrów — sumuje się z Koszarami i Akademią wojskową (maks. +50%).', na: 'Kolejny stopień wzmocnienia jednostek — sumuje się z Koszarami i Akademią wojskową (razem maks. +50%).', c: 'J', r: '„warstwa ścieżki parametrów” to żargon.' },
  { k: 'akademia_wojskowa', p: 'top5.0.zdanie', z: 'Sumuje się z Koszarami wprost; z Warsztatem oblężniczym razem +50%.', na: 'Sumuje się z Koszarami; z Warsztatem oblężniczym razem daje +50%.', c: 'J', r: '„wprost” zbędne i mylące; brak orzeczenia w drugiej części.' },
];

function getByPath(obj, p) {
  const [kind, idx, field] = p.split('.');
  const arr = obj[kind];
  const item = arr && arr[Number(idx)];
  return { item, field };
}

/**
 * Nakłada korekty na `out[klucz]`. Zwraca listę {k,p,bylo,jest,c,r} (do tabeli w raporcie).
 * Błędy (brak karty/pola/trafienia albo >1 trafienie) trafiają do `errors`.
 */
function applyCorrections(out, list, label, errors, liczbaOf) {
  const log = [];
  for (const e of list) {
    const card = out[e.k];
    if (!card) { errors.push(`${label}: korekta dla nieznanej karty „${e.k}”`); continue; }
    const { item, field } = getByPath(card, e.p);
    if (!item || typeof item[field] !== 'string') { errors.push(`${label}: ${e.k} ${e.p} — brak pola`); continue; }
    const cur = item[field];
    const hits = cur.split(e.z).length - 1;
    if (hits !== 1) { errors.push(`${label}: ${e.k} ${e.p} — „${e.z}” występuje ${hits}× (wymagane 1×) w „${cur}”`); continue; }
    const next = cur.replace(e.z, () => e.na);
    item[field] = next;
    if (field === 'tytul' && liczbaOf) {
      const l = liczbaOf(next);
      if (l) item.liczba = l; else delete item.liczba;
      // `liczba` stoi tuż po `tytul` w kontrakcie — odtwórz kolejność kluczy deterministycznie.
      const ordered = { tytul: item.tytul };
      if (item.liczba) ordered.liczba = item.liczba;
      for (const key of Object.keys(item)) if (!(key in ordered)) ordered[key] = item[key];
      for (const key of Object.keys(item)) delete item[key];
      Object.assign(item, ordered);
    }
    log.push({ k: e.k, p: e.p, bylo: cur, jest: next, c: e.c, r: e.r });
  }
  return log;
}

module.exports = { TECH, BUD, applyCorrections };
