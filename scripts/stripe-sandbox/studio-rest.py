# Invoked only over the existing hardened iMac -> Studio SSH session.
# Carries synthetic fixture requests to an owner-only PostgREST Unix socket.
import json, sys, socket, http.client, base64
req=json.load(sys.stdin)
assert req['path'].startswith('/rest/v1/') and '\r' not in req['path'] and '\n' not in req['path']
assert req['method'] in ('GET','POST','PATCH','HEAD')
class LocalConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
        self.sock.settimeout(15)
        self.sock.connect('/private/tmp/isuntvmall-stripe-20261102/postgrest.sock')
conn=LocalConnection('localhost')
headers={k:v for k,v in req['headers'].items() if k.lower() in ('content-type','accept','prefer','range','range-unit','accept-profile','content-profile')}
conn.request(req['method'],req['path'][8:],base64.b64decode(req['body']),headers)
res=conn.getresponse()
print(json.dumps({'status':res.status,'headers':dict(res.getheaders()),'body':base64.b64encode(res.read()).decode()}))
