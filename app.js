import {highlights,countdown} from './highlights.js';
import {api,watchGames,watchAuth} from './firebase-service.js';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={scheduled:'Agendado',live:'● Em andamento',finished:'Encerrado',postponed:'Adiado'};
let games=[],authenticated=false,category='TODAS',day='all',query='',busy=false,loaded=false;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
if(['2026-11-16','2026-11-17','2026-11-18','2026-11-19'].includes(today))day=today;

function dateLabel(date,options={day:'2-digit',month:'2-digit'}){return new Date(date+'T12:00:00').toLocaleDateString('pt-BR',options);}
function renderFilters(){const dates=[...new Set(games.map(g=>g.date))].sort();$('dates').innerHTML='<button data-day="all" class="'+(day==='all'?'active':'')+'" aria-pressed="'+(day==='all')+'">PROGRAMAÇÃO<b>Todos os dias</b></button>'+dates.map(d=>`<button data-day="${d}" class="${day===d?'active':''}" aria-pressed="${day===d}">${esc(dateLabel(d,{weekday:'short'}).toUpperCase())}<b>${dateLabel(d)}${d==='2026-11-19'?' • Finais':''}</b></button>`).join('');$('categories').innerHTML=['TODAS','FRALDINHA','MIRIM','INFANTIL','INFANTO'].map(c=>`<button data-category="${c}" class="${category===c?'active':''}" aria-pressed="${category===c}">${c==='TODAS'?'Todas as categorias':c.charAt(0)+c.slice(1).toLowerCase()}</button>`).join('');}
function shirt(name){const color=['vinho','branco','azul','preto','rosa'].find(c=>name.toLowerCase().includes(c));return color?`<img class="team-shirt" src="assets/camisa-${color}.png" alt="" width="52" height="52" decoding="async">`:'<span class="dot" aria-hidden="true"></span>';}
function team(name){return `<div class="team">${shirt(name)}<span>${esc(name)}</span></div>`;}
function render(){renderStandings();renderHighlights();renderFilters();$('completed').textContent=games.filter(g=>g.status==='finished').length.toString().padStart(2,'0');$('live-count').textContent=games.filter(g=>g.status==='live').length.toString().padStart(2,'0');$('adminbar').hidden=!authenticated;$('admin').textContent=authenticated?'Painel ativo':'Área da organização';
 const filtered=games.filter(g=>(day==='all'||g.date===day)&&(category==='TODAS'||g.category===category)&&(`${g.home} ${g.away}`.toLowerCase().includes(query))).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)||a.id-b.id);
 $('games').innerHTML=filtered.map(g=>`<article class="game"><div class="game-top"><strong>${esc(g.category)}${g.id>=25?' • FINAL':''}</strong><span class="badge ${g.status}">${labels[g.status]}</span></div><div class="match">${team(g.home)}<div class="score" aria-label="Placar ${g.homeScore??'não informado'} a ${g.awayScore??'não informado'}">${g.homeScore??'—'}<small>×</small>${g.awayScore??'—'}</div>${team(g.away)}</div>${g.homePens!==null?`<div class="note">Pênaltis: ${g.homePens} × ${g.awayPens}</div>`:''}${g.note?`<div class="note">${esc(g.note)}</div>`:''}<div class="game-bottom"><span>Jogo ${String(g.id).padStart(2,'0')} &nbsp;•&nbsp; ${dateLabel(g.date)} &nbsp;•&nbsp; ${esc(g.time)}</span>${authenticated?`<button data-edit="${g.id}">Editar jogo</button>`:'<span>Futsal</span>'}</div></article>`).join('')||'<p class="empty">Nenhum jogo encontrado para este filtro.</p>';
}
async function refresh(){if(busy)return;busy=true;try{const data=await api('games');games=data.games;loaded=true;$('sync').textContent='● Resultados conectados • Atualizações em tempo real • Última consulta: '+new Date().toLocaleTimeString('pt-BR');render();}catch(e){if(!games.length){try{games=await(await fetch('games.json')).json();render();}catch{}}$('sync').textContent=loaded?'Conexão interrompida. Exibindo a última consulta; tentando reconectar…':'Programação original • Resultados ainda não conectados. '+e.message;}finally{busy=false;}}
$('dates').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){day=b.dataset.day;render();}});
$('categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;render();}});
$('search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
$('admin').onclick=()=>{if(authenticated){$('jogos').scrollIntoView();return;}$('loginerror').textContent='';$('login').showModal();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('loginform').onsubmit=async e=>{e.preventDefault();const f=e.target,button=f.querySelector('[type=submit]');button.disabled=true;$('loginerror').textContent='';try{await api('login','POST',Object.fromEntries(new FormData(f)));authenticated=true;f.reset();$('login').close();render();$('jogos').scrollIntoView();}catch(err){$('loginerror').textContent=err.message;}finally{button.disabled=false;}};
$('logout').onclick=async()=>{try{await api('logout','POST',{});authenticated=false;render();}catch(e){$('sync').textContent=e.message;}};
$('games').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(!b)return;const g=games.find(g=>g.id===Number(b.dataset.edit));const f=$('editform');for(const k of ['id','home','away','date','time','status','homeScore','awayScore','homePens','awayPens','note'])f.elements[k].value=g[k]??'';$('pens').hidden=g.id<25;$('editlabel').textContent=`JOGO ${g.id} • ${g.category}`;$('editerror').textContent='';$('editor').showModal();});
$('editform').onsubmit=async e=>{e.preventDefault();const f=e.target,b=Object.fromEntries(new FormData(f)),button=f.querySelector('[type=submit]');for(const k of ['id','homeScore','awayScore','homePens','awayPens'])b[k]=b[k]===''?null:Number(b[k]);button.disabled=true;$('editerror').textContent='';try{const {game}=await api('games','PUT',b);games=games.map(g=>g.id===game.id?game:g);render();$('editor').close();$('toast').textContent='Resultado publicado com sucesso!';$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,3500);await refresh();}catch(err){$('editerror').textContent=err.message;}finally{button.disabled=false;}};
refresh();
watchAuth(value=>{authenticated=value;render();});
watchGames(data=>{games=data;loaded=true;$('sync').textContent='● Resultados conectados • Atualizações em tempo real • '+new Date().toLocaleTimeString('pt-BR');render();},error=>{$('sync').textContent='Resultados sem conexão: '+error.message+' A programação exibida pode estar desatualizada.';});

function renderHighlights(){
 const box=$('highlights');
 if(!loaded){box.innerHTML='<p class="highlight-empty">Aguardando conexão para confirmar os próximos jogos…</p>';return;}
 const {live,next,complete}=highlights(games);
 function card(g,isLive){
  return '<article class="highlight-card '+(isLive?'highlight-live':'')+'"><div class="eyebrow">'+(isLive?'● AGORA NA QUADRA':'PRÓXIMO JOGO')+'</div><h3 class="highlight-teams"><span class="highlight-team">'+shirt(g.home)+esc(g.home)+'</span><span aria-hidden="true">×</span><span class="highlight-team">'+shirt(g.away)+esc(g.away)+'</span></h3><p>'+esc(g.category)+(g.id>=25?' • FINAL':'')+' • Jogo '+g.id+' • '+dateLabel(g.date)+' às '+esc(g.time)+' <small>(horário de Brasília)</small></p>'+(isLive?'<strong class="highlight-clock">Placar: '+esc(g.homeScore??'—')+' × '+esc(g.awayScore??'—')+'</strong>':'<strong class="highlight-clock" role="timer">'+countdown(g)+'</strong>')+'</article>';
 }
 box.innerHTML=live.map(g=>card(g,true)).join('')+(next?card(next,false):'<div class="highlight-card highlight-empty"><strong>'+(complete?'Todos os jogos foram encerrados.':'Nenhum próximo jogo com horário confirmado.')+'</strong><p>Consulte a tabela abaixo para acompanhar os resultados e avisos.</p></div>');
}
setInterval(renderHighlights,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderHighlights();});

function renderStandings(){
 const box=$('standings-tables');
 if(!loaded){box.textContent='Aguardando os resultados confirmados para calcular a classificação…';return;}
 box.innerHTML=['FRALDINHA','MIRIM','INFANTIL','INFANTO'].map(cat=>{
 const rows=new Map();
 const get=name=>{if(!rows.has(name))rows.set(name,{name,j:0,v:0,e:0,d:0,gp:0,gc:0,p:0});return rows.get(name);};
 games.filter(g=>g.category===cat&&g.id<25).forEach(g=>{
 const a=get(g.home),b=get(g.away);
 if(g.status!=='finished'||!Number.isInteger(g.homeScore)||!Number.isInteger(g.awayScore))return;
 a.j++;b.j++;a.gp+=g.homeScore;a.gc+=g.awayScore;b.gp+=g.awayScore;b.gc+=g.homeScore;
 if(g.homeScore===g.awayScore){a.e++;b.e++;a.p++;b.p++;}
 else{const winner=g.homeScore>g.awayScore?a:b,loser=winner===a?b:a;winner.v++;winner.p+=3;loser.d++;loser.p-=3;}
 });
 let position=0,previous=null;
 return '<div class="standings-wrap" tabindex="0" role="region" aria-label="Classificação '+cat+'"><table class="standings-table"><caption>'+cat+'</caption><thead><tr>'+['Pos.','Time','PTS','J','V','E','D','GP','GC','SG'].map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+[...rows.values()].sort((a,b)=>b.p-a.p||a.name.localeCompare(b.name,'pt-BR')).map((r,i)=>{if(r.p!==previous)position=i+1;previous=r.p;return '<tr><td>'+position+'º</td><th scope="row"><span class="ranking-team">'+shirt(r.name)+esc(r.name)+'</span></th><td><strong>'+r.p+'</strong></td>'+[r.j,r.v,r.e,r.d,r.gp,r.gc,r.gp-r.gc].map(n=>'<td>'+n+'</td>').join('')+'</tr>';}).join('')+'</tbody></table></div>';
 }).join('');
}
