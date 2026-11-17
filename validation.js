export function validateGame(b,seed){
 const statuses=['scheduled','live','finished','postponed'];
 if(!b||!statuses.includes(b.status))throw Error('Situação inválida.');
 for(const key of ['home','away'])if(typeof b[key]!=='string'||!b[key].trim()||b[key].length>60)throw Error('Informe os dois times (até 60 caracteres).');
 if(!/^2026-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time))throw Error('Data ou horário inválido.');
 for(const k of ['homeScore','awayScore','homePens','awayPens'])if(b[k]!==null&&(!Number.isInteger(b[k])||b[k]<0||b[k]>99))throw Error('Os placares devem ser números de 0 a 99.');
 if((b.homeScore===null)!==(b.awayScore===null)||(b.homePens===null)!==(b.awayPens===null))throw Error('Preencha os dois placares.');
 if(['live','finished'].includes(b.status)&&b.homeScore===null)throw Error('Informe o placar do jogo.');
 if(b.homePens!==null&&(seed.id<25||b.homeScore===null||b.homeScore!==b.awayScore))throw Error('Pênaltis somente em finais empatadas.');
 if(b.status==='finished'&&b.homePens!==null&&b.homePens===b.awayPens)throw Error('A disputa de pênaltis precisa ter um vencedor.');
 if(typeof b.note!=='string'||b.note.length>200)throw Error('Observação: máximo de 200 caracteres.');
 return {...seed,...Object.fromEntries(['home','away','date','time','homeScore','awayScore','homePens','awayPens','status','note'].map(k=>[k,typeof b[k]==='string'?b[k].trim():b[k]])),updatedAt:new Date().toISOString()};
}