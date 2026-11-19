function renderCurrent(){
  if(!lg)return;lg.clearLayers();
  var targetDate=document.getElementById("past-date").value||getToday();
  var stHist={},canonName={};
  rawStations.forEach(function(s){
    if(!s||!s.callsign)return;
    var nk=normCall(s.callsign);
    canonName[nk]=s.callsign;
    if(getDateStr(s.date)!==targetDate)return;
    if(!stHist[nk])stHist[nk]=[];
    var list=stHist[nk],last=list[list.length-1];
    if(!last||last.place!==s.place||Math.abs(last.lat-s.lat)>0.0001||Math.abs(last.lon-s.lon)>0.0001){list.push(s);}
  });
  document.getElementById("c1").textContent=Object.keys(stHist).length;

  var filteredLogs=rawLogs.filter(function(l){return l&&l.from&&l.to&&getDateStr(l.time)===targetDate;});
  var ps=new Map(),ow=[],sw=new Set();
  filteredLogs.forEach(function(a){
    var bd=a.band||"DCR",nf=normCall(a.from),nt=normCall(a.to);
    var b=filteredLogs.find(function(x){return normCall(x.from)===nt&&normCall(x.to)===nf&&(x.band||"DCR")===bd;});
    if(b){
      var k=bd+"__"+[nf,nt].sort().join("_");
      if(!ps.has(k))ps.set(k,{a:a,b:b,band:bd,nf:nf,nt:nt});
    }else{
      var owk=bd+"__"+nf+"_"+nt;
      if(!sw.has(owk)){sw.add(owk);ow.push(a);}
    }
  });

  function getPosAt(nk,qsoTime){
    var list=stHist[nk];
    if(!list||!list.length)return null;
    if(list.length===1)return list[0];
    var qt=getTs(qsoTime),chosen=list[0];
    for(var i=0;i<list.length;i++){
      var stTs=getTs(list[i].date);
      if(stTs<=qt)chosen=list[i];
    }
    return chosen;
  }

  var allEdges=[],t1=document.getElementById("tb1");t1.innerHTML="";
  ps.forEach(function(p){
    var A=getPosAt(p.nf,p.a.time),B=getPosAt(p.nt,p.b.time);
    if(A&&B){
      var d=dst(A.lat,A.lon,B.lat,B.lon);
      var dispA=canonName[p.nf]||A.callsign,dispB=canonName[p.nt]||B.callsign;
      allEdges.push({u:dispA,v:dispB,nu:p.nf,nv:p.nt,d:d,A:A,B:B,band:p.band});
      var laterTime=getTs(p.b.time)>=getTs(p.a.time)?p.b.time:p.a.time;
      var linkA="<span class='del-link' onclick=\"delLog('"+p.a.id+"','"+p.a.from+"','"+p.a.to+"','"+p.a.time+"')\">"+dispA+"</span>";
      var linkB="<span class='del-link' onclick=\"delLog('"+p.b.id+"','"+p.b.from+"','"+p.b.to+"','"+p.b.time+"')\">"+dispB+"</span>";
      t1.innerHTML+="<tr><td><span class='b-tag'>"+p.band+"</span></td><td>"+linkA+"<br><small>("+A.place+")</small></td><td>"+linkB+"<br><small>("+B.place+")</small></td><td><b>"+d.toFixed(1)+" km</b></td><td><b>"+fmtT(laterTime)+"</b></td></tr>";
    }
  });
  document.getElementById("c2").textContent=allEdges.length;
  if(!allEdges.length)t1.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">この日の成立ログはありません</td></tr>';
  renderRest(stHist,canonName,allEdges,ow);
}
