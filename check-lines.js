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
  + 'planSrcFromBlueprint,peCompile,peBuildAisles,peLint,planCardGeom,setPeState:v=>{peState=v},applyDefaults:d=>Object.assign(P,d)};';
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

// 機台佔地 + 入料側：AGV 停在入料側那一邊，走道距離要跟著變；設定也要能存進去再讀回來
{
  const {peBuildAisles,peCompile,planSrcFromBlueprint,setPeState}=ctx.__x;
  const mk=face=>({secPerUnit:0.1, planScale:1, name:'面向測試', batch:1, color:'#2e8b57', pick:10, drop:10,
    teams:[{name:'G1',n:2}],
    tasks:[{f:0,t:1,c:'full'},{f:1,t:2,c:'full'},{f:2,t:1,c:'empty'}],
    stns:[{name:'上料',type:'src',     val:120,n:1,empty:'',x:100,y:600, w:200,h:100, face},
          {name:'加工',type:'transfer',val:180,n:1,empty:'self',x:500,y:600, w:60,h:40, face:'S'},
          {name:'換框',type:'changer', val:120,n:1,empty:'',x:900,y:600, w:60,h:40, face:'S'}],
    aisles:[[[100,700],[900,700]]]});
  const lenOf=face=>{ setPeState(mk(face)); const P=peBuildAisles(); return P['0_2'].len; };
  const south=lenOf('S'), north=lenOf('N'), none=lenOf('');
  // 入料側朝走道(下) vs 背對走道(上)：多繞的正好是機台的高度 100
  assert.strictEqual(north-south, 100, `入料側沒影響走道距離（下 ${south} / 上 ${north}）`);
  assert.strictEqual(none-south, 50,  `沒設入料側時應該從機台正中接走道（正中 ${none} / 下 ${south}）`);
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
  console.log(`✓ 機台佔地   200x100 的機台，入料側朝走道 ${south} / 背對走道 ${north} / 未設 ${none} — 長寬與入料側存得回來`);
}

// 機台格位排法：入滿框／收空框在入料側，中間拿料位／放置位，對側退空框／出滿框
{
  const {planCardGeom}=ctx.__x;
  const box=face=>({x:1000, y:1000, w:240, h:180, face});
  // 深度方向（入料側→對側）的座標軸與正負號
  const ax={N:[1,1], S:[1,-1], W:[0,1], E:[0,-1]};
  for(const f of ['N','S','W','E']){
    const b=box(f), {slots}=planCardGeom(b,'transfer');
    const [d,sg]=ax[f], cr=1-d;                       // d＝深度軸、cr＝橫向軸
    const dep=k=>slots[k][d]*sg, crs=k=>slots[k][cr];
    // 三段深度：入料側 → 中間 → 對側
    for(const lane of [['in_full','in_proc','in_ret'],['out_recv','out_proc','out_full']])
      assert.ok(dep(lane[0])<dep(lane[1]) && dep(lane[1])<dep(lane[2]),
        `入料側=${f} 時 ${lane.join('→')} 沒有由入料側往對側排`);
    // 入滿框與收空框同一段深度（都貼在入料側），拿料位／放置位同一段，退空框／出滿框同一段
    for(const [a,c] of [['in_full','out_recv'],['in_proc','out_proc'],['in_ret','out_full']]){
      assert.strictEqual(Math.round(dep(a)), Math.round(dep(c)), `入料側=${f} 時 ${a} 與 ${c} 不同一排`);
      assert.notStrictEqual(Math.round(crs(a)), Math.round(crs(c)), `入料側=${f} 時 ${a} 與 ${c} 疊在一起`);
    }
    // 入料側那一排要真的貼在入料側那條邊上（在框內、離邊 1/4 深度以內）
    const half=(d===1?b.h:b.w)/2;
    assert.ok(Math.abs(dep('in_full')-(1000*sg-half))<half*0.6, `入料側=${f} 時入滿框沒靠在入料側`);
  }
  // 沒有出料端的站（人員投料／換框機）只有一排，也要照同樣順序
  const {slots:rs}=planCardGeom(box('N'),'refill');
  assert.ok(rs.recv[1]<rs.proc[1] && rs.proc[1]<rs.out[1], '人員投料站的格位順序不對');
  const {slots:cs}=planCardGeom(box('E'),'changer');
  assert.ok(cs.in_full[0]>cs.in_proc[0] && cs.in_proc[0]>cs.in_ret[0], '換框機（入料側在右）的格位順序不對');
  console.log('✓ 機台格位   入料側在上/下/左/右四種擺法，入滿框＋收空框都貼入料側、中間拿料/放置、對側退空/出滿');
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
  assert.strictEqual(Object.keys(cp.layout.paths||{}).length,
                     Object.keys(pls.layout.paths||{}).length, 'PLS 複本掉了走道路徑');
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
