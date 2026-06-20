#!/usr/bin/env python3
"""Compare the Phase-1 CSL Salt MW endpoint with C-SALT for a small headword set.

This is a deploy/parity helper for csl-apidev's Salt API Phase 1 handoff. It uses
only the Python standard library so it can run on Jim's host or any reviewer
machine without installing dependencies.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass


DEFAULT_HEADWORDS = ["agni", "indra", "ka", "aMSa", "BU"]
DEFAULT_CSL_BASE = "https://sanskrit-lexicon.uni-koeln.de"
DEFAULT_CSALT_BASE = "https://api.c-salt.uni-koeln.de"


@dataclass
class EndpointResult:
    ok: bool
    url: str
    status: int | None
    error: str | None
    entries: list[dict]


def fetch_entries(base: str, headword: str, timeout: int) -> EndpointResult:
    params = urllib.parse.urlencode(
        {
            "field": "headword_slp1",
            "query": headword,
            "query_type": "term",
            "size": "50",
        }
    )
    url = f"{base.rstrip('/')}/dicts/mw/restful/entries?{params}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 - stdlib helper, report all endpoint failures
        return EndpointResult(False, url, None, str(exc), [])
    entries = payload.get("data", {}).get("entries", [])
    return EndpointResult(True, url, status, None, entries)


def ids(entries: list[dict]) -> list[str]:
    return [entry.get("id", "") for entry in entries]


def headwords(entries: list[dict]) -> list[str]:
    return [entry.get("headword_slp1", entry.get("headwordSlp1", "")) for entry in entries]


def compare_headword(headword: str, csl: EndpointResult, csalt: EndpointResult) -> dict:
    return {
        "headword": headword,
        "csl_ok": csl.ok,
        "csalt_ok": csalt.ok,
        "csl_status": csl.status,
        "csalt_status": csalt.status,
        "csl_count": len(csl.entries),
        "csalt_count": len(csalt.entries),
        "csl_ids": ids(csl.entries),
        "csalt_ids": ids(csalt.entries),
        "csl_headwords": headwords(csl.entries),
        "csalt_headwords": headwords(csalt.entries),
        "count_match": csl.ok and csalt.ok and len(csl.entries) == len(csalt.entries),
        "ids_match": csl.ok and csalt.ok and ids(csl.entries) == ids(csalt.entries),
        "headwords_match": csl.ok and csalt.ok and headwords(csl.entries) == headwords(csalt.entries),
        "csl_error": csl.error,
        "csalt_error": csalt.error,
        "csl_url": csl.url,
        "csalt_url": csalt.url,
    }


def render_markdown(rows: list[dict]) -> str:
    out = [
        "# MW Salt Parity",
        "",
        "| headword | CSL count | C-SALT count | count | ids | headwords |",
        "|---|---:|---:|---|---|---|",
    ]
    for row in rows:
        out.append(
            "| {headword} | {csl_count} | {csalt_count} | {count} | {ids} | {headwords} |".format(
                headword=row["headword"],
                csl_count=row["csl_count"],
                csalt_count=row["csalt_count"],
                count="ok" if row["count_match"] else "diff",
                ids="ok" if row["ids_match"] else "diff",
                headwords="ok" if row["headwords_match"] else "diff",
            )
        )
    out.append("")
    out.append("## Divergences")
    for row in rows:
        if row["count_match"] and row["ids_match"] and row["headwords_match"]:
            continue
        out.append("")
        out.append(f"### {row['headword']}")
        if row["csl_error"] or row["csalt_error"]:
            out.append(f"- CSL error: {row['csl_error']}")
            out.append(f"- C-SALT error: {row['csalt_error']}")
        out.append(f"- CSL ids: `{row['csl_ids']}`")
        out.append(f"- C-SALT ids: `{row['csalt_ids']}`")
        out.append(f"- CSL headwords: `{row['csl_headwords']}`")
        out.append(f"- C-SALT headwords: `{row['csalt_headwords']}`")
    return "\n".join(out) + "\n"


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csl-base", default=DEFAULT_CSL_BASE)
    parser.add_argument("--csalt-base", default=DEFAULT_CSALT_BASE)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of Markdown.")
    parser.add_argument("headwords", nargs="*", default=DEFAULT_HEADWORDS)
    args = parser.parse_args(argv)

    rows = []
    for headword in args.headwords:
        csl = fetch_entries(args.csl_base, headword, args.timeout)
        csalt = fetch_entries(args.csalt_base, headword, args.timeout)
        rows.append(compare_headword(headword, csl, csalt))

    if args.json:
        print(json.dumps({"comparisons": rows}, indent=2, ensure_ascii=False))
    else:
        print(render_markdown(rows), end="")
    return 0 if all(row["count_match"] and row["ids_match"] and row["headwords_match"] for row in rows) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
