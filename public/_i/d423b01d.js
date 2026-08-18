(function(){
  var root=document.getElementById('fsw');
  if(!root||root.dataset.fswInit==='1')return; root.dataset.fswInit='1';
  var LEAD='https://chat.unistay.cn/lead', IMG='https://img.unistay.net/';
  var view=document.getElementById('fswView'), bar=document.getElementById('fswBar');
  var chatLink=document.getElementById('fswChat');
  if(chatLink)chatLink.addEventListener('click',function(e){e.preventDefault();if(window.aiwOpen)window.aiwOpen();});
  var WZ=null, cityByName={}, unis=[], popular=[], acrMap={};
  var S={dest:'',destCity:null,budget:'',movein:'',room:'',notes:''};
  var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var setBar=function(p){bar.style.width=p+'%';};
  var fmtG=function(n){return (n||0).toLocaleString('en-US');};
  // Price period → unit label. Conventions differ by country; never mix weekly/monthly.
  var durU=function(d){return d==='weekly'?'week':d==='monthly'?'month':'period';};
  // Price period → unit label. Conventions differ by country; never mix weekly/monthly.
  var durU=function(d){return d==='weekly'?'week':d==='monthly'?'month':'period';};

  fetch('/wizard_cities.json').then(function(r){return r.json();}).then(function(d){
    WZ=d;
    var citySlug={};
    d.cities.forEach(function(c){cityByName[c.name.toLowerCase()]=c;citySlug[c.slug]=c;});
    unis=d.unis||[];
    unis.forEach(function(u){if(u.a&&citySlug[u.c])acrMap[u.a.toLowerCase()]=citySlug[u.c];});
    popular=d.cities.slice(0,6);
    step1();
  }).catch(function(){view.innerHTML='<div class="fsw-load">Search opens shortly — <a href="/housing/" style="color:#4B3FE4;font-weight:600">browse all homes</a>.</div>';});

  function resolveCity(txt){
    var t=(txt||'').trim().toLowerCase(); if(!t)return null;
    if(cityByName[t])return cityByName[t];
    if(acrMap[t])return acrMap[t];
    var u=unis.find(function(x){return x.n.toLowerCase()===t||(x.a&&x.a.toLowerCase()===t);}); if(u){var c=WZ.cities.find(function(y){return y.slug===u.c;});if(c)return c;}
    var partial=WZ.cities.find(function(c){return c.name.toLowerCase().indexOf(t)>=0;}); if(partial)return partial;
    var pu=unis.find(function(x){return x.n.toLowerCase().indexOf(t)>=0;}); if(pu){var c2=WZ.cities.find(function(y){return y.slug===pu.c;});if(c2)return c2;}
    return null;
  }

  function step1(){setBar(20);
    var opts=WZ.cities.map(function(c){return '<option value="'+esc(c.name)+'"></option>';}).join('')+unis.map(function(u){var o='<option value="'+esc(u.n)+'"></option>';if(u.a)o+='<option value="'+esc(u.a)+'">'+esc(u.a)+' — '+esc(u.n)+'</option>';return o;}).join('');
    view.innerHTML='<div class="fsw-body"><div class="fsw-sh"><span class="fsw-sn">Step 1 of 5</span></div>'+
      '<div class="fsw-q">Where are you studying?</div>'+
      '<div class="fsw-srch"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex:none"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/></svg>'+
      '<input id="fswDest" list="fswDL" placeholder="Type a university or city…" autocomplete="off"/><datalist id="fswDL">'+opts+'</datalist></div>'+
      '<div class="fsw-chips">'+popular.map(function(c){return '<button type="button" class="fsw-chip" data-c="'+esc(c.name)+'">'+esc(c.name)+'</button>';}).join('')+'</div></div>';
    var inp=document.getElementById('fswDest');
    inp.addEventListener('change',function(){if(inp.value)go1(inp.value);});
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&inp.value)go1(inp.value);});
    Array.prototype.forEach.call(view.querySelectorAll('.fsw-chip'),function(b){b.addEventListener('click',function(){go1(b.dataset.c);});});
  }
  function go1(txt){var c=resolveCity(txt); if(!c){location.href='/housing/';return;} S.dest=txt; S.destCity=c; step2();}

  function step2(){setBar(40);var c=S.destCity;var o=(c.bands||[]).concat(['Flexible']);
    view.innerHTML='<div class="fsw-body"><div class="fsw-sh"><span class="fsw-sn">Step 2 of 5</span><button class="fsw-back" data-b="1">‹ Back</button></div>'+
      '<div class="fsw-q">What\'s your '+durU(c.du)+'ly budget?</div>'+
      '<div class="fsw-opts two">'+o.map(function(x){return '<button type="button" class="fsw-opt" data-v="'+esc(x)+'"><span class="t">'+esc(x)+'</span></button>';}).join('')+'</div></div>';
    bindBack(step1); bindOpts(function(v){S.budget=v;step3();});
  }
  function step3(){setBar(60);var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    view.innerHTML='<div class="fsw-body"><div class="fsw-sh"><span class="fsw-sn">Step 3 of 5</span><button class="fsw-back">‹ Back</button></div>'+
      '<div class="fsw-q">When do you want to move in?</div>'+
      '<div class="fsw-opts" style="grid-template-columns:repeat(4,1fr)">'+m.map(function(x){return '<button type="button" class="fsw-opt ctr" data-v="'+x+' 2026"><span class="t">'+x+'</span><span class="s">2026</span></button>';}).join('')+'</div>'+
      '<button type="button" class="fsw-opt" data-v="Flexible" style="margin-top:9px;justify-content:center"><span class="t">I\'m flexible on dates</span></button></div>';
    bindBack(step2); bindOpts(function(v){S.movein=v;step4();});
  }
  function step4(){setBar(80);var o=[['Ensuite studio','Own room + bathroom'],['Private room','Own room, shared bath'],['Shared apartment','Room in a shared flat'],['Entire place','A whole apartment']];
    view.innerHTML='<div class="fsw-body"><div class="fsw-sh"><span class="fsw-sn">Step 4 of 5</span><button class="fsw-back">‹ Back</button></div>'+
      '<div class="fsw-q">What kind of room?</div>'+
      '<div class="fsw-opts two">'+o.map(function(x){return '<button type="button" class="fsw-opt" data-v="'+esc(x[0])+'"><span><span class="t">'+x[0]+'</span><span class="s">'+x[1]+'</span></span></button>';}).join('')+'</div></div>';
    bindBack(step3); bindOpts(function(v){S.room=v;step5();});
  }
  function step5(){setBar(100);var h=['Close to the station','Quiet & good for study','Near a gym','Bills included','Pet-friendly'];
    view.innerHTML='<div class="fsw-body"><div class="fsw-sh"><span class="fsw-sn">Step 5 of 5</span><button class="fsw-back">‹ Back</button></div>'+
      '<div class="fsw-q">Anything specific you\'re after?</div>'+
      '<p style="color:#6B6880;font-size:13.5px;margin:-8px 0 12px">Tell our AI in your words — it matches this against real resident reviews. Optional.</p>'+
      '<textarea class="fsw-ta" id="fswNotes" placeholder="e.g. quiet building, 10-min walk to campus, ensuite with a good desk, near a supermarket…"></textarea>'+
      '<div class="fsw-hints">'+h.map(function(x){return '<button type="button" class="fsw-hint" data-h="'+esc(x)+'">+ '+x+'</button>';}).join('')+'</div>'+
      '<button type="button" class="fsw-cta" id="fswGo">Find my matches →</button></div>';
    bindBack(step4);
    Array.prototype.forEach.call(view.querySelectorAll('.fsw-hint'),function(b){b.addEventListener('click',function(){var t=document.getElementById('fswNotes');t.value=(t.value?t.value.replace(/\s*$/,'')+', ':'')+b.dataset.h;t.focus();});});
    document.getElementById('fswGo').addEventListener('click',function(){S.notes=document.getElementById('fswNotes').value;think();});
  }
  function think(){var c=S.destCity;
    view.innerHTML='<div class="fsw-think"><div class="fsw-orb"></div><div class="t">Matching you to homes…</div>'+
      '<div class="s">'+(S.notes?'Searching 774k reviews for “'+esc(S.notes.slice(0,38))+(S.notes.length>38?'…':'')+'”':'Scanning verified residences in '+esc(c.name))+'</div></div>';
    setTimeout(results,1400);
  }
  function results(){var c=S.destCity;
    var cards=(c.props||[]).slice(0,3).map(function(p){
      var img=p.i?IMG+p.i:'';
      return '<a class="fsw-pc" href="/property/'+p.s+'/"><div class="im" style="'+(img?'background-image:url(\''+img+'\')':'')+'"><span class="vb">✓ Verified</span></div>'+
        '<div><h4>'+esc(p.n)+'</h4><div class="rt">'+(p.r?'<b>★ '+p.r+'</b> · ':'')+fmtG(p.g)+' Google reviews</div></div>'+
        '<div class="pr"><b>'+c.cur+p.p.toLocaleString('en-US')+'</b><s>/'+durU(p.u||c.du)+'</s></div></a>';
    }).join('');
    view.innerHTML='<div class="fsw-rh"><span class="lab">✓ Verified matches</span><h3>Homes near '+esc(S.dest)+'</h3>'+
      (S.notes?'<div class="fsw-kb">✨ AI matched to: “'+esc(S.notes.slice(0,46))+(S.notes.length>46?'…':'')+'”</div>':'')+'</div>'+
      '<div class="fsw-list">'+cards+'</div>'+
      '<div class="fsw-lead"><h4>Want an advisor to hold one for you?</h4>'+
      '<p>Leave your details — a housing advisor confirms availability within one business day. Free, no booking fee.</p>'+
      '<div class="fsw-lf"><input id="fswName" placeholder="Your name"/><input id="fswContact" placeholder="Email or WhatsApp"/></div>'+
      '<button type="button" class="fsw-cta" id="fswSend">Get my shortlist + hold a room →</button>'+
      '<div class="fsw-err" id="fswErr">Please add an email or WhatsApp so an advisor can reach you.</div>'+
      '<div class="fsw-trust">Free · your details go to a real advisor, not shared</div></div>';
    document.getElementById('fswSend').addEventListener('click',submitLead);
  }
  function submitLead(){
    var name=document.getElementById('fswName').value.trim();
    var contact=document.getElementById('fswContact').value.trim();
    var err=document.getElementById('fswErr');
    if(!contact){err.style.display='block';return;}
    var isEmail=contact.indexOf('@')>0;
    var c=S.destCity;
    var notes='Move-in: '+S.movein+'. Room: '+S.room+'. Budget: '+S.budget+'.'+(S.notes?' Wants: '+S.notes:'');
    var payload={attribution:{site_id:'findstay-org',page_url:location.href,channel:'wizard',lang:'en'},
      lead:{name:name,intended_country:(c&&c.country)||'',target_school:S.dest,budget_cny:'',specific_questions:notes}};
    if(isEmail)payload.lead.email=contact; else payload.lead.phone=contact;
    var btn=document.getElementById('fswSend'); btn.textContent='Sending…'; btn.disabled=true;
    fetch(LEAD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(){done();}).catch(function(){done();});
  }
  function done(){view.innerHTML='<div class="fsw-done"><div class="ck">✓</div><h3>You\'re all set!</h3>'+
    '<p>An advisor will reach out within one business day with your shortlist and availability.</p></div>';}

  function bindBack(fn){var b=view.querySelector('.fsw-back'); if(b)b.addEventListener('click',fn);}
  function bindOpts(fn){Array.prototype.forEach.call(view.querySelectorAll('.fsw-opt'),function(b){b.addEventListener('click',function(){fn(b.dataset.v);});});}
})();
