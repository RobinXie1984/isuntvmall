/** Encode manually reviewed source sections. Always produces preview-only films.
 * node scripts/prepare-product-films.mjs SPEC.json SOURCE_DIRECTORY NEW_OUTPUT_DIRECTORY
 * SPEC: [{id,brand,sourceUrl,file,sourceStart,seconds,crop:[width,height,x,y]}]
 * The source file is the already downloaded section, beginning at sourceStart.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [spec,source,output]=process.argv.slice(2);
if(!spec||!source||!output)throw Error('Provide spec, source directory and a NEW output directory.');
const jobs=JSON.parse(await readFile(spec,'utf8'));const out=resolve(output);
if(!Array.isArray(jobs)||!jobs.length)throw Error('No reviewed sections supplied.');
const ids=new Set();
for(const j of jobs){
 const u=new URL(j.sourceUrl);
 if(!/^[a-f0-9-]{36}$/.test(j.id)||ids.has(j.id)||!j.brand?.trim()||u.protocol!=='https:'||!['www.facebook.com','facebook.com','www.youtube.com','youtu.be'].includes(u.hostname)||u.username||u.password||u.port||!Number.isFinite(j.seconds)||j.seconds<=0||j.seconds>=60||!Number.isFinite(j.sourceStart)||j.sourceStart<0||basename(j.file)!==j.file||!j.file.endsWith('.mp4')||!Array.isArray(j.crop)||j.crop.length!==4||j.crop.some(n=>!Number.isInteger(n)||n<0)||j.crop[0]<2||j.crop[1]<2||j.crop[0]%2||j.crop[1]%2)throw Error('Invalid reviewed section.');
 ids.add(j.id);
}
await mkdir(out,{mode:0o700}); // Refuse an existing directory; never overwrite a previous edit.
const run=(tool,args)=>execFileSync(tool,['-hide_banner','-loglevel','error',...args],{stdio:['ignore','pipe','pipe'],timeout:120000});const manifest=[];
for(const j of jobs){
 const input=join(resolve(source),j.file),dest=join(out,j.id+'.mp4'),poster=join(out,j.id+'.jpg');
 const originalDigest=createHash('sha256').update(await readFile(input)).digest('hex');
 run('ffmpeg',['-i',input,'-t',String(j.seconds),'-map','0:v:0','-an','-sn','-dn','-map_metadata','-1','-vf',`crop=${j.crop.join(':')},setsar=1`,'-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-n',dest]);
 run('ffmpeg',['-ss',String(Math.min(1,j.seconds/2)),'-i',dest,'-frames:v','1','-n',poster]);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',dest],{encoding:'utf8'}));
 const duration=Number(probe.format.duration);
 if(probe.streams.length!==1||probe.streams[0].codec_type!=='video'||duration<=0||duration>=60)throw Error('Output verification failed.');
 const bytes=await readFile(dest);
 manifest.push({id:j.id,brand:j.brand,sourceUrl:j.sourceUrl,src:'/brand-clips/'+j.id+'.mp4',poster:'/brand-clips/'+j.id+'.jpg',seconds:duration,sourceStart:j.sourceStart,sourceEnd:j.sourceStart+j.seconds,crop:'crop='+j.crop.join(':'),width:probe.streams[0].width,height:probe.streams[0].height,sha256:createHash('sha256').update(bytes).digest('hex'),sourceSha256:originalDigest,bytes:bytes.length,audio:false,reviewState:'preview'});
}
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({films:manifest.length,reviewState:'preview',output:out}));
