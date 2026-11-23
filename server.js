const WebSocket=require('ws'),http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const requested=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(ROOT,'.'+requested);
  if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end('Forbidden')}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(err.code==='ENOENT'?404:500,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found')}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
});
const wss=new WebSocket.Server({server}),rooms=new Map();
const places=['박물관','은행','야시장','공원','항구'],districts={박물관:'문화 지구',은행:'금융 지구',야시장:'상업 지구',공원:'녹지 지구',항구:'해안 지구'};
function send(ws,x){if(ws.readyState===1)ws.send(JSON.stringify(x))}
function code(){let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c));return c}
function view(r,p){return{code:r.code,players:r.players.map(x=>({id:x.id,name:x.name})),isHost:r.host===p.id}}
function gameView(r){return{phase:r.game.phase,round:r.game.round,clue:r.game.clue||'',players:r.players.map(x=>({id:x.id,name:x.name,role:x.role}))}}
function broadcast(r,x){r.players.forEach(p=>send(p.ws,x))}
function lobby(r){r.players.forEach(p=>send(p.ws,{type:'lobby',room:view(r,p)}))}
function system(r,text){broadcast(r,{type:'system',text})}
function start(r){
  if(r.players.length<2)return;
  const shuffled=[...r.players].sort(()=>Math.random()-.5);
  shuffled.forEach((p,i)=>p.role=i===0?'thief':'detective');
  r.game={phase:'hide',round:1,thief:shuffled[0].id,location:null,clue:null};
  r.players.forEach(p=>send(p.ws,{type:'started',room:view(r,p),game:gameView(r)}));
  system(r,'사건이 시작됐어! 도둑은 은신 장소를 선택해.');
}
function update(r){r.players.forEach(p=>send(p.ws,{type:'state',room:view(r,p),game:gameView(r)}))}
function finish(r,caught,guess){
  const winner=caught?'detective':'thief';
  broadcast(r,{type:'result',winner,detail:`추리 장소: ${guess}<br>실제 은신 장소: ${r.game.location}<br>단서: ${r.game.clue}`});
  system(r,caught?'탐정 팀이 도둑을 검거했어!':'도둑이 추적을 따돌렸어!');
  r.game.phase='result';
}
wss.on('connection',ws=>{
  ws.id=Math.random().toString(36).slice(2)+Date.now().toString(36);ws.room=null;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    if(m.type==='create'||m.type==='join'){
      const name=String(m.name||'플레이어').slice(0,14);let r;
      if(m.type==='create'){r={code:code(),host:ws.id,players:[],game:null};rooms.set(r.code,r)}
      else{
        r=rooms.get(String(m.code||'').toUpperCase());
        if(!r)return send(ws,{type:'error',message:'방 코드를 찾을 수 없어.'});
        if(r.players.length>=6)return send(ws,{type:'error',message:'방이 가득 찼어.'});
        if(r.game&&r.game.phase!=='result')return send(ws,{type:'error',message:'이미 게임이 진행 중인 방이야.'});
      }
      const p={id:ws.id,name,ws,role:null};r.players.push(p);ws.room=r.code;
      send(ws,{type:'joined',room:view(r,p),me:{id:p.id,name:p.name}});
      lobby(r);if(r.players.length>1)system(r,`${name}님이 입장했어.`);return;
    }
    const r=rooms.get(ws.room);if(!r)return;const p=r.players.find(x=>x.ws===ws);if(!p)return;
    if(m.type==='start'){
      if(r.host!==ws.id)return send(ws,{type:'error',message:'방장만 시작할 수 있어.'});
      if(r.players.length<2)return send(ws,{type:'error',message:'최소 2명이 필요해.'});start(r);
    }
    if(m.type==='hide'&&r.game?.phase==='hide'&&p.role==='thief'&&p.id===r.game.thief&&places.includes(m.location)){
      r.game.location=m.location;r.game.clue=districts[m.location];r.game.phase='guess';update(r);system(r,`단서 발견: 도둑은 ${r.game.clue}에 있어!`);
    }
    if(m.type==='guess'&&r.game?.phase==='guess'&&p.role==='detective'&&places.includes(m.location))finish(r,m.location===r.game.location,m.location);
    if(m.type==='chat'){const t=String(m.text||'').trim().slice(0,120);if(t)broadcast(r,{type:'chat',name:p.name,text:t})}
    if(m.type==='restart'&&r.game?.phase==='result'&&r.host===ws.id)start(r);
    if(m.type==='timeout'&&r.game?.phase==='guess')finish(r,false,'시간 초과');
  });
  ws.on('close',()=>{
    const r=rooms.get(ws.room);if(!r)return;r.players=r.players.filter(p=>p.ws!==ws);
    if(!r.players.length){rooms.delete(r.code);return}
    if(r.host===ws.id)r.host=r.players[0].id;lobby(r);system(r,'플레이어 한 명이 나갔어.');
    if(r.game&&r.game.phase!=='result'&&r.players.length<2){r.game.phase='lobby';broadcast(r,{type:'error',message:'인원이 부족해 게임이 중단됐어.'})}
  });
});
const PORT=process.env.PORT||3000;
server.listen(PORT,'0.0.0.0',()=>console.log(`Game server listening on ${PORT}`));
