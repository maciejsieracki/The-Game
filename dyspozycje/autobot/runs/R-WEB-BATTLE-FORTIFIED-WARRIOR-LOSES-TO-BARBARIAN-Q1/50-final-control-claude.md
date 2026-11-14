STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: ustalic POMIAREM (nie lektura kodu), dlaczego Wojownik barbarzyncow wygrywa w obu kierunkach ataku; naprawic defekt albo wystawic DECISION_REQUIRED z liczbami sceny.
ZMIANY/COMMIT: kandydat f0d511c409e2ead5853feb9b9ee4c563c41c417a (potomek bazy 236312c01 - potwierdzone merge-base --is-ancestor). Diff vs baza: wylacznie 2 pliki runs/**/10-operator-claude.md i 30-obrona-claude.md (dokumentacja). Zero zmian w gra/src, gra/data, gra/tools. Allowlista OK. Do integracji NIE nadaje sie nic (brak pracy kodowej/pomiarowej). Ten raport: 50-final-control-claude.md.
TESTY: npm ci --ignore-scripts w gra/ -> OK; npx tsc --noEmit na f0d511c40 -> exit 0. 5 bramek referencyjnych nie uruchamiane (brak zmian kodu; wyniki Evaluatora: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 - nie powtarzane). Sonda sceny / tabela % wygranych: NIE_ZMIERZONO (nikt nie zmierzyl).
BLOKADY: brak wykonania DODATKU 4 pkt 1-4 (rola atakujacego w scenie, sonda _singleBlow/computeInstantResult/AUTO, ksiega modyfikatorow z sciezki rzeczywistej, wniosek o odtwarzalnosci). Powod r2 "brak node_modules" jest nieprawdziwy (npm ci dziala w ok. 2 s; potwierdzone przez FC). Obrona r3 sama przyznala brak pomiaru sceny i przesunela go na r4.

WERDYKT PER ZARZUT:
1 (brak sondy sceny i tabeli %) - NAPRAW. Obowiazkowy pkt 2 DODATKU 4; srodowisko dostepne; istnieje wzorzec gra/tools/manual-battle-rng-determinism-test.cjs.
2 (rola atakujacego tylko z lektury) - NAPRAW. Wymagany dowod logiem/sonda: A barbarzynca->gracz, B gracz->barbarzynca, oboz, miasto, szturm main.ts:38501.
3 (brak ksiegi modyfikatorow z sciezki rzeczywistej) - NAPRAW. Wydruk combatUnitFromDef + dodatki sceny dla obu stron.
4 (brak wniosku o odtwarzalnosci i listy danych od wlasciciela) - NAPRAW. Wniosek oraz dane (tryb Trafienia, kierunek, tura, jednostki) do zebrania.
5 (niespojnosc raportu, falszywe twierdzenie o node_modules) - NAPRAW (kosmetyka procesu: jeden spojny raport operatora z aktualnym wynikiem; tsc zielone potwierdzone przez FC, exit 0).
6 (H7 kolejnosc tury recznej / szarza - niezmierzona) - NAPRAW. Hipoteza istotna: sedno nierozstrzygnietego zgloszenia "barbarzynca wygrywa takze gdy gracz atakuje"; wymaga pomiaru w _singleBlow/scenie recznej i AUTO scenicznym (battleScene.ts:5688-5700, :9072-9078).
Zadnych pozycji DO DECYZJI CZLOWIEKA: decyzje produktowe (tryb "pewne", szarza) mozna wystawic dopiero po pomiarze sceny. Co najmniej jedno NAPRAW => FAIL.

WNIOSKI ZAAKCEPTOWANE (z r1, nie podwazone): brak ukrytego bonusu barbarzyncy w resolveCombat; jedyny skok regresji = ae600d5ed ("pewne" domyslnie dla nowych gier, fort/obrona nie dzialaja, atakujacy z szarzy wygrywa 100%). To NIE zamyka zgloszenia, bo kierunek gracz->barbarzynca nie jest wyjasniony.

RUNDY: 3/5 zuzyte po stronie Operatora/Obrony (r1 FAIL, r2 BLOCK); to FC r2 -> FAIL. Nastepna runda 4/5 (Operator wraca do TEGO SAMEGO ID).
NASTEPNY KROK (runda 4, Operator): (1) npm ci --ignore-scripts w gra/; (2) napisac gra/tools/*battle*probe*.cjs na wzor manual-battle-rng-determinism-test.cjs albo Chromium ?civTest=1; zmierzyc macierz: kierunek (barb->gracz, gracz->barb) x tryb (losowe/pewne) x sciezka (scena reczna, AUTO sceniczne, Pomiedz/computeInstantResult, AUTO auto-battle-power) x fort ON/OFF, >=200 powtorzen (losowe); (3) ksiega modyfikatorow z realnej sciezki; (4) log przypisania atk/def i isCharge w bitwie z mapy dla przypadku B; (5) wniosek + naprawa tylko przy zmierzonym defekcie albo DECISION_REQUIRED z liczbami i opcjami A-D; (6) jeden spojny raport operatora. Priorytet: H7 (kolejnosc tury recznej, szarza dla gracza-obroncy).
UWAGI-DLA-ORKIESTRATORA: rozwazyc Sonnet na Operatorze r4 dopiero po drugiej nieudanej rundzie Haiku (r2 byl BLOCK bez pracy = kwalifikuje sie jako nieudana runda); jesli tak - pisemne uzasadnienie w dispatchu.
DEPLOY/PUSH: NIE WYKONANO
