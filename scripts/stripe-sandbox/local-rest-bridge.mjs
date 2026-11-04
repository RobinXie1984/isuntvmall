// Test transport only. No production secrets, no SSH forwarding or Studio -> iMac control.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
const remote=process.env.STRIPE_FIXTURE_REMOTE||'/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261102-stripe-sandbox/source/scripts/stripe-sandbox/studio-rest.py';
if(!/^\/Users\/headlessnick\/RobinOS2\/12_ventures\/isuntvmall\/candidates\/[a-zA-Z0-9_-]+\/(source\/)?scripts\/stripe-sandbox\/studio-rest.py$/.test(remote))throw Error('Invalid fixture path');
createServer(async(req,res)=>{
 if(!req.url.startsWith('/rest/v1/')){res.writeHead(404).end();return;}
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>65536){res.writeHead(413).end();return;}chunks.push(chunk);}
 const child=spawn('/usr/bin/ssh',['-T','-o','BatchMode=yes','-o','ClearAllForwardings=yes','192.168.68.59',`/usr/bin/python3 ${remote}`]);
 let out='';child.stdout.on('data',b=>{out+=b;});child.stderr.resume();
 const timer=setTimeout(()=>child.kill('SIGTERM'),20000);
 child.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();const data=JSON.parse(out);delete data.headers['Transfer-Encoding'];delete data.headers['Content-Length'];res.writeHead(data.status,data.headers).end(Buffer.from(data.body,'base64'));}catch{res.writeHead(502).end('Fixture database unavailable');}});
 child.stdin.end(JSON.stringify({method:req.method,path:req.url,headers:req.headers,body:Buffer.concat(chunks).toString('base64')}));
}).listen(54331,'127.0.0.1',()=>console.log('Fixture REST bridge listening on 127.0.0.1:54331'));
