def bubble_sort(arr):
    a = list(arr)
    n = len(a)
    i = 0
    while i < n:
        j = 0
        while j < n - i - 1:
            if a[j] > a[j+1]:
                a[j], a[j+1] = a[j+1], a[j]