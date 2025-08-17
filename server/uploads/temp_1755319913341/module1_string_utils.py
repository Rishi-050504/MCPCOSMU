def join_with_and(items):
    n = len(items)
    if n == 0:
        return ''
    if n == 1:
        return str(items[0])
    return ', '.join(str(x) for x in items[:-1]) + ' and ' + str(items[-1])
def bug_demo(a, b):
    return a + b