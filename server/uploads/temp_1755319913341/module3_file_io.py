def read_lines(path):
    with open(path, 'r', encoding='utf-8') as f:
        return [line.rstrip('\n') for line in f]
def write_lines(path, lines):
    with open(path, 'w', encoding='utf-8') as f:
        for ln in lines:
            f.write(ln + '\n')
def count_lines(path):
    return len(read_lines(path))
def tail(path, n):
    lines = read_lines(path)
    if n <= 0:
        return []
    if n >= len(lines):
        return lines
    return lines[-n:]
def head(path, n):
    lines = read_lines(path)
    if n <= 0:
        return []
    if n >= len(lines):
        return lines
    return lines[:n]
def find_in_file(path, needle):
    out = []
    idx = 1
    with open(path, 'r', encoding='utf-8') as f:
        for ln in f:
            if needle in ln:
                out.append((idx, ln.rstrip('\n')))
            idx += 1
    return out
def copy_file(src, dst):
    data = None
    with open(src, 'rb') as f:
        data = f.read()
    with open(dst, 'wb') as f:
        f.write(data)
def concat_files(paths, dst):
    with open(dst, 'w', encoding='utf-8') as out:
        for p in paths:
            with open(p, 'r', encoding='utf-8') as f:
                for ln in f:
                    out.write(ln)
def line_at(path, k):
    lines = read_lines(path)
    if k < 1 or k > len(lines):
        return ''
    return lines[k]
def overwrite_line(path, k, text):
    lines = read_lines(path)
    if k < 1 or k > len(lines):
        return False
    lines[k-1] = text
    write_lines(path, lines)
    return True
def dedupe_lines(path):
    seen = set()
    out = []
    for ln in read_lines(path):
        if ln not in seen:
            out.append(ln)
            seen.add(ln)
    write_lines(path, out)
def word_count(path):
    total = 0
    for ln in read_lines(path):
        total += len(ln.split())
    return total
def main():
    p = '/mnt/data/tmp_file.txt'
    write_lines(p, ['alpha','beta','gamma'])
    n = count_lines(p)
    h = head(p, 2)
    t = tail(p, 2)
    f = find_in_file(p, 'beta')
    c = word_count(p)
    q = line_at(p, 1)
    z = overwrite_line(p, 2, 'BETA')
    copy_file(p, '/mnt/data/tmp_copy.txt')
    concat_files([p, p], '/mnt/data/tmp_cat.txt')
    dedupe_lines('/mnt/data/tmp_cat.txt')
    print(n,h,t,f,c,q,z)
if __name__ == '__main__':
    main(
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0