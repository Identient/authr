"""
AuthR exception hierarchy.

All AuthR errors inherit from AuthRError. Specific subclasses identify which
of the six invariants was violated (or other failure modes).
"""


class AuthRError(Exception):
    """Base class for all AuthR errors."""


class SignatureError(AuthRError):
    """Invariant 1: signature does not validate or kid is not in trust store."""


class ExpiredError(AuthRError):
    """Invariant 2: record's expires_at has passed."""


class AuthorDriftError(AuthRError):
    """Invariant 3: author.id is not stable across the chain."""


class ScopeWidenedError(AuthRError):
    """Invariant 4: child scope is not a strict subset of parent scope."""


class ChainBrokenError(AuthRError):
    """Invariant 5: chain continuity or correlation_id consistency violated."""


class RevokedError(AuthRError):
    """Invariant 6: record has been revoked."""


class DelegationDepthExceededError(AuthRError):
    """Extend operation would exceed max_delegation_depth."""


class GroundingError(AuthRError):
    """Author is not properly grounded (e.g., missing or invalid evidence)."""
