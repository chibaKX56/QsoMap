var U="https://script.google.com/macros/s/AKfycbzekdUKLnK-3kNEC6eR-NvaLruIwMiZLJVjCyRmv0-77FCLZIkY0SRCL2Zif8VIfoEOZA/exec",m,lg;
var PAL=["#e11d48","#2563eb","#16a34a","#9333ea","#ea580c","#0891b2","#db2777","#4f46e5"];

function fmtT(t){
  var s=String(t||""),mt=s.match(/(\d{1,2}):(\d{2})/);
  if(mt)return("0"+mt.slice(1,2).pop()).slice(-2)+":"+mt.slice(2,3).pop();
  var d=new Date(s);
  return!isNaN(d.getTime())?("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2):s;
}
function err(s){var b=document.getElementById("err");b.style.display="block";b.innerHTML="⚠️ "+s;document.getElementById("st").textContent="エラー";}
function gas(p,cb){
  var n="c_"+Date.now()+"_"+Math.floor(Math.random()*999),s=document.createElement("script");
  var t=setTimeout(function(){delete window[n];s.remove();err("タイムアウト");},15000);
  window[n]=function(d){
    clearTimeout(t);delete window[n];s.remove();
    if(d&&d.status==="err"){alert("⚠️ "+d.msg);document.getElementById("st").textContent="認証エラー";return;}
    cb(d);
  };
  s.onerror=function(){clearTimeout(t);delete window[n];s.remove();err("通信エラー");};
  s.src=U+"?"+p+"&_t="+Date.now()+"&callback="+n;document.body.appendChild(s);
}
function load(){
  var dt=document.getElementById("sel-date").value;
  document.getElementById("st").textContent="🔄 更新中...";
  gas("action=read&date="+encodeURIComponent(dt),function(d){
    var n=new Date(),ts=("0"+n.getHours()).slice(-2)+":"+("0"+n.getMinutes()).slice(-2)+":"+("0"+n.getSeconds()).slice(-2);
    document.getElementById("st").textContent="完了 ("+ts+")";
    document.getElementById("err").style.display="none";
    draw(d.stations||[],d.logs||[]);
  });
}
function reg(){
  var c=document.getElementById("rc").value.trim().toUpperCase(),pw=document.getElementById("pw").value.trim();
  var p=document.getElementById("rp").value.trim(),x=document.getElementById("rx").value.split(",");
  var la=parseFloat(x.shift()),lo=parseFloat(x.shift());
  if(!c||!pw||!p||isNaN(la)||isNaN(lo))return alert("コールサイン、4桁暗証番号、運用場所、座標をすべて入力してください");
  localStorage.setItem("mc",c);localStorage.setItem("mpw",pw);
  document.getElementById("st").textContent="登録中...";
  gas("action=reg&call="+encodeURIComponent(c)+"&pass="+encodeURIComponent(pw)+"&place="+encodeURIComponent(p)+"&lat="+la+"&lon="+lo,function(){alert("運用場所を登録しました！");load();});
}
function qso(){
  var mc=document.getElementById("rc").value.trim().toUpperCase(),pw=document.getElementById("pw").value.trim();
  var tc=document.getElementById("lt").value.trim().toUpperCase(),tm=document.getElementById("tm").value.replace("T"," ");
  if(!mc||!pw)return alert("①で自局コールサインと4桁暗証番号を入力してください");
  if(!tc||!tm||mc===tc)return alert("相手局コールサインと交信日時を確認してください");
  localStorage.setItem("mc",mc);localStorage.setItem("mpw",pw);
  document.getElementById("st").textContent="送信中...";
  gas("action=qso&from="+encodeURIComponent(mc)+"&pass="+encodeURIComponent(pw)+"&to="+encodeURIComponent(tc)+"&time="+encodeURIComponent(tm),function(){document.getElementById("lt").value="";alert("交信ログを送信しました！");load();});
}
function delLog(call,target,id){
  var pw=prompt(call+" の交信ログを削除します。\n登録した暗証番号を入力してください:",document.getElementById("pw").value||"");
  if(pw===null||pw==="")return;
  document.getElementById("st").textContent="削除中...";
  gas("action=del&call="+encodeURIComponent(call)+"&pass="+encodeURIComponent(pw)+"&target="+encodeURIComponent(target)+"&id="+encodeURIComponent(id||""),function(){alert("ログを削除しました");load();});
}
function dst(a,b,c,d){
  var r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;
  return 12742*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
// 純粋な一本道（同じ局を2回通らない単純パス）の最長数珠繋ぎを抽出
function chains(edges){
  var rem=edges.slice(),res=[];
  while(rem.length>0){
    var adj={};
    rem.forEach(function(e,i){
      if(!adj[e.u])adj[e.u]=[];if(!adj[e.v])adj[e.v]=[];
      adj[e.u].push({to:e.v,i:i,d:e.d});adj[e.v].push({to:e.u,i:i,d:e.d});
    });
    var best={d:-1,ns:[],is:[]};
    Object.keys(adj).forEach(function(st){
      function dfs(u,visNode,ns,is,sum){
        if(sum>best.d)best={d:sum,ns:ns.slice(),is:is.slice()};
        (adj[u]||[]).forEach(function(nx){
          if(!visNode[nx.to]){
            visNode[nx.to]=1;ns.push(nx.to);is.push(nx.i);
            dfs(nx.to,visNode,ns,is,sum+nx.d);
            is.pop();ns.pop();visNode[nx.to]=0;
          }
        });
      }
      var v0={};v0[st]=1;
      dfs(st,v0,[st],[],0);
    });
    if(!best.is.length)break;
    var us=new Set(best.is);
    res.push({d:best.d,ns:best.ns,es:best.is.map(function(i){return rem[i];})});
    rem=rem.filter(function(_,i){return!us.has(i);});
  }
  return res.sort(function(a,b){return b.d-a.d;});
}
function draw(sl,ll){
  if(!lg)return;lg.clearLayers();var sm={};
  sl.forEach(function(s){if(s&&s.callsign)sm[s.callsign]=s;});
  var ps=new Map(),ow=[],sw=new Set(),activeCalls=new Set();
  ll.forEach(function(a){
    if(!a||!a.from||!a.to)return;
    activeCalls.add(a.from);
    var b=ll.find(function(x){return x&&x.from===a.to&&x.to===a.from;});
    if(b){activeCalls.add(a.to);var k=[a.from,a.to].sort().join("_");if(!ps.has(k))ps.set(k,{a:a,b:b});}
    else if(!sw.has(a.from+"_"+a.to)){sw.add(a.from+"_"+a.to);ow.push(a);}
  });
  var es=[],t1=document.getElementById("tb1");t1.innerHTML="";
  ps.forEach(function(p){
    var A=sm[p.a.from],B=sm[p.b.from];
    if(A&&B){
      var d=dst(A.lat,A.lon,B.lat,B.lon);
      es.push({u:A.callsign,v:B.callsign,d:d,A:A,B:B});
      var delBtns="<button class='btn-del' onclick=\"delLog('"+p.a.from+"','"+p.a.to+"','"+p.a.id+"')\">"+p.a.from+"削除</button> <button class='btn-del' onclick=\"delLog('"+p.b.from+"','"+p.b.to+"','"+p.b.id+"')\">"+p.b.from+"削除</button>";
      t1.innerHTML+="<tr><td>"+A.callsign+"<br><small>"+A.place+"</small></td><td>"+B.callsign+"<br><small>"+B.place+"</small></td><td><b>"+d.toFixed(1)+" km</b></td><td>"+p.a.from+":"+fmtT(p.a.time)+"<br>"+p.b.from+":"+fmtT(p.b.time)+"</td><td>"+delBtns+"</td></tr>";
    }
  });
  document.getElementById("c2").textContent=es.length;
  if(!es.length)t1.innerHTML='<tr><td colspan="5" style="text-align:center">この日の成立ログはありません</td></tr>';

  var cs=chains(es),sr={},trK=document.getElementById("tb-rank");trK.innerHTML="";
  if(!cs.length)trK.innerHTML='<tr><td colspan="4" style="text-align:center">ランキングなし</td></tr>';
  else cs.forEach(function(ch,i){
    var rk=i+1,col=PAL[i%PAL.length];
    ch.ns.forEach(function(c){if(!sr[c])sr[c]=rk;});
    ch.es.forEach(function(e){
      L.polyline([[e.A.lat,e.A.lon],[e.B.lat,e.B.lon]],{color:col,weight:5,opacity:0.9}).addTo(lg);
      L.tooltip({permanent:true,direction:"center"}).setLatLng([(e.A.lat+e.B.lat)/2,(e.A.lon+e.B.lon)/2]).setContent(e.d.toFixed(1)+" km").addTo(lg);
    });
    var rt=ch.ns.map(function(c){return"<b>"+c+"</b>("+(sm[c]?sm[c].place:"")+")";}).join(" ➔ ");
    trK.innerHTML+="<tr><td><b>"+rk+"位</b></td><td><span class='c-dot' style='background:"+col+"'></span>"+rk+"位線</td><td><b>"+ch.d.toFixed(1)+" km</b></td><td>"+rt+"</td></tr>";
  });

  // その日に交信履歴がある局（または全登録局）をマップに表示
  var shownCount=0;
  Object.values(sm).forEach(function(s){
    if(ll.length>0&&!activeCalls.has(s.callsign))return;
    shownCount++;
    var rk=sr[s.callsign],col=rk?PAL[(rk-1)%PAL.length]:"#0284c7";
    var mk=L.circleMarker([s.lat,s.lon],{radius:8,fillColor:col,color:"#fff",weight:2,fillOpacity:1}).bindPopup("<b>"+s.callsign+"</b> ("+s.place+")"+(rk?"<br>🏆 一本道最高順位: <b>"+rk+"位</b>":"")).addTo(lg);
    if(rk)mk.bindTooltip(rk+"位 "+s.callsign,{permanent:true,direction:"top",offset:[0,-6],className:"rank-lbl"});
  });
  document.getElementById("c1").textContent=shownCount;

  var t2=document.getElementById("tb2");t2.innerHTML="";document.getElementById("c3").textContent=ow.length;
  if(!ow.length)t2.innerHTML='<tr><td colspan="5" style="text-align:center">入力待ちなし</td></tr>';
  else ow.forEach(function(w){
    var p1=sm[w.from]?"<br><small>"+sm[w.from].place+"</small>":"",p2=sm[w.to]?"<br><small>"+sm[w.to].place+"</small>":"<br><small>(未登録)</small>";
    var delBtn="<button class='btn-del' onclick=\"delLog('"+w.from+"','"+w.to+"','"+w.id+"')\">削除</button>";
    t2.innerHTML+="<tr><td><b>"+w.from+"</b>"+p1+"</td><td><b>"+w.to+"</b>"+p2+"</td><td>"+fmtT(w.time)+"</td><td><span class='wb'>⏳ "+w.to+" 待ち</span></td><td>"+delBtn+"</td></tr>";
  });
}
m=L.map("map").setView([36.8,139.5],6);
fetch("japan.geojson").then(function(r){return r.json();}).then(function(g){
  L.geoJSON(g,{style:{color:"#65a30d",weight:1,fillColor:"#ecfccb",fillOpacity:1},onEachFeature:function(f,l){var n=(f.properties&&(f.properties.nam_ja||f.properties.name))||"";if(n)l.bindTooltip(n,{sticky:true});}}).addTo(m).bringToBack();
});
lg=L.layerGroup().addTo(m);setTimeout(function(){m.invalidateSize();},400);

var nw=new Date();
nw.setMinutes(nw.getMinutes()-nw.getTimezoneOffset());
var isoNow=nw.toISOString();
document.getElementById("sel-date").value=isoNow.slice(0,10);
document.getElementById("tm").value=isoNow.slice(0,16);

var sv=localStorage.getItem("mc"),spw=localStorage.getItem("mpw");
if(sv)document.getElementById("rc").value=sv;
if(spw)document.getElementById("pw").value=spw;
load();
