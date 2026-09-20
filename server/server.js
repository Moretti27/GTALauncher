const fs=require('fs');
const path=require('path');
const http=require('http');
const express=require('express');
const cors=require('cors');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');\nconst crypto=require('crypto');
const {WebSocketServer}=require('ws');

const PORT=Number(process.env.PORT||22005);
const JWT_SECRET=process.env.JWT_SECRET||'CHANGE_ME_ICQ_REBORN_SECRET';
const DATA_DIR=path.join(__dirname,'data');
const DB_FILE=path.join(DATA_DIR,'db.json');
fs.mkdirSync(DATA_DIR,{recursive:true});

function load(){
  try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}
  catch(_){return {users:[],contacts:{},messages:[]}}
}
let db=load();
function save(){
  const tmp=DB_FILE+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(db,null,2),'utf8');
  fs.renameSync(tmp,DB_FILE);
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
function makeUin(){
  for(let i=0;i<1000;i++){
    const u=String(Math.floor(10000000+Math.random()*90000000));
    if(!db.users.some(x=>x.uin===u))return u;
  }
  throw new Error('UIN generation failed');
}
function publicUser(u){return {uin:u.uin,nick:u.nick,status:online.has(u.uin)?'ONLINE':(u.status||'OFFLINE'),phoneLinked:Array.isArray(u.phoneHashes)&&u.phoneHashes.length>0}}
function sign(u){return jwt.sign({uin:u.uin},JWT_SECRET,{expiresIn:'30d'})}
function auth(req,res,next){
  try{
    const h=req.headers.authorization||'';
    const token=h.startsWith('Bearer ')?h.slice(7):'';
    const p=jwt.verify(token,JWT_SECRET);
    const u=db.users.find(x=>x.uin===p.uin);
    if(!u)return res.status(401).json({error:'Пользователь не найден'});
    req.user=u;next();
  }catch(_){res.status(401).json({error:'Нужен вход'})}
}

const app=express();
app.use(cors());
app.use(express.json({limit:'2mb'}));

app.get('/health',(req,res)=>res.json({ok:true,name:'ICQ Reborn Server',version:'0.18.0'}));

app.post('/api/register',async(req,res)=>{
  try{
    const nick=String(req.body.nick||'').trim().slice(0,32);
    const password=String(req.body.password||'');
    if(nick.length<2)return res.status(400).json({error:'Ник минимум 2 символа'});
    if(password.length<6)return res.status(400).json({error:'Пароль минимум 6 символов'});
    const uin=makeUin();
    const passwordHash=await bcrypt.hash(password,10);
    const phoneHashes=Array.isArray(req.body.phoneHashes)?req.body.phoneHashes.filter(x=>/^[a-f0-9]{64}$/i.test(String(x))).slice(0,6):[];
    const user={uin,nick,passwordHash,phoneHashes,status:'ONLINE',createdAt:Date.now()};
    db.users.push(user);db.contacts[uin]=[];save();
    res.json({token:sign(user),user:publicUser(user)});
  }catch(e){res.status(500).json({error:e.message})}
});

app.post('/api/login',async(req,res)=>{
  const uin=String(req.body.uin||'').trim();
  const password=String(req.body.password||'');
  const user=db.users.find(x=>x.uin===uin);
  if(!user||!(await bcrypt.compare(password,user.passwordHash)))return res.status(401).json({error:'Неверный UIN или пароль'});
  res.json({token:sign(user),user:publicUser(user)});
});

app.get('/api/me',auth,(req,res)=>res.json(publicUser(req.user)));

app.patch('/api/me',auth,(req,res)=>{
  if(req.body.nick!=null)req.user.nick=String(req.body.nick).trim().slice(0,32)||req.user.nick;
  if(req.body.status!=null)req.user.status=String(req.body.status).slice(0,20);
  if(Array.isArray(req.body.phoneHashes))req.user.phoneHashes=req.body.phoneHashes.filter(x=>/^[a-f0-9]{64}$/i.test(String(x))).slice(0,6);
  save();res.json(publicUser(req.user));broadcastPresence(req.user.uin);
});

app.get('/api/users/:uin',auth,(req,res)=>{
  const u=db.users.find(x=>x.uin===String(req.params.uin));
  if(!u)return res.status(404).json({error:'UIN не найден'});
  res.json(publicUser(u));
});

app.get('/api/contacts',auth,(req,res)=>{
  const list=(db.contacts[req.user.uin]||[]).map(id=>db.users.find(x=>x.uin===id)).filter(Boolean).map(publicUser);
  res.json(list);
});

app.post('/api/contacts/sync',auth,(req,res)=>{
  const hashes=new Set((Array.isArray(req.body.hashes)?req.body.hashes:[]).map(String).filter(x=>/^[a-f0-9]{64}$/i.test(x)).slice(0,8000));
  if(!hashes.size)return res.json({matched:[],added:0});
  db.contacts[req.user.uin]??=[];
  const matched=[];
  for(const u of db.users){
    if(u.uin===req.user.uin||!Array.isArray(u.phoneHashes))continue;
    if(u.phoneHashes.some(h=>hashes.has(h))){
      db.contacts[u.uin]??=[];
      if(!db.contacts[req.user.uin].includes(u.uin))db.contacts[req.user.uin].push(u.uin);
      if(!db.contacts[u.uin].includes(req.user.uin))db.contacts[u.uin].push(req.user.uin);
      matched.push(publicUser(u));
      emitTo(u.uin,{type:'contact-added',user:publicUser(req.user)});
    }
  }
  save();
  res.json({matched,added:matched.length});
});

app.post('/api/contacts',auth,(req,res)=>{
  const target=String(req.body.uin||'').trim();
  const other=db.users.find(x=>x.uin===target);
  if(!other)return res.status(404).json({error:'UIN не найден'});
  if(target===req.user.uin)return res.status(400).json({error:'Нельзя добавить себя'});
  db.contacts[req.user.uin]??=[];
  db.contacts[target]??=[];
  if(!db.contacts[req.user.uin].includes(target))db.contacts[req.user.uin].push(target);
  if(!db.contacts[target].includes(req.user.uin))db.contacts[target].push(req.user.uin);
  save();
  emitTo(target,{type:'contact-added',user:publicUser(req.user)});
  res.json({ok:true,user:publicUser(other)});
});

app.get('/api/messages/:uin',auth,(req,res)=>{
  const peer=String(req.params.uin);
  const list=db.messages.filter(m=>(m.from===req.user.uin&&m.to===peer)||(m.to===req.user.uin&&m.from===peer)).slice(-500);
  res.json(list);
});

app.post('/api/messages',auth,(req,res)=>{
  const to=String(req.body.to||'').trim();
  const text=String(req.body.text||'').trim().slice(0,4000);
  const other=db.users.find(x=>x.uin===to);
  if(!other)return res.status(404).json({error:'Получатель не найден'});
  if(!text)return res.status(400).json({error:'Пустое сообщение'});
  const m={id:uid(),from:req.user.uin,to,text,ts:Date.now()};
  db.messages.push(m);
  if(db.messages.length>200000)db.messages=db.messages.slice(-150000);
  save();
  emitTo(to,{type:'message',message:m,from:publicUser(req.user)});
  res.json(m);
});

const server=http.createServer(app);
const wss=new WebSocketServer({server,path:'/ws'});
const online=new Map();

function emitTo(uin,obj){
  const ws=online.get(uin);
  if(ws&&ws.readyState===1)ws.send(JSON.stringify(obj));
}
function broadcastPresence(uin){
  const u=db.users.find(x=>x.uin===uin);if(!u)return;
  const obj={type:'presence',user:publicUser(u)};
  for(const ws of online.values())if(ws.readyState===1)ws.send(JSON.stringify(obj));
}
wss.on('connection',(ws,req)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const token=url.searchParams.get('token')||'';
    const p=jwt.verify(token,JWT_SECRET);
    const user=db.users.find(x=>x.uin===p.uin);
    if(!user){ws.close();return}
    online.set(user.uin,ws);
    ws.uin=user.uin;
    ws.send(JSON.stringify({type:'hello',user:publicUser(user)}));
    broadcastPresence(user.uin);

    ws.on('message',buf=>{
      try{
        const m=JSON.parse(String(buf));
        if(m.type==='call-signal'&&m.to){
          emitTo(String(m.to),{type:'call-signal',from:user.uin,fromUser:publicUser(user),signalType:m.signalType,payload:m.payload});
        }
        if(m.type==='typing'&&m.to){
          emitTo(String(m.to),{type:'typing',from:user.uin,value:!!m.value});
        }
      }catch(_){}
    });
    ws.on('close',()=>{
      if(online.get(user.uin)===ws)online.delete(user.uin);
      broadcastPresence(user.uin);
    });
  }catch(_){ws.close()}
});

server.listen(PORT,'0.0.0.0',()=>{
  console.log('');
  console.log('ICQ Reborn Server started');
  console.log('Port:',PORT);
  console.log('Health: http://localhost:'+PORT+'/health');
  console.log('Data:',DB_FILE);
  console.log('');
});
