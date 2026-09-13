"use client";

import React from "react";

export function DebugPanel({ data }) {
  const [open, setOpen] = React.useState(true);
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{position:'fixed',bottom:120,right:12,zIndex:9999,background:'#e53935',
        color:'#fff',border:'none',borderRadius:999,padding:'6px 12px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
      DEBUG
    </button>
  );
  return (
    <div style={{position:'fixed',bottom:100,left:8,right:8,zIndex:9999,background:'rgba(0,0,0,0.92)',
      borderRadius:12,padding:12,maxHeight:'50vh',overflowY:'auto',fontSize:11,fontFamily:'monospace'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{color:'#e53935',fontWeight:700,fontSize:12}}>AT DEBUG</span>
        <button onClick={() => setOpen(false)}
          style={{background:'none',border:'none',color:'#fff',fontSize:16,cursor:'pointer'}}>✕</button>
      </div>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} style={{marginBottom:6,borderBottom:'0.5px solid #333',paddingBottom:6}}>
          <div style={{color:'#f6e05e',fontSize:10,marginBottom:2}}>{key}</div>
          <div style={{color:'#fff',wordBreak:'break-all'}}>
            {typeof val === 'object' ? JSON.stringify(val, null, 1) : String(val)}
          </div>
        </div>
      ))}
    </div>
  );
}
