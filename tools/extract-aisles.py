# -*- coding: utf-8 -*-
"""從 H05 5F PLS 平面圖抽出綠色 AGV 走道，建圖，算出各站之間的實際路徑。"""
import fitz, math, collections, itertools, json, sys, io
sys.stdout=io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
PDF=r'D:\沈育輝20241008\AGV台車\欣興5F\H05 5F PLS自動化評估.pdf'
GREEN=(0.0,1.0,0.0)
T=lambda x,y:(1.011*y+6.5, 594-0.993*x)   # 頁面 rotate 270 → 轉正

# 1) 收集綠色的水平/垂直微線段，依共線合併成走道
H=collections.defaultdict(list); V=collections.defaultdict(list)
for dr in fitz.open(PDF)[0].get_drawings():
    c=dr.get('color')
    if not c or tuple(round(v,2) for v in c)!=GREEN: continue
    for it in dr['items']:
        if it[0]!='l': continue
        x1,y1,x2,y2=it[1].x,it[1].y,it[2].x,it[2].y
        if abs(y1-y2)<0.05: H[round((y1+y2)/2,1)].append((min(x1,x2),max(x1,x2)))
        elif abs(x1-x2)<0.05: V[round((x1+x2)/2,1)].append((min(y1,y2),max(y1,y2)))
def runs(d,gap=8.0,minlen=3):
    out=[]
    for k,iv in d.items():
        iv.sort(); cs,ce=iv[0]
        for s,e in iv[1:]:
            if s<=ce+gap: ce=max(ce,e)
            else:
                if ce-cs>=minlen: out.append([k,cs,ce]); 
                cs,ce=s,e
        if ce-cs>=minlen: out.append([k,cs,ce])
    return out
def fuse(rs,ktol=3.0,gap=45.0):      # 同一條走道的多重描線/斷點合併
    rs.sort(); out=[]
    for k,a,b in rs:
        hit=None
        for o in out:
            if abs(o[0]-k)<=ktol and a<=o[2]+gap and b>=o[1]-gap: hit=o; break
        if hit: hit[0]=(hit[0]+k)/2; hit[1]=min(hit[1],a); hit[2]=max(hit[2],b)
        else: out.append([k,a,b])
    return out
segs=[]
for k,a,b in fuse(runs(H)): segs.append([*T(a,k), *T(b,k)])
for k,a,b in fuse(runs(V)): segs.append([*T(k,a), *T(k,b)])
segs=[[round(v,1) for v in s] for s in segs]
# 同一條走道被 CAD 切斷時（同軸、間距小）補回連接段，否則最短路徑會繞遠路
def stitch(segs, ktol=6.0, maxgap=110.0):
    add=[]
    for i,a in enumerate(segs):
        for j,b in enumerate(segs):
            if i>=j: continue
            aH=abs(a[1]-a[3])<1.0; bH=abs(b[1]-b[3])<1.0
            if aH!=bH: continue
            if aH:
                if abs((a[1]+a[3])/2-(b[1]+b[3])/2)>ktol: continue
                a0,a1=sorted((a[0],a[2])); b0,b1=sorted((b[0],b[2])); y=(a[1]+b[1])/2
                gap = b0-a1 if b0>a1 else (a0-b1 if a0>b1 else -1)
                if 0<gap<maxgap: add.append([min(a1,b1),y,max(a0,b0),y])
            else:
                if abs((a[0]+a[2])/2-(b[0]+b[2])/2)>ktol: continue
                a0,a1=sorted((a[1],a[3])); b0,b1=sorted((b[1],b[3])); x=(a[0]+b[0])/2
                gap = b0-a1 if b0>a1 else (a0-b1 if a0>b1 else -1)
                if 0<gap<maxgap: add.append([x,min(a1,b1),x,max(a0,b0)])
    return segs+[[round(v,1) for v in s] for s in add]
segs=stitch(segs)

# 2) 建圖：每條線切在交點與投影點上
SNAP=5.0
pts=[]
def nid(x,y):
    for i,(px,py) in enumerate(pts):
        if abs(px-x)<SNAP and abs(py-y)<SNAP: return i
    pts.append([x,y]); return len(pts)-1
isH=lambda s: abs(s[1]-s[3])<1.0
cuts=[[(s[0],s[1]),(s[2],s[3])] for s in segs]
for i,a in enumerate(segs):
    for j,b in enumerate(segs):
        if i>=j or isH(a)==isH(b): continue
        hh,vv=(a,b) if isH(a) else (b,a)
        hy=(hh[1]+hh[3])/2; hx0,hx1=sorted((hh[0],hh[2]))
        vx=(vv[0]+vv[2])/2; vy0,vy1=sorted((vv[1],vv[3]))
        if hx0-SNAP<=vx<=hx1+SNAP and vy0-SNAP<=hy<=vy1+SNAP:
            cuts[i].append((vx,hy)); cuts[j].append((vx,hy))

# 站別：投影到最近的走道線上，成為進出點
RAW={0:(528,228),1:(549,139),2:(320,143),4:(35,137),5:(323,467),
     6:(309,349),7:(538,316),3:(358,169),8:(445,372),9:(158,493)}   # key=欄位 xi
ST={k:T(*v) for k,v in RAW.items()}
def proj(p,s):
    ax,ay,bx,by=s; dx,dy=bx-ax,by-ay; L2=dx*dx+dy*dy
    t=0 if L2==0 else max(0,min(1,((p[0]-ax)*dx+(p[1]-ay)*dy)/L2))
    return (ax+t*dx, ay+t*dy)
access={}
for k,p in ST.items():
    best=min(((math.dist(p,proj(p,s)),si,proj(p,s)) for si,s in enumerate(segs)))
    access[k]=best; cuts[best[1]].append(best[2])   # 投影點仍加入，讓走道在該處斷開

edges=set()
for i,s in enumerate(segs):
    order=(lambda q:q[0]) if isH(s) else (lambda q:q[1])
    cs=sorted(set(cuts[i]), key=order)
    ids=[nid(x,y) for x,y in cs]
    for a,b in zip(ids,ids[1:]):
        if a!=b: edges.add((min(a,b),max(a,b)))

# 3) 接上斷開的部分：反覆把兩個連通塊之間最近的一對點連起來
def comps():
    adj=collections.defaultdict(list)
    for a,b in edges: adj[a].append(b); adj[b].append(a)
    seen={}; cid=0
    for s in range(len(pts)):
        if s in seen: continue
        st=[s]; seen[s]=cid
        while st:
            x=st.pop()
            for y in adj[x]:
                if y not in seen: seen[y]=cid; st.append(y)
        cid+=1
    return seen,cid
bridged=0
while True:
    seen,nc=comps()
    if nc<=1: break
    grp=collections.defaultdict(list)
    for n,c in seen.items(): grp[c].append(n)
    main=max(grp.values(),key=len)
    others=[n for c,g in grp.items() for n in g if g is not main]
    cand=min(((math.dist(pts[a],pts[b]),a,b) for a in main for b in others), default=None)
    if not cand or cand[0]>95: break
    edges.add((min(cand[1],cand[2]),max(cand[1],cand[2]))); bridged+=1
seen,nc=comps()
sizes=collections.Counter(seen.values())
print('走道 %d 段 / 節點 %d / 邊 %d / 橋接 %d / 連通塊 %d（最大 %d）'
      %(len(segs),len(pts),len(edges),bridged,nc,sizes.most_common(1)[0][1]))

# 4) 最短路徑
adj=collections.defaultdict(list)
for a,b in edges:
    w=math.dist(pts[a],pts[b]); adj[a].append((b,w)); adj[b].append((a,w))
import heapq
def sp(s,t):
    dist={s:0}; prev={}; pq=[(0,s)]
    while pq:
        d,n=heapq.heappop(pq)
        if n==t: break
        if d>dist.get(n,1e18): continue
        for m,w in adj[n]:
            nd=d+w
            if nd<dist.get(m,1e18): dist[m]=nd; prev[m]=n; heapq.heappush(pq,(nd,m))
    if t not in dist: return None,None
    path=[t]
    while path[-1]!=s: path.append(prev[path[-1]])
    return [pts[i] for i in reversed(path)], dist[t]
def simplify(p, tol=2.5):
    # 去掉共線/幾乎共線的中間點，讓路徑只留真正的轉角
    out=[p[0]]
    for i in range(1,len(p)-1):
        a,b,c=out[-1],p[i],p[i+1]
        cross=abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))
        base=math.dist(a,c)
        if base<1e-6 or cross/base>tol: out.append(b)
    out.append(p[-1])
    return out
# 站別自己是一個節點，接到最近的 K 個走道節點，由最短路徑決定實際從哪邊上路
NAISLE=len(pts)
node={}
for k,p in sorted(ST.items()):
    pts.append([p[0],p[1]]); node[k]=len(pts)-1
    near=sorted(range(NAISLE), key=lambda i: math.dist(pts[i],p))[:4]
    for i in near:
        w=math.dist(pts[i],p); adj[node[k]].append((i,w)); adj[i].append((node[k],w))
missing=[]
res={}
for a,b in itertools.combinations(sorted(ST),2):
    pth,L=sp(node[a],node[b])
    if pth is None: missing.append((a,b)); continue
    pth=simplify(pth)
    res['%d_%d'%(a,b)]={'pts':[[round(x,1),round(y,1)] for x,y in pth],'len':round(L,1),
                        'straight':round(math.dist(ST[a],ST[b]),1)}
print('站→走道 投影距離:', {k:round(access[k][0],1) for k in sorted(access)})
print('無路徑:', missing or '無')
for k in sorted(res, key=lambda k:-res[k]['len'])[:6]:
    r=res[k]; print('  %-6s 走道 %6.1f  直線 %6.1f  繞行 %.2fx  轉折 %d'%(k,r['len'],r['straight'],r['len']/max(1,r['straight']),len(r['pts'])))

# 5) 輸出成給 index.html 直接用的 JS（file:// 下不能 fetch，所以做成 script 檔）
out={'segs':segs,'paths':{k:{'p':v['pts'],'len':v['len']} for k,v in res.items()}}
hdr=('// 由 tools/extract-aisles.py 從 H05 5F PLS 平面圖抽出的 AGV 走道與站間最短路徑\n'
     '// 座標＝畫布方向的 PDF pt；重新產生： python tools/extract-aisles.py\n')
open('ui/aisles-h05.js','w',encoding='utf-8').write(hdr+'const PLS_AISLES='+json.dumps(out,separators=(',',':'))+';\n')
print('已寫入 ui/aisles-h05.js')
