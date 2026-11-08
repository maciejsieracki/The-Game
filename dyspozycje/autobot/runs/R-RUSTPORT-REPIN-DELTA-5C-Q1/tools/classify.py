import re, sys, collections, json

S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/5c/'
DELTA5 = S + 'DELTA5.md'

HUNK_RE = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@')
DOM_RE = re.compile(r'document\.|innerHTML|classList|\.style\b|style\.|createElement|querySelector|getElementById|addEventListener|appendChild|textContent|\.dataset\b|\bhidden\b|\.disabled\b|\bclassName\b|\bhtml\s*\+=|\bmodal\b|\bpanel[A-Z]|tooltip|\bbutton\b')


def is_comment_or_blank_or_import(t):
    s = t.strip()
    if s == '':
        return True
    if s.startswith('//') or s.startswith('/*') or s.startswith('*') or s.startswith('*/'):
        return True
    if s.startswith('import ') or s.startswith("} from ") or re.match(r"^import\s*\{", s):
        return True
    return False


def parse(path):
    hunks = []
    cur = None
    h = None
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.rstrip('\n')
            if line.startswith('diff --git '):
                m = re.match(r'^diff --git a/(.+) b/(.+)$', line)
                cur = m.group(2) if m else line
                h = None
                continue
            m = HUNK_RE.match(line)
            if m:
                a, b, c, d = m.group(1), m.group(2), m.group(3), m.group(4)
                h = {'file': cur, 'old_start': int(a), 'old_n': int(b) if b is not None else 1,
                     'new_start': int(c), 'new_n': int(d) if d is not None else 1,
                     'plus': [], 'minus': []}
                hunks.append(h)
                continue
            if h is None:
                continue
            if line.startswith('+') and not line.startswith('+++'):
                h['plus'].append(line[1:])
            elif line.startswith('-') and not line.startswith('---'):
                h['minus'].append(line[1:])
    return hunks


def classify(h):
    changed = h['plus'] + h['minus']
    if h['file'].endswith('.json'):
        return 'DANE'
    if changed and all(is_comment_or_blank_or_import(t) for t in changed):
        return 'PERF'
    if any(DOM_RE.search(t) for t in changed):
        return 'UI'
    return 'LOGIKA'


def topics_from_delta5():
    topics = {}
    in_sec3 = False
    with open(DELTA5, encoding='utf-8') as f:
        for line in f:
            if line.startswith('## 3.'):
                in_sec3 = True
                continue
            if line.startswith('## 4.'):
                break
            if in_sec3 and line.startswith('| ') and '`' in line:
                cols = line.split('|')
                if len(cols) < 8:
                    continue
                m = re.search(r'`([^`]+)`', cols[2])
                if not m:
                    continue
                topics['gra/' + m.group(1)] = cols[6].strip()
    return topics


def preview(h):
    for t in h['plus'] + h['minus']:
        if t.strip():
            return t.strip().replace('\t', ' ')[:90]
    return ''


def main(diff_path, label, tsv_out, numstat_path=None):
    hunks = parse(diff_path)
    topics = topics_from_delta5()
    cls_count = collections.Counter()
    per_file = collections.OrderedDict()
    topic_count = collections.Counter()
    rows = []
    for idx, h in enumerate(hunks, 1):
        k = classify(h)
        cls_count[k] += 1
        added, removed = len(h['plus']), len(h['minus'])
        typ = 'dodanie' if removed == 0 else ('usuniecie' if added == 0 else 'zmiana')
        topic = topics.get(h['file'], '-(poza DELTA-5 s.3)')
        topic_count[(topic, k)] += 1
        pf = per_file.setdefault(h['file'], {'hunks': [], 'plus': 0, 'minus': 0, 'cls': collections.Counter()})
        pf['hunks'].append((h['new_start'], h['new_n'], k))
        pf['plus'] += added
        pf['minus'] += removed
        pf['cls'][k] += 1
        rows.append([label, h['file'], str(idx), str(h['new_start']), str(h['new_n']),
                     str(h['old_start']), str(h['old_n']), str(added), str(removed), typ, k, topic, preview(h)])
    with open(tsv_out, 'w', encoding='utf-8') as f:
        f.write('zakres\tplik\tnr_hunka\tnowa_linia_od\tnowa_liczba\tstara_linia_od\tstara_liczba\tdodane\tusuniete\ttyp\tklasa\ttemat\tpodglad\n')
        for r in rows:
            f.write('\t'.join(r) + '\n')
    total_plus = sum(v['plus'] for v in per_file.values())
    total_minus = sum(v['minus'] for v in per_file.values())
    print(f'== {label}: files={len(per_file)} hunks={len(hunks)} plus={total_plus} minus={total_minus}')
    print('classes', dict(cls_count))
    if numstat_path:
        ns = {}
        with open(numstat_path, encoding='utf-8') as f:
            for line in f:
                p = line.rstrip('\n').split('\t')
                if len(p) == 3 and p[0].isdigit():
                    ns[p[2]] = (int(p[0]), int(p[1]))
        bad = []
        for fn, v in per_file.items():
            if ns.get(fn) != (v['plus'], v['minus']):
                bad.append((fn, v['plus'], v['minus'], ns.get(fn)))
        print('numstat files', len(ns), 'mismatches', len(bad), bad[:5])
    return per_file


if __name__ == '__main__':
    diff_path, label, tsv_out = sys.argv[1], sys.argv[2], sys.argv[3]
    numstat = sys.argv[4] if len(sys.argv) > 4 else None
    main(diff_path, label, tsv_out, numstat)
