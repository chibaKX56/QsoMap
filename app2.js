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
  var stHistory={};
  rawStations.forEach(function(s){
    if(!s||!s.callsign)return;
    if(getDateStr(s.date)!==targetDate)return;
    if(!stHistory[s.callsign])stHistory[s.callsign]=[];
    var list=stHistory[s.callsign],last=list[list.length-1];
    if(!last||last.place!==s.place||Math.abs(last.lat-s.lat)>0.0001||Math.abs(last.lon-s.lon)>0.0001){list.push(s);}
  });
  var sm={};
  Object.keys(stHistory).forEach(function(call){var list=stHistory[call];sm[call]=list[list.length-1];});
  document.getElementById("c1").textContent=Object.keys(sm).length;

  var filteredLogs=rawLogs.filter(function(l){return l&&l.from&&l.to&&getDateStr(l.time)===targetDate;});
  var ps=new Map(),ow=[],sw=new Set();
  filteredLogs.forEach(function(a){
    var bd=a.band||"DCR";
    var b=filteredLogs.find(function(x){return x.from===a.to&&x.to===a.from&&(x.band||"DCR")===bd;});
    if(b){var k=bd+"__"+[a.from,a.to].sort().join("_");if(!ps.has(k))ps.set(k,{a:a,b:b,band:bd});}
    else{var owk=bd+"__"+a.from+"_"+a.to;if(!sw.has(owk)){sw.add(owk);ow.push(a);}}
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

  var sr={},trK=document.getElementById("tb-rank");trK.innerHTML="";var hasRank=false;
  BANDS.forEach(function(bd){
    var bEdges=allEdges.filter(function(e){return e.band===bd;});
    if(!bEdges.length)return;
    hasRank=true;
    chains(bEdges).forEach(function(ch,i){
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

  Object.keys(stHistory).forEach(function(call){
    var list=stHistory[call];
    if(list.length>1){
      for(var i=0;i<list.length-1;i++){
        var prev=list[i],next=list[i+1];
        L.circleMarker([prev.lat,prev.lon],{radius:5,fillColor:"#94a3b8",color:"#fff",weight:1.5,fillOpacity:0.8}).bindPopup("<b>"+call+"</b> (移動前: "+prev.place+")").addTo(lg);
        L.polyline([[prev.lat,prev.lon],[next.lat,next.lon]],{color:"#64748b",weight:2,dashArray:"5,5",opacity:0.8}).addTo(lg);
      }
    }
    var cur=list[list.length-1],info=sr[call],col=info?info.col:"#0284c7";
    var movedTag=list.length>1?" <span style='color:#ea580c'>[移動済]</span>":"";
    var mk=L.circleMarker([cur.lat,cur.lon],{radius:8,fillColor:col,color:"#fff",weight:2,fillOpacity:1}).bindPopup("<b>"+cur.callsign+"</b> ("+cur.place+")"+movedTag+(info?"<br>🏆 最高順位: <b>"+info.band+" "+info.rk+"位</b>":"")).addTo(lg);
    if(info)mk.bindTooltip(info.rk+"位 "+cur.callsign,{permanent:true,direction:"top",offset:[0,-6],className:"rank-lbl"});
  });

  var t2=document.getElementById("tb2");t2.innerHTML="";document.getElementById("c3").textContent=ow.length;
  if(!ow.length)t2.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">入力待ちログはありません</td></tr>';
  else ow.forEach(function(w){
    var bd=w.band||"DCR";
    var p1=sm[w.from]?"<br><small>("+sm[w.from].place+")</small>":"",p2=sm[w.to]?"<br><small>("+sm[w.to].place+")</small>":"<br><small style='color:#ef4444'>(本日未登録)</small>";
    var dBtn="<button class='btn-del' onclick=\"delLog('"+w.id+"','"+w.from+"','"+w.to+"','"+w.time+"')\">削除</button>";
    t2.innerHTML+="<tr><td><span class='b-tag'>"+bd+"</span></td><td><b>"+w.from+"</b>"+p1+"</td><td><b>"+w.to+"</b>"+p2+"<br><span class='wb'>⏳ 待ち</span></td><td>"+fmtT(w.time)+"</td><td>"+dBtn+"</td></tr>";
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
