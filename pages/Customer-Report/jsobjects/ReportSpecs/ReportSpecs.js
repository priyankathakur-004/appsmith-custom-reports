export default {
	// ----- Report Builder -----
	// Field catalog and base query for the Cost Analysis - Trendline report. That
	// name is no longer shown in the UI: the client reads this as a generic builder
	// and needs several reports. All filters apply at the SQL layer.

	// ----- Field catalog -----
	// { group, value (SELECT alias + grid column key), label (grid/export header),
	//   description (shown as the column's info tooltip), sql (SELECT expression) }
	visibleFieldOptions: [
		// --- Time / period ---
		{ group: "Period", value: "month", label: "Month", description: "Billing month bucket (YYYY-MM)", sql: "TO_CHAR(amf.time_period, 'YYYY-MM') AS \"month\"" },
		{ group: "Period", value: "statementDate", label: "Statement Date", description: "Date associated with invoice date.", sql: "TO_CHAR(amf.statement_date, 'YYYY-MM-DD') AS \"statementDate\"" },
		{ group: "Period", value: "startDate", label: "Service Start", description: "Date associated with service start date.", sql: "TO_CHAR(amf.start_date, 'YYYY-MM-DD') AS \"startDate\"" },
		{ group: "Period", value: "endDate", label: "Service End", description: "Date associated with service end date.", sql: "TO_CHAR(amf.end_date, 'YYYY-MM-DD') AS \"endDate\"" },
		{ group: "Period", value: "daysOfService", label: "Days of Service", description: "Number of days associated with days of service.", sql: "amf.days_of_service AS \"daysOfService\"" },

		// --- Location ---
		{ group: "Location", value: "location", label: "Location", description: "Location name", sql: "l.name AS \"location\"" },
		{ group: "Location", value: "locationId", label: "Location ID (internal)", description: "UBM's own database id for the location, e.g. 113614. For the site number that appears on your reports, use Location Number.", sql: "l.id AS \"locationId\"" },
		{ group: "Location", value: "locationAddress", label: "Location Address", description: "Street address of the location", sql: "l.address AS \"locationAddress\"" },
		{ group: "Location", value: "locationCity", label: "City", description: "Location city", sql: "l.city AS \"locationCity\"" },
		{ group: "Location", value: "locationState", label: "State/Province", description: "Location state or province", sql: "l.state AS \"locationState\"" },
		{ group: "Location", value: "locationCountry", label: "Country", description: "Location country", sql: "l.country AS \"locationCountry\"" },
		{ group: "Location", value: "locationZip", label: "Location Zip", description: "Location postal / ZIP code", sql: "l.postcode AS \"locationZip\"" },
		{ group: "Location", value: "locationStatus", label: "Location Status", description: "Current status of status.", sql: "lt.location_status AS \"locationStatus\"" },
		{ group: "Location", value: "buildingType", label: "Building Type", description: "Type or category of location building type.", sql: "l.building_type AS \"buildingType\"" },
		{ group: "Location", value: "squareFeet", label: "Square Feet", description: "Location floor area (sq ft)", sql: "l.square_feet AS \"squareFeet\"" },
		{ group: "Location", value: "locationNumber", label: "Location Number", description: "Site number, e.g. 0115 — the number your own reports refer to a location by.", sql: "lt.location_number AS \"locationNumber\"" },

		// --- Hierarchy: removed. UBM has no hierarchy/grouping attributes
		// (location_division / top / second / third group) — confirmed by
		// UBM team 2026-06-17. Do not re-add without a real source column.

		// --- Vendor / account identity ---
		// Vendor name, in the order the platform intends: the customer's own pretty
		// name, then the global one, then the vendor's plain name, then the code.
		// COALESCE short-circuits, so later lookups only run when earlier ones are
		// empty — and they often are: ANCHORAGEWATERWW has no pretty name at either
		// level, which is why this used to display the raw code.
		{ group: "Vendor / Account", value: "vendor", label: "Vendor", description: "Vendor name — the customer's pretty name where one is set, otherwise the global pretty name, otherwise the vendor's plain name", sql: "COALESCE((SELECT NULLIF(btrim(cvpn.pretty_name), '') FROM bill_management_v2.customers_vendors_pretty_name cvpn JOIN bill_management_v2.vendors v ON v.id = cvpn.vendor_id WHERE v.code = amf.vendor_code AND cvpn.customer_id = amf.customer_id LIMIT 1), (SELECT NULLIF(btrim(v.pretty_name), '') FROM bill_management_v2.vendors v WHERE v.code = amf.vendor_code LIMIT 1), (SELECT NULLIF(btrim(cpv.name), '') FROM bill_management_v2.customers_providers_vendors cpv WHERE cpv.code = amf.vendor_code AND cpv.customer_id = amf.customer_id LIMIT 1), (SELECT NULLIF(btrim(pv.name), '') FROM bill_management_v2.providers_vendors pv WHERE pv.code = amf.vendor_code LIMIT 1), amf.vendor_code) AS \"vendor\"" },
		{ group: "Vendor / Account", value: "vendorNameAp", label: "Vendor Name (AP)", description: "Remittance / accounts-payable name for the vendor — the name an ERP such as JDE is most likely to expect", sql: "COALESCE((SELECT NULLIF(btrim(cpv.remittance_name), '') FROM bill_management_v2.customers_providers_vendors cpv WHERE cpv.code = amf.vendor_code AND cpv.customer_id = amf.customer_id LIMIT 1), (SELECT NULLIF(btrim(pv.remittance_name), '') FROM bill_management_v2.providers_vendors pv WHERE pv.code = amf.vendor_code LIMIT 1)) AS \"vendorNameAp\"" },
		{ group: "Vendor / Account", value: "vendorCode", label: "Vendor Code", description: "Vendor code (stable join key)", sql: "amf.vendor_code AS \"vendorCode\"" },
		// Account # and Account Status: scalar subqueries, not joins. They cost nothing
		// when unselected, and virtual_accounts_status isn't provably one row per
		// account, so a join could have multiplied the report's rows.
		{ group: "Vendor / Account", value: "accountNumber", label: "Account #", description: "Utility account number as it appears on the bill", sql: "(SELECT va.account_code FROM bill_management_v2.virtual_accounts va WHERE va.id = amf.virtual_account_id) AS \"accountNumber\"" },
		{ group: "Vendor / Account", value: "accountStatus", label: "Account Status", description: "Status of the utility account itself — not the location's status", sql: "(SELECT vas.account_status FROM bill_management_v2.virtual_accounts_status vas WHERE vas.virtual_account_id = amf.virtual_account_id LIMIT 1) AS \"accountStatus\"" },
		{ group: "Vendor / Account", value: "billType", label: "Bill Type", description: "Type or category of bill type.", sql: "amf.bill_type AS \"billType\"" },
		{ group: "Vendor / Account", value: "utilityType", label: "Service / Utility Type", description: "Type or category of utility type.", sql: "amf.utility_type AS \"utilityType\"" },

		// --- Usage / consumption ---
		{ group: "Usage", value: "uom", label: "Unit of Measure", description: "Unit of measure for consumption (e.g. CCF, KWH)", sql: "amf.total_consumption_uom AS \"uom\"" },
		{ group: "Usage", value: "totalConsumption", label: "Total Consumption", description: "Total metered consumption", sql: "amf.total_consumption AS \"totalConsumption\"" },
		{ group: "Usage", value: "totalGenConsumption", label: "Generation Consumption", description: "On-site generation consumption", sql: "amf.total_gen_consumption AS \"totalGenConsumption\"" },
		{ group: "Usage", value: "demand", label: "Max Demand", description: "Maximum demand (kW)", sql: "amf.max_demand AS \"demand\"" },
		{ group: "Usage", value: "cogenConsumption", label: "Cogeneration Consumption", description: "Cogeneration consumption", sql: "amf.total_cogen_consumption AS \"cogenConsumption\"" },

		// --- Consumption by time-of-use tier ---
		{ group: "Usage (time of use)", value: "consumptionOnpeak", label: "Consumption (On-Peak)", description: "Consumption during on-peak hours", sql: "amf.total_consumption_onpeak AS \"consumptionOnpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionMidpeak", label: "Consumption (Mid-Peak)", description: "Consumption during mid-peak hours", sql: "amf.total_consumption_midpeak AS \"consumptionMidpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionOffpeak", label: "Consumption (Off-Peak)", description: "Consumption during off-peak hours", sql: "amf.total_consumption_offpeak AS \"consumptionOffpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionShoulderpeak", label: "Consumption (Shoulder-Peak)", description: "Consumption during shoulder-peak hours", sql: "amf.total_consumption_shoulderpeak AS \"consumptionShoulderpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionSuperpeak", label: "Consumption (Super-Peak)", description: "Consumption during super-peak hours", sql: "amf.total_consumption_superpeak AS \"consumptionSuperpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionSuperoffpeak", label: "Consumption (Super-Off-Peak)", description: "Consumption during super-off-peak hours", sql: "amf.total_consumption_superoffpeak AS \"consumptionSuperoffpeak\"" },

		// --- Charges (granular) ---
		// Every charge column the feed has. Late fees are not among them; see below.
		{ group: "Charges", value: "totalCharges", label: "Total Charges", description: "Monetary value for total charges.", sql: "amf.total_charges AS \"totalCharges\"" },
		{ group: "Charges", value: "totalChargesUsage", label: "Usage Charges", description: "Monetary value for usage charges.", sql: "amf.total_charges_usage AS \"totalChargesUsage\"" },
		{ group: "Charges", value: "totalChargesConsumption", label: "Consumption Charges", description: "Monetary value for consumption charges.", sql: "amf.total_charges_consumption AS \"totalChargesConsumption\"" },
		{ group: "Charges", value: "totalChargesDemand", label: "Demand Charges", description: "Monetary value for demand charges.", sql: "amf.total_charges_demand AS \"totalChargesDemand\"" },
		{ group: "Charges", value: "totalChargesTaxes", label: "Tax Charges", description: "Tax portion of the bill's charges — the column to use for the client's Tax line.", sql: "amf.total_charges_taxes AS \"totalChargesTaxes\"" },
		// Late fees live in analytics_billing_line_items (code = 'LATEFEE', bill_type =
		// 'live') at bill grain, and one bill spans several feed rows (25,374 rows from
		// 7,098 bills). Keying on bill_id or block_id would multiply the fee, so it is
		// divided across the bill's rows: a row shows a share, the column totals right.
		{ group: "Charges", value: "lateCharges", label: "Late Charges", description: "Late fees on the bill behind this row, net of any recouped fees. A bill covers several report rows, so each row shows its share of the fee rather than the whole amount — the column still adds up correctly.", sql: "((SELECT COALESCE(SUM(li.charge), 0) FROM bill_management_v2.analytics_billing_line_items li WHERE li.bill_id = amf.bill_id AND li.code = 'LATEFEE' AND li.bill_type = 'live') / NULLIF((SELECT COUNT(*) FROM bill_management_v2.analytics_monthly_feed a2 WHERE a2.bill_id = amf.bill_id), 0)) AS \"lateCharges\"" },
		{ group: "Charges", value: "totalChargesCustomer", label: "Customer Charges", description: "Monetary value for customer charges.", sql: "amf.total_charges_customer AS \"totalChargesCustomer\"" },
		{ group: "Charges", value: "totalChargesOther", label: "Other Charges", description: "Charges outside the usage, consumption, demand, tax, customer, generation and commodity buckets — the closest the feed has to a miscellaneous line.", sql: "amf.total_charges_other AS \"totalChargesOther\"" },
		{ group: "Charges", value: "totalChargesGeneration", label: "Generation Charges", description: "Monetary value for generation charges.", sql: "amf.total_charges_generation AS \"totalChargesGeneration\"" },
		{ group: "Charges", value: "totalChargesCommodity", label: "Commodity Charges", description: "Monetary value for commodity charges.", sql: "amf.total_charges_commodity AS \"totalChargesCommodity\"" },
		{ group: "Charges", value: "totalChargesBilledUse", label: "Billed Use Charges", description: "Monetary value for billed usage subcharges.", sql: "amf.total_charges_billeduse AS \"totalChargesBilledUse\"" },

		// --- Consumption charges by time-of-use tier ---
		{ group: "Charges (time of use)", value: "chargesConsumptionOnpeak", label: "Consumption Charges (On-Peak)", description: "Monetary value for onpeak consumption charges.", sql: "amf.total_charges_consumption_onpeak AS \"chargesConsumptionOnpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionMidpeak", label: "Consumption Charges (Mid-Peak)", description: "Monetary value for midpeak consumption charges.", sql: "amf.total_charges_consumption_midpeak AS \"chargesConsumptionMidpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionOffpeak", label: "Consumption Charges (Off-Peak)", description: "Monetary value for offpeak consumption charges.", sql: "amf.total_charges_consumption_offpeak AS \"chargesConsumptionOffpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionShoulderpeak", label: "Consumption Charges (Shoulder-Peak)", description: "Monetary value for shoulderpeak consumption charges.", sql: "amf.total_charges_consumption_shoulderpeak AS \"chargesConsumptionShoulderpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionSuperpeak", label: "Consumption Charges (Super-Peak)", description: "Monetary value for superpeak consumption charges.", sql: "amf.total_charges_consumption_superpeak AS \"chargesConsumptionSuperpeak\"" },

		// --- Weather (raw degree-days only) ---
		// UBM has no "normalization type" attribute; we expose raw HDD/CDD and
		// any normalization is done client-side. (UBM team 2026-06-17.)
		{ group: "Weather", value: "totalHdd", label: "Heating Degree Days", description: "Number of days associated with heating degree days.", sql: "amf.total_hdd_billblock AS \"totalHdd\"" },
		{ group: "Weather", value: "totalCdd", label: "Cooling Degree Days", description: "Number of days associated with cooling degree days.", sql: "amf.total_cdd_billblock AS \"totalCdd\"" },
		{ group: "Weather", value: "degreeDaysTotal", label: "Degree Days (Total)", description: "Number of days associated with total degree days.", sql: "amf.total_dd_billblock AS \"degreeDaysTotal\"" },
		{ group: "Weather", value: "kwhPerDd", label: "kWh per Degree Day", description: "kWh per degree day (weather-normalized use)", sql: "amf.kwh_per_dd_billblock AS \"kwhPerDd\"" },
		{ group: "Weather", value: "genKwhPerDd", label: "Gen kWh per Degree Day", description: "Generation kWh per degree day", sql: "amf.gen_kwh_per_dd_billblock AS \"genKwhPerDd\"" }
	],

	// locationNumber, not locationId: the site number is what the client's own
	// reports key on. The internal id is still selectable for anyone who needs it.
	defaultVisibleFields: [
		"month", "location", "locationNumber", "utilityType",
		"vendor", "totalCharges", "totalConsumption", "uom"
	],

	// ----- Base FROM -----
	// locations (l) is the parent; location_detail (lt) holds address/status/number.
	// Vendor name is a scalar subquery rather than a join: the pretty-name view held
	// the raw code for 209 of 377 vendors, and a code can repeat within a customer.
	fromClause:
		`bill_management_v2.analytics_monthly_feed amf
		LEFT JOIN bill_management_v2.locations l ON l.id = amf.location_id
		LEFT JOIN bill_management_v2.location_detail lt ON lt.location_id = l.id`,

	// Default ORDER BY (stable paging key) — also the tiebreaker for orderBy().
	orderByClause: "l.id, amf.time_period",

	// ORDER BY from the grid's sort menu, via the sortModel the grid persists to the
	// store. Postgres allows ORDER BY on output aliases. The stable default is
	// appended as a tiebreaker so paging stays deterministic.
	orderBy: () => {
		const known = ReportSpecs.allFieldOptions().map(o => o.value);
		let model = [];
		try { model = JSON.parse(appsmith.store.reportsSortModel || "[]"); } catch (e) { model = []; }
		const terms = (Array.isArray(model) ? model : [])
			.filter(s => s && known.indexOf(s.colId) >= 0)
			.map(s => `"${s.colId}" ${s.sort === "desc" ? "DESC" : "ASC"}`);
		return terms.length > 0
			? `${terms.join(", ")}, ${ReportSpecs.orderByClause}`
			: ReportSpecs.orderByClause;
	},

	// ----- ISO state/country code → pretty name maps -----
	// DB stores ISO codes like "US-CA", "CA-ON". Filter SELECT/IN still uses
	// the code; only the dropdown label changes via prettyStates/prettyCountries.
	stateNames: {
		"US-AL": "Alabama", "US-AK": "Alaska", "US-AZ": "Arizona", "US-AR": "Arkansas",
		"US-CA": "California", "US-CO": "Colorado", "US-CT": "Connecticut", "US-DE": "Delaware",
		"US-DC": "District of Columbia", "US-FL": "Florida", "US-GA": "Georgia", "US-HI": "Hawaii",
		"US-ID": "Idaho", "US-IL": "Illinois", "US-IN": "Indiana", "US-IA": "Iowa",
		"US-KS": "Kansas", "US-KY": "Kentucky", "US-LA": "Louisiana", "US-ME": "Maine",
		"US-MD": "Maryland", "US-MA": "Massachusetts", "US-MI": "Michigan", "US-MN": "Minnesota",
		"US-MS": "Mississippi", "US-MO": "Missouri", "US-MT": "Montana", "US-NE": "Nebraska",
		"US-NV": "Nevada", "US-NH": "New Hampshire", "US-NJ": "New Jersey", "US-NM": "New Mexico",
		"US-NY": "New York", "US-NC": "North Carolina", "US-ND": "North Dakota", "US-OH": "Ohio",
		"US-OK": "Oklahoma", "US-OR": "Oregon", "US-PA": "Pennsylvania", "US-RI": "Rhode Island",
		"US-SC": "South Carolina", "US-SD": "South Dakota", "US-TN": "Tennessee", "US-TX": "Texas",
		"US-UT": "Utah", "US-VT": "Vermont", "US-VA": "Virginia", "US-WA": "Washington",
		"US-WV": "West Virginia", "US-WI": "Wisconsin", "US-WY": "Wyoming",
		"US-PR": "Puerto Rico", "US-VI": "U.S. Virgin Islands", "US-GU": "Guam",
		"US-MP": "Northern Mariana Islands", "US-AS": "American Samoa",
		"CA-AB": "Alberta", "CA-BC": "British Columbia", "CA-MB": "Manitoba",
		"CA-NB": "New Brunswick", "CA-NL": "Newfoundland and Labrador", "CA-NS": "Nova Scotia",
		"CA-ON": "Ontario", "CA-PE": "Prince Edward Island", "CA-QC": "Quebec",
		"CA-SK": "Saskatchewan", "CA-NT": "Northwest Territories", "CA-NU": "Nunavut",
		"CA-YT": "Yukon"
	},

	countryNames: {
		"US": "United States", "USA": "United States", "CA": "Canada", "CAN": "Canada",
		"MX": "Mexico", "GB": "United Kingdom", "UK": "United Kingdom"
	},

	prettyStates: () => {
		const data = (typeof getStates !== "undefined") ? getStates.data : null;
		const rows = Array.isArray(data) ? data : [];
		const map = ReportSpecs.stateNames;
		return rows
			.filter(r => r && r.value)
			.map(r => ({
				value: r.value,
				label: map[r.value] ? `${map[r.value]} (${r.value})` : r.value
			}));
	},

	prettyCountries: () => {
		const data = (typeof getCountries !== "undefined") ? getCountries.data : null;
		const rows = Array.isArray(data) ? data : [];
		const map = ReportSpecs.countryNames;
		return rows
			.filter(r => r && r.value)
			.map(r => ({
				value: r.value,
				label: map[r.value] || r.value
			}));
	},

	// ----- Helpers -----
	// CustomerSelect holds the fdg_code, SQL filters on customer_id. Resolved with an
	// in-database subquery so query bodies carry no query.data dependency, which
	// Appsmith rejects. Returns "0" (fail closed, no rows) when nothing is selected.
	customerIdSql: () => {
		const v = CustomerSelect && CustomerSelect.selectedOptionValue;
		if (v == null || String(v).trim() === "") return "0";
		const code = String(v).trim().toLowerCase().replace(/'/g, "''");
		return `(SELECT id FROM bill_management_v2.customers_search WHERE LOWER(fdg_code) = '${code}' AND active IS NOT FALSE LIMIT 1)`;
	},

	// ----- Visible Columns -----
	// One picker for every output column: catalog fields plus account attributes. An
	// attribute option carries its name in the value ("attr:GL Code 1") because the
	// SQL builders run in query bodies, which cannot read another query's data.
	ATTR_PREFIX: "attr:",

	isAttrPick: (v) => String(v).indexOf(ReportSpecs.ATTR_PREFIX) === 0,

	// Group prefix, alphabetical within the group, since the widget cannot draw group
	// headers. Groups keep catalog order so the list runs identity to measures.
	// Display only: exports and grid headers use the plain label from fieldCatalog().
	fieldOptions: () => {
		const order = [];
		const byGroup = {};
		ReportSpecs.visibleFieldOptions.forEach(f => {
			const g = f.group || "Other";
			if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
			byGroup[g].push({ label: g + " · " + f.label, value: f.value });
		});
		const catalog = [];
		order.forEach(g => {
			byGroup[g].sort((a, b) => a.label.localeCompare(b.label));
			byGroup[g].forEach(o => catalog.push(o));
		});
		const rows = (typeof getAccountAttributesList !== "undefined" && getAccountAttributesList.data) || [];
		const attrs = (Array.isArray(rows) ? rows : [])
			.filter(r => r && r.value)
			.map(r => ({ label: "Account attribute · " + r.value, value: ReportSpecs.ATTR_PREFIX + r.value }))
			.sort((a, b) => a.label.localeCompare(b.label));
		return catalog.concat(attrs);
	},

	// One attribute pick -> the same shape as a catalog entry. `value` is the SELECT
	// alias and the grid's column key, so it must be safe whatever the attribute is
	// named. Values are aggregated with " | " (a VA can carry one more than once);
	// this is a correlated subquery per attribute.
	accountAttrColumn: (pick) => {
		const name = String(pick).slice(ReportSpecs.ATTR_PREFIX.length).trim();
		let alias = "attr_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
		if (alias === "attr_") alias = "attr_unnamed";
		return {
			value: alias,
			label: name,
			description: "Account attribute: " + name,
			sql:
				"(SELECT string_agg(DISTINCT vam.attribute_value, ' | ' ORDER BY vam.attribute_value) " +
				"FROM bill_management_v2.virtual_accounts_attributes_mapping vam " +
				"JOIN bill_management_v2.virtual_accounts_attributes_metadata vmeta " +
				"ON vmeta.id = vam.virtual_accounts_attributes_metadata_id " +
				"WHERE vam.virtual_account_id = amf.virtual_account_id " +
				"AND vmeta.customer_id = amf.customer_id " +
				"AND vmeta.deleted_at IS NULL " +
				`AND vmeta.attribute_name = ${ReportSpecs._quote(name)}) AS "${alias}"`
		};
	},

	// The report's columns, resolved and in the order they were picked — catalog
	// entries and attributes interleaved exactly as they sit in Visible Columns.
	// Single source for the SELECT, the grid, exports and header labels.
	selectedColumns: () => {
		const picked = (FieldsSelect && FieldsSelect.selectedOptionValues) || [];
		const fields = (Array.isArray(picked) && picked.length > 0) ? picked : ReportSpecs.defaultVisibleFields;
		const used = {};
		const out = [];
		fields.forEach(f => {
			const o = ReportSpecs.isAttrPick(f)
				? ReportSpecs.accountAttrColumn(f)
				: ReportSpecs.visibleFieldOptions.find(x => x.value === f);
			if (!o) return;
			// Two attributes can slug down to the same alias; keep them distinct.
			if (used[o.value]) { used[o.value]++; out.push(Object.assign({}, o, { value: o.value + "_" + used[o.value] })); }
			else { used[o.value] = 1; out.push(o); }
		});
		return out;
	},

	accountAttrColumns: () => ReportSpecs.selectedColumns().filter(o => String(o.value).indexOf("attr_") === 0),

	// Every column the report can emit: the catalog plus the attributes in play.
	// Single lookup source for SELECT/label/sort/filter code.
	allFieldOptions: () => ReportSpecs.visibleFieldOptions.concat(ReportSpecs.accountAttrColumns()),

	gridColumns: () => ReportSpecs.selectedColumns().map(o => o.value),

	// ----- SELECT builder -----
	selectClause: () => {
		const exprs = ReportSpecs.selectedColumns().map(o => o.sql);
		return exprs.length > 0 ? exprs.join(", ") : "1 AS placeholder";
	},

	// ----- WHERE builder (every filter is SQL-side) -----
	// Helpers
	_quote: v => `'${String(v).replace(/'/g, "''")}'`,
	_inList: (col, values, notIn) => {
		const list = values.map(v => ReportSpecs._quote(v)).join(",");
		return `AND ${col} ${notIn ? "NOT IN" : "IN"} (${list})`;
	},

	// Quoted CSV of the attribute names picked, for getAccountAttributeValues'
	// IN (...). Returns '' (matches nothing) when none are selected.
	accountAttrNames: () => {
		const names = (typeof AccountAttributesSelect !== "undefined" && AccountAttributesSelect.selectedOptionValues) || [];
		if (!names.length) return "''";
		return names.map(n => ReportSpecs._quote(n)).join(",");
	},

	// includeGrid: include the AG Grid column filters. excludeField: skip the filter
	// on that column, so a set-filter's value list is not collapsed by its own picks.
	filterClauses: (includeGrid = true, excludeField = null) => {
		const parts = ["WHERE 1=1"];
		const cidSql = ReportSpecs.customerIdSql();
		// Fail closed: with no customer resolved (missing/unknown ?customer= fdg_code),
		// match no rows instead of returning every tenant's data.
		if (cidSql === "0") return "WHERE 1=0";
		parts.push(`AND amf.customer_id = ${cidSql}`);
		// True when the column we're listing values for is the one this filter
		// targets, so we skip it (don't let a column filter constrain its own list).
		const skip = (aliases) => {
			if (!excludeField) return false;
			return Array.isArray(aliases) ? aliases.indexOf(excludeField) >= 0 : aliases === excludeField;
		};

		// Date range (always applied if provided). amf.time_period is the canonical
		// month bucket — start of month for monthly feed.
		if (StartDate && StartDate.selectedDate) {
			const d = moment(StartDate.selectedDate).startOf("month").format("YYYY-MM-DD");
			parts.push(`AND amf.time_period >= '${d}'`);
		}
		if (EndDate && EndDate.selectedDate) {
			const d = moment(EndDate.selectedDate).endOf("month").format("YYYY-MM-DD");
			parts.push(`AND amf.time_period <= '${d}'`);
		}

		// State / Province (+ Not In)
		const states = (typeof StateProvinceSelect !== "undefined" && StateProvinceSelect.selectedOptionValues) || [];
		if (states.length > 0 && !skip("locationState")) {
			const notIn = (typeof StateNotIn !== "undefined") && StateNotIn.isSwitchedOn;
			parts.push(ReportSpecs._inList("l.state", states, notIn));
		}

		// Country
		const countries = (typeof CountrySelect !== "undefined" && CountrySelect.selectedOptionValues) || [];
		if (countries.length > 0 && !skip("locationCountry")) {
			parts.push(ReportSpecs._inList("l.country", countries));
		}

		// Location status — lives on location_detail (lt) per the schema.
		const statuses = (typeof LocationStatusSelect !== "undefined" && LocationStatusSelect.selectedOptionValues) || [];
		if (statuses.length > 0 && !skip("locationStatus")) {
			parts.push(ReportSpecs._inList("lt.location_status", statuses));
		}

		// Account #. A code repeats across commodities (137636-551343 is WATER, SEWER
		// and FIREPROTECTION), so it is listed once and selecting it takes every service.
		const accounts = (typeof AccountNumberSelect !== "undefined" && AccountNumberSelect.selectedOptionValues) || [];
		if (accounts.length > 0 && !skip("accountNumber")) {
			const list = accounts.map(v => ReportSpecs._quote(v)).join(",");
			parts.push(
				"AND EXISTS (SELECT 1 FROM bill_management_v2.virtual_accounts va " +
				`WHERE va.id = amf.virtual_account_id AND va.account_code IN (${list}))`
			);
		}

		// Account status - the account's own status, not the location's. EXISTS so the
		// status table's index on virtual_account_id can be used.
		const acctStatuses = (typeof AccountStatusSelect !== "undefined" && AccountStatusSelect.selectedOptionValues) || [];
		if (acctStatuses.length > 0 && !skip("accountStatus")) {
			const list = acctStatuses.map(v => ReportSpecs._quote(v)).join(",");
			parts.push(
				"AND EXISTS (SELECT 1 FROM bill_management_v2.virtual_accounts_status vas " +
				`WHERE vas.virtual_account_id = amf.virtual_account_id AND vas.account_status IN (${list}))`
			);
		}

		// Vendor — selecting by vendor code (the stable join key).
		const vendors = (typeof VendorSelect !== "undefined" && VendorSelect.selectedOptionValues) || [];
		if (vendors.length > 0 && !skip(["vendor", "vendorCode"])) {
			parts.push(ReportSpecs._inList("amf.vendor_code", vendors));
		}
		// Vendor Territory — not available in UBM. UBM stores vendor *location*
		// info instead; filter by vendor location once that column is mapped.
		// (UBM team 2026-06-17.)

		// Service / Utility type (+ Not In)
		const services = (typeof ServiceTypesSelect !== "undefined" && ServiceTypesSelect.selectedOptionValues) || [];
		if (services.length > 0 && !skip("utilityType")) {
			const notIn = (typeof ServiceNotIn !== "undefined") && ServiceNotIn.isSwitchedOn;
			parts.push(ReportSpecs._inList("amf.utility_type", services, notIn));
		}

		// Location - multi-select of location ids (getLocationsForCustomer). The text
		// branch is a fallback in case the widget is ever swapped back to an input.
		const locFields = ["location", "locationId", "locationNumber", "locationAddress"];
		const locIds = (typeof LocationName !== "undefined" && LocationName.selectedOptionValues) || [];
		const locText = (typeof LocationName !== "undefined" && LocationName.text) || "";
		if (locIds.length > 0 && !skip(locFields)) {
			parts.push(ReportSpecs._inList("l.id", locIds));
		} else if (locText.trim() !== "" && !skip(locFields)) {
			const safe = String(locText).trim().replace(/'/g, "''");
			parts.push(
				`AND (l.name ILIKE '%${safe}%' OR l.address ILIKE '%${safe}%' ` +
				`OR CAST(lt.location_number AS TEXT) ILIKE '%${safe}%' OR CAST(l.id AS TEXT) = '${safe}')`
			);
		}

		// Location attributes: value-level filtering needs a second picker we haven't
		// built, so this no-ops for now.

		// Account attributes (UBM "VA attributes"). Values are encoded as name + CHR(31)
		// + value, grouped by name into one EXISTS each: attributes AND, values OR.
		const accVals = (typeof AccountAttributeValuesSelect !== "undefined" && AccountAttributeValuesSelect.selectedOptionValues) || [];
		if (accVals.length > 0) {
			const SEP = String.fromCharCode(31); // unit separator, matches CHR(31) in the query
			const groups = {};
			accVals.forEach(s => {
				const str = String(s);
				const i = str.indexOf(SEP);
				if (i < 0) return;
				const name = str.slice(0, i);
				const val = str.slice(i + 1);
				(groups[name] = groups[name] || []).push(val);
			});
			Object.keys(groups).forEach(name => {
				const vals = groups[name].map(v => ReportSpecs._quote(v)).join(",");
				parts.push(
					"AND EXISTS (SELECT 1 FROM bill_management_v2.virtual_accounts_attributes_mapping vam " +
					"JOIN bill_management_v2.virtual_accounts_attributes_metadata vmeta " +
					"ON vmeta.id = vam.virtual_accounts_attributes_metadata_id " +
					"WHERE vam.virtual_account_id = amf.virtual_account_id " +
					`AND vmeta.attribute_name = ${ReportSpecs._quote(name)} ` +
					`AND vam.attribute_value IN (${vals}))`
				);
			});
		}

		// ----- AG Grid column filters (header menus) -----
		// ANDed on top of the panel filters. WHERE can't reference SELECT aliases, so
		// each field resolves to its raw expression (the sql before " AS ").
		if (!includeGrid) return parts.join(" ");
		let gridModel = {};
		try { gridModel = JSON.parse(appsmith.store.reportsFilterModel || "{}"); } catch (e) { gridModel = {}; }
		const rawExpr = (fieldValue) => {
			const o = ReportSpecs.allFieldOptions().find(x => x.value === fieldValue);
			if (!o) return null;
			const i = o.sql.lastIndexOf(" AS ");
			return (i >= 0 ? o.sql.slice(0, i) : o.sql).trim();
		};
		const q = ReportSpecs._quote;
		const textCond = (expr, c) => {
			const v = (c && c.filter != null) ? String(c.filter) : "";
			switch (c && c.type) {
				case "contains": return `${expr} ILIKE ${q("%" + v + "%")}`;
				case "notContains": return `${expr} NOT ILIKE ${q("%" + v + "%")}`;
				case "equals": return `${expr} = ${q(v)}`;
				case "notEqual": return `${expr} <> ${q(v)}`;
				case "startsWith": return `${expr} ILIKE ${q(v + "%")}`;
				case "endsWith": return `${expr} ILIKE ${q("%" + v)}`;
				case "blank": return `(${expr} IS NULL OR ${expr} = '')`;
				case "notBlank": return `(${expr} IS NOT NULL AND ${expr} <> '')`;
				default: return null;
			}
		};
		const numCond = (expr, c) => {
			const n = Number(c && c.filter), n2 = Number(c && c.filterTo);
			switch (c && c.type) {
				case "equals": return isNaN(n) ? null : `${expr} = ${n}`;
				case "notEqual": return isNaN(n) ? null : `${expr} <> ${n}`;
				case "lessThan": return isNaN(n) ? null : `${expr} < ${n}`;
				case "lessThanOrEqual": return isNaN(n) ? null : `${expr} <= ${n}`;
				case "greaterThan": return isNaN(n) ? null : `${expr} > ${n}`;
				case "greaterThanOrEqual": return isNaN(n) ? null : `${expr} >= ${n}`;
				case "inRange": return (isNaN(n) || isNaN(n2)) ? null : `${expr} BETWEEN ${n} AND ${n2}`;
				case "blank": return `${expr} IS NULL`;
				case "notBlank": return `${expr} IS NOT NULL`;
				default: return null;
			}
		};
		const oneCond = (expr, c) => {
			if (!c) return null;
			if (c.filterType === "number") return numCond(expr, c);
			if (c.filterType === "set") {
				const vals = Array.isArray(c.values) ? c.values : [];
				const nonNull = vals.filter(v => v !== null && v !== undefined);
				const inList = nonNull.map(v => q(String(v))).join(",");
				const hasNull = vals.length !== nonNull.length;
				if (inList && hasNull) return `(${expr} IN (${inList}) OR ${expr} IS NULL)`;
				if (inList) return `${expr} IN (${inList})`;
				return "1=0"; // nothing selected => match nothing
			}
			return textCond(expr, c); // default: text filter
		};
		const buildCond = (expr, f) => {
			let conds = null, op = "AND";
			if (Array.isArray(f.conditions) && f.conditions.length) {
				conds = f.conditions; op = f.operator === "OR" ? "OR" : "AND";
			} else if (f.condition1 || f.condition2) {
				conds = [f.condition1, f.condition2].filter(Boolean); op = f.operator === "OR" ? "OR" : "AND";
			}
			if (conds) {
				const built = conds.map(c => oneCond(expr, c)).filter(Boolean);
				return built.length ? "(" + built.join(") " + op + " (") + ")" : null;
			}
			return oneCond(expr, f);
		};
		Object.keys(gridModel || {}).forEach(field => {
			if (field === excludeField) return; // don't constrain a column's list by its own filter
			const expr = rawExpr(field);
			if (!expr) return;
			const clause = buildCond(expr, gridModel[field]);
			if (clause) parts.push("AND " + clause);
		});

		return parts.join(" ");
	},

	// ----- Pagination plumbing (unchanged contract for GridWidget) -----
	fetchPage: async () => {
		const m = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const start = Math.max(0, (m && Number(m.pendingStart)) || 0);
		const end = Math.max(start + 1, (m && Number(m.pendingEnd)) || (start + 100));
		await storeValue("reportsPageStart", start);
		await storeValue("reportsPageEnd", end);
		// Persist the grid's column sort/filter state so orderBy() and
		// filterClauses() pick it up when the queries below re-evaluate.
		await storeValue("reportsSortModel", (m && m.pendingSort) || "[]");
		await storeValue("reportsFilterModel", (m && m.pendingFilter) || "{}");
		await Promise.all([runReport.run(), runReportCount.run()]);
		// Bump this only after the queries resolve: the grid delivers rows when it
		// changes, so the premature updateModel() (still holding the previous page) is
		// ignored. Without it the grid lags one fetch behind.
		await storeValue("reportsResponseTs", Date.now());
	},

	// ----- Set-filter distinct values (checkbox lists) -----
	// Raw expression for the column the grid is asking about. Whitelisted via
	// allFieldOptions and attribute names are quoted, so it's injection-safe.
	distinctExpr: () => {
		const field = appsmith.store.reportsDistinctField;
		const o = ReportSpecs.allFieldOptions().find(x => x.value === field);
		if (!o) return "NULL";
		const i = o.sql.lastIndexOf(" AS ");
		return (i >= 0 ? o.sql.slice(0, i) : o.sql).trim();
	},

	// WHERE for the set-filter value list: every other active filter but not the
	// column's own, so the checkbox list doesn't collapse to what you already picked.
	distinctWhere: () => {
		return ReportSpecs.filterClauses(true, appsmith.store.reportsDistinctField);
	},

	// Minimal FROM for the value query: only the joins the column and active filters
	// actually reference, so a distinct on an amf-only column skips them entirely.
	distinctFrom: () => {
		const sql = ReportSpecs.distinctExpr() + " " + ReportSpecs.distinctWhere();
		const parts = ["bill_management_v2.analytics_monthly_feed amf"];
		if (/\bl\./.test(sql)) parts.push("LEFT JOIN bill_management_v2.locations l ON l.id = amf.location_id");
		if (/\blt\./.test(sql)) parts.push("LEFT JOIN bill_management_v2.location_detail lt ON lt.location_id = amf.location_id");
		// Vendor and account columns are scalar subqueries off amf, so they need no
		// join here — they carry their own FROM.
		return parts.join("\n");
	},

	// onFetchDistinct handler: the grid asks for a column's checkbox values.
	// Persist the requested field, run the distinct query, then bump the ts the
	// grid watches so it can hand the values to the pending set filter.
	fetchDistinct: async () => {
		const m = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const field = (m && m.reqDistinctField) || "";
		await storeValue("reportsDistinctField", field);
		await getDistinctValues.run();
		await storeValue("reportsDistinctTs", Date.now());
	},

	totalRows: () => {
		const row = runReportCount.data && runReportCount.data[0];
		if (!row) return null;
		const n = Number(row.total);
		return isNaN(n) ? null : n;
	},

	refreshKey: () => Number(appsmith.store.reportsRefreshKey) || 0,

	// The values query's dependency on the names picker is hidden inside
	// accountAttrNames(), so Appsmith won't re-run it — do it explicitly here.
	onAccountAttrChange: async () => {
		resetWidget("AccountAttributeValuesSelect", false);
		getAccountAttributeValues.run();
		await ReportSpecs.refreshGrid();
	},

	refreshGrid: async () => {
		await storeValue("reportsPageStart", 0);
		await storeValue("reportsPageEnd", 100);
		// Clear any grid column sort/filter so a fresh Run starts clean; the
		// rebuilt grid re-sends its (empty) state on the next page fetch anyway.
		await storeValue("reportsSortModel", "[]");
		await storeValue("reportsFilterModel", "{}");
		await storeValue("reportsRefreshKey", (Number(appsmith.store.reportsRefreshKey) || 0) + 1);
	},

	// Column keys actually present in runReport.data (for the column picker UI).
	columnOptions: () => {
		const rows = runReport.data;
		if (!Array.isArray(rows) || rows.length === 0) return ReportSpecs.fieldOptions();
		return Object.keys(rows[0]).map(k => ({ label: k, value: k }));
	},

	// Message for a bad ?customer= link (a numeric id, or an unknown code) instead of
	// a silently empty report; "" when valid or absent. Reads getCustomers.data,
	// which is fine here - consumed by a widget binding, not a query body.
	customerError: () => {
		const raw = (appsmith.URL && appsmith.URL.queryParams && appsmith.URL.queryParams.customer);
		const code = (raw == null ? "" : String(raw)).trim();
		if (code === "") return ""; // no ?customer= → standalone / dropdown mode
		const rows = (typeof getCustomers !== "undefined" && getCustomers.data) || [];
		if (!Array.isArray(rows) || rows.length === 0) return ""; // list still loading — don't flash an error
		const lc = code.toLowerCase();
		if (rows.find(r => String(r.fdg_code || "").toLowerCase().trim() === lc)) return ""; // valid code
		const byId = rows.find(r => String(r.id) === code);
		if (byId) return `This link uses a customer ID (${code}). Use the customer code instead — ?customer=${byId.fdg_code}`;
		return `Unknown customer code "${code}" — no data for this link. Check the ?customer= value in the URL.`;
	},

	status: () => {
		const err = ReportSpecs.customerError();
		if (err) return "⚠️ " + err;
		if (runReport.isLoading) return "Loading...";
		const total = ReportSpecs.totalRows();
		if (total == null) return "Pick a customer and click Run";
		// No report name: it read "· Cost Analysis – Trendline", which told the client
		// the builder was locked to one report. Row count alone until there are several.
		return `${total.toLocaleString()} total rows`;
	},

	// ----- Export -----
	filenameStem: () => {
		const customer = (CustomerSelect && CustomerSelect.selectedOptionLabel || "customer")
			.toString().replace(/\s+/g, "_");
		const stamp = moment().format("YYYYMMDD-HHmmss");
		// Also dropped the report name here — the client sees this on every file he
		// downloads, so leaving it would have undone half the point of removing it
		// from the screen.
		return `${customer}-report-${stamp}`;
	},

	// Export fields honor the user's FieldsSelect picks (column order + which
	// columns) plus any account attribute columns, falling back to whatever the
	// export query returned.
	exportFields: (rows) => {
		const cols = ReportSpecs.gridColumns();
		if (cols.length > 0) return cols;
		return (rows && rows[0]) ? Object.keys(rows[0]) : [];
	},

	exportLabel: (field) => {
		// Honor the user's browser-local column renames, then the catalog label.
		const ov = (appsmith.store.reportsFieldLabels || {})[field];
		if (ov) return ov;
		const o = ReportSpecs.allFieldOptions().find(x => x.value === field);
		return o ? o.label : field;
	},

	// ----- Column header renames (browser-local; no DB write) -----
	// Catalog (default) header labels, keyed by field — passed to the grid so it
	// shows friendly names and knows the baseline to reset a rename back to.
	fieldCatalog: () => {
		const m = {};
		ReportSpecs.allFieldOptions().forEach(o => { m[o.value] = o.label; });
		return m;
	},

	// Field descriptions keyed by field, mirroring fieldCatalog(). Delivered to the
	// GridWidget model so each AG Grid column header can show an info (ⓘ) icon with
	// this text on hover/click. Sourced from allFieldOptions()[].description.
	fieldDescriptions: () => {
		const m = {};
		ReportSpecs.allFieldOptions().forEach(o => { m[o.value] = o.description || ""; });
		return m;
	},

	// onRenameField handler: the grid sends the field + new label. Persist to the
	// browser (localStorage via storeValue) so renames survive reloads. An empty
	// label removes the override (reset to the catalog name). No DB access needed.
	saveFieldLabel: async () => {
		const g = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const field = g && g.renameField;
		if (!field) return;
		const label = (g.renameLabel == null) ? "" : String(g.renameLabel).trim();
		const map = Object.assign({}, appsmith.store.reportsFieldLabels || {});
		if (label) map[field] = label; else delete map[field];
		await storeValue("reportsFieldLabels", map, true);
	},

	// Appsmith caps a query response at 5 MB, so the export is pulled in LIMIT/OFFSET
	// slices and stitched together here. Returns the accumulated rows, or null if a
	// slice failed outright.
	fetchExportRows: async () => {
		// 5000 rows leaves a ~1 KB/row budget before a slice hits the 5 MB cap.
		// Very wide reports can still blow that, so back off on failure instead
		// of giving up.
		const CHUNK = 5000;
		const MIN_CHUNK = 250;
		// Ceiling on a single export — past this the browser holds the whole file in
		// memory as one string. Raise the exportCsv/exportXlsx timeouts to match.
		const MAX_ROWS = 250000;

		const all = [];
		let limit = CHUNK;
		let offset = 0;
		let truncated = false;
		for (;;) {
			await storeValue("reportsExportLimit", limit);
			await storeValue("reportsExportOffset", offset);
			let batch;
			try {
				await exportRows.run();
				batch = exportRows.data || [];
			} catch (e) {
				// Almost always the 5 MB response cap on an unusually wide row set.
				// Halve the slice and retry the same offset.
				if (limit > MIN_CHUNK) {
					limit = Math.max(MIN_CHUNK, Math.floor(limit / 2));
					showAlert(`Rows are wide — retrying in batches of ${limit.toLocaleString()}`, "warning");
					continue;
				}
				showAlert("Export failed: rows are too wide to fetch. Deselect some columns and try again.", "error");
				return null;
			}
			for (const r of batch) all.push(r);
			// A short slice means we've reached the end of the result set.
			if (batch.length < limit) break;
			offset += batch.length;
			if (all.length >= MAX_ROWS) { truncated = true; break; }
			showAlert(`Fetching… ${all.length.toLocaleString()} rows so far`, "info");
		}
		await storeValue("reportsExportOffset", 0);
		if (truncated) {
			showAlert(`Export capped at ${MAX_ROWS.toLocaleString()} rows — narrow the filters for the rest`, "warning");
		}
		return all;
	},

	// Shared CSV serializer. eol is "\n" for plain CSV, "\r\n" for the Excel
	// flavor (Excel wants CRLF for clean column splitting).
	buildCsv: (rows, fields, eol) => {
		const escape = v => {
			if (v === null || v === undefined) return "";
			if (typeof v === "object") v = JSON.stringify(v);
			const s = String(v);
			return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
		};
		const lines = [fields.map(f => escape(ReportSpecs.exportLabel(f))).join(",")];
		for (const r of rows) lines.push(fields.map(f => escape(r[f])).join(","));
		return lines.join(eol);
	},

	// ----- Excel export -----
	// The .xls HTML-table trick renders as raw markup in Numbers and Sheets, and
	// SheetJS's XLSX.utils is blocked by Appsmith's sandbox, so the .xlsx is written
	// by hand: a ZIP of XML parts, stored uncompressed so no deflate is needed.

	// Identifier columns that must stay text: "0115" not 115, "501480.000" not
	// 501480. Attribute columns are added at build time; everything else is typed
	// per value so charges and consumption still sum in the sheet.
	textFields: ["locationNumber", "locationZip", "vendorCode", "accountNumber"],

	_utf8: (str) => {
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
		// Manual fallback, surrogate pairs included.
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
	// files: [{ name, data: Uint8Array }]
	_zip: (files) => {
		const u16 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF]);
		const u32 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
		const DOS_DATE = 0x0021; // 1980-01-01; fixed so exports are byte-identical
		const parts = [];
		const central = [];
		let offset = 0;
		files.forEach(f => {
			const name = ReportSpecs._utf8(f.name);
			const crc = ReportSpecs._crc32(f.data);
			const size = f.data.length;
			// Local file header: sig, version, flags (bit 11 = UTF-8 names), method,
			// time, date, crc, compressed size, uncompressed size, name len, extra len.
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

	// Build the .xlsx as bytes.
	buildXlsx: (rows, fields) => {
		const alwaysText = {};
		ReportSpecs.textFields.forEach(f => { alwaysText[f] = true; });
		// Attributes are identifiers, except percentages: "GL Allocation 1 (%)" is a
		// measure and needs to be a number to check a location totals 100.
		ReportSpecs.accountAttrColumns()
			.filter(o => !/%/.test(o.label))
			.forEach(o => { alwaysText[o.value] = true; });

		const esc = s => String(s)
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		const colName = (i) => {
			let s = "", n = i + 1;
			while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
			return s;
		};
		// Numeric unless that would lose information: a leading zero (an identifier), or
		// a whole number past Excel's 15 digits. Long decimals stay numeric (float noise).
		const isNumeric = (field, s) => {
			if (alwaysText[field]) return false;
			if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
			if (/^-?0\d/.test(s)) return false;
			return /\./.test(s) || s.replace(/-/g, "").length <= 15;
		};
		// Strings go through the shared-string table: this data repeats heavily, so one
		// entry per distinct value roughly halves an uncompressed file.
		const strings = new Map();
		let strRefs = 0;
		const strIndex = (s) => {
			strRefs++;
			let i = strings.get(s);
			if (i === undefined) { i = strings.size; strings.set(s, i); }
			return i;
		};
		// Widest rendered value per column, used to size the columns below.
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
			const label = String(ReportSpecs.exportLabel(f));
			if (label.length > widths[i]) widths[i] = label.length;
			// s="1" is the bold header style from styles.xml.
			return `<c r="${colName(i)}1" s="1" t="s"><v>${strIndex(label)}</v></c>`;
		}).join("") + "</row>");
		rows.forEach((r, ri) => {
			const n = ri + 2;
			body.push(`<row r="${n}">` + fields.map((f, i) => cellXml(r[f], f, colName(i) + n, i)).join("") + "</row>");
		});

		// Without explicit widths columns default to ~8 chars and a location name wraps
		// over five lines. Floored so headers stay readable, capped so one long value
		// can't push the rest off screen.
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

		// Without a stylesheet each app picks its own font and Numbers picks a large one.
		// Format 0 is the body, 1 the bold header. The empty fills/borders are required:
		// Excel rejects a fills list that doesn't start with "none" and "gray125".
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
		return ReportSpecs._zip(files.map(f => ({ name: f.name, data: ReportSpecs._utf8(f.data) })));
	},

	exportCsv: async () => {
		if (ReportSpecs.customerIdSql() === "0") {
			showAlert("Select a customer before exporting", "warning");
			return;
		}
		const rows = await ReportSpecs.fetchExportRows();
		if (rows === null) return;
		if (!rows.length) {
			showAlert("Nothing to export — run a query first", "warning");
			return;
		}
		const fields = ReportSpecs.exportFields(rows);
		const csv = ReportSpecs.buildCsv(rows, fields, "\n");
		const filename = `${ReportSpecs.filenameStem()}.csv`;
		download(csv, filename, "text/csv");
		showAlert(`Exported ${rows.length.toLocaleString()} rows to ${filename}`, "success");
	},

	exportXlsx: async () => {
		if (ReportSpecs.customerIdSql() === "0") {
			showAlert("Select a customer before exporting", "warning");
			return;
		}
		const rows = await ReportSpecs.fetchExportRows();
		if (rows === null) return;
		if (!rows.length) {
			showAlert("Nothing to export — run a query first", "warning");
			return;
		}
		const fields = ReportSpecs.exportFields(rows);
		const stem = ReportSpecs.filenameStem();
		// ZIP entries are stored uncompressed, so a very wide/long report can build a
		// file big enough to hurt the browser tab. Past the ceiling, hand back the CSV
		// rather than hang: it carries the same data and Excel still opens it.
		const MAX_BYTES = 64 * 1024 * 1024;
		let bytes = null;
		try {
			bytes = ReportSpecs.buildXlsx(rows, fields);
		} catch (e) {
			console.error("XLSX build failed:", e);
		}
		if (!bytes || bytes.length > MAX_BYTES) {
			const why = bytes ? "too large for an Excel file" : "couldn't be written as Excel";
			showAlert(`This export is ${why} — downloading it as CSV instead.`, "warning");
			download("﻿" + ReportSpecs.buildCsv(rows, fields, "\r\n"), `${stem}.csv`, "text/csv;charset=utf-8");
			return;
		}
		const filename = `${stem}.xlsx`;
		const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		download(`data:${mime};base64,${ReportSpecs._base64(bytes)}`, filename, mime);
		showAlert(`Exported ${rows.length.toLocaleString()} rows to ${filename}`, "success");
	},

	// Reset all filter widgets and re-fetch from page 1.
	reset: async () => {
		const widgetNames = [
			"FieldsSelect", "StartDate", "EndDate",
			"LocationName", "StateProvinceSelect", "StateNotIn",
			"CountrySelect", "LocationStatusSelect",
			"AccountNumberSelect", "AccountStatusSelect",
			"VendorSelect", "ServiceTypesSelect", "ServiceNotIn",
			"LocationAttributesSelect", "AccountAttributesSelect",
			"AccountAttributeValuesSelect"
		];
		for (const w of widgetNames) {
			try { resetWidget(w, false); } catch (e) { /* widget may not exist yet */ }
		}
		await ReportSpecs.refreshGrid();
		showAlert("Filters reset", "success");
	}
};
