#!/usr/bin/env python3
"""Validate one TEI Lex-0 file against a pinned RNG using lxml (xmllint fallback).

Usage: python3 scripts/validate-tei-rng.py <schema.rng> <file.xml>

Exit 0 when valid, 1 with the RelaxNG error log when invalid, 2 when lxml is
unavailable. H7105 uses this for the full-MW chunk gate on boxes without
libxml2-utils; CI still uses xmllint via validate-tei-lex0-schema.mjs.
"""
import sys

try:
    from lxml import etree
except ImportError:
    sys.stderr.write("lxml is required: pip install lxml (or install libxml2-utils and use xmllint)\n")
    sys.exit(2)


def main():
    if len(sys.argv) != 3:
        sys.stderr.write(__doc__)
        return 2
    schema = etree.RelaxNG(etree.parse(sys.argv[1]))
    doc = etree.parse(sys.argv[2])
    if schema.validate(doc):
        print("PASS")
        return 0
    sys.stderr.write(str(schema.error_log))
    return 1


if __name__ == "__main__":
    sys.exit(main())
