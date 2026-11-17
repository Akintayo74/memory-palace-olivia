(function(){
'use strict';

var C_WORDS='anchor anvil apple apron arrow axe backpack badge balloon bamboo banana bandage barrel basket battery beard bee bell belt bicycle binoculars blanket blender boat bone book boot bottle bowl bracelet bread brick bridge broom brush bucket bulb bull bus butterfly button cabbage cactus cage cake calculator camel camera candle cannon canoe carrot cart castle cat chain chalk cheese chimney chisel cloud coat cobweb coconut coffin coin comb compass cork cow crab crane crayon crocodile crown crutch cup dagger diamond dice dog doll dolphin donkey dragon drill drum duck eagle egg elephant envelope eraser feather fence fiddle fish flag flute fork fountain fox frog funnel garlic generator ghost giraffe glove goat goggles gong gorilla grapes guitar hammer hammock harp hat helicopter helmet hen hinge hippo hoe honey hook horn horse hose igloo jacket jar jeep jug kangaroo kettle key keyboard kite knife ladder ladle lantern leaf lemon leopard lighthouse lion lizard lobster lorry magnet mango map mask matchbox medal microphone microscope monkey moon mop mortar mosquito motorbike mouse mug mushroom nail necklace needle nest net notebook octopus onion orange ostrich owl paddle padlock paintbrush parachute parrot peacock pearl pedal pencil penguin pepper piano pig pigeon pineapple pipe plate pliers plug potato pram pumpkin puppet pyramid rabbit radio raft rake razor ring robot rocket rope ruler saddle sandal saxophone scarf scissors scooter screw shark sheep shell shield ship shoe shovel skateboard skull sledge snail snake soap sock spade spanner spider sponge spoon stamp stapler statue straw suitcase sword syringe tambourine tank teapot telescope tent thermometer thimble throne tiger toaster tomato toothbrush torch tortoise towel tractor train trampoline tray trolley trombone trophy trumpet tunnel turkey tyre umbrella vase violin volcano vulture waistcoat wallet watch waterfall watermelon whale wheelbarrow wheelchair whip whistle wig windmill wolf worm yam zebra'.split(' ');

var A_WORDS='justice courage logic freedom envy patience rumour victory doubt habit honesty tradition danger mercy profit silence talent theory luck pride memory debt promise chaos wisdom boredom energy fashion guilt peace culture hunger risk faith method fame delay glory purpose trust economy hope error loyalty climate fear opinion speed shame growth ambition anger beauty belief chance charity comfort conflict crisis curiosity defeat desire destiny duty effort equality evil excuse failure fate fortune fury genius gossip grace gratitude greed grief harmony health history honour humour idea illusion impulse insult jealousy joy kindness knowledge law leisure liberty loss love magic mystery nature noise order pain panic passion pity pleasure poverty power progress quality reason regret relief revenge rhythm science secret skill sorrow spirit strength stress success surprise sympathy temper thought time truth value virtue war wealth weakness wit wonder worry youth zeal'.split(' ');

function uniq(a){var seen={},out=[];for(var i=0;i<a.length;i++){if(!seen[a[i]]){seen[a[i]]=1;out.push(a[i]);}}return out;}
var POOL={c:uniq(C_WORDS),a:uniq(A_WORDS)};
var ALL={};POOL.c.concat(POOL.a).forEach(function(w){ALL[w]=1;});

var ORDER=['0','1','2','3','4','5a','5b','6','7','exam','done'];
var STEPS=['0','1','2','3','4','5','6','7','E'];
var L={
  '0':{num:'0',name:'Build',fresh:'the route. No memorising yet.'},
  '1':{num:'1',name:'Images',fresh:'the image and its bind.',n:10,kind:'c',limit:null,min:10,need:3,hold:null,pals:2,
       note:'Make each image oversized, doing something to the locus, with one more sense.'},
  '2':{num:'2',name:'Speed',fresh:'the clock.',n:10,kind:'c',limit:120,min:10,need:3,hold:null,pals:2,
       note:'Take the first image that arrives. One look, then walk.'},
  '3':{num:'3',name:'Size',fresh:'length.',n:20,kind:'c',limit:240,min:19,need:3,hold:null,pals:3,
       note:'Before your first session, extend palaces A and B to 20 loci and build Palace C.'},
  '4':{num:'4',name:'Hold',fresh:'time.',n:20,kind:'c',limit:240,min:19,need:3,hold:17,pals:3,
       note:'Each list is now tested again at the start of your next session. After scoring, walk the palace once more with the list in view.'},
  '5a':{num:'5',name:'Abstraction',sub:'first step',fresh:'words with no picture.',n:10,kind:'a',limit:null,min:9,need:2,hold:null,pals:3,
       note:'Translate each word first: sounds like, stands for, or a person.'},
  '5b':{num:'5',name:'Abstraction',fresh:'words with no picture, mixed with concrete ones.',n:20,kind:'m',limit:300,min:18,need:3,hold:16,pals:3,
       note:'Ten abstract words, then ten concrete ones.'},
  '6':{num:'6',name:'Density',fresh:'two images per locus.',n:20,kind:'c',pairs:true,limit:240,min:18,need:3,hold:16,pals:3,
       note:'Two words per locus. The first word does something to the second.'},
  '7':{num:'7',name:'Keep',fresh:'real material you want for good.'},
  'exam':{num:'E',name:'Exit exam',fresh:'everything at once.',n:20,kind:'m',pairs:true,limit:240,min:18,need:1,hold:16,pals:3,
       note:'Twenty mixed words, two per locus. One session, then tomorrow\'s check.'},
  'done':{num:'E',name:'Course complete',fresh:''}
};
var REVIEW_DAYS=[0,1,3,7,14,30];
var REVIEW_LABEL=['10 minutes after encoding','The next day','3 days after','7 days after','2 weeks after','1 month after'];

/* ---------- pure helpers ---------- */
function pad(n){return n<10?'0'+n:''+n;}
function dayStr(ts){var d=new Date(ts==null?Date.now():ts);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function addDays(day,n){var p=day.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function dayGap(a,b){var x=a.split('-'),y=b.split('-');return Math.round((new Date(+y[0],+y[1]-1,+y[2])-new Date(+x[0],+x[1]-1,+x[2]))/864e5);}
var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dayShort(day){var p=day.split('-');return (+p[2])+' '+MONTHS[+p[1]-1];}
function fmt(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+pad(sec%60);}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z]/g,'');}
function lev(a,b){
  var m=a.length,n=b.length,i,j;if(!m)return n;if(!n)return m;
  var prev=[],cur=[];for(j=0;j<=n;j++)prev[j]=j;
  for(i=1;i<=m;i++){cur=[i];for(j=1;j<=n;j++){cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));}prev=cur;}
  return prev[n];
}
/* a typed answer matches when it is the word, or a small typo of it that is not itself another list word */
function same(ans,target){
  if(!ans)return false;if(ans===target)return true;if(ALL[ans])return false;
  var t=target.length,tol=t>=9?2:t>=5?1:0;
  return tol>0&&lev(ans,target)<=tol;
}
function scoreList(items,answers){
  var a=answers.map(norm);
  var rows=items.map(function(w,i){
    var ok=same(a[i],w),kind='ok';
    if(!ok){
      if(!a[i])kind='blank';
      else if(items.some(function(x,j){return j!==i&&same(a[i],x);}))kind='moved';
      else kind='wrong';
    }
    return {w:w,a:answers[i]||'',ok:ok,kind:kind};
  });
  return {rows:rows,score:rows.filter(function(r){return r.ok;}).length};
}
function samePass(cfg,score,sec){return score>=cfg.min&&(cfg.limit==null||sec<=cfg.limit);}
function counted(st,lv){return st.sessions.filter(function(s){return s.lv===lv&&!s.half&&!s.practice;});}
function streakOf(st,lv){
  var cfg=L[lv],list=counted(st,lv),count=0,waiting=0;
  for(var i=list.length-1;i>=0;i--){
    var s=list[i];
    if(cfg.hold&&s.hold==null){waiting++;continue;}
    if(s.pass&&(!cfg.hold||s.hold>=cfg.hold))count++;else break;
  }
  return {count:count,waiting:waiting,need:cfg.need,passed:count>=cfg.need};
}
function twoMisses(st,lv){
  var cfg=L[lv],list=counted(st,lv).filter(function(s){return !(cfg.hold&&s.hold==null);});
  if(list.length<2)return false;
  return list.slice(-2).every(function(s){return !(s.pass&&(!cfg.hold||s.hold>=cfg.hold));});
}
function advance(st){
  var lv=st.level,cfg=L[lv];if(!cfg||!cfg.n)return false;
  if(streakOf(st,lv).passed){st.level=ORDER[ORDER.indexOf(lv)+1];return true;}
  return false;
}
function l7Passed(st){var r=st.l7.r;return r[4]==='ok'||r[5]==='ok'||r[6]==='ok';}
function gateText(cfg){
  var s=cfg.min+' of '+cfg.n;
  if(cfg.limit)s+=' in '+fmt(cfg.limit)+' or less';
  if(cfg.pairs)s+=', pairs in order';
  if(cfg.hold)s+=', and '+cfg.hold+' of '+cfg.n+' the next day';
  s+='. '+(cfg.need===1?'One session.':cfg.need===2?'Twice in a row.':'Three sessions in a row.');
  if(!cfg.limit)s+=' Untimed.';
  return s;
}
function blank(){return {v:1,level:'0',sessions:[],pending:null,used:{c:[],a:[]},lastPal:null,l0:[],l7:{on:null,r:{}},updatedAt:0};}
function fill(s){var b=blank();for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))b[k]=s[k];}
  if(!b.used||!b.used.c)b.used={c:[],a:[]};if(!b.l7||!b.l7.r)b.l7={on:null,r:{}};if(!Array.isArray(b.sessions))b.sessions=[];if(!Array.isArray(b.l0))b.l0=[];
  if(ORDER.indexOf(b.level)<0)b.level='0';return b;}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function take(st,key,k){
  var pool=POOL[key],used={},free=[],i;
  st.used[key].forEach(function(x){used[x]=1;});
  for(i=0;i<pool.length;i++)if(!used[i])free.push(i);
  if(free.length<k){st.used[key]=[];free=[];for(i=0;i<pool.length;i++)free.push(i);}
  var idx=shuffle(free).slice(0,k);
  st.used[key]=st.used[key].concat(idx);
  return idx.map(function(x){return pool[x];});
}
function pick(st,kind,n){
  if(kind==='m')return take(st,'a',n/2).concat(take(st,'c',n/2));
  return take(st,kind,n);
}
function drillCfg(lv){return lv==='7'?L['6']:lv==='done'?L.exam:L[lv];}
function nextPal(st,cfg){var pals=['A','B','C'].slice(0,cfg.pals||3);return pals[(pals.indexOf(st.lastPal)+1)%pals.length];}
function roomsText(loci){var r=Math.ceil(loci/5);return r<=1?'room 1':r===2?'rooms 1 and 2':r===3?'rooms 1 to 3':'all four rooms';}
function levelLabel(lv){var c=L[lv];return lv==='exam'?'Exit exam':lv==='done'?'Practice':'Level '+c.num;}

var API={norm:norm,lev:lev,same:same,scoreList:scoreList,samePass:samePass,streakOf:streakOf,advance:advance,blank:blank,pick:pick,
  gateText:gateText,L:L,POOL:POOL,dayStr:dayStr,addDays:addDays,dayGap:dayGap,nextPal:nextPal,twoMisses:twoMisses,l7Passed:l7Passed,fmt:fmt};
if(typeof module!=='undefined'&&module.exports){module.exports=API;}
if(typeof document==='undefined')return;

/* ---------- state and storage ---------- */
/* Local-first: this browser's storage is the source of truth. Sync is optional and
   keeps one JSON document on the server under a private code. Newest save wins. */
var KEY='loci-trainer-v1',CODE_KEY='loci-sync-code';
var state=(function(){try{var raw=localStorage.getItem(KEY);if(raw){var s=JSON.parse(raw);if(s&&s.v===1)return fill(s);}}catch(e){}return blank();})();
var ui={view:'home'};
var code=(function(){try{return localStorage.getItem(CODE_KEY)||null;}catch(e){return null;}})();
var sync=code?'wait':'off',writing=false,dirty=false,unsent=false;
var app=document.getElementById('app');
var timer=null;
var ALPHA='abcdefghjkmnpqrstuvwxyz23456789';

function cleanCode(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function validCode(s){return /^[a-hjkmnp-z2-9]{20}$/.test(s);}
function showCode(s){return s.replace(/(.{5})(?=.)/g,'$1-');}
function newCode(){
  var out='',buf=new Uint8Array(64);
  while(out.length<20){crypto.getRandomValues(buf);for(var i=0;i<buf.length&&out.length<20;i++){if(buf[i]<248)out+=ALPHA.charAt(buf[i]%31);}}
  return out;
}
function syncText(){
  return sync==='off'?'Progress is saved on this device.'
    :sync==='ok'?'Progress is saved here and synced.'
    :sync==='wait'?'Syncing.'
    :sync==='offline'?'Offline. Progress is saved here and will sync when you are back online.'
    :'The sync service could not be reached. Progress is safe on this device.';
}
function syncBadge(){return sync==='off'?'This device':sync==='ok'?'Synced':sync==='wait'?'Syncing':sync==='offline'?'Offline':'Not synced';}
function setSync(m){sync=m;var a=document.getElementById('sync'),b=document.getElementById('badge');if(a)a.textContent=syncText();if(b){b.textContent=syncBadge();b.parentNode.className='badge '+sync;}}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function save(){state.updatedAt=Date.now();saveLocal();push();}
function api(method,body,withCode){
  return fetch('/api/state',{method:method,cache:'no-store',headers:{'Authorization':'Bearer '+(withCode||code),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
}
function fail(){setSync(navigator.onLine===false?'offline':'error');}
function push(){
  if(!code)return;if(writing){dirty=true;return;}
  writing=true;dirty=false;setSync('wait');
  api('PUT',state).then(function(r){writing=false;if(!r.ok)throw 0;unsent=false;setSync('ok');if(dirty)push();})
    .catch(function(){writing=false;unsent=true;fail();});
}
function pull(){
  if(!code)return;setSync('wait');
  api('GET').then(function(r){
    if(r.status===404){if(state.updatedAt)push();else setSync('ok');return;}
    if(!r.ok)throw 0;
    return r.json().then(function(remote){
      var mine=state.updatedAt||0,theirs=(remote&&remote.v===1&&remote.updatedAt)||0;
      if(theirs>mine&&ui.view==='home'){state=fill(remote);saveLocal();setSync('ok');render();}
      else if(mine>theirs)push();
      else setSync('ok');
    });
  }).catch(fail);
}
function join(raw){
  var c=cleanCode(raw);
  if(!validCode(c)){ui.syncErr='That code is not the right shape. It has 20 letters and digits.';render();return;}
  ui.syncErr=null;ui.busy=true;render();
  api('GET',null,c).then(function(r){
    if(r.status===404){ui.busy=false;ui.syncErr='No progress is stored under that code. Check it against your other device.';render();return;}
    if(!r.ok)throw 0;
    return r.json().then(function(remote){
      code=c;try{localStorage.setItem(CODE_KEY,c);}catch(e){}
      ui.busy=false;ui.joinVal='';sync='ok';state=fill(remote);saveLocal();render();
    });
  }).catch(function(){ui.busy=false;ui.syncErr='The sync service could not be reached. Try again when you are online.';render();});
}

/* ---------- view pieces ---------- */
function top(){return '<header class="top"><span>Memory Palace Trainer</span><span class="badge '+sync+'"><i></i><span id="badge">'+syncBadge()+'</span></span></header>';}
function steps(){
  var num=L[state.level].num,at=state.level==='done'?STEPS.length:STEPS.indexOf(num);
  var out='';for(var i=0;i<STEPS.length;i++)out+='<i class="'+(i<at?'done':i===at?'now':'')+'"></i>';
  return '<div class="steps" role="img" aria-label="'+(state.level==='done'?'All levels passed':esc(levelLabel(state.level))+' of 7, then the exit exam')+'">'+out+'</div>';
}
function squares(count,need,waiting){
  var out='';for(var i=0;i<need;i++)out+='<i class="'+(i<count?'on':(i<count+waiting?'wait':''))+'"></i>';
  return '<span class="streak" aria-hidden="true">'+out+'</span>';
}
function flash(){var f=ui.flash;return f?'<p class="banner">'+esc(f)+'</p>':'';}
function upText(lv){
  if(lv==='done')return 'Exam passed. The course is complete.';
  if(lv==='exam')return 'Gate passed. The exit exam is unlocked.';
  var c=L[lv];return 'Gate passed. Level '+c.num+', '+c.name+(c.sub?' ('+c.sub+')':'')+', is unlocked.';
}
function logRows(list){
  return list.map(function(s){
    var c=L[s.lv]||{},lab=s.lv==='exam'?'Exam':s.lv==='done'?'Free':(c.num+(s.lv==='5a'?'a':s.lv==='5b'?'b':''));
    if(s.half)lab+=' half';else if(s.practice)lab+=' prac';
    var cls=(s.half||s.practice)?'':(s.pass?'pass':'fail');
    var hold=s.hold!=null?(s.hold+'/'+s.n):(state.pending&&state.pending.t===s.t?'due':'');
    return '<tr><td>'+dayShort(s.day)+'</td><td>'+lab+'</td><td>'+s.pal+'</td><td class="'+cls+'">'+s.score+'/'+s.n+'</td><td>'+fmt(s.sec)+'</td><td>'+hold+'</td></tr>';
  }).join('');
}
function logTable(list){return '<div class="tablewrap"><table class="log"><thead><tr><th>Date</th><th>Level</th><th>Palace</th><th>Score</th><th>Time</th><th>Next day</th></tr></thead><tbody>'+logRows(list)+'</tbody></table></div>';}
function logSection(){
  var all=state.sessions.slice().reverse();
  var out='<section><h2>Sessions</h2>';
  if(!all.length)out+='<p class="empty">Nothing logged yet. Your sessions will appear here.</p>';
  else{
    out+=logTable(all.slice(0,5));
    if(all.length>5)out+='<details><summary>All '+all.length+' sessions</summary>'+logTable(all)+'</details>';
  }
  return out+'</section>';
}
function foot(){
  var o=ui.open,s='<footer><span id="sync">'+syncText()+'</span>';
  s+='<details data-d="sync"'+(o==='sync'?' open':'')+'><summary>Sync between devices</summary><div class="panel">';
  if(code){
    s+='<p>This device syncs under the code below. Enter it on your other device. Anyone with the code can read and change your progress.</p>'+
      '<p class="code">'+showCode(code)+'</p>'+
      '<div class="acts"><button class="pill" data-act="copy-code">'+(ui.copiedCode||'Copy the code')+'</button><button class="pill" data-act="sync-off">Stop syncing here</button></div>';
  }else{
    s+='<p>To use a second device, create a code here and enter it there. Anyone with the code can read and change your progress, so keep it private.</p>'+
      '<div class="acts"><button class="pill" data-act="sync-new">Create a sync code</button></div>'+
      '<form data-form="join" class="join" novalidate><label for="joincode">Or enter a code from another device. This replaces the progress on this device.</label>'+
      '<div class="acts"><input id="joincode" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="xxxxx-xxxxx-xxxxx-xxxxx" value="'+esc(ui.joinVal||'')+'">'+
      '<button class="pill" type="submit"'+(ui.busy?' disabled':'')+'>'+(ui.busy?'Connecting':'Connect')+'</button></div></form>'+
      (ui.syncErr?'<p class="err">'+esc(ui.syncErr)+'</p>':'');
  }
  s+='</div></details>';
  s+='<details data-d="backup"'+(o==='backup'?' open':'')+'><summary>Backup</summary><div class="panel">';
  if(ui.restore){
    s+='<p>Replace the progress on this device with this backup? It holds '+ui.restore.sessions.length+' sessions, at '+esc(levelLabel(ui.restore.level))+'.</p>'+
      '<div class="acts"><button class="pill" data-act="restore-yes">Replace</button><button class="pill" data-act="restore-no">Cancel</button></div>';
  }else{
    s+='<div class="acts"><button class="pill" data-act="backup">Download a backup</button><label class="pill" for="restore">Restore from a backup</label>'+
      '<input id="restore" class="file" type="file" accept="application/json,.json">'+
      '<button class="pill" data-act="copy">'+(ui.copied||'Copy the log as CSV')+'</button></div>'+
      (ui.restoreErr?'<p class="err">'+esc(ui.restoreErr)+'</p>':'');
  }
  s+='</div></details>';
  s+='<details data-d="reset"'+(o==='reset'?' open':'')+'><summary>Reset</summary><div class="panel"><div class="acts"><button class="pill" data-act="reset">'+(ui.arm?'Tap again to erase all progress':'Erase all progress')+'</button></div></div></details>';
  return s+'</footer>';
}
function head(lv){
  var c=L[lv];
  return steps()+'<p class="eyebrow">'+(lv==='exam'?'Final gate':esc(levelLabel(lv)))+'</p><h1>'+esc(c.name)+(c.sub?' <small>'+esc(c.sub)+'</small>':'')+'</h1>'+
    (c.fresh?'<p class="fresh">New this level: '+esc(c.fresh)+'</p>':'');
}
function todayLine(cfg,half){
  var n=half?cfg.n/2:cfg.n,loci=cfg.pairs?n/2:n;
  return 'Palace '+nextPal(state,cfg)+', '+roomsText(loci)+'. '+n+' words'+(cfg.pairs?', two per locus.':'.');
}

/* ---------- home views ---------- */
function homeDrill(){
  var lv=state.level,cfg=L[lv],st=streakOf(state,lv),p=state.pending,today=dayStr();
  var checkDue=p&&p.day<today,sameDay=cfg.hold&&p&&p.day===today;
  var notes='';
  if(checkDue)notes+='<p class="note">This session starts with the check on your last list (Palace '+p.pal+', '+dayShort(p.day)+').</p>';
  if(sameDay)notes+='<p class="note">Today\'s counted session is done. Its check comes tomorrow. Anything more today is practice.</p>';
  if(twoMisses(state,lv))notes+='<p class="note">Two misses in a row. Do a half session next and hit the same accuracy before going back up.</p>';
  else if(!counted(state,lv).length&&cfg.note)notes+='<p class="note">'+esc(cfg.note)+'</p>';
  return '<main>'+top()+head(lv)+
    '<dl class="facts">'+
      '<div><dt>Gate</dt><dd>'+esc(gateText(cfg))+'</dd></div>'+
      '<div><dt>Streak</dt><dd>'+squares(st.count,st.need,st.waiting)+st.count+' of '+st.need+(st.waiting?', one waiting on its check':'')+'</dd></div>'+
      '<div><dt>Today</dt><dd>'+esc(todayLine(cfg,false))+'</dd></div>'+
    '</dl>'+flash()+notes+
    '<div class="stack"><button class="primary" data-act="start">'+(sameDay?'Start a practice session':'Start session')+'</button>'+
    '<button class="quiet" data-act="half">Half session, '+(cfg.n/2)+' words. Does not count.</button></div>'+
    logSection()+foot()+'</main>';
}
function swText(){var w=ui.sw||{};var sec=w.start?(Date.now()-w.start)/1000:(w.last||0);return sec.toFixed(1)+' s';}
function homeL0(){
  var today=dayStr(),done=state.l0.indexOf(today)>=0,count=state.l0.length;
  return '<main>'+top()+head('0')+
    '<dl class="facts">'+
      '<div><dt>Gate</dt><dd>Both palaces forward and backward in 20 seconds or less per walk, and 5 of 5 random positions. Two sessions in a row.</dd></div>'+
      '<div><dt>Streak</dt><dd>'+squares(count,2,0)+count+' of 2</dd></div>'+
      '<div><dt>Timer</dt><dd><div class="sw"><b id="sw">'+swText()+'</b><button class="pill" data-act="sw">'+((ui.sw&&ui.sw.start)?'Stop':'Time a walk')+'</button></div></dd></div>'+
    '</dl>'+flash()+
    (count===0?'<p class="note">First build Palace A and Palace B: two rooms each, five loci per room. Pick fixed, furniture-sized things, a few steps apart, with no twins, and go round each room the same way.</p>':'')+
    (done?'<p class="note">Logged for today. Run the drill again tomorrow.</p>':
      '<div class="stack"><button class="primary" data-act="l0-pass">I passed the gate drill today</button><button class="quiet" data-act="l0-fail">Not yet. Reset the streak.</button></div>')+
    logSection()+foot()+'</main>';
}
function homeL7(){
  var k=state.l7,today=dayStr(),body='';
  if(!k.on){
    body='<p class="note">Choose 20 ordered items you want to keep. Build Palace D with 10 loci and reserve it. Encode two items per locus, untimed.</p>'+
      '<div class="stack"><button class="primary" data-act="l7-on">I encoded my 20 items today</button></div>';
  }else{
    var rows='',allMissed=k.r[4]==='miss'&&k.r[5]==='miss'&&k.r[6]==='miss';
    for(var i=1;i<=6;i++){
      var due=addDays(k.on,REVIEW_DAYS[i-1]),r=k.r[i],right;
      if(r)right='<span class="st '+r+'">'+(r==='ok'?'20 of 20':'Missed some')+'</span>';
      else if(due<=today)right='<span class="acts"><button class="pill" data-act="l7-ok" data-i="'+i+'">20 of 20</button><button class="pill" data-act="l7-miss" data-i="'+i+'">Missed some</button></span>';
      else right='<span class="st">Due '+dayShort(due)+'</span>';
      rows+='<li><span>Review '+i+'. '+REVIEW_LABEL[i-1]+(i===4?' (the gate)':'')+'</span>'+right+'</li>';
    }
    body='<h2>Reviews of Palace D, encoded '+dayShort(k.on)+'</h2><ul class="reviews">'+rows+'</ul>'+
      (allMissed?'<div class="stack"><button class="quiet" data-act="l7-restart">Re-encode and restart the reviews</button></div>':'');
  }
  return '<main>'+top()+head('7')+
    '<dl class="facts"><div><dt>Gate</dt><dd>20 of 20 on review 4, the 7-day review. If anything is missing, repair it and the gate moves to the next review.</dd></div></dl>'+
    flash()+body+
    '<h2>Keep your speed up</h2><div class="stack"><button class="primary" data-act="start">Practice drill, Level 6 format</button>'+
    '<button class="quiet" data-act="half">Half drill, 10 words.</button></div>'+
    logSection()+foot()+'</main>';
}
function homeDone(){
  return '<main>'+top()+steps()+'<p class="eyebrow">All gates passed</p><h1>Course complete</h1>'+
    '<p class="fresh">Tell Claude you passed, and choose the next track: numbers, cards, names, or verse.</p>'+flash()+
    '<div class="stack"><button class="primary" data-act="start">Practice session, exam format</button>'+
    '<button class="quiet" data-act="half">Half session, 10 words.</button></div>'+
    logSection()+foot()+'</main>';
}

/* ---------- session views ---------- */
function vBegin(){
  var s=ui.s,loci=s.pairs?s.n/2:s.n;
  var rules='<li>Palace '+s.pal+', '+roomsText(loci)+'.</li><li>Each '+(s.pairs?'pair':'word')+' shows once. There is no going back.</li>'+
    '<li>Tap Next, or press Space, when the image is placed.</li>'+
    (s.limit?'<li>The clock starts with the first '+(s.pairs?'pair':'word')+'. Target '+fmt(s.limit)+'.</li>':'<li>'+(s.half||s.practice?'Not counted toward the gate.':'Untimed. Get the image right.')+'</li>');
  return '<main class="focus"><p class="eyebrow">'+esc(levelLabel(s.lv))+(s.half?', half session':s.practice?', practice':'')+'</p>'+
    '<h1>'+s.n+' words, '+(s.pairs?'two per locus':'one per locus')+'</h1><ul class="rules">'+rules+'</ul>'+
    '<div class="stack"><button class="primary" data-act="go">Begin</button><button class="quiet" data-act="home">Cancel</button></div></main>';
}
function vEncode(){
  var s=ui.s,total=s.pairs?s.n/2:s.n,i=s.i,word;
  if(s.pairs)word='<div class="word pair"><span>'+esc(s.items[2*i])+'</span><em>acts on</em><span>'+esc(s.items[2*i+1])+'</span></div>';
  else word='<div class="word"><span>'+esc(s.items[i])+'</span></div>';
  return '<main class="encode"><div class="bar"><span><b>'+(i+1)+'</b> / '+total+'</span><span>Room '+(Math.floor(i/5)+1)+', spot '+(i%5+1)+'</span>'+
    '<span id="clock">'+(s.limit?fmt((Date.now()-s.t0)/1000)+' / '+fmt(s.limit):'')+'</span></div>'+
    '<div class="stage" aria-live="polite"><div class="m"></div><div class="c"></div>'+word+'</div>'+
    '<button class="primary" data-act="next">'+(i+1===total?'Done':'Next')+'</button></main>';
}
function vGap(){
  var s=ui.s;
  return '<main class="focus"><p class="eyebrow">Gap</p><p class="count" id="count">'+fmt(Math.ceil((s.gapEnd-Date.now())/1000))+'</p>'+
    '<div class="gapbar"><i id="gapbar"></i></div><p class="lede">Look away. Count down from '+s.gapFrom+' in sevens, out loud.</p></main>';
}
function inputs(prefix,n,pairs,answers){
  var out='',loci=pairs?n/2:n;
  for(var r=0;r<Math.ceil(loci/5);r++){
    out+='<fieldset><legend>Room '+(r+1)+'</legend>';
    for(var k=r*5;k<Math.min(loci,r*5+5);k++){
      var ids=pairs?[2*k,2*k+1]:[k];
      out+='<div class="row'+(pairs?' two':'')+'"><span>'+(k+1)+'</span>'+ids.map(function(x,j){
        return '<input id="'+prefix+x+'" data-i="'+x+'" type="text" inputmode="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="'+(x===n-1?'done':'next')+'" aria-label="Locus '+(k+1)+(pairs?(j?', second word':', first word'):'')+'" value="'+esc(answers[x]||'')+'">';
      }).join('')+'</div>';
    }
    out+='</fieldset>';
  }
  return out;
}
function vRecall(){
  var s=ui.s;
  return '<main class="sheet"><p class="eyebrow">Recall, Palace '+s.pal+'</p><h1>Walk the route</h1>'+
    '<form id="form" data-form="recall" novalidate>'+inputs('a',s.n,s.pairs,s.answers)+'<button class="primary" type="submit">Score it</button></form></main>';
}
function vCheck(){
  var p=state.pending,gap=dayGap(p.day,dayStr());
  return '<main class="sheet"><p class="eyebrow">Check, Palace '+p.pal+'</p><h1>'+(gap===1?'Yesterday\'s list':'The list from '+gap+' days ago')+'</h1>'+
    '<p class="lede" style="margin-bottom:20px">Recall it cold. No peeking, no warm-up walk.</p>'+
    '<form id="form" data-form="check" novalidate>'+inputs('a',p.items.length,p.pairs,ui.c.answers)+'<button class="primary" type="submit">Score it</button></form></main>';
}
var TAG={blank:'empty',moved:'wrong place',wrong:'wrong word'};
function marks(res,pairs){
  return '<ol class="marks">'+res.rows.map(function(r,i){
    var n=pairs?(Math.floor(i/2)+1)+(i%2?'b':'a'):(i+1);
    return '<li class="'+(r.ok?'ok':'miss')+'"><span class="n">'+n+'</span><span class="w">'+esc(r.w)+(!r.ok&&r.a?'<s>'+esc(r.a)+'</s>':'')+'</span><span class="t">'+(r.ok?'':TAG[r.kind])+'</span></li>';
  }).join('')+'</ol>';
}
function hint(res,pairs,kind){
  var c={blank:0,moved:0,wrong:0};res.rows.forEach(function(r){if(!r.ok)c[r.kind]++;});
  var worst=Object.keys(c).sort(function(a,b){return c[b]-c[a];})[0];
  if(!c[worst])return '';
  var t=worst==='blank'?'Empty spots are a bind problem. Make the image damage, fill or block the locus.'
    :worst==='moved'?(pairs?'Swapped words mean the action could run either way. Choose actions with one direction: pouring, eating, wearing.':'Right words in the wrong place is a route problem. Spend a session on the walk drill.')
    :(kind==='c'?'Wrong words mean the image was generic. Picture the feature that makes it that exact thing.':'Wrong words on abstract items mean the picture did not point back. Add a sound tag.');
  return '<p class="note">'+t+'</p>';
}
function vResult(){
  var s=ui.s,res=s.res,cfg=drillCfg(s.lv),v;
  if(s.half||s.practice)v='<p class="verdict wait">'+(s.half?'Half session. Not counted toward the gate.':'Practice. Not counted toward the gate.')+'</p>';
  else if(!s.pass)v='<p class="verdict bad">Not this time. The gate needs '+cfg.min+' of '+cfg.n+(cfg.limit?' in '+fmt(cfg.limit):'')+'.</p>';
  else if(cfg.hold)v='<p class="verdict wait">Today\'s half of the gate is met. The other half is the next-day check: '+cfg.hold+' of '+cfg.n+'.</p>';
  else v='<p class="verdict good">Gate met.</p>';
  return '<main class="sheet"><p class="eyebrow">'+esc(levelLabel(s.lv))+', Palace '+s.pal+'</p>'+
    '<div class="score"><span class="big">'+res.score+'</span><span class="of">of '+s.n+'</span><span class="time">'+fmt(s.sec)+'</span></div>'+
    v+flash()+hint(res,s.pairs,s.kind)+
    (cfg.hold?'<p class="note">Review walk: go through the palace once more with this list in view, and repair every image that failed or felt thin.</p>':'')+
    marks(res,s.pairs)+'<div class="stack"><button class="primary" data-act="home">Done</button></div></main>';
}
function vCheckResult(){
  var c=ui.c,p=c.p,cfg=L[p.lv]||{},n=p.items.length,ok=cfg.hold&&c.res.score>=cfg.hold;
  return '<main class="sheet"><p class="eyebrow">Check, Palace '+p.pal+', list of '+dayShort(p.day)+'</p>'+
    '<div class="score"><span class="big">'+c.res.score+'</span><span class="of">of '+n+' held</span></div>'+
    (p.counts?'<p class="verdict '+(ok?'good':'bad')+'">'+(ok?'Hold target met.':'Under the hold target of '+cfg.hold+' of '+n+'.')+'</p>':'')+
    flash()+marks(c.res,p.pairs)+
    '<div class="stack"><button class="primary" data-act="after-check">'+(c.up?'Continue':'Continue to today\'s session')+'</button></div></main>';
}

var VIEWS={
  home:function(){var lv=state.level;return lv==='0'?homeL0():lv==='7'?homeL7():lv==='done'?homeDone():homeDrill();},
  begin:vBegin,encode:vEncode,gap:vGap,recall:vRecall,result:vResult,check:vCheck,checkResult:vCheckResult
};

function render(){
  if(timer){clearInterval(timer);timer=null;}
  var html;
  try{html=VIEWS[ui.view]();}catch(e){ui={view:'home'};html=VIEWS.home();}
  app.innerHTML=html;
  var v=ui.view;
  if(v==='home'&&ui.sw&&ui.sw.start){timer=setInterval(function(){var el=document.getElementById('sw');if(el)el.textContent=swText();},100);}
  if(v==='encode'&&ui.s.limit){timer=setInterval(function(){var el=document.getElementById('clock');if(el)el.textContent=fmt((Date.now()-ui.s.t0)/1000)+' / '+fmt(ui.s.limit);},250);}
  if(v==='gap'){var tick=function(){
      var left=ui.s.gapEnd-Date.now();
      if(left<=0){ui.view='recall';render();return;}
      var a=document.getElementById('count'),b=document.getElementById('gapbar');
      if(a)a.textContent=fmt(Math.ceil(left/1000));if(b)b.style.width=(100-left/600)+'%';
    };tick();if(ui.view==='gap')timer=setInterval(tick,200);}
  if(v==='recall'||v==='check'){var f=app.querySelector('input');if(f)f.focus();}
  if(v!=='home')window.scrollTo(0,0);
}

/* ---------- actions ---------- */
function start(half){
  ui.want=half?'half':'full';ui.flash=null;
  var p=state.pending;
  if(p&&p.day<dayStr()){ui.c={answers:p.items.map(function(){return '';})};ui.view='check';render();return;}
  prepare();
}
function prepare(){
  var lv=state.level;
  if(lv==='0'){ui.view='home';render();return;}
  var cfg=drillCfg(lv),half=ui.want==='half';
  var practice=lv==='7'||lv==='done'||!!(cfg.hold&&state.pending);
  var n=half?cfg.n/2:cfg.n;
  ui.s={lv:lv,n:n,half:half,practice:practice&&!half,pal:nextPal(state,cfg),pairs:!!cfg.pairs,kind:cfg.kind,limit:half?null:cfg.limit,i:0,items:null,answers:[]};
  ui.view='begin';render();
}
function go(){
  var s=ui.s;s.items=pick(state,s.kind,s.n);s.answers=s.items.map(function(){return '';});
  s.i=0;s.t0=Date.now();s.shown=Date.now();ui.view='encode';render();
}
function next(){
  var s=ui.s,total=s.pairs?s.n/2:s.n;
  if(Date.now()-s.shown<350)return;
  if(s.i+1>=total){
    s.sec=Math.round((Date.now()-s.t0)/100)/10;
    s.gapEnd=Date.now()+60000;s.gapFrom=150+Math.floor(Math.random()*100);
    ui.view='gap';render();return;
  }
  s.i++;s.shown=Date.now();render();
}
function submitRecall(){
  var s=ui.s,cfg=drillCfg(s.lv),res=scoreList(s.items,s.answers),now=Date.now();
  s.res=res;s.pass=!s.half&&samePass(cfg,res.score,s.sec);
  var rec={t:now,day:dayStr(now),lv:s.lv,pal:s.pal,n:s.n,sec:s.sec,score:res.score,half:!!s.half,practice:!!s.practice,pass:!!s.pass,hold:null};
  state.sessions.push(rec);state.lastPal=s.pal;
  var counts=!s.half&&!s.practice;
  if(counts&&cfg.hold){state.pending={t:now,day:rec.day,lv:s.lv,pal:s.pal,items:s.items,pairs:s.pairs,counts:true};}
  var before=state.level;
  if(counts&&!cfg.hold&&advance(state))ui.flash=upText(state.level);
  save();ui.view='result';render();
}
function submitCheck(){
  var p=state.pending,res=scoreList(p.items,ui.c.answers);
  for(var i=0;i<state.sessions.length;i++){if(state.sessions[i].t===p.t){state.sessions[i].hold=res.score;break;}}
  state.pending=null;
  var before=state.level;
  if(p.lv===state.level&&advance(state))ui.flash=upText(state.level);
  ui.c.res=res;ui.c.p=p;ui.c.up=state.level!==before;
  save();ui.view='checkResult';render();
}
function csv(){
  var rows=['date,level,palace,items,seconds,score,next_day,type'];
  state.sessions.forEach(function(s){rows.push([s.day,s.lv,s.pal,s.n,s.sec,s.score,s.hold==null?'':s.hold,s.half?'half':s.practice?'practice':(s.pass?'pass':'miss')].join(','));});
  return rows.join('\n');
}
var ACT={
  start:function(){start(false);},
  half:function(){start(true);},
  go:go,next:next,
  home:function(){var keep=ui.flash&&ui.view!=='home'?ui.flash:null;ui={view:'home',flash:keep};render();ui.flash=null;if(code&&!unsent)pull();},
  'after-check':function(){if(ui.c.up){var f=ui.flash;ui={view:'home',flash:f};render();ui.flash=null;}else prepare();},
  sw:function(){var w=ui.sw||(ui.sw={});if(w.start){w.last=(Date.now()-w.start)/1000;w.start=null;}else{w.start=Date.now();}render();},
  'l0-pass':function(){var d=dayStr();if(state.l0.indexOf(d)<0)state.l0.push(d);
    if(state.l0.length>=2){state.level='1';ui.flash=upText('1');}save();render();ui.flash=null;},
  'l0-fail':function(){state.l0=[];save();render();},
  'l7-on':function(){state.l7={on:dayStr(),r:{}};save();render();},
  'l7-ok':function(el){state.l7.r[+el.getAttribute('data-i')]='ok';if(l7Passed(state)){state.level='exam';ui.flash=upText('exam');}save();render();ui.flash=null;},
  'l7-miss':function(el){state.l7.r[+el.getAttribute('data-i')]='miss';save();render();},
  'l7-restart':function(){state.l7={on:null,r:{}};save();render();},
  copy:function(){
    var done=function(t){ui.copied=t;render();setTimeout(function(){ui.copied=null;if(ui.view==='home')render();},2500);};
    try{navigator.clipboard.writeText(csv()).then(function(){done('Copied');},function(){done('Copying is blocked');});}catch(e){done('Copying is blocked');}
  },
  reset:function(){if(!ui.arm){ui.arm=true;render();return;}state=blank();ui={view:'home'};save();render();},
  'sync-new':function(){code=newCode();try{localStorage.setItem(CODE_KEY,code);}catch(e){}if(!state.updatedAt)state.updatedAt=Date.now();sync='wait';render();push();},
  'sync-off':function(){code=null;try{localStorage.removeItem(CODE_KEY);}catch(e){}sync='off';render();},
  'copy-code':function(){
    var done=function(t){ui.copiedCode=t;render();setTimeout(function(){ui.copiedCode=null;if(ui.view==='home')render();},2500);};
    try{navigator.clipboard.writeText(showCode(code)).then(function(){done('Copied');},function(){done('Select the code and copy it');});}catch(e){done('Select the code and copy it');}
  },
  backup:function(){
    var blob=new Blob([JSON.stringify(state,null,1)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download='memory-palace-backup-'+dayStr()+'.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  },
  'restore-yes':function(){state=fill(ui.restore);ui.restore=null;save();render();},
  'restore-no':function(){ui.restore=null;render();}
};
document.addEventListener('click',function(e){
  var el=e.target.closest?e.target.closest('[data-act]'):null;if(!el)return;
  var a=el.getAttribute('data-act');if(ACT[a]){if(a!=='reset'&&ui.arm){ui.arm=false;}ACT[a](el);}
});
document.addEventListener('submit',function(e){
  var f=e.target.getAttribute&&e.target.getAttribute('data-form');if(!f)return;
  e.preventDefault();
  if(f==='recall')submitRecall();else if(f==='check')submitCheck();
  else if(f==='join'){var el=document.getElementById('joincode');ui.joinVal=el?el.value:'';join(ui.joinVal);}
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t||t.id!=='restore'||!t.files||!t.files[0])return;
  var reader=new FileReader();
  reader.onload=function(){
    try{var d=JSON.parse(String(reader.result));if(!d||d.v!==1||!Array.isArray(d.sessions))throw 0;ui.restore=fill(d);ui.restoreErr=null;}
    catch(err){ui.restore=null;ui.restoreErr='That file is not a backup from this trainer.';}
    render();
  };
  reader.readAsText(t.files[0]);
});
document.addEventListener('toggle',function(e){
  var d=e.target;if(!d||!d.getAttribute||!d.getAttribute('data-d'))return;
  var name=d.getAttribute('data-d');
  if(d.open)ui.open=name;else if(ui.open===name)ui.open=null;
},true);
document.addEventListener('input',function(e){
  var t=e.target;if(!t||t.tagName!=='INPUT'||!t.hasAttribute('data-i'))return;
  var i=+t.getAttribute('data-i');
  if(ui.view==='recall')ui.s.answers[i]=t.value;else if(ui.view==='check')ui.c.answers[i]=t.value;
});
document.addEventListener('keydown',function(e){
  if(ui.view==='encode'&&(e.key===' '||e.key==='Enter'||e.key==='ArrowRight')){e.preventDefault();next();return;}
  if((ui.view==='recall'||ui.view==='check')&&e.key==='Enter'&&e.target&&e.target.tagName==='INPUT'){
    var list=Array.prototype.slice.call(app.querySelectorAll('input')),at=list.indexOf(e.target);
    if(at>=0&&at<list.length-1){e.preventDefault();list[at+1].focus();}
  }
});

/* ---------- boot ---------- */
render();
pull();
window.addEventListener('online',function(){if(unsent)push();else if(ui.view==='home')pull();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&ui.view==='home')pull();});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
})();
