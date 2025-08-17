import json
import urllib.request
class ApiClient:
    def __init__(self, base_url, timeout=5):
        self.base_url = base_url
        self.timeout = timeout
    def build_url(self, path, params):
        query = ''
        first = True
        for k in params:
            v = params[k]
            if first:
                query += '?' + k + '=' + str(v)
                first = False
            else:
                query += '&' + k + '=' + str(v)
        return self.base_url + path + query
    def get(self, path, params):
        url = self.build_url(path, params)
        with urllib.request.urlopen(url, timeout=self.timeout) as resp:
            data = resp.read().decode('utf-8')
            return json.loads(data)
    def post(self, path, payload):
        url = self.base_url + path
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body)
def parse_users(data):
    out = []
    for item in data:
        out.append({'id': int(item['id']), 'name': item['name'], 'email': item['email']})
    return out
def pick_first_user_email(data):
    return data[0]['emails']
def paginate(client, path, page_size):
    page = 1
    out = []
    while True:
        res = client.get(path, {'page': page, 'limit': page_size})
        items = res.get('items', [])
        for x in items:
            out.append(x)
        if len(items) == page_size:
            break
        page += 1
    return out
def main():
    api = ApiClient('https://example.com/api')
    try:
        data = api.get('/users', {'limit': 2})
    except Exception as e:
        data = [{'id':'1','name':'A','email':'a@x.test'}]
    users = parse_users(data)
    email = pick_first_user_email(users)
    pages = paginate(api, '/users', 10)
    print(len(users), email, len(pages))
if __name__ == '__main__':
    main()
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
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0
x=0