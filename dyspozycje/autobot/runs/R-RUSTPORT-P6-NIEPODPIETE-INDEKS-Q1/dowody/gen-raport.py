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
w("- Przypisanie tematów (kolumna TEMAT) to **heurystyka po nazwie modułu**, nie wiązanie potwierdzone przez dispatch. Każda pozycja ma w kolumnie UZASADNIENIE, po czym została dobrana.")
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
w("Format: `plik:linia` definicji | moduł | funkcja | wołania produkcyjne = 0 | TEMAT (propozycja) | UZASADNIENIE.")
w("")
w("| # | Definicja (plik:linia) | Moduł | Funkcja | Wołania | TEMAT (propozycja) |")
w("|---|---|---|---|---|---|")
topic_count = OrderedDict()
for i, (plik, linia, mod, name) in enumerate(fns, 1):
    t, _ = topic_for(mod)
    topic_count[t] = topic_count.get(t, 0) + 1
    w("| %d | `%s:%d` | `%s` | `%s` | 0 | %s |" % (i, plik, linia, mod, name, t))
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
w("Pełny graf zależności między zero-wołającymi funkcjami nie był liczony (wymagałby analizy ciał funkcji). Propozycja kolejności wpięcia wg zadań z listy (#NN) i AUDYT-PARYTETU-RANO §4:")
w("")
w("1. Fala 1 (fundamenty dyplomacji i zasobów): #104 ZLOZA-WIRING, #106 R7K7C-WIRING, #120 CRED-HAK-WYPOWIEDZENIE — bo tematy wojny/dyplomacji są wołane przez resztę tury.")
w("2. Fala 2 (oblężenie, pętla): #97 K5-LOOP-AUTO, #98 K5-LOOP-WYLOM, #116 TOWER-TARGET, potem #109 / #107 / #108 / #112 (kontrakty pętli, z AUDYT §4), wreszcie #113 K5LOOP-WIRING jako finał pętli.")
w("3. Fala 3 (zdobycie i eliminacja): #115 ZDOBYCIE-MIASTA-WIRING po fali 2 (przejęcie korzysta z pętli bitwy), #114 ELIMINACJA-GRACZA po #115.")
w("4. Fala 4 (ekonomia, mapgen, reszta): tematy `brak tematu` — najpierw moduły bez zależności od innych zero-wołających (liczba zależności: NIE_ZMIERZONO), potem reszta.")
w("5. Na końcu: #119 NIEPODPIETE-MODULY-INDEKS (ten dokument) aktualizowany po każdej fali oraz #105 AUDYT-LUK-B18.")
w("")
w("## 6. Brak tematu — propozycje nazw")
w("")
w("Pozycje z `brak tematu:` w §3 i §4 wymagają decyzji właściciela, czy powstają nowe tematy (dispatch: „brak tematu z propozycją nazwy”). Nie są przypisane do istniejących zadań #96–#140.")
w("")
w("## 7. Czego nie zrobiono (NIE_ZMIERZONO)")
w("")
w("- Nie sprawdzono wołań z `build.rs`, `src/bin`, makr i ścieżek w stringach.")
w("- Nie sprawdzono, czy funkcje zero-wołające są wołane z renderera przez FFI/serde (korpus obejmuje `rust-port/renderer`, ale nie analizowano typów).")
w("- Nie uruchamiano `cargo` (dispatch: temat dokumentacyjny).")
w("- Nie zweryfikowano, czy zadania #96–#140 są nadal `pending` (stan z listy zadań sesji, poza repo).")
w("")

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out))
print("funkcje: %d, moduly: %d" % (n_fn, n_mod))
