"use client";
import {useEffect,useState} from "react";
type Repo={id:number;full_name:string;category:string;description_vi:string;stars:number|null;forks:number|null;url:string;};
type Page={items:Repo[];total:number;page:number;page_size:number};
const field="w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm";
const fmt=(n:number|null)=>n===null?"—":Intl.NumberFormat("en",{notation:"compact"}).format(n);
export default function Home(){
  const [q,setQ]=useState(""); const [category,setCategory]=useState(""); const [sort,setSort]=useState("stars");
  const [page,setPage]=useState(1); const [data,setData]=useState<Page|null>(null); const [categories,setCategories]=useState<string[]>([]);
  const [error,setError]=useState(""); const [loading,setLoading]=useState(true); const [favorites,setFavorites]=useState<number[]>([]);
  useEffect(()=>{try{const v=JSON.parse(localStorage.getItem("repo-favorites")||"[]"); if(Array.isArray(v))setFavorites(v.filter(Number.isInteger));}catch{} fetch("/api/repositories/categories").then(r=>{if(!r.ok)throw Error();return r.json()}).then(setCategories).catch(()=>{});},[]);
  useEffect(()=>{const c=new AbortController(); setLoading(true);setError(""); const t=setTimeout(async()=>{try{const query=new URLSearchParams({q,category,sort,page:String(page)});const r=await fetch("/api/repositories?"+query,{signal:c.signal});if(!r.ok)throw Error();setData(await r.json());}catch{if(!c.signal.aborted)setError("Không kết nối được API. Kiểm tra Docker Compose.");}finally{if(!c.signal.aborted)setLoading(false);}},200);return()=>{clearTimeout(t);c.abort();};},[q,category,sort,page]);
  function toggle(id:number){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);try{localStorage.setItem("repo-favorites",JSON.stringify(next));}catch{}}
  return <main className="mx-auto max-w-6xl p-5 md:py-10"><section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
    <h1 className="text-3xl font-bold tracking-tight">AI Repository Library</h1><p className="mt-3 text-sm text-neutral-500">Khám phá công cụ, skills và dự án AI mã nguồn mở.</p>
    <div className="mt-5 space-y-3"><input aria-label="Tìm repository" className={field} placeholder="Tìm kiếm repository..." value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/>
    <div className="grid gap-3 sm:grid-cols-2"><select aria-label="Danh mục" className={field} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">Mọi danh mục</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
    <select aria-label="Sắp xếp" className={field} value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="stars">Nhiều stars nhất</option><option value="forks">Nhiều forks nhất</option><option value="updated">Mới cập nhật</option><option value="name">Tên A–Z</option></select></div></div>
    <p className="my-4 text-sm text-neutral-500" aria-live="polite">{loading?"Đang tải…":error||((data?.total??0)+" repository · Catalog khởi tạo")}</p>
    {!error&&<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.items.map(r=><article key={r.id} className="flex min-h-44 flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between text-xs text-neutral-500"><span>{r.category}</span><button aria-label="Yêu thích" aria-pressed={favorites.includes(r.id)} onClick={()=>toggle(r.id)}>{favorites.includes(r.id)?"♥":"♡"}</button></div>
      <a className="font-semibold break-words" href={"/repositories/"+r.id}>{r.full_name}</a><p className="grow text-sm text-neutral-600">{r.description_vi}</p>
      <div className="text-xs text-neutral-600">★ {fmt(r.stars)}　⑂ {fmt(r.forks)}</div><a className="rounded-full border border-neutral-200 py-1.5 text-center text-sm text-neutral-600" href={r.url} target="_blank" rel="noreferrer">Xem trên GitHub ↗</a>
    </article>)}</div>}
    <div className="mt-5 flex items-center justify-center gap-4 text-sm"><button disabled={page<=1||loading} onClick={()=>setPage(page-1)}>← Trước</button><span>Trang {page} / {Math.max(1,Math.ceil((data?.total??0)/12))}</span><button disabled={loading||page*12>=(data?.total??0)} onClick={()=>setPage(page+1)}>Sau →</button></div>
  </section></main>;
}
