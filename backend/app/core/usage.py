"""
In-memory feature usage counter.

Tracks how many times each API endpoint path has been hit since the server
started.  Admin endpoints can read this to identify the most-used features.
"""
from collections import Counter

_counters: Counter = Counter()


def record_hit(path: str) -> None:
    """Increment the hit count for a given endpoint path."""
    _counters[path] += 1


def get_usage() -> dict[str, int]:
    """Return a snapshot sorted by hit count descending."""
    return dict(_counters.most_common())


def reset() -> None:
    """Reset all counters (useful in tests)."""
    _counters.clear()
