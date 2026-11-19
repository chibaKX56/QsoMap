var U="https://script.google.com/macros/s/AKfycbzekdUKLnK-3kNEC6eR-NvaLruIwMiZLJVjCyRmv0-77FCLZIkY0SRCL2Zif8VIfoEOZA/exec",m,lg;
var PAL=["#e11d48","#2563eb","#16a34a","#9333ea","#ea580c","#0891b2","#db2777","#4f46e5"];
var BANDS=["CB","DCR","LCR","SLP"];
var rawStations=[],rawLogs=[];

function at(arr,i){return(arr&&arr.length>i)?arr.slice(i,i+1).pop():"";}

// コールサイン正規化（ひらがな→カタカナ、全角英数→半角大文字、空白除去）
function normCall(s){
  return String(s||"").trim()
    .replace(/[！-～]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-0xFEE0);})
    .replace(/[ぁ-ゖ]/g,function(c){return String.fromCharCode(c.charCodeAt(0)+0x60);})
    .replace(/\s+/g,"")
    .toUpperCase();
}

function getDateStr(t){
  var s=String(t||""),m1=s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(m1)return at(m1,1)+"-"+("0"+at(m1,2)).slice(-2)+"-"+("0"+at(m1,3)).slice(-2);
  var d=new Date(s);
  if(!isNaN(d.getTime()))return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  return "";
}
function fmtT(t){
  var s=String(t||""),mt=s.match(/(\d{1,2}):(\d{2})/);
  if(mt)return("0"+at(mt,1)).slice(-2)+":"+at(mt,2);
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
  var c=document.getElementById("rc").value.trim();
  var pin=document.getElementById("pin").value.trim();
  var p=document.getElementById("rp").value.trim();
  var x=document.getElementById("rx").value.split(",");
  var la=parseFloat(x.shift()),lo=parseFloat(x.shift());
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
  var mc=document.getElementById("rc").value.trim();
  var tc=document.getElementById("lt").value.trim();
  var bd=document.getElementById("band").value;
  var tm=document.getElementById("tm").value.replace("T"," ");
  if(!mc||!tc||!tm||normCall(mc)===normCall(tc))return alert("自局・相手局コールサインと交信日時を確認してください");
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
