export function finalResult(game) {
 if (!game || game.status !== 'finished') return null;
 const valid=n=>Number.isInteger(n)&&n>=0;
 if (!valid(game.homeScore)||!valid(game.awayScore)) return null;
 let homeWins=game.homeScore>game.awayScore, penalties=false;
 if(game.homeScore===game.awayScore){
  if(!valid(game.homePens)||!valid(game.awayPens)||game.homePens===game.awayPens)return null;
  homeWins=game.homePens>game.awayPens;penalties=true;
 }
 return {champion:homeWins?game.home:game.away,runnerUp:homeWins?game.away:game.home,penalties};
}
