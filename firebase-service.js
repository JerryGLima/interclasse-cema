import {validateGame} from './validation.js';
let connection,seedPromise;
const seeds=()=>seedPromise??=fetch('./games.json').then(r=>{if(!r.ok)throw Error('Não foi possível carregar a tabela.');return r.json();});
function friendly(e){const code=e.code||'';if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return Error('Usuário ou senha incorretos.');if(code.includes('too-many-requests'))return Error('Muitas tentativas. Aguarde antes de tentar novamente.');if(code.includes('permission-denied'))return Error('Acesso negado. Confira o UID e as regras do Firestore.');if(code.includes('network')||code.includes('unavailable'))return Error('Sem conexão com o Firebase. Confira sua internet.');return Error(e.message||'Não foi possível conectar ao Firebase.');}
async function connect(){
 const config=window.CEMA_FIREBASE;
 if(!config||!config.apiKey||Object.values(config).some(v=>v.includes('COLE_')))throw Error('Preencha firebase-config.js para ativar o painel e os placares.');
 return connection??=(async()=>{
  const [app,authSDK,dbSDK]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js')]);
  const instance=app.initializeApp(config),auth=authSDK.getAuth(instance),db=dbSDK.getFirestore(instance);
  await authSDK.setPersistence(auth,authSDK.browserSessionPersistence);await auth.authStateReady();
  return {auth,db,a:authSDK,d:dbSDK};
 })().catch(e=>{connection=null;throw friendly(e);});
}
const allowed=user=>!!user;
const merge=(seed,snapshot)=>seed.map(g=>{const saved=snapshot.docs.find(d=>d.id===String(g.id));return saved?{...g,...saved.data()}:g;});
export async function api(path,method='GET',body){try{
 const {auth,db,a,d}=await connect();
 if(path==='login'){
  if(body.username.trim()!=='admin')throw Error('Usuário ou senha incorretos.');
  const result=await a.signInWithEmailAndPassword(auth,body.email.trim(),body.password);
  if(!allowed(result.user)){await a.signOut(auth);throw Error('Esta conta não tem permissão para editar.');}return {ok:true};
 }
 if(path==='logout'){await a.signOut(auth);return {ok:true};}
 if(path==='session')return {authenticated:allowed(auth.currentUser)};
 if(path==='games'&&method==='GET'){const [seed,snapshot]=await Promise.all([seeds(),d.getDocsFromServer(d.collection(db,'cema2026'))]);return {games:merge(seed,snapshot)};}
 if(path==='games'&&method==='PUT'){
  if(!allowed(auth.currentUser))throw Error('Entre no painel novamente.');
  const seed=(await seeds()).find(g=>g.id===body.id);if(!seed)throw Error('Jogo não encontrado.');
  const game=validateGame(body,seed);
  await d.setDoc(d.doc(db,'cema2026',String(game.id)),game);return {game};
 }
 throw Error('Operação inválida.');
 }catch(e){throw friendly(e);}}
export async function watchAuth(callback){try{const {auth,a}=await connect();a.onAuthStateChanged(auth,user=>callback(allowed(user)));}catch{callback(false);}}
export async function watchGames(callback,onError){try{const {db,d}=await connect(),seed=await seeds();d.onSnapshot(d.collection(db,'cema2026'),{includeMetadataChanges:true},snapshot=>{if(snapshot.metadata.fromCache){onError(Error('Aguardando confirmação do servidor.'));return;}callback(merge(seed,snapshot));},e=>onError(friendly(e)));}catch(e){onError(friendly(e));}}
