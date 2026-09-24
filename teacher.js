import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, onValue, get, set, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";
const app=initializeApp(FIREBASE_CONFIG); const db=getDatabase(app);
const CLASS_ID="default-class";
const cfgRef=ref(db,`classes/${CLASS_ID}/settings`);
const today=()=>new Date().toISOString().slice(0,10);
const toMin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const toast=msg=>{const e=document.getElementById("toast");e.textContent=msg;e.classList.remove("hidden");setTimeout(()=>e.classList.add("hidden"),2600)};

const DEFAULT_NAMES=Array.from({length:29},(_,i)=>`دانش‌آموز ${i+1}`);
const namesRef=ref(db,`classes/${CLASS_ID}/names`);
const recordsRef=()=>ref(db,`classes/${CLASS_ID}/records/${today()}`);
let settings={start:"08:00",end:"08:30",open:true}, names=DEFAULT_NAMES;
function render(){
 document.getElementById("start").value=settings.start;document.getElementById("end").value=settings.end;
 document.getElementById("switch").textContent=settings.open?"بستن حضور":"باز کردن حضور";document.getElementById("switch").className=settings.open?"danger":"";
 const n=nowMin(), live=settings.open&&n>=toMin(settings.start)&&n<=toMin(settings.end);
 const ls=document.getElementById("liveStatus");ls.className="status "+(live?"open":"closed");ls.textContent=live?"🟢 پنجره حضور باز است":"🔴 پنجره حضور بسته است";
 document.getElementById("date").textContent="امروز: "+new Date().toLocaleDateString("fa-IR");
 document.getElementById("studentLink").textContent=location.href.replace("teacher.html","student.html");
 const namesBox=document.getElementById("names");namesBox.innerHTML=names.map((x,i)=>`<div class="name-item"><span>${i+1}.</span><input data-i="${i}" value="${x||""}" placeholder="نام دانش‌آموز"></div>`).join("");
}
function renderRecords(data){
 const rec=data||{};let present=0,late=0;const list=document.getElementById("list");list.innerHTML="";
 names.forEach((name,i)=>{const r=rec[i];let cls="notset",txt="ثبت نشده";if(r){if(Number(r.late)>0){late++;cls="late";txt=`تأخیر ${r.late} دقیقه • ${r.time}`}else{present++;cls="present";txt=`حضور • ${r.time}`}}
 const row=document.createElement("div");row.className="student-row";row.innerHTML=`<b>${name||`دانش‌آموز ${i+1}`}</b><span class="badge ${cls}">${txt}</span>`;list.appendChild(row)});
 document.getElementById("count").textContent=`حاضر: ${present} | تأخیر: ${late} | ثبت‌نشده: ${29-present-late}`;
}
onValue(cfgRef,s=>{settings=s.val()||settings;render()});
onValue(namesRef,s=>{names=s.val()||DEFAULT_NAMES;render()});
onValue(recordsRef(),s=>renderRecords(s.val()));
document.getElementById("loginBtn").onclick=()=>{if(document.getElementById("pass").value==="19121912"){document.getElementById("login").classList.add("hidden");document.getElementById("dashboard").classList.remove("hidden");render()}else toast("رمز پنل اشتباه است.")};
document.getElementById("saveTime").onclick=async()=>{const a=document.getElementById("start").value,b=document.getElementById("end").value;if(!a||!b||toMin(b)<toMin(a)){toast("ساعت‌ها را درست وارد کنید.");return}settings={...settings,start:a,end:b};await set(cfgRef,settings);toast("زمان ذخیره شد.")};
document.getElementById("switch").onclick=async()=>{settings.open=!settings.open;await set(cfgRef,settings);toast(settings.open?"حضور و غیاب باز شد.":"حضور و غیاب بسته شد.")};
document.getElementById("reset").onclick=async()=>{if(confirm("ثبت‌های امروز پاک شوند؟")){await remove(recordsRef());toast("ثبت‌های امروز پاک شد.")}};
document.getElementById("saveNames").onclick=async()=>{const vals=[...document.querySelectorAll("#names input")].map(x=>x.value.trim());while(vals.length<29)vals.push("");await set(namesRef,vals);names=vals;toast("نام‌ها ذخیره شدند.")};
document.getElementById("copyLink").onclick=async()=>{try{await navigator.clipboard.writeText(document.getElementById("studentLink").textContent);toast("لینک کپی شد.")}catch(e){toast("لینک را دستی کپی کنید.")}};
