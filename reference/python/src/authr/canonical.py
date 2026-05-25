"""
Canonical JSON serialization for AuthR Records.

Implementations of AuthR MUST produce byte-identical canonical JSON across
languages, otherwise signatures will fail to verify across implementations.

This module provides a simple JCS-style canonicalizer (RFC 8785):
- Sort object keys lexicographically
- No insignificant whitespace
- UTF-8 encoding
- Standard escaping (no extra escapes)

For v0.1 we use Python's json module with sort_keys=True and minimal separators,
which produces JCS-compliant output for all data types AuthR uses (no floats
requiring number canonicalization in v0.1 — confidence is the only float field
and is expected to be a clean decimal).
"""

from __future__ import annotations

import json
from typing import Any


def canonicalize(obj: Any) -> bytes:
    """
    Serialize obj to canonical JSON bytes per JCS (RFC 8785, simplified).

    For v0.1, AuthR Records contain only strings, integers, lists, dicts,
    and a single float field (drift.confidence). The standard library json
    module with sort_keys=True and minimal separators is sufficient for
    cross-implementation byte-identity.

    A future version may switch to a full JCS implementation if floating-point
    canonicalization edge cases become relevant.
    """
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
