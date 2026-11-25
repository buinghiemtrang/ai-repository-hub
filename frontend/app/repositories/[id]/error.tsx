"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){
  return <main className="mx-auto max-w-3xl p-6"><a href="/">← Thư viện</a><h1 className="mt-4 text-xl font-semibold">Không tải được chi tiết repository</h1><button className="mt-4 rounded-full border px-4 py-2" onClick={reset}>Thử lại</button></main>;
}
