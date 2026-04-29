import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

async function getTaboolaAccessToken(
	helpers: IExecuteFunctions['helpers'],
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const tokenResponse = await helpers.httpRequest({
		method: 'POST',
		url: 'https://backstage.taboola.com/backstage/oauth/token',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
	});
	return tokenResponse.access_token as string;
}

async function tabolaApiRequest(
	helpers: IExecuteFunctions['helpers'],
	accessToken: string,
	options: IHttpRequestOptions,
) {
	return helpers.httpRequest(options);
}

export class Taboola implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Taboola',
		name: 'taboola',
		icon: 'file:../../icons/taboola.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Taboola Backstage API',
		defaults: {
			name: 'Taboola',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'taboolaApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Campaign', value: 'campaign' },
					{ name: 'Campaign Item', value: 'campaignItem' },
					{ name: 'Report', value: 'report' },
				],
				default: 'campaign',
			},

			// ── Account Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', description: 'Get many allowed accounts', action: 'Get many accounts' },
				],
				default: 'getAll',
			},

			// ── Campaign Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['campaign'] } },
				options: [
					{ name: 'Create', value: 'create', description: 'Create a campaign', action: 'Create a campaign' },
					{ name: 'Delete', value: 'delete', description: 'Delete a campaign', action: 'Delete a campaign' },
					{ name: 'Get', value: 'get', description: 'Get a campaign', action: 'Get a campaign' },
					{ name: 'Get Many', value: 'getAll', description: 'Get many campaigns', action: 'Get many campaigns' },
					{ name: 'Update', value: 'update', description: 'Update a campaign', action: 'Update a campaign' },
				],
				default: 'getAll',
			},

			// ── Campaign Item Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['campaignItem'] } },
				options: [
					{ name: 'Create', value: 'create', description: 'Create a campaign item', action: 'Create a campaign item' },
					{ name: 'Delete', value: 'delete', description: 'Delete a campaign item', action: 'Delete a campaign item' },
					{ name: 'Get Many', value: 'getAll', description: 'Get many campaign items', action: 'Get many campaign items' },
					{ name: 'Update', value: 'update', description: 'Update a campaign item', action: 'Update a campaign item' },
				],
				default: 'getAll',
			},

			// ── Report Operations ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['report'] } },
				options: [
					{ name: 'Campaign History', value: 'campaignHistory', description: 'Get campaign history/audit log report', action: 'Get campaign history report' },
					{ name: 'Campaign Summary', value: 'campaignSummary', description: 'Get campaign summary report', action: 'Get campaign summary report' },
					{ name: 'Top Campaign Content', value: 'topCampaignContent', description: 'Get top campaign content report', action: 'Get top campaign content report' },
				],
				default: 'campaignSummary',
			},

			// ── Shared Fields ──
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				default: '',
				required: true,
				description: 'The advertiser account ID',
				displayOptions: {
					hide: { resource: ['account'] },
				},
			},

			// ── Campaign Fields ──
			{
				displayName: 'Campaign ID',
				name: 'campaignId',
				type: 'string',
				default: '',
				required: true,
				description: 'The numeric campaign ID',
				displayOptions: {
					show: {
						resource: ['campaign'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			{
				displayName: 'Campaign Name',
				name: 'campaignName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the campaign',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Brand Text',
				name: 'brandingText',
				type: 'string',
				default: '',
				required: true,
				description: 'The brand name to display with the campaign ads',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'CPC (Cost Per Click)',
				name: 'cpc',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				required: true,
				description: 'Cost per click in the account currency',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Spending Limit',
				name: 'spendingLimit',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				required: true,
				description: 'Total spending limit for the campaign',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Spending Limit Model',
				name: 'spendingLimitModel',
				type: 'options',
				options: [
					{ name: 'Daily', value: 'DAILY' },
					{ name: 'Entire', value: 'ENTIRE' },
					{ name: 'Monthly', value: 'MONTHLY' },
				],
				default: 'ENTIRE',
				description: 'The spending limit model for the campaign',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Bid Strategy',
				name: 'bidStrategy',
				type: 'options',
				options: [
					{ name: 'Fixed CPC', value: 'FIXED' },
					{ name: 'Maximize Conversions', value: 'MAX_CONVERSIONS' },
					{ name: 'Smart', value: 'SMART' },
					{ name: 'Target CPA', value: 'TARGET_CPA' },
				],
				default: 'FIXED',
				required: true,
				description: 'The bid strategy for the campaign',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Marketing Objective',
				name: 'marketingObjective',
				type: 'options',
				options: [
					{ name: 'Brand Awareness', value: 'BRAND_AWARENESS' },
					{ name: 'Drive Website Traffic', value: 'DRIVE_WEBSITE_TRAFFIC' },
					{ name: 'Lead Generation', value: 'LEAD_GENERATION' },
					{ name: 'Online Purchases', value: 'ONLINE_PURCHASES' },
				],
				default: 'DRIVE_WEBSITE_TRAFFIC',
				required: true,
				description: 'The marketing objective for the campaign',
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['campaign'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the campaign is active',
					},
					{
						displayName: 'App Restriction Targeting',
						name: 'app_restriction_targeting',
						type: 'options',
						options: [
							{ name: 'All', value: 'ALL' },
							{ name: 'App', value: 'APP' },
							{ name: 'Web', value: 'WEB' },
						],
						default: 'ALL',
						description: 'Inventory type targeting for the campaign',
					},
					{
						displayName: 'Campaign Group ID',
						name: 'campaign_group_id',
						type: 'number',
						default: 0,
						description: 'The ID of the campaign group to assign this campaign to. If omitted, Taboola auto-creates a new group. You can find group IDs in the Taboola Realize UI or from existing campaign responses.',
					},
					{
						displayName: 'Country Targeting (Codes)',
						name: 'country_targeting',
						type: 'string',
						default: '',
						description: 'Type ALL to target all countries, or comma-separated country codes (e.g. GR,US,DE) to target specific ones',
					},
					{
						displayName: 'Daily Ad Delivery Model',
						name: 'daily_ad_delivery_model',
						type: 'options',
						options: [
							{ name: 'Balanced', value: 'BALANCED' },
							{ name: 'Strict', value: 'STRICT' },
						],
						default: 'BALANCED',
						description: 'How the daily budget is spent. Strict requires a daily_cap value greater than 0.',
					},
					{
						displayName: 'Daily Cap',
						name: 'daily_cap',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'Daily spending cap. Required when Daily Ad Delivery Model is set to Strict. Set to 0 or leave empty for Balanced mode.',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'Campaign end date (YYYY-MM-DD)',
					},
					{
						displayName: 'Platform Targeting',
						name: 'platform_targeting',
						type: 'multiOptions',
						options: [
							{ name: 'Desktop', value: 'DESK' },
							{ name: 'Mobile', value: 'PHON' },
							{ name: 'Tablet', value: 'TBLT' },
						],
						default: [],
						description: 'Which platforms to target',
					},
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Campaign start date (YYYY-MM-DD)',
					},
					{
						displayName: 'Tracking Code',
						name: 'tracking_code',
						type: 'string',
						default: '',
						description: 'URL parameters appended to campaign item URLs for tracking (e.g. utm_source=taboola&utm_medium=referral). Do not add a leading ? or &.',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['campaign'], operation: ['update'] },
				},
				options: [
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the campaign is active',
					},
					{
						displayName: 'App Restriction Targeting',
						name: 'app_restriction_targeting',
						type: 'options',
						options: [
							{ name: 'All', value: 'ALL' },
							{ name: 'App', value: 'APP' },
							{ name: 'Web', value: 'WEB' },
						],
						default: 'ALL',
						description: 'Inventory type targeting for the campaign',
					},
					{
						displayName: 'Campaign Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Updated campaign name',
					},
					{
						displayName: 'Country Targeting (Codes)',
						name: 'country_targeting',
						type: 'string',
						default: '',
						description: 'Type ALL to target all countries, or comma-separated country codes (e.g. GR,US,DE) to target specific ones',
					},
					{
						displayName: 'CPC',
						name: 'cpc',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'Updated cost per click',
					},
					{
						displayName: 'Daily Ad Delivery Model',
						name: 'daily_ad_delivery_model',
						type: 'options',
						options: [
							{ name: 'Balanced', value: 'BALANCED' },
							{ name: 'Strict', value: 'STRICT' },
						],
						default: 'BALANCED',
						description: 'How the daily budget is spent. Strict requires a daily_cap value greater than 0.',
					},
					{
						displayName: 'Daily Cap',
						name: 'daily_cap',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'Daily spending cap. Required when Daily Ad Delivery Model is set to Strict. Set to 0 or leave empty for Balanced mode.',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'Campaign end date (YYYY-MM-DD)',
					},
					{
						displayName: 'Platform Targeting',
						name: 'platform_targeting',
						type: 'multiOptions',
						options: [
							{ name: 'Desktop', value: 'DESK' },
							{ name: 'Mobile', value: 'PHON' },
							{ name: 'Tablet', value: 'TBLT' },
						],
						default: [],
						description: 'Which platforms to target',
					},
					{
						displayName: 'Spending Limit',
						name: 'spending_limit',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'Updated spending limit',
					},
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Campaign start date (YYYY-MM-DD)',
					},
					{
						displayName: 'Tracking Code',
						name: 'tracking_code',
						type: 'string',
						default: '',
						description: 'URL parameters appended to campaign item URLs for tracking (e.g. utm_source=taboola&utm_medium=referral). Do not add a leading ? or &.',
					},
				],
			},

			// ── Campaign Item Fields ──
			{
				displayName: 'Campaign ID',
				name: 'campaignId',
				type: 'string',
				default: '',
				required: true,
				description: 'The numeric campaign ID',
				displayOptions: {
					show: { resource: ['campaignItem'] },
				},
			},
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				description: 'The numeric item ID',
				displayOptions: {
					show: {
						resource: ['campaignItem'],
						operation: ['update', 'delete'],
					},
				},
			},
			{
				displayName: 'URL',
				name: 'itemUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'The landing page URL for the item',
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['create'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'itemAdditionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['create'] },
				},
				options: [
					{
						displayName: 'Creative Crop (JSON)',
						name: 'creative_crop',
						type: 'json',
						default: '',
						description: 'Provide different images for specific aspect ratios. JSON with crop_data array containing ratio and image entries.',
					},
					{
						displayName: 'CTA (Call to Action)',
						name: 'cta',
						type: 'options',
						options: [
							{ name: 'Click Here', value: 'CLICK_HERE' },
							{ name: 'Download', value: 'DOWNLOAD' },
							{ name: 'Get Offer', value: 'GET_OFFER' },
							{ name: 'Get Quote', value: 'GET_QUOTE' },
							{ name: 'Install Now', value: 'INSTALL_NOW' },
							{ name: 'Learn More', value: 'LEARN_MORE' },
							{ name: 'None', value: 'NONE' },
							{ name: 'Play Now', value: 'PLAY_NOW' },
							{ name: 'Read More', value: 'READ_MORE' },
							{ name: 'Search Now', value: 'SEARCH_NOW' },
							{ name: 'Shop Now', value: 'SHOP_NOW' },
							{ name: 'Sign Up', value: 'SIGN_UP' },
							{ name: 'Try Now', value: 'TRY_NOW' },
						],
						default: 'NONE',
						description: 'The call-to-action button for the item',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description text for the campaign item',
					},
					{
						displayName: 'Thumbnail URL',
						name: 'thumbnail_url',
						type: 'string',
						default: '',
						description: 'URL of the thumbnail image',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'The title/headline for the item',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'itemUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['update'] },
				},
				options: [
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the item is active',
					},
					{
						displayName: 'Creative Crop (JSON)',
						name: 'creative_crop',
						type: 'json',
						default: '',
						description: 'Provide different images for specific aspect ratios. JSON with crop_data array containing ratio and image entries.',
					},
					{
						displayName: 'CTA (Call to Action)',
						name: 'cta',
						type: 'options',
						options: [
							{ name: 'Click Here', value: 'CLICK_HERE' },
							{ name: 'Download', value: 'DOWNLOAD' },
							{ name: 'Get Offer', value: 'GET_OFFER' },
							{ name: 'Get Quote', value: 'GET_QUOTE' },
							{ name: 'Install Now', value: 'INSTALL_NOW' },
							{ name: 'Learn More', value: 'LEARN_MORE' },
							{ name: 'None', value: 'NONE' },
							{ name: 'Play Now', value: 'PLAY_NOW' },
							{ name: 'Read More', value: 'READ_MORE' },
							{ name: 'Search Now', value: 'SEARCH_NOW' },
							{ name: 'Shop Now', value: 'SHOP_NOW' },
							{ name: 'Sign Up', value: 'SIGN_UP' },
							{ name: 'Try Now', value: 'TRY_NOW' },
						],
						default: 'NONE',
						description: 'The call-to-action button for the item',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Updated description text for the item',
					},
					{
						displayName: 'Thumbnail URL',
						name: 'thumbnail_url',
						type: 'string',
						default: '',
						description: 'Updated thumbnail image URL',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Updated item title',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Updated landing page URL',
					},
				],
			},

			// ── Report Fields ──
			{
				displayName: 'Dimension',
				name: 'dimension',
				type: 'options',
				options: [
					{ name: 'Browser Breakdown', value: 'browser_breakdown' },
					{ name: 'By Hour of Day', value: 'by_hour_of_day' },
					{ name: 'Campaign Breakdown', value: 'campaign_breakdown' },
					{ name: 'Campaign Day Breakdown', value: 'campaign_day_breakdown' },
					{ name: 'Campaign Hour Breakdown', value: 'campaign_hour_breakdown' },
					{ name: 'Campaign Site Day Breakdown', value: 'campaign_site_day_breakdown' },
					{ name: 'Content Provider Breakdown', value: 'content_provider_breakdown' },
					{ name: 'Content Provider Country Breakdown', value: 'content_provider_country_breakdown' },
					{ name: 'Contextual Breakdown', value: 'contextual_breakdown' },
					{ name: 'Country Breakdown', value: 'country_breakdown' },
					{ name: 'Day', value: 'day' },
					{ name: 'DMA Breakdown', value: 'dma_breakdown' },
					{ name: 'Month', value: 'month' },
					{ name: 'OS Family Breakdown', value: 'os_family_breakdown' },
					{ name: 'OS Version Breakdown', value: 'os_version_breakdown' },
					{ name: 'Platform Breakdown', value: 'platform_breakdown' },
					{ name: 'Region Breakdown', value: 'region_breakdown' },
					{ name: 'Site Breakdown', value: 'site_breakdown' },
					{ name: 'User Segment Breakdown', value: 'user_segment_breakdown' },
					{ name: 'Week', value: 'week' },
				],
				default: 'day',
				description: 'The dimension for the report',
				displayOptions: {
					show: { resource: ['report'], operation: ['campaignSummary'] },
				},
			},
			{
				displayName: 'Dimension',
				name: 'historyDimension',
				type: 'options',
				options: [
					{ name: 'By Account', value: 'by_account' },
					{ name: 'By Campaign', value: 'by_campaign' },
					{ name: 'By Day Count', value: 'by_day_count' },
				],
				default: 'by_campaign',
				description: 'The dimension for the campaign history report',
				displayOptions: {
					show: { resource: ['report'], operation: ['campaignHistory'] },
				},
			},
			{
				displayName: 'Campaign ID',
				name: 'historyCampaignId',
				type: 'string',
				default: '',
				required: true,
				description: 'Campaign ID to filter by (required for by_campaign dimension)',
				displayOptions: {
					show: { resource: ['report'], operation: ['campaignHistory'], historyDimension: ['by_campaign'] },
				},
			},
			{
				displayName: 'Start Date',
				name: 'reportStartDate',
				type: 'string',
				default: '',
				required: true,
				description: 'Report start date (YYYY-MM-DD)',
				displayOptions: {
					show: { resource: ['report'] },
				},
			},
			{
				displayName: 'End Date',
				name: 'reportEndDate',
				type: 'string',
				default: '',
				required: true,
				description: 'Report end date (YYYY-MM-DD)',
				displayOptions: {
					show: { resource: ['report'] },
				},
			},
			{
				displayName: 'Content Filters',
				name: 'contentFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: { resource: ['report'], operation: ['topCampaignContent'] },
				},
				options: [
					{
						displayName: 'Campaign ID',
						name: 'campaign',
						type: 'string',
						default: '',
						description: 'Filter by a specific campaign ID',
					},
				],
			},
			{
				displayName: 'Summary Filters',
				name: 'summaryFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: { resource: ['report'], operation: ['campaignSummary'] },
				},
				options: [
					{
						displayName: 'Campaign ID',
						name: 'campaign',
						type: 'string',
						default: '',
						description: 'Filter by a specific campaign ID',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						description: '2-letter country code as defined by ISO-3166',
					},
					{
						displayName: 'Partner Name',
						name: 'partner_name',
						type: 'string',
						default: '',
						description: 'The data partner (case-sensitive)',
					},
					{
						displayName: 'Platform',
						name: 'platform',
						type: 'options',
						options: [
							{ name: 'Desktop', value: 'DESK' },
							{ name: 'Smartphone', value: 'PHON' },
							{ name: 'Tablet', value: 'TBLT' },
						],
						default: 'DESK',
						description: 'Filter by platform type',
					},
					{
						displayName: 'Site',
						name: 'site',
						type: 'string',
						default: '',
						description: 'Filter by site name (human-readable site name)',
					},
				],
			},
			{
				displayName: 'History Filters',
				name: 'historyFilters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: { resource: ['report'], operation: ['campaignHistory'] },
				},
				options: [
					{
						displayName: 'Activity Code',
						name: 'activity_code',
						type: 'string',
						default: '',
						description: 'Filter by activity code',
					},
					{
						displayName: 'Campaign Group ID',
						name: 'campaigns_group_id',
						type: 'string',
						default: '',
						description: 'Campaign group ID. Use -1 for all.',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 0,
						description: 'Page number for pagination',
					},
					{
						displayName: 'Page Size',
						name: 'page_size',
						type: 'number',
						default: 100,
						description: 'Records per page',
					},
					{
						displayName: 'Performer',
						name: 'performer',
						type: 'string',
						default: '',
						description: 'Filter by performer (partial match, case-insensitive)',
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'string',
						default: '',
						description: 'Sort column and direction',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const baseUrl = 'https://backstage.taboola.com/backstage/api/1.0';

		const credentials = await this.getCredentials('taboolaApi');
		const accessToken = await getTaboolaAccessToken(
			this.helpers,
			credentials.clientId as string,
			credentials.clientSecret as string,
		);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let method: IHttpRequestMethods = 'GET';
				let url = '';
				let body: object | undefined;

				// ── Account ──
				if (resource === 'account') {
					if (operation === 'getAll') {
						url = `${baseUrl}/users/current/allowed-accounts/`;
					}
				}

				// ── Campaign ──
				if (resource === 'campaign') {
					const accountId = this.getNodeParameter('accountId', i) as string;

					if (operation === 'getAll') {
						url = `${baseUrl}/${accountId}/campaigns/`;
					}

					if (operation === 'get') {
						const campaignId = this.getNodeParameter('campaignId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/`;
					}

					if (operation === 'create') {
						method = 'POST';
						url = `${baseUrl}/${accountId}/campaigns/`;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as Record<string, unknown>;

						body = {
							name: this.getNodeParameter('campaignName', i) as string,
							branding_text: this.getNodeParameter('brandingText', i) as string,
							cpc: this.getNodeParameter('cpc', i) as number,
							spending_limit: this.getNodeParameter('spendingLimit', i) as number,
							spending_limit_model: this.getNodeParameter('spendingLimitModel', i) as string,
							bid_strategy: this.getNodeParameter('bidStrategy', i) as string,
							marketing_objective: this.getNodeParameter('marketingObjective', i) as string,
							...additionalFields,
						};

						// Convert app_restriction_targeting to nested structure
						if (additionalFields.app_restriction_targeting) {
							const artValue = additionalFields.app_restriction_targeting as string;
							(body as Record<string, unknown>).app_restriction_targeting = {
								type: artValue === 'ALL' ? 'ALL' : 'INCLUDE',
								value: artValue === 'ALL' ? [] : [artValue],
							};
						}

						// Convert campaign_group_id to the nested structure Taboola expects
						if ((body as Record<string, unknown>).campaign_group_id) {
							(body as Record<string, unknown>).campaign_groups = {
								linked_groups: [{ id: String((body as Record<string, unknown>).campaign_group_id) }],
							};
						}
						delete (body as Record<string, unknown>).campaign_group_id;

						// Handle country_targeting conversion
						if (additionalFields.country_targeting !== undefined) {
							const ctValue = (additionalFields.country_targeting as string).trim().toUpperCase();
							if (ctValue === 'ALL') {
								(body as Record<string, unknown>).country_targeting = { type: 'ALL' };
							} else if (ctValue) {
								(body as Record<string, unknown>).country_targeting = {
									type: 'INCLUDE',
									value: ctValue.split(',').map((c: string) => c.trim()),
								};
							} else {
								delete (body as Record<string, unknown>).country_targeting;
							}
						}

						// Handle platform_targeting conversion
						if (additionalFields.platform_targeting && Array.isArray(additionalFields.platform_targeting)) {
							(body as Record<string, unknown>).platform_targeting = {
								type: 'INCLUDE',
								value: additionalFields.platform_targeting,
							};
						}
					}

					if (operation === 'update') {
						method = 'POST';
						const campaignId = this.getNodeParameter('campaignId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/`;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as Record<string, unknown>;
						body = { ...updateFields };

						// Convert app_restriction_targeting to nested structure
						if (updateFields.app_restriction_targeting) {
							const artValue = updateFields.app_restriction_targeting as string;
							(body as Record<string, unknown>).app_restriction_targeting = {
								type: artValue === 'ALL' ? 'ALL' : 'INCLUDE',
								value: artValue === 'ALL' ? [] : [artValue],
							};
						}

						// Handle country_targeting conversion
						if (updateFields.country_targeting !== undefined) {
							const ctValue = (updateFields.country_targeting as string).trim().toUpperCase();
							if (ctValue === 'ALL') {
								(body as Record<string, unknown>).country_targeting = { type: 'ALL' };
							} else if (ctValue) {
								(body as Record<string, unknown>).country_targeting = {
									type: 'INCLUDE',
									value: ctValue.split(',').map((c: string) => c.trim()),
								};
							} else {
								delete (body as Record<string, unknown>).country_targeting;
							}
						}

						// Handle platform_targeting conversion
						if (updateFields.platform_targeting && Array.isArray(updateFields.platform_targeting)) {
							(body as Record<string, unknown>).platform_targeting = {
								type: 'INCLUDE',
								value: updateFields.platform_targeting,
							};
						}
					}

					if (operation === 'delete') {
						method = 'DELETE';
						const campaignId = this.getNodeParameter('campaignId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/`;
					}
				}

				// ── Campaign Item ──
				if (resource === 'campaignItem') {
					const accountId = this.getNodeParameter('accountId', i) as string;
					const campaignId = this.getNodeParameter('campaignId', i) as string;

					if (operation === 'getAll') {
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/`;
					}

					if (operation === 'create') {
						method = 'POST';
						// Use items/mass endpoint to skip crawling and pass all fields at once
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/mass`;
						const itemData: Record<string, unknown> = {
							url: this.getNodeParameter('itemUrl', i) as string,
						};
						const additionalItemFields = this.getNodeParameter('itemAdditionalFields', i, {}) as Record<string, unknown>;
						if (additionalItemFields.title) itemData.title = additionalItemFields.title;
						if (additionalItemFields.thumbnail_url) itemData.thumbnail_url = additionalItemFields.thumbnail_url;
						if (additionalItemFields.description) itemData.description = additionalItemFields.description;
						if (additionalItemFields.cta && additionalItemFields.cta !== 'NONE') {
							itemData.cta = { cta_type: additionalItemFields.cta };
						}
						if (additionalItemFields.creative_crop) {
							const cc = additionalItemFields.creative_crop;
							itemData.creative_crop = typeof cc === 'string' ? JSON.parse(cc as string) : cc;
						}
						body = { collection: [itemData] };
					}

					if (operation === 'update') {
						method = 'POST';
						const itemId = this.getNodeParameter('itemId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/${itemId}/`;
						body = this.getNodeParameter('itemUpdateFields', i, {}) as object;
						// Convert cta to nested object
						if ((body as Record<string, unknown>).cta) {
							(body as Record<string, unknown>).cta = { cta_type: (body as Record<string, unknown>).cta };
						}
						// Parse creative_crop JSON if provided as string
						if ((body as Record<string, unknown>).creative_crop) {
							const cc = (body as Record<string, unknown>).creative_crop;
							(body as Record<string, unknown>).creative_crop = typeof cc === 'string' ? JSON.parse(cc) : cc;
						}
					}

					if (operation === 'delete') {
						method = 'DELETE';
						const itemId = this.getNodeParameter('itemId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/${itemId}/`;
					}
				}

				// ── Report ──
				if (resource === 'report') {
					const accountId = this.getNodeParameter('accountId', i) as string;
					const startDate = this.getNodeParameter('reportStartDate', i) as string;
					const endDate = this.getNodeParameter('reportEndDate', i) as string;

					if (operation === 'campaignSummary') {
						const dimension = this.getNodeParameter('dimension', i) as string;
						url = `${baseUrl}/${accountId}/reports/campaign-summary/dimensions/${dimension}`;
						url += `?start_date=${startDate}&end_date=${endDate}`;
						const summaryFilters = this.getNodeParameter('summaryFilters', i, {}) as Record<string, unknown>;
						if (summaryFilters.campaign) url += `&campaign=${summaryFilters.campaign}`;
						if (summaryFilters.platform) url += `&platform=${summaryFilters.platform}`;
						if (summaryFilters.country) url += `&country=${summaryFilters.country}`;
						if (summaryFilters.site) url += `&site=${encodeURIComponent(summaryFilters.site as string)}`;
						if (summaryFilters.partner_name) url += `&partner_name=${encodeURIComponent(summaryFilters.partner_name as string)}`;
					}
					if (operation === 'topCampaignContent') {
						url = `${baseUrl}/${accountId}/reports/top-campaign-content/dimensions/item_breakdown`;
						url += `?start_date=${startDate}&end_date=${endDate}`;
						const contentFilters = this.getNodeParameter('contentFilters', i, {}) as Record<string, unknown>;
						if (contentFilters.campaign) url += `&campaign=${contentFilters.campaign}`;
					}
					if (operation === 'campaignHistory') {
						const dimension = this.getNodeParameter('historyDimension', i) as string;
						url = `${baseUrl}/${accountId}/reports/campaign-history/dimensions/${dimension}`;
						url += `?start_date=${startDate}&end_date=${endDate}`;
						if (dimension === 'by_campaign') {
							const campaignId = this.getNodeParameter('historyCampaignId', i) as string;
							url += `&campaign_param=${campaignId}`;
						}
						const filters = this.getNodeParameter('historyFilters', i, {}) as Record<string, unknown>;
						if (filters.activity_code) url += `&activity_code=${filters.activity_code}`;
						if (filters.performer) url += `&performer=${encodeURIComponent(filters.performer as string)}`;
						if (filters.campaigns_group_id) url += `&campaigns_group_id=${filters.campaigns_group_id}`;
						if (filters.page !== undefined) url += `&page=${filters.page}`;
						if (filters.page_size !== undefined) url += `&page_size=${filters.page_size}`;
						if (filters.sort) url += `&sort=${encodeURIComponent(filters.sort as string)}`;
					}
				}

				if (!url) {
					throw new NodeOperationError(this.getNode(), `Unsupported resource/operation: ${resource}/${operation}`, { itemIndex: i });
				}

				const options: IHttpRequestOptions = {
					method,
					url,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				};

				if (body && Object.keys(body).length > 0) {
					options.body = body;
				}

				const response = await tabolaApiRequest(this.helpers, accessToken, options);

				// Handle array results (e.g. from getAll endpoints)
				if (response.results && Array.isArray(response.results)) {
					for (const result of response.results) {
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else if (Array.isArray(response)) {
					for (const result of response) {
						returnData.push({ json: result, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: response, pairedItem: { item: i } });
				}
			} catch (error) {
				const err = error as Error & {
					response?: { status?: number; data?: { message?: string } };
				};
				let message = err.message || 'Unknown error';
				// Extract Taboola API error message and HTTP status from Axios response
				if (err.response?.data?.message) {
					const status = err.response.status ? `HTTP ${err.response.status}: ` : '';
					message = `${status}${err.response.data.message}`;
				}
				if (this.continueOnFail()) {
					returnData.push({ json: { error: message }, pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), message, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
