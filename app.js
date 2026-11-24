'use strict';
const $=s=>document.querySelector(s), cfg=window.NUTRIAI_CONFIG||{};
const FOODS=[
['Cooked rice',130,2.7,.3,28.2,'米饭 rice ご飯 白米'],['Raw chicken breast',120,22.5,2.6,0,'鸡胸 鸡胸肉 chicken breast 鶏むね'],['Raw skinless chicken thigh',119,19.7,4.5,0,'鸡腿 鸡腿肉 chicken thigh 鶏もも'],['Raw pork tenderloin',120,21.5,3.5,0,'猪肉 里脊 pork 豚肉'],['Raw lean beef',135,21,5.5,0,'牛肉 beef 牛肉'],['Egg white',52,10.9,.2,.7,'蛋清 蛋白 egg white 卵白'],['Whole egg',143,12.6,9.5,.7,'鸡蛋 egg 卵'],['Cooked shrimp',99,24,.3,.2,'虾 shrimp 海老 えび'],['Raw salmon',208,20,13,0,'鲑鱼 三文鱼 salmon 鮭'],['Raw tuna',109,24,.5,0,'金枪鱼 tuna まぐろ'],['Raw spinach',23,2.9,.4,3.6,'菠菜 spinach ほうれん草'],['Raw cabbage',25,1.3,.1,5.8,'卷心菜 cabbage キャベツ'],['Cucumber',15,.7,.1,3.6,'黄瓜 cucumber きゅうり'],['Carrot',41,.9,.2,9.6,'胡萝卜 carrot にんじん'],['Apple',52,.3,.2,13.8,'苹果 apple りんご'],['Banana',89,1.1,.3,22.8,'香蕉 banana バナナ'],['Low-fat milk',46,3.4,1.5,5,'低脂牛奶 milk 牛乳'],['Whole milk',61,3.2,3.3,4.8,'牛奶 milk 牛乳'],['White bread',266,8.9,3.2,49.4,'面包 吐司 bread 食パン'],['Oats',389,16.9,6.9,66.3,'燕麦 oats オートミール'],['Tofu',76,8,4.8,1.9,'豆腐 tofu'],['Potato',77,2,.1,17,'土豆 马铃薯 potato じゃがいも'],['Olive oil',884,0,100,0,'橄榄油 olive oil'],['Cooked pasta',158,5.8,.9,30.9,'意大利面 pasta パスタ'],['Greek yogurt',97,9,5,3.9,'酸奶 yogurt ヨーグルト']
].map((x,i)=>({id:'local-'+i,name,kcal,protein,fat,carbs,terms,source:'Built-in reference',basis:100}));
const dateKey=(d=new Date())=>${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let entries=read('nutriai.entries',[]),targets=read('nutriai.targets',{kcal:1800,protein:160,fat:60,carbs:155}),selected=null,session=read('nutriai.session',null);
const save=()=>{localStorage.setItem('nutriai.entries',JSON.stringify(entries));localStorage.setItem('nutriai.targets',JSON.stringify(targets))};
const round=x=>Math.round(x10)/10;
const nutrition=(f,g)=>({kcal:round(f.kcalg/(f.basis||100)),protein:round(f.proteing/(f.basis||100)),fat:round(f.fatg/(f.basis||100)),carbs:round(f.carbsg/(f.basis||100))});
const totals=items=>items.reduce((a,x)=>{for(const k of ['kcal','protein','fat','carbs'])a[k]+=Number(x[k]||0);return a},{kcal:0,protein:0,fat:0,carbs:0});
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function render(){const today=entries.filter(x=>x.date===dateKey()),t=totals(today);$('#total-kcal').textContent=Math.round(t.kcal);$('#target-kcal').textContent=targets.kcal;$('#cal-progress').style.width=Math.min(100,t.kcal/targets.kcal100)+'%';$('#remaining-text').textContent=t.kcal>targets.kcal?Over goal by ${Math.round(t.kcal-targets.kcal)} kcal:Remaining: ${Math.round(targets.kcal-t.kcal)} kcal;for(const k of ['protein','fat','carbs']){$('#'+k+'-val').textContent=round(t[k])+' g';$('#'+k+'-target').textContent='Goal: '+targets[k]+' g'}const list=$('#meal-list');list.replaceChildren();if(!today.length)list.append(el('p','muted','No food logged yet.'));for(const x of [...today].reverse()){const row=el('div','meal-row'),a=el('div'),b=el('div');a.append(el('strong','',x.name),el('small','',${x.meal} · ${x.grams}${typeof x.grams==='number'?'g':''} · 蛋白 ${x.protein}g · Fat ${x.fat}g · Carbs ${x.carbs}g));b.append(el('strong','',${Math.round(x.kcal)} kcal));const del=el('button','','Delete');del.onclick=()=>{entries=entries.filter(v=>v.id!==x.id);save();render();if(session)api("/api/entry/"+encodeURIComponent(x.id),{method:"DELETE"}).catch(e=>alert("Cloud deletion failed: "+e.message));queueSync()};b.append(del);row.append(a,b);list.append(row)}renderHistory()}
function renderHistory(){const wrap=$('#history-list');wrap.replaceChildren();for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()-i);const key=dateKey(d),day=entries.filter(x=>x.date===key),t=totals(day),row=el('div','history-row');row.append(el('span','',${key} · ${day.length} entries),el('strong','',${Math.round(t.kcal)} kcal / ${round(t.protein)}g 蛋白));wrap.append(row)}}
function choose(f){selected=f;$('#selected-food').classList.remove('hidden');$('#selected-name').textContent=f.name;$('#selected-source').textContent=f.source||'Reference value';preview()}
function preview(){if(!selected)return;const g=Number($('#food-grams').value)||0,n=nutrition(selected,g);$('#food-preview').textContent=${n.kcal} kcal · 蛋白 ${n.protein}g · Fat ${n.fat}g · Carbs ${n.carbs}g}
function addFood(f,g,meal){if(!(g>0&&g<=10000))return alert('Enter a valid weight (1–10000 g)');const n=nutrition(f,g);entries.push({id:crypto.randomUUID(),date:dateKey(),meal,name:f.name,grams:g,source:f.source||'Reference value',...n});save();render();queueSync()}
function showResults(arr){const box=$('#search-results');box.replaceChildren();if(!arr.length){box.append(el('p','muted','No results. Try another name or AI analysis.'));return}for(const f of arr.slice(0,12)){const b=el('button','result'),a=el('span','',f.name),small=el('small','',${Math.round(f.kcal)} kcal/100g);b.append(a,small);b.onclick=()=>{choose(f);box.replaceChildren()};box.append(b)}}
let searchTimer;$('#food-search').addEventListener('input',()=>{const q=$('#food-search').value.trim().toLowerCase();clearTimeout(searchTimer);if(!q){$('#search-results').replaceChildren();return}const local=FOODS.filter(f=>(f.name+' '+f.terms).toLowerCase().includes(q));showResults(local);if(cfg.API_BASE&&q.length>1)searchTimer=setTimeout(async()=>{try{const res=await fetch(cfg.API_BASE+'/api/foods?q='+encodeURIComponent(q));if(!res.ok)return;const data=await res.json();if($('#food-search').value.trim().toLowerCase()===q)showResults([...local,...(data.foods||[])])}catch{}},450)});
$('#food-grams').oninput=preview;$('#add-food').onclick=()=>{if(selected)addFood(selected,Number($('#food-grams').value),$('#meal-type').value)};
for(const b of document.querySelectorAll('.tab'))b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));$('#search-tab').classList.toggle('hidden',b.dataset.tab!=='search');$('#ai-tab').classList.toggle('hidden',b.dataset.tab!=='ai')};
for(const b of document.querySelectorAll('.nav'))b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===b));for(const p of ['today','history','settings'])$('#'+p+'-page').classList.toggle('hidden',p!==b.dataset.page);$('#page-title').textContent={today:'How are you eating today?',history:'Your Food History',settings:'Settings'}[b.dataset.page]};
$('#clear-today').onclick=()=>{if(confirm('Delete all entries for today?')){entries=entries.filter(x=>x.date!==dateKey());save();render();if(session)api('/api/entries/today',{method:'DELETE'}).catch(e=>alert('Cloud deletion failed: '+e.message));queueSync()}};

for (const k of ['kcal', 'protein', 'fat', 'carbs']) {
const input = $('#set-' + k);
if (input) input.value = targets[k];
}
$('#save-targets').onclick=()=>{const obj={};for(const k of ['kcal','protein','fat','carbs'])obj[k]=Number($('#set-'+k).value);if(Object.values(obj).some(x=>!Number.isFinite(x)||x<0)||obj.kcal<500)return alert('Enter valid goals');targets=obj;save();render();queueSync();alert('Goals saved')};
$('#export-btn').onclick=()=>{const rows=[['Date','Meal','Food','Weight (g)','Calories (kcal)','Proteing','Fatg','Carbsg','Source'],...entries.map(x=>[x.date,x.meal,x.name,x.grams,x.kcal,x.protein,x.fat,x.carbs,x.source])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=el('a');a.href=url;a.download='nutriai-food-diary.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function authReady(){return !!(cfg.API_BASE&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)}
function updateAuth(){const logged=!!session?.access_token;$('#logged-in').classList.toggle('hidden',!logged);$('#logged-out').classList.toggle('hidden',logged);$('#account-email').textContent=session?.user?.email||'';$('#mode-pill').textContent=logged?'Cloud Account':'Local mode';$('#sync-status').textContent=logged?'Signed in · Sync available':'Saved on this device';if(!authReady())$('#auth-message').textContent='Cloud services are not configured. Local logging still works.'}
async function authRequest(path,body){const r=await fetch(cfg.SUPABASE_URL+'/auth/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.SUPABASE_ANON_KEY},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.msg||data.error_description||data.message||'Authentication failed');return data}
async function login(mode){if(!authReady())return alert('Cloud accounts are not configured yet');const email=$('#email').value.trim(),password=$('#password').value;if(!email||password.length<8)return alert('Enter an email and a password of at least 8 characters');try{const data=await authRequest(mode==='signup'?'signup':'token?grant_type=password',{email,password});if(data.access_token){session=data;localStorage.setItem('nutriai.session',JSON.stringify(session));updateAuth();await syncCloud();$('#auth-message').textContent='Signed in'}else $('#auth-message').textContent='Sign-up submitted. Check your email to verify your account.'}catch(e){$('#auth-message').textContent=e.message}}
$('#sign-in').onclick=()=>login('login');$('#sign-up').onclick=()=>login('signup');$('#sign-out').onclick=()=>{session=null;localStorage.removeItem('nutriai.session');updateAuth()};
async function refreshSession(){if(!session?.refresh_token||!authReady())return;const data=await authRequest('token?grant_type=refresh_token',{refresh_token:session.refresh_token});session=data;localStorage.setItem('nutriai.session',JSON.stringify(session));updateAuth()}
async function api(path,options={}){if(session?.expires_at&&Date.now()/1000>session.expires_at-60)await refreshSession();if(!cfg.API_BASE)throw Error('AI backend is not configured');const headers={...(options.headers||{})};if(session?.access_token)headers.Authorization='Bearer '+session.access_token;const r=await fetch(cfg.API_BASE+path,{...options,headers});let data;try{data=await r.json()}catch{throw Error('Invalid server response')}if(!r.ok)throw Error(data.error||'Request failed');return data}
async function syncCloud(){if(!session||!authReady())return;try{const data=await api('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entries,targets})});if(data.entries){const ids=new Set(entries.map(x=>x.id));for(const e of data.entries)if(!ids.has(e.id))entries.push(e);save();render()}$('#sync-status').textContent='Cloud sync complete'}catch(e){$('#sync-status').textContent='Sync failed: '+e.message}}
let syncTimeout;function queueSync(){if(!session)return;clearTimeout(syncTimeout);syncTimeout=setTimeout(syncCloud,900)}$('#sync-now').onclick=syncCloud;
$('#delete-account').onclick=async()=>{if(!confirm('Permanently delete your cloud account and records? This cannot be undone.'))return;try{await api('/api/account',{method:'DELETE'});session=null;localStorage.removeItem('nutriai.session');updateAuth();alert('Cloud account deleted. Local records remain until cleared.')}catch(e){alert(e.message)}};
const photoInput = $('#ai-image');
photoInput.accept = 'image/*';
photoInput.setAttribute('capture', 'environment');
let analyzing = false;
async function getImage(file) {
const url = URL.createObjectURL(file);
try {
const img = new Image();
img.src = url;
await img.decode();
const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
const canvas = document.createElement('canvas');
canvas.width = Math.max(1, Math.round(img.width * scale));
canvas.height = Math.max(1, Math.round(img.height * scale));
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
return canvas.toDataURL('image/jpeg', 0.8);
} finally { URL.revokeObjectURL(url); }
}
async function analyzeFood(file = null) {
if (analyzing) return;
const prompt = $('#ai-prompt').value.trim();
const message = $('#ai-message'), out = $('#ai-results');
if (!file && !prompt) return alert('Take a photo or enter a food description.');
if (!cfg.AI_BASE) return alert('AI service is not configured.');
const btn = $('#analyze-btn');
const meal = $('#meal-type').value, date = dateKey();
analyzing = true; btn.disabled = true; photoInput.disabled = true;
message.textContent = 'Analyzing, please wait…'; out.replaceChildren();
try {
const payload = file ? {image: await getImage(file)} : {food: prompt};
const headers = {'Content-Type':'application/json'};
const key = localStorage.getItem('nutriai.personalKey');
if (key) headers.Authorization = 'Bearer ' + key;
const response = await fetch(cfg.AI_BASE.replace(//$/, '') + '/analyze', {
method:'POST', headers, body:JSON.stringify(payload)
});
const data = await response.json();
if (!response.ok) throw Error(data.error || 'Request failed');
if (['calories','protein','fat','carbs'].some(k => typeof data[k] !== 'number' || !Number.isFinite(data[k]) || data[k] < 0)) throw Error('Invalid nutrition data');
const item = el('div','ai-item');
const serving = String(data.serving || 'Estimated serving');
item.append(el('strong','',data.food || prompt || 'Food from photo'), el('p','',${serving} · ${Math.round(data.calories)} kcal · P ${round(data.protein)}g / F ${round(data.fat)}g / C ${round(data.carbs)}g));
const add = el('button','primary','Confirm & Add');
const entry = {id:crypto.randomUUID(),date,meal,name:String(data.food || prompt || 'Food from photo'),grams:serving,kcal:round(data.calories),protein:round(data.protein),fat:round(data.fat),carbs:round(data.carbs),source:file?'AI photo estimate':'AI estimate'};
const commit = () => {
if (entries.some(x=>x.id===entry.id)) return;
entries.push(entry); save(); render(); queueSync();
add.disabled=true; add.textContent='Added';
};
add.onclick=commit;
item.append(add); out.append(item);
if (file) {
commit();
const undo=el('button','','Undo');
undo.onclick=()=>{
entries=entries.filter(x=>x.id!==entry.id); save(); render();
if(session) api('/api/entry/'+encodeURIComponent(entry.id),{method:'DELETE'}).catch(e=>alert('Cloud deletion failed: '+e.message));
queueSync(); undo.disabled=true; add.disabled=false; add.textContent='Confirm & Add';
};
item.append(undo);
}
message.textContent=(file?'Automatically logged — estimated nutrition.':'AI estimate only — check portion sizes before adding.')+(Number.isFinite(data.remaining)? · ${data.remaining} AI analyses remaining today:'');
} catch(e) { message.textContent='Analysis failed: '+e.message; }
finally { analyzing=false; btn.disabled=false; photoInput.disabled=false; photoInput.value=''; }
}
photoInput.addEventListener('change',()=>{const file=photoInput.files[0]; if(file) analyzeFood(file);});
$('#analyze-btn').onclick=()=>analyzeFood();
$('#today-date').textContent=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});updateAuth();render();if(session&&authReady())syncCloud();
