import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
type Repo={category:string;full_name:string;description_vi:string;description_upstream:string|null;stars:number|null;forks:number|null;watchers:number|null;license:string|null;synced_at:string|null;updated_at:string|null;url:string;source_urls:string[]|null};
const date=(v:string|null)=>v?new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(v)):"Chưa xác minh";
export default async function Detail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^\d+$/.test(id))notFound();
  const res=await fetch((process.env.API_URL||"http://localhost:8000")+"/repositories/"+id,{cache:"no-store"});
  if(res.status===404)notFound();if(!res.ok)throw Error("API unavailable");
  const r:Repo=await res.json();
  return <main className="mx-auto max-w-3xl p-6"><a href="/" className="text-sm text-neutral-600">← Thư viện</a><article className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"><p className="text-sm text-neutral-500">{r.category}</p><h1 className="text-3xl font-bold break-words">{r.full_name}</h1><p>{r.description_vi}</p>
  {r.description_upstream&&<p className="text-sm text-neutral-600">{r.description_upstream}</p>}
  <p>Stars: {r.stars??"—"} · Forks: {r.forks??"—"} · Watchers: {r.watchers??"—"}</p><p>License: {r.license??"Chưa xác minh"}</p><p className="text-sm text-neutral-600">Cập nhật upstream: {date(r.updated_at)} · Đồng bộ: {date(r.synced_at)}</p>
  <h2 className="text-xl font-semibold">Hướng dẫn cài đặt</h2><p className="text-neutral-600">Chưa biên soạn. Kiểm tra README và yêu cầu hệ thống ở repository gốc trước khi chạy bất kỳ lệnh nào.</p><a className="inline-block rounded-full border px-4 py-2" href={r.url} target="_blank" rel="noreferrer">GitHub / README ↗</a>
  <h2 className="text-xl font-semibold">Nguồn dữ liệu</h2>{r.source_urls?.length?<ul className="space-y-2 text-sm">{r.source_urls.filter(x=>x.startsWith("https://")).map(x=><li key={x}><a className="break-all underline" href={x} target="_blank" rel="noreferrer">{x}</a></li>)}</ul>:<p className="text-sm text-neutral-600">Seed khởi tạo; chưa có nguồn discovery được xác minh.</p>}
  </article></main>;
}
