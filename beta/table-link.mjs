// Firebase loads only when connecting a table or opening a remote display.
let dependencies;
async function firebase() {
  if(!window.HERO_KIDS_FIREBASE?.databaseURL)throw Error('The Firebase live database has not been configured yet.');
  if(!dependencies)dependencies=(async()=>{
    const [appSDK,authSDK,dbSDK]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js')
    ]);
    const app=appSDK.initializeApp(window.HERO_KIDS_FIREBASE),auth=authSDK.getAuth(app);
    await authSDK.setPersistence(auth,authSDK.browserLocalPersistence);
    await new Promise((resolve,reject)=>{const stop=authSDK.onAuthStateChanged(auth,()=>{stop();resolve();},reject);});
    const user=auth.currentUser||(await authSDK.signInAnonymously(auth)).user;
    return {...dbSDK,database:dbSDK.getDatabase(app),user};
  })().catch(error=>{dependencies=null;throw error;});
  return dependencies;
}
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roomKey='hkgm-display-room-v2';
let room,services,pending,busy=false,linkGeneration=0,stopConnection;
try {room=JSON.parse(localStorage.getItem(roomKey));}catch{}
const link={status:room?'A saved table link is ready to reconnect.':'Connect when you’re ready to share the player display.',connect,disconnect,publish,renderLinks};
function state(message) {link.status=message;const el=document.querySelector('#firebaseStatus');if(el)el.textContent=message;const connection=document.querySelector('#connection');if(connection)connection.textContent=message.startsWith('Connected')?'Table link live':message.startsWith('Connection lost')?'Display reconnecting…':'Device ready';}
function links(mode='overlay') {
  const url=new URL('overlay.html',location.href);if(mode==='stage')url.searchParams.set('mode','stage');url.hash=new URLSearchParams({owner:room.owner,room:room.room}).toString();return url.href;
}
function renderLinks() {
  const el=document.querySelector('#overlayLinks');if(!el)return;
  el.innerHTML=room?`<label>Transparent OBS URL<input readonly value="${escapeHTML(links())}" aria-label="Transparent OBS URL"></label><label>Full encounter URL<input readonly value="${escapeHTML(links('stage'))}" aria-label="Full encounter URL"></label><div class="toolbar"><button class="button quiet small" data-link-action="copy">Copy OBS URL</button><button class="button quiet small" data-link-action="stop">End table link</button></div><p class="muted">Anyone with this read-only link can see the selected display. It cannot control your game. End the table link to revoke it.</p>`:'';
}
async function connect() {
  state('Connecting to your table…');
  try {
    services=await firebase();
    if(!room||room.owner!==services.user.uid)room={owner:services.user.uid,room:Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('')};
    localStorage.setItem(roomKey,JSON.stringify(room));
    stopConnection?.();stopConnection=services.onValue(services.ref(services.database,'.info/connected'),snapshot=>state(snapshot.val()?'Connected · player display is live':'Connection lost · changes will send when online'));
    publish(window.getDisplaySnapshot());renderLinks();
  } catch(error) {services=null;state(friendly(error));}
}
function friendly(error) {
  if(error.code==='auth/operation-not-allowed')return 'Enable anonymous sign-in in Firebase Authentication before connecting.';
  if(error.code==='PERMISSION_DENIED'||error.code==='database/permission-denied')return 'Firebase denied access. The table’s security rules need checking.';
  return 'Could not connect: '+(error.message||'Check your internet connection.');
}
function publish(snapshot) {if(!services||!room)return;pending=snapshot;flush();}
async function flush() {
  if(busy||!pending||!services||!room)return;
  const current=services,target=room,generation=linkGeneration,value=pending;pending=null;busy=true;
  try {
    await current.set(current.ref(current.database,`tableDisplays/${target.owner}/${target.room}`),{...value,updatedAt:current.serverTimestamp()});
    if(generation===linkGeneration)state('Connected · player display is live');
  }catch(error){if(generation===linkGeneration)state(friendly(error));}
  finally{busy=false;if(pending)flush();}
}
async function disconnect() {
  if(!room)return;
  if(!confirm('End this table link? Existing OBS links will stop receiving the display. You can create a new link later.'))return;
  try {
    const current=services||await firebase(),target=room;
    if(target.owner!==current.user.uid)throw Error('This browser no longer owns that table link.');
    linkGeneration++;pending=null;stopConnection?.();services=null;
    await current.remove(current.ref(current.database,`tableDisplays/${target.owner}/${target.room}`));
    room=null;localStorage.removeItem(roomKey);state('Table link ended. Your local campaign is still saved.');renderLinks();
  }catch(error){state('Unable to revoke the table link: '+(error.message||'Check your connection and retry.'));}
}
export async function watchDisplay(owner,roomId,onSnapshot,onStatus) {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(owner)||!/^[a-f0-9]{32}$/.test(roomId))throw Error('Invalid display link.');
  const s=await firebase();
  s.onValue(s.ref(s.database,'.info/connected'),snapshot=>{if(!snapshot.val())onStatus('Connection lost · reconnecting…');});
  return s.onValue(s.ref(s.database,`tableDisplays/${owner}/${roomId}`),snapshot=>{
    if(snapshot.exists())onSnapshot(snapshot.val());
    else {onSnapshot({version:1,hidden:true});onStatus('This table link has ended or is not live yet.');}
  },()=>onStatus('This display link is unavailable. Ask the GM for a current link.'));
}
if(document.querySelector('#main')) {
  window.TableLink=link;renderLinks();
  document.addEventListener('click',event=>{const action=event.target.closest('[data-link-action]')?.dataset.linkAction;if(action==='stop')disconnect();if(action==='copy'&&room)navigator.clipboard.writeText(links()).then(()=>state('Read-only OBS URL copied.')).catch(()=>state('Select the URL above and copy it manually.'));});
  setInterval(()=>{if(services&&room)publish(window.getDisplaySnapshot());},15000);
  if(room)connect();
}
