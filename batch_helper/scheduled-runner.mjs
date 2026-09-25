import { mkdir, readFile, writeFile, rename, rm, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const args=process.argv.slice(2);const ci=args.indexOf('--config');
if(ci<0||!args[ci+1])throw new Error('Usage: node scheduled-runner.mjs --config /worker.config.json [--status]');
const configPath=path.resolve(args[ci+1]);const config=JSON.parse(await readFile(configPath,'utf8'));
if(config.name!=='isuntvmall-batch-worker'||!Number.isInteger(config.limit)||config.limit<1||config.limit>100||!Number.isInteger(config.maxSeconds)||config.maxSeconds<1||config.maxSeconds>300||!Number.isInteger(config.intervalSeconds)||config.intervalSeconds<config.maxSeconds+10||config.intervalSeconds>3600||!Number.isInteger(config.staleAfterSeconds)||config.staleAfterSeconds<config.intervalSeconds*2||config.staleAfterSeconds>86400||typeof config.stateDirectory!=='string')throw new Error('INVALID_RUNNER_CONFIG');
const statePath=path.resolve(path.dirname(configPath),config.stateDirectory);const statusPath=path.join(statePath,'status.json');
await mkdir(statePath,{recursive:true,mode:0o700});
async function readStatus(){try{return JSON.parse(await readFile(statusPath,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
if(args.includes('--status')){
 const status=await readStatus();const ageSeconds=status?Math.max(0,(Date.now()-Date.parse(status.updatedAt))/1000):null;
 const stale=ageSeconds===null||!Number.isFinite(ageSeconds)||ageSeconds>config.staleAfterSeconds;
 const verdict=stale?'UNKNOWN':status.running?'RUNNING':status.exitCode===0?'HEALTHY':'FAILED';
 console.log(JSON.stringify({name:config.name,verdict,ageSeconds,staleAfterSeconds:config.staleAfterSeconds,status}));
 if(!['RUNNING','HEALTHY'].includes(verdict))process.exitCode=1;
}else{
 const lockPath=path.join(statePath,'run.lock');
 try{await mkdir(lockPath,{mode:0o700});}catch(error){if(error.code==='EEXIST'){console.error(JSON.stringify({name:config.name,outcome:'LOCKED',message:'Another run or an unreconciled crash owns the lock; inspect status and process before recovery.'}));process.exit(2);}throw error;}
 const runId=randomUUID();const startedAt=new Date().toISOString();
 await writeFile(path.join(lockPath,'owner.json'),JSON.stringify({pid:process.pid,runId,startedAt}),{mode:0o600});
 let status={name:config.name,runId,pid:process.pid,startedAt,updatedAt:startedAt,running:true,exitCode:null};
 let writes=Promise.resolve();
 function save(){const snapshot=JSON.stringify(status,null,2);writes=writes.then(async()=>{await writeFile(statusPath+'.tmp',snapshot,{mode:0o600});await rename(statusPath+'.tmp',statusPath);});return writes;}
 let out='';let err='';let child;let timer;let heartbeat;
 try{
  await save();
  const worker=path.join(path.dirname(fileURLToPath(import.meta.url)),'worker.mjs');
  child=spawn(process.execPath,[worker,'--once','--limit',String(config.limit),'--max-seconds',String(config.maxSeconds)],{env:process.env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>{out=(out+data.toString()).slice(-65536);});
  child.stderr.on('data',data=>{err=(err+data.toString()).slice(-65536);});
  heartbeat=setInterval(()=>{status={...status,updatedAt:new Date().toISOString()};void save().catch(()=>child.kill('SIGTERM'));},10000);
  timer=setTimeout(()=>child.kill('SIGKILL'),(config.maxSeconds+8)*1000);
  const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
  const lines=out.trim().split('\n');let summary=null;try{summary=JSON.parse(lines.at(-1));}catch{/* Worker failed before a summary. */}
  status={...status,updatedAt:new Date().toISOString(),finishedAt:new Date().toISOString(),running:false,exitCode:result.code??1,signal:result.signal,summary,stderrTail:err.replace(/https?:\/\/\S+/g,'[url]').slice(-8000)};
  await save();if(result.code!==0)process.exitCode=1;
  console.log(JSON.stringify({name:config.name,runId,exitCode:status.exitCode,summary}));
 }catch(error){status={...status,updatedAt:new Date().toISOString(),finishedAt:new Date().toISOString(),running:false,exitCode:1,error:String(error.message).slice(0,500)};await save();process.exitCode=1;throw error;}
 finally{clearInterval(heartbeat);clearTimeout(timer);await writes;await rm(path.join(lockPath,'owner.json'));await rmdir(lockPath);}
}
