#!/usr/bin/env python3
"""MW parity check: compare C-SALT and CSL Salt API entry responses.

Roadmap docs/SALT_API_INTEGRATION_ROADMAP.md §9 (Phase 3). Works C-SALT-only today
(the CSL Salt endpoint is not built yet); pass --csl-base once Phase 1 is up and it
diffs the two hosts entry-for-entry.

  python parity_mw.py
  python parity_mw.py --csl-base https://sanskrit-lexicon.uni-koeln.de
  python parity_mw.py --dict mw --headwords agni indra ka aMSa Davala
"""
import sys, json, time, argparse, urllib.request, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

CSALT_BASE = 'https://api.c-salt.uni-koeln.de'


def fetch(base, dct, hw, query_type='term', field='headword_slp1', retries=4):
    """Return the list of entry ids for one headword, with retries (TLS is flaky)."""
    qs = urllib.parse.urlencode({'field': field, 'query': hw,
                                 'query_type': query_type, 'size': 50})
    url = f'{base}/dicts/{dct}/restful/entries?{qs}'
    last = None
    for _ in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=40) as r:
                data = json.loads(r.read().decode('utf-8'))
                return [e.get('id') for e in data.get('data', {}).get('entries', [])]
        except Exception as e:            # network / TLS flakiness
            last = e
            time.sleep(2)
    raise RuntimeError(f'fetch failed: {url}: {last}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dict', default='mw')
    ap.add_argument('--headwords', nargs='*',
                    default=['agni', 'indra', 'ka', 'aMSa', 'Davala'])
    ap.add_argument('--csl-base', default=None,
                    help='CSL Salt base once Phase 1 is up, '
                         'e.g. https://sanskrit-lexicon.uni-koeln.de')
    a = ap.parse_args()

    print(f'# MW parity  dict={a.dict}  C-SALT={CSALT_BASE}  '
          f'CSL={a.csl_base or "(not built yet)"}')
    mismatches = 0
    for hw in a.headwords:
        cs = fetch(CSALT_BASE, a.dict, hw)
        if not a.csl_base:
            print(f'{hw:12} csalt_n={len(cs):<3} ids={cs}')
            continue
        try:
            csl = fetch(a.csl_base, a.dict, hw)
        except Exception as e:            # noqa: BLE001
            print(f'{hw:12} CSL ERROR: {e}')
            mismatches += 1
            continue
        ok = (cs == csl)
        mismatches += 0 if ok else 1
        print(f'{hw:12} {"OK " if ok else "DIFF"}  csalt={cs}  csl={csl}')

    if a.csl_base:
        print(f'\n{mismatches} mismatch(es).')
        sys.exit(1 if mismatches else 0)


if __name__ == '__main__':
    main()
