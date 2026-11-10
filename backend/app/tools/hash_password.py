"""CLI tool: generate argon2id password hash.

Usage: python -m app.tools.hash_password
"""

import sys
import getpass


def main():
    try:
        from argon2 import PasswordHasher
        ph = PasswordHasher()
    except ImportError:
        print("Error: argon2-cffi not installed. Run: pip install argon2-cffi")
        sys.exit(1)

    password = getpass.getpass("Enter password to hash: ")
    if not password:
        print("Error: empty password")
        sys.exit(1)

    hashed = ph.hash(password)
    print(f"\nHash: {hashed}")
    print("\nSet this as ADMIN_PASSWORD_HASH in your .env file.")


if __name__ == "__main__":
    main()
