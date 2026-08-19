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
  + ';globalThis.__x={BLUEPRINTS,validateBlueprint,dryRunBlueprint,GRP_CLR,srcRecvFree,buildLineConfig,applyDefaults:d=>Object.assign(P,d)};';
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
  const dr=dryRunBlueprint(bp);
  assert.ok(dr.ok, `${id} ${dr.msg}`);
  const cols=new Set(lc.defs.map(d=>d.xi)).size;
  console.log(`✓ ${id.padEnd(4)} ${bp.spine.length} 站 / ${cols} 欄 / ${bp.groups.length} 組 / AGV ${lc.agvInits.length} 台 — ${dr.msg}`);
}
