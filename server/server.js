const fs=require('fs');
const path=require('path');
const http=require('http');
const express=require('express');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const {WebSocketServer}=require('ws');

const SUPPORT_FILE=path.join(__dirname,'data','support.json');
function supportConfig(){
  try{return JSON.parse(fs.readFileSync(SUPPORT_FILE,'utf8'))}catch(_){return {}}
}
const SUPPORT_CFG=supportConfig();
const SUPPORT_WALLET=process.env.SUPPORT_WALLET||String(SUPPORT_CFG.wallet||'');
const SUPPORT_CARD=process.env.SUPPORT_CARD||String(SUPPORT_CFG.card||'');
const VIP_MIN_AMOUNT=Number(process.env.VIP_MIN_AMOUNT||SUPPORT_CFG.vipMinAmount||1);
const YM_SECRET_FILE=path.join(__dirname,'data','yoomoney_notification_secret.txt');
function yoomoneySecret(){
  if(process.env.YOOMONEY_NOTIFICATION_SECRET)return process.env.YOOMONEY_NOTIFICATION_SECRET;
  try{const x=fs.readFileSync(YM_SECRET_FILE,'utf8').trim();if(x.length>=16)return x}catch(_){}
  const x=crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(YM_SECRET_FILE),{recursive:true});
  fs.writeFileSync(YM_SECRET_FILE,x,'utf8');
  return x;
}
const YOOMONEY_NOTIFICATION_SECRET=yoomoneySecret();

const PORT=Number(process.env.PORT||22005);
const SECRET_FILE=path.join(__dirname,'data','server_secret.txt');
function persistentSecret(){
  if(process.env.JWT_SECRET)return process.env.JWT_SECRET;
  try{const s=fs.readFileSync(SECRET_FILE,'utf8').trim();if(s.length>=32)return s}catch(_){}
  const s=crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_FILE),{recursive:true});
  fs.writeFileSync(SECRET_FILE,s,'utf8');
  return s;
}
const JWT_SECRET=persistentSecret();
const DATA_DIR=path.join(__dirname,'data');
const DB_FILE=path.join(DATA_DIR,'db.json');
const FILE_DIR=path.join(DATA_DIR,'files');
fs.mkdirSync(DATA_DIR,{recursive:true});fs.mkdirSync(FILE_DIR,{recursive:true});

function load(){try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(_){return {users:[],contacts:{},messages:[],groups:[],groupMessages:[]}}}
let db=load();db.users??=[];db.contacts??={};db.messages??=[];db.groups??=[];db.groupMessages??=[];db.events??=[];db.groupInvites??=[];db.supportOrders??=[];
function save(){const t=DB_FILE+'.tmp',b=DB_FILE+'.bak';const json=JSON.stringify(db,null,2);fs.writeFileSync(t,json,'utf8');try{if(fs.existsSync(DB_FILE))fs.copyFileSync(DB_FILE,b)}catch(_){}fs.renameSync(t,DB_FILE)}
function uid(){return Date.now().toString(36)+crypto.randomBytes(5).toString('hex')}
function makeUin(){for(let i=0;i<1000;i++){const u=String(Math.floor(10000000+Math.random()*90000000));if(!db.users.some(x=>x.uin===u))return u}throw Error('UIN generation failed')}
const online=new Map();
function visibleStatus(u,viewer){
  const s=u.status||'ONLINE';
  if(viewer===u.uin)return s;
  if(!online.has(u.uin))return 'OFFLINE';
  if(s==='INVISIBLE')return 'OFFLINE';
  return s;
}
function publicUser(u,viewer){const isOwner=u.uin==='54151973';return {uin:u.uin,nick:u.nick,status:visibleStatus(u,viewer),phoneLinked:!!u.phoneNumber||Array.isArray(u.phoneHashes)&&u.phoneHashes.length>0,avatar:u.avatar||null,createdAt:u.createdAt||null,vip:!!u.vip,isOwner,isDeveloper:isOwner,roleBadges:isOwner?['Владелец','Разработчик']:[]}}
function sign(u){return jwt.sign({uin:u.uin},JWT_SECRET,{expiresIn:'3650d'})}
function auth(req,res,next){try{const h=req.headers.authorization||'',t=h.startsWith('Bearer ')?h.slice(7):String(req.query.token||''),p=jwt.verify(t,JWT_SECRET),u=db.users.find(x=>x.uin===p.uin);if(!u)return res.status(401).json({error:'Пользователь не найден'});req.user=u;next()}catch(_){res.status(401).json({error:'Нужен вход'})}}
function emitTo(uin,obj){const ws=online.get(uin);if(ws&&ws.readyState===1)ws.send(JSON.stringify(obj))}
function broadcastPresence(uin){const u=db.users.find(x=>x.uin===uin);if(!u)return;for(const [viewer,ws] of online){if(ws.readyState===1)ws.send(JSON.stringify({type:'presence',user:publicUser(u,viewer)}))}}
function groupFor(id,user){return db.groups.find(g=>g.id===id&&g.members.includes(user.uin))}
function safeName(n){return String(n||'file').replace(/[\\/:*?"<>|]/g,'_').slice(0,120)}
function addEvent(to,type,data){db.events.push({id:uid(),to:String(to),type,ts:Date.now(),data});if(db.events.length>20000)db.events=db.events.slice(-15000)}

const app=express();app.use(cors());app.use(express.json({limit:'140mb'}));app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.get('/health',(req,res)=>res.json({ok:true,name:'ICQ Reborn Server',version:'0.32.0'}));
app.post('/api/register',async(req,res)=>{try{
 const nick=String(req.body.nick||'').trim().slice(0,32);
 const password=String(req.body.password||'');
 const phoneNumber=String(req.body.phone||'').replace(/[^0-9+]/g,'').slice(0,24);
 const phoneHashes=Array.isArray(req.body.phoneHashes)?req.body.phoneHashes.filter(x=>/^[a-f0-9]{64}$/i.test(String(x))).slice(0,6):[];
 if(nick.length<2)return res.status(400).json({error:'Ник минимум 2 символа'});
 if(password.length<6)return res.status(400).json({error:'Пароль минимум 6 символов'});
 if(phoneNumber&&db.users.some(x=>x.phoneNumber===phoneNumber))return res.status(409).json({error:'Этот номер уже привязан к аккаунту'});
 const uin=makeUin(),passwordHash=await bcrypt.hash(password,12),now=Date.now();
 const user={uin,nick,passwordHash,phoneNumber,phoneHashes,status:'ONLINE',createdAt:now,lastLoginAt:null};
 db.users.push(user);db.contacts[uin]=[];save();
 res.status(201).json({ok:true,uin,user:publicUser(user,uin),message:'Аккаунт создан'});
}catch(e){res.status(500).json({error:'Не удалось создать аккаунт'})}});
app.post('/api/login',async(req,res)=>{try{
 const uin=String(req.body.uin||'').replace(/\D/g,'');
 const password=String(req.body.password||'');
 if(!/^\d{8}$/.test(uin))return res.status(400).json({error:'Введите корректный 8-значный UIN'});
 const u=db.users.find(x=>x.uin===uin);
 if(!u||!u.passwordHash||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'Неверный UIN или пароль'});
 u.lastLoginAt=Date.now();save();
 res.json({token:sign(u),user:publicUser(u,u.uin)});
}catch(e){res.status(500).json({error:'Ошибка входа'})}});
app.get('/api/account',auth,(req,res)=>res.json({uin:req.user.uin,nick:req.user.nick,phone:req.user.phoneNumber||'',createdAt:req.user.createdAt||null,lastLoginAt:req.user.lastLoginAt||null}));
app.get('/api/me',auth,(req,res)=>res.json(publicUser(req.user,req.user.uin)));
app.patch('/api/me',auth,(req,res)=>{if(req.body.nick!=null)req.user.nick=String(req.body.nick).trim().slice(0,32)||req.user.nick;if(req.body.status!=null&&['ONLINE','AWAY','DND','OCCUPIED','INVISIBLE'].includes(String(req.body.status)))req.user.status=String(req.body.status);if(Array.isArray(req.body.phoneHashes))req.user.phoneHashes=req.body.phoneHashes.filter(x=>/^[a-f0-9]{64}$/i.test(String(x))).slice(0,6);if(req.body.phoneNumber!=null)req.user.phoneNumber=String(req.body.phoneNumber||'').replace(/[^0-9+]/g,'').slice(0,24);save();broadcastPresence(req.user.uin);res.json(publicUser(req.user,req.user.uin))});

app.post('/api/me/avatar',auth,(req,res)=>{try{const raw=String(req.body.data||'');if(!raw){req.user.avatar=null;save();broadcastPresence(req.user.uin);return res.json(publicUser(req.user,req.user.uin))}const m=raw.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);if(!m)return res.status(400).json({error:'Нужен PNG/JPEG/WEBP'});const buf=Buffer.from(m[2],'base64');if(buf.length>100*1024*1024)return res.status(413).json({error:'Аватар максимум 100 МБ'});req.user.avatar=raw;save();broadcastPresence(req.user.uin);res.json(publicUser(req.user,req.user.uin))}catch(e){res.status(500).json({error:e.message})}});

app.get('/api/events',auth,(req,res)=>{const since=Number(req.query.since||0);res.json(db.events.filter(e=>e.to===req.user.uin&&e.ts>since).slice(-200))});
app.get('/api/contacts',auth,(req,res)=>res.json((db.contacts[req.user.uin]||[]).map(id=>db.users.find(x=>x.uin===id)).filter(Boolean).map(u=>publicUser(u,req.user.uin))));
app.post('/api/contacts',auth,(req,res)=>{const target=String(req.body.uin||''),other=db.users.find(x=>x.uin===target);if(!other)return res.status(404).json({error:'UIN не найден'});if(target===req.user.uin)return res.status(400).json({error:'Нельзя добавить себя'});db.contacts[req.user.uin]??=[];db.contacts[target]??=[];if(!db.contacts[req.user.uin].includes(target))db.contacts[req.user.uin].push(target);if(!db.contacts[target].includes(req.user.uin))db.contacts[target].push(req.user.uin);addEvent(target,'contact-added',{user:publicUser(req.user,target)});save();emitTo(target,{type:'contact-added',user:publicUser(req.user,target)});res.json({ok:true,user:publicUser(other,req.user.uin)})});
app.post('/api/contacts/sync',auth,(req,res)=>{const hashes=new Set((Array.isArray(req.body.hashes)?req.body.hashes:[]).map(String).filter(x=>/^[a-f0-9]{64}$/i.test(x)).slice(0,8000));const matched=[];db.contacts[req.user.uin]??=[];for(const u of db.users){if(u.uin===req.user.uin||!Array.isArray(u.phoneHashes))continue;if(u.phoneHashes.some(h=>hashes.has(h))){db.contacts[u.uin]??=[];if(!db.contacts[req.user.uin].includes(u.uin))db.contacts[req.user.uin].push(u.uin);if(!db.contacts[u.uin].includes(req.user.uin))db.contacts[u.uin].push(req.user.uin);matched.push(publicUser(u,req.user.uin));addEvent(u.uin,'contact-added',{user:publicUser(req.user,u.uin)});emitTo(u.uin,{type:'contact-added',user:publicUser(req.user,u.uin)})}}save();res.json({matched,added:matched.length})});
app.get('/api/messages/:uin',auth,(req,res)=>res.json(db.messages.filter(m=>(m.from===req.user.uin&&m.to===req.params.uin)||(m.to===req.user.uin&&m.from===req.params.uin)).slice(-500)));
app.post('/api/messages',auth,(req,res)=>{const to=String(req.body.to||''),text=String(req.body.text||'').trim().slice(0,4000),other=db.users.find(x=>x.uin===to);if(!other)return res.status(404).json({error:'Получатель не найден'});if(!text&&!req.body.file)return res.status(400).json({error:'Пустое сообщение'});const m={id:uid(),from:req.user.uin,to,text,file:req.body.file||null,ts:Date.now()};db.messages.push(m);addEvent(to,'message',{message:m,from:publicUser(req.user,to)});save();emitTo(to,{type:'message',message:m,from:publicUser(req.user,to)});res.json(m)});
app.post('/api/files',auth,(req,res)=>{try{const name=safeName(req.body.name),type=String(req.body.type||'application/octet-stream').slice(0,100),b64=String(req.body.data||'');const buf=Buffer.from(b64,'base64');if(!buf.length)return res.status(400).json({error:'Пустой файл'});if(buf.length>100*1024*1024)return res.status(413).json({error:'Максимум 100 МБ'});const id=uid(),disk=id+'_'+name;fs.writeFileSync(path.join(FILE_DIR,disk),buf);res.json({id,name,type,size:buf.length,url:'/api/files/'+id})}catch(e){res.status(500).json({error:e.message})}});
app.get('/api/files/:id',auth,(req,res)=>{const all=[...db.messages,...db.groupMessages],m=all.find(x=>x.file&&x.file.id===req.params.id);if(!m)return res.status(404).end();let allowed=m.from===req.user.uin||m.to===req.user.uin;if(m.groupId){const g=db.groups.find(x=>x.id===m.groupId);allowed=!!g?.members.includes(req.user.uin)}if(!allowed)return res.status(403).end();const files=fs.readdirSync(FILE_DIR),f=files.find(x=>x.startsWith(req.params.id+'_'));if(!f)return res.status(404).end();res.download(path.join(FILE_DIR,f),m.file.name)});

function inviteUserToGroup(g,fromUin,targetUin){
 const target=db.users.find(x=>x.uin===String(targetUin));
 if(!target)return {ok:false,error:'UIN не найден'};
 if(g.members.includes(target.uin))return {ok:false,error:'Пользователь уже в группе'};
 let inv=db.groupInvites.find(x=>x.groupId===g.id&&x.to===target.uin&&x.status==='pending');
 if(!inv){inv={id:uid(),groupId:g.id,to:target.uin,from:fromUin,status:'pending',createdAt:Date.now()};db.groupInvites.push(inv)}
 const payload={invite:inv,group:g,from:publicUser(db.users.find(x=>x.uin===fromUin),target.uin)};
 addEvent(target.uin,'group-invite',payload);emitTo(target.uin,{type:'group-invite',...payload});
 return {ok:true,invite:inv};
}
app.get('/api/groups',auth,(req,res)=>res.json(db.groups.filter(g=>g.members.includes(req.user.uin))));
app.get('/api/group-invites',auth,(req,res)=>res.json(db.groupInvites.filter(x=>x.to===req.user.uin&&x.status==='pending').map(x=>({invite:x,group:db.groups.find(g=>g.id===x.groupId),from:publicUser(db.users.find(u=>u.uin===x.from)||{uin:x.from,nick:x.from,status:'OFFLINE'},req.user.uin)}))));
app.post('/api/groups',auth,(req,res)=>{const name=String(req.body.name||'').trim().slice(0,50),invitees=[...new Set(Array.isArray(req.body.members)?req.body.members.map(String):[])];if(!name)return res.status(400).json({error:'Название группы обязательно'});const g={id:uid(),name,owner:req.user.uin,members:[req.user.uin],createdAt:Date.now()};db.groups.push(g);let invited=0;for(const u of invitees){const r=inviteUserToGroup(g,req.user.uin,u);if(r.ok)invited++}save();res.json({...g,invited})});
app.post('/api/groups/:id/invite',auth,(req,res)=>{const g=groupFor(req.params.id,req.user);if(!g)return res.status(404).json({error:'Группа не найдена'});const r=inviteUserToGroup(g,req.user.uin,String(req.body.uin||''));if(!r.ok)return res.status(400).json({error:r.error});save();res.json(r)});
app.post('/api/group-invites/:id/respond',auth,(req,res)=>{const inv=db.groupInvites.find(x=>x.id===req.params.id&&x.to===req.user.uin&&x.status==='pending');if(!inv)return res.status(404).json({error:'Приглашение не найдено'});const accept=!!req.body.accept;inv.status=accept?'accepted':'declined';inv.respondedAt=Date.now();const g=db.groups.find(x=>x.id===inv.groupId);if(accept&&g&&!g.members.includes(req.user.uin)){g.members.push(req.user.uin);addEvent(req.user.uin,'group-added',{group:g});emitTo(req.user.uin,{type:'group-added',group:g});for(const u of g.members)if(u!==req.user.uin)emitTo(u,{type:'group-member-added',group:g,user:publicUser(req.user,u)})}save();res.json({ok:true,accepted:accept,group:g||null})});
app.post('/api/groups/:id/members',auth,(req,res)=>{const g=groupFor(req.params.id,req.user);if(!g)return res.status(404).json({error:'Группа не найдена'});const r=inviteUserToGroup(g,req.user.uin,String(req.body.uin||''));if(!r.ok)return res.status(400).json({error:r.error});save();res.json({ok:true,invited:true,group:g})});
app.get('/api/groups/:id/messages',auth,(req,res)=>{const g=groupFor(req.params.id,req.user);if(!g)return res.status(404).json({error:'Группа не найдена'});res.json(db.groupMessages.filter(m=>m.groupId===g.id).slice(-500))});
app.post('/api/groups/:id/messages',auth,(req,res)=>{const g=groupFor(req.params.id,req.user);if(!g)return res.status(404).json({error:'Группа не найдена'});const text=String(req.body.text||'').trim().slice(0,4000);if(!text&&!req.body.file)return res.status(400).json({error:'Пустое сообщение'});const m={id:uid(),groupId:g.id,from:req.user.uin,text,file:req.body.file||null,ts:Date.now()};db.groupMessages.push(m);for(const u of g.members)if(u!==req.user.uin){addEvent(u,'group-message',{group:g,message:m,from:publicUser(req.user,u)});emitTo(u,{type:'group-message',group:g,message:m,from:publicUser(req.user,u)})}save();res.json(m)});

// Support / VIP
app.get('/api/support/status',auth,(req,res)=>res.json({vip:!!req.user.vip,vipSince:req.user.vipSince||null,wallet:SUPPORT_WALLET,card:SUPPORT_CARD,minAmount:VIP_MIN_AMOUNT}));
app.post('/api/support/order',auth,(req,res)=>{
 const amount=Math.max(VIP_MIN_AMOUNT,Math.min(100000,Number(req.body.amount||VIP_MIN_AMOUNT)));
 const order={id:uid(),uin:req.user.uin,label:'ICQVIP-'+req.user.uin+'-'+crypto.randomBytes(5).toString('hex'),amount,status:'pending',createdAt:Date.now()};
 db.supportOrders.push(order);save();res.json({ok:true,orderId:order.id,amount:order.amount,label:order.label,url:'/support/'+order.id});
});
app.get('/support/:id',(req,res)=>{
 const o=db.supportOrders.find(x=>x.id===req.params.id&&x.status==='pending');if(!o)return res.status(404).send('Payment link expired');
 if(!SUPPORT_WALLET)return res.status(503).send('Support wallet is not configured');
 const escHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 res.type('html').send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICQ Reborn Support</title><style>body{font:16px system-ui;background:#07110b;color:#f5fff4;padding:24px}form{max-width:420px;margin:auto;background:#0d1d12;padding:20px;border-radius:20px}input,button{width:100%;padding:12px;margin:7px 0;border-radius:12px;border:1px solid #315b38;box-sizing:border-box}button{background:#7df56d;font-weight:800}</style><form method="POST" action="https://yoomoney.ru/quickpay/confirm"><h2>🌼 Поддержать ICQ Reborn</h2><p>После подтверждённого перевода VIP будет выдан автоматически.</p><input type="hidden" name="receiver" value="'+escHtml(SUPPORT_WALLET)+'"><input type="hidden" name="label" value="'+escHtml(o.label)+'"><input type="hidden" name="quickpay-form" value="button"><label>Сумма, ₽</label><input name="sum" type="number" min="'+VIP_MIN_AMOUNT+'" step="1" value="'+escHtml(o.amount)+'"><label><input style="width:auto" type="radio" name="paymentType" value="PC" checked> ЮMoney</label><label><input style="width:auto" type="radio" name="paymentType" value="AC"> Банковская карта через ЮMoney</label><button type="submit">Поддержать и получить VIP</button></form>');
});
app.post('/api/support/yoomoney',(req,res)=>{
 try{
  const body={...req.body},sign=String(body.sign||'');delete body.sign;
  const keys=Object.keys(body).sort(),encoded=keys.map(k=>encodeURIComponent(k)+'='+encodeURIComponent(String(body[k]??''))).join('&');
  const expected=crypto.createHmac('sha256',YOOMONEY_NOTIFICATION_SECRET).update(encoded).digest('hex');
  const valid=sign&&sign.length===expected.length&&crypto.timingSafeEqual(Buffer.from(sign),Buffer.from(expected));
  if(!valid)return res.status(403).send('bad sign');
  if(String(req.body.test_notification)==='true'||String(req.body.unaccepted)==='true')return res.sendStatus(200);
  const label=String(req.body.label||''),amount=Number(req.body.amount||0);
  const o=db.supportOrders.find(x=>x.label===label&&x.status==='pending');
  if(o&&amount>=VIP_MIN_AMOUNT){
   o.status='paid';o.amountReceived=amount;o.operationId=String(req.body.operation_id||'');o.paidAt=Date.now();
   const u=db.users.find(x=>x.uin===o.uin);if(u){u.vip=true;u.vipSince=u.vipSince||Date.now();addEvent(u.uin,'vip-granted',{amount,ts:Date.now()});emitTo(u.uin,{type:'vip-granted',amount})}
   save();
  }
  res.sendStatus(200);
 }catch(e){res.status(400).send('bad request')}
});

const server=http.createServer(app),wss=new WebSocketServer({server,path:'/ws'});
wss.on('connection',(ws,req)=>{try{const url=new URL(req.url,'http://localhost'),p=jwt.verify(url.searchParams.get('token')||'',JWT_SECRET),user=db.users.find(x=>x.uin===p.uin);if(!user){ws.close();return}online.set(user.uin,ws);ws.uin=user.uin;ws.send(JSON.stringify({type:'hello',user:publicUser(user,user.uin)}));broadcastPresence(user.uin);ws.on('message',buf=>{try{const m=JSON.parse(String(buf));if(m.type==='call-signal'&&m.to)emitTo(String(m.to),{type:'call-signal',from:user.uin,fromUser:publicUser(user,String(m.to)),signalType:m.signalType,payload:m.payload});if(m.type==='typing'&&m.to)emitTo(String(m.to),{type:'typing',from:user.uin,value:!!m.value})}catch(_){}});ws.on('close',()=>{if(online.get(user.uin)===ws)online.delete(user.uin);broadcastPresence(user.uin)})}catch(_){ws.close()}});
server.listen(PORT,'0.0.0.0',()=>{
 console.log('ICQ Reborn Server v0.32 on http://0.0.0.0:'+PORT);
 console.log('YooMoney webhook: http://PUBLIC-IP:'+PORT+'/api/support/yoomoney');
 console.log('YooMoney secret file: server\\data\\yoomoney_notification_secret.txt');
});
