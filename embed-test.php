<?php
/**
 * embed-test.php — local harness to test the Appsmith report pages in an iframe.
 *
 * The Customer page runs in "embed mode": it reads ?customer=<code> from its URL and
 * authenticates against that tenant's UBM credentials (see UBMUtils.js). This page lets
 * you pick a customer and renders the deployed Appsmith page in an <iframe> with the right
 * ?customer= appended, so you can eyeball each tenant without editing the app.
 *
 * Run it with PHP's built-in server from the repo root:
 *     php -S localhost:8000
 * then open http://localhost:8000/embed-test.php
 *
 * NOTE: For the iframe to load, the Appsmith app must allow embedding for this origin.
 * In Appsmith: Settings → Embed settings → set "Allowed origins" / enable embedding
 * (and the page must be published / shared appropriately).
 */

// ---- Config: customers must mirror UBMUtils.customerOptions on the Customer page ----
$CUSTOMERS = [
    'ppg_p'             => 'PPG Industries, Inc.',
    'simonproperties_p' => 'Simon Properties',
    'altafiber_p'       => 'Altafiber',
    'hexpol_p'          => 'Hexpol',
    'ascension_p'       => 'Ascension',
];

// The pages in this app. customer-db does not use the ?customer= API param, but you can
// still preview it. Base URL is whatever the deployed page's share/embed URL is.
$PAGES = [
    'Customer'    => 'Customer report (API / embed mode — uses ?customer=)',
    'customer-db' => 'Customer DB report (no API auth)',
];

// ---- Read inputs (GET so URLs are shareable/bookmarkable) ----
$baseUrl  = trim($_GET['base'] ?? '');
$page     = $_GET['page'] ?? 'Customer';
$customer = $_GET['customer'] ?? array_key_first($CUSTOMERS);
$customCustomer = trim($_GET['custom'] ?? '');
if ($customCustomer !== '') {
    $customer = $customCustomer;
}
if (!array_key_exists($page, $PAGES)) {
    $page = 'Customer';
}

// ---- Build the iframe src ----
$iframeSrc = '';
$buildError = '';
if ($baseUrl !== '') {
    if (!preg_match('~^https?://~i', $baseUrl)) {
        $buildError = 'Base URL must start with http:// or https://';
    } else {
        // Append ?customer= (or &customer= if the base already has a query string).
        $sep = (strpos($baseUrl, '?') === false) ? '?' : '&';
        $iframeSrc = $baseUrl;
        // Only the Customer page consumes ?customer=, but appending it elsewhere is harmless.
        if ($customer !== '') {
            $iframeSrc .= $sep . 'customer=' . rawurlencode($customer);
        }
    }
}

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Appsmith report — embed test</title>
<style>
  :root { --navy:#0F2A47; --blue:#1E5FCC; --line:#e5e7eb; --bg:#F5F6F8; --muted:#6B7280; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:var(--navy); background:#fff; }
  header { background:var(--navy); color:#fff; padding:14px 20px; }
  header h1 { margin:0; font-size:18px; font-weight:600; }
  header p { margin:4px 0 0; font-size:13px; opacity:.8; }
  form { background:var(--bg); border-bottom:1px solid var(--line); padding:16px 20px;
         display:grid; gap:12px; grid-template-columns:1fr 220px 220px auto; align-items:end; }
  label { display:block; font-size:12px; font-weight:600; color:var(--navy); margin-bottom:4px; }
  input[type=text], select { width:100%; padding:8px 10px; border:1px solid var(--line);
         border-radius:6px; font-size:14px; color:var(--navy); background:#fff; }
  .hint { font-size:11px; color:var(--muted); margin-top:4px; font-weight:400; }
  button { background:var(--blue); color:#fff; border:none; border-radius:6px;
         padding:9px 18px; font-size:14px; font-weight:600; cursor:pointer; height:38px; }
  button:hover { filter:brightness(1.05); }
  .full { grid-column:1 / -1; }
  .urlbar { padding:10px 20px; background:#fff; border-bottom:1px solid var(--line);
         font-size:12px; color:var(--muted); word-break:break-all; }
  .urlbar a { color:var(--blue); }
  .err { color:#b91c1c; font-weight:600; }
  .frame-wrap { padding:0; height:calc(100vh - 230px); min-height:420px; }
  iframe { width:100%; height:100%; border:0; }
  .empty { display:flex; align-items:center; justify-content:center; height:100%;
         color:var(--muted); font-size:14px; text-align:center; padding:40px; }
  @media (max-width:880px){ form{ grid-template-columns:1fr; } }
</style>
</head>
<body>
<header>
  <h1>Appsmith report — embed test harness</h1>
  <p>Renders a deployed report page in an iframe with <code>?customer=&lt;code&gt;</code> for embed-mode testing.</p>
</header>

<form method="get" action="">
  <div class="full">
    <label for="base">Deployed page URL (share / embed link from Appsmith)</label>
    <input type="text" id="base" name="base" value="<?= h($baseUrl) ?>"
           placeholder="https://your-appsmith-host/app/&lt;app-slug&gt;/customer-&lt;pageId&gt;">
    <div class="hint">Paste the published page URL (Appsmith → Share/Embed). The <code>?customer=</code> param is added automatically.</div>
  </div>

  <div>
    <label for="page">Page</label>
    <select id="page" name="page">
      <?php foreach ($PAGES as $key => $desc): ?>
        <option value="<?= h($key) ?>" <?= $page === $key ? 'selected' : '' ?>><?= h($key) ?></option>
      <?php endforeach; ?>
    </select>
    <div class="hint"><?= h($PAGES[$page]) ?></div>
  </div>

  <div>
    <label for="customer">Customer</label>
    <select id="customer" name="customer">
      <?php foreach ($CUSTOMERS as $code => $label): ?>
        <option value="<?= h($code) ?>" <?= ($customCustomer === '' && $customer === $code) ? 'selected' : '' ?>>
          <?= h($label) ?> (<?= h($code) ?>)
        </option>
      <?php endforeach; ?>
    </select>
    <div class="hint">Sent as <code>?customer=</code>.</div>
  </div>

  <div>
    <label>&nbsp;</label>
    <button type="submit">Load</button>
  </div>

  <div class="full">
    <label for="custom">…or custom customer code (overrides dropdown)</label>
    <input type="text" id="custom" name="custom" value="<?= h($customCustomer) ?>"
           placeholder="e.g. newtenant_p — test unknown/fail-closed codes here">
  </div>
</form>

<div class="urlbar">
  <?php if ($buildError): ?>
    <span class="err"><?= h($buildError) ?></span>
  <?php elseif ($iframeSrc): ?>
    iframe src → <a href="<?= h($iframeSrc) ?>" target="_blank" rel="noopener"><?= h($iframeSrc) ?></a>
  <?php else: ?>
    Enter the deployed page URL above to load the report.
  <?php endif; ?>
</div>

<div class="frame-wrap">
  <?php if ($iframeSrc && !$buildError): ?>
    <iframe src="<?= h($iframeSrc) ?>" title="Appsmith report"
            allow="clipboard-read; clipboard-write"></iframe>
  <?php else: ?>
    <div class="empty">
      No page loaded yet.<br>
      Paste the deployed Appsmith page URL, pick a customer, and click <strong>Load</strong>.
    </div>
  <?php endif; ?>
</div>
</body>
</html>
