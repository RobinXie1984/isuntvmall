#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { loadStoreProfile } from "../config/store-profile-loader.mjs";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultProfile = loadStoreProfile(path.join(repoRoot,'config/isuntvmall.json'));
const targetSchema = z.object({
 profileId:z.string(), workerName:z.string().regex(/^[a-z][a-z0-9-]{1,62}$/), accountId:z.string().regex(/^[a-f0-9]{32}$/), origin:z.string().url(), customDomain:z.boolean(), zoneId:z.string().regex(/^[a-f0-9]{32}$/).optional()
}).strict();
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateDeploymentTarget(profile,input){
 const target=targetSchema.parse(input);
 if(target.profileId!==profile.id||target.origin!==profile.origin)throw new Error('Deployment target does not match selected store profile and origin.');
 if(target.workerName!==profile.id&&!target.workerName.startsWith(`${profile.id}-`))throw new Error('Worker name must be namespaced by the store ID.');
 if(target.customDomain!==Boolean(target.zoneId))throw new Error('A custom domain requires exactly one zone ID; workers.dev targets must not carry a zone.');
 const hostname=new URL(profile.origin).hostname;
 const reserved=target.workerName==='isuntvmall'||hostname==='isuntvmall.com'||hostname.endsWith('.isuntvmall.com');
 if(reserved&&(profile.id!==defaultProfile.id||profile.name!==defaultProfile.name||profile.origin!==defaultProfile.origin))throw new Error('The iSunTVMall production target is reserved for its exact default identity.');
 return target;
}
export function makeStoreDeployment(profile,targetInput,projectRoot=repoRoot){
 const target=validateDeploymentTarget(profile,targetInput);
 const config={name:target.workerName,compatibility_date:'2026-09-23',compatibility_flags:['nodejs_compat'],main:'vinext/server/fetch-handler',assets:{directory:path.resolve(projectRoot,'dist/client'),not_found_handling:'none',binding:'ASSETS'},account_id:target.accountId,vars:{NEXT_PUBLIC_SITE_URL:profile.origin,BATCH_HELPER_ENABLED:'false'},workers_dev:!target.customDomain,routes:target.customDomain?[{pattern:`${new URL(profile.origin).hostname}/*`,zone_id:target.zoneId}]:[]};
 return {config,receipt:{schemaVersion:1,profileId:profile.id,profileSha256:digest(profile),workerName:target.workerName,origin:profile.origin,configSha256:digest(config),target}};
}
export function writeStoreDeployment({profilePath,targetPath,outputPath,projectRoot=repoRoot}){
 const profile=loadStoreProfile(profilePath);
 const prepared=makeStoreDeployment(profile,JSON.parse(fs.readFileSync(targetPath,'utf8')),projectRoot);
 const output=path.resolve(outputPath),receiptPath=`${output}.receipt.json`;
 if(fs.existsSync(output)||fs.existsSync(receiptPath))throw new Error('Output already exists; choose a new task-owned path.');
 fs.mkdirSync(path.dirname(output),{recursive:true,mode:0o700});
 fs.writeFileSync(output,JSON.stringify(prepared.config,null,2)+'\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(receiptPath,JSON.stringify(prepared.receipt,null,2)+'\n',{flag:'wx',mode:0o600});
 return {output,receiptPath,profileId:profile.id,workerName:prepared.config.name,profileSha256:prepared.receipt.profileSha256};
}
// Prevent a non-default build from silently inheriting the first store's routes.
export function resolveStoreDeploymentConfig(profile,file=process.env.STORE_DEPLOYMENT_CONFIG){
 if(!file){
  if(profile.id!==defaultProfile.id||profile.name!==defaultProfile.name||profile.origin!==defaultProfile.origin)throw new Error('An independent store requires STORE_DEPLOYMENT_CONFIG generated for its profile.');
  return undefined;
 }
 const filename=path.resolve(file),config=JSON.parse(fs.readFileSync(filename,'utf8')),receipt=JSON.parse(fs.readFileSync(`${filename}.receipt.json`,'utf8'));
 validateDeploymentTarget(profile,receipt.target);
 if(receipt.schemaVersion!==1||receipt.profileId!==profile.id||receipt.profileSha256!==digest(profile)||receipt.configSha256!==digest(config)||config.name!==receipt.workerName||config.vars?.NEXT_PUBLIC_SITE_URL!==profile.origin)throw new Error('Deployment configuration receipt does not match selected profile/configuration.');
 return filename;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);const values={};
  for(let index=0;index<args.length;index+=2){if(!['--profile','--target','--out'].includes(args[index])||!args[index+1]||args[index+1].startsWith('--'))throw new Error('Usage: prepare-store-deployment.mjs --profile profile.json --target target.json --out task/wrangler.json');if(values[args[index]])throw new Error('Duplicate argument.');values[args[index]]=args[index+1];}
  if(!values['--profile']||!values['--target']||!values['--out'])throw new Error('Profile, target and new output path are required.');
  console.log(JSON.stringify(writeStoreDeployment({profilePath:values['--profile'],targetPath:values['--target'],outputPath:values['--out']})));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
