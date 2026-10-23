import React,{useMemo,useState,useEffect,useRef} from 'react';
import {DataComponent,DataTable,useDataApp} from '../../data-app-public.jsx';
import {parsed,makeProjection,path,number,pct,waterColor,laborColor,layerTitles} from './map-utils.js';

const column=(field,label,fn)=>({field,label,...(fn?{renderCell:v=>fn(v)}:{})});
export default function Geography({initialLayer,scope,fixedLayer=false}){
 const {queries,viewFocus,setDashboardFocus}=useDataApp();
 const raw=id=>queries[id]?.rows??[];
 const f=viewFocus??{};
 const layer=fixedLayer?initialLayer:(layerTitles[f.layer]?f.layer:initialLayer);
 const [search,setSearch]=useState(''),[hover,setHover]=useState(null),[zoom,setZoom]=useState(1),[pan,setPan]=useState([0,0]);
 const drag=useRef(null);
 const taluks=useMemo(()=>raw('geo_taluks').map(parsed),[queries.geo_taluks]);
 const villages=useMemo(()=>raw('geo_villages').map(parsed),[queries.geo_villages]);
 const villageIndex=useMemo(()=>new Map(raw('jjm_villages').map(r=>[r.jjmVillageId,r])),[queries.jjm_villages]);
 const taluk=taluks.some(x=>x.taluk===f.taluk)?f.taluk:'';
 const gps=taluk&&layer==='jjm'?[...new Set(raw('jjm_villages').filter(r=>r.taluk===taluk).map(r=>r.panchayat))].sort():[];
 const gp=gps.includes(f.gp)?f.gp:'';
 const localVillages=taluk?villages.filter(v=>v.taluk===taluk&&(!gp||villageIndex.get(v.jjmVillageId)?.panchayat===gp)):[];
 const selectedVillage=localVillages.find(v=>v.kgisCode===f.villageCode);
 const selectedTaluk=taluks.find(t=>t.taluk===taluk);
 const units=taluk?localVillages:taluks;
 const pointUnits=selectedVillage?[selectedVillage]:gp&&units.length?units:selectedTaluk?[selectedTaluk]:taluks;
 const projection=useMemo(()=>makeProjection(pointUnits),[taluk,gp,selectedVillage?.kgisCode,taluks]);
 const blockRows=layer==='jjm'?raw('jjm_taluks'):layer==='eshram'?raw('eshram_taluks'):[];
 const unitMetric=unit=>unit?.village?(layer==='jjm'?villageIndex.get(unit.jjmVillageId)??null:null):blockRows.find(r=>r.taluk===unit?.taluk)??null;
 const value=row=>row?(layer==='jjm'?row.coveragePct:row.registrations):null;
 const unitLabel=unit=>unit.village??unit.taluk;
 const sourceQuery=layer==='jjm'?(taluk?'jjm_villages':'jjm_taluks'):layer==='eshram'?'eshram_taluks':layer==='pmkisan'?'pmkisan_history':'pmayu_district';
 const scopeMetricRows=layer==='jjm'&&taluk?raw('jjm_villages').filter(r=>r.taluk===taluk&&(!gp||r.panchayat===gp)):['jjm','eshram'].includes(layer)?raw(sourceQuery).filter(r=>!taluk||r.taluk===taluk):raw(sourceQuery);
 const geographicQuery=taluk?'geo_villages':'geo_taluks';
 const rawGeoRows=raw(geographicQuery).filter(r=>units.some(u=>u.kgisCode===r.kgisCode));
 const sourceRowsByQuery={[geographicQuery]:rawGeoRows,[sourceQuery]:scopeMetricRows};
 const active=hover??selectedVillage??selectedTaluk;
 const gpAggregate=gp&&!hover&&!selectedVillage?scopeMetricRows.reduce((a,r)=>({totalHouseholds:a.totalHouseholds+r.totalHouseholds,tapConnections:a.tapConnections+r.tapConnections,remainingHouseholds:a.remainingHouseholds+r.remainingHouseholds}),{totalHouseholds:0,tapConnections:0,remainingHouseholds:0}):null;
 if(gpAggregate)gpAggregate.coveragePct=gpAggregate.totalHouseholds?gpAggregate.tapConnections/gpAggregate.totalHouseholds*100:null;
 const selectedRecord=gpAggregate??(active?unitMetric(active):null);
 const activeQuery=active?.village&&layer==='jjm'?'jjm_villages':layer==='jjm'?'jjm_taluks':sourceQuery;
 const selectedRows=gpAggregate?scopeMetricRows:selectedRecord?[selectedRecord]:active?.village?[]:['jjm','eshram'].includes(layer)?(taluk?raw(activeQuery).filter(r=>r.taluk===taluk):raw(layer==='jjm'?'jjm_district':'eshram_district')):raw(activeQuery);
 const selectedQuery=gpAggregate?'jjm_villages':!active&&['jjm','eshram'].includes(layer)?(layer==='jjm'?'jjm_district':'eshram_district'):activeQuery;
 const fill=unit=>layer==='jjm'?waterColor(value(unitMetric(unit))):layer==='eshram'?laborColor(value(unitMetric(unit))):'#dce4e2';
 const filtered=units.filter(u=>unitLabel(u).toLowerCase().includes(search.toLowerCase()));
 const mappedCount=taluk?units.filter(u=>unitMetric(u)).length:0;
 const setFocus=next=>{setDashboardFocus({...f,...next});setHover(null);setSearch('');};
 const chooseTaluk=t=>setFocus({taluk:t,villageCode:'',gp:''});
 const chooseVillage=v=>setFocus({villageCode:v.kgisCode});
 useEffect(()=>{setZoom(1);setPan([0,0]);},[taluk,gp,selectedVillage?.kgisCode,layer]);
 const activate=u=>taluk?chooseVillage(u):chooseTaluk(u.taluk);
 return <section className="sd-geography">
  <div className="sd-map-controls">
   <div className="sd-breadcrumb"><button onClick={()=>chooseTaluk('')}>Shivamogga</button>{taluk&&<><span>›</span><button onClick={()=>setFocus({villageCode:'',gp:''})}>{taluk}</button></>}{gp&&<><span>›</span><button onClick={()=>setFocus({villageCode:''})}>{gp}</button></>}{selectedVillage&&<><span>›</span><strong>{selectedVillage.village}</strong></>}</div>
   <div className="sd-selects">
    {!fixedLayer&&<label>Scheme<select aria-label="Map scheme" value={layer} onChange={e=>setFocus({layer:e.target.value,gp:'',villageCode:''})}>{Object.entries(layerTitles).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
    <label>Taluk<select aria-label="Select taluk" value={taluk} onChange={e=>chooseTaluk(e.target.value)}><option value="">All seven taluks</option>{taluks.map(t=><option key={t.taluk}>{t.taluk}</option>)}</select></label>
    {!!gps.length&&<label>Gram panchayat · JJM<select aria-label="Select gram panchayat" value={gp} onChange={e=>setFocus({gp:e.target.value,villageCode:''})}><option value="">All published GPs</option>{gps.map(g=><option key={g}>{g}</option>)}</select></label>}
   </div>
  </div>
  <div className="sd-map-layout">
   <DataComponent id={`${scope}-district-map`} queryId={geographicQuery} queryIds={[geographicQuery,sourceQuery]} title={taluk?(gp?`Village areas · ${gp}`:'Village areas and scheme coverage'):layer==='jjm'?'Tap-water coverage by block':layer==='eshram'?'Worker registrations by taluk':'Taluk geography'} kind="custom" variant="card" displayRows={units} sourceRowsByQuery={sourceRowsByQuery}>
    <div className="sd-map-frame">
     <div className="sd-map-caption"><span>{taluk?'VILLAGE AREAS':'SEVEN TALUKS'}</span><span>{layer==='jjm'?'Retrieved 23 Oct 2026':layer==='eshram'?'As of 20 Nov 2025':layer==='pmkisan'?'Taluk figures unavailable':'District figures only'}</span></div>
     <svg className="sd-geo-svg" viewBox="0 0 800 510" aria-label={`Interactive map of ${selectedVillage?.village??taluk??'Shivamogga'}`} onPointerDown={ev=>{if(ev.target===ev.currentTarget){drag.current=[ev.clientX,ev.clientY,...pan];ev.currentTarget.setPointerCapture(ev.pointerId)}}} onPointerMove={ev=>{if(drag.current)setPan([drag.current[2]+ev.clientX-drag.current[0],drag.current[3]+ev.clientY-drag.current[1]])}} onPointerUp={()=>{drag.current=null}}>
      <defs><pattern id={`map-grid-${scope}`} width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#bccdc5" opacity=".5"/></pattern></defs>
      <rect width="800" height="510" fill={`url(#map-grid-${scope})`} pointerEvents="none"/>
      <g transform={`translate(${400+pan[0]},${255+pan[1]}) scale(${zoom}) translate(-400,-255)`}>{units.map(unit=><path key={unit.kgisCode} d={path(unit,projection)} fill={selectedVillage?.kgisCode===unit.kgisCode?'#eac17e':fill(unit)} fillRule="evenodd" stroke={selectedVillage?.kgisCode===unit.kgisCode?'#9c6e21':'#f9fcfa'} strokeWidth={taluk?0.65:1.8} vectorEffect="non-scaling-stroke" tabIndex={0} role="button" aria-label={unitLabel(unit)+' · '+(value(unitMetric(unit))==null?'scheme metric unavailable':layer==='jjm'?pct(value(unitMetric(unit))):number(value(unitMetric(unit))))} onMouseEnter={()=>setHover(unit)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(unit)} onBlur={()=>setHover(null)} onClick={()=>activate(unit)} onKeyDown={ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();activate(unit)}}}/>)}</g>
      {!taluk&&taluks.map(unit=>{const [x,y]=projection([unit.longitude,unit.latitude]);const v=value(unitMetric(unit));return <g key={unit.taluk} transform={`translate(${400+pan[0]+(x-400)*zoom},${255+pan[1]+(y-255)*zoom})`} pointerEvents="none"><text className="sd-map-name" textAnchor="middle">{unit.taluk}</text>{v!=null&&<text className="sd-map-value" textAnchor="middle" y="18">{layer==='jjm'?`${v.toFixed(1)}%`:number(v)}</text>}</g>})}
      <g className="sd-north" transform="translate(755,47)"><text textAnchor="middle" y="-14">N</text><path d="M0-8 5 12 0 7-5 12Z" fill="currentColor"/></g>
      {!units.length&&<text x="400" y="250" textAnchor="middle" fill="currentColor" fontSize="15">No unambiguous geometry matches for this selection</text>}
     </svg>
     <div className="sd-map-tools"><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(4,z+.4))}>+</button><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(1,z-.4))}>−</button><button aria-label="Reset map view" onClick={()=>{setZoom(1);setPan([0,0]);}}>⌖</button></div>
     <div className="sd-legend">{layer==='jjm'?<><span><i style={{background:'#edbc7b'}}/>&lt;70%</span><span><i style={{background:'#afd4c6'}}/>70–&lt;85%</span><span><i style={{background:'#5ca38e'}}/>85–&lt;95%</span><span><i style={{background:'#1e6958'}}/>95–100%</span>{taluk&&<span><i style={{background:'#dce4e2'}}/>Unmatched</span>}</>:layer==='eshram'&&!taluk?<><span><i style={{background:'#d6dcf1'}}/>&lt;30,000</span><span><i style={{background:'#aaaed8'}}/>30–&lt;45k</span><span><i style={{background:'#787eb7'}}/>45–&lt;60k</span><span><i style={{background:'#484e8b'}}/>≥60,000</span></>:<span><i style={{background:'#dce4e2'}}/>Scheme values unavailable at this geography</span>}</div>
     <p className="sd-map-help">{taluk?'Select a village area for details.':'Select a taluk to explore its village areas.'} KGIS archive geometry · boundary vintage unconfirmed.</p>
    </div>
   </DataComponent>
   <aside className="sd-map-rail">
    <DataComponent id={`${scope}-selected-area`} queryId={selectedQuery} queryIds={active?.village?[selectedQuery,'geo_villages']:[selectedQuery]} title="Selected area" kind="custom" variant="card" displayRows={gpAggregate?[gpAggregate]:selectedRows} sourceRowsByQuery={active?.village?{[selectedQuery]:selectedRows,geo_villages:raw('geo_villages').filter(r=>r.kgisCode===active.kgisCode)}:{[selectedQuery]:selectedRows}}>
     <div className="sd-location-summary sd-unframed"><div className="sd-location-kicker">{gpAggregate?'Gram panchayat group':active?(active.village?'Village area':'Taluk'):'District'}</div><h3>{gpAggregate?gp:active?unitLabel(active):'Shivamogga district'}</h3><p>{layerTitles[layer]}</p>
      {selectedRecord?<><div className="sd-selected-number">{layer==='jjm'?pct(selectedRecord.coveragePct):number(selectedRecord.registrations)}</div><div className="sd-selected-label">{layer==='jjm'?'rural households with tap connections':'registered unorganised workers'}</div>{layer==='jjm'&&<div className="sd-mini-stats"><span>Tap connections<b>{number(selectedRecord.tapConnections)}</b></span><span>Without a connection<b>{number(selectedRecord.remainingHouseholds)}</b></span><span>Total rural households<b>{number(selectedRecord.totalHouseholds)}</b></span>{selectedRecord.panchayat&&<span>Gram panchayat<b>{selectedRecord.panchayat}</b></span>}</div>}</>:active?.village?<><div className="sd-empty-value">No unambiguous metric match</div><p className="sd-muted">The geographic area is available. Scheme figures have not been assigned where the official codes could not be matched uniquely.</p><dl className="sd-record"><dt>KGIS code</dt><dd>{active.kgisCode}</dd></dl></>:!['jjm','eshram'].includes(layer)?<div className="sd-empty-value">District data only</div>:<><div className="sd-selected-number">{layer==='jjm'?pct(raw('jjm_district')[0].coveragePct):number(raw('eshram_district')[0].registrations)}</div><div className="sd-selected-label">{layer==='jjm'?'rural household tap coverage':'reported district registrations'}</div><p className="sd-muted">Select a taluk to inspect its figures.</p></>}
      {layer==='eshram'&&<p className="sd-inline-warning">District and taluk figures differ by 54,952 registrations.</p>}
     </div>
    </DataComponent>
    <div className="sd-place-list"><div className="sd-list-title"><strong>{taluk?'Mapped village areas':'Explore taluks'}</strong><span>{units.length}</span></div><input aria-label={taluk?'Search village areas':'Search taluks'} placeholder={taluk?'Search village areas…':'Search taluks…'} value={search} onChange={ev=>setSearch(ev.target.value)}/><div className="sd-place-scroll">{filtered.map(unit=><button key={unit.kgisCode} className={selectedVillage?.kgisCode===unit.kgisCode?'selected':''} onClick={()=>activate(unit)}><span>{unitLabel(unit)}</span><b>{value(unitMetric(unit))==null?'—':layer==='jjm'?`${value(unitMetric(unit)).toFixed(1)}%`:number(value(unitMetric(unit)))}</b></button>)}{!filtered.length&&<p className="sd-muted">No matching areas.</p>}</div></div>
   </aside>
  </div>
  {taluk&&<div className="sd-notice amber"><span>ⓘ</span><div>{layer==='jjm'?`${mappedCount} of ${units.length} displayed KGIS areas have an unambiguous official village-code match. The records below retain every published JJM village in the selected taluk${gp?' / GP':''}, including unmapped records. GP filtering groups matched village areas; it is not a certified GP boundary.`:'Verified village-level figures for this scheme were not retrieved. Geography is shown without allocating taluk totals to villages.'}</div></div>}
  {taluk&&layer==='jjm'&&<DataComponent id={`${scope}-village-records`} queryId="jjm_villages" title={`Official village records · ${taluk}${gp?' / '+gp:''}`} kind="table" variant="card" displayRows={scopeMetricRows} sourceRows={scopeMetricRows} scopeFilters={{taluk,...(gp?{panchayat:gp}:{})}}><DataTable rows={scopeMetricRows} columns={[column('village','Village'),column('panchayat','Gram panchayat'),column('totalHouseholds','Rural HHs',number),column('tapConnections','Tap HHs',number),column('coveragePct','Coverage',pct),column('censusCode','Census code')]} label="Official JJM village metrics"/><p className="sd-footnote">Village metrics reconcile to the selected block totals when all GPs are selected. Census code 0 or repeated codes are retained in the records but never forced onto a map area.</p></DataComponent>}
 </section>
}
