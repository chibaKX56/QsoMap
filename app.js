var U="https://script.google.com/macros/s/AKfycbzekdUKLnK-3kNEC6eR-NvaLruIwMiZLJVjCyRmv0-77FCLZIkY0SRCL2Zif8VIfoEOZA/exec",m,lg;
var PAL=["#e11d48","#2563eb","#16a34a","#9333ea","#ea580c","#0891b2","#db2777","#4f46e5"];
var BANDS=["CB","DCR","LCR","SLP"];
var rawStations=[],rawLogs=[];

function getDateStr(t){
  var s=String(t||""),m1=s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(m1)return m1[1]+"-"+("0"+m1[2]).slice(-2)+"-"+("0"+m1[3]).slice(-2);
  var d=new Date(s);
  if(!isNaN(d.getTime()))return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  return "";
}
function fmtT(t){
  var s=String(t||""),mt=s.match(/(\d{1,2}):(\d{2})/);
  if(mt)return("0"+mt[1]).slice(-2)+":"+mt[2];
  var d=new Date(s);
  return!isNaN(d.getTime())?("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2):s;
}
function getTs(t){
  var s=String(t||"").replace(/-/g,"/");
  var d=new Date(s);
  return isNaN(d.getTime())?0:d.getTime();
}
function getToday(){
  var nw=new Date();
  return nw.getFullYear()+"-"+("0"+(nw.getMonth()+1)).slice(-2)+"-"+("0"+nw.getDate()).slice(-2);
}
function err(s){var b=document.getElementById("err");b.style.display="block";b.innerHTML="⚠️ "+s;document.getElementById("st").textContent="エラー";}
function gas(p,cb){
  var n="c_"+Date.now()+"_"+Math.floor(Math.random()*9999),s=document.createElement("script");
  var t=setTimeout(function(){delete window[n];s.remove();err("タイムアウト");},15000);
  window[n]=function(d){clearTimeout(t);delete window[n];s.remove();cb(d);};
  s.onerror=function(){clearTimeout(t);delete window[n];s.remove();err("通信エラー");};
  s.src=U+"?"+p+"&_t="+Date.now()+"&callback="+n;document.body.appendChild(s);
}
function updateDateSelect(){
  var sel=document.getElementById("past-date");
  var cur=sel.value||getToday();
  var dates=new Set([getToday()]);
  rawLogs.forEach(function(l){var d=getDateStr(l.time);if(d)dates.add(d);});
  rawStations.forEach(function(s){var d=getDateStr(s.date);if(d)dates.add(d);});
  var sorted=Array.from(dates).sort().reverse();
  sel.innerHTML="";
  sorted.forEach(function(d){
    var opt=document.createElement("option");
    opt.value=d;
    opt.textContent=(d===getToday())?d+" (本日)":d;
    if(d===cur)opt.selected=true;
    sel.appendChild(opt);
  });
}
function load(){
  document.getElementById("st").textContent="更新中...";
  gas("action=read",function(d){
    document.getElementById("st").textContent="接続完了";
    document.getElementById("err").style.display="none";
    rawStations=d.stations||[];
    rawLogs=d.logs||[];
    updateDateSelect();
    renderCurrent();
  });
}
function reg(){
  var c=document.getElementById("rc").value.trim().toUpperCase();
  var pin=document.getElementById("pin").value.trim();
  var p=document.getElementById("rp").value.trim();
  var x=document.getElementById("rx").value.split(",");
  var la=parseFloat(x[0]),lo=parseFloat(x[1]);
  if(!c||!p||isNaN(la)||isNaN(lo))return alert("コールサイン、運用場所、座標をすべて入力してください");
  if(!/^\d{4}$/.test(pin))return alert("4桁の数字パスワードを入力してください");
  localStorage.setItem("mc",c);localStorage.setItem("mp",pin);
  document.getElementById("st").textContent="登録中...";
  var today=getToday();
  var q="action=reg&call="+encodeURIComponent(c)+"&pin="+encodeURIComponent(pin)+"&place="+encodeURIComponent(p)+"&lat="+la+"&lon="+lo+"&date="+encodeURIComponent(today);
  gas(q,function(res){
    if(res&&res.status==="error"){alert(res.msg);document.getElementById("st").textContent="登録拒否";return;}
    alert("運用場所を登録しました");load();
  });
}
function qso(){
  var mc=document.getElementById("rc").value.trim().toUpperCase();
  var tc=document.getElementById("lt").value.trim().toUpperCase();
  var bd=document.getElementById("band").value;
  var tm=document.getElementById("tm").value.replace("T"," ");
  if(!mc||!tc||!tm||mc===tc)return alert("自局・相手局コールサインと交信日時を確認してください");
  localStorage.setItem("mc",mc);document.getElementById("st").textContent="送信中...";
  var q="action=qso&from="+encodeURIComponent(mc)+"&to="+encodeURIComponent(tc)+"&band="+encodeURIComponent(bd)+"&time="+encodeURIComponent(tm);
  gas(q,function(){document.getElementById("lt").value="";alert("送信完了しました");load();});
}
function delLog(id,fromCall,toCall,rawTime){
  var pin=prompt(fromCall+" の交信ログを削除します。\n4桁パスワードを入力してください:",localStorage.getItem("mp")||"");
  if(pin===null)return;
  if(!/^\d{4}$/.test(pin))return alert("4桁の数字を入力してください");
  document.getElementById("st").textContent="削除中...";
  var fb=fromCall+"_"+toCall+"_"+rawTime;
  var q="action=del&id="+encodeURIComponent(id||"")+"&call="+encodeURIComponent(fromCall)+"&pin="+encodeURIComponent(pin)+"&fallback="+encodeURIComponent(fb);
  gas(q,function(res){
    if(res&&res.status==="error"){alert(res.msg);document.getElementById("st").textContent="削除失敗";return;}
    alert("削除しました");load();
  });
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
      function dfs(u,vis,ns,is,sum){
        if(sum>best.d)best={d:sum,ns:ns.slice(),is:is.slice()};
        (adj[u]||[]).forEach(function(nx){
          if(!vis[nx.to]){
            vis[nx.to]=true;ns.push(nx.to);is.push(nx.i);
            dfs(nx.to,vis,ns,is,sum+nx.d);
            is.pop();ns.pop();vis[nx.to]=false;
          }
        });
      }
      var v0={};v0[st]=true;
      dfs(st,v0,[st],[],0);
    });
    if(!best.is.length)break;
    var us=new Set(best.is);
    res.push({d:best.d,ns:best.ns,es:best.is.map(function(i){return rem[i];})});
    rem=rem.filter(function(_,i){return!us.has(i);});
  }
  return res.sort(function(a,b){return b.d-a.d;});
}
function renderCurrent(){
  if(!lg)return;lg.clearLayers();
  var targetDate=document.getElementById("past-date").value||getToday();

  // 当日（選択日）に登録された局のみ抽出＆移動履歴（複数箇所）を整理
  var stHistory={};
  rawStations.forEach(function(s){
    if(!s||!s.callsign)return;
    var sDate=getDateStr(s.date);
    if(sDate!==targetDate)return;
    if(!stHistory[s.callsign])stHistory[s.callsign]=[];
    var list=stHistory[s.callsign];
    var last=list[list.length-1];
    if(!last||last.place!==s.place||Math.abs(last.lat-s.lat)>0.0001||Math.abs(last.lon-s.lon)>0.0001){
      list.push(s);
    }
  });

  var sm={};
  Object.keys(stHistory).forEach(function(call){
    var list=stHistory[call];
    sm[call]=list[list.length-1];
  });
  document.getElementById("c1").textContent=Object.keys(sm).length;

  // 選択日のログ抽出（バンド単位でペア判定）
  var filteredLogs=rawLogs.filter(function(l){
    if(!l||!l.from||!l.to)return false;
    return getDateStr(l.time)===targetDate;
  });

  var ps=new Map(),ow=[],sw=new Set();
  filteredLogs.forEach(function(a){
    var bd=a.band||"DCR";
    var b=filteredLogs.find(function(x){return x.from===a.to&&x.to===a.from&&(x.band||"DCR")===bd;});
    if(b){
      var k=bd+"__"+[a.from,a.to].sort().join("_");
      if(!ps.has(k))ps.set(k,{a:a,b:b,band:bd});
    }else{
      var owk=bd+"__"+a.from+"_"+a.to;
      if(!sw.has(owk)){sw.add(owk);ow.push(a);}
    }
  });

  var allEdges=[],t1=document.getElementById("tb1");t1.innerHTML="";
  ps.forEach(function(p){
    var A=sm[p.a.from],B=sm[p.b.from];
    if(A&&B){
      var d=dst(A.lat,A.lon,B.lat,B.lon);
      allEdges.push({u:A.callsign,v:B.callsign,d:d,A:A,B:B,band:p.band});
      var laterTime=getTs(p.b.time)>=getTs(p.a.time)?p.b.time:p.a.time;
      var linkA="<span class='del-link' onclick=\"delLog('"+p.a.id+"','"+p.a.from+"','"+p.a.to+"','"+p.a.time+"')\">"+A.callsign+"</span>";
      var linkB="<span class='del-link' onclick=\"delLog('"+p.b.id+"','"+p.b.from+"','"+p.b.to+"','"+p.b.time+"')\">"+B.callsign+"</span>";
      t1.innerHTML+="<tr><td><span class='b-tag'>"+p.band+"</span></td><td>"+linkA+"<br><small>("+A.place+")</small></td><td>"+linkB+"<br><small>("+B.place+")</small></td><td><b>"+d.toFixed(1)+" km</b></td><td><b>"+fmtT(laterTime)+"</b></td></tr>";
    }
  });
  document.getElementById("c2").textContent=allEdges.length;
  if(!allEdges.length)t1.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">この日の成立ログはありません</td></tr>';

  // バンド別数珠繋ぎランキング計算＆地図ライン描画
  var sr={},trK=document.getElementById("tb-rank");trK.innerHTML="";
  var hasRank=false;
  BANDS.forEach(function(bd){
    var bEdges=allEdges.filter(function(e){return e.band===bd;});
    if(!bEdges.length)return;
    hasRank=true;
    var cs=chains(bEdges);
    cs.forEach(function(ch,i){
      var rk=i+1,col=PAL[i%PAL.length];
      ch.ns.forEach(function(c){if(!sr[c]||rk<sr[c].rk)sr[c]={rk:rk,band:bd,col:col};});
      ch.es.forEach(function(e){
        L.polyline([[e.A.lat,e.A.lon],[e.B.lat,e.B.lon]],{color:col,weight:5,opacity:0.9}).addTo(lg);
        L.tooltip({permanent:true,direction:"center"}).setLatLng([(e.A.lat+e.B.lat)/2,(e.A.lon+e.B.lon)/2]).setContent("["+bd+"] "+e.d.toFixed(1)+" km").addTo(lg);
      });
      var rt=ch.ns.map(function(c){return"<b>"+c+"</b><small>("+(sm[c]?sm[c].place:"")+")</small>";}).join(" ➔ ");
      trK.innerHTML+="<tr><td><span class='b-tag'>"+bd+"</span></td><td><b>"+rk+"位</b></td><td><span class='c-bar' style='background:"+col+"'></span></td><td><b>"+ch.d.toFixed(1)+" km</b></td><td>"+rt+"</td></tr>";
    });
  });
  if(!hasRank)trK.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">ランキングデータがありません</td></tr>';

  // 移動履歴（過去の場所→現在地への破線）と現在地ピンを描画
  Object.keys(stHistory).forEach(function(call){
    var list=stHistory[call];
    if(list.length>1){
      for(var i=0;i<list.length-1;i++){
        var prev=list[i],next=list[i+1];
L.circleMarker([prev.lat,prev.lon],{radius:5,fillColor:"#94a3b8",color:"#fff",weight:1.5,fillOpacity:0.8})
.bindPopup(""+call+" (移動前: "+prev.place+")").addTo(lg);
L.polyline([[prev.lat,prev.lon],[next.lat,next.lon]],{color:"#64748b",weight:2,dashArray:"5,5",opacity:0.8}).addTo(lg);
}
}
var cur=list[list.length-1];
var info=sr[call],col=info?info.col:"#0284c7";
var movedTag=list.length>1?" [移動済]":"";
var mk=L.circleMarker([cur.lat,cur.lon],{radius:8,fillColor:col,color:"#fff",weight:2,fillOpacity:1})
.bindPopup(""+cur.callsign+" ("+cur.place+")"+movedTag+(info?"
🏆 最高順位: "+info.band+" "+info.rk+"位":"")).addTo(lg);
if(info){
mk.bindTooltip(info.rk+"位 "+cur.callsign,{permanent:true,direction:"top",offset:[0,-6],className:"rank-lbl"});
}
});
// 入力待ち片道ログ
var t2=document.getElementById("tb2");t2.innerHTML="";document.getElementById("c3").textContent=ow.length;
if(!ow.length)t2.innerHTML='入力待ちログはありません';
else ow.forEach(function(w){
var bd=w.band||"DCR";
var p1=sm[w.from]?"
("+sm[w.from].place+")":"",p2=sm[w.to]?"
("+sm[w.to].place+")":"
(本日未登録)";
var dBtn="<button class='btn-del' onclick="delLog('"+w.id+"','"+w.from+"','"+w.to+"','"+w.time+"')">削除";
t2.innerHTML+=""+bd+""+w.from+""+p1+""+w.to+""+p2+"
⏳ 待ち"+fmtT(w.time)+""+dBtn+"";
});
}
m=L.map("map").setView([36.8,139.5],6);
fetch("japan.geojson").then(function(r){return r.json();}).then(function(g){
L.geoJSON(g,{style:{color:"#65a30d",weight:1,fillColor:"#ecfccb",fillOpacity:1},onEachFeature:function(f,l){var n=(f.properties&&(f.properties.nam_ja||f.properties.name))||"";if(n)l.bindTooltip(n,{sticky:true});}}).addTo(m).bringToBack();
});
lg=L.layerGroup().addTo(m);setTimeout(function(){m.invalidateSize();},400);
var nw=new Date();
document.getElementById("today-disp").textContent=nw.getFullYear()+"年"+(nw.getMonth()+1)+"月"+nw.getDate()+"日";
nw.setMinutes(nw.getMinutes()-nw.getTimezoneOffset());
document.getElementById("tm").value=nw.toISOString().slice(0,16);
var sv=localStorage.getItem("mc");if(sv)document.getElementById("rc").value=sv;
var sp=localStorage.getItem("mp");if(sp)document.getElementById("pin").value=sp;
load();
