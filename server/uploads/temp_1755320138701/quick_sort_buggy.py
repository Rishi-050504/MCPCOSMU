def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    j = low
    while j < high:
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
        j += 1