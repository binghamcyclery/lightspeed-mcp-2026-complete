const https = require('https');
const http = require('http');

const CONFIG = {
  accountId: '35270',
  clientId: '5b15d742d46594ffd88d62ef7548a95cb04fa023a2f5541e832038465f77e4ee',
  clientSecret: '4d9f9f49df751a2a626e8cc651799bdf0fc2ba158b784dd757e970fc041b78ad',
  refreshToken: '4ea58ba56220463d52ebd7c868124588a8abbd53',
  port: process.env.PORT || 3001,
};

// Monthly revenue goals Jan-Dec from FY26 budget
// SLC June updated to $135,000 per Michelle; July updated to $160,000
const MONTHLY_REV_GOALS = {
  '5': [14000,9000,50000,138000,155000,225000,225000,225000,165000,78000,50000,16000],
  '7': [12000,12000,71000,100000,104000,135000,160000,145000,135000,74000,47000,55000],
  '9': [23480,34144,86350,102994,123964,144068,130000,125000,120000,70000,60000,60000],
};
const MARGIN_PCT = 0.42;
const ANNUAL_LCR_GOALS = { '5': 738000, '7': 486000, '9': 594000 };

function getGoals(shopID, month) {
  const rev = MONTHLY_REV_GOALS[shopID];
  const annualRev = rev.reduce((s,v) => s+v, 0);
  const mtdRevGoal = rev[month-1];
  const ytdRevGoal = rev.slice(0, month).reduce((s,v) => s+v, 0);
  const mtdMarGoal = Math.round(mtdRevGoal * MARGIN_PCT);
  const ytdMarGoal = Math.round(ytdRevGoal * MARGIN_PCT);
  const annualMarGoal = Math.round(annualRev * MARGIN_PCT);
  const annualLcrGoal = ANNUAL_LCR_GOALS[shopID];
  const mtdLcrGoal = Math.round(annualLcrGoal * mtdRevGoal / annualRev);
  const ytdLcrGoal = Math.round(annualLcrGoal * ytdRevGoal / annualRev);
  return { mtdRevGoal, ytdRevGoal, annualRev, mtdMarGoal, ytdMarGoal, annualMarGoal, mtdLcrGoal, ytdLcrGoal, annualLcrGoal };
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
  const currentMonth = now.getMonth() + 1;

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

  const shopResults = await Promise.all(SHOPS.map(shop => processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth)));

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
    shops: shopResults, companyLeaderboard,
    fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true }),
    daysLeft, dayOfMonth, daysInMonth, today, currentMonth,
  };
  lastFetch = Date.now();
  console.log('[' + new Date().toLocaleTimeString() + '] Done.');
  return cachedData;
}

async function processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth) {
  const goals = getGoals(shop.shopID, currentMonth);

  // Use completeTime filter to avoid pulling modified old sales
  const mtdEnd = today + 'T23:59:59';
  const ytdEnd = today + 'T23:59:59';

  const [mtdSales, ytdSales] = await Promise.all([
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&completeTime=%3E,${mtdStart}T00:00:00&limit=100`),
    getPaginated(`/Sale.json?shopID=${shop.shopID}&completed=true&completeTime=%3E,${ytdStart}T00:00:00&limit=100`),
  ]);

  const filterEnd = (sales, end) => sales.filter(s => (s.completeTime||s.createTime) <= end);
  const mtd = filterEnd(mtdSales, mtdEnd);
  const ytd = filterEnd(ytdSales, ytdEnd);

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
  return { name: shop.name, shopID: shop.shopID, goals, mtdRev, ytdRev, mtdMar, ytdMar, lcr, employees, daysLeft };
}

async function getLCR(shopID, startDate, endDate) {
  const sales = await getPaginated(`/Sale.json?shopID=${shopID}&completed=true&completeTime=%3E,${startDate}T00:00:00&limit=100`);
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
    total: sum(allLines.filter(l => [DEPT_LABOR,DEPT_COMPONENTS,DEPT_RUBBER].includes(itemDeptMap[l.itemID]))),
  };
}

const fmt = n => '$' + Math.round(n).toLocaleString();
const pct = (n, t) => t ? Math.min(100, Math.round(n/t*100)) : 0;
const fmtHrs = h => h > 0 ? h.toFixed(1) + 'h' : '—';
const goalColor  = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#16a34a' : p >= 90 ? '#ca8a04' : '#dc2626'; };
const goalBg     = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#f0fdf4' : p >= 90 ? '#fefce8' : '#fef2f2'; };
const goalBorder = (n, t) => { const p = t ? (n/t*100) : 0; return p >= 100 ? '#bbf7d0' : p >= 90 ? '#fef08a' : '#fecaca'; };

function bar(val, goal) {
  const p = Math.min(100, pct(val, goal));
  return `<div style="height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin:3px 0 6px"><div style="height:100%;width:${p}%;background:${goalColor(val,goal)};border-radius:3px"></div></div>`;
}

function medal(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''; }

function buildHTML(data) {
  const { shops, companyLeaderboard, fetchedAt, daysLeft, daysInMonth, dayOfMonth } = data;
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

  const shopCards = shops.map(s => {
    const gapRev = Math.max(0, s.goals.mtdRevGoal - s.mtdRev);
    const gapMar = Math.max(0, s.goals.mtdMarGoal - s.mtdMar);
    const gapLcr = Math.max(0, s.goals.mtdLcrGoal - s.lcr.total);
    const dailyRev = daysLeft > 0 ? gapRev / daysLeft : 0;
    const dailyMar = daysLeft > 0 ? gapMar / daysLeft : 0;
    const dailyLcr = daysLeft > 0 ? gapLcr / daysLeft : 0;

    return `
    <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:16px">
      <div style="font-size:17px;font-weight:500;color:#0f172a;margin-bottom:14px">${s.name}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">Revenue MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.mtdRev,s.goals.mtdRevGoal)}">${fmt(s.mtdRev)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.mtdRevGoal)} · ${pct(s.mtdRev,s.goals.mtdRevGoal)}%</div>
          ${bar(s.mtdRev,s.goals.mtdRevGoal)}
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">Margin MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.mtdMar,s.goals.mtdMarGoal)}">${fmt(s.mtdMar)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.mtdMarGoal)} · ${pct(s.mtdMar,s.goals.mtdMarGoal)}%</div>
          ${bar(s.mtdMar,s.goals.mtdMarGoal)}
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:1px">LCR MTD</div>
          <div style="font-size:19px;font-weight:500;color:${goalColor(s.lcr.total,s.goals.mtdLcrGoal)}">${fmt(s.lcr.total)}</div>
          <div style="font-size:11px;color:#94a3b8">Goal ${fmt(s.goals.mtdLcrGoal)} · ${pct(s.lcr.total,s.goals.mtdLcrGoal)}%</div>
          ${bar(s.lcr.total,s.goals.mtdLcrGoal)}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div style="background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;color:#1d4ed8;margin-bottom:2px">Gap to revenue goal</div>
          <div style="font-size:16px;font-weight:500;color:#1d4ed8">${fmt(gapRev)}</div>
          <div style="font-size:11px;color:#2563eb">Need ${fmt(dailyRev)}/day · ${daysLeft} days left</div>
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
