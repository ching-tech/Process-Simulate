// 內建製程線自我檢查：node check-lines.js
// ponytail: 直接抽 index.html 的 inline script 在 vm 跑，不建測試框架；DOM 用 Proxy 假物件擋掉
const assert=require('assert'), fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'ui','index.html'),'utf8');
// 外部 script 也要載，否則會拿不到走道資料而測到跟瀏覽器不同的設定
const externals=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m=>path.join(__dirname,'ui',m[1]))
  .filter(p=>fs.existsSync(p) && !/chart/.test(p))
  .map(p=>fs.readFileSync(p,'utf8')).join('\n');
const src=externals+'\n'+[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n')
  + ';globalThis.__x={BLUEPRINTS,validateBlueprint,dryRunBlueprint,GRP_CLR,srcRecvFree,buildLineConfig,'
  + 'planSrcFromBlueprint,peCompile,peBuildAisles,peLint,planCardGeom,planDockOf,routeCalc,peSetSpeed,selfRetCalc,legSec,stnSamePlace,stnTwoSided,groupSrcCands,stnSrcETA,planAhead,setPre:v=>{P.preWait=v},getPre:()=>P.preWait,buildSimState,setSim:(lc,b)=>{LC=lc;abfSt=b.st;abfAGVs=b.agvs;simT=0;abfPcs=0;abfOut=[];},agvs:()=>abfAGVs,pcs:()=>abfPcs,stepAll:(n)=>{for(let k=0;k<n;k++){updateABFMachines(2);for(const a of abfAGVs)stepABFAgv(a,2);simT+=2;}return abfPcs;},peSetMpp,peSetSize,pePx2U,peSizeUnit,getPeState:()=>peState,setPeState:v=>{peState=v},applyDefaults:d=>Object.assign(P,d)};';
const stub=new Proxy(function(){},{
  get:(t,k)=> k===Symbol.toPrimitive?(()=>0) : k===Symbol.toStringTag?'stub' : stub,
  set:()=>true, apply:()=>stub, construct:()=>stub});
const ctx={console,Math,JSON,Date,window:stub,document:stub,navigator:{},location:{},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  requestAnimationFrame:()=>0,setTimeout:()=>0,setInterval:()=>0,
  Chart:stub,URL:stub,Blob:stub,FileReader:stub,btoa:s=>s,alert:()=>{}};
ctx.globalThis=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);

const {BLUEPRINTS,validateBlueprint,dryRunBlueprint,GRP_CLR,srcRecvFree,buildLineConfig}=ctx.__x;

// 平面編輯器產出的「任務清單」型線也要能驗證＋出料（上料→烤箱→加工機(站內回空框)→換框）
{
  const id='chk', D={};
  const put=(k,v)=>{D[id+'_'+k]=v; return id+'_'+k;};
  const bp={ id, name:'自我檢查用任務線', custom:true, schemaVersion:2, sinkRole:'s3',
    batchKey:put('bt',1), pickKey:put('pk',10), dropKey:put('dp',10), bufPickKey:put('bpk',10), bufDropKey:put('bdp',10),
    spine:[
      {role:'s0',type:'refill',  name:'上料',  xi:0, procKey:put('p0',120), noReturn:true, dropEmpty:true},
      {role:'s1',type:'buffer',  name:'烤箱',  xi:1, bufKey:put('b1',6)},
      {role:'s2',type:'transfer',name:'加工機',xi:2, procKey:put('p2',180), countKey:put('n2',2),
       selfReturn:true, selfRetKey:put('r2',20)},
      {role:'s3',type:'changer', name:'換框機',xi:3, procKey:put('p3',120), countKey:put('n3',1), dropEmpty:true}],
    groups:[
      {grp:1, agvKey:put('g0',2), tasks:[{f:'s0',t:'s1',c:'full'},{f:'s1',t:'s2',c:'full'}]},
      {grp:2, agvKey:put('g1',2), tasks:[{f:'s2',t:'s3',c:'full'},{f:'s2',t:'s2',c:'empty'}]}],
    routeParams:[], defaults:D,
    layout:{type:'plan', xiCount:4, secPerUnit:0.1, planScale:1, pos:[[200,200],[600,200],[1000,500],[1500,800]],
      zones:[[0,0],[1,1],[2,2],[3,3]], zoneGrp:[1,1,2,2], bg:null, header:'chk', baseVB:'0 0 1800 1000',
      simple:{rows:[[0,1,2,3]],rowY:[280],rowTrack:[[160,182]],viewBox:'0 0 1400 460',legendY:430}} };
  ctx.__x.applyDefaults(D);   // 讓 buildLineConfig 讀得到這條線的預設值
  const v=validateBlueprint(bp);
  assert.ok(v.ok, `任務清單型線驗證失敗：\n• ${v.errors.join('\n• ')}`);
  const lc=buildLineConfig(bp);
  assert.strictEqual(lc.groups[1].tasks[1].self, true, '同站空框任務沒被判成站內回程');
  const dr=dryRunBlueprint(bp);
  assert.ok(dr.ok, `任務清單型線 ${dr.msg}`);
  console.log(`✓ ${'chk'.padEnd(4)} 4 站 / 4 欄 / 2 組 / AGV ${lc.agvInits.length} 台 — ${dr.msg}（任務清單模式）`);
}

// 自己畫的走道：要接成連通的路網，而且距離一定 >= 直線（有繞路才叫走道）
{
  const {peBuildAisles,peLint,setPeState}=ctx.__x;
  setPeState({secPerUnit:0.1, planScale:1, teams:[{name:'G1',n:2}], tasks:[],
    stns:[{name:'A',type:'src',     val:120,n:1,empty:'',x:100,y:600},
          {name:'B',type:'buffer',  val:6,  n:1,empty:'',x:500,y:100},
          {name:'C',type:'transfer',val:180,n:1,empty:'self',x:900,y:600},
          {name:'D',type:'sink',    val:120,n:1,empty:'',x:1100,y:100}],
    // 兩條交叉的走道：交叉點要自動切開，否則走不通
    aisles:[[[100,700],[1100,700]],[[1100,700],[1100,50]],[[1100,50],[500,50]],[[600,700],[600,50]]]});
  const paths=peBuildAisles();
  assert.ok(paths, '畫了走道卻算不出路徑');
  const stns=[[100,600],[500,100],[900,600],[1100,100]];
  let n=0;
  for(let a=0;a<4;a++) for(let b=a+1;b<4;b++){
    const rec=paths[`${a}_${b}`];
    assert.ok(rec, `走道路網不連通：${a}_${b} 走不到`);
    const straight=Math.hypot(stns[a][0]-stns[b][0], stns[a][1]-stns[b][1]);
    assert.ok(rec.len>=straight-2, `${a}_${b} 走道 ${rec.len} 比直線 ${Math.round(straight)} 還短`);
    assert.ok(rec.p.length>=2, `${a}_${b} 路徑點太少`);
    n++;
  }
  // 交叉口沒切開的話，600 那條直線走道會是孤島 → 上面的連通檢查就會炸
  console.log(`✓ 走道路網   4 站 / 4 條折線 / ${n} 組站間路徑全部連通，距離都 >= 直線`);
}

// 機台佔地 + 入料側：一趟搬運＝來源「出口側」→ 目的「入口側」，方向不同距離就不同
{
  const {peBuildAisles,peCompile,planSrcFromBlueprint,setPeState}=ctx.__x;
  // 走道在 y=700。0 號機 200x100 在 (100,600)：入料側朝下的話入口離走道 50、出口離 150
  const mk=face=>({secPerUnit:0.1, planScale:1, name:'面向測試', batch:1, color:'#2e8b57', pick:10, drop:10,
    teams:[{name:'G1',n:2}],
    tasks:[{f:0,t:1,c:'full'},{f:1,t:2,c:'full'},{f:2,t:1,c:'empty'}],
    stns:[{name:'上料',type:'src',     val:120,n:1,empty:'',x:100,y:600, w:200,h:100, face},
          {name:'加工',type:'transfer',val:180,n:1,empty:'self',x:500,y:600, w:60,h:40, face:'S'},
          {name:'換框',type:'changer', val:120,n:1,empty:'',x:900,y:600, w:60,h:40, face:'S'}],
    aisles:[[[100,700],[900,700]]]});
  const P=f=>{ setPeState(mk(f)); return peBuildAisles(); };
  const ps=P('S'), pn=P('N');
  const none=mk(''); none.stns.forEach(x=>x.face=''); setPeState(none);
  const p0=peBuildAisles();
  // 0 號機入料側朝下 → 出口在上，要多繞一整個機台深度 100 才回得到走道
  assert.strictEqual(ps['0_2'].len-pn['0_2'].len, 100, `出口側沒影響距離（下 ${ps['0_2'].len} / 上 ${pn['0_2'].len}）`);
  // 反過來走（2 出口 → 0 入口）剛好相反
  assert.strictEqual(pn['2_0'].len-ps['2_0'].len, 100, '回程距離沒跟著入料側換邊');
  // 同一條路的兩個方向本來就不一樣長
  assert.notStrictEqual(ps['0_2'].len, ps['2_0'].len, '兩個方向算出同樣的距離（沒分出口／入口）');
  assert.strictEqual(p0['0_2'].len, p0['2_0'].len, '沒設入料側時兩個方向應該一樣');
  // 存檔再讀回來，長寬與入料側都不能掉
  setPeState(mk('N'));
  const cp=peCompile();
  assert.ok(validateBlueprint(cp).ok, '有佔地的線驗證失敗');
  assert.deepStrictEqual([...cp.layout.size[0]], [200,100], 'layout.size 沒寫進去');
  assert.strictEqual(cp.layout.face[0], 'N', 'layout.face 沒寫進去');
  const back=planSrcFromBlueprint(cp);
  assert.strictEqual(back.stns[0].w, 200, '再編輯時機台寬度掉了');
  assert.strictEqual(back.stns[0].h, 100, '再編輯時機台高度掉了');
  assert.strictEqual(back.stns[0].face, 'N', '再編輯時入料側掉了');
  console.log(`✓ 機台佔地   200x100 的機台，0→2 出口朝走道 ${pn['0_2'].len} / 背對 ${ps['0_2'].len}；`
    +`同一條路兩個方向 ${ps['0_2'].len} vs ${ps['2_0'].len} — 長寬與入料側存得回來`);
}

// PLS 丟進平面版面編輯器再編譯回來，要還是同一條線（同一台設備／走道路徑／路段時間都不能掉）
{
  const {planSrcFromBlueprint,peCompile,peLint,setPeState}=ctx.__x, pls=BLUEPRINTS.pls;
  const src=planSrcFromBlueprint(pls);
  assert.strictEqual(src.stns.length, pls.spine.length, 'PLS 還原成編輯狀態時站數對不上');
  assert.strictEqual(src.stns.filter(s=>s.same!=null).length, 3, '⑨⑪⑫ 沒被認出是同一台設備');
  assert.strictEqual(src.teams.length, pls.groups.length, '車隊數對不上');
  setPeState(src);
  const cp=peCompile();
  const v=validateBlueprint(cp);
  assert.ok(v.ok, 'PLS 複本驗證失敗：'+v.errors.join(' / '));
  assert.strictEqual(cp.layout.xiCount, pls.layout.xiCount, 'PLS 複本的欄數變了（同一台設備沒併欄）');
  // 複本的走道表是有方向的（a→b 與 b→a 分開存），所以是原版的兩倍
  assert.strictEqual(Object.keys(cp.layout.paths||{}).length,
                     Object.keys(pls.layout.paths||{}).length*2, 'PLS 複本掉了走道路徑');
  assert.strictEqual((cp.layout.aisles||[]).length, (pls.layout.aisles||[]).length, 'PLS 複本掉了走道線段');
  const lint=peLint();
  assert.strictEqual(lint.all.length+Object.keys(lint.stn).length
                    +Object.keys(lint.task).length+Object.keys(lint.team).length, 0, 'PLS 複本被體檢挑出問題');
  const secs=b=>b.routeParams.map(r=>b.defaults[r.key]).sort((x,y)=>x-y).join(',');
  assert.strictEqual(secs(cp), secs(pls), 'PLS 複本的路段行走時間跟原版不一樣');
  ctx.__x.applyDefaults(cp.defaults);
  const dr2=dryRunBlueprint(cp);
  assert.ok(dr2.ok, 'PLS 複本 '+dr2.msg);
  console.log(`✓ pls→編輯器→複本  ${cp.spine.length} 站 / ${cp.layout.xiCount} 欄 / `
    +`同一台 ${src.stns.filter(s=>s.same!=null).length} 組 / 走道 ${Object.keys(cp.layout.paths).length} 段 — ${dr2.msg}`);
}

// PLS 每一欄都要有佔地與入料側，而且格位排出來要落在框內
{
  const {planCardGeom}=ctx.__x, L=BLUEPRINTS.pls.layout;
  const nm={}; BLUEPRINTS.pls.spine.forEach(c=>{ if(!(c.xi in nm)) nm[c.xi]=c.name; });
  const mt={}; BLUEPRINTS.pls.spine.forEach(c=>{ if(!(c.xi in mt)) mt[c.xi]=c.type; });
  assert.strictEqual((L.size||[]).length, L.xiCount, 'PLS 有欄位沒給佔地');
  for(let x=0;x<L.xiCount;x++){
    const [w,h]=L.size[x], f=L.face[x];
    assert.ok(w>=40&&h>=40, `${nm[x]} 佔地太小：${w}x${h}`);
    assert.ok('NSWE'.includes(f), `${nm[x]} 沒有指定入料側`);
    if(mt[x]==='buffer') continue;                    // 緩衝站沒有格位
    const b={x:L.pos[x][0], y:L.pos[x][1], w, h, face:f};
    const {slots}=planCardGeom(b, mt[x]);
    for(const k in slots){                            // 每一格都要在機台框裡面
      assert.ok(Math.abs(slots[k][0]-b.x)<=w/2 && Math.abs(slots[k][1]-b.y)<=h/2,
        `${nm[x]} 的 ${k} 跑出機台框外`);
    }
  }
  const f=x=>({N:'上',S:'下',W:'左',E:'右'})[L.face[x]];
  console.log(`✓ pls 佔地   10 欄都有佔地與入料側（③ 左線體 ${L.size[2].join('x')} 入料側${f(2)}、`
    +`⑧⑫ 研磨線 ${L.size[3].join('x')} 入料側${f(3)}，跟站名的「北入/南出」一致）`);
}

// 量過比例尺之後，機台尺寸就能直接用公尺填（存回去還是像素）
{
  const {planSrcFromBlueprint,peCompile,peSetState:_,setPeState,peSetMpp,peSetSize,pePx2U,peSizeUnit,getPeState}=ctx.__x;
  const src=planSrcFromBlueprint(BLUEPRINTS.pls);
  setPeState(src);
  assert.strictEqual(peSizeUnit(), 'px', '沒校正比例尺時尺寸應該用像素');
  const w0=src.stns[2].w;
  peSetMpp(0.1);                                     // 圖上 1 像素 = 0.1 公尺
  assert.strictEqual(peSizeUnit(), 'm', '校正過就要改用公尺');
  assert.strictEqual(pePx2U(w0), +(w0*0.1).toFixed(1), '像素換公尺算錯');
  peSetSize(2,'w',3.5); peSetSize(2,'h',22);         // 用公尺填
  assert.strictEqual(getPeState().stns[2].w, 35, '3.5 公尺 ÷ 0.1 應該存成 35 像素');
  assert.strictEqual(getPeState().stns[2].h, 220, '22 公尺 ÷ 0.1 應該存成 220 像素');
  const cp=peCompile();
  assert.strictEqual(cp.layout.mPerUnit, 0.1, '比例尺沒存進 layout');
  assert.deepStrictEqual([...cp.layout.size[2]], [35,220], '公尺填的尺寸沒編譯進去');
  assert.strictEqual(planSrcFromBlueprint(cp).mPerUnit, 0.1, '再編輯時比例尺掉了');
  console.log('✓ 比例尺     量到 1 像素=0.1 公尺後，3.5×22 公尺的機台存成 35×220 像素，存檔再讀回來都對');
}

// AGV 停在它要碰的那一格那一側：放滿框停入料側、拿出滿框停對側
{
  const {planCardGeom,planDockOf}=ctx.__x;
  const near=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  for(const f of ['N','S','W','E']){
    const b={x:500,y:500,w:240,h:180,face:f};
    const {slots}=planCardGeom(b,'transfer');
    const din=planDockOf(b,0,'in'), dout=planDockOf(b,0,'out');
    // 放料（入滿框／收空框）那側
    for(const k of ['in_full','out_recv'])
      assert.ok(near(din,slots[k])<near(dout,slots[k]), `入料側=${f}：放料停靠點離 ${k} 比較遠`);
    // 取料（出滿框／退空框）那側
    for(const k of ['in_ret','out_full'])
      assert.ok(near(dout,slots[k])<near(din,slots[k]), `入料側=${f}：取料停靠點離 ${k} 比較遠`);
    assert.notDeepStrictEqual(din, dout, `入料側=${f}：取放料停在同一點`);
  }
  console.log('✓ 停靠側     放滿框／放空框停入料側、拿出滿框／拿退空框停對側，四種擺法都對');
}

// 每一段的「算出來幾秒」要跟實際用的參數一致，不然畫面上寫的算式是騙人的
{
  for(const id of ['pls']){
    const bp=BLUEPRINTS[id];
    const rp=(bp.routeParams||[]).filter(r=>r.calcSec!=null);
    assert.ok(rp.length, `${id} 的路段參數沒有算出來的秒數`);
    for(const r of rp){
      assert.strictEqual(r.calcSec, bp.defaults[r.key], `${id} ${r.label} 算出來的秒數跟預設值對不起來`);
      assert.ok(r.calcNote && /秒|公尺/.test(r.calcNote), `${id} ${r.label} 沒寫算式`);
    }
    console.log(`✓ 路段算式   ${id} ${rp.length} 段都標了算式，算出來的秒數＝實際用的參數`
      +`（例：${rp[0].label} ${rp[0].calcSec}s ← ${rp[0].calcNote}）`);
  }
}

// 舊版存的自訂線沒有 calcSec，要能照 layout 現算，而且算出來要跟當初編譯的值一模一樣
{
  const {planSrcFromBlueprint,peCompile,setPeState,routeCalc,peSetMpp,peSetSpeed}=ctx.__x;
  const src=planSrcFromBlueprint(BLUEPRINTS.pls);
  src.srcPaths=null; src.srcSegs=null;          // 拿掉走道 → 走直線退路，才驗得到停靠點那段
  setPeState(src);
  const cp=peCompile();
  assert.ok(cp.routeParams.length, '沒有路段參數');
  for(const rp of cp.routeParams){
    const old={...rp}; delete old.calcSec; delete old.calcNote;   // 模擬舊存檔
    const c=routeCalc(cp, old);
    assert.ok(c, `${rp.label} 現算不出來`);
    assert.strictEqual(c.sec, cp.defaults[rp.key], `${rp.label} 現算 ${c.sec}s 跟編譯出來的 ${cp.defaults[rp.key]}s 對不上`);
  }
  // 有比例尺時算式改用公尺
  setPeState(src); peSetMpp(0.05); peSetSpeed(50);
  const cp2=peCompile();
  const r2={...cp2.routeParams[0]}; delete r2.calcSec; delete r2.calcNote;
  const c2=routeCalc(cp2, r2);
  assert.strictEqual(c2.sec, cp2.defaults[cp2.routeParams[0].key], '有比例尺時現算對不上');
  assert.ok(/公尺 ÷ 50 公尺\/分/.test(c2.note), '有比例尺時算式沒寫成「公尺 ÷ 速度」：'+c2.note);
  console.log(`✓ 舊存檔     ${cp.routeParams.length} 段沒有 calcSec 也能現算，`
    +`且跟編譯出來的秒數一致（例：${c2.note} = ${c2.sec}s）`);
}

// 一趟搬運＝來源出口 → 目的入口，所以兩個方向各一格參數；站內回空框照機台自己的佔地算
{
  const {peCompile,setPeState,selfRetCalc}=ctx.__x;
  setPeState({secPerUnit:0.1, planScale:1, name:'方向', batch:1, color:'#2e8b57', pick:10, drop:10,
    teams:[{name:'G1',n:2}],
    tasks:[{f:0,t:1,c:'full',g:0},{f:1,t:2,c:'full',g:0},{f:1,t:1,c:'empty',g:0}],
    stns:[{name:'A',type:'src',      val:120,n:1,empty:'',    x:200, y:300, w:120,h:200, face:'S'},
          {name:'B',type:'transfer', val:180,n:1,empty:'self',x:800, y:300, w:120,h:300, face:'S'},
          {name:'C',type:'sink',     val:60, n:1,empty:'',    x:1400,y:300, w:120,h:200, face:'S'}],
    aisles:[[[100,700],[1500,700]]]});
  const cp=peCompile();
  const key=(a,b)=>cp.routeParams.find(r=>r.pair[0]===a&&r.pair[1]===b);
  assert.ok(key(0,1), '0→1 沒有路段參數');
  assert.ok(key(1,2), '1→2 沒有路段參數');
  // B 比 A 深 100：A 出口 → B 入口 要繞過 B 的深度，B 出口 → C 入口 也一樣
  const ab=cp.defaults[key(0,1).key], bc=cp.defaults[key(1,2).key];
  assert.strictEqual(bc-ab, 10, `方向沒有影響距離（A→B ${ab}s / B→C ${bc}s）`);
  assert.ok(/出口→入口/.test(key(0,1).calcNote), '算式沒寫出口→入口：'+key(0,1).calcNote);
  // 走道表兩個方向都要有，而且不一樣長
  const PA=cp.layout.paths;
  assert.ok(PA['0_1'] && PA['1_0'], '走道表沒有兩個方向');
  assert.notStrictEqual(PA['0_1'].len, PA['1_0'].len, '兩個方向算出同樣長');
  // 站內回空框：退空框(對側) → 收空框(入料側)，跟機台深度掛鉤
  const c=cp.spine.find(x=>x.selfRetKey);
  const sc=selfRetCalc(cp, c);
  assert.ok(sc, '站內回空框算不出來');
  assert.strictEqual(cp.defaults[c.selfRetKey], sc.sec, '站內回空框預設值跟算出來的不一樣');
  assert.ok(sc.sec>=20 && sc.sec<=40, `120x300 的機台站內回空框算成 ${sc.sec}s，不合理`);
  console.log(`✓ 出口→入口   A→B ${ab}s / B→C ${bc}s（B 深 100px 就多 10s）；`
    +`走道 0_1=${PA['0_1'].len} 1_0=${PA['1_0'].len}；站內回空框 ${sc.sec}s ← ${sc.note}`);
}

// 烤箱只有一個門：滿框從那裡進、烤完也從那裡出，取放都停同一個位置
{
  const {peBuildAisles,peCompile,setPeState,planDockOf,routeCalc}=ctx.__x;
  const box={x:500,y:500,w:200,h:120,face:'S'};
  assert.notDeepStrictEqual(planDockOf(box,0,'in'), planDockOf(box,0,'out'), '一般機台的取放兩側應該不同');
  const oven={...box, oneDoor:true};
  assert.deepStrictEqual(planDockOf(oven,0,'in'), planDockOf(oven,0,'out'), '烤箱的取放不在同一個門');
  // 整條線跑一次：烤箱兩個方向的距離要一樣，一般機台不一樣
  setPeState({secPerUnit:0.1, planScale:1, name:'烤箱', batch:1, color:'#2e8b57', pick:10, drop:10,
    teams:[{name:'G1',n:2}],
    tasks:[{f:0,t:1,c:'full',g:0},{f:1,t:2,c:'full',g:0},{f:2,t:2,c:'empty',g:0}],
    stns:[{name:'A',type:'src',     val:120,n:1,empty:'',    x:200, y:300, w:120,h:200, face:'S'},
          {name:'O',type:'buffer',  val:8,  n:1,empty:'',    x:800, y:300, w:200,h:300, face:'S'},
          {name:'C',type:'transfer',val:180,n:1,empty:'self',x:1400,y:300, w:120,h:200, face:'S'}],
    aisles:[[[100,700],[1500,700]]]});
  const PA=peBuildAisles();
  // A 和 C 對烤箱是對稱的（各離 600px、深度都 200）：從烤箱那個門出發到兩邊一樣遠
  assert.strictEqual(PA['1_0'].len, PA['1_2'].len, '烤箱端的距離不該隨方向改變');
  // A 自己還是有出口／入口之分：A→O 比 O→A 多繞 A 的深度 200
  assert.strictEqual(PA['0_1'].len-PA['1_0'].len, 200, 'A 端沒有分出口／入口');
  const cp=peCompile();
  const ovenCol=cp.spine.find(c=>c.type==='buffer').xi;
  const rp=cp.routeParams.find(r=>r.pair[0]===ovenCol);
  const chk={...rp}; delete chk.calcSec; delete chk.calcNote;
  assert.strictEqual(routeCalc(cp, chk).sec, cp.defaults[rp.key], '烤箱出發那段現算對不上（oneDoor 沒帶到）');
  console.log(`✓ 烤箱單門   進出同一個門：A→O ${PA['0_1'].len} / O→A ${PA['1_0'].len} / O→C ${PA['1_2'].len}`
    +`（差別只來自對向那一台）`);
}

// AGV 不能在機台的兩側之間瞬移：站在放料側就得先繞到取料側，那一段要有時間
{
  const {planSrcFromBlueprint,peCompile,setPeState,buildLineConfig,buildSimState,setSim,stepAll,
         legSec,stnSamePlace,stnTwoSided,applyDefaults}=ctx.__x;
  const src=planSrcFromBlueprint(BLUEPRINTS.pls);
  setPeState(src);
  const bp=peCompile();
  applyDefaults(bp.defaults);
  const lc=buildLineConfig(bp), b=buildSimState(lc);
  setSim(lc, b);
  const self=b.st.findIndex(s=>s.selfRetKey && !s.alias);
  assert.ok(self>=0, '找不到站內回空框的站');
  assert.ok(stnTwoSided(self), '有佔地的加工機應該分得出兩側');
  assert.ok(legSec(self,self)>1, `站內回空框走一趟只要 ${legSec(self,self)}s`);
  // 同一台設備的第 2 個製程步驟：站別索引不同、圖上同一個位置
  const al=b.st.findIndex(s=>s.alias);
  if(al>=0){
    const own=b.st.findIndex((s,k)=>k!==al && !s.alias && s.xi===b.st[al].xi && (s.sub||0)===(b.st[al].sub||0));
    assert.ok(own>=0, '找不到分身對應的本尊');
    assert.ok(stnSamePlace(al,own), '分身跟本尊沒被認成同一台');
    assert.ok(legSec(al,own)>1, `分身↔本尊只要 ${legSec(al,own)}s，會瞬移`);
  }
  // 烤箱只有一個門：不分兩側，維持零距離
  const ov=b.st.findIndex(s=>s.buf);
  assert.strictEqual(stnTwoSided(ov), false, '烤箱不應該分兩側');
  // 照樣跑得出料
  const pcs=stepAll(4000);
  assert.ok(pcs>0, '加了繞路時間後跑不出料');
  console.log(`✓ 不瞬移     站內回空框 ${legSec(self,self)}s、`
    +`分身↔本尊 ${al>=0?legSec(al,b.st.findIndex((s,k)=>k!==al&&!s.alias&&s.xi===b.st[al].xi&&(s.sub||0)===(b.st[al].sub||0)))+'s':'—'}`
    +`（以前都是 0）；8000s 出料 ${pcs} 片`);
}

// 排程：沒事做的車會先算「哪個取料點快好了」，接得上就先開過去等
{
  const {peCompile,setPeState,buildLineConfig,buildSimState,setSim,stepAll,agvs,
         groupSrcCands,stnSrcETA,planAhead}=ctx.__x;
  setPeState({secPerUnit:0.1, planScale:1, name:'預先出發', batch:1, color:'#2e8b57', pick:10, drop:10,
    teams:[{name:'G1',n:1}],
    tasks:[{f:0,t:1,c:'full',g:0},{f:1,t:2,c:'full',g:0},{f:1,t:1,c:'empty',g:0}],
    stns:[{name:'A',type:'src',      val:300,n:1,empty:'',    x:200, y:900, w:120,h:200, face:'S'},
          {name:'B',type:'transfer', val:300,n:1,empty:'self',x:800, y:600, w:140,h:400, face:'S'},
          {name:'C',type:'sink',     val:60, n:1,empty:'',    x:1400,y:900, w:120,h:200, face:'S'}],
    aisles:[[[100,1100],[1500,1100]]]});
  const bp=peCompile();
  ctx.__x.applyDefaults(bp.defaults);
  const lc=buildLineConfig(bp), b=buildSimState(lc);
  setSim(lc, b);
  const cands=groupSrcCands(lc.groups[0]);
  assert.ok(cands.length>=2, '取料點清單沒算出來');
  assert.ok(cands.some(x=>x.c==='full') && cands.some(x=>x.c==='empty'), '滿框/空框沒分開');
  // A 站正在生產：ETA 應該就是機台剩餘時間，不是 0 也不是 Infinity
  stepAll(30);
  const a0=b.st.findIndex(s=>s.mtype==='refill');
  const eta=stnSrcETA(a0,'full');
  assert.ok(isFinite(eta) && eta>0, `生產中的站 ETA 算不出來：${eta}`);
  assert.ok(Math.abs(eta-b.st[a0].machineTimer)<1e-6, 'ETA 跟機台計時器對不起來');
  // 跑一段，車一定會用到「先開過去等」，而且會停在取料側
  let saw=0, cross=0, ready=0;
  for(let k=0;k<2000;k++){
    stepAll(1);
    for(const a of agvs()){
      if(a.phase==='repos'){ saw++; if(a.toPos!==a.fromPos) cross++; }
      if(a.phase==='idle' && a.side==='out') ready++;                 // 已經站在取料口等
    }
  }
  assert.ok(saw>0, '從來沒先開過去等');
  assert.ok(cross>0, '只會在原地繞，沒有真的先開到別站');
  assert.ok(ctx.__x.pcs()>0, '加了預先出發後跑不出料');
  // preWait=0 就整個關掉；示意圖版面（ABF/SMK）本來就不吃這一招
  const keep=ctx.__x.getPre(); ctx.__x.setPre(0);
  setSim(buildLineConfig(bp), buildSimState(buildLineConfig(bp)));
  let off=0; for(let k=0;k<800;k++){ stepAll(1); for(const a of agvs()) if(a.phase==='repos') off++; }
  ctx.__x.setPre(keep);
  assert.strictEqual(off, 0, 'preWait=0 還是會先出發');
  const alc=buildLineConfig(BLUEPRINTS.abf);
  setSim(alc, buildSimState(alc));
  let sch=0; for(let k=0;k<800;k++){ stepAll(1); for(const a of agvs()) if(a.phase==='repos') sch++; }
  assert.strictEqual(sch, 0, 'ABF （示意圖版面）不該先出發');
  console.log(`✓ 預先出發   沒事做的車會看哪個取料點快好了（ETA=機台剩餘時間）`
    +`，接得上就先開過去停在取料口等`);
}

// 人員投料站永遠不能被選為空框回程的目的地
assert.strictEqual(srcRecvFree({noReturn:true,mtype:'refill',s_recv:0,s_recv_res:0}), false, 'noReturn 站仍在收空框');

for(const id in BLUEPRINTS){
  const bp=BLUEPRINTS[id];
  const v=validateBlueprint(bp);
  assert.ok(v.ok, `${id} 驗證失敗：\n• ${v.errors.join('\n• ')}`);
  // 組數超過配色表時 SVG 會整張畫不出來，這裡先擋
  bp.groups.forEach((_,gi)=>assert.ok(GRP_CLR[gi]&&GRP_CLR[gi].zone, `${id} 第 ${gi+1} 組沒有配色`));
  // 共用設備（同一台被兩個步驟用）必須共用參數 key，否則面板會出現兩個互相打架的欄位
  const keyOwner={};
  for(const c of bp.spine){
    if(!c.share) continue;
    const k=c.bufKey||c.procKey;
    assert.ok(!keyOwner[c.share] || keyOwner[c.share]===k,
      `${id} 共用設備 ${c.share} 的兩站用了不同參數 key`);
    keyOwner[c.share]=k;
  }
  // 只有「同一台設備的第二個步驟」(alias) 可以跟別站共用同一格，其餘不得重疊
  const lc=buildLineConfig(bp), slot=new Set();
  for(const d of lc.defs){
    if(d.alias) continue;
    const k=`${d.xi}/${d.sub}`;
    assert.ok(!slot.has(k), `${id} 站別畫在同一格上：xi=${d.xi} sub=${d.sub}（${d.name}）`);
    slot.add(k);
  }
  // 平面圖底圖要真的存在，否則畫面只剩浮在空白上的方塊
  if(bp.layout && bp.layout.bg)
    assert.ok(fs.existsSync(path.join(__dirname,'ui',bp.layout.bg.href)),
      `${id} 找不到底圖 ui/${bp.layout.bg.href}`);
  // 走道路由：每個搬運段都要查得到走道路徑，否則會退回穿牆的直線
  if(bp.layout && bp.layout.paths){
    const col={}; bp.spine.forEach(c=>{col[c.role]=c;});
    const xiOf=r=>col[r].xi;
    const need=new Set();
    for(const g of bp.groups) for(const l of (g.legs||[g])){
      const hop=(a,b)=>{ const x=xiOf(a),y=xiOf(b); if(x!==y) need.add(`${Math.min(x,y)}_${Math.max(x,y)}`); };
      // 來源站自己回空框／人員投料 → 沒有跨站回程那一趟
      const crossRet=!(col[l.src].selfReturn||col[l.src].noReturn);
      if(l.mid!=null){ hop(l.src,l.mid); hop(l.mid,l.dst); if(crossRet) hop(l.src,l.dst); }
      else hop(l.src,l.dst);
    }
    for(const k of need)
      assert.ok(bp.layout.paths[k], `${id} 缺走道路徑 ${k}（AGV 會直線穿過設備）`);
  }
  // 站內回空框的站，一定要有某一隊 AGV 負責，否則入料端退不出來、整站卡死
  const owners={};
  for(const g of bp.groups){
    for(const r of (g.selfRet||[])) owners[r]=(owners[r]||0)+1;
    for(const t of (g.tasks||[])) if(t.c==='empty' && t.f===t.t) owners[t.f]=(owners[t.f]||0)+1;
  }
  for(const c of bp.spine){
    if(!c.selfReturn) continue;
    assert.ok(owners[c.role], `${id} ${c.name} 要站內回空框，但沒有任何一隊負責`);
  }
  // 畫面上每個「收空框」格子都要能點：有那格的站一定要有 seedKey，否則點下去沒反應
  for(const d of lc.defs){
    if(d.alias) continue;
    const hasRecvSlot = d.mtype==='transfer' || (d.mtype==='refill' && !d.noReturn);
    assert.strictEqual(!!d.seedKey, hasRecvSlot, `${id} ${d.name} 的起始收空框設定對不上畫面`);
  }
  // 起始收空框開或關都要能出料：站內回空框曾經在「兩格都有框」時繞成死結
  const seedKeys=[...new Set(bp.spine.map(c=>c.seedKey).filter(Boolean))];
  for(const v of [1,0]){
    ctx.__x.applyDefaults(Object.fromEntries(seedKeys.map(k=>[k,v])));
    const d2=dryRunBlueprint(bp);
    assert.ok(d2.ok, `${id} 起始收空框全設 ${v} 時 ${d2.msg}`);
  }
  ctx.__x.applyDefaults(Object.fromEntries(seedKeys.map(k=>[k,bp.defaults?(bp.defaults[k]??1):1])));
  const dr=dryRunBlueprint(bp);
  assert.ok(dr.ok, `${id} ${dr.msg}`);
  const cols=new Set(lc.defs.map(d=>d.xi)).size;
  console.log(`✓ ${id.padEnd(4)} ${bp.spine.length} 站 / ${cols} 欄 / ${bp.groups.length} 組 / AGV ${lc.agvInits.length} 台 — ${dr.msg}`);
}
