def add(a, b):
    return a + b
def sub(a, b):
    return a - b
def mul(a, b):
    return a * b
def div(a, b):
    if b == 0:
        raise ZeroDivisionError('b')
    return a / b
def pow_int(a, n):
    r = 1
    i = 0
    while i < n:
        r *= a
        i += 1
    return r
def factorial(n):
    if n < 0:
        raise ValueError('n')
    f = 1
    i = 2
    while i <= n:
        f *= i
        i += 1
    return f
def fib(n):
    if n < 0:
        raise ValueError('n')
    a, b = 0, 1
    i = 0
    while i < n:
        a, b = b, a + b
        i += 1
    return a
def mean(nums):
    s = 0
    k = 0
    for x in nums:
        s += x
        k += 1
    if k == 0:
        return 0
    return s / k
def median(nums):
    arr = list(nums)
    arr.sort()
    n = len(arr)
    if n == 0:
        return 0
    m = n // 2
    if n % 2 == 1:
        return arr[m]
    else:
        return (arr[m-1] + arr[m]) / 2
def variance(nums):
    m = mean(nums)
    s = 0
    k = 0
    for x in nums:
        d = x - m
        s += d * d
        k += 1
    if k == 0:
        return 0
    return s / k
def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a
def lcm(a, b):
    return abs(a*b) // gcd(a, b)
def clamp(x, lo, hi):
    if x < lo:
        return lo
    if x > hi:
        return hi
    return x
def triangle_area(b, h):
    return 0.5 * b * h
def rectangle_area(w, h):
    return w * h
def circle_area(r):
    from math import pi
    return pi * r * r
def newton_sqrt(x, iters):
    g = x
    i = 0
    while i < iters:
        g = 0.5 * (g + x / g)
        i += 1
    return g
def buggy_sum_to_n(n):
    s = 0
    i = 1
    while i <= n:
        s += i
        i += 2
    return s
def main():