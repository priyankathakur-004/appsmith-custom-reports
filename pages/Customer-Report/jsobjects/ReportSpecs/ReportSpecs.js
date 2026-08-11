export default {

	visibleFieldOptions: [

		{ group: "Period", value: "month", label: "Month", description: "Billing month bucket (YYYY-MM)", sql: "TO_CHAR(amf.time_period, 'YYYY-MM') AS \"month\"" },
		{ group: "Period", value: "statementDate", label: "Statement Date", description: "Date associated with invoice date.", sql: "TO_CHAR(amf.statement_date, 'YYYY-MM-DD') AS \"statementDate\"" },
		{ group: "Period", value: "startDate", label: "Service Start", description: "Date associated with service start date.", sql: "TO_CHAR(amf.start_date, 'YYYY-MM-DD') AS \"startDate\"" },
		{ group: "Period", value: "endDate", label: "Service End", description: "Date associated with service end date.", sql: "TO_CHAR(amf.end_date, 'YYYY-MM-DD') AS \"endDate\"" },
		{ group: "Period", value: "daysOfService", label: "Days of Service", description: "Number of days associated with days of service.", sql: "amf.days_of_service AS \"daysOfService\"" },

		{ group: "Customer", value: "customerName", label: "Customer Name", description: "Name of the customer the report is being run for", sql: "(SELECT cs.name FROM bill_management_v2.customers_search cs WHERE cs.id = amf.customer_id) AS \"customerName\"" },

		{ group: "Location", value: "location", label: "Location", description: "Location name", sql: "l.name AS \"location\"" },
		{ group: "Location", value: "locationId", label: "Location ID (internal)", description: "UBM's own database id for the location, e.g. 113614. For the site number that appears on your reports, use Location Number.", sql: "l.id AS \"locationId\"" },
		{ group: "Location", value: "locationAddress", label: "Location Address", description: "Street address of the location", sql: "l.address AS \"locationAddress\"" },
		{ group: "Location", value: "locationCity", label: "City", description: "Location city", sql: "l.city AS \"locationCity\"" },
		{ group: "Location", value: "locationState", label: "State/Province", description: "Location state or province", sql: "l.state AS \"locationState\"" },
		{ group: "Location", value: "locationCountry", label: "Country", description: "Location country", sql: "l.country AS \"locationCountry\"" },
		{ group: "Location", value: "locationZip", label: "Location Zip", description: "Location postal / ZIP code", sql: "l.postcode AS \"locationZip\"" },
		{ group: "Location", value: "locationPhone", label: "Location Phone", description: "Phone number recorded against the site. Source: location_detail.location_phone — the locations table itself holds no phone number, so a site missing from location_detail reports blank here.", sql: "lt.location_phone AS \"locationPhone\"" },

		{ group: "Location", value: "locationStatus", label: "Location Status", description: "Status of the site. UBM records an open site as Operational; this is reported as Active to match the client's reports. Closed / Inactive / Terminated report as Inactive, and any other value passes through as UBM stores it.", sql: "CASE WHEN lower(btrim(lt.location_status)) IN ('operational','active','open') THEN 'Active' WHEN lower(btrim(lt.location_status)) IN ('closed','inactive','terminated','cancelled','canceled') THEN 'Inactive' ELSE lt.location_status END AS \"locationStatus\"" },
		{ group: "Location", value: "buildingType", label: "Building Type", description: "Type or category of location building type.", sql: "l.building_type AS \"buildingType\"" },
		{ group: "Location", value: "squareFeet", label: "Square Feet", description: "Location floor area (sq ft)", sql: "l.square_feet AS \"squareFeet\"" },
		{ group: "Location", value: "locationNumber", label: "Location Number", description: "Site number, e.g. 0115 — the number your own reports refer to a location by.", sql: "lt.location_number AS \"locationNumber\"" },

		{ group: "Vendor / Account", value: "vendor", label: "Vendor", description: "Vendor name — the customer's pretty name where one is set, otherwise the global pretty name, otherwise the vendor's plain name. A pretty name that is only the vendor code respelled — Adaya for ADAYA — is skipped, so the real name wins. A vendor code that maps to more than one name in providers_vendors resolves to no name rather than an arbitrary one, and the code is shown instead.", sql: "COALESCE(NULLIF(btrim(cvpn.pretty_name), ''), CASE WHEN lower(regexp_replace(btrim(v.pretty_name), '[^A-Za-z0-9]', '', 'g')) <> lower(regexp_replace(amf.vendor_code, '[^A-Za-z0-9]', '', 'g')) THEN NULLIF(btrim(v.pretty_name), '') END, NULLIF(btrim(cpv.name), ''), NULLIF(btrim(pv.name), ''), amf.vendor_code) AS \"vendor\"" },
		{ group: "Vendor / Account", value: "vendorNameAp", label: "Vendor Name (AP)", description: "Remittance / accounts-payable name for the vendor — the name an ERP such as JDE is most likely to expect", sql: "COALESCE(NULLIF(btrim(cpv.remittance_name), ''), NULLIF(btrim(pv.remittance_name), '')) AS \"vendorNameAp\"" },
		{ group: "Vendor / Account", value: "vendorCode", label: "Vendor Code", description: "Vendor code (stable join key)", sql: "amf.vendor_code AS \"vendorCode\"" },

		{ group: "Vendor / Account", value: "vendorId", label: "Vendor ID", description: "Engie's FIQ Vendor ID, held as a vendor attribute in reports_vendors under the key Vendor Code — 45910 for Access Gas Services, which is the number their report shows. Not vendors.id, which is UBM's own key and a different number entirely.", sql: "rv.fiq_vendor_id AS \"vendorId\"" },

		{ group: "Vendor address", value: "vendorAddress1", label: "Vendor Address 1", description: "First line of the vendor's remittance address. Source: (remittance_address).line_1, from the customer's own vendor record where there is one.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).line_1), ''), NULLIF(btrim((pv.remittance_address).line_1), '')) AS \"vendorAddress1\"" },
		{ group: "Vendor address", value: "vendorAddress2", label: "Vendor Address 2", description: "Second line of the vendor's remittance address. Source: (remittance_address).line_2. Lines 3 and 4 exist in UBM and can be added if a vendor uses them.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).line_2), ''), NULLIF(btrim((pv.remittance_address).line_2), '')) AS \"vendorAddress2\"" },
		{ group: "Vendor address", value: "vendorCity", label: "Vendor City", description: "Vendor's city. Source: (remittance_address).city.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).city), ''), NULLIF(btrim((pv.remittance_address).city), '')) AS \"vendorCity\"" },
		{ group: "Vendor address", value: "vendorState", label: "Vendor State/Province", description: "Vendor's state or province. Source: (remittance_address).state.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).state), ''), NULLIF(btrim((pv.remittance_address).state), '')) AS \"vendorState\"" },
		{ group: "Vendor address", value: "vendorZip", label: "Vendor Postal Code", description: "Vendor's postal / ZIP code. Source: (remittance_address).post_code.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).post_code), ''), NULLIF(btrim((pv.remittance_address).post_code), '')) AS \"vendorZip\"" },
		{ group: "Vendor address", value: "vendorCountry", label: "Vendor Country", description: "Vendor's country. Source: (remittance_address).country.", sql: "COALESCE(NULLIF(btrim((cpv.remittance_address).country), ''), NULLIF(btrim((pv.remittance_address).country), '')) AS \"vendorCountry\"" },

		{ group: "Vendor / Account", value: "accountNumber", label: "Account #", description: "Utility account number as it appears on the bill", sql: "va.account_code AS \"accountNumber\"" },

		{ group: "Vendor / Account", value: "accountStatus", label: "Account Status", description: "Status of the utility account itself — not the location's status. Closed / Inactive / Terminated report as Inactive. UBM's other value is Unknown, meaning no closure has been recorded, and it is passed through rather than read as Active: measured against the client's deactivation list, a large share of the accounts they have deactivated still read Unknown here. Treat Unknown as unreported, not as active.", sql: "CASE WHEN lower(btrim(vas.account_status)) IN ('closed','inactive','terminated','cancelled','canceled') THEN 'Inactive' WHEN lower(btrim(vas.account_status)) IN ('active','open') THEN 'Active' ELSE vas.account_status END AS \"accountStatus\"" },

		{ group: "Vendor / Account", value: "accountCreatedDate", label: "Account Created Date", description: "First month the account was billed — UBM's closest equivalent to the client's FIQ Account Creation Date. UBM holds no account opening date: virtual_accounts.account_opened and virtual_accounts_status.account_opened are both empty, and created_at is the date UBM loaded the record, not the date the account opened.", sql: "TO_CHAR(af.first_period, 'YYYY-MM-DD') AS \"accountCreatedDate\"" },

		{ group: "Vendor / Account", value: "accountActivityDate", label: "Account Activity Date", description: "Date the account's current status took effect — the deactivation date where the account has one, otherwise the first month it was billed. Source: virtual_accounts_status.account_closed, falling back to the feed because no opening date is recorded.", sql: "TO_CHAR(COALESCE(vas.account_closed, af.first_period), 'YYYY-MM-DD') AS \"accountActivityDate\"" },

		{ group: "Vendor / Account", value: "cleanAccountNumber", label: "Clean Account #", description: "Account number with punctuation removed, for matching against systems that store it unformatted. Derived from Account # — UBM stores no clean account number of its own.", sql: "regexp_replace(va.account_code, '[^A-Za-z0-9]', '', 'g') AS \"cleanAccountNumber\"" },
		{ group: "Vendor / Account", value: "summaryAccount", label: "Summary Account", description: "Account this one rolls up to, where it is billed under a parent. Source: virtual_accounts.client_account, shown only where it differs from the account's own number — an account billed in its own right leaves this blank, which is most of them.", sql: "NULLIF(va.client_account, va.account_code) AS \"summaryAccount\"" },
		{ group: "Vendor / Account", value: "meterSerial", label: "Meter #", description: "Meter serial number recorded against the account. Source: virtual_accounts.meter_serial.", sql: "va.meter_serial AS \"meterSerial\"" },

		{ group: "GL", value: "glCode", label: "Customer GL Number", description: "GL code charged for this account, one row per code. Source: the GL Code 1–6 account attributes, unpivoted so an account split across several GL codes reports as several rows. Reported exactly as UBM stores it, including any trailing .000 — the client's exports carry the same suffix, even where Excel's number formatting hides it.", sql: "glr.gl_code AS \"glCode\"" },

		{ group: "GL", value: "glAllocation", label: "GL Allocation %", description: "Share of the account allocated to this row's GL code, as a percentage — 51.25 means 51.25%, and an account charged to a single GL reads 100. The scale is UBM's own, unchanged. Note the client's own exports format these cells as percentages, so Excel shows 51.25% while storing 0.5125 — the same number, not a different scale.", sql: "CASE WHEN btrim(glr.gl_allocation) ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN btrim(glr.gl_allocation)::numeric END AS \"glAllocation\"" },
		{ group: "Vendor / Account", value: "billType", label: "Bill Type", description: "Type or category of bill type.", sql: "amf.bill_type AS \"billType\"" },

		{ group: "Bill", value: "billBeginDate", label: "Begin Date", description: "First day of the bill's service period, as billed. Source: account_history.start_date, which is bill-level — the monthly feed's Service Start is the start of a month's slice of that bill, not the bill itself.", sql: "TO_CHAR(ah.start_date, 'YYYY-MM-DD') AS \"billBeginDate\"" },
		{ group: "Bill", value: "billEndDate", label: "End Date", description: "Last day of the bill's service period, as billed. Source: account_history.end_date. A bill spanning a month end is one row here and two in the monthly feed.", sql: "TO_CHAR(ah.end_date, 'YYYY-MM-DD') AS \"billEndDate\"" },
		{ group: "Bill", value: "billServiceCost", label: "Service Cost", description: "Charges for the bill as billed, not spread across the months it covers. Source: account_history.subcharges — UBM's Subcharges family is per bill block, where the Charges family on the monthly feed is pro-rated.", sql: "ah.subcharges AS \"billServiceCost\"" },
		{ group: "Bill", value: "billQuantity", label: "Quantity (Billed)", description: "Consumption for the bill as billed. Source: account_history.consumption. The monthly feed's Total Consumption is the same quantity pro-rated across months, which is why it reads in fractions where the bill reads whole units.", sql: "CASE WHEN ah.bill_id IS NOT NULL THEN COALESCE(ah.consumption, 0) END AS \"billQuantity\"" },

		{ group: "Vendor / Account", value: "utilityType", label: "Service / Utility Type", description: "Commodity the account is billed for, spelled out the way the client's reports write it — UBM stores NATURALGAS, this reports Natural Gas. Note their reports also use this column for charge categories (Tax, Late Charges, Misc Charges), which UBM does not model as service types at all.", sql: "CASE upper(btrim(amf.utility_type)) WHEN 'ELECTRIC' THEN 'Electric' WHEN 'WATER' THEN 'Water' WHEN 'SEWER' THEN 'Sewer' WHEN 'NATURALGAS' THEN 'Natural Gas' WHEN 'FIREPROTECTION' THEN 'Fire Protection' WHEN 'STORMWATER' THEN 'Storm Water' WHEN 'IRRIGATION' THEN 'Irrigation' WHEN 'LIGHTING' THEN 'Lighting' WHEN 'REFUSE' THEN 'Refuse' WHEN 'SOLARPV' THEN 'Solar PV' WHEN 'CHILLEDWATER' THEN 'Chilled Water' WHEN 'PROPANE' THEN 'Propane' ELSE amf.utility_type END AS \"utilityType\"" },

		{ group: "Usage", value: "uom", label: "Unit of Measure", description: "Unit of measure for consumption (e.g. CCF, KWH)", sql: "amf.total_consumption_uom AS \"uom\"" },
		{ group: "Usage", value: "totalConsumption", label: "Total Consumption", description: "Total metered consumption", sql: "amf.total_consumption AS \"totalConsumption\"" },
		{ group: "Usage", value: "totalGenConsumption", label: "Generation Consumption", description: "On-site generation consumption", sql: "amf.total_gen_consumption AS \"totalGenConsumption\"" },
		{ group: "Usage", value: "demand", label: "Max Demand", description: "Maximum demand (kW)", sql: "amf.max_demand AS \"demand\"" },
		{ group: "Usage", value: "cogenConsumption", label: "Cogeneration Consumption", description: "Cogeneration consumption", sql: "amf.total_cogen_consumption AS \"cogenConsumption\"" },

		{ group: "Usage (time of use)", value: "consumptionOnpeak", label: "Consumption (On-Peak)", description: "Consumption during on-peak hours", sql: "amf.total_consumption_onpeak AS \"consumptionOnpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionMidpeak", label: "Consumption (Mid-Peak)", description: "Consumption during mid-peak hours", sql: "amf.total_consumption_midpeak AS \"consumptionMidpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionOffpeak", label: "Consumption (Off-Peak)", description: "Consumption during off-peak hours", sql: "amf.total_consumption_offpeak AS \"consumptionOffpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionShoulderpeak", label: "Consumption (Shoulder-Peak)", description: "Consumption during shoulder-peak hours", sql: "amf.total_consumption_shoulderpeak AS \"consumptionShoulderpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionSuperpeak", label: "Consumption (Super-Peak)", description: "Consumption during super-peak hours", sql: "amf.total_consumption_superpeak AS \"consumptionSuperpeak\"" },
		{ group: "Usage (time of use)", value: "consumptionSuperoffpeak", label: "Consumption (Super-Off-Peak)", description: "Consumption during super-off-peak hours", sql: "amf.total_consumption_superoffpeak AS \"consumptionSuperoffpeak\"" },

		{ group: "Charges", value: "totalCharges", label: "Total Charges", description: "Monetary value for total charges.", sql: "amf.total_charges AS \"totalCharges\"" },
		{ group: "Charges", value: "totalChargesUsage", label: "Usage Charges", description: "Monetary value for usage charges.", sql: "amf.total_charges_usage AS \"totalChargesUsage\"" },
		{ group: "Charges", value: "totalChargesConsumption", label: "Consumption Charges", description: "Monetary value for consumption charges.", sql: "amf.total_charges_consumption AS \"totalChargesConsumption\"" },
		{ group: "Charges", value: "totalChargesDemand", label: "Demand Charges", description: "Monetary value for demand charges.", sql: "amf.total_charges_demand AS \"totalChargesDemand\"" },
		{ group: "Charges", value: "totalChargesTaxes", label: "Tax Charges", description: "Tax portion of the bill's charges — the column to use for the client's Tax line.", sql: "amf.total_charges_taxes AS \"totalChargesTaxes\"" },

		{ group: "Charges", value: "lateCharges", label: "Late Charges", description: "Late fees on the bill behind this row, net of any recouped fees. A bill covers several report rows, so each row shows its share of the fee rather than the whole amount — the column still adds up correctly.", sql: "((SELECT COALESCE(SUM(li.charge), 0) FROM bill_management_v2.analytics_billing_line_items li WHERE li.bill_id = amf.bill_id AND li.code = 'LATEFEE' AND li.bill_type = 'live') / NULLIF((SELECT COUNT(*) FROM bill_management_v2.analytics_monthly_feed a2 WHERE a2.bill_id = amf.bill_id), 0)) AS \"lateCharges\"" },
		{ group: "Charges", value: "totalChargesCustomer", label: "Customer Charges", description: "Monetary value for customer charges.", sql: "amf.total_charges_customer AS \"totalChargesCustomer\"" },
		{ group: "Charges", value: "totalChargesOther", label: "Other Charges", description: "Charges outside the usage, consumption, demand, tax, customer, generation and commodity buckets — the closest the feed has to a miscellaneous line.", sql: "amf.total_charges_other AS \"totalChargesOther\"" },
		{ group: "Charges", value: "totalChargesGeneration", label: "Generation Charges", description: "Monetary value for generation charges.", sql: "amf.total_charges_generation AS \"totalChargesGeneration\"" },
		{ group: "Charges", value: "totalChargesCommodity", label: "Commodity Charges", description: "Monetary value for commodity charges.", sql: "amf.total_charges_commodity AS \"totalChargesCommodity\"" },
		{ group: "Charges", value: "totalChargesBilledUse", label: "Billed Use Charges", description: "Monetary value for billed usage subcharges.", sql: "amf.total_charges_billeduse AS \"totalChargesBilledUse\"" },

		{ group: "Charges (time of use)", value: "chargesConsumptionOnpeak", label: "Consumption Charges (On-Peak)", description: "Monetary value for onpeak consumption charges.", sql: "amf.total_charges_consumption_onpeak AS \"chargesConsumptionOnpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionMidpeak", label: "Consumption Charges (Mid-Peak)", description: "Monetary value for midpeak consumption charges.", sql: "amf.total_charges_consumption_midpeak AS \"chargesConsumptionMidpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionOffpeak", label: "Consumption Charges (Off-Peak)", description: "Monetary value for offpeak consumption charges.", sql: "amf.total_charges_consumption_offpeak AS \"chargesConsumptionOffpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionShoulderpeak", label: "Consumption Charges (Shoulder-Peak)", description: "Monetary value for shoulderpeak consumption charges.", sql: "amf.total_charges_consumption_shoulderpeak AS \"chargesConsumptionShoulderpeak\"" },
		{ group: "Charges (time of use)", value: "chargesConsumptionSuperpeak", label: "Consumption Charges (Super-Peak)", description: "Monetary value for superpeak consumption charges.", sql: "amf.total_charges_consumption_superpeak AS \"chargesConsumptionSuperpeak\"" },

		{ group: "Weather", value: "totalHdd", label: "Heating Degree Days", description: "Number of days associated with heating degree days.", sql: "amf.total_hdd_billblock AS \"totalHdd\"" },
		{ group: "Weather", value: "totalCdd", label: "Cooling Degree Days", description: "Number of days associated with cooling degree days.", sql: "amf.total_cdd_billblock AS \"totalCdd\"" },
		{ group: "Weather", value: "degreeDaysTotal", label: "Degree Days (Total)", description: "Number of days associated with total degree days.", sql: "amf.total_dd_billblock AS \"degreeDaysTotal\"" },
		{ group: "Weather", value: "kwhPerDd", label: "kWh per Degree Day", description: "kWh per degree day (weather-normalized use)", sql: "amf.kwh_per_dd_billblock AS \"kwhPerDd\"" },
		{ group: "Weather", value: "genKwhPerDd", label: "Gen kWh per Degree Day", description: "Generation kWh per degree day", sql: "amf.gen_kwh_per_dd_billblock AS \"genKwhPerDd\"" }
	],

	defaultVisibleFields: [
		"month", "location", "locationNumber", "utilityType",
		"vendor", "totalCharges", "totalConsumption", "uom"
	],

	FILTER_WIDGETS: [
		"FieldsSelect", "StartDate", "EndDate",
		"LocationName", "StateProvinceSelect",
		"CountrySelect", "LocationStatusSelect",
		"AccountNumberSelect", "AccountStatusSelect",
		"VendorSelect", "ServiceTypesSelect",
		"LocationAttributesSelect", "AccountAttributesSelect",
		"AccountAttributeValuesSelect"
	],

	reportPresets: () => {

		const dupColumns = [
			"locationNumber", "vendorId", "vendor", "utilityType", "accountNumber",
			{ attr: "^gl\\s*code", label: "Customer GL Number" },
			"locationAddress", "billServiceCost", "billBeginDate", "billEndDate", "billQuantity"
		];
		const dup = (value, label, service) => ({
			value: value,
			label: label,
			columns: dupColumns,
			dateColumn: "ah.start_date",
			filters: { utilityType: { match: service } }
		});

		return [

			{ value: "custom", label: "Custom Report", columns: null, filters: {} },

			{
				value: "glAllocations",
				label: "GL Allocations",

				columns: [
					"location", "locationNumber", "vendor", "accountNumber", "accountStatus",
					"utilityType", "glCode", "glAllocation"
				],

				availableExtra: [
					"locationAddress", "locationCity", "locationState", "locationZip",
					"locationCountry", "locationStatus", "vendorCode",
					"vendorAddress1", "vendorAddress2", "vendorCity", "vendorState",
					"vendorZip", "vendorCountry",
					"cleanAccountNumber", "meterSerial",
					"accountCreatedDate", "accountActivityDate",

					"glCode", "glAllocation",
					{ attr: "^gl\\s*code", label: "Customer GL Number", all: true },
					{ attr: "gl\\s*desc", label: "GL Description", all: true },
					{ attr: "gl\\s*alloc", label: "GL % Allocation", all: true }
				],
				filters: {}
			},

			{
				value: "vendorBySite",
				label: "Vendor by Site with Account",
				columns: ["vendor", "vendorId", "locationNumber", "location", "accountNumber"],
				filters: { accountStatus: { neq: ["Closed"] } }
			},

			{
				value: "accountActivity",
				label: "Account Activity",
				columns: [
					"location", "locationNumber", "locationStatus", "vendor", "accountNumber",
					"accountCreatedDate", "glCode", "glAllocation"
				],
				dateColumn: "af.first_period",

				availableExtra: ["cleanAccountNumber"],
				filters: {}
			},

			{
				value: "deactivation",
				label: "Deactivation",
				columns: ["location", "vendor", "accountNumber", "accountActivityDate", "accountStatus"],
				dateColumn: "vas.account_closed",
				filters: { accountStatus: { eq: ["Closed"] } }
			},

			{
				value: "customerFinalBill",
				label: "Customer Final Bill",
				columns: ["vendor", "location", "summaryAccount", "accountNumber"],
				availableExtra: ["customerName"],
				filters: {}
			},

			{
				value: "locationDetail",
				label: "Location Detail",
				columns: [
					"location", "locationNumber", "locationAddress", "locationCity",
					"locationState", "locationZip", "locationCountry", "locationPhone",
					"locationStatus"
				],

				availableExtra: ["squareFeet", "vendor"],
				filters: {}
			},

			{
				value: "accountServiceList",
				label: "Account & Service List",
				columns: [
					"location", "locationNumber", "locationStatus", "vendor",
					"accountNumber", "accountStatus", "summaryAccount", "utilityType"
				],

				availableExtra: [
					"vendorCode", "vendorId", "cleanAccountNumber", "meterSerial",
					"accountCreatedDate", "accountActivityDate",
					"locationAddress", "locationCity", "locationState",
					"locationZip", "locationCountry"
				],
				filters: {}
			},

			{
				value: "invoiceByDate",
				label: "Invoice by Date",
				columns: [
					"location", "locationNumber", "vendor", "accountNumber",
					"month", "statementDate", "startDate", "endDate",
					"totalCharges", "utilityType", "uom", "totalConsumption"
				],

				availableExtra: [
					"summaryAccount", "vendorCode", "billType", "daysOfService",
					"totalChargesUsage", "totalChargesTaxes", "totalChargesOther", "demand"
				],
				filters: {}
			},

			dup("water", "Water", "^\\s*(water|sewer)\\s*$"),
			dup("gas", "Gas", "^\\s*(natural\\s*gas|gas)\\s*$"),
			dup("electric", "Electric", "^\\s*electric(ity)?\\s*$")
		];
	},

	presetOptions: () => ReportSpecs.reportPresets().map(p => ({ label: p.label, value: p.value })),

	activePreset: () => {
		const presets = ReportSpecs.reportPresets();
		const v = (typeof ReportSelect !== "undefined" && ReportSelect.selectedOptionValue) || "custom";
		return presets.find(p => p.value === v) || presets[0];
	},

	_attrNames: () => {
		const rows = (typeof getAccountAttributesList !== "undefined" && getAccountAttributesList.data) || [];
		return (Array.isArray(rows) ? rows : [])
			.map(r => r && r.value)
			.filter(v => v != null && String(v).trim() !== "")
			.map(String);
	},

	_resolveAttr: (spec) => {
		const re = new RegExp(spec.attr, "i");
		const names = ReportSpecs._attrNames()
			.filter(n => re.test(n))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
		if (names.length === 0) return [];
		return (spec.all ? names : names.slice(0, 1)).map(n => ReportSpecs.ATTR_PREFIX + n);
	},

	_resolveSpecs: (specs) => {
		const out = [];
		(specs || []).forEach(c => {
			if (typeof c === "string") { out.push(c); return; }
			ReportSpecs._resolveAttr(c).forEach(a => out.push(a));
		});
		return out;
	},

	presetColumns: () => {
		const p = ReportSpecs.activePreset();
		if (!p || !p.columns) return ReportSpecs.defaultVisibleFields;
		return ReportSpecs._resolveSpecs(p.columns);
	},

	presetAvailable: () => {
		const p = ReportSpecs.activePreset();
		if (!p || !p.columns) return null;
		return p.availableExtra ? p.columns.concat(p.availableExtra) : p.columns;
	},

	presetMissing: () => {
		const p = ReportSpecs.activePreset();
		if (!p || !p.columns) return [];
		return p.columns
			.filter(c => typeof c !== "string" && ReportSpecs._resolveAttr(c).length === 0)
			.map(c => c.label || c.attr);
	},

	showFilter: (name) => {
		if (name !== "accountAttributes") return true;
		const avail = ReportSpecs.presetAvailable();
		if (!avail) return true;
		return ReportSpecs._resolveSpecs(avail).some(v => ReportSpecs.isAttrPick(v));
	},

	_presetFilter: (key, rows) => {
		const p = ReportSpecs.activePreset();
		const spec = (p && p.filters && p.filters[key]) || null;
		if (!spec) return [];
		if (Array.isArray(spec)) return spec;
		const values = (Array.isArray(rows) ? rows : []).map(r => r && r.value).filter(v => v != null);

		const norm = v => String(v).trim().toLowerCase();
		if (spec.eq) {
			const want = spec.eq.map(norm);
			return values.filter(v => want.indexOf(norm(v)) >= 0);
		}
		if (spec.neq) {
			const skip = spec.neq.map(norm);
			return values.filter(v => skip.indexOf(norm(v)) < 0);
		}
		if (spec.not) {
			const skip = new RegExp(spec.not, "i");
			return values.filter(v => !skip.test(String(v)));
		}
		const re = new RegExp(spec.match, "i");
		return values.filter(v => re.test(String(v)));
	},

	presetServiceTypes: () =>
		ReportSpecs._presetFilter("utilityType", (typeof getServiceTypes !== "undefined" && getServiceTypes.data) || []),

	presetAccountStatuses: () =>
		ReportSpecs._presetFilter("accountStatus", (typeof getAccountStatuses !== "undefined" && getAccountStatuses.data) || []),

	selectPreset: async (value) => {
		// The selected report is not stored anywhere — ReportSelect holds it, and a
		// reload takes the widget back to its Custom default. This clears the value
		// earlier versions persisted to the browser, which outlived the session and
		// reopened days later on a page whose filters had been reset around it.
		try { removeValue("reportPreset"); } catch (e) {  }
		for (const w of ReportSpecs.FILTER_WIDGETS) {
			try { resetWidget(w, false); } catch (e) {  }
		}
		await ReportSpecs.refreshGrid();
		const p = ReportSpecs.activePreset();
		if (p && p.value !== "custom") showAlert(`Loaded the ${p.label} report`, "success");
	},

	BILL_FIELDS: ["billBeginDate", "billEndDate", "billServiceCost", "billQuantity"],

	usesBillLevel: () =>
		ReportSpecs.selectedColumns().some(o => ReportSpecs.BILL_FIELDS.indexOf(o.value) >= 0),

	feedKeys: () => {
		const shown = ReportSpecs.selectedColumns();
		if (ReportSpecs.usesBillLevel()) {
			return ["bill_id", "virtual_account_id", "utility_type"];
		}
		if (shown.some(o => /^(Period|Usage|Charges|Weather)/.test(String(o.group || "")))) return null;
		const keys = ["virtual_account_id"];
		if (shown.some(o => o.group === "Location")) keys.push("location_id");
		if (shown.some(o => o.value === "utilityType")) keys.push("utility_type");
		return keys;
	},

	feedCte: () => {
		const cid = ReportSpecs.customerIdSql();
		const src = `FROM bill_management_v2.analytics_monthly_feed WHERE customer_id = ${cid}`;
		const keys = ReportSpecs.feedKeys();
		if (!keys) return `SELECT * ${src}`;
		const k = keys.join(", ");
		return `SELECT DISTINCT ON (${k}) * ${src} ORDER BY ${k}, time_period DESC NULLS LAST`;
	},

	dateFilterColumn: () => {
		const p = ReportSpecs.activePreset();
		const col = (p && p.dateColumn) || "";
		if (!col) return "amf.time_period";

		if (col.indexOf("ah.") === 0 && !ReportSpecs.usesBillLevel()) return "amf.time_period";
		return col;
	},

	GL_ROW_FIELDS: ["glCode", "glAllocation"],

	usesGlRows: () =>
		ReportSpecs.selectedColumns().some(o => ReportSpecs.GL_ROW_FIELDS.indexOf(o.value) >= 0),

	fromClause: () => {
		let sql = ReportSpecs.baseFrom;
		if (ReportSpecs.usesGlRows()) {
			sql += "\n\t\tLEFT JOIN gl_rows glr ON glr.virtual_account_id = amf.virtual_account_id AND glr.gl_code IS NOT NULL";
		}
		if (ReportSpecs.usesBillLevel()) {
			sql += "\n\t\tLEFT JOIN bill_history ah ON ah.bill_id = amf.bill_id AND ah.virtual_account_id = amf.virtual_account_id"
				+ " AND upper(btrim(ah.commodity)) = upper(btrim(amf.utility_type))";
		}

		ReportSpecs.accountAttrColumns().forEach(o => {
			if (!o.joinAlias) return;
			sql += `\n\t\tLEFT JOIN attr_vals ${o.joinAlias} ON ${o.joinAlias}.virtual_account_id = amf.virtual_account_id`
				+ ` AND ${o.joinAlias}.attribute_name = ${ReportSpecs._quote(o.attrName)}`;
		});
		return sql;
	},

	baseFrom:
		`feed_scoped amf
		LEFT JOIN bill_management_v2.locations l ON l.id = amf.location_id
		LEFT JOIN bill_management_v2.location_detail lt ON lt.location_id = l.id
		LEFT JOIN bill_management_v2.virtual_accounts va ON va.id = amf.virtual_account_id
		LEFT JOIN bill_management_v2.vendors v ON v.code = amf.vendor_code
		LEFT JOIN bill_management_v2.customers_vendors_pretty_name cvpn ON cvpn.vendor_id = v.id AND cvpn.customer_id = amf.customer_id
		LEFT JOIN cpv_one cpv ON cpv.code = amf.vendor_code AND cpv.customer_id = amf.customer_id
		LEFT JOIN pv_one pv ON pv.code = amf.vendor_code
		LEFT JOIN vas_one vas ON vas.virtual_account_id = amf.virtual_account_id
		LEFT JOIN rv_one rv ON rv.vendor_code = amf.vendor_code AND rv.customer_id = amf.customer_id
		LEFT JOIN amf_first af ON COALESCE(af.account_code, '') = COALESCE(va.account_code, '') AND COALESCE(af.location_id, -1) = COALESCE(amf.location_id, -1) AND COALESCE(af.vendor_code, '') = COALESCE(amf.vendor_code, '')`,

	orderByClause: "l.id, amf.time_period",

	orderBy: () => {
		const known = ReportSpecs.allFieldOptions().map(o => o.value);
		let model = [];
		try { model = JSON.parse(appsmith.store.reportsSortModel || "[]"); } catch (e) { model = []; }
		const picked = (Array.isArray(model) ? model : []).filter(s => s && known.indexOf(s.colId) >= 0);
		const terms = picked.map(s => `"${s.colId}" ${s.sort === "desc" ? "DESC" : "ASC"}`);
		const cols = ReportSpecs.selectedColumns();
		const varies = cols.some(o => /^(Period|Usage|Charges|Weather)/.test(String(o.group || "")));
		if (varies) {
			return terms.length > 0
				? `${terms.join(", ")}, ${ReportSpecs.orderByClause}`
				: ReportSpecs.orderByClause;
		}
		const seen = {};
		picked.forEach(s => { seen[s.colId] = true; });
		cols.forEach(o => {
			if (!seen[o.value]) { seen[o.value] = true; terms.push(`"${o.value}"`); }
		});
		return terms.length > 0 ? terms.join(", ") : "1";
	},

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

	customerIdSql: () => {
		const v = CustomerSelect && CustomerSelect.selectedOptionValue;
		if (v == null || String(v).trim() === "") return "0";
		const code = String(v).trim().toLowerCase().replace(/'/g, "''");
		return `(SELECT id FROM bill_management_v2.customers_search WHERE LOWER(fdg_code) = '${code}' AND active IS NOT FALSE LIMIT 1)`;
	},

	ATTR_PREFIX: "attr:",

	isAttrPick: (v) => String(v).indexOf(ReportSpecs.ATTR_PREFIX) === 0,

	fieldOptions: () => {
		const scope = ReportSpecs.presetAvailable();
		const allow = scope ? ReportSpecs._resolveSpecs(scope) : null;
		const inScope = (v) => !allow || allow.indexOf(v) >= 0;

		const order = [];
		const byGroup = {};
		ReportSpecs.visibleFieldOptions.forEach(f => {
			if (!inScope(f.value)) return;
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
			.filter(o => inScope(o.value))
			.sort((a, b) => a.label.localeCompare(b.label));
		return catalog.concat(attrs);
	},

	presetAttrLabels: () => {
		const p = ReportSpecs.activePreset();

		return ((p && p.columns) || [])
			.filter(c => typeof c !== "string" && c.label && !c.all)
			.map(c => ({ re: new RegExp(c.attr, "i"), label: c.label }));
	},

	accountAttrColumn: (pick) => {
		const name = String(pick).slice(ReportSpecs.ATTR_PREFIX.length).trim();
		let alias = "attr_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
		if (alias === "attr_") alias = "attr_unnamed";
		return {
			value: alias,
			label: (ReportSpecs.presetAttrLabels().find(s => s.re.test(name)) || {}).label || name,
			description: "Account attribute: " + name,
			attrName: name,
			joinAlias: "av_" + alias,
			sql: `av_${alias}.val AS "${alias}"`
		};
	},

	selectedColumns: () => {
		const picked = (FieldsSelect && FieldsSelect.selectedOptionValues) || [];
		const preset = ReportSpecs.activePreset();
		const fallback = (preset && preset.columns)
			? preset.columns.filter(c => typeof c === "string")
			: ReportSpecs.defaultVisibleFields;
		const fields = (Array.isArray(picked) && picked.length > 0) ? picked : fallback;
		const used = {};
		const out = [];
		fields.forEach(f => {
			const o = ReportSpecs.isAttrPick(f)
				? ReportSpecs.accountAttrColumn(f)
				: ReportSpecs.visibleFieldOptions.find(x => x.value === f);
			if (!o) return;

			if (used[o.value]) { used[o.value]++; out.push(Object.assign({}, o, { value: o.value + "_" + used[o.value] })); }
			else { used[o.value] = 1; out.push(o); }
		});
		return out;
	},

	accountAttrColumns: () => ReportSpecs.selectedColumns().filter(o => String(o.value).indexOf("attr_") === 0),

	allFieldOptions: () => ReportSpecs.visibleFieldOptions.concat(ReportSpecs.accountAttrColumns()),

	gridColumns: () => ReportSpecs.selectedColumns().map(o => o.value),

	selectClause: () => {
		const cols = ReportSpecs.selectedColumns();
		const varies = cols.some(o => /^(Period|Usage|Charges|Weather)/.test(String(o.group || "")));
		const exprs = cols.map(o => o.sql);
		const sql = exprs.length > 0 ? exprs.join(", ") : "1 AS placeholder";
		return varies ? sql : `DISTINCT ${sql}`;
	},

	_quote: v => `'${String(v).replace(/'/g, "''")}'`,
	_inList: (col, values, notIn) => {
		const list = values.map(v => ReportSpecs._quote(v)).join(",");
		return `AND ${col} ${notIn ? "NOT IN" : "IN"} (${list})`;
	},

	accountAttrNames: () => {
		const names = (typeof AccountAttributesSelect !== "undefined" && AccountAttributesSelect.selectedOptionValues) || [];
		if (!names.length) return "''";
		return names.map(n => ReportSpecs._quote(n)).join(",");
	},

	filterClauses: (includeGrid = true, excludeField = null) => {
		const parts = ["WHERE 1=1"];
		const cidSql = ReportSpecs.customerIdSql();

		if (cidSql === "0") return "WHERE 1=0";
		parts.push(`AND amf.customer_id = ${cidSql}`);

		const skip = (aliases) => {
			if (!excludeField) return false;
			return Array.isArray(aliases) ? aliases.indexOf(excludeField) >= 0 : aliases === excludeField;
		};

		const dateCol = ReportSpecs.dateFilterColumn();
		if (StartDate && StartDate.selectedDate) {
			const d = moment(StartDate.selectedDate).startOf("month").format("YYYY-MM-DD");
			parts.push(`AND ${dateCol} >= '${d}'`);
		}
		if (EndDate && EndDate.selectedDate) {
			const d = moment(EndDate.selectedDate).endOf("month").format("YYYY-MM-DD");
			parts.push(`AND ${dateCol} <= '${d}'`);
		}

		const states = (typeof StateProvinceSelect !== "undefined" && StateProvinceSelect.selectedOptionValues) || [];
		if (states.length > 0 && !skip("locationState")) {
			parts.push(ReportSpecs._inList("l.state", states));
		}

		const countries = (typeof CountrySelect !== "undefined" && CountrySelect.selectedOptionValues) || [];
		if (countries.length > 0 && !skip("locationCountry")) {
			parts.push(ReportSpecs._inList("l.country", countries));
		}

		const statuses = (typeof LocationStatusSelect !== "undefined" && LocationStatusSelect.selectedOptionValues) || [];
		if (statuses.length > 0 && !skip("locationStatus")) {
			parts.push(ReportSpecs._inList("lt.location_status", statuses));
		}

		const accounts = (typeof AccountNumberSelect !== "undefined" && AccountNumberSelect.selectedOptionValues) || [];
		if (accounts.length > 0 && !skip("accountNumber")) {
			const list = accounts.map(v => ReportSpecs._quote(v)).join(",");
			parts.push(`AND va.account_code IN (${list})`);
		}

		const acctStatuses = (typeof AccountStatusSelect !== "undefined" && AccountStatusSelect.selectedOptionValues) || [];
		if (!skip("accountStatus")) {
			if (acctStatuses.length > 0) {
				const list = acctStatuses.map(v => ReportSpecs._quote(v)).join(",");
				parts.push(`AND vas.account_status IN (${list})`);
			} else {
				const p = ReportSpecs.activePreset();
				const rule = (p && p.filters && p.filters.accountStatus) || null;
				const list = vs => vs.map(v => ReportSpecs._quote(String(v).trim().toLowerCase())).join(",");
				if (rule && rule.eq) {
					parts.push(`AND lower(btrim(vas.account_status)) IN (${list(rule.eq)})`);
				} else if (rule && rule.neq) {
					parts.push(`AND (vas.account_status IS NULL OR lower(btrim(vas.account_status)) NOT IN (${list(rule.neq)}))`);
				} else if (rule && rule.not) {
					parts.push(`AND (vas.account_status IS NULL OR vas.account_status !~* ${ReportSpecs._quote(rule.not)})`);
				} else if (rule && rule.match) {
					parts.push(`AND vas.account_status ~* ${ReportSpecs._quote(rule.match)}`);
				}
			}
		}

		const vendors = (typeof VendorSelect !== "undefined" && VendorSelect.selectedOptionValues) || [];
		if (vendors.length > 0 && !skip(["vendor", "vendorCode"])) {
			parts.push(ReportSpecs._inList("amf.vendor_code", vendors));
		}

		const services = (typeof ServiceTypesSelect !== "undefined" && ServiceTypesSelect.selectedOptionValues) || [];
		if (services.length > 0 && !skip("utilityType")) {
			parts.push(ReportSpecs._inList("amf.utility_type", services));
		}

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

		const accVals = (typeof AccountAttributeValuesSelect !== "undefined" && AccountAttributeValuesSelect.selectedOptionValues) || [];
		if (accVals.length > 0) {
			const SEP = String.fromCharCode(31);
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
				return "1=0";
			}
			return textCond(expr, c);
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
			if (field === excludeField) return;
			const expr = rawExpr(field);
			if (!expr) return;
			const clause = buildCond(expr, gridModel[field]);
			if (clause) parts.push("AND " + clause);
		});

		return parts.join(" ");
	},

	fetchPage: async () => {
		const m = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const start = Math.max(0, (m && Number(m.pendingStart)) || 0);
		const end = Math.max(start + 1, (m && Number(m.pendingEnd)) || (start + 100));
		await storeValue("reportsPageStart", start);
		await storeValue("reportsPageEnd", end);

		await storeValue("reportsSortModel", (m && m.pendingSort) || "[]");
		await storeValue("reportsFilterModel", (m && m.pendingFilter) || "{}");
		await Promise.all([runReport.run(), runReportCount.run()]);

		await storeValue("reportsResponseTs", Date.now());
	},

	distinctExpr: () => {
		const field = appsmith.store.reportsDistinctField;
		const o = ReportSpecs.allFieldOptions().find(x => x.value === field);
		if (!o) return "NULL";
		const i = o.sql.lastIndexOf(" AS ");
		return (i >= 0 ? o.sql.slice(0, i) : o.sql).trim();
	},

	distinctWhere: () => {
		return ReportSpecs.filterClauses(true, appsmith.store.reportsDistinctField);
	},

	distinctFrom: () => ReportSpecs.fromClause(),

	DISTINCT_CHUNK: () => 5000,

	DISTINCT_MAX: () => 20000,

	distinctLimit: () => {
		const n = Number(appsmith.store.reportsDistinctLimit);
		return (n > 0) ? n : ReportSpecs.DISTINCT_CHUNK();
	},

	distinctOffset: () => Math.max(0, Number(appsmith.store.reportsDistinctOffset) || 0),

	// A column with tens of thousands of distinct values used to come back as one
	// response and get cut off mid-row, which left the checkbox list empty. Page it
	// the way the export does — silently, since this runs while a filter is opening
	// and an alert per chunk would be noise on top of a UI interaction.
	fetchDistinct: async () => {
		const MIN_CHUNK = 250;

		const m = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const field = (m && m.reqDistinctField) || "";
		await storeValue("reportsDistinctField", field);
		await storeValue("reportsDistinctRows", [], false);
		if (!field) {
			await storeValue("reportsDistinctTs", Date.now());
			return;
		}

		const all = [];
		let limit = ReportSpecs.DISTINCT_CHUNK();
		let offset = 0;
		let truncated = false;
		let failed = null;
		for (;;) {
			await storeValue("reportsDistinctLimit", limit, false);
			await storeValue("reportsDistinctOffset", offset, false);
			let batch;
			try {
				const res = await getDistinctValues.run();
				batch = Array.isArray(res) ? res : (getDistinctValues.data || []);
			} catch (e) {

				if (limit > MIN_CHUNK) { limit = Math.max(MIN_CHUNK, Math.floor(limit / 2)); continue; }

				// Out of retries. Say so — silence here is indistinguishable from a
				// column that genuinely has no values, which is what an empty
				// checkbox list looks like.
				failed = (e && e.message) ? String(e.message) : "the query failed";
				break;
			}
			for (const r of batch) all.push(r);

			// Hand the filter what we have before fetching the rest, so the list fills
			// in instead of sitting on Loading until the last chunk. slice() because
			// the store compares by reference and would ignore the same array again.
			await storeValue("reportsDistinctRows", all.slice(), false);
			await storeValue("reportsDistinctTs", Date.now());

			if (batch.length < limit) break;
			offset += batch.length;
			if (all.length >= ReportSpecs.DISTINCT_MAX()) { truncated = true; break; }
		}

		await storeValue("reportsDistinctOffset", 0, false);
		await storeValue("reportsDistinctTruncated", truncated, false);
		await storeValue("reportsDistinctFailed", failed != null && all.length === 0, false);
		await storeValue("reportsDistinctTs", Date.now());

		if (failed != null) {
			showAlert(
				all.length > 0
					? `Only part of the filter list loaded for this column (${all.length.toLocaleString()} values) — ${failed}`
					: `Couldn't load the filter list for this column — ${failed}`,
				"error"
			);
		}
	},

	totalRows: () => {
		const row = runReportCount.data && runReportCount.data[0];
		if (!row) return null;
		const n = Number(row.total);
		return isNaN(n) ? null : n;
	},

	refreshKey: () => Number(appsmith.store.reportsRefreshKey) || 0,

	onAccountAttrChange: async () => {
		resetWidget("AccountAttributeValuesSelect", false);
		getAccountAttributeValues.run();
		await ReportSpecs.refreshGrid();
	},

	refreshGrid: async () => {
		await storeValue("reportsPageStart", 0);
		await storeValue("reportsPageEnd", 100);

		await storeValue("reportsSortModel", "[]");
		await storeValue("reportsFilterModel", "{}");
		await storeValue("reportsRefreshKey", (Number(appsmith.store.reportsRefreshKey) || 0) + 1);
	},

	columnOptions: () => {
		const rows = runReport.data;
		if (!Array.isArray(rows) || rows.length === 0) return ReportSpecs.fieldOptions();
		return Object.keys(rows[0]).map(k => ({ label: k, value: k }));
	},

	customerError: () => {
		const raw = (appsmith.URL && appsmith.URL.queryParams && appsmith.URL.queryParams.customer);
		const code = (raw == null ? "" : String(raw)).trim();
		if (code === "") return "";
		const rows = (typeof getCustomers !== "undefined" && getCustomers.data) || [];
		if (!Array.isArray(rows) || rows.length === 0) return "";
		const lc = code.toLowerCase();
		if (rows.find(r => String(r.fdg_code || "").toLowerCase().trim() === lc)) return "";
		const byId = rows.find(r => String(r.id) === code);
		if (byId) return `This link uses a customer ID (${code}). Use the customer code instead — ?customer=${byId.fdg_code}`;
		return `Unknown customer code "${code}" — no data for this link. Check the ?customer= value in the URL.`;
	},

	status: () => {
		const err = ReportSpecs.customerError();
		if (err) return "⚠️ " + err;
		if (runReport.isLoading) return "Loading...";

		const p = ReportSpecs.activePreset();
		const name = (p && p.value !== "custom") ? p.label + " · " : "";
		const missing = ReportSpecs.presetMissing();
		const warn = missing.length ? ` · ⚠️ this customer has no ${missing.join(" / ")} attribute` : "";

		const total = ReportSpecs.totalRows();
		if (total == null) {
			const chosen = String((CustomerSelect && CustomerSelect.selectedOptionValue) || "").trim();
			return chosen === ""
				? `${name}Pick a customer, then click Run${warn}`
				: `${name}No data loaded — click Run to fetch${warn}`;
		}
		if (total > 0) return `${name}${total.toLocaleString()} total rows${warn}`;

		const code = String((CustomerSelect && CustomerSelect.selectedOptionValue) || "").trim();
		if (code === "") {
			return `${name}⚠️ 0 rows — no customer selected, so the report matches nothing. Pick a customer.`;
		}
		const customers = (typeof getCustomers !== "undefined" && getCustomers.data) || [];
		const hit = (Array.isArray(customers) ? customers : [])
			.find(r => String(r.fdg_code || "").toLowerCase().trim() === code.toLowerCase());
		if (!hit) {

			return `${name}⚠️ 0 rows — the customer code "${code}" doesn't resolve to a customer, so nothing can match it.`;
		}

		const on = [];
		const picked = (w, label) => {
			const v = (w && w.selectedOptionValues) || [];
			if (v.length) on.push(`${label} (${v.length})`);
		};
		if (typeof StartDate !== "undefined" && StartDate && StartDate.selectedDate) on.push("From month");
		if (typeof EndDate !== "undefined" && EndDate && EndDate.selectedDate) on.push("To month");
		picked(typeof LocationName !== "undefined" ? LocationName : null, "Location");
		picked(typeof StateProvinceSelect !== "undefined" ? StateProvinceSelect : null, "State/Province");
		picked(typeof CountrySelect !== "undefined" ? CountrySelect : null, "Country");
		picked(typeof LocationStatusSelect !== "undefined" ? LocationStatusSelect : null, "Location Status");
		picked(typeof AccountNumberSelect !== "undefined" ? AccountNumberSelect : null, "Account #");
		picked(typeof AccountStatusSelect !== "undefined" ? AccountStatusSelect : null, "Account Status");
		picked(typeof VendorSelect !== "undefined" ? VendorSelect : null, "Vendor");
		picked(typeof ServiceTypesSelect !== "undefined" ? ServiceTypesSelect : null, "Service Type");
		picked(typeof AccountAttributeValuesSelect !== "undefined" ? AccountAttributeValuesSelect : null, "Account attribute values");
		let grid = {};
		try { grid = JSON.parse(appsmith.store.reportsFilterModel || "{}"); } catch (e) { grid = {}; }
		const gridCols = Object.keys(grid || {});

		if (gridCols.length) on.push(`column filter on ${gridCols.join(", ")}`);

		if (on.length) {
			return `${name}0 rows — ${hit.name} has nothing matching: ${on.join(" · ")}. Clear one, or press Reset.`;
		}
		return `${name}⚠️ 0 rows — nothing is filtered, so ${hit.name} (customer id ${hit.id}) has no rows in the monthly feed. That is a data question for the UBM team, not a filter one.`;
	},

	filenameStem: () => {
		const customer = (CustomerSelect && CustomerSelect.selectedOptionLabel || "customer")
			.toString().replace(/\s+/g, "_");
		const stamp = moment().format("YYYYMMDD-HHmmss");

		const p = ReportSpecs.activePreset();
		const name = (p && p.value !== "custom") ? p.label.replace(/[^A-Za-z0-9]+/g, "_") : "report";
		return `${customer}-${name}-${stamp}`;
	},

	exportFields: (rows) => {
		const cols = ReportSpecs.gridColumns();
		if (cols.length > 0) return cols;
		return (rows && rows[0]) ? Object.keys(rows[0]) : [];
	},

	exportLabel: (field) => {

		const ov = (appsmith.store.reportsFieldLabels || {})[field];
		if (ov) return ov;
		const o = ReportSpecs.allFieldOptions().find(x => x.value === field);
		return o ? o.label : field;
	},

	fieldCatalog: () => {
		const m = {};
		ReportSpecs.allFieldOptions().forEach(o => { m[o.value] = o.label; });
		return m;
	},

	fieldDescriptions: () => {
		const m = {};
		ReportSpecs.allFieldOptions().forEach(o => { m[o.value] = o.description || ""; });
		return m;
	},

	saveFieldLabel: async () => {
		const g = (typeof GridWidget !== "undefined") ? GridWidget.model : null;
		const field = g && g.renameField;
		if (!field) return;
		const label = (g.renameLabel == null) ? "" : String(g.renameLabel).trim();
		const map = Object.assign({}, appsmith.store.reportsFieldLabels || {});
		if (label) map[field] = label; else delete map[field];
		await storeValue("reportsFieldLabels", map, true);
	},

	fetchExportRows: async () => {

		const CHUNK = 5000;
		const MIN_CHUNK = 250;

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

				if (limit > MIN_CHUNK) {
					limit = Math.max(MIN_CHUNK, Math.floor(limit / 2));
					showAlert(`Rows are wide — retrying in batches of ${limit.toLocaleString()}`, "warning");
					continue;
				}
				showAlert("Export failed: rows are too wide to fetch. Deselect some columns and try again.", "error");
				return null;
			}
			for (const r of batch) all.push(r);

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

	textFields: [
		"locationNumber", "locationZip", "vendorCode", "accountNumber",
		"cleanAccountNumber", "meterSerial", "vendorZip", "locationPhone"
	],

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

	_zip: (files) => {
		const u16 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF]);
		const u32 = n => new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]);
		const DOS_DATE = 0x0021;
		const parts = [];
		const central = [];
		let offset = 0;
		files.forEach(f => {
			const name = ReportSpecs._utf8(f.name);
			const crc = ReportSpecs._crc32(f.data);
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
		const CHUNK = 0x8000;
		for (let i = 0; i < bytes.length; i += CHUNK) {
			bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
		}
		return btoa(bin);
	},

	buildXlsx: (rows, fields) => {
		const alwaysText = {};
		ReportSpecs.textFields.forEach(f => { alwaysText[f] = true; });
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
		const isNumeric = (field, s) => {
			if (alwaysText[field]) return false;
			if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
			if (/^-?0\d/.test(s)) return false;
			return /\./.test(s) || s.replace(/-/g, "").length <= 15;
		};
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
			const label = String(ReportSpecs.exportLabel(f));
			if (label.length > widths[i]) widths[i] = label.length;
			return `<c r="${colName(i)}1" s="1" t="s"><v>${strIndex(label)}</v></c>`;
		}).join("") + "</row>");
		rows.forEach((r, ri) => {
			const n = ri + 2;
			body.push(`<row r="${n}">` + fields.map((f, i) => cellXml(r[f], f, colName(i) + n, i)).join("") + "</row>");
		});

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

	reset: async () => {
		for (const w of ReportSpecs.FILTER_WIDGETS) {
			try { resetWidget(w, false); } catch (e) { /* widget may not exist yet */ }
		}
		await ReportSpecs.refreshGrid();
		const p = ReportSpecs.activePreset();
		showAlert(p && p.value !== "custom" ? `Reset to the ${p.label} report` : "Filters reset", "success");
	}
};
