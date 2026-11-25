"use client";
import {useEffect,useState} from "react";
type Repo={id:number;full_name:string;category:string;description_vi:string;stars:number|null;forks:number|null;watchers:number|null;url:string;synced_at:string|null};
type Page={items:Repo[];total:number;page:number;page_size:number};
const field="w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm";
const fmt=(n:number|null)=>n===null?"—":Intl.NumberFormat("en",{notation:"compact"}).format(n);
export default function Home(){
  const [q,setQ]=useState("");const [category,setCategory]=useState("");const [sort,setSort]=useState("stars");
  const [page,setPage]=useState(1);const [data,setData]=useState<Page|null>(null);const [categories,setCategories]=useState<string[]>([]);
  const [error,setError]=useState("");const [loading,setLoading]=useState(true);const [favorites,setFavorites]=useState<number[]>([]);
  const [onlyFavorites,setOnlyFavorites]=useState(false);const [retry,setRetry]=useState(0);
  useEffect(()=>{try{const v=JSON.parse(localStorage.getItem("repo-favorites")||"[]");if(Array.isArray(v))setFavorites(v.filter(x=>Number.isInteger(x)&&x>0).slice(0,500));}catch{}},[]);
  useEffect(()=>{const c=new AbortController();fetch("/api/repositories/categories",{signal:c.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setCategories).catch(()=>{});return()=>c.abort();},[retry]);
  const favoriteQuery=onlyFavorites?favorites.join(","):null;
  useEffect(()=>{const c=new AbortController();setLoading(true);setError("");const t=setTimeout(async()=>{try{
    const query=new URLSearchParams({q,category,sort,page:String(page)});if(favoriteQuery!==null)query.set("favorite_ids",favoriteQuery);
    const r=await fetch("/api/repositories?"+query,{signal:c.signal});if(!r.ok)throw Error();setData(await r.json());
    }catch{if(!c.signal.aborted)setError("Không kết nối được API. Kiểm tra Docker Compose.");}finally{if(!c.signal.aborted)setLoading(false);}},200);
    return()=>{clearTimeout(t);c.abort();};},[q,category,sort,page,favoriteQuery,retry]);
  function toggle(id:number){if(!favorites.includes(id)&&favorites.length>=500)return;const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);if(onlyFavorites)setPage(1);try{localStorage.setItem("repo-favorites",JSON.stringify(next));}catch{}}
  function reset(){setQ("");setCategory("");setSort("stars");setOnlyFavorites(false);setPage(1);}
  return <main className="mx-auto max-w-6xl p-5 md:py-10"><section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
    <h1 className="text-3xl font-bold tracking-tight">AI Repository Library</h1><p className="mt-3 text-sm text-neutral-500">Khám phá công cụ, skills và dự án AI mã nguồn mở.</p>
    <div className="mt-5 space-y-3"><input aria-label="Tìm repository" className={field} placeholder="Tìm kiếm repository..." value={q} maxLength={200} onChange={e=>{setQ(e.target.value);setPage(1);}}/>
    <div className="grid gap-3 sm:grid-cols-2"><select aria-label="Danh mục" className={field} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">Mọi danh mục</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
    <select aria-label="Sắp xếp" className={field} value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="stars">Nhiều stars nhất</option><option value="forks">Nhiều forks nhất</option><option value="updated">Mới cập nhật</option><option value="name">Tên A–Z</option></select></div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={onlyFavorites} onChange={e=>{setOnlyFavorites(e.target.checked);setPage(1);}}/>Yêu thích ({favorites.length})</label><button className="text-neutral-600 underline" onClick={reset}>Đặt lại bộ lọc</button></div></div>
    <p className="my-4 text-sm text-neutral-500" aria-live="polite">{loading?"Đang tải…":error||((data?.total??0)+" repository")}</p>
    {error&&<button onClick={()=>setRetry(x=>x+1)} className="rounded-full border px-4 py-2 text-sm">Thử lại</button>}
    {!error&&!loading&&data?.items.length===0&&<div className="rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-600">Không tìm thấy repository phù hợp.</div>}
    {!error&&!loading&&<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.items.map(r=><article key={r.id} className="flex min-h-44 flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between text-xs text-neutral-500"><span>{r.category}</span><button aria-label={favorites.includes(r.id)?"Bỏ yêu thích":"Yêu thích"} aria-pressed={favorites.includes(r.id)} onClick={()=>toggle(r.id)}>{favorites.includes(r.id)?"♥":"♡"}</button></div>
      <a className="font-semibold break-words" href={"/repositories/"+r.id}>{r.full_name}</a><p className="grow text-sm text-neutral-600">{r.description_vi}</p>
      <div className="flex flex-wrap gap-3 text-xs text-neutral-600"><span title="Stars">★ {fmt(r.stars)}</span><span title="Forks">⑂ {fmt(r.forks)}</span><span title="Watchers">◉ {fmt(r.watchers)}</span></div>
      {!r.synced_at&&<p className="text-xs text-neutral-500">Chưa đồng bộ metadata</p>}
      <a className="rounded-full border border-neutral-200 py-1.5 text-center text-sm text-neutral-600" href={r.url} target="_blank" rel="noreferrer">Xem trên GitHub ↗</a>
    </article>)}</div>}
    <div className="mt-5 flex items-center justify-center gap-4 text-sm"><button disabled={page<=1||loading} onClick={()=>setPage(page-1)}>← Trước</button><span>Trang {page} / {Math.max(1,Math.ceil((data?.total??0)/12))}</span><button disabled={loading||page*12>=(data?.total??0)} onClick={()=>setPage(page+1)}>Sau →</button></div>
  </section></main>;
}
