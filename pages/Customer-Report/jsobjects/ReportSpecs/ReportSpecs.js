export default {
	// =====================================================================
	// Cost Analysis – Trendline
	//
	// Single-report builder modeled after the client's NG provider UI.
	// All filters apply at the SQL layer (see [[feedback-sql-side-filters]]).
	// Best-guess field mapping per [[project-reports-ng-builder]]; lines
	// marked TODO need confirmation against the NG → UBM mapping doc.
	// =====================================================================

	// ----- Visible fields catalog (what the user picks from FieldsSelect) -----
	// Each entry: { value (alias used in column picker), label, description, sql }.
	// - value:       column-picker alias, also the SELECT output alias.
	// - label:       friendly header (grid + CSV/XLSX export read this — keep clean).
	// - description: from the UBM field sheet's Description column where that text is
	//                meaningful; where the sheet only had boilerplate ("Field
	//                representing X"), a concise hand-written line is used instead.
	//                Surfaced as the info (ⓘ) icon tooltip on each grid column
	//                header via fieldDescriptions().
	// - sql:         the SELECT expression, built into the query by selectClause().
	visibleFieldOptions: [
		// --- Time / period ---
		{ value: "month", label: "Month", description: "Billing month bucket (YYYY-MM)", sql: "TO_CHAR(amf.time_period, 'YYYY-MM') AS \"month\"" },
		{ value: "statementDate", label: "Statement Date", description: "Date associated with invoice date.", sql: "TO_CHAR(amf.statement_date, 'YYYY-MM-DD') AS \"statementDate\"" },
		{ value: "startDate", label: "Service Start", description: "Date associated with service start date.", sql: "TO_CHAR(amf.start_date, 'YYYY-MM-DD') AS \"startDate\"" },
		{ value: "endDate", label: "Service End", description: "Date associated with service end date.", sql: "TO_CHAR(amf.end_date, 'YYYY-MM-DD') AS \"endDate\"" },
		{ value: "daysOfService", label: "Days of Service", description: "Number of days associated with days of service.", sql: "amf.days_of_service AS \"daysOfService\"" },

		// --- Location ---
		{ value: "location", label: "Location", description: "Location name", sql: "l.name AS \"location\"" },
		{ value: "locationId", label: "Location ID", description: "Unique identifier for location id.", sql: "l.id AS \"locationId\"" },
		{ value: "locationAddress", label: "Location Address", description: "Street address of the location", sql: "l.address AS \"locationAddress\"" },
		{ value: "locationCity", label: "City", description: "Location city", sql: "l.city AS \"locationCity\"" },
		{ value: "locationState", label: "State/Province", description: "Location state or province", sql: "l.state AS \"locationState\"" },
		{ value: "locationCountry", label: "Country", description: "Location country", sql: "l.country AS \"locationCountry\"" },
		{ value: "locationZip", label: "Location Zip", description: "Location postal / ZIP code", sql: "l.postcode AS \"locationZip\"" },
		{ value: "locationStatus", label: "Location Status", description: "Current status of status.", sql: "lt.location_status AS \"locationStatus\"" },
		{ value: "buildingType", label: "Building Type", description: "Type or category of location building type.", sql: "l.building_type AS \"buildingType\"" },
		{ value: "squareFeet", label: "Square Feet", description: "Location floor area (sq ft)", sql: "l.square_feet AS \"squareFeet\"" },
		{ value: "locationNumber", label: "Location Number", description: "Reference number for site number.", sql: "lt.location_number AS \"locationNumber\"" },

		// --- Hierarchy: removed. UBM has no hierarchy/grouping attributes
		// (location_division / top / second / third group) — confirmed by
		// UBM team 2026-06-17. Do not re-add without a real source column.

		// --- Vendor / account identity ---
		{ value: "vendor", label: "Vendor", description: "Vendor / utility provider name", sql: "COALESCE((SELECT NULLIF(btrim(cpv.name), '') FROM bill_management_v2.customers_providers_vendors cpv WHERE cpv.code = amf.vendor_code AND cpv.customer_id = amf.customer_id LIMIT 1), (SELECT NULLIF(btrim(pv.name), '') FROM bill_management_v2.providers_vendors pv WHERE pv.code = amf.vendor_code LIMIT 1), amf.vendor_code) AS \"vendor\"" },
		{ value: "vendorNameAp", label: "Vendor Name (AP)", description: "Remittance / accounts-payable name for the vendor — the name an ERP such as JDE is most likely to expect", sql: "COALESCE((SELECT NULLIF(btrim(cpv.remittance_name), '') FROM bill_management_v2.customers_providers_vendors cpv WHERE cpv.code = amf.vendor_code AND cpv.customer_id = amf.customer_id LIMIT 1), (SELECT NULLIF(btrim(pv.remittance_name), '') FROM bill_management_v2.providers_vendors pv WHERE pv.code = amf.vendor_code LIMIT 1)) AS \"vendorNameAp\"" },
		{ value: "vendorCode", label: "Vendor Code", description: "Vendor code (stable join key)", sql: "amf.vendor_code AS \"vendorCode\"" },
		// Account # and Account Status come from the virtual account behind each feed
		// row. Both are scalar subqueries rather than joins to the base FROM: they
		// cost nothing when the field isn't selected, and — unlike a join to
		// virtual_accounts_status, which we can't prove is one row per account —
		// they can't quietly multiply the report's rows.
		{ value: "accountNumber", label: "Account #", description: "Utility account number as it appears on the bill", sql: "(SELECT va.account_code FROM bill_management_v2.virtual_accounts va WHERE va.id = amf.virtual_account_id) AS \"accountNumber\"" },
		{ value: "accountStatus", label: "Account Status", description: "Status of the utility account itself — not the location's status", sql: "(SELECT vas.account_status FROM bill_management_v2.virtual_accounts_status vas WHERE vas.virtual_account_id = amf.virtual_account_id LIMIT 1) AS \"accountStatus\"" },
		{ value: "billType", label: "Bill Type", description: "Type or category of bill type.", sql: "amf.bill_type AS \"billType\"" },
		{ value: "utilityType", label: "Service / Utility Type", description: "Type or category of utility type.", sql: "amf.utility_type AS \"utilityType\"" },

		// --- Usage / consumption ---
		{ value: "uom", label: "Unit of Measure", description: "Unit of measure for consumption (e.g. CCF, KWH)", sql: "amf.total_consumption_uom AS \"uom\"" },
		{ value: "totalConsumption", label: "Total Consumption", description: "Total metered consumption", sql: "amf.total_consumption AS \"totalConsumption\"" },
		{ value: "totalGenConsumption", label: "Generation Consumption", description: "On-site generation consumption", sql: "amf.total_gen_consumption AS \"totalGenConsumption\"" },
		{ value: "demand", label: "Max Demand", description: "Maximum demand (kW)", sql: "amf.max_demand AS \"demand\"" },
		{ value: "cogenConsumption", label: "Cogeneration Consumption", description: "Cogeneration consumption", sql: "amf.total_cogen_consumption AS \"cogenConsumption\"" },

		// --- Consumption by time-of-use tier ---
		{ value: "consumptionOnpeak", label: "Consumption (On-Peak)", description: "Consumption during on-peak hours", sql: "amf.total_consumption_onpeak AS \"consumptionOnpeak\"" },
		{ value: "consumptionMidpeak", label: "Consumption (Mid-Peak)", description: "Consumption during mid-peak hours", sql: "amf.total_consumption_midpeak AS \"consumptionMidpeak\"" },
		{ value: "consumptionOffpeak", label: "Consumption (Off-Peak)", description: "Consumption during off-peak hours", sql: "amf.total_consumption_offpeak AS \"consumptionOffpeak\"" },
		{ value: "consumptionShoulderpeak", label: "Consumption (Shoulder-Peak)", description: "Consumption during shoulder-peak hours", sql: "amf.total_consumption_shoulderpeak AS \"consumptionShoulderpeak\"" },
		{ value: "consumptionSuperpeak", label: "Consumption (Super-Peak)", description: "Consumption during super-peak hours", sql: "amf.total_consumption_superpeak AS \"consumptionSuperpeak\"" },
		{ value: "consumptionSuperoffpeak", label: "Consumption (Super-Off-Peak)", description: "Consumption during super-off-peak hours", sql: "amf.total_consumption_superoffpeak AS \"consumptionSuperoffpeak\"" },

		// --- Charges (granular) ---
		{ value: "totalCharges", label: "Total Charges", description: "Monetary value for total charges.", sql: "amf.total_charges AS \"totalCharges\"" },
		{ value: "totalChargesUsage", label: "Usage Charges", description: "Monetary value for usage charges.", sql: "amf.total_charges_usage AS \"totalChargesUsage\"" },
		{ value: "totalChargesConsumption", label: "Consumption Charges", description: "Monetary value for consumption charges.", sql: "amf.total_charges_consumption AS \"totalChargesConsumption\"" },
		{ value: "totalChargesDemand", label: "Demand Charges", description: "Monetary value for demand charges.", sql: "amf.total_charges_demand AS \"totalChargesDemand\"" },
		{ value: "totalChargesTaxes", label: "Tax Charges", description: "Monetary value for taxes charges.", sql: "amf.total_charges_taxes AS \"totalChargesTaxes\"" },
		{ value: "totalChargesCustomer", label: "Customer Charges", description: "Monetary value for customer charges.", sql: "amf.total_charges_customer AS \"totalChargesCustomer\"" },
		{ value: "totalChargesOther", label: "Other Charges", description: "Monetary value for other charges.", sql: "amf.total_charges_other AS \"totalChargesOther\"" },
		{ value: "totalChargesGeneration", label: "Generation Charges", description: "Monetary value for generation charges.", sql: "amf.total_charges_generation AS \"totalChargesGeneration\"" },
		{ value: "totalChargesCommodity", label: "Commodity Charges", description: "Monetary value for commodity charges.", sql: "amf.total_charges_commodity AS \"totalChargesCommodity\"" },
		{ value: "totalChargesBilledUse", label: "Billed Use Charges", description: "Monetary value for billed usage subcharges.", sql: "amf.total_charges_billeduse AS \"totalChargesBilledUse\"" },

		// --- Consumption charges by time-of-use tier ---
		{ value: "chargesConsumptionOnpeak", label: "Consumption Charges (On-Peak)", description: "Monetary value for onpeak consumption charges.", sql: "amf.total_charges_consumption_onpeak AS \"chargesConsumptionOnpeak\"" },
		{ value: "chargesConsumptionMidpeak", label: "Consumption Charges (Mid-Peak)", description: "Monetary value for midpeak consumption charges.", sql: "amf.total_charges_consumption_midpeak AS \"chargesConsumptionMidpeak\"" },
		{ value: "chargesConsumptionOffpeak", label: "Consumption Charges (Off-Peak)", description: "Monetary value for offpeak consumption charges.", sql: "amf.total_charges_consumption_offpeak AS \"chargesConsumptionOffpeak\"" },
		{ value: "chargesConsumptionShoulderpeak", label: "Consumption Charges (Shoulder-Peak)", description: "Monetary value for shoulderpeak consumption charges.", sql: "amf.total_charges_consumption_shoulderpeak AS \"chargesConsumptionShoulderpeak\"" },
		{ value: "chargesConsumptionSuperpeak", label: "Consumption Charges (Super-Peak)", description: "Monetary value for superpeak consumption charges.", sql: "amf.total_charges_consumption_superpeak AS \"chargesConsumptionSuperpeak\"" },

		// --- Weather (raw degree-days only) ---
		// UBM has no "normalization type" attribute; we expose raw HDD/CDD and
		// any normalization is done client-side. (UBM team 2026-06-17.)
		{ value: "totalHdd", label: "Heating Degree Days", description: "Number of days associated with heating degree days.", sql: "amf.total_hdd_billblock AS \"totalHdd\"" },
		{ value: "totalCdd", label: "Cooling Degree Days", description: "Number of days associated with cooling degree days.", sql: "amf.total_cdd_billblock AS \"totalCdd\"" },
		{ value: "degreeDaysTotal", label: "Degree Days (Total)", description: "Number of days associated with total degree days.", sql: "amf.total_dd_billblock AS \"degreeDaysTotal\"" },
		{ value: "kwhPerDd", label: "kWh per Degree Day", description: "kWh per degree day (weather-normalized use)", sql: "amf.kwh_per_dd_billblock AS \"kwhPerDd\"" },
		{ value: "genKwhPerDd", label: "Gen kWh per Degree Day", description: "Generation kWh per degree day", sql: "amf.gen_kwh_per_dd_billblock AS \"genKwhPerDd\"" }
	],

	defaultVisibleFields: [
		"month", "location", "locationId", "utilityType",
		"vendor", "totalCharges", "totalConsumption", "uom"
	],

	// ----- Base FROM (constant for Trendline) -----
	// location_detail (lt) holds description/address/city/state/postcode for
	// the location; locations (l) is the parent (id, customer_id, country).
	// Pattern mirrors pages/Locations/queries/getLocationLists.
	//
	// The vendor name used to come from a customers_providers_pretty_name join here.
	// That view carried the raw code as the "pretty" name for 209 of Simon's 377
	// vendors, and joining a view on every report run cost us for the privilege. The
	// vendor field now reads customers_providers_vendors.name instead — populated for
	// 377 of 384 — as a scalar subquery, which also can't multiply rows the way that
	// join could (a vendor code can appear more than once per customer).
	fromClause:
		`bill_management_v2.analytics_monthly_feed amf
		LEFT JOIN bill_management_v2.locations l ON l.id = amf.location_id
		LEFT JOIN bill_management_v2.location_detail lt ON lt.location_id = l.id`,

	// Default ORDER BY (stable paging key) — also the tiebreaker for orderBy().
	orderByClause: "l.id, amf.time_period",

	// Dynamic ORDER BY driven by the AG Grid column sort menu (Sort Ascending /
	// Descending in the header). The grid persists its sortModel to the store on
	// every page fetch; we map each sorted column to its SELECT alias. Postgres
	// allows ORDER BY on output aliases, so sorting by alias is safe. The stable
	// default is always appended as a tiebreaker so paging stays deterministic.
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
	// The customer dropdown's value is the fdg_code (matches the Customer page).
	// The SQL layer filters on the numeric customer_id, so we resolve code -> id
	// with an in-database scalar subquery. Doing it in SQL (rather than a JS lookup
	// against the customer list query) keeps query bodies free of a query.data
	// dependency, which Appsmith rejects as reactive-dependency misuse. Reads only
	// the CustomerSelect widget; returns "0" (fail closed => no rows) when nothing
	// is selected. Single source of truth for "which customer are we".
	customerIdSql: () => {
		const v = CustomerSelect && CustomerSelect.selectedOptionValue;
		if (v == null || String(v).trim() === "") return "0";
		const code = String(v).trim().toLowerCase().replace(/'/g, "''");
		return `(SELECT id FROM bill_management_v2.customers_search WHERE LOWER(fdg_code) = '${code}' AND active IS NOT FALSE LIMIT 1)`;
	},

	// ----- Visible Columns -----
	// One picker chooses every output column: the catalog above plus the customer's
	// account attributes (GL Code 1, GL Allocation 1 (%), Constellation Acct ID, …).
	// Attributes used to be added from the Account Attributes filter instead, which
	// meant filtering on one forced its column into the report and there was no way
	// to deselect it. That picker now only narrows the values list you filter by.
	//
	// An attribute option carries its name inside the option value ("attr:GL Code 1")
	// rather than an id resolved against getAccountAttributesList. The SQL builders
	// below run inside query bodies, and Appsmith rejects a query that depends on
	// another query's data — carrying the name means they never have to look it up.
	ATTR_PREFIX: "attr:",

	isAttrPick: (v) => String(v).indexOf(ReportSpecs.ATTR_PREFIX) === 0,

	fieldOptions: () => {
		const catalog = ReportSpecs.visibleFieldOptions.map(f => ({ label: f.label, value: f.value }));
		const rows = (typeof getAccountAttributesList !== "undefined" && getAccountAttributesList.data) || [];
		const attrs = (Array.isArray(rows) ? rows : [])
			.filter(r => r && r.value)
			.map(r => ({ label: "Account attribute · " + r.value, value: ReportSpecs.ATTR_PREFIX + r.value }));
		return catalog.concat(attrs);
	},

	// One account attribute pick -> the same { value, label, description, sql } shape
	// as a catalog entry, so everything downstream treats them alike. `value` is the
	// SELECT alias and the grid's column key, so it has to be SQL- and grid-safe
	// whatever the attribute is called ("GL Allocation 1 (%)").
	//
	// A virtual account can carry the same attribute more than once, so values are
	// aggregated with " | ". This is a correlated subquery per attribute — fine for a
	// page of rows, noticeably slower on a large export with several picked.
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

	// Quoted CSV of the attribute names picked in AccountAttributesSelect, for
	// the getAccountAttributeValues IN (...) clause. Returns '' (matches nothing)
	// when none are selected, so the values picker stays empty until a name is
	// chosen. Kept here so the query binding stays a simple function call.
	accountAttrNames: () => {
		const names = (typeof AccountAttributesSelect !== "undefined" && AccountAttributesSelect.selectedOptionValues) || [];
		if (!names.length) return "''";
		return names.map(n => ReportSpecs._quote(n)).join(",");
	},

	// includeGrid: include the AG Grid column filters (default true).
	// excludeField: skip any filter that targets this column alias — used by the
	// set-filter value list (getDistinctValues) so it reflects every OTHER active
	// filter but NOT the column's own selection (otherwise the checkbox list would
	// collapse to just what you already picked). Field→panel-widget mapping is in
	// the `skip(...)` guards below.
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

		// Account status — the status of the utility account itself, which is the one
		// the GL report needs; Location Status above is a different thing. EXISTS
		// rather than a comparison against the SELECT's scalar subquery so the status
		// table's index on virtual_account_id can be used.
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

		// Location name / number — LocationName is a multi-select of the customer's
		// locations (option value = location id), populated by getLocationsForCustomer.
		// It used to be a free-text box that matched name/address/id only, so a typed
		// site number never matched and a combined "Name/Number" string matched
		// nothing at all. The text branch is kept as a fallback (and now also looks at
		// location_number) so the filter still works if the widget is ever swapped
		// back to an input.
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

		// Location attributes (LocationAttributesSelect) — source is the
		// bill_management_v2.location_monthly_attributes_* tables, joined via
		// amf.location_id. Picker shows attribute names; value-level filtering is
		// a second-level picker we haven't added yet, so this no-ops for now.

		// Account attributes = UBM "VA attributes" (Virtual Accounts).
		// AccountAttributesSelect picks attribute NAMES (from
		// virtual_accounts_attributes_metadata); AccountAttributeValuesSelect
		// picks VALUES, each option encoded as name + CHR(31) + value (the unit
		// separator). We group the picked values by attribute name and emit one
		// EXISTS per attribute, so multiple attributes AND together (a VA must
		// match every picked attribute), values within an attribute OR together.
		// (Schema confirmed 2026-06-17: vam = virtual_accounts_attributes_mapping,
		//  vmeta = virtual_accounts_attributes_metadata.)
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

		// ----- AG Grid column filters (header filter menus) -----
		// Applied on top of the Container1 filter panel and ANDed with everything
		// above. The grid persists its filterModel to the store on every page
		// fetch. WHERE can't reference SELECT aliases, so we resolve each field to
		// its raw column expression (the part of the SELECT sql before " AS ").
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
		// Signal "fresh data ready" AFTER the queries resolve. The grid delivers rows
		// only when this changes, so the premature model update from updateModel()
		// (which still holds the previous page's data) is ignored — fixes the grid
		// lagging one fetch behind (stale until a second Run / empty on first load).
		await storeValue("reportsResponseTs", Date.now());
	},

	// ----- Set-filter distinct values (checkbox lists) -----
	// Raw SQL expression for the column the grid is currently asking distinct
	// values for. Whitelisted via allFieldOptions (catalog + picked account
	// attributes, whose names are quoted with _quote), so it's injection-safe.
	distinctExpr: () => {
		const field = appsmith.store.reportsDistinctField;
		const o = ReportSpecs.allFieldOptions().find(x => x.value === field);
		if (!o) return "NULL";
		const i = o.sql.lastIndexOf(" AS ");
		return (i >= 0 ? o.sql.slice(0, i) : o.sql).trim();
	},

	// WHERE for the set-filter value list. Reflects every OTHER active filter
	// (date, panel, and other grid columns) but not the column's own filter — so
	// the checkbox list shows only values present in the currently filtered data,
	// while still letting you (re)select any value that remains available.
	distinctWhere: () => {
		return ReportSpecs.filterClauses(true, appsmith.store.reportsDistinctField);
	},

	// Minimal FROM for the set-filter value query (perf): start from the feed and
	// add only the joins the selected column and the active (non-self) filters
	// actually reference — so a distinct on an amf-only column (utility type, bill
	// type, …) skips the location/vendor joins entirely. location_detail (lt)
	// joins on amf.location_id directly so it never drags in the locations table.
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

	// onOptionChange handler for AccountAttributesSelect. The values query's
	// dependency on the names picker is hidden inside accountAttrNames(), so
	// Appsmith won't auto-re-run it — do it explicitly here. Clear any stale
	// value selections first, then repopulate options and refresh the grid.
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

	// Embed mode passes the customer as ?customer=<fdg_code>. Return a clear message
	// when that link is wrong — a numeric ID, or an unknown code — instead of
	// silently showing an empty report. Returns "" when the param is valid or
	// absent. Reads getCustomers.data, which is fine here: this is only consumed by
	// widget bindings (StatusText), not a query body, so no reactive-dependency
	// concern.
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
		return `${total.toLocaleString()} total rows · Cost Analysis – Trendline`;
	},

	// ----- Export -----
	filenameStem: () => {
		const customer = (CustomerSelect && CustomerSelect.selectedOptionLabel || "customer")
			.toString().replace(/\s+/g, "_");
		const stamp = moment().format("YYYYMMDD-HHmmss");
		return `${customer}-cost-analysis-trendline-${stamp}`;
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

	// Appsmith caps a single query/API response at 5 MB. exportRows used to run
	// unbounded, so any report past roughly 10-15k wide rows died with a
	// "response size exceeds the maximum" error before download() was ever
	// reached. exportRows now takes LIMIT/OFFSET from the store and we stitch
	// the slices together here — no single response gets near the cap, and the
	// finished file can be any size.
	//
	// Pull the full filtered/sorted result set in LIMIT/OFFSET slices — not just
	// the page currently visible in the grid. Returns the accumulated rows, or
	// null if a slice failed outright.
	fetchExportRows: async () => {
		// 5000 rows leaves a ~1 KB/row budget before a slice hits the 5 MB cap.
		// Very wide reports can still blow that, so back off on failure instead
		// of giving up.
		const CHUNK = 5000;
		const MIN_CHUNK = 250;
		// Ceiling on a single export. Past this the browser has to hold the whole
		// CSV in memory as one string before download() can take it, and the tab
		// starts to struggle. Raise it if your users genuinely need more — and
		// raise the exportCsv/exportXlsx action timeouts to match.
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
	// The library-free .xls trick (an HTML table under the Excel mime type) renders
	// as raw markup in Numbers and Sheets, and SheetJS's XLSX.utils is blocked by
	// Appsmith's JS sandbox — so this writes a real .xlsx by hand. An xlsx is just a
	// ZIP of XML parts; entries are stored uncompressed, which costs file size but
	// needs no deflate implementation. Opens natively in Excel, Numbers and Sheets.

	// Columns whose values are identifiers, not measures, and so must stay text: a
	// site number has to survive as "0115" rather than 115, and a GL code as
	// "501480.000" rather than 501480. Account attribute columns are added to this
	// set at build time. Everything else is typed per value (see cellXml below), so
	// charges and consumption still land as numbers and sum in the sheet.
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
		// Attributes are identifiers by default — a GL code of "501480.000" must not
		// become 501480. The exception is a percentage: "GL Allocation 1 (%)" is a
		// measure, and someone checking that a location's allocations total 100 needs
		// it to be a number.
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
		// Identifier columns are text by definition. Anywhere else a numeric-looking
		// value is written as a number, except the two shapes where that would lose
		// information: a leading zero (an identifier, not a measure), and a whole
		// number longer than Excel's 15-digit precision (an account number). Long
		// decimals are left numeric — those are float noise off the feed, and Excel
		// rounding 107.87800000000001 to 107.878 is the right answer.
		const isNumeric = (field, s) => {
			if (alwaysText[field]) return false;
			if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
			if (/^-?0\d/.test(s)) return false;
			return /\./.test(s) || s.replace(/-/g, "").length <= 15;
		};
		// Strings go through the shared-string table rather than inline. This data
		// repeats heavily — the same location, vendor and unit on every row — so one
		// <si> per distinct value and a bare index per cell is far smaller than an
		// inline <is><t>. With entries stored uncompressed that's the difference
		// between a large export producing a file and falling back to CSV.
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

		// Without explicit widths every column falls back to the default ~8 chars, so
		// a location name wraps over five lines and the sheet is unreadable. Size to
		// the widest value, floored so short columns keep a readable header and capped
		// so one long description can't push the rest off screen.
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

		// Without a stylesheet each app picks its own default font, and Numbers picks a
		// large one — so the size is pinned here. Two cell formats: 0 is the body,
		// 1 is the bold header the row above references as s="1". The empty fills and
		// borders are required filler; Excel rejects a stylesheet whose fills list
		// doesn't start with "none" and "gray125".
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
			"CountrySelect", "LocationStatusSelect", "AccountStatusSelect",
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
