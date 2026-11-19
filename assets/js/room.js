import * as THREE from "../vendor/three.module.min.js";

/* ================= UI ================= */
const shade = document.getElementById("shade");
const menuBtns = [...document.querySelectorAll("#menu [data-open]")];
let current = null, lastFocus = null;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function openPanel(key){
  const d = document.getElementById("d-"+key); if(!d) return;
  if(current && current!==d){ current.classList.remove("on"); current.inert=true; }
  lastFocus = document.activeElement;
  d.classList.add("on"); d.inert=false; d.scrollTop = 0;
  shade.classList.add("on"); current = d;
  document.getElementById("cta").classList.add("off");
  menuBtns.forEach(b=>b.classList.toggle("on", b.dataset.open===key));
  setTimeout(()=>d.querySelector("h2").focus({preventScroll:true}), 60);
  window.focusOn && window.focusOn(key);
}
function closePanel(){
  if(!current) return;
  current.classList.remove("on"); current.inert=true; current=null;
  shade.classList.remove("on"); menuBtns.forEach(b=>b.classList.remove("on"));
  window.focusOn && window.focusOn(null);
  if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
}
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openPanel(b.dataset.open)}));
document.querySelectorAll(".close").forEach(b=>b.addEventListener("click",closePanel));
shade.addEventListener("click",closePanel);
addEventListener("keydown",e=>{
  if(e.key==="Escape") closePanel();
  if(e.key==="Tab" && current){
    const f=[...current.querySelectorAll("a,button,[tabindex]")].filter(x=>!x.disabled);
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
  }
});
document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",async e=>{
  e.preventDefault(); e.stopPropagation();
  try{ await navigator.clipboard.writeText(b.dataset.copy); b.textContent="copié ✓"; }
  catch{ b.textContent="sélectionne-le"; }
  setTimeout(()=>b.textContent="copier",1600);
}));
const hashKey = location.hash.slice(1);

/* ================= BOOT ================= */
const boot = document.getElementById("boot"), bootText = document.getElementById("bootText");
const lines = [
  "$ ssh curtis@homelab",
  "Connexion établie.",
  "$ terraform apply -auto-approve",
  "<b>Apply complete!</b> Resources: 1 bureau, 1 rack, 1 canard.",
  "$ kubectl get pods -n portfolio",
  "bureau-0   1/1   Running   0   0s",
];
let bootDone=false; const bootStart=performance.now(); window.bootCheck=()=>{ if(!bootDone && performance.now()-bootStart>5000) endBoot(); };
setTimeout(()=>endBoot(),5000);
function endBoot(){ if(bootDone) return; bootDone=true; boot.classList.add("gone"); if(hashKey) setTimeout(()=>openPanel(hashKey),300); }
document.getElementById("skip").addEventListener("click",endBoot);
addEventListener("keydown",e=>{ if(!bootDone && (e.key==="Enter"||e.key===" ")) endBoot(); },{once:false});
if(reduce || sessionStorageGet()) endBoot();
else (async()=>{
  let done="";
  for(const l of lines){
    if(bootDone) return;
    if(l.startsWith("$")){ for(let i=0;i<=l.length;i++){ if(bootDone) return; bootText.innerHTML=done+l.slice(0,i)+"▌"; await wait(22);} done+=l+"\n"; }
    else { done+=l+"\n"; await wait(260); }
    bootText.innerHTML=done;
  }
  await wait(450); try{sessionStorage.setItem("booted","1")}catch{} endBoot();
})();
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function sessionStorageGet(){try{return sessionStorage.getItem("booted")}catch{return null}}

/* ================= 3D ================= */
await Promise.race([document.fonts ? Promise.all(["700 32px Sora","600 20px Sora","600 40px Sora","500 20px 'IBM Plex Mono'","600 34px 'IBM Plex Mono'"].map(f=>document.fonts.load(f))) : 0, wait(2500)]).catch(()=>{});
const canvas = document.getElementById("scene");
let renderer;
try{
  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
}catch{
  document.getElementById("nogl").hidden=false; canvas.remove();
}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121014);
scene.fog = new THREE.Fog(0x121014, 6, 13);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 50);
const home = { pos:new THREE.Vector3(0.3,1.6,2.85), look:new THREE.Vector3(0.3,1.32,0) };
camera.position.copy(home.pos);

/* ---- helpers ---- */
const M = (c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.7,metalness:.05,...o});
function box(w,h,d,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function canvasTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return {tex:t,ctx:g,canvas:c}}
const clickables = [];
function clickable(group,key,label){group.userData={key,label};clickables.push(group);return group}

/* ---- room ---- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14,14), M(0x1d1a20,{roughness:.95}));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
// rug
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.5,48), M(0x2a2230,{roughness:1}));
rug.rotation.x=-Math.PI/2; rug.position.set(0.2,0.005,0.9); rug.receiveShadow=true; scene.add(rug);
const wallMat = M(0x221e26,{roughness:.95});
box(14,5,.1,wallMat,0,2.5,-0.98);            // back wall
box(.1,5,8,wallMat,-2.6,2.5,2.6);           // left wall
// baseboard
box(14,.08,.04,M(0x2e2833),0,.04,-0.91);

/* ---- window (left wall) with night city ---- */
const city = canvasTex(512,512,(g,w,h)=>{
  const grd=g.createLinearGradient(0,0,0,h); grd.addColorStop(0,"#0c1430"); grd.addColorStop(.7,"#2a1d3d"); grd.addColorStop(1,"#4a2a35");
  g.fillStyle=grd; g.fillRect(0,0,w,h);
  for(let i=0;i<60;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.7})`;g.fillRect(Math.random()*w,Math.random()*h*.45,1.5,1.5)}
  g.fillStyle="#f6e6c2"; g.beginPath(); g.arc(380,110,26,0,7); g.fill();
  let x=0; while(x<w){const bw=30+Math.random()*60, bh=120+Math.random()*230; g.fillStyle="#0f0d16"; g.fillRect(x,h-bh,bw,bh);
    for(let yy=h-bh+10; yy<h-6; yy+=14) for(let xx=x+6; xx<x+bw-6; xx+=11) if(Math.random()<.32){g.fillStyle=Math.random()<.8?"#ffcf7a":"#7fe6ff";g.fillRect(xx,yy,5,7)}
    x+=bw+4;}
});
const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.3), new THREE.MeshBasicMaterial({map:city.tex}));
win.position.set(-2.54,1.9,1.1); win.rotation.y=Math.PI/2; scene.add(win);
const frameM=M(0x3a3340);
box(.06,.06,1.72,frameM,-2.53,2.58,1.1); box(.06,.06,1.72,frameM,-2.53,1.22,1.1);
box(.06,1.42,.06,frameM,-2.53,1.9,.27); box(.06,1.42,.06,frameM,-2.53,1.9,1.93); box(.05,1.3,.04,frameM,-2.52,1.9,1.1);
const moon = new THREE.SpotLight(0x8aa6ff, 6, 8, .6, .8); moon.position.set(-3.2,2.6,1.1); moon.target.position.set(0,0.5,0.6); scene.add(moon,moon.target);

/* ---- lights ---- */
scene.add(new THREE.HemisphereLight(0x8a7cff,0x1a1410,.55));
const key = new THREE.DirectionalLight(0xaab8ff, 1.1); key.position.set(-2,4,2.5); key.target.position.set(0,.8,0); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.5,far:10}); key.shadow.bias=-0.0008; key.shadow.radius=4; scene.add(key,key.target);
const lampLight = new THREE.PointLight(0xffb85c, 9, 6, 1.6); lampLight.position.set(-.95,1.55,-.15); lampLight.castShadow=false; lampLight.shadow.mapSize.set(1024,1024); lampLight.shadow.bias=-0.002; scene.add(lampLight);
const screenGlow = new THREE.PointLight(0x9fe8d2, .9, 2.2, 2); screenGlow.position.set(0,1.1,-.3); scene.add(screenGlow);
const rackGlow = new THREE.PointLight(0x4cf2b0, 1.4, 2.2, 2); rackGlow.position.set(1.0,1.05,-.1); scene.add(rackGlow);
const pic = new THREE.SpotLight(0xffe2b0, 5, 2.5, .55, .7); pic.position.set(.85,2.5,-.3); pic.target.position.set(.85,1.62,-.9); scene.add(pic,pic.target);

/* ---- desk ---- */
const deskTop = M(0x6b4a33,{roughness:.55});
const metal = M(0x1a171d,{roughness:.4,metalness:.6});
box(3.0,.06,1.55,deskTop,0,.76,.05);
box(3.0,.02,1.55,M(0x4a3222),0,.725,.05);
[[-1.42,-.65],[1.42,-.65],[-1.42,.75],[1.42,.75]].forEach(([x,z])=>box(.06,.73,.06,metal,x,.365,z));

/* ---- desk lamp (decor) ---- */
const lamp = new THREE.Group(); // lampe retirée de la scène, la lumière chaude reste
box(.18,.02,.18,metal,-.95,.795,-.2,lamp);
const arm1=box(.02,.5,.02,metal,-.95,1.03,-.2,lamp); arm1.rotation.z=.25;
const arm2=box(.02,.38,.02,metal,-.88,1.38,-.2,lamp); arm2.rotation.z=-.9;
const shadeM=new THREE.Mesh(new THREE.ConeGeometry(.09,.13,24,1,true),M(0x2b2530,{side:THREE.DoubleSide})); shadeM.position.set(-.73,1.47,-.2); shadeM.rotation.z=-.5; lamp.add(shadeM);
const bulb=new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),new THREE.MeshBasicMaterial({color:0xffd9a0})); bulb.position.set(-.72,1.43,-.2); lamp.add(bulb);
lampLight.position.set(-.42,1.38,-.6);

/* ---- MONITOR → projets ---- */
const monitor = clickable(new THREE.Group(),"projets","projets — le moniteur");
monitor.position.z=-.42; scene.add(monitor);
const term = canvasTex(1024,448,()=>{});
const termLines = [
  ["$ git clone github.com/Curtis736/openyard","c"],["Cloning into 'openyard'... done.","d"],
  ["$ make e2e-kind","c"],["✓ tenant oy-demo  quotas ok  apikey ok","g"],["✓ workload hello → 3/3 pods Ready","g"],
  ["$ cd ../aws-order-processing-lab && terraform plan","c"],["Plan: 47 to add, 0 to change, 0 to destroy.","a"],
  ["$ checkov -d infra","c"],["Passed checks: 212, Failed checks: 0","g"],
  ["$ kubectl -n taskboard get hpa","c"],["taskboard-api   cpu: 18%/70%   2   6   2","d"],
  ["$ argocd app sync taskboard-api","c"],["Sync Status: Synced   Health: Healthy","g"],
  ["$ trivy image ghcr.io/curtis736/hop-url","c"],["Total: 0 (CRITICAL: 0, HIGH: 0)","g"],
  ["$ open projets/  ← clique sur l'écran","a"],
];
let termIdx=0, termChar=0, termBuf=[];
function drawTerm(){
  const g=term.ctx, w=1024, h=448;
  g.fillStyle="#0d1412"; g.fillRect(0,0,w,h);
  g.fillStyle="#16201d"; g.fillRect(0,0,w,34);
  ["#ff5f57","#febc2e","#28c840"].forEach((c,i)=>{g.fillStyle=c;g.beginPath();g.arc(22+i*20,17,6,0,7);g.fill()});
  g.fillStyle="#7d8c86"; g.font="500 16px 'IBM Plex Mono', monospace"; g.fillText("curtis@homelab: ~/projets",380,23);
  g.font="500 27px 'IBM Plex Mono', monospace";
  const col={c:"#f3ede4",d:"#7d8c86",g:"#4cf2b0",a:"#ffb02e"};
  const show=termBuf.slice(-10);
  show.forEach((l,i)=>{g.fillStyle=col[l[1]];g.fillText(l[0],22,76+i*37)});
  if(Math.floor(performance.now()/500)%2){const last=show[show.length-1];const x=22+g.measureText(last?last[0]:"").width+4;g.fillStyle="#4cf2b0";g.fillRect(x,76+(show.length-1)*37-23,14,28)}
  // scanlines
  g.fillStyle="rgba(0,0,0,.12)"; for(let y=34;y<h;y+=3) g.fillRect(0,y,w,1);
  term.tex.needsUpdate=true;
}
function tickTerm(){
  if(termIdx>=termLines.length){ if(termBuf.length && Math.random()<.004){termBuf=[];termIdx=0;} return; }
  const [txt,kind]=termLines[termIdx];
  if(!termBuf.length || termBuf[termBuf.length-1].done){ termBuf.push([ "",kind ]); termChar=0; }
  const cur=termBuf[termBuf.length-1];
  if(kind==="c"){ termChar+=1; cur[0]=txt.slice(0,termChar); if(termChar>=txt.length){cur.done=true;termIdx++} }
  else { cur[0]=txt; cur.done=true; termIdx++; }
}
if(reduce){ termLines.forEach(l=>{const x=[l[0],l[1]];x.done=true;termBuf.push(x)}); termIdx=termLines.length; }
// two aluminium displays
const alu=M(0xcfd2d6,{roughness:.28,metalness:.85});
const dash=canvasTex(1024,576,()=>{});
function drawDash(t){
  const g=dash.ctx,w=1024,h=576; g.fillStyle="#111217"; g.fillRect(0,0,w,h);
  g.fillStyle="#1a1c23"; g.fillRect(0,0,w,40); g.fillStyle="#9aa0aa"; g.font="500 18px 'IBM Plex Mono', monospace"; g.fillText("grafana · taskboard-api · last 1h",20,27);
  const panel=(x,y,pw,ph,title)=>{g.fillStyle="#181a21";g.fillRect(x,y,pw,ph);g.fillStyle="#9aa0aa";g.font="500 16px 'IBM Plex Mono', monospace";g.fillText(title,x+12,y+24)};
  panel(16,56,640,250,"requests / s");
  g.strokeStyle="#4cf2b0"; g.lineWidth=3; g.beginPath(); for(let i=0;i<=60;i++){const x=30+i*10.2, y=250-60-Math.sin(i*.35+t)*35-Math.sin(i*.9+t*1.7)*15; i?g.lineTo(x,y):g.moveTo(x,y)} g.stroke();
  g.strokeStyle="#ffb02e"; g.lineWidth=2; g.beginPath(); for(let i=0;i<=60;i++){const x=30+i*10.2, y=280-Math.abs(Math.sin(i*.5+t*.8))*30; i?g.lineTo(x,y):g.moveTo(x,y)} g.stroke();
  panel(672,56,336,120,"pods ready"); g.fillStyle="#4cf2b0"; g.font="600 54px Sora, sans-serif"; g.fillText("3/3",700,150);
  panel(672,186,336,120,"p95 latency"); g.fillStyle="#f3ede4"; g.font="600 54px Sora, sans-serif"; g.fillText((42+Math.round(Math.sin(t)*4))+" ms",700,280);
  panel(16,322,330,238,"coût / mois"); g.fillStyle="#ffb02e"; g.font="600 58px Sora, sans-serif"; g.fillText("24 $",40,450); g.fillStyle="#9aa0aa"; g.font="16px 'IBM Plex Mono', monospace"; g.fillText("budget 30 $ ✓",40,490);
  panel(362,322,646,238,"argo cd");
  ["taskboard-api","taskboard-obs","openyard"].forEach((n,i)=>{g.fillStyle="#4cf2b0";g.beginPath();g.arc(390,378+i*52,8,0,7);g.fill();g.fillStyle="#f3ede4";g.font="500 22px 'IBM Plex Mono', monospace";g.fillText(n,410,386+i*52);g.fillStyle="#9aa0aa";g.fillText("Synced · Healthy",700,386+i*52)});
  dash.tex.needsUpdate=true;
}
drawDash(0);
function makeDisplay(x,ry,tex){
  const d=new THREE.Group(); d.position.set(x,0,-.12); d.rotation.y=ry; monitor.add(d);
  box(.2,.008,.17,alu,0,.794,0,d);                                  // foot
  const arm=box(.12,.36,.012,alu,0,.97,-.05,d); arm.rotation.x=-.12; // arm
  box(.78,.46,.022,alu,0,1.17,0,d);                                 // aluminium body
  const bez=new THREE.Mesh(new THREE.PlaneGeometry(.77,.45),new THREE.MeshStandardMaterial({color:0x0a0a0c,roughness:.2})); bez.position.set(0,1.17,.0115); d.add(bez);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(.745,.42),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); sc.position.set(0,1.17,.012); d.add(sc);
  return d;
}
makeDisplay(-.41,.16,term.tex);
makeDisplay(.41,-.16,dash.tex);
// keyboard + mouse (part of monitor group)
// mechanical keyboard (75%), RGB underglow
const rgbMats=[];
const kb=new THREE.Group(); kb.position.set(-.04,.79,.7); kb.rotation.x=-.05; monitor.add(kb);
box(.62,.035,.22,M(0x1b1820,{roughness:.35,metalness:.5}),0,.018,0,kb);
box(.6,.012,.2,M(0x2a2530,{roughness:.6}),0,.04,0,kb);
const glowMat=new THREE.MeshBasicMaterial({color:0xff00aa,toneMapped:false,transparent:true,opacity:.85});
const glow=new THREE.Mesh(new THREE.PlaneGeometry(.64,.24),glowMat); glow.rotation.x=-Math.PI/2; glow.position.y=.002; kb.add(glow); rgbMats.push({m:glowMat,o:0});
const capGeo=new THREE.BoxGeometry(.03,.022,.03); capGeo.translate(0,.011,0);
const capMats={d:M(0x2c2833,{roughness:.55}),l:M(0xd9d2c5,{roughness:.55}),a:M(0xffb02e,{roughness:.5,emissive:0xffb02e,emissiveIntensity:.15}),m:M(0x4cf2b0,{roughness:.5,emissive:0x4cf2b0,emissiveIntensity:.15})};
const rows=[16,16,15,14,14];
rows.forEach((n,r)=>{for(let c=0;c<n;c++){
  let k="l"; if(c===0||c>=n-2) k="d"; if(r===0&&c===0) k="a"; if(r===4&&c>=3&&c<=8) {if(c>3) continue; }
  if(r===0&&(c===n-1)) k="m"; if(r===3&&c===n-1) k="a";
  const g = (r===4&&c===3)? new THREE.BoxGeometry(.18,.022,.03).translate(0,.011,0) : capGeo;
  const cap=new THREE.Mesh(g,capMats[k]); cap.castShadow=true;
  const x=-.27+c*.036 + (r===4&&c===3?.07:0) + (r===4&&c>3?.13:0);
  cap.position.set(x,.046,-.08+r*.038); kb.add(cap);
}});
const mouse=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.04,6,12),M(0xf2f2f0,{roughness:.25})); mouse.rotation.x=Math.PI/2; mouse.scale.y=.7; mouse.position.set(.42,.795,.72); monitor.add(mouse);

/* ---- cable monitor → rack ---- */
const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,.95,-.64),new THREE.Vector3(.08,.8,-.7),new THREE.Vector3(.5,.795,-.66),new THREE.Vector3(.85,.795,-.5),new THREE.Vector3(1.0,.83,-.38)
]),48,.008,8),M(0x4cf2b0,{emissive:0x4cf2b0,emissiveIntensity:.25,roughness:.4})); scene.add(cable);

/* ---- RACK → stack ---- */
const rack = clickable(new THREE.Group(),"stack","stack — le rack");
rack.position.set(1.08,.79,-.45); rack.scale.setScalar(.48); rack.rotation.y=-.25; scene.add(rack);
const rackM=M(0x111014,{roughness:.35,metalness:.55});
box(.62,1.5,.62,rackM,0,.78,0,rack);
box(.66,.04,.66,rackM,0,1.55,0,rack);
[[-.27,-.27],[.27,-.27],[-.27,.27],[.27,.27]].forEach(([x,z])=>box(.04,.06,.04,metal,x,.03,z,rack));
const ledGeo=new THREE.SphereGeometry(.009,8,6);
const leds=[];
for(let u=0;u<8;u++){
  const y=.22+u*.16;
  box(.54,.12,.02,M(u%3===0?0x2a2530:0x1c1a20,{roughness:.45,metalness:.4}),0,y,.31,rack);
  // vents
  for(let v=0;v<6;v++) box(.004,.07,.004,metal,-.06+v*.024,y,.322,rack);
  for(let l=0;l<4;l++){
    const col = (l===3) ? 0xffb02e : 0x4cf2b0;
    const mat=new THREE.MeshBasicMaterial({color:col,toneMapped:false});
    const led=new THREE.Mesh(ledGeo,mat); led.position.set(.13+l*.03,y,.325); rack.add(led);
    leds.push({mat,col:new THREE.Color(col),phase:Math.random()*10,speed:1+Math.random()*5,on:true});
  }
  // tiny label strip
  box(.12,.02,.004,M(0xd8cfc2),-.19,y+.03,.323,rack);
}
// glass door frame
const glass=new THREE.Mesh(new THREE.PlaneGeometry(.58,1.42),new THREE.MeshPhysicalMaterial({color:0x6b8f86,transparent:true,opacity:.12,roughness:.05,metalness:0}));
glass.position.set(0,.84,.335); rack.add(glass);

/* ---- WHITEBOARD → parcours ---- */
const wb = clickable(new THREE.Group(),"parcours","parcours — le tableau blanc");
wb.position.set(-.85,1.62,-.9); wb.scale.setScalar(.8); scene.add(wb);
const wbTex=canvasTex(1024,640,(g,w,h)=>{
  g.fillStyle="#efebe4"; g.fillRect(0,0,w,h);
  g.strokeStyle="rgba(0,0,0,.06)"; for(let i=0;i<40;i++){g.beginPath();g.moveTo(Math.random()*w,Math.random()*h);g.lineTo(Math.random()*w,Math.random()*h);g.stroke()}
  g.fillStyle="#2b2433"; g.font="600 40px Sora, sans-serif"; g.fillText("parcours.md",40,64);
  g.strokeStyle="#2b2433"; g.lineWidth=4; g.beginPath(); g.moveTo(40,78); g.lineTo(290,82); g.stroke();
  // timeline line
  g.strokeStyle="#3d6fd1"; g.lineWidth=5; g.beginPath(); g.moveTo(70,330); g.bezierCurveTo(300,300,600,360,960,320); g.stroke();
  const pts=[[150,326,"Epitech"],[400,328,"Société Gén."],[650,338,"RentSafe"],[880,324,"SEDI-ATI"]];
  pts.forEach(([x,y,t],i)=>{g.fillStyle=i<1?"#1e9b72":"#d9822b";g.beginPath();g.arc(x,y,13,0,7);g.fill();
    g.fillStyle="#2b2433";g.font="500 26px 'IBM Plex Mono', monospace";g.save();g.translate(x-10,y+(i%2?-34:52));g.rotate((Math.random()-.5)*.06);g.fillText(t,-40,0);g.restore();});
  g.fillStyle="#2b2433"; g.font="500 22px 'IBM Plex Mono', monospace"; g.fillText("→ next: mission freelance ?",620,180);
  g.strokeStyle="#c0392b"; g.lineWidth=3; g.strokeRect(606,150,370,44);
});
box(1.5,.95,.03,M(0xd7d2ca,{roughness:.4}),0,0,0,wb);
const wbFace=new THREE.Mesh(new THREE.PlaneGeometry(1.44,.89),new THREE.MeshStandardMaterial({map:wbTex.tex,roughness:.3})); wbFace.position.z=.016; wb.add(wbFace);
box(1.5,.03,.07,M(0x8a8590,{metalness:.5,roughness:.3}),0,-.49,.03,wb);
// stickies
[[0x7ae0b8,-.55,-.28,.08],[0xffc95c,.12,-.3,-.06],[0xff8fa3,.55,-.25,.1],[0x9ec5ff,.6,.28,-.05]].forEach(([c,x,y,r])=>{
  const s=new THREE.Mesh(new THREE.PlaneGeometry(.17,.17),M(c,{roughness:.9})); s.position.set(x,y,.02); s.rotation.z=r; wb.add(s);
});
// markers on tray
[0x1e9b72,0xd9822b,0x3d6fd1].forEach((c,i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.12,10),M(c));m.rotation.z=Math.PI/2;m.position.set(-.5+i*.16,-.465,.05);wb.add(m)});

/* ---- CERTS on wall → certifs ---- */
const certs = clickable(new THREE.Group(),"certifs","certifs — le mur");
certs.position.set(.85,1.62,-.91); scene.add(certs);
function certFrame(x,y,draw){
  const t=canvasTex(320,400,draw);
  box(.34,.42,.02,M(0x3a2f28,{roughness:.5}),x,y,0,certs);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(.29,.37),new THREE.MeshStandardMaterial({map:t.tex,roughness:.5})); f.position.set(x,y,.012); certs.add(f);
}
function paper(g,w,h){g.fillStyle="#f4efe6";g.fillRect(0,0,w,h);g.strokeStyle="#c9bfae";g.lineWidth=3;g.strokeRect(14,14,w-28,h-28)}
certFrame(-.22,0,(g,w,h)=>{paper(g,w,h);g.fillStyle="#232f3e";g.beginPath();g.roundRect(100,70,120,120,18);g.fill();g.fillStyle="#ffb02e";g.font="700 34px Sora";g.textAlign="center";g.fillText("SAA",160,142);
  g.fillStyle="#2b2433";g.font="600 20px Sora";g.fillText("AWS Solutions",160,240);g.fillText("Architect",160,266);g.font="500 16px 'IBM Plex Mono'";g.fillStyle="#7a7166";g.fillText("Associate · C03",160,300);});
certFrame(.22,0,(g,w,h)=>{paper(g,w,h);g.fillStyle="#5c4ee5";g.beginPath();const cx=160,cy=130;for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;g.lineTo(cx+65*Math.cos(a),cy+65*Math.sin(a))}g.fill();
  g.fillStyle="#fff";g.font="700 32px Sora";g.textAlign="center";g.fillText("TF",160,142);g.fillStyle="#2b2433";g.font="600 20px Sora";g.fillText("Terraform",160,240);g.fillText("Associate",160,266);g.font="500 16px 'IBM Plex Mono'";g.fillStyle="#7a7166";g.fillText("HashiCorp · 003",160,300);});
// CKA: empty dashed spot
const ckaT=canvasTex(320,400,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle="#4cf2b0";g.setLineDash([14,10]);g.lineWidth=5;g.strokeRect(10,10,w-20,h-20);g.fillStyle="#4cf2b0";g.font="600 34px 'IBM Plex Mono'";g.textAlign="center";g.fillText("CKA",160,190);g.font="500 20px 'IBM Plex Mono'";g.fillText("bientôt…",160,230)});
const cka=new THREE.Mesh(new THREE.PlaneGeometry(.3,.38),new THREE.MeshBasicMaterial({map:ckaT.tex,transparent:true,toneMapped:false,opacity:.85})); cka.position.set(.64,0,.005); certs.add(cka);

/* ---- MUG → à propos ---- */
const mug = clickable(new THREE.Group(),"apropos","à propos — le mug");
mug.position.set(.82,.79,.42); mug.scale.setScalar(1.5); scene.add(mug);
const mugMat=M(0xffb02e,{roughness:.35});
const body=new THREE.Mesh(new THREE.CylinderGeometry(.05,.045,.11,28,1,true),mugMat); body.position.y=.055; body.castShadow=true; mug.add(body);
const bottom=new THREE.Mesh(new THREE.CircleGeometry(.045,28),mugMat); bottom.rotation.x=-Math.PI/2; bottom.position.y=.002; mug.add(bottom);
const inner=new THREE.Mesh(new THREE.CylinderGeometry(.047,.043,.105,28,1,true),M(0xfff4e2,{side:THREE.BackSide})); inner.position.y=.057; mug.add(inner);
const coffee=new THREE.Mesh(new THREE.CircleGeometry(.046,28),M(0x3b2416,{roughness:.2})); coffee.rotation.x=-Math.PI/2; coffee.position.y=.095; mug.add(coffee);
const handle=new THREE.Mesh(new THREE.TorusGeometry(.03,.009,10,24,Math.PI*1.2),mugMat); handle.position.set(.055,.058,0); handle.rotation.z=-Math.PI*.6; mug.add(handle);
// steam
const steamTex=canvasTex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"rgba(255,255,255,.55)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,64,64)});
const steam=[]; for(let i=0;i<9;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:steamTex.tex,transparent:true,depthWrite:false,opacity:0}));s.scale.set(.06,.06,1);mug.add(s);steam.push({s,t:i/9})}

/* ---- DUCK → contact ---- */
const duck = clickable(new THREE.Group(),"contact","contact — le canard");
duck.position.set(-.8,.79,.4); duck.rotation.y=.9; duck.scale.setScalar(1.6); scene.add(duck);
const yel=M(0xffd23f,{roughness:.35,emissive:0x5a3c00,emissiveIntensity:.35});
const dBody=new THREE.Mesh(new THREE.SphereGeometry(.07,24,18),yel); dBody.scale.set(1.25,.85,1); dBody.position.y=.06; dBody.castShadow=true; duck.add(dBody);
const tail=new THREE.Mesh(new THREE.ConeGeometry(.035,.06,12),yel); tail.position.set(-.085,.09,0); tail.rotation.z=Math.PI/2.6; duck.add(tail);
const head=new THREE.Mesh(new THREE.SphereGeometry(.045,24,18),yel); head.position.set(.05,.14,0); head.castShadow=true; duck.add(head);
const beak=new THREE.Mesh(new THREE.ConeGeometry(.02,.05,14),M(0xff7a1a,{roughness:.4})); beak.position.set(.1,.135,0); beak.rotation.z=-Math.PI/2; beak.scale.z=.6; duck.add(beak);
[.02,-.02].forEach(z=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.007,10,8),M(0x111111,{roughness:.2})); e.position.set(.085,.155,z); duck.add(e)});
// tiny headset on duck — nod to "contact"
const hs=new THREE.Mesh(new THREE.TorusGeometry(.048,.005,8,24,Math.PI),M(0x222024,{metalness:.4})); hs.position.set(.05,.15,0); hs.rotation.y=Math.PI/2; duck.add(hs);

/* ---- decor: plant, books, poster light ---- */
const pot=new THREE.Mesh(new THREE.CylinderGeometry(.11,.08,.2,20),M(0x3a3340)); pot.position.set(1.3,.89,.62); pot.scale.setScalar(.7); pot.castShadow=true; scene.add(pot);
for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.05,.55+Math.random()*.3,6),M(0x2f7a55,{roughness:.8}));const a=i/9*Math.PI*2;leaf.scale.setScalar(.55);leaf.position.set(1.3+Math.cos(a)*.03,1.1,.62+Math.sin(a)*.05);leaf.rotation.set(Math.sin(a)*.4,0,Math.cos(a)*.4);leaf.castShadow=true;scene.add(leaf)}
/* ---- GAMING PC → à propos ---- */
const pc = clickable(new THREE.Group(),"apropos","à propos — le PC gamer");
pc.position.set(-1.12,.79,-.35); pc.rotation.y=.45; scene.add(pc);
const caseM=M(0x16141a,{roughness:.3,metalness:.6});
box(.26,.52,.5,caseM,0,.26,0,pc);            // shell
[[-.11,-.21],[.11,-.21],[-.11,.21],[.11,.21]].forEach(([x,z])=>box(.03,.015,.03,metal,x,-.005,z,pc));
box(.22,.48,.46,M(0x0c0b0e,{roughness:.9}),0,.26,0,pc);
// glass side panel (faces +x, toward the room)
const glassP=new THREE.Mesh(new THREE.PlaneGeometry(.46,.46),new THREE.MeshPhysicalMaterial({color:0x99aacc,transparent:true,opacity:.18,roughness:.05}));
glassP.rotation.y=Math.PI/2; glassP.position.set(.132,.26,0); pc.add(glassP);
// RGB fans on the front (+z) and inside
const fanGeo=new THREE.TorusGeometry(.06,.008,8,32);
[[.38,.33],[.26,.33],[.14,.33]].forEach(([y],i)=>{
  const fm=new THREE.MeshBasicMaterial({color:0xff00aa,toneMapped:false}); rgbMats.push({m:fm,o:i*.12});
  const f=new THREE.Mesh(fanGeo,fm); f.position.set(0,y,.252); pc.add(f);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.01,16),M(0x2a2530)); hub.rotation.x=Math.PI/2; hub.position.set(0,y,.252); pc.add(hub);
  const fi=new THREE.Mesh(fanGeo,fm); fi.rotation.y=Math.PI/2; fi.position.set(.09,y,.12); pc.add(fi);
});
// GPU + RAM sticks visible through glass
box(.03,.06,.3,M(0x2c2833,{metalness:.5,roughness:.3}),.06,.2,-.03,pc);
const gpuStrip=new THREE.MeshBasicMaterial({color:0xff00aa,toneMapped:false}); rgbMats.push({m:gpuStrip,o:.5});
box(.005,.008,.28,gpuStrip,.077,.23,-.03,pc);
for(let i=0;i<4;i++){const rm=new THREE.MeshBasicMaterial({color:0xff00aa,toneMapped:false}); rgbMats.push({m:rm,o:.2+i*.05}); box(.012,.07,.012,rm,.06,.38,-.12+i*.022,pc);}
const pcGlow=new THREE.PointLight(0xff3cc8,1.2,1.2,2); pcGlow.position.set(.25,.3,.1); pc.add(pcGlow);
// power LED
box(.02,.004,.004,new THREE.MeshBasicMaterial({color:0x4cf2b0,toneMapped:false}),0,.5,.252,pc);

/* ---- mini desktop computer (decor) ---- */
const mini=new THREE.Group(); mini.position.set(.66,.79,-.12); mini.rotation.y=-.2; scene.add(mini);
box(.2,.006,.2,M(0x2a2b2f,{roughness:.6}),0,.003,0,mini);
box(.2,.034,.2,alu,0,.023,0,mini);
box(.006,.002,.002,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),.07,.025,.101,mini);
for(let i=0;i<2;i++) box(.014,.008,.002,M(0x1a1a1c),-.07+i*.025,.022,.101,mini);

/* ---- over-ear headphones on a stand (decor) ---- */
const hp=new THREE.Group(); hp.position.set(-.66,.79,-.12); hp.rotation.y=.3; scene.add(hp);
const standM=M(0xcfd2d6,{roughness:.3,metalness:.85});
const sb=new THREE.Mesh(new THREE.CylinderGeometry(.06,.065,.012,32),standM); sb.position.y=.006; sb.castShadow=true; hp.add(sb);
box(.012,.3,.012,standM,0,.16,0,hp);
const cradle=new THREE.Mesh(new THREE.TorusGeometry(.05,.008,10,24,Math.PI),standM); cradle.position.y=.31; hp.add(cradle);
const band=new THREE.Mesh(new THREE.TorusGeometry(.09,.009,10,40,Math.PI),M(0xbfc3c8,{roughness:.3,metalness:.85})); band.position.y=.27; hp.add(band);
const canopy=new THREE.Mesh(new THREE.TorusGeometry(.085,.014,8,40,Math.PI*.8),M(0x6e7480,{roughness:.9})); canopy.position.y=.27; canopy.rotation.z=Math.PI*.1; canopy.scale.z=1.6; hp.add(canopy);
const cupM=M(0x9aa0a8,{roughness:.25,metalness:.8}), cushM=M(0xe8e8e6,{roughness:.95});
[-1,1].forEach(sx=>{
  box(.008,.07,.012,M(0xbfc3c8,{metalness:.85,roughness:.3}),sx*.09,.24,0,hp);
  const cup=new THREE.Mesh(new THREE.BoxGeometry(.04,.085,.07),cupM); cup.position.set(sx*.1,.18,0); cup.castShadow=true; hp.add(cup);
  const cush=new THREE.Mesh(new THREE.BoxGeometry(.022,.08,.064),cushM); cush.position.set(sx*.072,.18,0); hp.add(cush);
});

/* ---- gamepad (decor) ---- */
const pad=new THREE.Group(); pad.position.set(-.38,.795,.52); pad.rotation.y=.35; scene.add(pad);
const padM=M(0x2b2733,{roughness:.45});
const padBody=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.09,8,16),padM); padBody.rotation.z=Math.PI/2; padBody.scale.set(1,1,.45); padBody.position.y=.02; padBody.castShadow=true; pad.add(padBody);
[-.07,.07].forEach(x=>{const g=new THREE.Mesh(new THREE.SphereGeometry(.036,16,12),padM); g.scale.set(1,.45,1.25); g.position.set(x,.02,.03); g.castShadow=true; pad.add(g)});
[[-.04,.0],[.025,.03]].forEach(([x,z])=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.012,14),M(0x111014)); st.position.set(x,.042,z); pad.add(st)});
[[.06,-.012,0xffb02e],[.075,.0,0x4cf2b0],[.06,.012,0x6aa0ff],[.045,.0,0xff6b8a]].forEach(([x,z,c])=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.006,10,8),M(c,{emissive:c,emissiveIntensity:.3})); b.position.set(x,.04,z); pad.add(b)});
box(.025,.004,.008,M(0x111014),-.045,.04,.03,pad); box(.008,.004,.025,M(0x111014),-.045,.04,.03,pad);
// shelf with small items above desk right

/* ---- particles (dust in lamp light) ---- */
const dustG=new THREE.BufferGeometry(); const dn=140; const dp=new Float32Array(dn*3);
for(let i=0;i<dn;i++){dp[i*3]=(Math.random()-.5)*4;dp[i*3+1]=Math.random()*2.6;dp[i*3+2]=(Math.random()-.4)*2.4}
dustG.setAttribute("position",new THREE.BufferAttribute(dp,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({color:0xffd9a0,size:.012,transparent:true,opacity:.5,depthWrite:false})); scene.add(dust);

/* ---- focus targets ---- */
const focus = {
  projets:{look:new THREE.Vector3(0,1.05,-.5), off:new THREE.Vector3(0,.45,1.75)},
  stack:{look:new THREE.Vector3(1.08,1.1,-.45), off:new THREE.Vector3(-.25,.4,1.3)},
  parcours:{look:new THREE.Vector3(-.85,1.62,-.9), off:new THREE.Vector3(.15,.5,1.7)},
  certifs:{look:new THREE.Vector3(.85,1.62,-.9), off:new THREE.Vector3(0,.15,1.4)},
  apropos:{look:new THREE.Vector3(.82,.9,.42), off:new THREE.Vector3(0,.55,.75)},
  contact:{look:new THREE.Vector3(-.8,.92,.4), off:new THREE.Vector3(0,.55,.8)},
};
// when a drawer is open on desktop, shift the view so the object sits in the visible left part
const target = {pos:home.pos.clone(), look:home.look.clone()};
const lookNow = home.look.clone();
let focused=null;
function focusOn(key){
  focused=key;
  if(!key){ target.pos.copy(home.pos); target.look.copy(home.look); return; }
  const f=focus[key]; target.look.copy(f.look); target.pos.copy(f.look).addScaledVector(f.off, innerWidth>700?1:1.5);
  if(innerWidth>700){ target.look.x+=.3; target.pos.x+=.12; }
}
window.focusOn = focusOn;

/* ---- pointer ---- */
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(9,9), tip=document.getElementById("tip");
let hovered=null; const par={x:0,y:0};
function rootOf(o){while(o && !o.userData.key) o=o.parent; return o}
canvas.addEventListener("pointermove",e=>{
  ptr.x=e.clientX/innerWidth*2-1; ptr.y=-(e.clientY/innerHeight)*2+1;
  par.x=ptr.x; par.y=ptr.y;
  tip.style.left=e.clientX+"px"; tip.style.top=e.clientY+"px";
});
canvas.addEventListener("pointerleave",()=>{ptr.set(9,9)});
canvas.addEventListener("click",e=>{
  ptr.x=e.clientX/innerWidth*2-1; ptr.y=-(e.clientY/innerHeight)*2+1;
  ray.setFromCamera(ptr,camera); const hit=ray.intersectObjects(clickables,true)[0];
  if(hit){ const r=rootOf(hit.object); openPanel(r.userData.key); }
});

/* ---- resize ---- */
function resize(){
  const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); const asp=w/h; camera.aspect=asp;
  camera.fov=38; const t=Math.tan(THREE.MathUtils.degToRad(19));
  const needW = asp<0.75 ? 2.5 : 3.45, needH = 2.45;
  const d = Math.max(needH/(2*t), needW/(2*t*asp));
  home.look.set(0,1.0,-.05);
  const dir=new THREE.Vector3(0,.9,1).normalize();
  home.pos.copy(home.look).addScaledVector(dir,d);
  camera.updateProjectionMatrix();
  if(!focused) target.pos.copy(home.pos); else focusOn(focused);
}
addEventListener("resize",resize); resize(); camera.position.copy(home.pos); lookNow.copy(home.look); camera.lookAt(lookNow);

/* ---- loop ---- */
const clock=new THREE.Clock(); let acc=0, running=true, lastBlink=-1;
document.addEventListener("visibilitychange",()=>{running=!document.hidden; if(running){clock.getDelta(); loop();}});
const baseScale=new Map(clickables.map(c=>[c,c.scale.clone()]));
function loop(){
  if(!running) return;
  requestAnimationFrame(loop);
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;

  window.bootCheck && window.bootCheck();
  // terminal
  acc+=dt; const blink=Math.floor(performance.now()/500)%2; if(acc>.045){acc=0; tickTerm(); drawTerm(); lastBlink=blink;} else if(blink!==lastBlink){lastBlink=blink; drawTerm();}

  // LEDs
  leds.forEach(l=>{const v=Math.sin(t*l.speed+l.phase); const on=v>-.3; l.mat.color.copy(l.col).multiplyScalar(on?1:.15)});

  if(Math.floor(t*4)!==window._dt){window._dt=Math.floor(t*4); drawDash(t*.6);}
  // RGB
  rgbMats.forEach(r=>r.m.color.setHSL((t*.08+r.o)%1,1,.55));
  pcGlow.color.setHSL((t*.08+.1)%1,1,.6);
  // steam
  steam.forEach(o=>{o.t=(o.t+dt*.25)%1; const k=o.t; o.s.position.set(Math.sin(k*9+o.t*3)*.015,.1+k*.22,Math.cos(k*7)*.01); o.s.material.opacity=Math.sin(k*Math.PI)*.35; const sc=.04+k*.08; o.s.scale.set(sc,sc,1)});

  // dust
  const p=dustG.attributes.position; for(let i=0;i<dn;i++){let y=p.getY(i)+dt*.02; if(y>2.6) y=0; p.setY(i,y); p.setX(i,p.getX(i)+Math.sin(t*.3+i)*.0006)} p.needsUpdate=true;

  // duck bob
  duck.position.y=.79+Math.max(0,Math.sin(t*2.2))*.004; duck.rotation.z=Math.sin(t*1.1)*.03;
  lampLight.intensity=9+Math.sin(t*13)*.08;

  // hover
  if(!current && ptr.x<5){
    ray.setFromCamera(ptr,camera); const hit=ray.intersectObjects(clickables,true)[0];
    const r=hit?rootOf(hit.object):null;
    if(r!==hovered){ hovered=r; canvas.classList.toggle("hot",!!r); tip.textContent=r?"ouvrir → "+r.userData.label.split(" — ")[0]:""; tip.classList.toggle("on",!!r); }
  } else if(hovered){ hovered=null; canvas.classList.remove("hot"); tip.classList.remove("on"); }
  clickables.forEach(c=>{const b=baseScale.get(c); const s=c===hovered?1.05:1; c.scale.lerp(new THREE.Vector3(b.x*s,b.y*s,b.z*s),.18)});

  // camera
  const k = reduce?1:1-Math.pow(.0015,dt);
  const want = target.pos.clone();
  if(!focused && !reduce){ want.x += par.x*.18; want.y += par.y*.08; }
  camera.position.lerp(want,k); lookNow.lerp(target.look,k); camera.lookAt(lookNow);

  renderer.render(scene,camera);
}
// redraw canvas textures once fonts are in
document.fonts && document.fonts.ready.then(()=>{});
loop();
}
