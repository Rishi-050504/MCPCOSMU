# Intentional syntax and runtime errors for testing
import sys

def greet(name):
    if not isinstance(name, str):
        name = str(name)
    message = f"Hello, {name}"
    print(message)

if __name__ == "__main__":
    greet(42)  # <- type that's probably not expected
    print("This line will likely never run")