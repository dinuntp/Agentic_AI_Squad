# Python Hello World Application

A minimal, production-ready Python Hello World application demonstrating
modular structure, input validation, and unit testing best practices.

---

## Overview

| File | Purpose |
|---|---|
| `main.py` | Application entry point — calls `greet()` and prints the result |
| `greet.py` | Reusable greeting module — owns all business logic |
| `test_greet.py` | Unit tests for `greet()` using Python's `unittest` framework |
| `requirements.txt` | Dependency manifest (standard library only) |

---

## Prerequisites

- Python **3.7 or later** (f-string and type hint support required)
- No third-party packages are required to **run** the application
- `pytest` is optional for running tests (see [Running Tests](#running-tests) below)

Verify your Python version:

