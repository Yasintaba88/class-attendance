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

const namesRef=ref(db,`classes/${CLASS_ID}/names`);
const recRef=()=>ref(db,`classes/${CLASS_ID}/records/${today()}`);
let settings={start:"08:00",end:"08:30",open:true}, names=[];
function render(){
 document.getElementById("date").textContent="امروز: "+new Date().toLocaleDateString("fa-IR");
 document.getElementById("window").textContent=`${settings.start} تا ${settings.end}`;
 const ok=settings.open && nowMin()>=toMin(settings.start) && nowMin()<=toMin(settings.end);
 const st=document.getElementById("status"); st.className="status "+(ok?"open":"closed"); st.textContent=ok?"🟢 حضور و غیاب باز است":"🔴 حضور و غیاب بسته است";
}
onValue(cfgRef,s=>{settings=s.val()||settings;render()});
onValue(namesRef,s=>{names=s.val()||Array.from({length:29},(_,i)=>`دانش‌آموز ${i+1}`);const el=document.getElementById("name");el.innerHTML='<option value="">انتخاب نام</option>'+names.map((n,i)=>`<option value="${i}">${n||`دانش‌آموز ${i+1}`}</option>`).join("")});
onValue(recRef(),s=>{const id=document.getElementById("name").value;const r=(s.val()||{})[id];const box=document.getElementById("myStatus");if(!r){box.className="status notset";box.textContent="هنوز حضور شما ثبت نشده است"}else{box.className="status "+(r.late>0?"late":"present");box.textContent=r.late>0?`🟠 حضور ثبت شد — ${r.late} دقیقه تأخیر`:`✅ حضور شما ثبت شد — ${r.time}`}});
document.getElementById("name").onchange=()=>{};
document.getElementById("submit").onclick=async()=>{
 const id=document.getElementById("name").value;if(id===""){toast("لطفاً نام خود را انتخاب کنید.");return}
 const s=(await get(cfgRef)).val()||settings;const n=nowMin();if(!s.open||n<toMin(s.start)||n>toMin(s.end)){toast("در حال حاضر زمان ثبت حضور باز نیست.");return}
 const path=ref(db,`classes/${CLASS_ID}/records/${today()}/${id}`);if((await get(path)).exists()){toast("حضور شما قبلاً ثبت شده است.");return}
 const late=Math.max(0,n-toMin(s.start));await set(path,{name:names[id]||`دانش‌آموز ${Number(id)+1}`,time:new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}),late,serverTime:serverTimestamp()});toast("حضور شما با موفقیت ثبت شد.");
};
render();setInterval(render,15000);
