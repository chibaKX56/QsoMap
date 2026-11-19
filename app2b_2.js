function renderRest(stHist,canonName,allEdges,ow){
  var sr={},trK=document.getElementById("tb-rank");trK.innerHTML="";var hasRank=false;
  BANDS.forEach(function(bd){
    var bEdges=allEdges.filter(function(e){return e.band===bd;});
    if(!bEdges.length)return;
    hasRank=true;
    chains(bEdges).forEach(function(ch,i){
      var rk=i+1,col=PAL[i%PAL.length];
      ch.ns.forEach(function(c){
        var nk=normCall(c);
        if(!sr[nk]||rk<sr[nk].rk)sr[nk]={rk:rk,band:bd,col:col};
      });
      ch.es.forEach(function(e){
        L.polyline([[e.A.lat,e.A.lon],[e.B.lat,e.B.lon]],{color:col,weight:5,opacity:0.9}).addTo(lg);
        L.tooltip({permanent:true,direction:"center"}).setLatLng([(e.A.lat+e.B.lat)/2,(e.A.lon+e.B.lon)/2]).setContent("["+bd+"] "+e.d.toFixed(1)+" km").addTo(lg);
      });
      var rt=ch.ns.map(function(c){
        var nk=normCall(c),list=stHist[nk];
        var pl=list?list[list.length-1].place:"";
        return"<b>"+c+"</b><small>("+pl+")</small>";
      }).join(" ➔ ");
      trK.innerHTML+="<tr><td><span class='b-tag'>"+bd+"</span></td><td><b>"+rk+"位</b></td><td><span class='c-bar' style='background:"+col+"'></span></td><td><b>"+ch.d.toFixed(1)+" km</b></td><td>"+rt+"</td></tr>";
    });
  });
  if(!hasRank)trK.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">ランキングデータがありません</td></tr>';

  Object.keys(stHist).forEach(function(nk){
    var list=stHist[nk],moved=list.length>1,dispName=canonName[nk]||list[0].callsign;
    var info=sr[nk],col=info?info.col:(moved?"#ea580c":"#0284c7");
    list.forEach(function(st,idx){
      var isLatest=(idx===list.length-1);
      var mk=L.circleMarker([st.lat,st.lon],{radius:isLatest?8:6,fillColor:col,color:"#fff",weight:2,fillOpacity:isLatest?1:0.75})
        .bindPopup("<b>"+dispName+"</b> ("+st.place+")"+(moved?"<br><span style='color:#ea580c'>[移動運用 "+(idx+1)+"箇所目]</span>":"")+(isLatest&&info?"<br>🏆 最高順位: <b>"+info.band+" "+info.rk+"位</b>":"")).addTo(lg);
      if(isLatest){
        var lblTxt=(info?info.rk+"位 ":"")+dispName;
        var cls=moved?"move-lbl":(info?"rank-lbl":"");
        if(cls)mk.bindTooltip(lblTxt,{permanent:true,direction:"top",offset:[0,-6],className:cls});
      }
    });
  });

  var t2=document.getElementById("tb2");t2.innerHTML="";document.getElementById("c3").textContent=ow.length;
  if(!ow.length)t2.innerHTML='<tr><td colspan="5" style="text-align:center;color:#64748b">入力待ちログはありません</td></tr>';
  else ow.forEach(function(w){
    var bd=w.band||"DCR",nf=normCall(w.from),nt=normCall(w.to);
    var dispFrom=canonName[nf]||w.from,dispTo=canonName[nt]||w.to;
    var fList=stHist[nf],tList=stHist[nt];
    var p1=fList?"<br><small>("+fList[fList.length-1].place+")</small>":"";
    var p2=tList?"<br><small>("+tList[tList.length-1].place+")</small>":"<br><small style='color:#ef4444'>(本日未登録)</small>";
    var dBtn="<button class='btn-del' onclick=\"delLog('"+w.id+"','"+w.from+"','"+w.to+"','"+w.time+"')\">削除</button>";
    t2.innerHTML+="<tr><td><span class='b-tag'>"+bd+"</span></td><td><b>"+dispFrom+"</b>"+p1+"</td><td><b>"+dispTo+"</b>"+p2+"<br><span class='wb'>⏳ 待ち</span></td><td>"+fmtT(w.time)+"</td><td>"+dBtn+"</td></tr>";
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
