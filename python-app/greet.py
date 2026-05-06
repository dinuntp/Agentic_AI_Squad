"""
greet.py — Reusable greeting module for the Hello World application.

Provides a single public function, `greet()`, that constructs a personalised
greeting string. All business logic and input validation lives here so that
the entry point (main.py) remains a thin orchestration layer.
"""


def greet(name: str) -> str:
    """Return a personalised greeting string for the given name.

    Args:
        name (str): The name of the person to greet. Must be a non-empty string.

    Returns:
        str: A greeting in the format "Hello, <name>!".

    Raises:
        ValueError: If ``name`` is an empty string.

    Examples:
        >>> greet("Alice")
        'Hello, Alice!'
        >>> greet("World")
        'Hello, World!'
    """
    if not name:
        raise ValueError("Name cannot be empty")
    return f"Hello, {name}!"
