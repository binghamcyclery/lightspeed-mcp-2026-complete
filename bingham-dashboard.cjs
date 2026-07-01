const https = require('https');
const http = require('http');

const CONFIG = {
  accountId: '35270',
  clientId: '5b15d742d46594ffd88d62ef7548a95cb04fa023a2f5541e832038465f77e4ee',
  clientSecret: '4d9f9f49df751a2a626e8cc651799bdf0fc2ba158b784dd757e970fc041b78ad',
  refreshToken: '4ea58ba56220463d52ebd7c868124588a8abbd53',
  port: process.env.PORT || 3001,
};

const MONTHLY_REV_GOALS = {
  '5': [14000,9000,50000,138000,155000,225000,225000,225000,165000,78000,50000,16000],
  '7': [12000,12000,71000,100000,104000,135000,160000,145000,135000,74000,47000,55000],
  '9': [23480,34144,86350,102994,123964,144068,130000,125000,120000,70000,60000,60000],
};
const MARGIN_PCT = 0.42;
const ANNUAL_LCR_GOALS = { '5': 738000, '7': 486000, '9': 594000 };

function getGoals(shopID, month, rolloverRev, rolloverMar) {
  const rev = MONTHLY_REV_GOALS[shopID];
  const annualRev = rev.reduce((s,v) => s+v, 0);
  const baseMtdRevGoal = rev[month-1];
  const mtdRevGoal = baseMtdRevGoal + (rolloverRev || 0);
  const ytdRevGoal = rev.slice(0, month).reduce((s,v) => s+v, 0) + (rolloverRev || 0);
  const mtdMarGoal = Math.round(mtdRevGoal * MARGIN_PCT);
  const ytdMarGoal = Math.round(ytdRevGoal * MARGIN_PCT);
  const annualMarGoal = Math.round(annualRev * MARGIN_PCT);
  const annualLcrGoal = ANNUAL_LCR_GOALS[shopID];
  const mtdLcrGoal = Math.round(annualLcrGoal * baseMtdRevGoal / annualRev);
  const ytdLcrGoal = Math.round(annualLcrGoal * rev.slice(0, month).reduce((s,v) => s+v, 0) / annualRev);
  return { mtdRevGoal, ytdRevGoal, annualRev, mtdMarGoal, ytdMarGoal, annualMarGoal, mtdLcrGoal, ytdLcrGoal, annualLcrGoal, rolloverRev: rolloverRev||0, rolloverMar: rolloverMar||0 };
}

const SHOPS = [
  { shopID: '5', name: 'Park City' },
  { shopID: '7', name: 'Salt Lake City' },
  { shopID: '9', name: 'Sandy' },
];

const SKIP_EMPLOYEES = ['Online Sales', 'Client Services', 'Partner'];
const DEPT_LABOR = '21', DEPT_COMPONENTS = '12', DEPT_RUBBER = '18';
const BATCH = 50;

let accessToken = null;
let cachedData = null;
let lastFetch = null;

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function getToken() {
  return new Promise((resolve, reject) => {
    const data = `grant_type=refresh_token&client_id=${CONFIG.clientId}&client_secret=${CONFIG.clientSecret}&refresh_token=${CONFIG.refreshToken}`;
    const req = https.request({ hostname: 'cloud.lightspeedapp.com', path: '/oauth/access_token.php', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { const p = JSON.parse(body); accessToken = p.access_token; resolve(accessToken); });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const base = () => `https://api.lightspeedapp.com/API/V3/Account/${CONFIG.accountId}`;

async function getPaginated(path) {
  let url = `${base()}${path}`;
  const results = [];
  while (url) {
    let res = await httpsGet(url);
    if (res.httpCode === '401') { await getToken(); res = await httpsGet(url); }
    const key = Object.keys(res).find(k => k !== '@attributes');
    if (key && res[key]) {
      const items = Array.isArray(res[key]) ? res[key] : [res[key]];
      results.push(...items.filter(Boolean));
    }
    url = res['@attributes']?.next || null;
  }
  return results;
}

async function getSingle(path) {
  let res = await httpsGet(`${base()}${path}`);
  if (res.httpCode === '401') { await getToken(); res = await httpsGet(`${base()}${path}`); }
  return res;
}

async function getLastMonthData(shopID, lastMonthStart, lastMonthEnd, lastMonth) {
  const sales = await getPaginated(`/Sale.json?shopID=${shopID}&completed=true&completeTime=%3E,${lastMonthStart}T00:00:00&limit=100`);
  const filtered = sales.filter(s => (s.completeTime||s.createTime) <= lastMonthEnd + 'T23:59:59');
  const rev = filtered.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0), 0);
  const mar = filtered.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0) - parseFloat(x.calcAvgCost||0), 0);
  const baseRevGoal = MONTHLY_REV_GOALS[shopID][lastMonth-1];
  const baseMarGoal = Math.round(baseRevGoal * MARGIN_PCT);
  const rolloverRev = Math.max(0, baseRevGoal - rev);
  const rolloverMar = Math.max(0, baseMarGoal - mar);
  return { rev, mar, baseRevGoal, baseMarGoal, rolloverRev, rolloverMar };
}

async function fetchAllData() {
  console.log('[' + new Date().toLocaleTimeString() + '] Fetching dashboard data...');
  await getToken();

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const mtdStart = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
  const ytdStart = `${now.getFullYear()}-01-01`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;
  const currentMonth = now.getMonth() + 1;

  // Last month dates
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthStart = `${lastMonthYear}-${pad(lastMonth)}-01`;
  const lastMonthEnd = `${lastMonthYear}-${pad(lastMonth)}-${new Date(lastMonthYear, lastMonth, 0).getDate()}`;

  // Fetch last month data and rollover for each shop
  const lastMonthResults = await Promise.all(SHOPS.map(shop => getLastMonthData(shop.shopID, lastMonthStart, lastMonthEnd, lastMonth)));
  const rolloverByShop = {};
  SHOPS.forEach((shop, i) => {
    rolloverByShop[shop.shopID] = {
      rolloverRev: lastMonthResults[i].rolloverRev,
      rolloverMar: lastMonthResults[i].rolloverMar,
      lastMonth: lastMonthResults[i],
    };
  });

  // Fetch hours
  const hoursMap = {};
  const hoursTotal = {};
  const allHourEntries = await getPaginated(`/EmployeeHours.json?checkIn=%3E,${mtdStart}T00:00:00&limit=100`);
  allHourEntries.forEach(entry => {
    const eid = entry.employeeID;
    const sid = entry.shopID;
    if (!eid || !entry.checkIn || !entry.checkOut) return;
    const hrs = (new Date(entry.checkOut) - new Date(entry.checkIn)) / 3600000;
    if (hrs <= 0 || hrs >= 24) return;
    if (!hoursMap[eid]) hoursMap[eid] = {};
    if (!hoursMap[eid][sid]) hoursMap[eid][sid] = 0;
    hoursMap[eid][sid] += hrs;
    if (!hoursTotal[eid]) hoursTotal[eid] = 0;
    hoursTotal[eid] += hrs;
  });

  const allEmployees = await getPaginated(`/Employee.json?limit=100`);
  const empNames = {};
  allEmployees.forEach(e => { empNames[e.employeeID] = `${e.firstName} ${e.lastName}`.trim(); });

  const shopResults = await Promise.all(SHOPS.map(shop => {
    const { rolloverRev, rolloverMar } = rolloverByShop[shop.shopID];
    return processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth, rolloverRev, rolloverMar);
  }));

  // Company leaderboard
  const allEmpStats = {};
  shopResults.forEach(s => {
    s.lineEmployees.forEach(e => {
      if (!allEmpStats[e.employeeID]) {
        allEmpStats[e.employeeID] = { employeeID: e.employeeID, name: e.name, revenue: 0, sales: 0, hours: 0, locations: [] };
      }
      allEmpStats[e.employeeID].revenue += e.revenue;
      allEmpStats[e.employeeID].sales += e.sales;
      if (!allEmpStats[e.employeeID].locations.includes(s.name)) allEmpStats[e.employeeID].locations.push(s.name);
    });
  });
  Object.values(allEmpStats).forEach(e => { e.hours = hoursTotal[e.employeeID] || 0; });
  const companyLeaderboard = Object.values(allEmpStats)
    .map(e => ({ ...e, salesPerHour: e.hours >= 1 ? e.revenue / e.hours : 0, locationLabel: e.locations.join(' · ') }))
    .filter(e => e.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const lastMonthName = new Date(lastMonthYear, lastMonth-1, 1).toLocaleString('en-US', { month: 'long' });

  cachedData = {
    shops: shopResults, companyLeaderboard, rolloverByShop, lastMonthResults, lastMonthName,
    fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true }),
    daysLeft, dayOfMonth, daysInMonth, today, currentMonth,
  };
  lastFetch = Date.now();
  console.log('[' + new Date().toLocaleTimeString() + '] Done.');
  return cachedData;
}

async function processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth, rolloverRev, rolloverMar) {
  const goals = getGoals(shop.shopID, currentMonth, rolloverRev, rolloverMar);
  const mtdEnd = today + 'T23:59:59';

  const [mtdSales, ytdSales] = await Promise.all([
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&completeTime=%3E,${mtdStart}T00:00:00&limit=100`),
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&completeTime=%3E,${ytdStart}T00:00:00&limit=100`),
  ]);

  const filterEnd = (sales, end) => sales.filter(s => (s.completeTime||s.createTime) <= end);
  const mtd = filterEnd(mtdSales, mtdEnd);
  const ytd = filterEnd(ytdSales, mtdEnd);

  const rev = sales => sales.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0), 0);
  const mar = sales => sales.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0) - parseFloat(x.calcAvgCost||0), 0);

  const mtdRev = rev(mtd), ytdRev = rev(ytd);
  const mtdMar = mar(mtd), ytdMar = mar(ytd);

  const mtdSaleIDs = mtd.map(s => s.saleID);
  const allLines = [];
  for (let i = 0; i < mtdSaleIDs.length; i += BATCH) {
    const batch = mtdSaleIDs.slice(i, i + BATCH).join(',');
    const res = await httpsGet(`${base()}/SaleLine.json?saleID=IN,[${batch}]&limit=100`);
    const key = Object.keys(res).find(k => k !== '@attributes');
    if (key && res[key]) { const items = Array.isArray(res[key]) ? res[key] : [res[key]]; allLines.push(...items.filter(Boolean)); }
  }

  const empMap = {};
  allLines.forEach(line => {
    const eid = line.employeeID;
    if (!eid || eid === '0') return;
    const name = empNames[eid] || `Emp ${eid}`;
    if (SKIP_EMPLOYEES.some(sk => name.includes(sk))) return;
    const lineRev = parseFloat(line.calcSubtotal||0) - parseFloat(line.calcLineDiscount||0) - parseFloat(line.calcTransactionDiscount||0);
    if (lineRev <= 0) return;
    if (!empMap[eid]) empMap[eid] = { employeeID: eid, name, sales: 0, revenue: 0 };
    empMap[eid].sales++;
    empMap[eid].revenue += lineRev;
  });

  const lineEmployees = Object.values(empMap).map(e => {
    const shopHrs = hoursMap[e.employeeID]?.[shop.shopID] || 0;
    return { ...e, hours: shopHrs, salesPerHour: shopHrs >= 1 ? e.revenue / shopHrs : 0 };
  }).sort((a,b) => b.revenue - a.revenue);

  const lcr = await getLCR(allLines);
  return { name: shop.name, shopID: shop.shopID, goals, mtdRev, ytdRev, mtdMar, ytdMar, lcr, lineEmployees, daysLeft };
}

async function getLCR(allLines) {
  if (!allLines || !allLines.length) return { labor: 0, components: 0, rubber: 0, total: 0 };
  const uniqueItemIDs = [...new Set(allLines.map(l => l.itemID).filter(Boolean))];
  const itemDeptMap = {};
  for (let i = 0; i < uniqueItemIDs.length; i += BATCH) {
    const batch = uniqueItemIDs.slice(i, i + BATCH).join(',');
    const res = await httpsGet(`${base()}/Item.json?itemID=IN,[${batch}]&limit=100`);
    const key = Object.keys(res).find(k => k !== '@attributes');
    if (key && res[key]) { const items = Array.isArray(res[key]) ? res[key] : [res[key]]; items.forEach(item => { itemDeptMap[item.itemID] = item.departmentID; }); }
  }
  const sum = arr => arr.reduce((s,l) => s + parseFloat(l.calcSubtotal||0) - parseFloat(l.calcLineDiscount||0) - parseFloat(l.calcTransactionDiscount||0), 0);
  return {
    labor: sum(allLines.filter(l => itemDeptMap[l.itemID] === DEPT_LABOR)),
    components: sum(allLines.filter(l => itemDeptMap[l.itemID] === DEPT_COMPONENTS)),
    rubber: sum(allLines.filter(l => itemDeptMap[l.itemID] === DEPT_RUBBER)),
    total: sum(allLines.filter(l => [DEPT_LABOR,DEPT_COMPONENTS,DEPT_RUBBER].includes(itemDeptMap[l.itemID]))),
  };
}

const fmt = n => '$' + Math.round(n).toLocaleString();
const pct = (n, t) => t ? Math.min(100, Math.round(n/t*100)) : 0;
const fmtHrs = h => h > 0 ? h.toFixed(1) + 'h' : '—';
const goalColor  = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#16a34a' : p >= 90 ? '#ca8a04' : '#dc2626'; };
const goalBg     = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#f0fdf4' : p >= 90 ? '#fefce8' : '#fef2f2'; };
const goalBorder = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#bbf7d0' : p >= 90 ? '#fef08a' : '#fecaca'; };
const hitGoal    = (n, t) => t && n >= t;

function bar(val, goal) {
  const p = Math.min(100, pct(val, goal));
  return `<div style="height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin:3px 0 6px"><div style="height:100%;width:${p}%;background:${goalColor(val,goal)};border-radius:3px"></div></div>`;
}

function metricBadge(val, goal, label) {
  const hit = hitGoal(val, goal);
  return `
    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px${hit ? ';border:1.5px solid #16a34a;background:#f0fdf4' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1px">
        <div style="font-size:11px;color:#94a3b8">${label}</div>
        ${hit ? '<div style="font-size:10px;font-weight:600;color:#16a34a;background:#dcfce7;padding:1px 6px;border-radius:10px">🎯 GOAL!</div>' : ''}
      </div>
      <div style="font-size:19px;font-weight:500;color:${goalColor(val,goal)}">${fmt(val)}</div>
      <div style="font-size:11px;color:#94a3b8">Goal ${fmt(goal)} · ${pct(val,goal)}%</div>
      ${bar(val,goal)}
    </div>`;
}

function medal(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''; }

function buildHTML(data) {
  const { shops, companyLeaderboard, fetchedAt, daysLeft, daysInMonth, dayOfMonth, lastMonthResults, lastMonthName, rolloverByShop } = data;
  const nextRefresh = new Date(lastFetch + 15*60*1000).toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true });

  const totalMtdRev     = shops.reduce((s,x) => s+x.mtdRev, 0);
  const totalMtdMar     = shops.reduce((s,x) => s+x.mtdMar, 0);
  const totalYtdRev     = shops.reduce((s,x) => s+x.ytdRev, 0);
  const totalYtdMar     = shops.reduce((s,x) => s+x.ytdMar, 0);
  const totalMtdRevGoal = shops.reduce((s,x) => s+x.goals.mtdRevGoal, 0);
  const totalMtdMarGoal = shops.reduce((s,x) => s+x.goals.mtdMarGoal, 0);
  const totalYtdRevGoal = shops.reduce((s,x) => s+x.goals.ytdRevGoal, 0);
  const totalYtdMarGoal = shops.reduce((s,x) => s+x.goals.ytdMarGoal, 0);
  const totalAnnualRev  = shops.reduce((s,x) => s+x.goals.annualRev, 0);
  const totalAnnualMar  = shops.reduce((s,x) => s+x.goals.annualMarGoal, 0);

  const companyTotals = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px">
      <div style="background:${goalBg(totalMtdRev,totalMtdRevGoal)};border:0.5px solid ${goalBorder(totalMtdRev,totalMtdRevGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company MTD Revenue</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalMtdRev,totalMtdRevGoal)}">${fmt(totalMtdRev)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalMtdRevGoal)} goal · ${pct(totalMtdRev,totalMtdRevGoal)}%</div>
        ${bar(totalMtdRev,totalMtdRevGoal)}
      </div>
      <div style="background:${goalBg(totalMtdMar,totalMtdMarGoal)};border:0.5px solid ${goalBorder(totalMtdMar,totalMtdMarGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company MTD Margin</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalMtdMar,totalMtdMarGoal)}">${fmt(totalMtdMar)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalMtdMarGoal)} goal · ${pct(totalMtdMar,totalMtdMarGoal)}%</div>
        ${bar(totalMtdMar,totalMtdMarGoal)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div style="background:${goalBg(totalYtdRev,totalYtdRevGoal)};border:0.5px solid ${goalBorder(totalYtdRev,totalYtdRevGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company YTD Revenue</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalYtdRev,totalYtdRevGoal)}">${fmt(totalYtdRev)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalYtdRevGoal)} YTD goal · ${pct(totalYtdRev,totalYtdRevGoal)}% · Annual: ${fmt(totalAnnualRev)}</div>
        ${bar(totalYtdRev,totalYtdRevGoal)}
      </div>
      <div style="background:${goalBg(totalYtdMar,totalYtdMarGoal)};border:0.5px solid ${goalBorder(totalYtdMar,totalYtdMarGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company YTD Margin</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalYtdMar,totalYtdMarGoal)}">${fmt(totalYtdMar)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalYtdMarGoal)} YTD goal · ${pct(totalYtdMar,totalYtdMarGoal)}% · Annual: ${fmt(totalAnnualMar)}</div>
        ${bar(totalYtdMar,totalYtdMarGoal)}
      </div>
    </div>`;

  const locationChips = shops.map(s => `
    <div style="flex:1;min-width:150px;background:${goalBg(s.ytdRev,s.goals.ytdRevGoal)};border:0.5px solid ${goalBorder(s.ytdRev,s.goals.ytdRevGoal)};border-radius:8px;padding:10px 14px">
      <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${s.name}</div>
      <div style="font-size:15px;font-weight:500;color:${goalColor(s.ytdRev,s.goals.ytdRevGoal)}">${fmt(s.ytdRev)}</div>
      <div style="font-size:11px;color:#64748b">YTD Rev · Goal ${fmt(s.goals.ytdRevGoal)} · ${pct(s.ytdRev,s.goals.ytdRevGoal)}%</div>
      ${bar(s.ytdRev,s.goals.ytdRevGoal)}
      <div style="font-size:13px;font-weight:500;color:${goalColor(s.ytdMar,s.goals.ytdMarGoal)};margin-top:4px">${fmt(s.ytdMar)}</div>
      <div style="font-size:11px;color:#64748b">YTD Margin · Goal ${fmt(s.goals.ytdMarGoal)} · ${pct(s.ytdMar,s.goals.ytdMarGoal)}%</div>
      ${bar(s.ytdMar,s.goals.ytdMarGoal)}
    </div>`).join('');

  // Last month chips
  const lastMonthChips = SHOPS.map((shop, i) => {
    const lm = lastMonthResults[i];
    return `
    <div style="flex:1;min-width:150px;background:${goalBg(lm.rev,lm.baseRevGoal)};border:0.5px solid ${goalBorder(lm.rev,lm.baseRevGoal)};border-radius:8px;padding:10px 14px">
      <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${shop.name}</div>
      <div style="font-size:15px;font-weight:500;color:${goalColor(lm.rev,lm.baseRevGoal)}">${fmt(lm.rev)}</div>
      <div style="font-size:11px;color:#64748b">Rev · Goal ${fmt(lm.baseRevGoal)} · ${pct(lm.rev,lm.baseRevGoal)}%</div>
      ${bar(lm.rev,lm.baseRevGoal)}
      <div style="font-size:13px;font-weight:500;color:${goalColor(lm.mar,lm.baseMarGoal)};margin-top:4px">${fmt(lm.mar)}</div>
      <div style="font-size:11px;color:#64748b">Margin · Goal ${fmt(lm.baseMarGoal)} · ${pct(lm.mar,lm.baseMarGoal)}%</div>
      ${bar(lm.mar,lm.baseMarGoal)}
      ${lm.rolloverRev > 0 ? `<div style="font-size:10px;color:#dc2626;margin-top:4px">↪ ${fmt(lm.rolloverRev)} rolled to ${new Date().toLocaleString('en-US',{month:'long'})}</div>` : '<div style="font-size:10px;color:#16a34a;margin-top:4px">✓ Goal met — no rollover</div>'}
    </div>`;
  }).join('');

  const shopCards = shops.map(s => {
    const revHit = hitGoal(s.mtdRev, s.goals.mtdRevGoal);
    const marHit = hitGoal(s.mtdMar, s.goals.mtdMarGoal);
    const anyHit = revHit || marHit;
    const gapRev = Math.max(0, s.goals.mtdRevGoal - s.mtdRev);
    const gapMar = Math.max(0, s.goals.mtdMarGoal - s.mtdMar);
    const gapLcr = Math.max(0, s.goals.mtdLcrGoal - s.lcr.total);
    const dailyRev = daysLeft > 0 ? gapRev / daysLeft : 0;
    const dailyMar = daysLeft > 0 ? gapMar / daysLeft : 0;
    const dailyLcr = daysLeft > 0 ? gapLcr / daysLeft : 0;
    const rollover = rolloverByShop[s.shopID];

    return `
    <div style="background:#fff;border:${anyHit ? '2px solid #16a34a' : '0.5px solid #e2e8f0'};border-radius:14px;padding:20px 24px;margin-bottom:16px${anyHit ? ';background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%)' : ''}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="font-size:17px;font-weight:500;color:#0f172a">${anyHit ? '🏆 ' : ''}${s.name}</div>
        ${revHit && marHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Revenue & Margin Goals Hit! 🎯</div>' : revHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Revenue Goal Hit! 🎯</div>' : marHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Margin Goal Hit! 🎯</div>' : ''}
        ${rollover && rollover.rolloverRev > 0 ? `<div style="font-size:10px;color:#dc2626;background:#fef2f2;padding:2px 8px;border-radius:10px">↪ ${fmt(rollover.rolloverRev)} rollover included</div>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
        ${metricBadge(s.mtdRev, s.goals.mtdRevGoal, 'Revenue MTD')}
        ${metricBadge(s.mtdMar, s.goals.mtdMarGoal, 'Margin MTD')}
        ${metricBadge(s.lcr.total, s.goals.mtdLcrGoal, 'LCR MTD')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div style="background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#1d4ed8;margin-bottom:2px">Gap to revenue goal</div>
          <div style="font-size:16px;font-weight:500;color:#1d4ed8">${fmt(gapRev)}</div>
          <div style="font-size:11px;color:#2563eb">Need ${fmt(dailyRev)}/day · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left</div>
        </div>
        <div style="background:#faf5ff;border:0.5px solid #e9d5ff;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#7e22ce;margin-bottom:2px">Gap to margin goal</div>
          <div style="font-size:16px;font-weight:500;color:#7e22ce">${fmt(gapMar)}</div>
          <div style="font-size:11px;color:#9333ea">Need ${fmt(dailyMar)}/day</div>
        </div>
        <div style="background:#fff7ed;border:0.5px solid #fed7aa;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#c2410c;margin-bottom:2px">Gap to LCR goal</div>
          <div style="font-size:16px;font-weight:500;color:#c2410c">${fmt(gapLcr)}</div>
          <div style="font-size:11px;color:#ea580c">Need ${fmt(dailyLcr)}/day</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const leaderboardRows = companyLeaderboard.map((e, i) => `
    <tr style="border-top:0.5px solid #f1f5f9${i < 3 ? ';background:#fafbff' : ''}">
      <td style="padding:8px 10px;font-size:13px;color:#0f172a">${medal(i)} ${i+1}. ${e.name}</td>
      <td style="padding:8px 10px;font-size:11px;color:#94a3b8">${e.locationLabel}</td>
      <td style="padding:8px 10px;font-size:13px;font-weight:500;color:#0f172a;text-align:right">${fmt(e.revenue)}</td>
      <td style="padding:8px 10px;font-size:12px;color:#64748b;text-align:center">${e.sales}</td>
      <td style="padding:8px 10px;font-size:12px;color:#64748b;text-align:center">${fmtHrs(e.hours)}</td>
      <td style="padding:8px 10px;font-size:13px;color:#185FA5;text-align:right;font-weight:500">${e.hours >= 1 ? fmt(e.salesPerHour)+'/hr' : '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="900">
<title>Bingham Cyclery — Live Dashboard</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;padding:20px}</style>
</head>
<body>
<div style="max-width:960px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <div>
      <div style="font-size:21px;font-weight:500;color:#0f172a">Bingham Cyclery</div>
      <div style="font-size:12px;color:#94a3b8">Live performance · 2026 · Refreshes every 15 min</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#94a3b8">Updated ${fetchedAt} · Next ~${nextRefresh}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in month</div>
    </div>
  </div>
  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:16px 20px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Company Totals</div>
    ${companyTotals}
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 12px">By Location — YTD</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${locationChips}</div>
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 12px">${lastMonthName} Final</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${lastMonthChips}</div>
  </div>
  ${shopCards}
  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:16px">
    <div style="font-size:15px;font-weight:500;color:#0f172a;margin-bottom:14px">Company Leaderboard — MTD</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:left">Employee</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:left">Location</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:right">Revenue</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Lines</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Hours</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:right">$/hr</th>
        </tr>
      </thead>
      <tbody>${leaderboardRows || '<tr><td colspan="6" style="padding:12px;color:#94a3b8;font-size:13px">No data yet this month</td></tr>'}</tbody>
    </table>
  </div>
</div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  if (req.url !== '/' && req.url !== '/dashboard') { res.writeHead(404); res.end('Not found'); return; }
  try {
    const stale = !cachedData || (Date.now() - lastFetch > 15 * 60 * 1000);
    if (stale) await fetchAllData();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHTML(cachedData));
  } catch(err) {
    console.error(err);
    res.writeHead(500);
    res.end(`<pre style="padding:20px">Error: ${err.message}\n\n${err.stack}</pre>`);
  }
});

server.listen(CONFIG.port, () => {
  console.log(`Dashboard running at http://localhost:${CONFIG.port}`);
  fetchAllData().catch(console.error);
});

setInterval(() => { fetchAllData().catch(console.error); }, 15 * 60 * 1000);
