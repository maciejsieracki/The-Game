#!/usr/bin/env python3
"""Generuje dyspozycje/rust-port/NIEPODPIETE-MODULY.md z surowego TSV skryptu-niepodpiete.py.

Uzycie: python3 -I gen-raport.py <surowe.tsv> <wyjscie.md>
Przypisanie tematu jest HEURYSTYKA po nazwie modulu (dispatch nie podaje wiazania modul->zadanie).
"""
import sys
from collections import OrderedDict

SRC, OUT = sys.argv[1], sys.argv[2]

TOPIC_RULES = [
    # (prefiks lub nazwa modulu, temat, uzasadnienie)
    ("siege_tactics_autobatch", "#97 K5-LOOP-AUTO", "tryb AUTO bez oblezenia (nazwa modulu)"),
    ("siege_tactics_autophase", "#97 K5-LOOP-AUTO", "faza AUTO (nazwa modulu)"),
    ("siege_tactics_tower", "#116 TOWER-TARGET", "wieze obleznicze (nazwa modulu)"),
    ("siege_tactics_breach", "#98 K5-LOOP-WYLOM", "wylom w pętli (nazwa modulu)"),
    ("siege_tactics_", "#113 K5LOOP-WIRING", "pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu)"),
    ("siege_sortie", "#115 ZDOBYCIE-MIASTA-WIRING", "wyjazd z miasta oblezonego"),
    ("siege_transfer", "#115 ZDOBYCIE-MIASTA-WIRING", "skutki przejecia miasta"),
    ("siege_capture", "#115 ZDOBYCIE-MIASTA-WIRING", "zdobycie miasta"),
    ("siege_capital", "#115 ZDOBYCIE-MIASTA-WIRING", "plądrowanie stolicy"),
    ("siege_enter_city", "#115 ZDOBYCIE-MIASTA-WIRING", "wejscie do miasta"),
    ("siege_surrender", "#115 ZDOBYCIE-MIASTA-WIRING", "kapitulacja miasta"),
    ("siege_wonder", "#115 ZDOBYCIE-MIASTA-WIRING", "cuda przy zdobyciu"),
    ("siege_", "#113 K5LOOP-WIRING", "oblezenie (inne moduly siege_*)"),
    ("diplomacy_multiwar", "#106 R7K7C-WIRING", "dyplomacja wielowojenna (deltas dyplomacji)"),
    ("diplomacy_truce", "#106 R7K7C-WIRING", "rozejmy (deltas dyplomacji)"),
    ("diplomacy_nap_trust", "#106 R7K7C-WIRING", "NAP/zaufanie (deltas dyplomacji)"),
    ("diplomacy_", "#120 CRED-HAK-WYPOWIEDZENIE", "dyplomacja i wojna (haki P4)"),
    ("war_turn_forced", "#120 CRED-HAK-WYPOWIEDZENIE", "wymuszone wojny (declare_forced_wars)"),
    ("alliance_war_obligation", "#120 CRED-HAK-WYPOWIEDZENIE", "obowiazek wojny sojuszu"),
    ("deposits", "#104 ZLOZA-WIRING", "zloza (deactivate_zloze_grants)"),
    ("zloze", "#104 ZLOZA-WIRING", "zloza"),
    ("trade_flow_apply", "brak tematu: HANDEL-PRZEPLYW-WIRING", "stosowanie przeplywu handlu"),
    ("trade", "brak tematu: HANDEL-PRZEPLYW-WIRING", "handel"),
    ("turn_economy", "brak tematu: TURN-ECONOMY-WIRING", "tura ekonomii"),
    ("rivers_", "brak tematu: RZEKI-MAPGEN-WIRING", "generator rzek"),
    ("mapgen/", "brak tematu: MAPGEN-WIRING", "generator mapy"),
    ("cluster_", "brak tematu: MAPGEN-KLASTRY-WIRING", "klastry mapgen"),
    ("ai_", "brak tematu: AI-WIRING-PRZEGLAD", "AI bez wolajacego"),
    ("army_", "brak tematu: ARMIA-WIRING", "armia (konsolidacja, auto-merge)"),
    ("replay", "brak tematu: REPLAY-WIRING", "replay"),
    ("zapis_loader", "brak tematu: ZAPIS-LOADER-WIRING", "loader zapisu"),
]
STATIC_TOPIC = {
    "wonder_placement": "brak tematu: CUDA-PLACEMENT-WIRING",
    "villages": "brak tematu: WIOSKI-WIRING",
    "roads": "brak tematu: DROGI-WIRING",
    "relief_preserving": "brak tematu: RELIEF-WIRING",
    "map_snapshot": "brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks)",
    "economy_city_terrain": "brak tematu: EKONOMIA-TEREN-WIRING",
    "work_tax": "brak tematu: PODATEK-PRACY-WIRING",
    "formation_rules": "brak tematu: FORMACJE-WIRING",
    "general_quick_follow": "brak tematu: GENERAL-FOLLOW-WIRING",
    "battle_mode": "brak tematu: TRYB-BITWY-WIRING",
    "quotas": "brak tematu: MAPGEN-KWOTY-WIRING",
}


def topic_for(mod):
    if mod in STATIC_TOPIC:
        return STATIC_TOPIC[mod], "nazwa modulu (heurystyka)"
    for prefix, topic, why in TOPIC_RULES:
        if mod.startswith(prefix) or mod == prefix.rstrip("_"):
            return topic, why
    return "brak tematu: NIEPODPIETE-%s-WIRING" % mod.replace("/", "-").upper(), "brak dopasowania"


fns, mods = [], []
with open(SRC, encoding="utf-8") as fh:
    next(fh)
    for line in fh:
        typ, plik, linia, mod, name = line.rstrip("\n").split("\t")
        if typ == "FN":
            fns.append((plik, int(linia), mod, name))
        elif typ == "MOD":
            mods.append((plik, mod))
fns.sort()
mods.sort()

out = []
w = out.append
w("# NIEPODPIETE-MODULY — moduły domain i funkcje `pub fn` bez produkcyjnego wołającego")
w("")
w("Temat: `R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1` (runda 1/5, Operator HAIKU, dokumentacyjny, bez `cargo`).")
w("Baza: `1027c2aa1` (= `origin/rust-port/parity-v2` po AUDYT-PARYTETU). Zakres: `rust-port/engine/src/domain/**`.")
w("")
w("## 0. Metoda i ograniczenia")
w("")
w("- Skrypt: `dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/dowody/skrypt-niepodpiete.py`; surowy wynik: `dowody/niepodpiete-surowe.tsv`.")
w("- Korpus wołań: wszystkie `*.rs` pod `rust-port/` z pominięciem katalogów `tests/`, `benches/`, `target/`; z korpusu usunięte komentarze i bloki `#[cfg(test)]`; linie `use`/`pub use` i linie definicji `fn` nie liczą się jako wołanie.")
w("- Funkcja bez wołającego: identyfikator nazwy nie występuje w żadnej innej linii korpusu (także w swoim pliku). Liczenie po nazwie (bez typu): nazwa wspólna dla kilku typów (np. `from_tiles`) może zawyżać liczbę wołań, czyli zaniżać listę — to kierunek bezpieczny. Wołania przez makra i ścieżki ze stringów: NIE_ZMIERZONO.")
w("- Moduł bez wołającego: stem pliku nie występuje jako token w żadnym innym pliku korpusu (linie `mod stem` pominięte; komentarze usunięte). Wariant poprzedni (`dowody/02-moduly-domain-wolajacy.tsv` z AUDYT-PARYTETU) liczył komentarze i obcinał po `#[cfg(test)]`, więc jego lista 34 nie jest porównywalna wprost.")
w("- Tylko `pub fn` (nie `pub(crate) fn`). Pomiar nie sprawdza, czy zero-wołający kod jest celowo zostawiony (np. API biblioteki).")
w("- Przypisanie tematów (kolumna TEMAT) to **heurystyka po nazwie modułu**, nie wiązanie potwierdzone przez dispatch. Reguły są w `gen-raport.py` (`TOPIC_RULES`, `STATIC_TOPIC`); powód dopasowania każdej pozycji jest w kolumnie UZASADNIENIE (§2 dla modułów, §3 dla funkcji).")
w("- Druga, niezależna metoda (git grep, bez pythona): `dowody/verify-git-grep.sh` + `dowody/verify-classify.py`, wyniki w §8.")
w("")
w("## 1. Liczby i komendy (kontrola zgodności)")
w("")
w("| Miara | Wartość | Komenda / źródło |")
w("|---|---|---|")
n_fn = len(fns)
n_mod = len(mods)
w("| Pliki `domain/**/*.rs` | 243 | `python3 -I dowody/skrypt-niepodpiete.py . dowody/niepodpiete-surowe.tsv` (wiersz `pliki domain`) |")
w("| Definicje `pub fn` w domain (bez `#[cfg(test)]`) | 3255 | j.w., wiersz `definicje pub fn` |")
w("| **Funkcje `pub fn` bez wołającego produkcyjnego** | **%d** | `awk -F'\\t' '$1==\"FN\"' dowody/niepodpiete-surowe.tsv \\| wc -l` |" % n_fn)
w("| **Moduły domain bez wołającego produkcyjnego** | **%d** | `awk -F'\\t' '$1==\"MOD\"' dowody/niepodpiete-surowe.tsv \\| wc -l` |" % n_mod)
w("")
w("Liczbę z tabeli §3 sprawdza się tą samą komendą `awk` (liczba wierszy `FN` = liczba wierszy tabeli §3).")
w("")

# moduly
w("## 2. Moduły domain bez wołającego produkcyjnego (%d)" % n_mod)
w("")
w("| # | Plik (`ścieżka:linia` = 1) | Moduł | TEMAT (propozycja) | UZASADNIENIE |")
w("|---|---|---|---|---|")
for i, (plik, mod) in enumerate(mods, 1):
    t, why = topic_for(mod)
    w("| %d | `%s:1` | `%s` | %s | %s |" % (i, plik, mod, t, why))
w("")

# funkcje
w("## 3. Funkcje `pub fn` bez wołającego produkcyjnego (%d)" % n_fn)
w("")
w("Format: `plik:linia` definicji | moduł | funkcja | wołania produkcyjne = 0 | TEMAT (propozycja) | UZASADNIENIE (reguła dopasowania modułu).")
w("")
w("| # | Definicja (plik:linia) | Moduł | Funkcja | Wołania | TEMAT (propozycja) | UZASADNIENIE |")
w("|---|---|---|---|---|---|---|")
topic_count = OrderedDict()
topic_mods = {}
for i, (plik, linia, mod, name) in enumerate(fns, 1):
    t, why = topic_for(mod)
    topic_count[t] = topic_count.get(t, 0) + 1
    topic_mods.setdefault(t, set()).add(mod)
    w("| %d | `%s:%d` | `%s` | `%s` | 0 | %s | %s |" % (i, plik, linia, mod, name, t, why))
w("")

w("## 4. Rozkład tematów (propozycja, liczba pozycji funkcji)")
w("")
w("| TEMAT | Funkcje |")
w("|---|---|")
for t, c in sorted(topic_count.items(), key=lambda x: -x[1]):
    w("| %s | %d |" % (t, c))
w("")
w("Suma wierszy: `%d` (= liczba wierszy `FN` w TSV)." % sum(topic_count.values()))
w("")

w("## 5. Kolejność zależności (propozycja, NIE_ZMIERZONO w pełnym grafie)")
w("")
w("**Zmierzone:** krawędzie między pozycjami tabeli §3 = **0**. Dowód: pozycja jest na liście tylko wtedy, gdy jej nazwa nie występuje jako token w żadnej linii korpusu poza definicją; gdyby ciało pozycji A wołało pozycję B, nazwa B miałaby licznik > 0 i B nie trafiłaby na listę. Zależności między zero-wołającymi pozycjami więc NIE wynikają z korpusu wywołań; kolejność jest ustalana względem funkcji już wołanych (NIE_ZMIERZONO w pełnym grafie, bo nie liczono zależności od funkcji prywatnych ani pub(crate)).")
w("")
w("Propozycja fal (HIPOTEZA, nie zweryfikowana w kodzie; oparta na nazwach tematów z listy #96–#140, nie na AUDYT-PARYTETU-RANO §4 — tam nie zweryfikowano):")
w("")
w("1. Fala 1 (dyplomacja i zasoby): #104 ZLOZA-WIRING, #106 R7K7C-WIRING, #120 CRED-HAK-WYPOWIEDZENIE — hipoteza: tematy wojny/dyplomacji są wołane przez resztę tury.")
w("2. Fala 2 (oblężenie, pętla): #97 K5-LOOP-AUTO, #98 K5-LOOP-WYLOM, #116 TOWER-TARGET, potem #109 / #107 / #108 / #112 (kontrakty pętli), wreszcie #113 K5LOOP-WIRING jako finał pętli.")
w("3. Fala 3 (zdobycie i eliminacja): #115 ZDOBYCIE-MIASTA-WIRING po fali 2 (hipoteza: przejęcie korzysta z pętli bitwy), #114 ELIMINACJA-GRACZA po #115.")
w("4. Fala 4 (ekonomia, mapgen, reszta): tematy `brak tematu` — kolejność NIE_ZMIERZONA.")
w("")
w("Poza kolejnością: **#119 NIEPODPIETE-MODULY-INDEKS nie jest krokiem wpięcia** — to ten dokument (indeks). Usunięty z fal. Aktualizacja indeksu po każdej fali to osobna czynność, nie wpięcie funkcji.")
w("")
w("## 6. Brak tematu — propozycje nazw")
w("")
w("Pozycje z `brak tematu:` wymagają decyzji właściciela, czy powstają nowe tematy (dispatch: „brak tematu z propozycją nazwy”). Nie są przypisane do istniejących zadań #96–#140. Tabela: propozycja nazwy, liczba funkcji i moduły, które ją generują.")
w("")
w("| Propozycja nazwy | Funkcje | Moduły |")
w("|---|---|---|")
for t, c in sorted(topic_count.items(), key=lambda x: -x[1]):
    if t.startswith("brak tematu"):
        w("| %s | %d | %s |" % (t, c, ", ".join("`%s`" % m for m in sorted(topic_mods[t]))))
w("")
w("Liczba propozycji „brak tematu” (różne nazwy): %d." % sum(1 for t in topic_count if t.startswith("brak tematu")))
w("")
w("## 7. Czego nie zrobiono (NIE_ZMIERZONO)")
w("")
w("- Korpus skryptu obejmuje wszystkie `*.rs` pod `rust-port/` bez `tests/`, `benches/`, `target/` (czyli także `src/bin` i `build.rs`, jeśli są). NIE_ZMIERZONO: wołania z makr (`macro_rules!`), ścieżki budowane z tekstu, FFI i serde (nazwy w JSON).")
w("- Liczenie po nazwie: nie wiadomo, ile pozycji z §3 jest błędnie zerowych (wołanie z innego typu o tej samej nazwie zawyżałoby licznik, więc takie pozycje wypadłyby z listy). Miary: liczba nazw `pub fn` definiowanych w domain więcej niż raz (ryzyko, bez liczby błędów): NIE_ZMIERZONO w pełni; patrz §8.")
w("- Komentarze i bloki `#[cfg(test)]` są usuwane z korpusu przez skrypt; `git grep` (§8) ich nie usuwa i to rozdziela oba pomiary.")
w("- Rozbieżność komentarz vs kod: patrz §8, punkt 3.")
w("- Nie sprawdzono, czy funkcje zero-wołające są wołane z renderera przez FFI/serde (korpus obejmuje `rust-port/renderer`, ale nie analizowano typów).")
w("- Nie uruchamiano `cargo` (dispatch: temat dokumentacyjny).")
w("- Nie zweryfikowano, czy zadania #96–#140 są nadal `pending` (stan z listy zadań sesji, poza repo).")
w("")

w("## 8. Weryfikacja niezależną metodą (git grep) i rozbieżności")
w("")
w("Dispatch wymagał `git grep`; skrypt python jest drugą metodą. Wyniki są w `dowody/verify-git-grep.tsv` i `dowody/verify-classify.txt`.")
w("")
w("1. `bash dowody/verify-git-grep.sh dowody/niepodpiete-surowe.tsv dowody/verify-git-grep.tsv` — nazw unikalnych wśród wierszy FN: **873** (886 wierszy, bo jedna nazwa bywa w kilku plikach); **744** nazw ma 0 linii git grep po wykluczeniu definicji `fn` i `use` (potwierdzone wprost, bez skryptu); **129** nazw ma >0 linii.")
w("2. `python3 -I dowody/verify-classify.py dowody/verify-git-grep.tsv` — klasy 129 nazw z trafieniami: komentarz 109; komentarz + kod 13; kod 5; dane (JSON, poza .rs) 1; dane + komentarz 1. Trafienia „kod” leżą w blokach `#[cfg(test)]` albo w testach w `src/`, skrypt je pomija zgodnie z definicją „produkcyjny wołający”. Przykład ręcznie: `rust-port/engine/src/domain/war_turn_ai_ai.rs:196-198` (`peace_allowed_for_turns`) to asercje w testach. Klasyfikacja jest heurystyczna (linie `kod` nie są każda sprawdzona ręcznie): wskazuje, że 129 nazw z trafieniami ma je w komentarzach, danych lub testach, a skrypt je zgodnie z definicją pomija. NIE_ZMIERZONO: wołania przez makro lub FFI.")
w("3. **Rozbieżność komentarz vs kod:** `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:726` (DEPRECATED przy `run_ai_ai_peace_tick`) pisze, że „produkcja (`war_turn_ai_ai::run_ai_ai_peace_turn`) i testy korzystają” z V2. Git grep: `run_ai_ai_peace_turn` ma definicję w `war_turn_ai_ai.rs:84`, wzmianki w dokumentacji modułu (`war_turn_ai_ai.rs:10`) i wołania wyłącznie w `rust-port/engine/tests/p6_wire_war_siege_aiai*.rs`. Produkcyjnego wołającego nie ma; funkcja jest w tabeli §3. Komentarz w linii 726 jest niezgodny z kodem. Nie zmieniono kodu Rust (poza allowlistą); naprawa komentarza to osobna pozycja.")
w("4. Ryzyko liczenia po nazwie (zawyżanie listy w kierunku bezpiecznym, pomijanie pozycji nie): w `domain` nazw `pub fn` definiowanych więcej niż raz jest **146**, obejmują **532** definicje (git grep, bez wykluczenia `cfg(test)`; liczba 3255 definicji jest ta sama co w skrypcie). **Ile pozycji z §3 jest błędnie zerowych przez nazwę: NIE_ZMIERZONO** — wymagałoby rozróżnienia typów (np. metody `.new()`), czego metoda nie robi.")
w("")

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out))
print("funkcje: %d, moduly: %d" % (n_fn, n_mod))
