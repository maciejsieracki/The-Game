import re, collections
D='/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1'
P='/home/user/The-Game/dyspozycje/rust-port/p2/P2-6-EVENTS.md'
txt=open(P,encoding='utf-8').read()

def rep(old,new,count=1):
    global txt
    n=txt.count(old)
    assert n==count, (n, old[:80])
    txt=txt.replace(old,new)

# header
rep("**Runda:** 4/5 · **Rola:** Operator (Haiku 5.5 medium)","**Runda:** 5/5 (ostatnia) · **Rola:** Operator (Haiku 5.5 medium)")

# E-01 cell
rep("(definicja wariantu `domain/diplomacy.rs:534`, atrybut serde `:533`, enum `:532`; użycie `:623`)",
    "(wariant `domain/diplomacy.rs:535`; enum `:533`; atrybut serde `:534`; użycie `:623`)")

# historical responses: fix E-01 line numbers and class-S sentences
rep("`:532` = `pub enum DiplomaticEvent {`, `:533` = atrybut `#[serde(...)]`, `:534` = `DeclareWar,` (definicja wariantu wewnątrz enum, nie sama deklaracja enum). Użycie: `:623`. E-01 cytuje teraz definicję `:534` i użycie `:623`.",
    "`:532` = `#[derive(...)]`, `:533` = `pub enum DiplomaticEvent {`, `:534` = atrybut `#[serde(...)]`, `:535` = `DeclareWar,` (definicja wariantu). Użycie: `:623`. E-01 cytuje teraz wariant `:535`, enum `:533` i użycie `:623` (korekta w rundzie 5/5).")
rep("Klasa `S` występowała wyłącznie w wierszu E-45 i została zmieniona na `W` (legenda L/H/W/K/D bez zmian).",
    "Klasa `S` nie występuje w legendzie ani w katalogu; E-45 ma klasę `W` (sprawdzenie skryptem, sekcja 7 i odpowiedź rundy 5/5).")
rep("Zdanie w odpowiedzi na zarzut 3 poprawiono: klasa `S` występowała wyłącznie w E-45 i została zmieniona na `W`.",
    "Klasa `S` nie występuje w katalogu (zdanie w odpowiedzi na zarzut 3 poprawiono w rundzie 5/5).")

# new round-5 response section, inserted before the round-4 response section
resp = """## Odpowiedź Operatora na zarzuty Evaluatora z rundy 4/5 (runda 5/5, zarzuty 1–5)

| Zarzut | Dyspozycja | Co zmieniono / dowód |
|---|---|---|
| 1. Klasa `S` w E-45 (wiersz przy deklaracji o zerowych trafieniach) | **PRZYJMUJĘ** | W tej wersji E-45 (sekcja 3.A) ma klasę **W**. Klasa `S` nie występuje w legendzie ani w żadnym wierszu katalogu E-01…E-60: sprawdzenie skryptem (sekcja 7, pkt 3) daje zero wierszy z klasą `S`. Zdania „klasa `S` występowała w E-45” usunięto z odpowiedzi rundy 3 i 4. |
| 2. Sekcja 3.F bez statusu, payloadu, trwałości i proponowanego eventu | **PRZYJMUJĘ** | Tabela 3.F przepisana: kolumny Payload (typy), Trwałość, **Proponowany event Rust**, dowód Rust, Status, Klasa, Uzasadnienie. E-49…E-55 mają status `WYKLUCZONY` (jawny wyjątek od kryterium binarnego, poza sekcją 7), decyzja o tym statusie: **D-EV-13** (sekcja 6). Cytowania poprawione po weryfikacji w `edb8fb56`: E-50 → `main.ts:32507` (console.log `[Rebelia]`), E-51 → `main.ts:32526-32528` (console.log `[Porzadek]`; było `:32495`, to nie jest wywołanie logu), E-52 → `eot-event-defer.ts:149-248`. |
| 3. Pokrycie `gra/src`: 332 z 457 plików bez dyspozycji per plik; wzorzec bez `notify/alert/popup/dialog/log` | **PRZYJMUJĘ** | Dodano **sekcję 9.4** i **Załącznik C**: każdy z **457** plików `.ts` w `gra/src` (`edb8fb56`) ma dyspozycję per plik. Wzorzec sygnału S5/S6 obejmuje `notify…(`, `alert(`, `popup`, `dialog.show/open`, `EventLog`, `LogEntry`, `unshift(`, wywołania `show*/toast*/flash*`. Świadomie poza sygnałem: `console.log` (diagnostyka konsoli, nie UI). Pełna tabela: `dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/pokrycie-gra-src-edb8fb56-r5.tsv`. Ograniczenie metody jawnie opisane w 9.4. |
| 4. Liczba BRAK podana jako 39 | **PRZYJMUJĘ** (skorygowane w rundzie 4, potwierdzone) | Liczba BRAK = **40** w sekcji 7, w nagłówku 9.1 i w 40 wierszach tabeli 9.1. Wyszukiwanie „39” w pliku: wyłącznie historyczny zapis korekty i numery linii kodu (`:39-40`). |
| 5. E-01: błędne numery `diplomacy.rs` (`:533` jako dowód użycia) | **PRZYJMUJĘ** | Zweryfikowane `git show 9e33fc77:rust-port/engine/src/domain/diplomacy.rs`: `:532` = `#[derive(...)]`, `:533` = `pub enum DiplomaticEvent {`, `:534` = `#[serde(...)]`, `:535` = `DeclareWar,`, `:623` = użycie (`DiplomaticEvent::DeclareWar => status = RelationStatus::War`). E-01 i odpowiedzi poprzednich rund poprawione; poprzedni zapis „`:532` enum, `:534` wariant” był błędny. |

**Zmiany w rundzie 5/5:** sekcja 3.F (przepisana), wiersz E-01 (numery), E-50/E-51/E-52 (cytowania), sekcja 6 (D-EV-13), sekcja 7 (kontrola klas i statusów), sekcja 9.4 (nowa), Załącznik C (nowy), plik TSV `pokrycie-gra-src-edb8fb56-r5.tsv` (nowy, w allowliście runu). `gra/**` bez zmian; brak commitów i pushu.

---

"""
rep("## Odpowiedź Operatora na zarzuty Evaluatora (runda 4/5)\n", resp + "## Odpowiedź Operatora na zarzuty Evaluatora (runda 4/5)\n")

# section 3.F rewrite
start=txt.index("### 3.F Eventy wewnętrzne web")
end_marker="> Uwaga: E-55 jest dwukierunkowe i zostało wyłączone z katalogu eventów. Jego skutki (zmiana relacji, wojna, nowa umowa) są eventami E-01/E-03/E-06."
end=txt.index(end_marker)+len(end_marker)
f3 = """### 3.F Eventy wewnętrzne web bez wpływu na kontrakt UI (wpisane dla kompletności; status WYKLUCZONY, D-EV-13)

| ID | Nazwa | Dowód web | Payload (typy) | Trwałość | Proponowany event Rust | Rust dziś (dowód) | Status | Klasa | Uzasadnienie wykluczenia |
|---|---|---|---|---|---|---|---|---|---|
| E-49 | `ai_research_log` | `main.ts:28650-28652` (`console.log`, `[AI n] Zbadano: …`) | `{player: PlayerId, tech: <D-EV-11>, koszt: u32}` | EFEM (konsola) | brak (diagnostyka konsoli, nie zdarzenie UI) | — (log konsoli) | WYKLUCZONY | – | Tylko log konsoli, bez UI; nie jest eventem logika→UI. |
| E-50 | `rebellion_log` | `main.ts:32507` (`console.log`, `[Rebelia] Tura …`) | `{city: CityId, tura: u32}` | EFEM (konsola) | brak (widoczny odpowiednik = E-18, toast) | `rebel`: 0 trafień (E-18) | WYKLUCZONY | – | Konsola nie jest eventem; dublowane przez E-18. |
| E-51 | `order_tier_log` | `main.ts:32526-32528` (`console.log`, `[Porzadek] …`, gdy `tier !== 'neutral'`) | `{city: CityId, tura: u32, tier: <D-EV-11>, porPct: liczba, szPct: liczba}` | EFEM (konsola) | brak (log diagnostyczny) | — | WYKLUCZONY | – | Tylko log diagnostyczny. |
| E-52 | `eot_hint_card` | `game/eot-event-defer.ts:149-248` (`deferredHintsToSidePanelEvents`, id `eot-hint-<tura>-<i>` `:248`) | `{id: String, kind: String, text: String}` (transport, nie domena) | EFEM | brak (transport: batch, sekcja 2); treść niesie E-xx | — (transport) | WYKLUCZONY (mechanizm) | – | Mechanizm transportu web (kolejka odłożonych toastów), nie zdarzenie domeny. |
| E-53 | `dismiss_card` (UI → logika) | `ui/sidePanelHud.ts:477-511` (komentarze o `dismissedSidePanelEventIds`), `game/eot-event-defer.ts:36-43` (`dismissEotOrEraWarLogEntry`, `warEventLog.splice` `:43`) | `{entryId: String}` | EFEM (UI) | brak eventu; komenda `dismiss_event_card` → P2.5 | — (komenda: P2.5) | WYKLUCZONY (komenda) | W | Komenda UI → logika: zakres P2.5, nie event. |
| E-54 | `side_panel_filter` | `ui/sidePanelEventFilter.ts:19-30` (chip „Inne cyw.”) | `{filter: String}` | EFEM (widok) | brak eventu; stan widoku UI (ewentualna komenda widoku, nie logiki) | — (stan widoku UI) | WYKLUCZONY (stan widoku) | W | Stan widoku UI, nie zdarzenie logiki. |
| E-55 | `diplomacy_pending_resolve` | `main.ts:17816` (`Pokój z: …`), `:17861` (`Odrzucono: …`) i pokrewne (`Przyjęto`, `Zaakceptowano`) | `{offer_id: String, answer: Accept \\| Reject}` (UI → logika) | — (skutki w E-01/E-03/E-06) | brak eventu; komenda `diplo_resolve_offer` → P2.5; skutek = E-06 / E-01 | — (komenda: P2.5) | WYKLUCZONY (komenda, dwukierunkowe) | H | Odpowiedź gracza: dwukierunkowe, zaznaczone jawnie, nie klasyfikowane na siłę; wynik → E-06 / E-01. |

> Uwaga: E-55 jest dwukierunkowe i zostało wyłączone z katalogu eventów. Jego skutki (zmiana relacji, wojna, nowa umowa) są eventami E-01/E-03/E-06. Status WYKLUCZONY dla E-49…E-55 nie należy do zbioru GOTOWY/CZĘŚCIOWY/BRAK z dispatchu; patrz D-EV-13 (sekcja 6)."""
txt = txt[:start] + f3 + txt[end:]

# E-52 / E-51 cites already in table; section 9.3 header note
rep("**9.3 Pokrycie plików `gra/src/**` — stan po rundzie 4:",
    "> Od rundy 5/5 dyspozycje per plik dla wszystkich 457 plików są w **sekcji 9.4 i Załączniku C**. Poniższa tabela 9.3 jest zapisem rundy 4 (pierwsze 63 pliki z dyspozycją) i nie jest już dowodem kryterium „każdy plik”.\n\n**9.3 Pokrycie plików `gra/src/**` — stan po rundzie 4:")

# D-EV-13 in section 6
anchor = "- **D-EV-12"
i = txt.index(anchor); j = txt.index("\n", i)
txt = txt[:j+1] + "- **D-EV-13 — status 3.F (E-49…E-55).** Wpisy są poza zbiorem GOTOWY/CZĘŚCIOWY/BRAK z dispatchu: to konsola (E-49…E-51), transport (E-52), komendy UI→logika (E-53, E-55) i stan widoku (E-54). Rekomendacja: zachować status WYKLUCZONY i przenieść komendy do P2.5. Wymaga decyzji Final Control, czy kryterium binarne dopuszcza ten status.\n" + txt[j+1:]

open('/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/scratch-r5/stage1.md','w',encoding='utf-8').write(txt)
print("stage1 ok", len(txt))
