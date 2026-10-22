#!/usr/bin/env python3
"""Generator tabeli statusow per symbol dla P6.1 (r2).

Czyta eksporty 16 plikow web (gra/src/game, pin edb8fb56) i wypisuje KAZDY eksport
ze statusem. Statusy PORTOWANY/NIE-DOTYCZY sa zapisane jawnie (z dowodem w kolumnie Dowod);
kazdy inny symbol dostaje RUNDA-2. Wynik: TSV w katalogu runu + wstawiona tabela w dokumencie
P6-1-STAN-STARTOWY.md (miedzy znacznikami SYMBOLS:BEGIN/END).

Uzycie: python3 -I gen-p61-symbol-status.py <WEB_ROOT> <OUT_TSV> <DOC_MD>
"""
import os
import re
import sys

FILES = [
    "playerState", "human-owners", "owner-utils", "owner-epoch", "first-player-city",
    "civ-entry-epoch", "cluster-start", "inca-llama-seed", "braz-access", "city-names-pool",
    "civ-bonuses", "civ-roster", "civ-names", "civ-matrix", "civ-matrix-semantic", "civ-ai-data",
]

P = "PORTOWANY"
N = "NIE-DOTYCZY"
R = "RUNDA-2"

# (plik, symbol) -> (status, dowod / cel Rust / uzasadnienie)
OVERRIDES = {
    ("civ-entry-epoch", "GAME_EPOCH_ORDER"): (P, "unit_epoch::GAME_EPOCH_ORDER; wektor constants.GAME_EPOCH_ORDER"),
    ("civ-entry-epoch", "gameEpochIndex"): (P, "unit_epoch::game_epoch_index; wektor gameEpochIndex"),
    ("civ-entry-epoch", "GameEpochId"): (N, "typ TS (union literalow) = parse_game_epoch_id -> Option<Epoch>; brak osobnego symbolu w Rust"),
    ("civ-entry-epoch", "CivEntryEpochRow"): (N, "typ danych wejsciowych = unit_epoch::CivEntryRow (bez logiki)"),
    ("civ-entry-epoch", "getCivEpokaWejscia"): (P, "unit_epoch::civ_entry_epoch; wektor civEntry.entry"),
    ("civ-entry-epoch", "isCivAvailableAtGameEpoch"): (P, "unit_epoch::is_civ_available_at_game_epoch; wektor civEntry.available"),
    ("civ-entry-epoch", "civIdsAvailableAtGameEpoch"): (P, "unit_epoch::civ_ids_available_at_game_epoch; wektor rosterAvail"),
    ("civ-entry-epoch", "formatCivEntryEpochLabel"): (P, "unit_epoch::format_civ_entry_epoch_label (r2); wektor civEntry.label"),
    ("civ-entry-epoch", "gameEpochHudLabel"): (P, "unit_epoch::game_epoch_hud_label (r2); wektor hudLabels"),
    ("owner-utils", "isMajorAiOwner"): (P, "player::is_major_ai_owner; wektor majorAi"),
    ("human-owners", "HUMAN_OWNER_PRIMARY"): (P, "player::HUMAN_OWNER_PRIMARY; wektor constants.HUMAN_OWNER_PRIMARY"),
    ("human-owners", "HumanSeats"): (P, "player::HumanSeats (struct)"),
    ("human-owners", "isHumanOwner"): (P, "HumanSeats::is_human_owner; wektor seats.owners.isHuman"),
    ("human-owners", "isActiveHuman"): (P, "HumanSeats::is_active_human; wektor seats.owners.isActive"),
    ("human-owners", "isAiOwner"): (P, "HumanSeats::is_ai_owner; wektor seats.owners.isAi (bez -5, patrz outOfDomain)"),
    ("human-owners", "nextHumanSeat"): (P, "HumanSeats::next_human_seat; wektor seats.nextHumanSeat"),
    ("human-owners", "isHotSeat"): (P, "HumanSeats::is_hot_seat; wektor seats.isHotSeat"),
    ("civ-roster", "makeRng"): (P, "domain::rng::Mulberry32 (r2, bit-w-bit); wektor rng (7 ziaren x 8 krokow)"),
    ("civ-roster", "civIdsAvailableAtGameEpoch"): (P, "re-eksport z civ-entry-epoch; PORTOWANY jak wyzej"),
    ("civ-roster", "civIdsFromRoster"): (R, "brak portu Rust; wektor rosterIds zweryfikowany Pythonem (verify-p61-web-vectors.py), nie Rust"),
    ("playerState", "PIENIADZ_MNOZNIK"): (R, "stala = 10 (playerState.ts:75); r3: data/derived/*.json (dane, nie literal)"),
    ("playerState", "RESEARCH_QUEUE_MAX"): (R, "stala = 4 (playerState.ts:82); r3: data/derived/*.json (dane, nie literal)"),
    ("playerState", "techCost"): (R, "r3: TechDef = data::buildings_tech::Technologia (koszt_nauki, buildings_tech.rs:398)"),
    ("braz-access", "PIEC_HUTNICZY_BUILDING_ID"): (R, "stala danych (id budynku) r3: z data/*"),
    ("braz-access", "KOPALNIA_MIEDZI_KEY"): (R, "stala danych (klucz surowca) r3: z data/*"),
}


def exports_of(text):
    """Zwraca liste (symbol, rodzaj) eksportow z pliku TS (deklaracje i bloki export {...})."""
    out = []
    for m in re.finditer(r"^export\s+(?:declare\s+)?(const|let|var|function|async function|interface|type|class|enum)\s+(\w+)", text, re.M):
        out.append((m.group(2), m.group(1)))
    for m in re.finditer(r"^export\s+(?:type\s+)?\{([^}]*)\}", text, re.M | re.S):
        for part in m.group(1).split(","):
            name = part.strip()
            if not name:
                continue
            name = re.split(r"\s+as\s+", name)[-1].strip()
            if re.fullmatch(r"\w+", name):
                out.append((name, "re-export"))
    seen, uniq = set(), []
    for sym, kind in out:
        if sym not in seen:
            seen.add(sym)
            uniq.append((sym, kind))
    return uniq


def main():
    web_root, out_tsv, doc_md = sys.argv[1], sys.argv[2], sys.argv[3]
    rows = []
    for f in FILES:
        text = open(os.path.join(web_root, "gra/src/game", f + ".ts"), encoding="utf8").read()
        for sym, kind in exports_of(text):
            status, why = OVERRIDES.get((f, sym), (R, "nieportowane w r2 (lista r3, patrz sekcja 4)"))
            rows.append((f, sym, kind, status, why))
    with open(out_tsv, "w", encoding="utf8") as fh:
        fh.write("plik_web\tsymbol\trodzaj\tstatus\tdowod_lub_powod\n")
        for r in rows:
            fh.write("\t".join(r) + "\n")
    counts = {}
    for r in rows:
        counts[r[3]] = counts.get(r[3], 0) + 1
    print(f"symboli={len(rows)} " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    if doc_md != "-":
        lines = ["| plik web | symbol | rodzaj | status | dowód / powód |", "|---|---|---|---|---|"]
        for f, sym, kind, status, why in rows:
            lines.append(f"| `{f}.ts` | `{sym}` | {kind} | {status} | {why} |")
        table = "\n".join(lines)
        doc = open(doc_md, encoding="utf8").read()
        pat = re.compile(r"<!-- SYMBOLS:BEGIN -->.*?<!-- SYMBOLS:END -->", re.S)
        if not pat.search(doc):
            raise SystemExit("brak znacznikow SYMBOLS:BEGIN/END w dokumencie")
        new = "<!-- SYMBOLS:BEGIN -->\n" + table + "\n<!-- SYMBOLS:END -->"
        open(doc_md, "w", encoding="utf8").write(pat.sub(lambda _m: new, doc))
        print("dokument zaktualizowany: " + doc_md)


if __name__ == "__main__":
    main()
