#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const Ajv=require('ajv'),rough=require('roughjs');
const {Resvg}=require('@resvg/resvg-js');
const ffmpeg=require('ffmpeg-static'),ffprobe=require('ffprobe-static').path;
const ROOT=__dirname, MANIFEST=path.join(ROOT,'assets','manifest.json'), FONT=path.join(ROOT,'fonts','NotoSansCJK-Regular.ttc');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const clamp=x=>Math.max(0,Math.min(1,x));
function validate(scene){
 const schema=JSON.parse(fs.readFileSync(path.join(ROOT,'schema.json'))), ajv=new Ajv({allErrors:true,strict:false});
 if(!ajv.validate(schema,scene)) throw Error('SCHEMA_INVALID '+ajv.errorsText(ajv.errors));
 const ids=new Set(), assets=JSON.parse(fs.readFileSync(MANIFEST)).assets, amap=new Map(assets.map(a=>[a.asset_id,a]));
 for(const o of scene.objects){
  if(ids.has(o.id)) throw Error('DUPLICATE_ID '+o.id); ids.add(o.id);
  if(o.start+o.duration>scene.canvas.duration+1e-9) throw Error('TIMING_INVALID '+o.id);
  if(o.type==='TEXT'&&!o.text) throw Error('TEXT_REQUIRED '+o.id);
  if(['LINE','ARROW'].includes(o.type)&&(!o.from||!o.to)) throw Error('POINTS_REQUIRED '+o.id);
  if(['BOX','ELLIPSE'].includes(o.type)&&(!o.width||!o.height)) throw Error('SIZE_REQUIRED '+o.id);
  if(o.type==='CIRCLE'&&!o.radius) throw Error('RADIUS_REQUIRED '+o.id);
  if(['ICON','SVG'].includes(o.type)){ if(!amap.has(o.asset_id)) throw Error('ASSET_NOT_FOUND '+o.asset_id); safeSvg(path.join(ROOT,amap.get(o.asset_id).filename)); }
 }
 if(!fs.existsSync(FONT)) throw Error('CHINESE_FONT_MISSING'); return {assets,amap};
}
function safeSvg(p){const s=fs.readFileSync(p,'utf8'); const withoutXmlns=s.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i,''); const bad=/<\s*(script|foreignObject|image|filter|style|animate)|\bon[a-z]+\s*=|(?:href|xlink:href|src)\s*=|url\s*\(|data:/i; if(bad.test(withoutXmlns)) throw Error('SVG_UNSAFE '+p); return s;}
function paths(drawable,progress){const gen=rough.generator(); return gen.toPaths(drawable).map(p=>`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth||2}" fill="${p.fill||'none'}" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100*(1-progress)}"/>`).join('');}
function objectSvg(o,t,seed,amap){const p=clamp((t-o.start)/o.duration); if(p<=0)return ''; let x=o.x,y=o.y,opacity=1,scale=1;
 if(o.animation==='MOVE'){x=o.x+(o.target_x-o.x)*p;y=o.y+(o.target_y-o.y)*p} if(o.animation==='FADE')opacity=p;if(o.animation==='SCALE')scale=.15+.85*p;
 const prog=['DRAW','WRITE_OR_REVEAL'].includes(o.animation)?p:1, stroke=o.stroke||'#252525',fill=o.fill||'none',sw=o.stroke_width||3, g=rough.generator({options:{seed,roughness:1.25,bowing:1.1,stroke,fill,strokeWidth:sw}}); let body='';
 if(o.type==='TEXT'){const n=Math.ceil(o.text.length*prog),txt=esc(o.text.slice(0,n)),anchor=({left:'start',center:'middle',right:'end'}[o.align||'left']);body=`<text x="0" y="0" font-family="DoodleCJK" font-size="${o.font_size||48}" text-anchor="${anchor}" fill="${stroke}">${txt}</text>`}
 if(o.type==='LINE'||o.type==='ARROW'){body=paths(g.line(o.from[0],o.from[1],o.to[0],o.to[1],{seed}),prog);if(o.type==='ARROW'){const a=Math.atan2(o.to[1]-o.from[1],o.to[0]-o.from[0]),L=22;body+=paths(g.line(o.to[0],o.to[1],o.to[0]-L*Math.cos(a-.5),o.to[1]-L*Math.sin(a-.5),{seed:seed+1}),prog)+paths(g.line(o.to[0],o.to[1],o.to[0]-L*Math.cos(a+.5),o.to[1]-L*Math.sin(a+.5),{seed:seed+2}),prog)}}
 if(o.type==='BOX')body=paths(g.rectangle(0,0,o.width,o.height,{seed,fill:o.animation==='HIGHLIGHT'?'#ffe58a':fill,fillStyle:'solid'}),prog);
 if(o.type==='CIRCLE')body=paths(g.circle(0,0,o.radius*2,{seed,fill:o.animation==='HIGHLIGHT'?'#ffe58a':fill,fillStyle:'solid'}),prog);
 if(o.type==='ELLIPSE')body=paths(g.ellipse(0,0,o.width,o.height,{seed,fill:o.animation==='HIGHLIGHT'?'#ffe58a':fill,fillStyle:'solid'}),prog);
 if(o.type==='ICON'||o.type==='SVG'){const a=amap.get(o.asset_id),raw=safeSvg(path.join(ROOT,a.filename)),inner=raw.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/s,'');body=`<svg width="${o.width||120}" height="${o.height||120}" viewBox="0 0 24 24" overflow="hidden"><g opacity="${prog}">${inner}</g></svg>`}
 return `<g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}">${body}</g>`;
}
function svgFrame(scene,t,amap){return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.canvas.width}" height="${scene.canvas.height}" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}"><style>text{font-family:'Noto Sans CJK SC'}</style><rect width="100%" height="100%" fill="${scene.background.value}"/>${scene.objects.map((o,i)=>objectSvg(o,t,scene.seed+i*17,amap)).join('')}</svg>`}
async function render(input,output){const scene=JSON.parse(fs.readFileSync(input)),{amap}=validate(scene),inputSha=sha(input),runId=new Date().toISOString().replace(/[-:.]/g,'').replace('Z','Z')+'-'+inputSha.slice(0,8),runDir=path.join(ROOT,'runs',runId),frameDir=path.join(runDir,'frames');fs.mkdirSync(frameDir,{recursive:true});const frames=Math.round(scene.canvas.duration*scene.canvas.fps);
 for(let i=0;i<frames;i++){const s=svgFrame(scene,i/scene.canvas.fps,amap);const png=new Resvg(s,{font:{fontFiles:[FONT],loadSystemFonts:false,defaultFontFamily:'Noto Sans CJK SC'}}).render().asPng();fs.writeFileSync(path.join(frameDir,`frame-${String(i).padStart(6,'0')}.png`),png);}
 fs.mkdirSync(path.dirname(output),{recursive:true});const args=['-y','-framerate',String(scene.canvas.fps),'-i',path.join(frameDir,'frame-%06d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',output];const rr=cp.spawnSync(ffmpeg,args,{encoding:'utf8'});if(rr.status)throw Error('FFMPEG_FAILED '+rr.stderr.slice(-1000));
 const probe=JSON.parse(cp.execFileSync(ffprobe,['-v','error','-show_entries','format=duration','-of','json',output],{encoding:'utf8'}));const used=[...new Set(scene.objects.filter(o=>o.asset_id).map(o=>o.asset_id))],manifest=JSON.parse(fs.readFileSync(MANIFEST));const evidence={run_id:runId,input_sha256:inputSha,capability_version:'experimental-v1',scene_duration:scene.canvas.duration,fps:scene.canvas.fps,resolution:[scene.canvas.width,scene.canvas.height],asset_ids:used,asset_sha256:Object.fromEntries(used.map(id=>{const a=manifest.assets.find(x=>x.asset_id===id);return[id,a.normalized_sha256]})),seed:scene.seed,render_command:[ffmpeg,...args],output_path:path.resolve(output),output_sha256:sha(output),output_duration:Number(probe.format.duration),validation_result:'PASS'};fs.writeFileSync(path.join(runDir,'input.json'),JSON.stringify(scene,null,2));fs.writeFileSync(path.join(runDir,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));}
async function main(){const [cmd,arg,...rest]=process.argv.slice(2);if(cmd==='list-assets'){console.log(fs.readFileSync(MANIFEST,'utf8'));return}if(!arg)throw Error('USAGE: runtime.js validate scene.json | render scene.json --output out.mp4 | list-assets');const scene=JSON.parse(fs.readFileSync(arg));if(cmd==='validate'){validate(scene);console.log(JSON.stringify({status:'PASS',input_sha256:sha(arg)}));return}if(cmd==='render'){const i=rest.indexOf('--output');if(i<0||!rest[i+1])throw Error('OUTPUT_REQUIRED');await render(arg,path.resolve(rest[i+1]));return}throw Error('UNKNOWN_COMMAND')}
main().catch(e=>{console.error(e.message);process.exit(1)});
