# Contributing to relay

Thank you for your interest in contributing to relay! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd relay
   ```

2. Ensure you're on the latest `main` branch:
   ```bash
   git checkout main
   git pull origin main
   ```

## Development Setup

This project uses `uv` for dependency management and requires Python 3.12 or higher.

### Prerequisites

- Python 3.12+
- uv (Install from: https://github.com/astral-sh/uv)

### Setup Instructions

1. Create a virtual environment and install dependencies:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv sync
   ```

2. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

## How to Contribute

### Types of Contributions

- **Bug fixes**: Fix issues reported in the issue tracker
- **Features**: Implement new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Code quality**: Refactoring and performance improvements

### Workflow

1. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add user authentication endpoint"
   ```

5. **Push your branch** to the repository:
   ```bash
   git push origin your-branch-name
   ```

6. **Open a Pull Request** targeting `main` with a clear description of changes

## Coding Standards

### Python Style Guide

- Follow [PEP 8](https://pep8.org/) style guidelines
- Use type hints for all function signatures
- Maximum line length: 88 characters (Black default)
- Use meaningful variable and function names

### Code Formatting

We recommend using the following tools:

```bash
# Install development dependencies
uv pip install black ruff mypy pytest

# Format code
black .

# Lint code
ruff check .

# Type checking
mypy .
```

### Example Code Style

```python
from fastapi import FastAPI, HTTPException
from typing import Dict

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int) -> Dict[str, str]:
    """Retrieve user information by ID.
    
    Args:
        user_id: The unique identifier for the user
        
    Returns:
        Dictionary containing user information
        
    Raises:
        HTTPException: If user is not found
    """
    if user_id < 1:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return {"id": str(user_id), "status": "active"}
```

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_main.py
```

### Writing Tests

- Place tests in a `tests/` directory
- Name test files as `test_*.py`
- Use descriptive test function names
- Aim for high test coverage (>80%)

Example test:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass** and linting is clean
4. **Update CHANGELOG.md** (if applicable) with a note describing your changes
5. **Reference related issues** in your PR description (e.g., "Fixes #123")
6. **Wait for review** - maintainers will review your PR and may request changes
7. **Address feedback** - make requested changes and push updates
8. **Merge** - once approved, a maintainer will merge your PR

### PR Title Format

Use conventional commit format:

- `feat: add new feature`
- `fix: resolve bug in endpoint`
- `docs: update README`
- `test: add unit tests for authentication`
- `refactor: improve code structure`
- `chore: update dependencies`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
```

## Reporting Issues

### Before Creating an Issue

- Check if the issue already exists
- Verify the issue is reproducible
- Collect relevant information (error messages, logs, environment)

### Issue Template

When creating an issue, include:

1. **Clear title** describing the problem
2. **Description** with steps to reproduce
3. **Expected behavior** vs actual behavior
4. **Environment details** (Python version, OS, dependencies)
5. **Code snippets** or error messages (use code blocks)
6. **Screenshots** if applicable

### Example Issue

```markdown
**Title:** API returns 500 error on POST /users

**Description:**
When sending a POST request to /users with valid data, the API returns a 500 error.

**Steps to Reproduce:**
1. Start the server with `uvicorn main:app`
2. Send POST request: `curl -X POST http://localhost:8000/users -d '{"name": "test"}'`
3. Observe 500 error response

**Expected:** 201 Created with user object
**Actual:** 500 Internal Server Error

**Environment:**
- Python 3.12.1
- FastAPI 0.128.0
- macOS 14.0

**Error Log:**
```
[error traceback here]
```
```

## Questions?

If you have questions or need help, feel free to:
- Open an issue with the "question" label
- Reach out to maintainers
- Check existing documentation and issues

Thank you for contributing to relay! 🚀
