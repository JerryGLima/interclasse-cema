// Horários do torneio em Presidente Dutra (UTC-03:00).
export const kickoff=g=>Date.parse(g.date+'T'+g.time+':00-03:00');
export function highlights(games,now=Date.now()){
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const sorted=[...games].sort((a,b)=>kickoff(a)-kickoff(b)||a.id-b.id);
 const live=sorted.filter(g=>g.status==='live');
 const next=sorted.find(g=>g.status==='scheduled'&&g.date>=day);
 return {live,next,complete:games.length>0&&games.every(g=>g.status==='finished')};
}
export function countdown(game,now=Date.now()){
 const seconds=Math.ceil((kickoff(game)-now)/1000);
 if(seconds<=0)return 'Horário previsto atingido • Aguardando início confirmado';
 const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;
 return 'Começa em '+(days?days+'d ':'')+[hours,minutes,rest].map(v=>String(v).padStart(2,'0')).join(':');
}
