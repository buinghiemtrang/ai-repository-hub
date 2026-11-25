import {NextRequest,NextResponse} from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{parts?:string[]}>}){
  const {parts=[]}=await params;
  if(parts.length>1 || (parts.length===1 && !/^(categories|[0-9]+)$/.test(parts[0]))) return NextResponse.json({error:"Not found"},{status:404});
  const base=process.env.API_URL || "http://localhost:8000";
  try{
    const res=await fetch(base+"/repositories"+(parts.length?"/"+parts[0]:"")+req.nextUrl.search,{cache:"no-store"});
    return NextResponse.json(await res.json(),{status:res.status});
  }catch{
    return NextResponse.json({error:"Backend unavailable"},{status:503});
  }
}
