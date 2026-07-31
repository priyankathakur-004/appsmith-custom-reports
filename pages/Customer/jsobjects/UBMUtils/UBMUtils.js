export default {
	// ----- Static config -----
	// Known customers and their display labels. Each customer is its own UBM tenant
	// with its own API credentials. To onboard a new customer:
	//   1) add a { label, value } entry here, and
	//   2) add a matching `credentials` entry below keyed by the same `value`.
	// The `value` MUST equal the ?customer= code the embedding app passes in the URL.
	customerOptions: [
		{ label: "PPG Industries, Inc.", value: "ppg_p" },
		{ label: "Simon Properties", value: "simonproperties_p" },
		{ label: "Altafiber", value: "altafiber_p" },
		{ label: "Hexpol", value: "hexpol_p" },
		{ label: "Ascension", value: "ascension_p" }
	],

	// Per-tenant API credentials, keyed by the customer's fdg_code (the same value the
	// embedding app passes as ?customer=). A customer is only usable if it has an entry
	// here. Unknown customers fail closed (no data) instead of silently falling back to
	// another tenant's data.
	credentials: {
		ppg_p: {
			clientId: "w2S6GCYIMrZsN5xqB2PjABSg2VAerClxJCaiDqGdNuZfL0el",
			clientSecret: "EfegzY4GvbtYva5vSvmwF9dQB799aybszKY0mGdzUonS0HA4AyGR1eBkuUhNilB3"
		},
		simonproperties_p: {
			clientId: "lgF8ieHbjCfmSNVsmVGayuFbS0MjLgEUCKuJuZveLCCpo26r",
			clientSecret: "iPXcycXVprcSlAmYQ7yrDOSU3XE4GwdPAPlO3KKWUiUJbnWmrnOKRXIEM1yM5rw2"
		},
		altafiber_p: {
			clientId: "47W7Zv2CSw3e5e7Ys8HxBWGmrGHAD6H5tYj11zLaC9lAb3IP",
			clientSecret: "VynZ1UFl1Db6DJGwQNpGZOA8ejlomQTt3aYlfFQwKroGD0dvAJFS49DZ1Wqqtguz"
		},
		hexpol_p: {
			clientId: "QkcYJ1BFQQWuQz7iKpzMl2JepDAAnajiYznquYrWGoXGObKE",
			clientSecret: "TmUAmHpBzQtnzBmXjvpkFwDt1FNshGzvJwFGsoP5oKGht50xxCnJRdVNGM5M6GQR"
		},
		ascension_p: {
			clientId: "jIYL00Ty9AHllHL1iIrrHwPkCkbbdD0SuwHAINNafm0HNzGu",
			clientSecret: "dmGuTdGw1sUevyUjjH2Bve79lNkGm6t2HGwCAozrpGhqJHxEpwWOyYda6d0muPuy"
		}
		// To onboard a new tenant, add an entry keyed by its fdg_code, e.g.:
		//   basfcorporation: { clientId: "...", clientSecret: "..." }
	},

	endpoints: {
		accounts: {
			label: "Accounts",
			query: "getAccounts",
			fields: [
				"id", "billingId", "serviceAccountId", "meterId", "utilityType",
				"billType", "status", "vendor", "vendorId",
				"location", "locationAddress", "locationZip",
				"serviceAddress", "serviceZip",
				"virtualAccountId", "virtualAccountGroup",
				"dateOfLastBill", "vendorContact", "meterCombo", "importDate"
			],
			requiresDates: false,
			paginated: true
		},
		vendors: {
			label: "Vendors",
			query: "getVendors",
			fields: [
				"pearVendorId", "pearVendorCode", "vendorCode", "vendorName",
				"customPrettyName", "globalPrettyName", "remittanceName", "remittanceAddress",
				"mainPhone", "customerServicePhone", "priorityPhone", "emergencyPhone",
				"webAddress", "providerId", "importDate", "ERP Vendor ID", "Vendor Name AP"
			],
			requiresDates: false,
			paginated: true
		},
		bills: {
			label: "Bills (date range required)",
			query: "getBills",
			fields: [
				"billId", "billingId", "vendor", "vendorCode", "providerId",
				"invoiceDate", "dateDue", "billReceivedDate",
				"serviceStartDate", "serviceEndDate", "daysOfService",
				"adjServiceEndDate", "adjDaysOfService",
				"billType", "ratePlan", "estimated",
				"currentCharges", "priorBalance", "lateFees", "totalPayAmount",
				"consumptionUom", "totalConsumption", "generationConsumption",
				"demandKw", "billedDemand",
				"subcharges", "usageSubcharges", "consumptionSubcharges",
				"demandSubcharges", "billedUsageSubcharges", "taxesSubcharges",
				"customerSubcharges", "commoditySubcharges", "generationCharges",
				"otherSubcharges",
				"totalHdd", "totalCdd", "totalDegreeDays",
				"virtualAccountId", "virtualAccountGroup",
				"virtacctServiceAccountId", "virtacctMeterId", "virtacctUtilityType",
				"virtacctLocationAddress", "virtacctLocationZip",
				"paymentFileCreated", "markedForPayment", "createdAt"
			],
			requiresDates: true,
			paginated: false
		},
		monthlyFeed: {
			label: "Monthly Feed (date range required)",
			query: "getMonthlyFeed",
			fields: [
				"calendarMonth", "location", "number", "locationAddress", "locationZip",
				"vendor", "billingId",
				"virtualAccountId", "virtualAccountGroup",
				"virtacctServiceAccountId", "virtacctMeterId", "virtacctUtilityType",
				"billType", "consumptionUom", "totalConsumption", "maximumDemandKw",
				"charges", "usageCharges", "consumptionCharges", "demandCharges",
				"billedUsageSubcharges", "taxesCharges", "customerCharges",
				"generationCharges", "otherCharges",
				"totalHdd", "totalCdd", "totalDegreeDays",
				"importDate"
			],
			requiresDates: true,
			paginated: false
		},
		billErrors: {
			label: "Bill Errors",
			query: "getBillErrors",
			fields: ["billErrorId", "billingId", "ubmId", "invoiceDate", "importDate"],
			requiresDates: false,
			paginated: true
		}
	},

	joinGraph: {
		bills: {
			vendors: { from: "providerId", to: "providerId" },
			accounts: { from: "virtualAccountId", to: "virtualAccountId" },
			billErrors: { from: "billId", to: "pearId" }
		},
		monthlyFeed: {
			accounts: { from: "virtualAccountId", to: "virtualAccountId" }
		},
		accounts: {
			vendors: { from: "vendorId", to: "providerId" },
			billErrors: { from: "billingId", to: "billingId" }
		}
	},

	// ----- Page-load entrypoint -----
	// Runs on page load (runBehaviour AUTOMATIC). The data queries are MANUAL, so they
	// only ever execute through run() below — never on their own with a stale token.
	// Embedded: re-authenticates for the URL's customer and loads the default endpoint.
	// Standalone with nothing selected: clears any leftover token and loads nothing.
	init: async () => {
		try {
			if (!UBMUtils.activeCustomer()) {
				// No valid customer — wipe any persisted token so a previous session's
				// data can't leak, and leave the grid empty until one is chosen.
				await UBMUtils.clearSession();
				if (UBMUtils.activeCustomerRaw()) {
					// Embedder passed a ?customer= we don't recognize / have no access for.
					showAlert(UBMUtils.UNAVAILABLE_MSG, "warning");
				}
				return;
			}
			// run() authenticates, fetches, and shows the friendly message on any failure.
			await UBMUtils.run();
		} catch (e) {
			console.error("Custom Reports init failed:", e);
			showAlert(UBMUtils.UNAVAILABLE_MSG, "error");
		}
	},

	clearSession: async () => {
		await removeValue("ubm_customer");
		await removeValue("ubm_token");
		await removeValue("ubm_token_expires_at");
	},

	// ----- Customer resolution -----
	// Priority: ?customer= URL param (embedded use) → CustomerSelect dropdown (standalone use).
	// A customer is recognized only if it has a `credentials` entry. Anything else returns
	// null (fail closed) — we never silently serve another tenant's data.
	activeCustomer: () => {
		// 1) URL param wins (embed mode — ?customer=ppg, ?customer=simon, …)
		const raw = (appsmith.URL && appsmith.URL.queryParams && appsmith.URL.queryParams.customer) || "";
		const fromUrl = String(raw).toLowerCase().trim();
		if (fromUrl && UBMUtils.credentials[fromUrl]) return fromUrl;
		// 2) Dropdown fallback (only when standalone — no/unknown URL param)
		if (typeof CustomerSelect !== "undefined" && CustomerSelect.selectedOptionValue) {
			const fromDropdown = String(CustomerSelect.selectedOptionValue).toLowerCase().trim();
			if (UBMUtils.credentials[fromDropdown]) return fromDropdown;
		}
		return null;
	},

	activeCustomerLabel: () => {
		const code = UBMUtils.activeCustomer();
		if (!code) return "Unknown";
		const opt = UBMUtils.customerOptions.find(o => o.value === code);
		return opt ? opt.label : code;
	},

	activeCustomerRaw: () => {
		const raw = (appsmith.URL && appsmith.URL.queryParams && appsmith.URL.queryParams.customer);
		return raw ? String(raw) : null;
	},

	bannerText: () => {
		const code = UBMUtils.activeCustomer();
		const raw = UBMUtils.activeCustomerRaw();
		if (!code) {
			return raw
				? `Unknown customer "${raw}" — no data available. This tenant is not configured.`
				: "No customer selected — no data available.";
		}
		return `Viewing as ${UBMUtils.activeCustomerLabel()}`;
	},

	// ----- Endpoints / fields -----
	endpointOptions: () => {
		const eps = UBMUtils.endpoints;
		return Object.keys(eps).map(k => ({ label: eps[k].label, value: k }));
	},

	selectedKeys: () => {
		const v = (typeof EndpointSelect !== "undefined") ? EndpointSelect.selectedOptionValues : null;
		if (Array.isArray(v) && v.length > 0) return v;
		return ["accounts"];
	},

	selectedSpecs: () => {
		return UBMUtils.selectedKeys()
			.map(k => UBMUtils.endpoints[k])
			.filter(Boolean);
	},

	currentSpec: () => {
		return UBMUtils.selectedSpecs()[0] || UBMUtils.endpoints.accounts;
	},

	requiresDates: () => {
		return UBMUtils.selectedSpecs().some(s => s.requiresDates);
	},

	isPaginated: () => {
		return UBMUtils.selectedSpecs().some(s => s.paginated);
	},

	fieldOptions: () => {
		const keys = UBMUtils.selectedKeys();
		if (keys.length === 1) {
			const fields = (UBMUtils.endpoints[keys[0]] && UBMUtils.endpoints[keys[0]].fields) || [];
			return fields.map(f => ({ label: f, value: f }));
		}
		const opts = [];
		for (const k of keys) {
			const ep = UBMUtils.endpoints[k];
			if (!ep) continue;
			for (const f of (ep.fields || [])) {
				opts.push({ label: ep.label + " · " + f, value: k + "__" + f });
			}
		}
		return opts;
	},

	statusText: () => {
		const r = UBMUtils.rows() || [];
		if (r.length === 0) return "No data loaded — click Run to fetch.";
		const picked = (FieldsSelect.selectedOptionValues && FieldsSelect.selectedOptionValues.length > 0)
			? FieldsSelect.selectedOptionValues.length + " columns selected"
			: "all returned columns shown";
		return r.length.toLocaleString() + " rows loaded · " + picked;
	},

	// ----- Row extraction & join -----
	endpointRawRows: (key) => {
		const ep = UBMUtils.endpoints[key];
		if (!ep) return [];
		const map = {
			getAccounts: getAccounts.data,
			getVendors: getVendors.data,
			getBills: getBills.data,
			getMonthlyFeed: getMonthlyFeed.data,
			getBillErrors: getBillErrors.data
		};
		const raw = map[ep.query];
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (Array.isArray(raw.data)) return raw.data;
		return [];
	},

	findJoin: (a, b) => {
		const direct = UBMUtils.joinGraph[a] && UBMUtils.joinGraph[a][b];
		if (direct) return direct;
		const reverse = UBMUtils.joinGraph[b] && UBMUtils.joinGraph[b][a];
		if (reverse) return { from: reverse.to, to: reverse.from };
		return null;
	},

	rows: () => {
		const keys = UBMUtils.selectedKeys();
		if (keys.length === 0) return [];
		const primary = keys[0];
		const primaryRows = UBMUtils.endpointRawRows(primary);
		if (keys.length === 1) return primaryRows;

		const lookups = keys.slice(1);
		const lookupMaps = {};
		for (const lk of lookups) {
			const join = UBMUtils.findJoin(primary, lk);
			if (!join) continue;
			const lkRows = UBMUtils.endpointRawRows(lk);
			const m = new Map();
			for (const r of lkRows) {
				const k = r[join.to];
				if (k === undefined || k === null) continue;
				const ks = String(k).toLowerCase();
				if (!m.has(ks)) m.set(ks, r);
			}
			lookupMaps[lk] = { join, map: m };
		}

		const joined = primaryRows.map(p => {
			const out = {};
			for (const k in p) out[primary + "__" + k] = p[k];
			for (const lk of lookups) {
				const lm = lookupMaps[lk];
				if (!lm) continue;
				const v = p[lm.join.from];
				const ks = (v === undefined || v === null) ? "" : String(v).toLowerCase();
				const matched = lm.map.get(ks);
				if (matched) {
					for (const k in matched) out[lk + "__" + k] = matched[k];
				}
			}
			return out;
		});

		// Normalize: every row exposes the same key set, seeded from actual data,
		// each endpoint's catalog, and a sample raw row per lookup.
		const allKeys = new Set();
		for (const r of joined) for (const k in r) allKeys.add(k);
		for (const k of keys) {
			const ep = UBMUtils.endpoints[k];
			if (ep && ep.fields) for (const f of ep.fields) allKeys.add(k + "__" + f);
		}
		for (const lk of lookups) {
			const sample = UBMUtils.endpointRawRows(lk)[0];
			if (sample) for (const f in sample) allKeys.add(lk + "__" + f);
		}
		for (const r of joined) {
			for (const k of allKeys) if (!(k in r)) r[k] = null;
		}
		return joined;
	},

	// ----- Auth -----
	tokenIsFresh: () => {
		const t = appsmith.store.ubm_token;
		const exp = appsmith.store.ubm_token_expires_at;
		return Boolean(t && exp && Date.now() < exp - 30000);
	},

	loginFor: async (customer) => {
		const creds = UBMUtils.credentials[customer];
		if (!creds) {
			throw new Error(`No credentials configured for customer "${customer}"`);
		}
		// Pass this customer's credentials to the single `login` query as run params
		// ({{this.params.clientId}} / {{this.params.clientSecret}} in its body).
		const res = await login.run({ clientId: creds.clientId, clientSecret: creds.clientSecret });
		if (!res || !res.accessToken) {
			throw new Error("Login failed: no accessToken in response");
		}
		const expiresAt = Date.now() + ((res.expiresIn || 3600) * 1000);
		await storeValue("ubm_customer", customer);
		await storeValue("ubm_token", res.accessToken);
		await storeValue("ubm_token_expires_at", expiresAt);
		return res.accessToken;
	},

	ensureToken: async () => {
		const customer = UBMUtils.activeCustomer();
		if (!customer) {
			throw new Error("Unknown or unconfigured customer — cannot load data");
		}
		const cached = appsmith.store.ubm_customer;
		if (customer !== cached || !UBMUtils.tokenIsFresh()) {
			await UBMUtils.loginFor(customer);
		}
		return appsmith.store.ubm_token;
	},

	// ----- Run / export -----
	// Shown to the embedding app's end-user whenever we can't authenticate or fetch
	// for the chosen customer (bad/missing credentials, API down, etc.). The technical
	// cause is logged to the console for support.
	UNAVAILABLE_MSG: "This report isn't available for the selected customer. Please contact your administrator.",

	run: async () => {
		if (!UBMUtils.activeCustomer()) {
			showAlert("Please select a customer to run a report.", "warning");
			return;
		}
		const specs = UBMUtils.selectedSpecs();
		if (specs.length === 0) {
			showAlert("Pick at least one endpoint", "warning");
			return;
		}
		if (UBMUtils.requiresDates()) {
			if (!StartDate.selectedDate || !EndDate.selectedDate) {
				showAlert("Start and end dates are required for this endpoint", "warning");
				return;
			}
			const start = moment(StartDate.selectedDate);
			const end = moment(EndDate.selectedDate);
			if (end.isBefore(start)) {
				showAlert("End date must be on or after the start date", "error");
				return;
			}
			if (end.diff(start, "days") > 31) {
				showAlert("Date range can't exceed 31 days", "error");
				return;
			}
		}
		try {
			// Authenticate then fetch. A failure here (login rejected, API error) means
			// the report can't be shown for this customer — surface the friendly message.
			await UBMUtils.ensureToken();
			const queries = { getAccounts, getVendors, getBills, getMonthlyFeed, getBillErrors };
			const broken = UBMUtils.selectedKeys().slice(1).filter(k => !UBMUtils.findJoin(UBMUtils.selectedKeys()[0], k));
			if (broken.length > 0) {
				showAlert("No join path from " + UBMUtils.selectedKeys()[0] + " to: " + broken.join(", ") + " — those columns will be empty", "warning");
			}
			await Promise.all(specs.map(spec => queries[spec.query].run()));
		} catch (e) {
			console.error("Custom Reports run failed:", e);
			showAlert(UBMUtils.UNAVAILABLE_MSG, "error");
		}
	},

	exportCsv: () => {
		if (!UBMUtils.activeCustomer()) {
			showAlert("Select a customer before exporting", "warning");
			return;
		}
		const rows = UBMUtils.rows();
		const fields = (FieldsSelect.selectedOptionValues && FieldsSelect.selectedOptionValues.length > 0)
			? FieldsSelect.selectedOptionValues
			: (rows[0] ? Object.keys(rows[0]) : []);
		if (!rows.length) {
			showAlert("Nothing to export — run a query first", "warning");
			return;
		}
		const escape = (v) => {
			if (v === null || v === undefined) return "";
			if (typeof v === "object") v = JSON.stringify(v);
			const s = String(v);
			return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
		};
		const header = fields.join(",");
		const body = rows.map(r => fields.map(f => escape(r[f])).join(",")).join("\n");
		const csv = header + "\n" + body;

		const customer = UBMUtils.activeCustomerLabel().replace(/\s+/g, "_");
		const keys = UBMUtils.selectedKeys().join("+");
		const stamp = moment().format("YYYYMMDD-HHmmss");
		const filename = `${customer}-${keys}-${stamp}.csv`;

		download(csv, filename, "text/csv");
		showAlert(`Exported ${rows.length.toLocaleString()} rows to ${filename}`, "success");
	},

	// ----- Excel export -----
	// Ported from the Customer-Report page. The library-free .xls trick this replaced
	// (an HTML table under the Excel mime type) opens in Excel but renders as raw
	// markup in Numbers and Sheets, and SheetJS's XLSX.utils is unreachable through
	// Appsmith's sandbox — so this writes a real .xlsx by hand. An xlsx is a ZIP of
	// XML parts, and stored (uncompressed) entries need no deflate, so the writer is
	// just a CRC32, a ZIP directory and the sheet XML.

	// Identifier columns must stay text or Excel eats them: an account number loses
	// its leading zero, a long meter id loses precision past 15 digits. Joined rows
	// are keyed "<endpoint>__<field>", so the test runs on the trailing field name.
	isTextField: (name) => {
		const base = String(name).split("__").pop();
		return /(^id$|Id$|Code$|Zip$|Group$|^number$)/.test(base);
	},

	_utf8: (str) => {
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
		const out = [];
		for (let i = 0; i < str.length; i++) {
			let c = str.charCodeAt(i);
			if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
				const c2 = str.charCodeAt(i + 1);
				if (c2 >= 0xDC00 && c2 <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00); i++; }
			}
			if (c < 0x80) out.push(c);
			else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
			else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
			else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
		}
		return new Uint8Array(out);
	},

	_crc32: (bytes) => {
		const table = new Int32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
			table[n] = c;
		}
		let crc = -1;
		for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
		return (crc ^ -1) >>> 0;
	},

	// Minimal ZIP writer, stored (method 0) entries only.
	_zip: (files) => {
		const u16 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF]);
		const u32 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
		const DOS_DATE = 0x0021; // 1980-01-01; fixed so exports are byte-identical
		const parts = [];
		const central = [];
		let offset = 0;
		files.forEach(f => {
			const name = UBMUtils._utf8(f.name);
			const crc = UBMUtils._crc32(f.data);
			const size = f.data.length;
			[u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(DOS_DATE),
			 u32(crc), u32(size), u32(size), u16(name.length), u16(0), name, f.data
			].forEach(c => parts.push(c));
			central.push([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(DOS_DATE),
				u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0),
				u32(0), u32(offset), name]);
			offset += 30 + name.length + size;
		});
		let cdSize = 0;
		central.forEach(entry => entry.forEach(c => { parts.push(c); cdSize += c.length; }));
		[u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
		 u32(cdSize), u32(offset), u16(0)].forEach(c => parts.push(c));

		let total = 0;
		parts.forEach(p => { total += p.length; });
		const out = new Uint8Array(total);
		let at = 0;
		parts.forEach(p => { out.set(p, at); at += p.length; });
		return out;
	},

	_base64: (bytes) => {
		let bin = "";
		const CHUNK = 0x8000; // apply() blows the stack on much more than this
		for (let i = 0; i < bytes.length; i += CHUNK) {
			bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
		}
		return btoa(bin);
	},

	buildXlsx: (rows, fields) => {
		const esc = s => String(s)
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		const colName = (i) => {
			let s = "", n = i + 1;
			while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
			return s;
		};
		// Numeric-looking values become real numbers, minus the two shapes that lose
		// information: a leading zero, and a whole number past Excel's 15-digit
		// precision. Long decimals stay numeric — that's float noise off the feed.
		const isNumeric = (field, s) => {
			if (UBMUtils.isTextField(field)) return false;
			if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
			if (/^-?0\d/.test(s)) return false;
			return /\./.test(s) || s.replace(/-/g, "").length <= 15;
		};

		// Strings go through the shared-string table: this data repeats heavily, so
		// one entry per distinct value plus a bare index per cell is much smaller
		// than an inline <is><t> on every row.
		const strings = new Map();
		let strRefs = 0;
		const strIndex = (s) => {
			strRefs++;
			let i = strings.get(s);
			if (i === undefined) { i = strings.size; strings.set(s, i); }
			return i;
		};
		const widths = fields.map(() => 0);
		const cellXml = (v, field, ref, ci) => {
			if (v === null || v === undefined) return "";
			if (typeof v === "object") v = JSON.stringify(v);
			const s = String(v);
			if (s === "") return "";
			if (s.length > widths[ci]) widths[ci] = s.length;
			if (typeof v === "number" || isNumeric(field, s)) return `<c r="${ref}"><v>${esc(s)}</v></c>`;
			return `<c r="${ref}" t="s"><v>${strIndex(s)}</v></c>`;
		};

		const body = [];
		body.push("<row r=\"1\">" + fields.map((f, i) => {
			const label = String(f);
			if (label.length > widths[i]) widths[i] = label.length;
			return `<c r="${colName(i)}1" s="1" t="s"><v>${strIndex(label)}</v></c>`;
		}).join("") + "</row>");
		rows.forEach((r, ri) => {
			const n = ri + 2;
			body.push(`<row r="${n}">` + fields.map((f, i) => cellXml(r[f], f, colName(i) + n, i)).join("") + "</row>");
		});

		// Without explicit widths every column falls back to the default ~8 chars and
		// long values wrap over several lines.
		const cols = "<cols>" + widths.map((w, i) =>
			`<col min="${i + 1}" max="${i + 1}" width="${Math.min(45, Math.max(10, w + 2))}" customWidth="1"/>`
		).join("") + "</cols>";

		const sheet = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
			'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
			cols, "<sheetData>", body.join(""), "</sheetData></worksheet>"];

		const sst = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
			`<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strRefs}" uniqueCount="${strings.size}">`];
		strings.forEach((_i, s) => { sst.push(`<si><t xml:space="preserve">${esc(s)}</t></si>`); });
		sst.push("</sst>");

		const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

		// Without a stylesheet each app picks its own default font, and Numbers picks
		// a large one. Format 0 is the body, 1 the bold header referenced as s="1".
		// The empty fills/borders are required filler.
		const styles = XML +
			'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
			'<fonts count="2">' +
			'<font><sz val="10"/><name val="Calibri"/><family val="2"/></font>' +
			'<font><b/><sz val="10"/><name val="Calibri"/><family val="2"/></font>' +
			"</fonts>" +
			'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
			'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
			'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
			'<cellXfs count="2">' +
			'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
			'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
			"</cellXfs>" +
			'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
			"</styleSheet>";

		const files = [
			{ name: "[Content_Types].xml", data: XML +
				'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
				'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
				'<Default Extension="xml" ContentType="application/xml"/>' +
				'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
				'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
				'<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
				'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
				"</Types>" },
			{ name: "_rels/.rels", data: XML +
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
				'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
				"</Relationships>" },
			{ name: "xl/workbook.xml", data: XML +
				'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
				'<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>' },
			{ name: "xl/_rels/workbook.xml.rels", data: XML +
				'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
				'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
				'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' +
				'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
				"</Relationships>" },
			{ name: "xl/worksheets/sheet1.xml", data: sheet.join("") },
			{ name: "xl/sharedStrings.xml", data: sst.join("") },
			{ name: "xl/styles.xml", data: styles }
		];
		return UBMUtils._zip(files.map(f => ({ name: f.name, data: UBMUtils._utf8(f.data) })));
	},

	exportXlsx: () => {
		if (!UBMUtils.activeCustomer()) {
			showAlert("Select a customer before exporting", "warning");
			return;
		}
		const rows = UBMUtils.rows();
		const fields = (FieldsSelect.selectedOptionValues && FieldsSelect.selectedOptionValues.length > 0)
			? FieldsSelect.selectedOptionValues
			: (rows[0] ? Object.keys(rows[0]) : []);
		if (!rows.length) {
			showAlert("Nothing to export — run a query first", "warning");
			return;
		}
		const customer = UBMUtils.activeCustomerLabel().replace(/\s+/g, "_");
		const keys = UBMUtils.selectedKeys().join("+");
		const stamp = moment().format("YYYYMMDD-HHmmss");
		const stem = `${customer}-${keys}-${stamp}`;

		// ZIP entries are stored uncompressed, so a very wide/long result can build a
		// file big enough to hurt the browser tab. Past the ceiling, hand back CSV
		// rather than hang: same data, and Excel still opens it.
		const MAX_BYTES = 64 * 1024 * 1024;
		let bytes = null;
		try {
			bytes = UBMUtils.buildXlsx(rows, fields);
		} catch (e) {
			console.error("XLSX build failed:", e);
		}
		if (!bytes || bytes.length > MAX_BYTES) {
			const why = bytes ? "too large for an Excel file" : "couldn't be written as Excel";
			showAlert(`This export is ${why} — downloading it as CSV instead.`, "warning");
			UBMUtils.exportCsv();
			return;
		}
		const filename = `${stem}.xlsx`;
		const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		download(`data:${mime};base64,${UBMUtils._base64(bytes)}`, filename, mime);
		showAlert(`Exported ${rows.length.toLocaleString()} rows to ${filename}`, "success");
	},

	reset: () => {
		// Clear filters and rerun with defaults
		if (typeof FieldsSelect !== "undefined" && FieldsSelect.clearValue) FieldsSelect.clearValue();
		if (typeof StartDate !== "undefined" && StartDate.reset) StartDate.reset();
		if (typeof EndDate !== "undefined" && EndDate.reset) EndDate.reset();
		resetWidget("LimitInput", false);
		resetWidget("OffsetInput", false);
		resetWidget("EndpointSelect", false);
		showAlert("Filters reset", "success");
	}
}
