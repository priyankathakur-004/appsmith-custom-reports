export default {
	// ----- Static config -----
	// Known customers and their display labels. Each customer is its own UBM tenant
	// with its own API credentials. To onboard a new customer:
	//   1) add a { label, value } entry here, and
	//   2) add a matching `credentials` entry below keyed by the same `value`.
	// The `value` MUST equal the ?customer= code the embedding app passes in the URL.
	customerOptions: [
		{ label: "PPG Industries, Inc.", value: "ppg_p" },
		{ label: "Simon Properties", value: "simonproperties_p" }
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
					showAlert("This report isn't available for the selected account. Please contact your administrator if you believe this is an error.", "warning");
				}
				return;
			}
			await UBMUtils.ensureToken();
			await UBMUtils.run();
		} catch (e) {
			// Keep the technical detail in the console for support/debugging, but show
			// the embedding app's end-user a plain, actionable message.
			console.error("Custom Reports init failed:", e);
			showAlert("We couldn't load this report right now. Please refresh the page and try again — if the problem continues, contact your administrator.", "error");
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
	run: async () => {
		await UBMUtils.ensureToken();
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
		const queries = { getAccounts, getVendors, getBills, getMonthlyFeed, getBillErrors };
		const broken = UBMUtils.selectedKeys().slice(1).filter(k => !UBMUtils.findJoin(UBMUtils.selectedKeys()[0], k));
		if (broken.length > 0) {
			showAlert("No join path from " + UBMUtils.selectedKeys()[0] + " to: " + broken.join(", ") + " — those columns will be empty", "warning");
		}
		await Promise.all(specs.map(spec => queries[spec.query].run()));
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
		// Library-free Excel export: build an HTML table that Excel opens natively as .xls.
		// Avoids reliance on XLSX.utils which may be unreachable through Appsmith's sandbox.
		const esc = (v) => {
			if (v === null || v === undefined) return "";
			if (typeof v === "object") v = JSON.stringify(v);
			return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		};
		const header = "<tr>" + fields.map(f => `<th>${esc(f)}</th>`).join("") + "</tr>";
		const tbody = rows.map(r => "<tr>" + fields.map(f => `<td>${esc(r[f])}</td>`).join("") + "</tr>").join("");
		const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>${header}${tbody}</table></body></html>`;

		const customer = UBMUtils.activeCustomerLabel().replace(/\s+/g, "_");
		const keys = UBMUtils.selectedKeys().join("+");
		const stamp = moment().format("YYYYMMDD-HHmmss");
		const filename = `${customer}-${keys}-${stamp}.xls`;

		const mime = "application/vnd.ms-excel";
		download(`data:${mime};charset=utf-8,${encodeURIComponent(html)}`, filename, mime);
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
