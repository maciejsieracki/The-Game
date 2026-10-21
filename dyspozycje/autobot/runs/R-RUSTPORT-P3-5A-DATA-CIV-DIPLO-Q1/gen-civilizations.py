"""Generate serde structs 1:1 from the JSON shapes actually present in the pinned data.

Usage: python3 -I gen.py <out.rs>
Reads the seven pinned files from SRC_DIR (copies taken with git show edb8fb56).
"""
import json
import keyword
import re
import sys
import unicodedata
from collections import OrderedDict

SRC_DIR = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p3-5a/'

FILES = [
    # (json file, root type name, is-root-map, map paths)
    ('civs.json', 'CivsFile', False, set()),
    ('civ-matrix.json', 'CivMatrixFile', False, {
        '.paramDefs', '.defaults', '.cywilizacje[].params',
    }),
    ('civ-params.json', 'CivParamsFile', False, set()),
    ('civ-ai.json', 'CivAiFile', False, set()),
    ('diplomacy.json', 'DiplomacyFile', False, {
        '.handel_zloze.cena_baza',
    }),
    ('diplomacy-acceptance-points.json', 'AcceptancePointsFile', False, {
        '.koszyk_pn.surowiec_ilosc.pn_per_szt',
        '.koszyk_pn.zloze.przyklady',
    }),
    ('city-names-pools.json', 'CityNamesPoolsFile', True, set()),
]

KW = set(keyword.kwlist)
NOT_RAW = {'self', 'Self', 'super', 'crate'}
TRANS = str.maketrans({
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
})


def ascii_only(s):
    s = s.translate(TRANS)
    s = unicodedata.normalize('NFKD', s)
    return s.encode('ascii', 'ignore').decode('ascii')


def ident(key):
    s = ascii_only(key)
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s)
    s = re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_').lower()
    if not s:
        s = 'field'
    if s[0].isdigit():
        s = 'f_' + s
    if s in NOT_RAW:
        s = s + '_'
    elif s in KW:
        s = 'r#' + s
    return s


def camel(s):
    parts = re.split(r'[^A-Za-z0-9]+', ascii_only(s))
    out = ''.join(p[:1].upper() + p[1:] for p in parts if p)
    if not out:
        out = 'Anon'
    if out[0].isdigit():
        out = 'N' + out
    return out


def kind(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'bool'
    if isinstance(v, int):
        return 'int'
    if isinstance(v, float):
        return 'float'
    if isinstance(v, str):
        return 'str'
    if isinstance(v, list):
        return 'list'
    if isinstance(v, dict):
        return 'dict'
    raise TypeError(type(v))


DERIVE = '#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]'


class Gen:
    def __init__(self, map_paths, used):
        self.defs = []
        self.used = used
        self.map_paths = map_paths
        self.need_num = False

    def uniq(self, base):
        n = base
        i = 2
        while n in self.used:
            n = f'{base}{i}'
            i += 1
        self.used.add(n)
        return n

    def ty(self, values, hint, path):
        kinds = {kind(v) for v in values}
        nullable = 'null' in kinds
        kinds.discard('null')
        non_null = [v for v in values if v is not None]
        if not kinds:
            return 'Option<serde_json::Value>'
        if kinds == {'int'}:
            t = 'i64'
        elif kinds == {'float'}:
            t = 'f64'
        elif kinds == {'str'}:
            t = 'String'
        elif kinds == {'bool'}:
            t = 'bool'
        elif kinds <= {'int', 'float'}:
            t = 'Num'
            self.need_num = True
        elif kinds == {'list'}:
            elems = [e for v in non_null for e in v]
            if not elems:
                t = 'Vec<serde_json::Value>'
            else:
                t = f'Vec<{self.ty(elems, hint + "Item", path + "[]")}>'
        elif kinds == {'dict'}:
            if path in self.map_paths:
                vals = [x for d in non_null for x in d.values()]
                t = f'BTreeMap<String, {self.ty(vals, hint + "Value", path + "{}")}>'
            else:
                t = self.struct(non_null, hint, path)
        else:
            t = self.mixed(non_null, hint, path)
        return f'Option<{t}>' if nullable else t

    def struct(self, dicts, hint, path):
        name = self.uniq(camel(hint))
        keys = OrderedDict()
        for d in dicts:
            for k, v in d.items():
                keys.setdefault(k, []).append(v)
        count = len(dicts)
        lines = []
        seen_idents = set()
        for k, vals in keys.items():
            present_all = len(vals) == count
            has_null = any(v is None for v in vals)
            if not present_all and has_null:
                raise SystemExit(f'MIXED null/missing at {path}.{k}')
            rid = ident(k)
            base = rid
            i = 2
            while rid in seen_idents:
                rid = f'{base}_{i}'
                i += 1
            seen_idents.add(rid)
            t = self.ty(vals, camel(k), f'{path}.{k}')
            attrs = []
            if not present_all:
                if not t.startswith('Option<'):
                    t = f'Option<{t}>'
                attrs.append('default')
                attrs.append('skip_serializing_if = "Option::is_none"')
            attrs.insert(0, f'rename = "{k}"')
            lines.append(f'    #[serde({", ".join(attrs)})]')
            lines.append(f'    pub {rid}: {t},')
        body = '\n'.join(lines)
        self.defs.append(
            f'{DERIVE}\n#[serde(deny_unknown_fields)]\npub struct {name} {{\n{body}\n}}\n')
        return name

    def mixed(self, values, hint, path):
        name = self.uniq(camel(hint) + 'Value')
        kinds = sorted({kind(v) for v in values})
        order = ['bool', 'int', 'float', 'str', 'list', 'dict']
        variants = []
        for k in order:
            if k not in kinds:
                continue
            if k == 'bool':
                variants.append('    Bool(bool),')
            elif k == 'int':
                variants.append('    Int(i64),')
            elif k == 'float':
                variants.append('    Float(f64),')
            elif k == 'str':
                variants.append('    Str(String),')
            elif k == 'list':
                elems = [e for v in values if isinstance(v, list) for e in v]
                sub = self.ty(elems, camel(hint) + 'Item', path + '[]')
                variants.append(f'    List(Vec<{sub}>),')
            elif k == 'dict':
                ds = [v for v in values if isinstance(v, dict)]
                sub = self.struct(ds, camel(hint) + 'Obj', path)
                variants.append(f'    Obj({sub}),')
        body = '\n'.join(variants)
        self.defs.append(
            f'#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]\n#[serde(untagged)]\npub enum {name} {{\n{body}\n}}\n')
        return name


def generate():
    out = []
    out.append('// GENEROWANE 1:1 z ksztaltu JSON na pinie edb8fb56 (gra/data/*.json) przez skrypt gen.py.')
    out.append('// Nie edytowac recznie bez ponownego wygenerowania i testu round-trip.')
    out.append('#![allow(dead_code)]')
    out.append('')
    out.append('use std::collections::BTreeMap;')
    out.append('')
    out.append('use serde::{Deserialize, Serialize};')
    out.append('')
    out.append('/// Liczba: JSON bez czesci dziesietnej -> Int, z czescia dziesietna -> Float (zachowany typ z JSON).')
    out.append('#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]')
    out.append('#[serde(untagged)]')
    out.append('pub enum Num {')
    out.append('    Int(i64),')
    out.append('    Float(f64),')
    out.append('}')
    out.append('')
    consts = []
    used = set()
    for fname, root_name, is_root_map, map_paths in FILES:
        g = Gen(map_paths, used)
        data = json.load(open(SRC_DIR + fname, encoding='utf-8'))
        if is_root_map:
            vals = list(data.values())
            t = g.ty(vals, 'CityPool', '{}')
            used.add(root_name)
            out.append(f'// ===== {fname} =====')
            out.extend(g.defs)
            out.append(f'pub type {root_name} = BTreeMap<String, {t}>;\n')
            rt = root_name
        else:
            rt = g.ty([data], root_name, '')
            out.append(f'// ===== {fname} =====')
            out.extend(g.defs)
        const = fname.replace('.json', '').replace('-', '_').upper() + '_JSON'
        consts.append((const, fname, rt))
    out.append('')
    for const, fname, rt in consts:
        out.append(f'pub const {const}: &str = include_str!("../../data/{fname}");')
    out.append('')
    for const, fname, rt in consts:
        fn = 'parse_' + fname.replace('.json', '').replace('-', '_')
        out.append(f'pub fn {fn}() -> serde_json::Result<{rt}> {{')
        out.append(f'    serde_json::from_str({const})')
        out.append('}')
        out.append('')
    return '\n'.join(out)


if __name__ == '__main__':
    src = generate()
    open(sys.argv[1], 'w', encoding='utf-8').write(src)
    print('written', sys.argv[1], len(src.splitlines()), 'lines')
