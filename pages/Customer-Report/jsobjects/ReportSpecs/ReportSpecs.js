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

		// --- Vendor / bill identity ---
		{ value: "vendor", label: "Vendor", description: "Vendor / utility provider name", sql: "COALESCE(cvn.pretty_name, amf.vendor_code) AS \"vendor\"" },
		{ value: "vendorCode", label: "Vendor Code", description: "Vendor code (stable join key)", sql: "amf.vendor_code AS \"vendorCode\"" },
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
	fromClause:
		`bill_management_v2.analytics_monthly_feed amf
		LEFT JOIN bill_management_v2.locations l ON l.id = amf.location_id
		LEFT JOIN bill_management_v2.location_detail lt ON lt.location_id = l.id
		LEFT JOIN bill_management_v2.customers_providers_pretty_name cvn
			ON cvn.code = amf.vendor_code AND cvn.customer_id = amf.customer_id`,

	// Default ORDER BY (stable paging key) — also the tiebreaker for orderBy().
	orderByClause: "l.id, amf.time_period",

	// Dynamic ORDER BY driven by the AG Grid column sort menu (Sort Ascending /
	// Descending in the header). The grid persists its sortModel to the store on
	// every page fetch; we map each sorted column to its SELECT alias. Postgres
	// allows ORDER BY on output aliases, so sorting by alias is safe. The stable
	// default is always appended as a tiebreaker so paging stays deterministic.
	orderBy: () => {
		const known = ReportSpecs.visibleFieldOptions.map(o => o.value);
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

	// Visible-fields options for the FieldsSelect dropdown.
	fieldOptions: () => ReportSpecs.visibleFieldOptions.map(f => ({ label: f.label, value: f.value })),

	// ----- SELECT builder -----
	selectClause: () => {
		const picked = (FieldsSelect && FieldsSelect.selectedOptionValues) || [];
		const fields = (Array.isArray(picked) && picked.length > 0) ? picked : ReportSpecs.defaultVisibleFields;
		const exprs = fields
			.map(f => ReportSpecs.visibleFieldOptions.find(o => o.value === f))
			.filter(Boolean)
			.map(o => o.sql);
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

		// Location name / number — free text, partial match on name/address or id.
		const loc = (typeof LocationName !== "undefined" && LocationName.text) || "";
		if (loc.trim() !== "" && !skip(["location", "locationAddress", "locationId"])) {
			const safe = String(loc).trim().replace(/'/g, "''");
			parts.push(`AND (l.name ILIKE '%${safe}%' OR l.address ILIKE '%${safe}%' OR CAST(l.id AS TEXT) = '${safe}')`);
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
			const o = ReportSpecs.visibleFieldOptions.find(x => x.value === fieldValue);
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
	// values for. Whitelisted via visibleFieldOptions, so it's injection-safe.
	distinctExpr: () => {
		const field = appsmith.store.reportsDistinctField;
		const o = ReportSpecs.visibleFieldOptions.find(x => x.value === field);
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
		if (/\bcvn\./.test(sql)) parts.push("LEFT JOIN bill_management_v2.customers_providers_pretty_name cvn ON cvn.code = amf.vendor_code AND cvn.customer_id = amf.customer_id");
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
	// columns), falling back to whatever the export query returned.
	exportFields: (rows) => {
		const picked = (FieldsSelect && FieldsSelect.selectedOptionValues) || [];
		if (Array.isArray(picked) && picked.length > 0) return picked;
		return (rows && rows[0]) ? Object.keys(rows[0]) : [];
	},

	exportLabel: (field) => {
		// Honor the user's browser-local column renames, then the catalog label.
		const ov = (appsmith.store.reportsFieldLabels || {})[field];
		if (ov) return ov;
		const o = ReportSpecs.visibleFieldOptions.find(x => x.value === field);
		return o ? o.label : field;
	},

	// ----- Column header renames (browser-local; no DB write) -----
	// Catalog (default) header labels, keyed by field — passed to the grid so it
	// shows friendly names and knows the baseline to reset a rename back to.
	fieldCatalog: () => {
		const m = {};
		ReportSpecs.visibleFieldOptions.forEach(o => { m[o.value] = o.label; });
		return m;
	},

	// Field descriptions keyed by field, mirroring fieldCatalog(). Delivered to the
	// GridWidget model so each AG Grid column header can show an info (ⓘ) icon with
	// this text on hover/click. Sourced from visibleFieldOptions[].description.
	fieldDescriptions: () => {
		const m = {};
		ReportSpecs.visibleFieldOptions.forEach(o => { m[o.value] = o.description || ""; });
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
		// A true binary .xlsx needs a working library, and the installed SheetJS's
		// XLSX.utils is blocked by Appsmith's JS sandbox. The library-free .xls
		// tricks (HTML table / SpreadsheetML) open as raw markup in Numbers/Sheets.
		// A UTF-8-BOM CSV opens natively as a spreadsheet in Excel, Numbers and
		// Sheets — the BOM + CRLF is exactly what Excel expects for clean columns.
		const csv = ReportSpecs.buildCsv(rows, fields, "\r\n");
		const filename = `${ReportSpecs.filenameStem()}.csv`;
		download("\ufeff" + csv, filename, "text/csv;charset=utf-8");
		showAlert(`Exported ${rows.length.toLocaleString()} rows to ${filename}`, "success");
	},

	// Reset all filter widgets and re-fetch from page 1.
	reset: async () => {
		const widgetNames = [
			"FieldsSelect", "StartDate", "EndDate",
			"LocationName", "StateProvinceSelect", "StateNotIn",
			"CountrySelect", "LocationStatusSelect",
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
