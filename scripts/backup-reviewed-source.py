#!/usr/bin/env python3
"""Prepare an allowlisted source/media ZIP; never upload or remove originals.
Usage: python3 scripts/backup-reviewed-source.py --repo PROJECT --out NEW.zip
The monthly backup agent uploads it privately and verifies cloud readback.
"""
import argparse, base64, datetime, hashlib, json, os, re, shutil, subprocess, tempfile, zipfile
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--repo',required=True);parser.add_argument('--out',required=True);args=parser.parse_args()
repo=Path(args.repo).resolve();out=Path(args.out).resolve();policy=json.loads((repo/'docs/backups/allowlist.json').read_text());commit=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
if out.exists() or Path(str(out)+'.partial').exists():raise SystemExit('HOLD: output already exists; use a new dated name.')
paths=subprocess.check_output(['git','-C',str(repo),'ls-tree','-r','--name-only',commit],text=True).splitlines()
for name in paths:
 p=Path(name)
 if p.name in ['.dev.vars','.env','id_rsa','id_ed25519'] or (p.name.startswith('.env.') and not p.name.endswith('.example')) or p.suffix in ['.p12','.key']:
  raise SystemExit('HOLD: credential-like tracked path: '+name)
extras={};missing=[]
for entry in policy['reviewedArtifacts']:
 root=(repo/entry['root']).resolve()
 if not root.is_relative_to(repo):raise SystemExit('HOLD: artifact root outside project.')
 for pattern in entry['include']:
  matches=list(root.glob(pattern))
  if not matches:missing.append(entry['root']+'/'+pattern)
  for path in matches:
   if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(repo):raise SystemExit('HOLD: unsafe artifact path.')
   extras['reviewed-artifacts/'+str(path.relative_to(repo))]=path
sizes=subprocess.check_output(['git','-C',str(repo),'ls-tree','-r','-l',commit],text=True).splitlines();estimated=sum(int(line.split()[3]) for line in sizes if line.split()[3].isdigit())+sum(p.stat().st_size for p in extras.values())
if estimated>512*1024**2:raise SystemExit('HOLD: package exceeds 512 MiB; classify large artifacts separately.')
out.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
if shutil.disk_usage(out.parent).free<estimated*3+10*1024**3:raise SystemExit('HOLD: preserve 10 GiB free plus three times staging size.')
partial=Path(str(out)+'.partial');subprocess.run(['git','-C',str(repo),'archive','--format=zip','--prefix=source/','--output='+str(partial),commit],check=True);os.chmod(partial,0o600)
secret=re.compile(rb'(?:[sr]k_(?:live|test)_[A-Za-z0-9]{24,}|whsec_[A-Za-z0-9]{24,}|sb_secret_[A-Za-z0-9_-]{32,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
with zipfile.ZipFile(partial,'a',compression=zipfile.ZIP_DEFLATED) as z:
 for name,path in sorted(extras.items()):z.write(path,name)
 ledger=[]
 for item in z.infolist():
  if item.is_dir():continue
  if Path(item.filename).is_absolute() or '..'in Path(item.filename).parts:raise SystemExit('HOLD: unsafe archive member.')
  h=hashlib.sha256()
  with z.open(item) as f:
   for block in iter(lambda:f.read(1024**2),b''):h.update(block)
  if Path(item.filename).suffix.lower() in ['.txt','.md','.json','.js','.mjs','.ts','.tsx','.py','.toml','.yaml','.yml'] or Path(item.filename).name.startswith('.env'):
   data=z.read(item)
   if secret.search(data):raise SystemExit('HOLD: potential credential in '+item.filename)
   for token in re.findall(rb'eyJ[\w-]+\.[\w-]+\.[\w-]+',data):
    try:claims=json.loads(base64.urlsafe_b64decode(token.split(b'.')[1]+b'==='))
    except Exception:continue
    if claims.get('role')=='service_role':raise SystemExit('HOLD: privileged JWT in '+item.filename)
  ledger.append({'path':item.filename,'bytes':item.file_size,'sha256':h.hexdigest()})
 manifest={'project':policy['project'],'sourceCommit':commit,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':ledger,'fileCount':len(ledger),'bytes':sum(v['bytes']for v in ledger),'exclusions':policy['excluded'],'missingAllowlistedArtifacts':missing,'scope':'Reviewed source and allowlisted media; no production database or credential recovery','cloudReadback':'UNKNOWN'}
 z.writestr('BACKUP-MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
 z.writestr('RESTORE.txt','Extract into a NEW empty directory. Verify every BACKUP-MANIFEST.json file SHA-256 and byte count. source/ contains the reviewed Git source snapshot; configure dependencies and runtime credentials separately. reviewed-artifacts/ retains the allowlisted media/provenance. Do not overwrite an active project, deploy, enable payments, delete originals, or infer full database/credential recovery from this package.\n')
with tempfile.TemporaryDirectory(prefix='isuntvmall-restore-',dir=out.parent) as directory:
 with zipfile.ZipFile(partial) as z:z.extractall(directory)
 for item in ledger:
  p=Path(directory)/item['path'];assert p.stat().st_size==item['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
partial.rename(out);receipt={'archive':str(out),'archiveBytes':out.stat().st_size,'archiveSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'sourceCommit':commit,'fileCount':len(ledger),'localRestoreVerified':True,'missingAllowlistedArtifacts':missing,'cloudReadback':'UNKNOWN'}
Path(str(out)+'.receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
