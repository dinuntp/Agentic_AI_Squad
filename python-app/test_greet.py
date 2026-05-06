"""
test_greet.py — Unit tests for the greet module.

Run with unittest:
    python -m unittest test_greet

Run with pytest:
    python -m pytest test_greet.py -v
"""

import unittest

from greet import greet


class TestGreet(unittest.TestCase):
    """Unit tests for the greet() function in greet.py."""

    def test_greet_returns_correct_string(self):
        """greet('Alice') should return the string 'Hello, Alice!'."""
        result = greet("Alice")
        self.assertEqual(result, "Hello, Alice!")

    def test_greet_with_world(self):
        """greet('World') should return the string 'Hello, World!'."""
        result = greet("World")
        self.assertEqual(result, "Hello, World!")

    def test_greet_empty_string_raises_value_error(self):
        """greet('') should raise a ValueError."""
        with self.assertRaises(ValueError):
            greet("")

    def test_greet_value_error_message(self):
        """greet('') should raise ValueError with message 'Name cannot be empty'."""
        with self.assertRaises(ValueError) as context:
            greet("")
        self.assertEqual(str(context.exception), "Name cannot be empty")

    def test_greet_returns_string_type(self):
        """greet() should always return a str instance."""
        result = greet("Bob")
        self.assertIsInstance(result, str)

    def test_greet_with_single_character_name(self):
        """greet() should work correctly with a single-character name."""
        result = greet("A")
        self.assertEqual(result, "Hello, A!")

    def test_greet_with_name_containing_spaces(self):
        """greet() should handle names that contain spaces (e.g. full names)."""
        result = greet("John Doe")
        self.assertEqual(result, "Hello, John Doe!")

    def test_greet_with_numeric_string_name(self):
        """greet() should accept numeric strings as valid non-empty names."""
        result = greet("42")
        self.assertEqual(result, "Hello, 42!")


if __name__ == "__main__":
    unittest.main()
