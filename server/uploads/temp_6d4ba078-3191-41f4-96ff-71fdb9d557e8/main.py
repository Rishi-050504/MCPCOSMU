# Intentional syntax and runtime errors for testing
import sys

def greet(name)  # <- missing colon (syntax error)
    message = f"Hello, {name}"
    print(mesage)  # <- misspelled variable (NameError)

if __name__ == "__main__":
    greet(42)  # <- type that's probably not expected
    print("This line will likely never run")
