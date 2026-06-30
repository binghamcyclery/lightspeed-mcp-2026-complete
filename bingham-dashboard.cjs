const https = require('https');
const http = require('http');

const CONFIG = {
  accountId: '35270',
  clientId: '5b15d742d46594ffd88d62ef7548a95cb04fa023a2f5541e832038465f77e4ee',
  clientSecret: '4d9f9f49df751a2a626e8cc651799bdf0fc2ba158b784dd757e970fc041b78ad',
  refreshToken: '4ea58ba56220463d52ebd7c868124588a8abbd53',
  port: process.env.PORT || 3001,
};

const SHOPS = [
  { shopID: '5', name: 'Park City',      revGoal: 205000, marginGoal: 88150, lcrGoal: 61500 },
  { shopID: '7', name: 'Salt Lake City', revGoal: 135000, marginGoal: 58050, lcrGoal: 40500 },
  { shopID: '9', name: 'Sandy',          revGoal: 165000, marginGoal: 70950, lcrGoal: 49500 },
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
  const daysLeft = daysInMonth - dayOfMonth;

  const allEmployees = await getPaginated(`/Employee.json?limit=100`);
  const empNames = {};
  allEmployees.forEach(e => { empNames[e.employeeID] = `${e.firstName} ${e.lastName}`.trim(); });

  const hoursMap = {};
  await Promise.all(allEmployees.map(async e => {
    if (SKIP_EMPLOYEES.some(s => empNames[e.employeeID]?.includes(s))) return;
    try {
      const res = await getSingle(`/Employee/${e.employeeID}/EmployeeHours.json?startDate=${mtdStart}&endDate=${today}`);
      const entries = res.EmployeeHours ? (Array.isArray(res.EmployeeHours) ? res.EmployeeHours : [res.EmployeeHours]) : [];
      if (!hoursMap[e.employeeID]) hoursMap[e.employeeID] = {};
      entries.forEach(entry => {
        const sid = entry.shopID;
        if (!hoursMap[e.employeeID][sid]) hoursMap[e.employeeID][sid] = 0;
        if (entry.checkIn && entry.checkOut) {
          const hrs = (new Date(entry.checkOut) - new Date(entry.checkIn)) / 3600000;
          if (hrs > 0) hoursMap[e.employeeID][sid] += hrs;
        }
      });
    } catch(err) {}
  }));

  const shopResults = await Promise.all(SHOPS.map(shop => processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap)));

  const allEmpStats = [];
  shopResults.forEach(s => {
    s.employees.forEach(e => {
      const existing = allEmpStats.find(x => x.employeeID === e.employeeID);
      if (existing) {
        existing.revenue += e.revenue;
        existing.hours += e.hours;
        existing.sales += e.sales;
        existing.locations.push(s.name);
      } else {
        allEmpStats.push({ ...e, locations: [s.name] });
      }
    });
  });
  allEmpStats.forEach(e => {
    e.salesPerHour = e.hours >= 1 ? e.revenue / e.hours : 0;
    e.locationLabel = e.locations.join(' · ');
  });
  const companyLeaderboard = allEmpStats.filter(e => e.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  cachedData = {
    shops: shopResults,
    companyLeaderboard,
    fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true }),
    daysLeft, dayOfMonth, daysInMonth, today
  };
  lastFetch = Date.now();
  console.log('[' + new Date().toLocaleTimeString() + '] Done.');
  return cachedData;
}

async function processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap) {
  const [mtdSales, ytdSales] = await Promise.all([
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&timeStamp=%3E,${mtdStart}&limit=100`),
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&timeStamp=%3E,${ytdStart}&limit=100`),
  ]);

  const filterEnd = (sales, end) => sales.filter(s => (s.completeTime||s.createTime) <= end + 'T23:59:59');
  const mtd = filterEnd(mtdSales, today);
  const ytd = filterEnd(ytdSales, today);

  const rev = sales => sales.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0), 0);
  const mar = sales => sales.reduce((s,x) => s + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0) - parseFloat(x.calcAvgCost||0), 0);

  const mtdRev = rev(mtd), ytdRev = rev(ytd);
  const mtdMar = mar(mtd), ytdMar = mar(ytd);

  const empMap = {};
  mtd.forEach(s => {
    const eid = s.employeeID;
    if (!eid || eid === '0') return;
    const name = empNames[eid] || `Emp ${eid}`;
    if (SKIP_EMPLOYEES.some(sk => name.includes(sk))) return;
    if (!empMap[eid]) empMap[eid] = { employeeID: eid, name, sales: 0, revenue: 0 };
    empMap[eid].sales++;
    empMap[eid].revenue += parseFloat(s.calcSubtotal||0) - parseFloat(s.calcDiscount||0);
  });

  const employees = Object.values(empMap).map(e => {
    const shopHrs = hoursMap[e.employeeID]?.[shop.shopID] || 0;
    return { ...e, hours: shopHrs, salesPerHour: shopHrs >= 1 ? e.revenue / shopHrs : 0 };
  }).sort((a,b) => b.revenue - a.revenue);

  const lcr = await getLCR(shop.shopID, mtdStart, today);
  return { name: shop.name, shopID: shop.shopID, goals: shop, mtdRev, ytdRev, mtdMar, ytdMar, lcr, employees, daysLeft };
}

async function getLCR(shopID, startDate, endDate) {
  const sales = await getPaginated(`/Sale.json?shopID=${shopID}&completed=true&timeStamp=%3E,${startDate}&limit=100`);
  const filtered = sales.filter(s => (s.completeTime||s.createTime) <= endDate + 'T23:59:59');
  if (!filtered.length) return { labor: 0, components: 0, rubber: 0, total: 0 };
  const saleIDs = filtered.map(s => s.saleID);
  const allLines = [];
  for (let i = 0; i < saleIDs.length; i += BATCH) {
    const batch = saleIDs.slice(i, i + BATCH).join(',');
    const res = await httpsGet(`${base()}/SaleLine.json?saleID=IN,[${batch}]&limit=100`);
    const key = Object.keys(res).find(k => k !== '@attributes');
    if (key && res[key]) { const items = Array.isArray(res[key]) ? res[key] : [res[key]]; allLines.push(...items); }
  }
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
    total: sum(allLines.filter(l => [DEPT_LABOR, DEPT_COMPONENTS, DEPT_RUBBER].includes(itemDeptMap[l.itemID]))),
  };
}

const fmt = n => '$' + Math.round(n).toLocaleString();
const pct = (n, t) => t ? Math.min(100, Math.round(n/t*100)) : 0;
const fmtHrs = h => h > 0 ? h.toFixed(1) + 'h' : '—';
const goalColor = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 85 ? '#16a34a' : p >= 75 ? '#ca8a04' : '#dc2626'; };
const goalBg = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 85 ? '#f0fdf4' : p >= 75 ? '#fefce8' : '#fef2f2'; };
const goalBorder = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 85 ? '#bbf7d0' : p >= 75 ? '#fef08a' : '#fecaca'; };

function bar(val, goal) {
  const p = pct(val, goal);
  const barColor = goalColor(val, goal);
  return `<div style="height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin:3px 0 6px"><div style="height:100%;width:${p}%;background:${barColor};border-radius:3px"></div></div>`;
}

function medal(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''; }

function buildHTML(data) {
  const { shops, companyLeaderboard, fetchedAt, daysLeft, daysInMonth, dayOfMonth } = data;
  const nextRefresh = new Date(lastFetch + 15*60*1000).toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true });

  const totalMtdRev = shops.reduce((s,x) => s+x.mtdRev, 0);
  const totalMtdMar = shops.reduce((s,x) => s+x.mtdMar, 0);
  const totalYtdRev = shops.reduce((s,x) => s+x.ytdRev, 0);
  const totalYtdMar = shops.reduce((s,x) => s+x.ytdMar, 0);
  const totalRevGoal = shops.reduce((s,x) => s+x.goals.revGoal, 0);
  const totalMarGoal = shops.reduce((s,x) => s+x.goals.marginGoal, 0);

  const companyTotals = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
      <div style="background:${goalBg(totalMtdRev,totalRevGoal)};border:0.5px solid ${goalBorder(totalMtdRev,totalRevGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company MTD Revenue</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalMtdRev,totalRevGoal)}">${fmt(totalMtdRev)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalRevGoal)} goal · ${pct(totalMtdRev,totalRevGoal)}%</div>
        ${bar(totalMtdRev,totalRevGoal)}
      </div>
      <div style="background:${goalBg(totalMtdMar,totalMarGoal)};border:0.5px solid ${goalBorder(totalMtdMar,totalMarGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company MTD Margin</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalMtdMar,totalMarGoal)}">${fmt(totalMtdMar)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalMarGoal)} goal · ${pct(totalMtdMar,totalMarGoal)}%</div>
        ${bar(totalMtdMar,totalMarGoal)}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div style="background:${goalBg(totalYtdRev,totalRevGoal)};border:0.5px solid ${goalBorder(totalYtdRev,totalRevGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company YTD Revenue</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalYtdRev,totalRevGoal)}">${fmt(totalYtdRev)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalRevGoal)} annual goal · ${pct(totalYtdRev,totalRevGoal)}%</div>
        ${bar(totalYtdRev,totalRevGoal)}
      </div>
      <div style="background:${goalBg(totalYtdMar,totalMarGoal)};border:0.5px solid ${goalBorder(totalYtdMar,totalMarGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Company YTD Margin</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalYtdMar,totalMarGoal)}">${fmt(totalYtdMar)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalMarGoal)} annual goal · ${pct(totalYtdMar,totalMarGoal)}%</div>
        ${bar(totalYtdMar,totalMarGoal)}
      </div>
    </div>`;

  const locationChips = shops.map(s => `
    <div style="flex:1;min-width:150px;background:${goalBg(s.ytdRev,s.goals.revGoal)};border:0.5px solid ${goalBorder(s.ytdRev,s.goals.revGoal)};border-radius:8px;padding:10px 14px">
      <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${s.name}</div>
      <div style="font-size:15px;font-weight:500;color:${goalColor(s.ytdRev,s.goals.revGoal)}">${fmt(s.ytdRev)}</div>
      <div style="font-size:11px;color:#64748b">YTD Rev · Goal ${fmt(s.goals.revGoal)} · ${pct(s.ytdRev,s.goals.revGoal)}%</div>
      ${bar(s.ytdRev,s.goals.revGoal)}
      <div style="font-size:13px;font-weight:500;color:${goalColor(s.ytdMar,s.goals.marginGoal)};margin-top:4px">${fmt(s.ytdMar)}</div>
      <div style="font-size:11px;color:#64748b">YTD Margin · Goal ${fmt(s.goals.marginGoal)} · ${pct(s.ytdMar,s.goals.marginGoal)}%</div>
      ${bar(s.ytdMar,s.goals.marginGoal)}
    </div>`).join('');

  const shopCards = shops.map(s => {
    const gapRev = Math.max(0, s.goals.revGoal - s.mtdRev);
    const gapLcr = Math.max(0, s.goals.lcrGoal - s.lcr.total);
    const dailyRev = daysLeft > 0 ? gapRev / daysLeft : 0;
    const dailyLcr = daysLeft > 0 ? gapLcr / daysLeft : 0;

    return `
    <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:16px">
      <div style="font-size:17px;font-weight:500;color:#0f172a;margin-bottom:14px">${s.name}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">Revenue MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.mtdRev,s.goals.revGoal)}">${fmt(s.mtdRev)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.revGoal)} · ${pct(s.mtdRev,s.goals.revGoal)}%</div>
          ${bar(s.mtdRev,s.goals.revGoal)}
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">Margin MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.mtdMar,s.goals.marginGoal)}">${fmt(s.mtdMar)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.marginGoal)} · ${pct(s.mtdMar,s.goals.marginGoal)}%</div>
          ${bar(s.mtdMar,s.goals.marginGoal)}
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">LCR MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.lcr.total,s.goals.lcrGoal)}">${fmt(s.lcr.total)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.lcrGoal)} · ${pct(s.lcr.total,s.goals.lcrGoal)}%</div>
          ${bar(s.lcr.total,s.goals.lcrGoal)}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#1d4ed8;margin-bottom:2px">Gap to revenue goal</div>
          <div style="font-size:16px;font-weight:500;color:#1d4ed8">${fmt(gapRev)}</div>
          <div style="font-size:11px;color:#2563eb">Need ${fmt(dailyRev)}/day · ${daysLeft} days left</div>
        </div>
        <div style="background:#faf5ff;border:0.5px solid #e9d5ff;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#7e22ce;margin-bottom:2px">Gap to LCR goal</div>
          <div style="font-size:16px;font-weight:500;color:#7e22ce">${fmt(gapLcr)}</div>
          <div style="font-size:11px;color:#9333ea">Need ${fmt(dailyLcr)}/day</div>
        </div>
        <div style="background:#fff7ed;border:0.5px solid #fed7aa;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#c2410c;margin-bottom:2px">YTD Revenue</div>
          <div style="font-size:16px;font-weight:500;color:#c2410c">${fmt(s.ytdRev)}</div>
          <div style="font-size:11px;color:#ea580c">YTD Margin ${fmt(s.ytdMar)}</div>
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
      <div style="font-size:12px;color:#94a3b8">Live performance · ${new Date().getFullYear()} · Refreshes every 15 min</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#94a3b8">Updated ${fetchedAt} · Next ~${nextRefresh}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">${daysLeft} days left in month</div>
    </div>
  </div>

  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:16px 20px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Company Totals</div>
    ${companyTotals}
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 12px">By Location — YTD</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${locationChips}</div>
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
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Tickets</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Hours</th>
          <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:right">$/hr</th>
        </tr>
      </thead>
      <tbody>${leaderboardRows || '<tr><td colspan="6" style="padding:12px;color:#94a3b8;font-size:13px">No data</td></tr>'}</tbody>
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
