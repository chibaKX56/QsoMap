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
