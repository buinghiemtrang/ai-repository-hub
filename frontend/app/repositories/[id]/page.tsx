import {notFound} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Detail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^\d+$/.test(id))notFound();
  const res=await fetch((process.env.API_URL||"http://localhost:8000")+"/repositories/"+id,{cache:"no-store"});
  if(res.status===404)notFound();if(!res.ok)throw Error("API unavailable");
  const r=await res.json();
  return <main className="mx-auto max-w-3xl p-6"><a href="/" className="text-sm text-neutral-600">← Thư viện</a><article className="mt-4 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"><p className="text-sm text-neutral-500">{r.category}</p><h1 className="text-3xl font-bold break-words">{r.full_name}</h1><p>{r.description_vi}</p><p>Stars: {r.stars??"Chưa đồng bộ"} · Forks: {r.forks??"Chưa đồng bộ"}</p><p>License: {r.license??"Chưa xác minh"}</p><h2 className="text-xl font-semibold">Hướng dẫn cài đặt</h2><p className="text-neutral-600">Chưa biên soạn. Kiểm tra README và yêu cầu hệ thống ở repository gốc trước khi chạy bất kỳ lệnh nào.</p><a className="inline-block rounded-full border px-4 py-2" href={r.url} target="_blank" rel="noreferrer">GitHub / README ↗</a></article></main>;
}
