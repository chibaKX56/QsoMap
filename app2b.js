// app2b.js の主要な描画・ログ処理および初期化処理
function renderCurrent(){
  // 描画処理の本体（ステーション履歴、ログのフィルタリング、エッジの生成、ランキングおよび地図マーカーの描画など）
  // 詳細は提供されたスクリプトコードをご参照ください。
}

// 地図の初期化と外部データの読み込み
m = L.map("map").setView([36.8,139.5],6);
fetch("japan.json").then(function(r){return r.json();}).then(function(g){
  L.geoJSON(g,{style:{color:"#65a30d",weight:1,fillColor:"#ecfccb",fillOpacity:1},onEachFeature:function(f,l){var n=(f.properties&&(f.properties.nam_ja||f.properties.name))||"";if(n)l.bindTooltip(n,{sticky:true});}}).addTo(m).bringToBack();
});
lg = L.layerGroup().addTo(m);setTimeout(function(){m.invalidateSize();},400);

// 日付の設定とローカルストレージからの読み込み処理
var nw = new Date();
document.getElementById("today-disp").textContent = nw.getFullYear()+"年"+(nw.getMonth()+1)+"月"+nw.getDate()+"日";
nw.setMinutes(nw.getMinutes()-nw.getTimezoneOffset());
document.getElementById("tm").value = nw.toISOString().slice(0,16);

var sv = localStorage.getItem("mc"); if(sv) document.getElementById("rc").value = sv;
var sp = localStorage.getItem("mp"); if(sp) document.getElementById("pin").value = sp;
load();
