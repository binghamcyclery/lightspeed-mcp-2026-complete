const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  accountId: '35270',
  clientId: '5b15d742d46594ffd88d62ef7548a95cb04fa023a2f5541e832038465f77e4ee',
  clientSecret: '4d9f9f49df751a2a626e8cc651799bdf0fc2ba158b784dd757e970fc041b78ad',
  refreshToken: '4ea58ba56220463d52ebd7c868124588a8abbd53',
  port: process.env.PORT || 3001,
  githubToken: process.env.GITHUB_TOKEN || '',
  githubRepo: 'binghamcyclery/lightspeed-mcp-2026-complete',
  password: '1962',
};

const MONTHLY_REV_GOALS = {
  '5': [14000,9000,50000,138000,155000,225000,225000,225000,165000,78000,50000,16000],
  '7': [12000,12000,71000,100000,104000,135000,160000,145000,135000,74000,47000,55000],
  '9': [23480,34144,86350,102994,123964,144068,130000,125000,120000,70000,60000,60000],
};
const MARGIN_PCT = 0.42;
const ANNUAL_LCR_GOALS = { '5': 738000, '7': 486000, '9': 594000 };
const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

const pad = n => String(n).padStart(2, '0');

// Share of a typical week's revenue by weekday, Mon→Sun, measured from 2025 actuals
// in Mountain time. Saturday leads everywhere, Friday second. Sandy and Salt Lake are
// closed Sundays (0%); Park City is open.
//
// Salt Lake has no usable history of its own — the original location closed mid-2025
// and the new one opened January 2026 — so it borrows Sandy's curve, which matches its
// sales profile closely. Revisit once the new store has a full year of its own data.
const COMPANY_WEEKDAY_WEIGHTS = [0.1293, 0.1139, 0.1390, 0.1336, 0.1756, 0.2368, 0.0718];
const SANDY_WEEKDAY_WEIGHTS = [0.1281, 0.1434, 0.1386, 0.1553, 0.1706, 0.2640, 0.0000];
const WEEKDAY_WEIGHTS = {
  '5': [0.1427, 0.0802, 0.1339, 0.1189, 0.1735, 0.2157, 0.1350],
  '7': SANDY_WEEKDAY_WEIGHTS,
  '9': SANDY_WEEKDAY_WEIGHTS,
};

// Mountain-time calendar date (YYYY-MM-DD). Lightspeed timestamps are UTC, so a
// Saturday evening sale is Sunday in UTC and would land in the wrong week without this.
const mtnDate = iso => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Denver' });

// Weeks run Monday→Sunday, clipped to the month — so the first and last are usually
// partial. Each week's slice of the monthly goal is proportional to the weekday weight
// of the days it actually contains, which means the slices sum to the monthly goal
// exactly (rollover included, since it's already baked into the monthly figure).
function getWeekGoals(shopID, year, month, goals) {
  const weights = WEEKDAY_WEIGHTS[shopID] || COMPANY_WEEKDAY_WEIGHTS;
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dow = (new Date(year, month - 1, day).getDay() + 6) % 7; // Mon=0 … Sun=6
    if (!weeks.length || dow === 0) weeks.push({ startDay: day, endDay: day, weight: 0 });
    const cur = weeks[weeks.length - 1];
    cur.endDay = day;
    cur.weight += weights[dow];
  }
  const totalWeight = weeks.reduce((s, w) => s + w.weight, 0);
  return weeks.map((w, i) => {
    const share = totalWeight ? w.weight / totalWeight : 0;
    return {
      label: `Week ${i + 1}`,
      start: `${year}-${pad(month)}-${pad(w.startDay)}`,
      end: `${year}-${pad(month)}-${pad(w.endDay)}`,
      dateLabel: `${month}/${w.startDay}–${month}/${w.endDay}`,
      revGoal: Math.round(goals.mtdRevGoal * share),
      marGoal: Math.round(goals.mtdMarGoal * share),
      lcrGoal: Math.round(goals.mtdLcrGoal * share),
    };
  });
}

// Matched on employee ID rather than name — names in Lightspeed get edited, IDs don't.
const EMP_ONLINE_SALES = '281';        // "Online Sales zInternet"
const EMP_MICHELLE_SCHMID = '213';     // web orders are hers, so credit them to her
const REASSIGN_EMPLOYEE = { [EMP_ONLINE_SALES]: EMP_MICHELLE_SCHMID };
const SKIP_EMPLOYEE_IDS = [
  '270',  // Partner Logins
  '379',  // Client Services RetailToolkit
];
const DEPT_LABOR = '21', DEPT_COMPONENTS = '12', DEPT_RUBBER = '18';
const BATCH = 50;

const MTN_TZ = 'America/Denver';
// Lightspeed timestamps are UTC. Without converting, the business day starts at 6pm
// Mountain the previous day, so evening sales land in the wrong day and month
// boundaries are six hours off from what Lightspeed's own reports show.
function mtnToUTC(dateStr, timeStr = '00:00:00') {
  const naive = new Date(`${dateStr}T${timeStr}Z`);
  const asMtn = new Date(naive.toLocaleString('en-US', { timeZone: MTN_TZ }));
  const asUtc = new Date(naive.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(naive.getTime() + (asUtc - asMtn));
}
const utcStamp = d => d.toISOString().slice(0, 19);
const mtnToday = () => new Date().toLocaleDateString('en-CA', { timeZone: MTN_TZ });

let accessToken = null;
let cachedData = null;
let lastFetch = null;
let snapshotIndex = {};

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const SNAPSHOT_INDEX_FILE = path.join(SNAPSHOT_DIR, 'index.json');
try {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  if (fs.existsSync(SNAPSHOT_INDEX_FILE)) snapshotIndex = JSON.parse(fs.readFileSync(SNAPSHOT_INDEX_FILE, 'utf8'));
} catch(e) { console.error('Snapshot index load error:', e.message); }

// Icons are inlined as data URIs rather than linked, so archived snapshots keep the
// tab icon even when the HTML is opened outside this server.
const dataURI = file => {
  try { return 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'assets', file)).toString('base64'); }
  catch(e) { console.error(`Icon load error (${file}):`, e.message); return ''; }
};
const FAVICON = dataURI('favicon-32.png');
const TOUCH_ICON = dataURI('apple-touch-icon.png');
const ICON_TAGS = [
  FAVICON ? `<link rel="icon" type="image/png" sizes="32x32" href="${FAVICON}">` : '',
  TOUCH_ICON ? `<link rel="apple-touch-icon" sizes="180x180" href="${TOUCH_ICON}">` : '',
].join('');

// Session store (simple in-memory)
const sessions = new Set();
function generateSession() {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessions.add(id);
  return id;
}
function isAuthenticated(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([^;]+)/);
  return match && sessions.has(match[1]);
}

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bingham Cyclery — Login</title>
${ICON_TAGS}
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border:0.5px solid #e2e8f0;border-radius:16px;padding:40px;width:100%;max-width:360px;text-align:center}
h1{font-size:20px;font-weight:500;color:#0f172a;margin-bottom:6px}
p{font-size:13px;color:#94a3b8;margin-bottom:28px}
input{width:100%;padding:10px 14px;border:0.5px solid #e2e8f0;border-radius:8px;font-size:16px;text-align:center;letter-spacing:6px;color:#0f172a;outline:none;margin-bottom:16px}
input:focus{border-color:#0f172a}
button{width:100%;padding:11px;background:#0f172a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer}
button:hover{background:#1e293b}
.error{font-size:12px;color:#dc2626;margin-top:12px}
</style>
</head>
<body>
<div class="card">
  <h1>Bingham Cyclery</h1>
  <p>Enter your access code to continue</p>
  <form method="POST" action="/login">
    <input type="password" name="password" placeholder="••••" autofocus maxlength="10">
    <button type="submit">Enter →</button>
    {{ERROR}}
  </form>
</div>
</body>
</html>`;

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

// Sale lines come back capped at 100 per response, so a batch of 50 sales routinely
// overflows a single page. Always follow pagination or lines get silently dropped.
async function fetchSaleLines(saleIDs) {
  const lines = [];
  for (let i = 0; i < saleIDs.length; i += BATCH) {
    const batch = saleIDs.slice(i, i + BATCH).join(',');
    lines.push(...await getPaginated(`/SaleLine.json?saleID=IN,[${batch}]&limit=100`));
  }
  return lines;
}

// Completed sales for a Mountain-local date range, inclusive of both endpoints.
async function fetchSalesInRange(shopID, startDate, endDate) {
  const startUTC = utcStamp(mtnToUTC(startDate, '00:00:00'));
  const endUTC = mtnToUTC(endDate, '23:59:59').getTime();
  const sales = await getPaginated(`/Sale.json?shopID=${shopID}&completed=true&completeTime=%3E,${startUTC}&limit=100`);
  return sales.filter(s => new Date(s.completeTime || s.createTime).getTime() <= endUTC);
}

// The default Employee list only returns active staff (39 of 377), so anyone who has
// left would show as "Emp 376" while their sales still count. Merge in the archived
// list; active entries win on conflict.
async function fetchEmployeeNames() {
  const [active, archived] = await Promise.all([
    getPaginated('/Employee.json?limit=100'),
    getPaginated('/Employee.json?archived=true&limit=100').catch(() => []),
  ]);
  const names = {};
  [...archived, ...active].forEach(e => {
    names[e.employeeID] = `${e.firstName || ''} ${e.lastName || ''}`.replace(/\s+/g, ' ').trim();
  });
  return names;
}

// Clock entries for a Mountain-local date range, totalled per employee and per shop.
async function fetchHours(startDate, endDate) {
  const startUTC = utcStamp(mtnToUTC(startDate, '00:00:00'));
  const endUTC = mtnToUTC(endDate, '23:59:59').getTime();
  const entries = await getPaginated(`/EmployeeHours.json?checkIn=%3E,${startUTC}&limit=100`);
  const total = {}, byShop = {};
  entries.forEach(e => {
    if (!e.employeeID || !e.checkIn || !e.checkOut) return;
    if (new Date(e.checkIn).getTime() > endUTC) return;
    const hrs = (new Date(e.checkOut) - new Date(e.checkIn)) / 3600000;
    if (hrs <= 0 || hrs >= 24) return;
    total[e.employeeID] = (total[e.employeeID] || 0) + hrs;
    if (!byShop[e.employeeID]) byShop[e.employeeID] = {};
    byShop[e.employeeID][e.shopID] = (byShop[e.employeeID][e.shopID] || 0) + hrs;
  });
  return { total, byShop };
}

const saleRev = list => list.reduce((a,x) => a + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0), 0);
const saleMar = list => list.reduce((a,x) => a + parseFloat(x.calcSubtotal||0) - parseFloat(x.calcDiscount||0) - parseFloat(x.calcAvgCost||0), 0);
const lineRevenue = l => parseFloat(l.calcSubtotal||0) - parseFloat(l.calcLineDiscount||0) - parseFloat(l.calcTransactionDiscount||0);

// Credit each line to whoever put it in the cart, not whoever closed the sale.
// Negative lines (returns) are kept so a refund reduces that person's total, and
// zero-value lines still count toward Qty — both match how Lightspeed's Line Employee
// report totals up, which is what these numbers get reconciled against.
function aggregateEmployees(allLines, empNames) {
  const empMap = {};
  allLines.forEach(line => {
    const rawID = line.employeeID;
    if (!rawID || rawID === '0') return;
    const eid = REASSIGN_EMPLOYEE[rawID] || rawID;
    if (SKIP_EMPLOYEE_IDS.includes(eid)) return;
    if (!empMap[eid]) empMap[eid] = { employeeID: eid, name: empNames[eid] || `Emp ${eid}`, sales: 0, qty: 0, revenue: 0 };
    empMap[eid].sales++;
    empMap[eid].qty += parseFloat(line.unitQuantity || 0);
    empMap[eid].revenue += lineRevenue(line);
  });
  return Object.values(empMap).sort((a,b) => b.revenue - a.revenue);
}

// Roll the per-shop attribution up to one company-wide list. Hours are the employee's
// total across every shop, so $/hr is month revenue over hours actually worked.
function buildCompanyLeaderboard(shopResults, hoursTotal) {
  const stats = {};
  shopResults.forEach(s => {
    s.lineEmployees.forEach(e => {
      if (!stats[e.employeeID]) stats[e.employeeID] = { employeeID: e.employeeID, name: e.name, revenue: 0, sales: 0, qty: 0, hours: 0, locations: [] };
      stats[e.employeeID].revenue += e.revenue;
      stats[e.employeeID].sales += e.sales;
      stats[e.employeeID].qty += e.qty || 0;
      if (!stats[e.employeeID].locations.includes(s.name)) stats[e.employeeID].locations.push(s.name);
    });
  });
  return Object.values(stats)
    .map(e => {
      const hours = hoursTotal[e.employeeID] || 0;
      return { ...e, hours, salesPerHour: hours >= 1 ? e.revenue / hours : 0, locationLabel: e.locations.join(' · ') };
    })
    .filter(e => e.revenue !== 0)
    .sort((a, b) => b.revenue - a.revenue);
}

async function githubCommitFile(filePath, content, message) {
  return new Promise((resolve, reject) => {
    const b64 = Buffer.from(content).toString('base64');
    const checkReq = https.request({
      hostname: 'api.github.com',
      path: `/repos/${CONFIG.githubRepo}/contents/${filePath}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${CONFIG.githubToken}`, 'User-Agent': 'bingham-dashboard', Accept: 'application/vnd.github.v3+json' }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const existing = JSON.parse(body);
        const sha = existing.sha || null;
        const putBody = JSON.stringify({ message, content: b64, ...(sha ? { sha } : {}) });
        const putReq = https.request({
          hostname: 'api.github.com',
          path: `/repos/${CONFIG.githubRepo}/contents/${filePath}`,
          method: 'PUT',
          headers: { Authorization: `Bearer ${CONFIG.githubToken}`, 'User-Agent': 'bingham-dashboard', Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(putBody) }
        }, res2 => {
          let b2 = '';
          res2.on('data', d => b2 += d);
          res2.on('end', () => resolve(JSON.parse(b2)));
        });
        putReq.on('error', reject);
        putReq.write(putBody);
        putReq.end();
      });
    });
    checkReq.on('error', reject);
    checkReq.end();
  });
}

async function saveSnapshot(monthKey, html) {
  try {
    const filePath = `snapshots/${monthKey}.html`;
    await githubCommitFile(filePath, html, `Snapshot: ${monthKey}`);
    snapshotIndex[monthKey] = true;
    fs.writeFileSync(SNAPSHOT_INDEX_FILE, JSON.stringify(snapshotIndex));
    console.log(`Snapshot saved: ${monthKey}`);
  } catch(e) { console.error('Snapshot save error:', e.message); }
}

async function getLastMonthData(shopID, lastMonthStart, lastMonthEnd, lastMonth) {
  const filtered = await fetchSalesInRange(shopID, lastMonthStart, lastMonthEnd);
  const rev = saleRev(filtered);
  const mar = saleMar(filtered);
  const baseRevGoal = MONTHLY_REV_GOALS[shopID][lastMonth-1];
  const baseMarGoal = Math.round(baseRevGoal * MARGIN_PCT);
  const rolloverRev = Math.max(0, baseRevGoal - rev);
  const rolloverMar = Math.max(0, baseMarGoal - mar);
  return { rev, mar, baseRevGoal, baseMarGoal, rolloverRev, rolloverMar };
}

async function fetchRangeData(startDate, endDate) {
  console.log(`[${new Date().toLocaleTimeString()}] Fetching range data ${startDate} to ${endDate}...`);
  await getToken();

  const empNames = await fetchEmployeeNames();

  const { total: hoursTotal } = await fetchHours(startDate, endDate);

  const startMonth = parseInt(startDate.split('-')[1]);
  const shopResults = await Promise.all(SHOPS.map(async shop => {
    const goals = getGoals(shop.shopID, startMonth, 0, 0);
    const filtered = await fetchSalesInRange(shop.shopID, startDate, endDate);
    const rev = saleRev(filtered), mar = saleMar(filtered);
    const allLines = await fetchSaleLines(filtered.map(s => s.saleID));
    const lineEmployees = aggregateEmployees(allLines, empNames);
    const lcr = await getLCR(allLines);
    return { name: shop.name, shopID: shop.shopID, goals, mtdRev: rev, ytdRev: rev, mtdMar: mar, ytdMar: mar, lcr, lineEmployees, daysLeft: 0 };
  }));

  return {
    shops: shopResults, companyLeaderboard: buildCompanyLeaderboard(shopResults, hoursTotal),
    rolloverByShop: {}, lastMonthResults: [], lastMonthLabel: '', lastMonthKey: '',
    fetchedAt: `${startDate} to ${endDate}`, daysLeft: 0, currentMonth: startMonth, isRange: true,
    rangeLabel: `${startDate} → ${endDate}`,
  };
}

async function fetchAllData() {
  console.log('[' + new Date().toLocaleTimeString() + '] Fetching dashboard data...');
  await getToken();

  // Everything below is anchored to the Mountain calendar, not the server's clock —
  // Railway runs UTC, which would otherwise roll the day over at 6pm Mountain.
  const today = mtnToday();
  const [year, currentMonth, dayOfMonth] = today.split('-').map(Number);
  const mtdStart = `${year}-${pad(currentMonth)}-01`;
  const ytdStart = `${year}-01-01`;
  const daysInMonth = new Date(year, currentMonth, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;

  const lastMonthDate = new Date(year, currentMonth - 2, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthStart = `${lastMonthYear}-${pad(lastMonth)}-01`;
  const lastMonthEnd = `${lastMonthYear}-${pad(lastMonth)}-${new Date(lastMonthYear, lastMonth, 0).getDate()}`;
  const lastMonthKey = `${MONTH_NAMES[lastMonth-1]}-${lastMonthYear}`;
  const lastMonthLabel = `${MONTH_LABELS[lastMonth-1]} ${lastMonthYear}`;

  const lastMonthResults = await Promise.all(SHOPS.map(shop => getLastMonthData(shop.shopID, lastMonthStart, lastMonthEnd, lastMonth)));
  const rolloverByShop = {};
  SHOPS.forEach((shop, i) => {
    rolloverByShop[shop.shopID] = { rolloverRev: lastMonthResults[i].rolloverRev, rolloverMar: lastMonthResults[i].rolloverMar, lastMonth: lastMonthResults[i] };
  });

  const { total: hoursTotal, byShop: hoursMap } = await fetchHours(mtdStart, today);

  const empNames = await fetchEmployeeNames();

  const shopResults = await Promise.all(SHOPS.map(shop => {
    const { rolloverRev, rolloverMar } = rolloverByShop[shop.shopID];
    return processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth, rolloverRev, rolloverMar);
  }));

  const companyLeaderboard = buildCompanyLeaderboard(shopResults, hoursTotal);

  cachedData = {
    shops: shopResults, companyLeaderboard, rolloverByShop, lastMonthResults, lastMonthLabel, lastMonthKey,
    fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true }),
    daysLeft, dayOfMonth, daysInMonth, today, currentMonth, isLive: true,
  };
  lastFetch = Date.now();

  if (!snapshotIndex[lastMonthKey]) {
    console.log(`Generating snapshot for ${lastMonthKey}...`);
    const snapData = await buildSnapshotData(lastMonthStart, lastMonthEnd, lastMonth, lastMonthYear, lastMonthLabel, lastMonthKey);
    const snapHtml = buildHTML(snapData);
    await saveSnapshot(lastMonthKey, snapHtml);
  }

  console.log('[' + new Date().toLocaleTimeString() + '] Done.');
  return cachedData;
}

async function buildSnapshotData(start, end, month, year, label, key) {
  const empNames = await fetchEmployeeNames();

  const { total: hoursTotal } = await fetchHours(start, end);

  const ytdStart = `${year}-01-01`;
  const shopResults = await Promise.all(SHOPS.map(async shop => {
    const goals = getGoals(shop.shopID, month, 0, 0);
    const [mtd, ytd] = await Promise.all([
      fetchSalesInRange(shop.shopID, start, end),
      fetchSalesInRange(shop.shopID, ytdStart, end),
    ]);
    const mtdRev = saleRev(mtd), ytdRev = saleRev(ytd), mtdMar = saleMar(mtd), ytdMar = saleMar(ytd);
    const allLines = await fetchSaleLines(mtd.map(s => s.saleID));
    const lineEmployees = aggregateEmployees(allLines, empNames);
    const itemDepts = await getItemDepts(allLines);
    const weeks = buildWeeks(shop.shopID, year, month, goals, mtd, allLines, itemDepts, end, true);
    return { name: shop.name, shopID: shop.shopID, goals, mtdRev, ytdRev, mtdMar, ytdMar, lcr: lcrFrom(allLines, itemDepts), lineEmployees, weeks, daysLeft: 0 };
  }));

  return {
    shops: shopResults, companyLeaderboard: buildCompanyLeaderboard(shopResults, hoursTotal),
    rolloverByShop: {}, lastMonthResults: [], lastMonthLabel: '', lastMonthKey: '',
    fetchedAt: `Final · ${label}`, daysLeft: 0, currentMonth: month, isSnapshot: true, snapshotLabel: label,
  };
}

// Actuals bucketed into the same Mon–Sun weeks the goals were split across.
// `asOf` is the last day with data; weeks beyond it render as upcoming. A finished
// month passes final=true so its last week reads as done rather than "now".
function buildWeeks(shopID, year, month, goals, sales, allLines, itemDepts, asOf, final = false) {
  const saleDate = {};
  sales.forEach(s => { saleDate[s.saleID] = mtnDate(s.completeTime || s.createTime); });
  return getWeekGoals(shopID, year, month, goals).map(w => {
    const inWeek = saleID => { const d = saleDate[saleID]; return d && d >= w.start && d <= w.end; };
    const weekSales = sales.filter(s => inWeek(s.saleID));
    return {
      ...w,
      rev: saleRev(weekSales), mar: saleMar(weekSales),
      lcr: lcrFrom(allLines.filter(l => inWeek(l.saleID)), itemDepts).total,
      status: final || asOf > w.end ? 'done' : asOf < w.start ? 'upcoming' : 'current',
    };
  });
}

async function processShop(shop, mtdStart, ytdStart, today, daysLeft, empNames, hoursMap, currentMonth, rolloverRev, rolloverMar) {
  const goals = getGoals(shop.shopID, currentMonth, rolloverRev, rolloverMar);
  const [mtd, ytd] = await Promise.all([
    fetchSalesInRange(shop.shopID, mtdStart, today),
    fetchSalesInRange(shop.shopID, ytdStart, today),
  ]);
  const mtdRev = saleRev(mtd), ytdRev = saleRev(ytd), mtdMar = saleMar(mtd), ytdMar = saleMar(ytd);

  const allLines = await fetchSaleLines(mtd.map(s => s.saleID));
  const lineEmployees = aggregateEmployees(allLines, empNames).map(e => {
    const shopHrs = hoursMap[e.employeeID]?.[shop.shopID] || 0;
    return { ...e, hours: shopHrs, salesPerHour: shopHrs >= 1 ? e.revenue / shopHrs : 0 };
  });

  const itemDepts = await getItemDepts(allLines);
  const weeks = buildWeeks(shop.shopID, parseInt(mtdStart.slice(0, 4)), currentMonth, goals, mtd, allLines, itemDepts, today);

  return { name: shop.name, shopID: shop.shopID, goals, mtdRev, ytdRev, mtdMar, ytdMar, lcr: lcrFrom(allLines, itemDepts), lineEmployees, weeks, daysLeft };
}

async function getItemDepts(allLines) {
  const uniqueItemIDs = [...new Set(allLines.map(l => l.itemID).filter(Boolean))];
  const itemDeptMap = {};
  for (let i = 0; i < uniqueItemIDs.length; i += BATCH) {
    const batch = uniqueItemIDs.slice(i, i + BATCH).join(',');
    const items = await getPaginated(`/Item.json?itemID=IN,[${batch}]&limit=100`);
    items.forEach(item => { itemDeptMap[item.itemID] = item.departmentID; });
  }
  return itemDeptMap;
}

// Split out from getLCR so weekly buckets can reuse one item→department lookup.
function lcrFrom(lines, depts) {
  const sum = arr => arr.reduce((s,l) => s + parseFloat(l.calcSubtotal||0) - parseFloat(l.calcLineDiscount||0) - parseFloat(l.calcTransactionDiscount||0), 0);
  return {
    labor: sum(lines.filter(l => depts[l.itemID] === DEPT_LABOR)),
    components: sum(lines.filter(l => depts[l.itemID] === DEPT_COMPONENTS)),
    rubber: sum(lines.filter(l => depts[l.itemID] === DEPT_RUBBER)),
    total: sum(lines.filter(l => [DEPT_LABOR,DEPT_COMPONENTS,DEPT_RUBBER].includes(depts[l.itemID]))),
  };
}

async function getLCR(allLines) {
  if (!allLines || !allLines.length) return { labor: 0, components: 0, rubber: 0, total: 0 };
  return lcrFrom(allLines, await getItemDepts(allLines));
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
  return `<div style="background:#f8fafc;border-radius:8px;padding:10px 12px${hit ? ';border:1.5px solid #16a34a;background:#f0fdf4' : ''}">
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

function weeklyTable(weeks, title) {
  if (!weeks || !weeks.length) return '';
  const th = 'padding:6px 8px;font-size:10px;color:#94a3b8;font-weight:500';
  const cell = (val, goal, upcoming) => upcoming
    ? `<td style="padding:6px 8px;font-size:12px;color:#cbd5e1;text-align:right">—<span style="font-size:10px"> / ${fmt(goal)}</span></td>`
    : `<td style="padding:6px 8px;font-size:12px;font-weight:500;color:${goalColor(val,goal)};text-align:right">${fmt(val)}<span style="font-size:10px;color:#94a3b8;font-weight:400"> / ${fmt(goal)}</span></td>`;
  const rows = weeks.map(w => {
    const up = w.status === 'upcoming', cur = w.status === 'current';
    return `<tr style="border-top:0.5px solid #f1f5f9${cur ? ';background:#eff6ff' : ''}">
      <td style="padding:6px 8px;font-size:12px;color:${up ? '#cbd5e1' : '#0f172a'};white-space:nowrap">${cur ? `<strong>${w.label}</strong> <span style="font-size:10px;color:#2563eb">● now</span>` : w.label}</td>
      <td style="padding:6px 8px;font-size:11px;color:#94a3b8;white-space:nowrap">${w.dateLabel}</td>
      ${cell(w.rev, w.revGoal, up)}
      ${cell(w.mar, w.marGoal, up)}
      ${cell(w.lcr, w.lcrGoal, up)}
    </tr>`;
  }).join('');
  return `<div style="margin-top:14px">
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${title}</div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;min-width:420px">
      <thead><tr style="background:#f8fafc">
        <th style="${th};text-align:left">Week</th>
        <th style="${th};text-align:left">Dates</th>
        <th style="${th};text-align:right">Revenue</th>
        <th style="${th};text-align:right">Margin</th>
        <th style="${th};text-align:right">LCR</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
  </div>`;
}

// Week boundaries are calendar-driven, so index i covers the same span at every shop.
function combineWeeks(shops) {
  if (!shops.length || !shops[0].weeks) return null;
  const sum = (i, k) => shops.reduce((t, s) => t + (s.weeks?.[i]?.[k] || 0), 0);
  return shops[0].weeks.map((w, i) => ({
    label: w.label, dateLabel: w.dateLabel, status: w.status,
    rev: sum(i,'rev'), mar: sum(i,'mar'), lcr: sum(i,'lcr'),
    revGoal: sum(i,'revGoal'), marGoal: sum(i,'marGoal'), lcrGoal: sum(i,'lcrGoal'),
  }));
}

function buildHTML(data) {
  const { shops, companyLeaderboard, fetchedAt, daysLeft, lastMonthResults, lastMonthLabel, lastMonthKey, rolloverByShop, isSnapshot, snapshotLabel, isRange, rangeLabel } = data;
  const now = new Date();
  const currentMonthLabel = `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  const nextRefresh = lastFetch ? new Date(lastFetch + 15*60*1000).toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

  const archiveLinks = Object.keys(snapshotIndex).sort().reverse().map(key => {
    const parts = key.split('-');
    const label = `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1]}`;
    return `<a href="/snapshots/${key}" style="font-size:11px;color:#64748b;text-decoration:none;padding:3px 10px;border-radius:10px;background:#f1f5f9;border:0.5px solid #e2e8f0;white-space:nowrap">📅 ${label}</a>`;
  }).join('');

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
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${isSnapshot||isRange ? 'Period Revenue' : 'Company MTD Revenue'}</div>
        <div style="font-size:22px;font-weight:500;color:${goalColor(totalMtdRev,totalMtdRevGoal)}">${fmt(totalMtdRev)}</div>
        <div style="font-size:11px;color:#64748b">of ${fmt(totalMtdRevGoal)} goal · ${pct(totalMtdRev,totalMtdRevGoal)}%</div>
        ${bar(totalMtdRev,totalMtdRevGoal)}
      </div>
      <div style="background:${goalBg(totalMtdMar,totalMtdMarGoal)};border:0.5px solid ${goalBorder(totalMtdMar,totalMtdMarGoal)};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">${isSnapshot||isRange ? 'Period Margin' : 'Company MTD Margin'}</div>
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

  const lastMonthChips = !isSnapshot && !isRange && lastMonthResults && lastMonthResults.length ? SHOPS.map((shop, i) => {
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
      ${lm.rolloverRev > 0 ? `<div style="font-size:10px;color:#dc2626;margin-top:4px">↪ ${fmt(lm.rolloverRev)} rolled to ${currentMonthLabel.split(' ')[0]}</div>` : '<div style="font-size:10px;color:#16a34a;margin-top:4px">✓ Goal met — no rollover</div>'}
    </div>`;
  }).join('') : '';

  const shopCards = shops.map(s => {
    const revHit = hitGoal(s.mtdRev, s.goals.mtdRevGoal);
    const marHit = hitGoal(s.mtdMar, s.goals.mtdMarGoal);
    const anyHit = revHit || marHit;
    const gapRev = Math.max(0, s.goals.mtdRevGoal - s.mtdRev);
    const gapMar = Math.max(0, s.goals.mtdMarGoal - s.mtdMar);
    const gapLcr = Math.max(0, s.goals.mtdLcrGoal - s.lcr.total);
    const dl = daysLeft || 1;
    const dailyRev = gapRev / dl, dailyMar = gapMar / dl, dailyLcr = gapLcr / dl;
    const rollover = rolloverByShop?.[s.shopID];

    return `
    <div style="background:#fff;border:${anyHit ? '2px solid #16a34a' : '0.5px solid #e2e8f0'};border-radius:14px;padding:20px 24px;margin-bottom:16px${anyHit ? ';background:linear-gradient(135deg,#f0fdf4 0%,#fff 60%)' : ''}">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <div style="font-size:17px;font-weight:500;color:#0f172a">${anyHit ? '🏆 ' : ''}${s.name}</div>
        ${revHit && marHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Revenue & Margin Goals Hit! 🎯</div>' : revHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Revenue Goal Hit! 🎯</div>' : marHit ? '<div style="font-size:11px;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:12px">Margin Goal Hit! 🎯</div>' : ''}
        ${rollover && rollover.rolloverRev > 0 ? `<div style="font-size:10px;color:#dc2626;background:#fef2f2;padding:2px 8px;border-radius:10px">↪ ${fmt(rollover.rolloverRev)} rollover included</div>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
        ${metricBadge(s.mtdRev, s.goals.mtdRevGoal, isSnapshot||isRange ? 'Period Revenue' : 'Revenue MTD')}
        ${metricBadge(s.mtdMar, s.goals.mtdMarGoal, isSnapshot||isRange ? 'Period Margin' : 'Margin MTD')}
        ${metricBadge(s.lcr.total, s.goals.mtdLcrGoal, 'LCR MTD')}
      </div>
      ${weeklyTable(s.weeks, 'By Week')}
      ${!isSnapshot && !isRange ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">
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
      </div>` : ''}
    </div>`;
  }).join('');

  const leaderboardRows = companyLeaderboard.map((e, i) => `
    <tr style="border-top:0.5px solid #f1f5f9${i < 3 ? ';background:#fafbff' : ''}">
      <td style="padding:8px 10px;font-size:13px;color:#0f172a">${medal(i)} ${i+1}. ${e.name}</td>
      <td style="padding:8px 10px;font-size:11px;color:#94a3b8">${e.locationLabel}</td>
      <td style="padding:8px 10px;font-size:13px;font-weight:500;color:${e.revenue < 0 ? '#dc2626' : '#0f172a'};text-align:right">${fmt(e.revenue)}</td>
      <td style="padding:8px 10px;font-size:12px;color:#64748b;text-align:center">${Math.round(e.qty || 0)}</td>
      <td style="padding:8px 10px;font-size:12px;color:#64748b;text-align:center">${e.sales}</td>
      <td style="padding:8px 10px;font-size:12px;color:#64748b;text-align:center">${fmtHrs(e.hours)}</td>
      <td style="padding:8px 10px;font-size:13px;color:#185FA5;text-align:right;font-weight:500">${e.hours >= 1 ? fmt(e.salesPerHour)+'/hr' : '—'}</td>
    </tr>`).join('');

  const today = data.today || new Date().toISOString().slice(0,10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${!isSnapshot && !isRange ? '<meta http-equiv="refresh" content="900">' : ''}
<title>Bingham Cyclery — ${isSnapshot ? snapshotLabel : isRange ? rangeLabel : 'Live Dashboard'}</title>
${ICON_TAGS}
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;padding:20px}</style>
</head>
<body>
<div style="max-width:960px;margin:0 auto">
  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:12px;padding:12px 20px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="font-size:17px;font-weight:500;color:#0f172a">Bingham Cyclery</div>
        <a href="/" style="font-size:11px;color:#fff;text-decoration:none;padding:3px 10px;border-radius:10px;background:#0f172a;white-space:nowrap">🔴 Live — ${currentMonthLabel}</a>
        ${archiveLinks}
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#94a3b8">${isSnapshot ? `📸 ${snapshotLabel}` : isRange ? `📊 ${rangeLabel}` : `Updated ${fetchedAt} · Next ~${nextRefresh}`}</div>
        ${!isSnapshot && !isRange ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in month</div>` : ''}
      </div>
    </div>
    <form method="GET" action="/range" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:0.5px solid #f1f5f9">
      <span style="font-size:11px;color:#94a3b8;white-space:nowrap">📊 Custom range:</span>
      <input type="date" name="from" value="${today}" style="padding:4px 8px;border:0.5px solid #e2e8f0;border-radius:6px;font-size:12px;color:#0f172a">
      <span style="font-size:11px;color:#94a3b8">to</span>
      <input type="date" name="to" value="${today}" style="padding:4px 8px;border:0.5px solid #e2e8f0;border-radius:6px;font-size:12px;color:#0f172a">
      <button type="submit" style="padding:4px 14px;background:#0f172a;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">View →</button>
      ${isRange ? `<a href="/" style="font-size:11px;color:#64748b;text-decoration:none">← Back to live</a>` : ''}
    </form>
  </div>
  ${isRange ? `<div style="background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:13px;color:#1d4ed8">📊 Viewing custom range: <strong>${rangeLabel}</strong> — this is not live data</div>` : ''}
  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:16px 20px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">${isSnapshot ? snapshotLabel + ' Final' : isRange ? 'Period Totals' : 'Company Totals'}</div>
    ${companyTotals}
    ${weeklyTable(combineWeeks(shops), 'Company By Week')}
    <div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 12px">By Location — YTD</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${locationChips}</div>
    ${!isSnapshot && !isRange && lastMonthChips ? `<div style="font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 12px">${lastMonthLabel} Final</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${lastMonthChips}</div>` : ''}
  </div>
  ${shopCards}
  <div style="background:#fff;border:0.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:16px">
    <div style="font-size:15px;font-weight:500;color:#0f172a;margin-bottom:14px">Company Leaderboard — ${isSnapshot ? snapshotLabel : isRange ? rangeLabel : 'MTD'}</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f8fafc">
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:left">Employee</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:left">Location</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:right">Revenue</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center" title="Units sold — matches the Qty column in Lightspeed's Line Employee report">Qty</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Lines</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:center">Hours</th>
        <th style="padding:7px 10px;font-size:11px;color:#94a3b8;font-weight:500;text-align:right">$/hr</th>
      </tr></thead>
      <tbody>${leaderboardRows || '<tr><td colspan="7" style="padding:12px;color:#94a3b8;font-size:13px">No data yet this month</td></tr>'}</tbody>
    </table>
  </div>
</div>
</body>
</html>`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const params = {};
      body.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
      resolve(params);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost`);
  const url = urlObj.pathname;

  // Login POST
  if (url === '/login' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.password === CONFIG.password) {
      const sid = generateSession();
      res.writeHead(302, { 'Set-Cookie': `session=${sid}; Path=/; HttpOnly`, 'Location': '/' });
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(LOGIN_PAGE.replace('{{ERROR}}', '<div class="error">Incorrect code — try again</div>'));
    }
    return;
  }

  // Auth check (skip for snapshots served statically)
  if (!isAuthenticated(req)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(LOGIN_PAGE.replace('{{ERROR}}', ''));
    return;
  }

  // Serve snapshot files — fetch from GitHub to survive redeploys
  if (url.startsWith('/snapshots/')) {
    const key = url.replace('/snapshots/', '');
    // Try local first
    const file = path.join(SNAPSHOT_DIR, `${key}.html`);
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(file, 'utf8'));
      return;
    }
    // Fall back to GitHub
    const ghPath = `/repos/${CONFIG.githubRepo}/contents/snapshots/${key}.html`;
    const ghReq = https.request({
      hostname: 'api.github.com',
      path: ghPath,
      method: 'GET',
      headers: { Authorization: `Bearer ${CONFIG.githubToken}`, 'User-Agent': 'bingham-dashboard', Accept: 'application/vnd.github.v3+json' }
    }, ghRes => {
      let body = '';
      ghRes.on('data', d => body += d);
      ghRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.content) {
            const html = Buffer.from(parsed.content, 'base64').toString('utf8');
            // Cache locally
            try { fs.writeFileSync(file, html); } catch(e) {}
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
          } else {
            res.writeHead(404);
            res.end(`<p style="padding:20px;font-family:sans-serif">Snapshot not found: ${key}</p>`);
          }
        } catch(e) {
          res.writeHead(404);
          res.end(`<p style="padding:20px;font-family:sans-serif">Snapshot not found: ${key}</p>`);
        }
      });
    });
    ghReq.on('error', () => { res.writeHead(500); res.end('Error fetching snapshot'); });
    ghReq.end();
    return;
  }

  // Custom date range
  if (url === '/range') {
    const from = urlObj.searchParams.get('from');
    const to = urlObj.searchParams.get('to');
    if (!from || !to) { res.writeHead(302, { Location: '/' }); res.end(); return; }
    try {
      const rangeData = await fetchRangeData(from, to);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildHTML(rangeData));
    } catch(err) {
      res.writeHead(500);
      res.end(`<pre style="padding:20px">Error: ${err.message}</pre>`);
    }
    return;
  }

  if (url !== '/' && url !== '/dashboard') { res.writeHead(404); res.end('Not found'); return; }

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
