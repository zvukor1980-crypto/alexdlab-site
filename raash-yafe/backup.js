/* Ra'ash Yafe library backup: lossless ZIP, all images/audio/video, no third-party code. */
(function(){
'use strict';
const te=new TextEncoder(),td=new TextDecoder();
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let x=n;for(let k=0;k<8;k++)x=(x&1)?0xedb88320^(x>>>1):(x>>>1);table[n]=x>>>0;}
async function crc(blob){
 let c=0xffffffff;
 for(let at=0;at<blob.size;at+=1024*1024){
  const bytes=new Uint8Array(await blob.slice(at,at+1024*1024).arrayBuffer());
  for(let i=0;i<bytes.length;i++)c=table[(c^bytes[i])&255]^(c>>>8);
 }
 return (c^0xffffffff)>>>0;
}
function w16(v,o,x){v.setUint16(o,x,true)}
function w32(v,o,x){v.setUint32(o,x>>>0,true)}
function blobOf(data){return data instanceof Blob?data:new Blob([data],{type:'application/octet-stream'})}
async function pack(items,onProgress){
 if(items.length>65535)throw Error('Слишком много файлов для ZIP');
 const out=[],centre=[];
 let pos=0;
 for(let i=0;i<items.length;i++){
  const item=items[i], name=te.encode(item.name),data=blobOf(item.data);
  if(name.length>65535||data.size>0xffffffff)throw Error('Файл слишком велик для ZIP');
  if(pos+30+name.length+data.size>0xffffffff)throw Error('Архив больше 4 ГБ');
  const hash=await crc(data),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
  w32(h,0,0x04034b50);w16(h,4,20);w16(h,6,0x800);w16(h,8,0);
  w32(h,14,hash);w32(h,18,data.size);w32(h,22,data.size);w16(h,26,name.length);
  header.set(name,30);out.push(header,data);
  centre.push({name,hash,size:data.size,pos});
  pos+=header.length+data.size;
  if(onProgress)onProgress(i+1,items.length);
 }
 const centralOffset=pos;
 for(const x of centre){
  const b=new Uint8Array(46+x.name.length),v=new DataView(b.buffer);
  w32(v,0,0x02014b50);w16(v,4,20);w16(v,6,20);w16(v,8,0x800);
  w32(v,16,x.hash);w32(v,20,x.size);w32(v,24,x.size);
  w16(v,28,x.name.length);w32(v,42,x.pos);
  b.set(x.name,46);out.push(b);pos+=b.length;
 }
 if(pos>0xffffffff)throw Error('Архив слишком велик');
 const end=new Uint8Array(22),v=new DataView(end.buffer);
 w32(v,0,0x06054b50);w16(v,8,centre.length);w16(v,10,centre.length);
 w32(v,12,pos-centralOffset);w32(v,16,centralOffset);out.push(end);
 return new Blob(out,{type:'application/zip'});
}
async function unpack(file){
 const entries=new Map();let pos=0;let count=0;
 while(pos+4<=file.size){
  const prefix=new DataView(await file.slice(pos,pos+4).arrayBuffer());
  const signature=prefix.getUint32(0,true);
  if(signature===0x02014b50||signature===0x06054b50)break;
  if(signature!==0x04034b50||pos+30>file.size)throw Error('Неправильный формат ZIP');
  const h=new DataView(await file.slice(pos,pos+30).arrayBuffer());
  const flags=h.getUint16(6,true),method=h.getUint16(8,true);
  const size=h.getUint32(18,true),uncompressed=h.getUint32(22,true);
  const nameLen=h.getUint16(26,true),extraLen=h.getUint16(28,true);
  if(method!==0||(flags&8)||size!==uncompressed)throw Error('Используй ZIP, созданный приложением רעש יפה');
  const dataStart=pos+30+nameLen+extraLen;
  if(dataStart+size>file.size||++count>5000)throw Error('Повреждённый архив');
  const name=td.decode(await file.slice(pos+30,pos+30+nameLen).arrayBuffer());
  if(entries.has(name))throw Error('Повтор файла в архиве');
  entries.set(name,file.slice(dataStart,dataStart+size));
  pos=dataStart+size;
 }
 return entries;
}
function keysFrom(library){
 const keys=new Set();
 for(const album of library.albums||[]){
  for(const key of [album.coverKey,album.backKey])if(typeof key==='string')keys.add(key);
  for(const track of album.tracks||[]){
   if(typeof track.videoKey==='string')keys.add(track.videoKey);
   for(const variant of track.variants||[])if(typeof variant.fileKey==='string')keys.add(variant.fileKey);
  }
 }
 return [...keys];
}
function validLibrary(lib){
 return Boolean(lib&&Array.isArray(lib.albums)&&lib.albums.length>0&&lib.albums.length<500&&lib.albums.every(a=>a&&typeof a.id==='string'&&typeof a.name==='string'&&Array.isArray(a.tracks)&&a.tracks.length<2000&&a.tracks.every(t=>t&&typeof t.id==='string'&&typeof t.name==='string'&&Array.isArray(t.variants)&&t.variants.length>=2)));
}
async function exportAll(library,read,onProgress){
 if(!validLibrary(library))throw Error('Ошибка структуры альбомов');
 const list=keysFrom(library),files=[],absent=[];
 for(let i=0;i<list.length;i++){
  const key=list[i];let b;
  try{b=await read(key)}catch(e){b=null}
  if(b instanceof Blob)files.push({key,name:'media/'+String(files.length+1).padStart(5,'0')+'.bin',type:b.type||'application/octet-stream',originalName:b.name||'',size:b.size,data:b});
  else absent.push(key);
  if(onProgress)onProgress('Поиск файлов: '+(i+1)+'/'+list.length);
 }
 const manifest={format:'raash-yafe-full-backup',version:2,createdAt:new Date().toISOString(),library:JSON.parse(JSON.stringify(library)),assets:files.map(f=>({key:f.key,name:f.name,type:f.type,originalName:f.originalName,size:f.size})),missing:absent};
 const entries=[{name:'library.json',data:new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})},...files.map(f=>({name:f.name,data:f.data}))];
 const archive=await pack(entries,(a,b)=>{if(onProgress)onProgress('Архивирование: '+a+'/'+b)});
 return {archive,fileCount:files.length,missing:absent,totalSize:archive.size};
}
async function restoreAll(file,write,onProgress){
 if(!(file instanceof Blob)||file.size<35)throw Error('Выбери ZIP-архив приложения');
 const entries=await unpack(file);
 const info=entries.get('library.json');
 if(!info)throw Error('Нет library.json в архиве');
 let manifest;
 try{manifest=JSON.parse(await info.text())}catch(e){throw Error('Не читается список песен')}
 if(manifest?.format!=='raash-yafe-full-backup'||manifest?.version!==2||!validLibrary(manifest.library)||!Array.isArray(manifest.assets))throw Error('Это не полная копия רעש יפה');
 const archiveLibrary=manifest.library;
 const missing=new Set(manifest.missing||[]);
 const map=new Map(),stamp=Date.now().toString(36);
 let restored=0;
 for(let i=0;i<manifest.assets.length;i++){
  const asset=manifest.assets[i],data=entries.get(asset.name);
  if(!asset||typeof asset.key!=='string'||!/^media\/\d{5}\.bin$/.test(asset.name)||!data||asset.size!==data.size)throw Error('В архиве не хватает медиафайла '+(i+1));
  const key='restore:'+stamp+':'+i;
  await write(key,new File([data],asset.originalName||'media-'+i,{type:asset.type||'application/octet-stream'}));
  map.set(asset.key,key);restored++;
  if(onProgress)onProgress('Восстановлено: '+restored+'/'+manifest.assets.length);
 }
 const replace=k=>!k?null:map.get(k)||null;
 for(const a of archiveLibrary.albums){
  a.coverKey=replace(a.coverKey);a.backKey=replace(a.backKey);
  for(const t of a.tracks){t.videoKey=replace(t.videoKey);for(const v of t.variants)v.fileKey=replace(v.fileKey)}
 }
 if(!archiveLibrary.albums.some(x=>x.id===archiveLibrary.current))archiveLibrary.current=archiveLibrary.albums[0].id;
 return {library:archiveLibrary,restored,missingCount:missing.size};
}
window.RaashBackup={exportAll,restoreAll};
})();