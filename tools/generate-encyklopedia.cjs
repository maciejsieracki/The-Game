#!/usr/bin/env node
/**
 * Generuje / odświeża hasła Wiki z pogłębionym Wiki-M + Przykład liczbowy.
 * node tools/generate-encyklopedia.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'gra', 'data');
const OUT = path.join(ROOT, 'docs', 'encyklopedia');

const EPOKA = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo', 4: 'Średniowiecze' };
const EPOKA_SZMAX = { 1: 12, 2: 18, 3: 24 }; // kanon B2-model-szczescie

function slug(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function val(obj, key, diff = 'normal') {
  if (!obj || obj[key] == null) return null;
  const v = obj[key];
  if (typeof v === 'object' && v !== null && 'normal' in v) return v[diff];
  return v;
}

function fmtYields(baza, przyrost, maxLvl = 3) {
  const labels = {
    praca: 'pracy',
    pieniadz: 'złota',
    zywnosc: 'żywności',
    nauka: 'nauki',
    kultura: 'kultury',
    zadowolenie: 'pkt szczęścia',
    obrona: 'obrony',
    mnoznik: '% mnożnika handlu',
  };
  const lines = [];
  for (const [k, label] of Object.entries(labels)) {
    const b = baza?.[k] ?? 0;
    const p = przyrost?.[k] ?? 0;
    if (b || p) {
      const at3 = b + p * (maxLvl - 1);
      lines.push({ k, label, b, p, at3 });
    }
  }
  return lines;
}

function buildingExample(b) {
  const koszt1 = b.kosztBudowy;
  const koszt2 = koszt1 + (b.przyrostKosztu || 0);
  const koszt3 = koszt2 + (b.przyrostKosztu || 0);
  const yields = fmtYields(b.baza, b.przyrost, 3);
  const y1 = yields.map((y) => `+${y.b} ${y.label}`).join(', ') || 'efekt specjalny';
  const y3 = yields.map((y) => `+${y.at3} ${y.label}`).join(', ') || '—';
  const pracaTur = 10; // założenie: 10 pracy/t na budynki po suwaku 70%
  const t1 = Math.ceil(koszt1 / pracaTur);
  const t2 = Math.ceil(koszt2 / pracaTur);
  const utrz = b.utrzymanie || 0;
  const utrz20 = utrz * 20;

  let payback = '';
  if (yields.find((y) => y.k === 'pieniadz')) {
    const y = yields.find((y) => y.k === 'pieniadz');
    payback = `Przy +${y.b} złota/t, utrzymanie ${utrz} ¤/t → netto **+${y.b - utrz} ¤/t**. Koszt ${koszt1} pracy przy ${pracaTur}/t ≈ **${t1} tur** pracy — złotem „zwraca się" po ok. **${Math.ceil(koszt1 / Math.max(1, y.b - utrz))} tur** (uproszczenie, bez inflacji).`;
  } else if (yields.find((y) => y.k === 'zywnosc')) {
    const y = yields.find((y) => y.k === 'zywnosc');
    payback = `+${y.b} żywności/t przyspiesza bufor wzrostu — przy progu **34** (pop. 3, normal) to ok. **${Math.ceil(34 / y.b)} tur** szybciej o 1 mieszkańca *tylko z tego budynku* (reszta z pól).`;
  } else if (yields.find((y) => y.k === 'praca')) {
    const y = yields.find((y) => y.k === 'praca');
    payback = `+${y.b} pracy/t — przy koszcie ${koszt1} pracy inwestycja „wraca" w **${Math.ceil(koszt1 / y.b)} tur** (jeśli cała nowa praca idzie w kolejkę).`;
  } else {
    payback = `Korzyść jakościowa (obrona, szczęście, kultura) — policz wpływ w panelu **Miasto** przed/po budowie.`;
  }

  return `**Scenariusz:** miasto ma **${pracaTur} pracy/t** na budynki (suwak pracy 70%, miasto produkuje ~14 pracy/t).

| Etap | Koszt pracy | Czas budowy (~) | Co daje (poz. 1) | Utrzymanie |
|------|-------------|-----------------|------------------|------------|
| Poziom 1 | ${koszt1} | **${t1} tur** | ${y1} | ${utrz} ¤/t |
| Poziom 2 | ${koszt2} | **${t2} tur** | więcej (patrz niżej) | ${utrz} ¤/t |
| Poziom 3 | ${koszt3} | — | **${y3}** | ${utrz} ¤/t |

${payback}

**Przyspieszenie za złoto:** jeśli brakuje **${Math.max(0, koszt1 - pracaTur * 2)}** pracy po 2 turach, możesz dokupić rush — koszt rośnie z pozostałą pracą (szczegóły w Części VII poradnika).`;
}

function unitExample(u) {
  const gold = u['Pieniądz (koszt)'] || 10;
  const pop = u.Ludność || 1;
  const utrzG = u['Utrzymanie (Pieniądz/turę)'] || 1;
  const utrzF = u['żywność/turę'] || 1;
  const moc = u.fieldPower != null ? u.fieldPower : '—';
  const ruch = u.Ruch || 2;
  const t20g = utrzG * 20;
  const t20f = utrzF * 20;

  return `**Rekrutacja:** **${gold} ¤** ze skarbca + **${pop}** mieszkańców (np. pop. 5 → 4 po werbunku).

**Utrzymanie 20 tur** (jednostka stoi lub walczy):
- Złoto: ${utrzG} × 20 = **${t20g} ¤**
- Żywność: ${utrzF} × 20 = **${t20f}** (z zapasów państwa, jeśli masz Spichlerz; inaczej z bieżącej produkcji)

**Siła w polu:** **${moc}** — porównaj z **Wojownikiem (~21,5)** lub **Wojownikiem z mieczem (~25)** na tym samym terenie.

**Ruch ${ruch}** na mapie: z miasta A do B (3 heksy lasu) ≈ **${ruch >= 3 ? 3 : ruch}** tur marszu lub mniej na drodze.

**Kiedy opłaca się:** ${u['Rola (linia)'] === 'Dystans' ? 'Chroń za linią piechoty — 1 jednostka dystansowa na 2–3 wojowników.' : u['Rola (linia)'] === 'Kawaleria' ? 'Uderzenie na skrzydło, unikaj oszczepników.' : u['Rola (linia)'] === 'Oblężnicza' ? 'Tylko przy murze — na polu siła armii liczy się bez machin.' : 'Podstawowa jednostka linii frontu — tania, ale wymaga liczebności.'}`;
}

function improvementExample(key, imp) {
  const koszt = imp.koszt_praca || 20;
  const pracaTur = 8;
  const tBuild = Math.ceil(koszt / pracaTur);
  const bonusParts = [];
  if (imp.bonus) {
    for (const [k, v] of Object.entries(imp.bonus)) {
      const lab = { zywnosc: 'żywność', praca: 'praca', handel: 'handel', pieniadz: 'złoto' }[k] || k;
      bonusParts.push(`+${v} ${lab}/t`);
    }
  }
  const bonus = bonusParts.join(', ') || 'efekt specjalny';
  const gain = imp.bonus?.zywnosc || imp.bonus?.praca || 2;
  const payback = Math.ceil(koszt / Math.max(1, gain));

  return `**Budowa:** **${koszt} pracy** jednorazowo. Przy **${pracaTur} pracy/t** z puli imperium → ok. **${tBuild} tur**.

**Po ukończeniu:** heks daje ${bonus} (oprócz plonu bazowego terenu).

**Zwrot pracy (uproszczenie):** czysty zysk **+${gain}**/t vs bez ulepszenia → **${payback} tur** na „odrobienie" ${koszt} pracy (ignorując bazę pola).

**Przykład:** łąka daje 1 żywność/t; **${imp.nazwa}** +${imp.bonus?.zywnosc || gain} → **${1 + (imp.bonus?.zywnosc || gain)} żywności/t** z tego heksu dla miasta właściciela.`;
}

function writeHaslo(dir, id, meta, wikiS, wikiM, przyklad) {
  const fp = path.join(dir, `${id}.md`);
  const body = `# ${meta.tytul}

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | \`${id}\` |
| **tytuł** | ${meta.tytul} |
| **kategoria** | ${meta.kategoria} |
| **poradnik_ref** | ${meta.poradnik_ref} |
| **json_ref** | \`${meta.json_ref}\` |
| **status_v1** | ${meta.status_v1 || '✅'} |

---

## Wiki‑S

${wikiS}

---

## Wiki‑M

${wikiM}

---

## Przykład liczbowy

${przyklad}

---

## Poradnik‑L

→ ${meta.poradnik_ref}

---

## Historia / decyzje

${meta.historia || 'Wygenerowano z danych gry · rev. E 2026-07-03 (pogłębienie + przykłady).'}
`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fp, body, 'utf8');
}

function generateBuildings(econ) {
  const list = JSON.parse(fs.readFileSync(path.join(DATA, 'buildings.json'), 'utf8'));
  const dir = path.join(OUT, 'budynki');
  const index = [];
  for (const b of list) {
    const epoka = EPOKA[b.epokaWejscia] || `epoka ${b.epokaWejscia}`;
    const yields = fmtYields(b.baza, b.przyrost);
    const yText = yields.map((y) => `**+${y.b} ${y.label}** (+${y.p} na poziom)`).join(', ') || 'efekt specjalny';
    const tech = b.techUnlock ? `Technologia **${b.techUnlock}**.` : 'Bez dodatkowej technologii.';
    const wym = b.wymagania ? `Warunek: ${b.wymagania}.` : '';

    const wikiS = `**${b.nazwa}** — budynek (${b.kategoria}), epoka ${epoka}. Koszt od **${b.kosztBudowy}** pracy, utrzymanie **${b.utrzymanie}** ¤/t. ${tech}`;

    const wikiM = [
      `### Co robi`,
      `${b.nazwa} wzmacnia miasto w kategorii **${b.kategoria}**. Poziom 1: ${yText}. Maksymalnie **${b.maksPoziom || 10}** poziomów — każdy kosztuje więcej pracy (+**${b.przyrostKosztu || 0}** od poprzedniego), ale daje większy przyrost.`,
      ``,
      `### Koszty`,
      `- **Budowa poz. 1:** ${b.kosztBudowy} pracy`,
      `- **Każdy kolejny poziom:** +${b.przyrostKosztu || 0} pracy`,
      `- **Utrzymanie:** ${b.utrzymanie} ¤/turę${b.przyrostUtrzymania ? ` (+${b.przyrostUtrzymania} ¤/poziom)` : ''}`,
      `- ${tech}`,
      wym,
      b.uwagi ? `- **Uwaga:** ${b.uwagi}` : '',
      ``,
      `### Strategia gracza`,
      yields.some((y) => y.k === 'zywnosc')
        ? `Priorytet we **wczesnej grze**, jeśli bufor wzrostu stoi w miejscu. Łącz ze Spichlerzem w imperium, żeby żywność nie przepadała po awansie ludności.`
        : yields.some((y) => y.k === 'zadowolenie')
          ? `Buduj **przed** przekroczeniem progu zagęszczenia (pop > 4) lub po podboju obcego miasta — szczęście podnosi też **porządek**.`
          : yields.some((y) => y.k === 'obrona')
            ? `Przed wojnou z sąsiadem: mury/fort **przed** masową rekrutacją. Oblężenie bez muru kończy się szybciej.`
            : yields.some((y) => y.k === 'nauka')
              ? `Miasto naukowe: ustaw suwak handlu więcej na **naukę (20%)**, suwak pracy **70% budynki**.`
              : `Rozwijaj, gdy masz nadwyżkę pracy w imperium — nie blokuj kolejki wojska w mieście granicznym.`,
      ``,
      `### Typowe błędy`,
      `- Budowa bez technologii (szara na liście) — sprawdź drzewko nauki.`,
      `- Ignorowanie utrzymania: ${b.utrzymanie} ¤/t × 10 poziomów × kilka miast = wyczerpanie skarbca.`,
      `- Rush za złoto „na siłę" przy pustym skarbcu — najpierw Targowisko / podatki.`,
      ``,
      `**Powiązane:** Produkcja miejska · Utrzymanie · ${b.kategoria}`,
    ]
      .filter(Boolean)
      .join('\n');

    writeHaslo(
      dir,
      b.id,
      {
        tytul: b.nazwa,
        kategoria: 'Miasto — budowa',
        poradnik_ref: '`docs/PORADNIK-GRACZA/45-katalog-budynkow.md`',
        json_ref: 'buildings.json',
      },
      wikiS,
      wikiM,
      buildingExample(b)
    );
    index.push({ id: b.id, tytul: b.nazwa, kategoria: b.kategoria, epoka });
  }
  return index;
}

function generateUnits() {
  const list = JSON.parse(fs.readFileSync(path.join(DATA, 'units.json'), 'utf8'));
  const dir = path.join(OUT, 'jednostki');
  const index = [];
  const seen = new Map();
  for (const u of list) {
    const name = u.Jednostka;
    let id = slug(name);
    if (seen.has(id)) id = `${id}-${slug(u.Kultura || u.Epoka || '')}`;
    seen.set(id, true);
    const rola = u['Rola (linia)'] || 'Standardowa';
    const epoka = u.Epoka || '—';

    const wikiS = `**${name}** (${rola}, ${epoka}): rekrutacja **${u['Pieniądz (koszt)']}** ¤ + **${u.Ludność}** mieszk., utrzymanie **${u['Utrzymanie (Pieniądz/turę)']}** ¤/t i **${u['żywność/turę']}** żywn./t. Siła w polu **${u.fieldPower ?? '—'}**.`;

    const wikiM = [
      `### Rola`,
      `${name} to jednostka typu **${rola}** z epoki **${epoka}**. ${u.Kultura ? `Unikalna dla **${u.Kultura}**.` : 'Dostępna wielu cywilizacjom po odblokowaniu epoki/tech.'}`,
      ``,
      `### Rekrutacja i utrzymanie`,
      `- **Koszt:** ${u['Pieniądz (koszt)']} ¤, ${u.Ludność} mieszkańców`,
      `- **Tech:** ${u.Tech && u.Tech !== '-' ? u.Tech : 'brak (poza epoką)'}`,
      `- **Utrzymanie:** ${u['Utrzymanie (Pieniądz/turę)']} ¤/t, ${u['żywność/turę']} żywności/t`,
      `- **Ruch:** ${u.Ruch} (mapa) / ${u['Ruch w bitwie (heksy)']} (bitwa)`,
      u['Zasięg ataku (hex)'] && u['Zasięg ataku (hex)'] !== '—' ? `- **Zasięg:** ${u['Zasięg ataku (hex)']} heksów` : '',
      `- **Siła w polu:** ${u.fieldPower ?? '—'}`,
      ``,
      `### Countery i taktyka`,
      u['Bonus vs Spearman %'] ? `- Bonus vs włócznik: **+${u['Bonus vs Spearman %']}%**` : '',
      `- Słabsza od strony: ${rola === 'Kawaleria' ? 'oszczepnicy (+50% obrażeń od włóczników w macierzy)' : rola === 'Dystans' ? 'kawaleria w zwarciu, flanki' : 'masowe dystansowce z tyłu'}`,
      `- W bitwie ręcznej: ${rola === 'Dystans' ? 'stój za piechotą, nie wpuść wroga w zasięg 1' : 'trzymaj linię, nie rozdzielaj na pojedyncze walki'}`,
      ``,
      `**Powiązane:** Rekrutacja · Walka · ${rola}`,
    ]
      .filter(Boolean)
      .join('\n');

    writeHaslo(
      dir,
      id,
      {
        tytul: name,
        kategoria: 'Jednostki i walka',
        poradnik_ref: '`docs/PORADNIK-GRACZA/57-katalog-jednostek.md`',
        json_ref: 'units.json',
      },
      wikiS,
      wikiM,
      unitExample(u)
    );
    index.push({ id, tytul: name, epoka, rola });
  }
  return index;
}

function generateImprovements() {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'terrain-improvements.json'), 'utf8'));
  const dir = path.join(OUT, 'ulepszenia');
  const index = [];
  for (const [key, imp] of Object.entries(raw)) {
    if (key.startsWith('_')) continue;
    const epoka = EPOKA[imp.epoka] || `epoka ${imp.epoka}`;
    const wikiS = `**${imp.nazwa}** (${epoka}): koszt **${imp.koszt_praca || '?'}** pracy, bonus na heksie. ${imp.tech ? `Tech: ${imp.tech}.` : ''}`;

    const wikiM = [
      `### Co robi`,
      `Ulepszenie **${imp.nazwa}** na polu w **twoim terytorium**. ${imp.teren ? `Teren: ${imp.teren}.` : ''}`,
      imp.warunek ? `**Warunek:** ${imp.warunek}` : '',
      imp.surowiecOdblokowany ? `**Surowiec:** odblokowuje **${imp.surowiecOdblokowany}**.` : '',
      ``,
      `### Strategia`,
      `- Buduj z trybu **Budowa** (lewy panel mapy) — koszt w **pracy** ze skarbca imperium.`,
      `- Przypisz heks w **Okolica** miasta, które ma nadwyżkę pracy.`,
      `- Profile auto: **Żywność** / **Produkcja** / **Podatki** — ręczna korekta na kluczowe złoża.`,
      ``,
      `**Powiązane:** Budowa na mapie · Okolica miasta`,
    ]
      .filter(Boolean)
      .join('\n');

    writeHaslo(
      dir,
      key,
      {
        tytul: imp.nazwa,
        kategoria: 'Mapa i teren',
        poradnik_ref: '`docs/PORADNIK-GRACZA/28-katalog-ulepszen.md`',
        json_ref: 'terrain-improvements.json',
      },
      wikiS,
      wikiM,
      improvementExample(key, imp)
    );
    index.push({ id: key, tytul: imp.nazwa, epoka });
  }
  return index;
}

function generateWonders() {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA, 'wonders.json'), 'utf8'));
  const dir = path.join(OUT, 'cuda');
  const index = [];
  const list = raw.cuda || [];
  for (const w of list) {
    const id = w.id || slug(w.nazwa);
    const typ = w.typ || w.dostep || 'E';
    const koszt = w.koszt_pracy || w.kosztPracy || 200;
    const wikiS = `**${w.nazwa}** (cud ${typ === 'R' || typ === 'wyscig' ? 'wyścigowy' : 'wyłączny'}) — koszt **${koszt}** pracy, max **1 na świat**.`;

    const wikiM = [
      `### Co daje`,
      w.opis || w.bonus_opis || 'Bonus imperium i/lub ×3 plony w mieście wzniesienia (patrz JSON).',
      ``,
      `### Budowa`,
      `- Heks w **twoim terytorium**, wymagana technologia epoki.`,
      `- **${koszt} pracy** — planuj kilka tur produkcji w mieście stołecznym.`,
      `- Typ **${typ}**: ${typ === 'R' ? 'wyścig — pierwszy na świecie wygrywa' : 'wyłączny — tylko wybrane cywilizacje widzą w panelu'}.`,
      ``,
      `### Po absolut (koniec Średniowiecza)`,
      `- Bonusy wygasają; cud zostaje jako **ruina**.`,
      `- Utrzymanie spada do **50%** (decyzja D-CUD2).`,
      `- Jedyny yield: **+10 handlu** (turystyka).`,
    ].join('\n');

    const przyklad = `**Plan budowy:** stolica produkuje **12 pracy/t** na cuda (suwak pracy 70%). Cud **${koszt}** pracy → ok. **${Math.ceil(koszt / 12)} tur** bez rush.

**Po wzniesieniu:** utrzymanie z JSON (np. **2–5 ¤/t**) — policz w skarbcu: 5 ¤/t × 50 tur = **250 ¤** do absolutu.

**Porównanie:** zwykły Teatr **55** pracy, cud **${koszt}** — cud to inwestycia na całą grę do absolutu, nie na jedno miasto.`;

    writeHaslo(
      dir,
      id,
      {
        tytul: w.nazwa,
        kategoria: 'Cuda świata',
        poradnik_ref: '`docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md`',
        json_ref: 'wonders.json',
      },
      wikiS,
      wikiM,
      przyklad
    );
    index.push({ id, tytul: w.nazwa });
  }
  return index;
}

function writeIndex(parts) {
  const lines = ['# Indeks encyklopedii (Wiki)', '', '> Rev. E · 2026-07-03 · każde hasło: Wiki-S, Wiki-M, **Przykład liczbowy**', ''];
  for (const { title, dir, items } of parts) {
    lines.push(`## ${title} (${items.length})`, '');
    for (const it of items) {
      lines.push(`- [${it.tytul}](${dir}/${it.id}.md)`);
    }
    lines.push('');
  }
  lines.push('## Pojęcia (ręczne)', '', 'Folder `pojecia/` — szczęście, porządek, bunt, suwaki, Spichlerz…');
  fs.writeFileSync(path.join(OUT, 'indeks.md'), lines.join('\n'), 'utf8');
}

const buildings = generateBuildings();
const units = generateUnits();
const improvements = generateImprovements();
let wonders = [];
try {
  wonders = generateWonders();
} catch (e) {
  console.warn('Wonders skip:', e.message);
}

writeIndex([
  { title: 'Budynki', dir: 'budynki', items: buildings },
  { title: 'Jednostki', dir: 'jednostki', items: units },
  { title: 'Ulepszenia', dir: 'ulepszenia', items: improvements },
  { title: 'Cuda', dir: 'cuda', items: wonders },
]);

console.log(`OK rev.E: ${buildings.length} budynków, ${units.length} jednostek, ${improvements.length} ulepszeń, ${wonders.length} cudów`);
