var U="https://script.google.com/macros/s/AKfycbzekdUKLnK-3kNEC6eR-NvaLruIwMiZLJVjCyRmv0-77FCLZIkY0SRCL2Zif8VIfoEOZA/exec",m,lg;
var PAL=["#e11d48","#2563eb","#16a34a","#9333ea","#ea580c","#0891b2","#db2777","#4f46e5"];

function fmtT(t){
  var s=String(t||""),mt=s.match(/(\d{1,2}):(\d{2})/);
  if(mt)return("0"+mt).slice(-2)+":"+mt;
  var d=new Date(s);
  return!isNaN(d.getTime())?("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2):s;
}
function err(s){var b=document.getElementById("err");b.style.display="block";b.innerHTML="⚠️ "+s;document.getElementById("st").textContent="エラー";}
function gas(p,cb){
  var n="c_"+Date.now()+"_"+Math.floor(Math.random()*999),s=document.createElement("script");
  var t=setTimeout(function(){delete window[n];s.remove();err("タイムアウト");},15000);
  window[n]=function(d){clearTimeout(t);delete window[n];s.remove();cb(d);};
  s.onerror=function(){clearTimeout(t);delete window[n];s.remove();err("通信エラー");};
  s.src=U+"?"+p+"&callback="+n;document.body.appendChild(s);
}
function load(){gas("action=read",function(d){document.getElementById("st").textContent="接続完了";document.getElementById("err").style.display="none";draw(d.stations||[],d.logs||[]);});}
function reg(){
  var c=document.getElementById("rc").value.trim().toUpperCase(),p=document.getElementById("rp").value.trim(),x=document.getElementById("rx").value.split(",");
  var la=parseFloat(x),lo=parseFloat(x);
  if(!c||!p||isNaN(la)||isNaN(lo))return alert("正しく入力してください");
  localStorage.setItem("mc",c);document.getElementById("st").textContent="登録中...";
  gas("action=reg&call="+encodeURIComponent(c)+"&place="+encodeURIComponent(p)+"&lat="+la+"&lon="+lo,function(){alert("登録完了");load();});
}
function qso(){
  var mc=document.getElementById("rc").value.trim().toUpperCase(),tc=document.getElementById("lt").value.trim().toUpperCase(),tm=document.getElementById("tm").value.replace("T"," ");
  if(!mc||!tc||!tm||mc===tc)return alert("入力内容を確認してください");
  localStorage.setItem("mc",mc);document.getElementById("st").textContent="送信中...";
  gas("action=qso&from="+encodeURIComponent(mc)+"&to="+encodeURIComponent(tc)+"&time="+encodeURIComponent(tm),function(){document.getElementById("lt").value="";alert("送信完了");load();});
}
function dst(a,b,c,d){
  var r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;
  return 12742*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
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
      function dfs(u,ud,ns,is,sum){
        if(sum>best.d)best={d:sum,ns:ns.slice(),is:is.slice()};
        (adj[u]||[]).forEach(function(nx){
          if(!ud[nx.i]){ud[nx.i]=1;ns.push(nx.to);is.push(nx.i);dfs(nx.to,ud,ns,is,sum+nx.d);is.pop();ns.pop();ud[nx.i]=0;}
        });
      }
      dfs(st,{},[st],[],0);
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
  document.getElementById("c1").textContent=Object.keys(sm).length;
  var ps=new Map(),ow=[],sw=new Set();
  ll.forEach(function(a){
    if(!a||!a.from||!a.to)return;
    var b=ll.find(function(x){return x&&x.from===a.to&&x.to===a.from;});
    if(b){var k=[a.from,a.to].sort().join("_");if(!ps.has(k))ps.set(k,{a:a,b:b});}
    else if(!sw.has(a.from+"_"+a.to)){sw.add(a.from+"_"+a.to);ow.push(a);}
  });
  var es=[],t1=document.getElementById("tb1");t1.innerHTML="";
  ps.forEach(function(p){
    var A=sm[p.a.from],B=sm[p.b.from];
    if(A&&B){
      var d=dst(A.lat,A.lon,B.lat,B.lon);
      es.push({u:A.callsign,v:B.callsign,d:d,A:A,B:B});
      t1.innerHTML+="<tr><td>"+A.callsign+"("+A.place+")</td><td>"+B.callsign+"("+B.place+")</td><td><b>"+d.toFixed(1)+" km</b></td><td>"+p.a.from+":"+fmtT(p.a.time)+"<br>"+p.b.from+":"+fmtT(p.b.time)+"</td></tr>";
    }
  });
  document.getElementById("c2").textContent=es.length;
  if(!es.length)t1.innerHTML='<tr><td colspan="4" style="text-align:center">一致ログなし</td></tr>';
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
    trK.innerHTML+="<tr><td><b>"+rk+"位</b></td><td><span class='c-dot' style='background:"+col+"'></span>ルート"+rk+"</td><td><b>"+ch.d.toFixed(1)+" km</b></td><td>"+rt+"</td></tr>";
  });
  Object.values(sm).forEach(function(s){
    var rk=sr[s.callsign],col=rk?PAL[(rk-1)%PAL.length]:"#0284c7";
    var mk=L.circleMarker([s.lat,s.lon],{radius:8,fillColor:col,color:"#fff",weight:2,fillOpacity:1}).bindPopup("<b>"+s.callsign+"</b> ("+s.place+")"+(rk?"<br>🏆 最高順位: <b>"+rk+"位</b>":"")).addTo(lg);
    if(rk)mk.bindTooltip(rk+"位 "+s.callsign,{permanent:true,direction:"top",offset:[0,-6],className:"rank-lbl"});
  });
  var t2=document.getElementById("tb2");t2.innerHTML="";document.getElementById("c3").textContent=ow.length;
  if(!ow.length)t2.innerHTML='<tr><td colspan="4" style="text-align:center">入力待ちなし</td></tr>';
  else ow.forEach(function(w){
    var p1=sm[w.from]?"("+sm[w.from].place+")":"",p2=sm[w.to]?"("+sm[w.to].place+")":"<small>(未登録)</small>";
    t2.innerHTML+="<tr><td><b>"+w.from+"</b>"+p1+"</td><td><b>"+w.to+"</b>"+p2+"</td><td>"+fmtT(w.time)+"</td><td><span class='wb'>⏳ "+w.to+" 待ち</span></td></tr>";
  });
}
m=L.map("map").setView([36.8,139.5],6);
fetch("japan.geojson").then(function(r){return r.json();}).then(function(g){
  L.geoJSON(g,{style:{color:"#65a30d",weight:1,fillColor:"#ecfccb",fillOpacity:1},onEachFeature:function(f,l){var n=(f.properties&&(f.properties.nam_ja||f.properties.name))||"";if(n)l.bindTooltip(n,{sticky:true});}}).addTo(m).bringToBack();
});
lg=L.layerGroup().addTo(m);setTimeout(function(){m.invalidateSize();},400);
var nw=new Date();document.getElementById("today-disp").textContent="📅 "+nw.getFullYear()+"年"+(nw.getMonth()+1)+"月"+nw.getDate()+"日";
nw.setMinutes(nw.getMinutes()-nw.getTimezoneOffset());document.getElementById("tm").value=nw.toISOString().slice(0,16);
var sv=localStorage.getItem("mc");if(sv)document.getElementById("rc").value=sv;
load();setInterval(load,10000);
