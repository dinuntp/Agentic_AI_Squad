"""
main.py — Entry point for the Hello World application.

Imports the `greet` function from the `greet` module and prints a greeting
to stdout. Run directly with:

    python main.py
"""

from greet import greet


def main() -> None:
    """Execute the Hello World application.

    Calls greet() with the name "World" and prints the resulting greeting
    string to stdout.

    Returns:
        None
    """
    message = greet("World")
    print(message)


if __name__ == "__main__":
    main()
