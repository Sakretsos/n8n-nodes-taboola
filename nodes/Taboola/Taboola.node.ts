import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Taboola implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Taboola',
		name: 'taboola',
		icon: 'file:taboola.svg',
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
					{ name: 'Get All', value: 'getAll', description: 'Get all allowed accounts', action: 'Get all accounts' },
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
					{ name: 'Get', value: 'get', description: 'Get a campaign', action: 'Get a campaign' },
					{ name: 'Get All', value: 'getAll', description: 'Get all campaigns', action: 'Get all campaigns' },
					{ name: 'Update', value: 'update', description: 'Update a campaign', action: 'Update a campaign' },
					{ name: 'Delete', value: 'delete', description: 'Delete a campaign', action: 'Delete a campaign' },
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
					{ name: 'Get All', value: 'getAll', description: 'Get all campaign items', action: 'Get all campaign items' },
					{ name: 'Update', value: 'update', description: 'Update a campaign item', action: 'Update a campaign item' },
					{ name: 'Delete', value: 'delete', description: 'Delete a campaign item', action: 'Delete a campaign item' },
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
					{ name: 'Entire', value: 'ENTIRE' },
					{ name: 'Monthly', value: 'MONTHLY' },
					{ name: 'Daily', value: 'DAILY' },
				],
				default: 'ENTIRE',
				description: 'The spending limit model for the campaign',
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
					show: { resource: ['campaign'], operation: ['create', 'update'] },
				},
				options: [
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Campaign start date (YYYY-MM-DD)',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'Campaign end date (YYYY-MM-DD)',
					},
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the campaign is active',
					},
					{
						displayName: 'Daily Ad Delivery Model',
						name: 'daily_ad_delivery_model',
						type: 'options',
						options: [
							{ name: 'Accelerated', value: 'ACCELERATED' },
							{ name: 'Balanced', value: 'BALANCED' },
							{ name: 'Strict', value: 'STRICT' },
						],
						default: 'BALANCED',
						description: 'How the daily budget is spent',
					},
					{
						displayName: 'Marketing Objective',
						name: 'marketing_objective',
						type: 'options',
						options: [
							{ name: 'Brand Awareness', value: 'BRAND_AWARENESS' },
							{ name: 'Drive Website Traffic', value: 'DRIVE_WEBSITE_TRAFFIC' },
							{ name: 'Online Purchases', value: 'ONLINE_PURCHASES' },
							{ name: 'Lead Generation', value: 'LEAD_GENERATION' },
						],
						default: 'DRIVE_WEBSITE_TRAFFIC',
						description: 'The marketing objective for the campaign',
					},
					{
						displayName: 'Country Targeting (Codes)',
						name: 'country_targeting',
						type: 'string',
						default: '',
						description: 'Comma-separated list of country codes to target (e.g. US,UK,DE)',
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
						displayName: 'Campaign Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Updated campaign name',
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
						displayName: 'Spending Limit',
						name: 'spending_limit',
						type: 'number',
						typeOptions: { numberPrecision: 2 },
						default: 0,
						description: 'Updated spending limit',
					},
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the campaign is active',
					},
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Campaign start date (YYYY-MM-DD)',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'Campaign end date (YYYY-MM-DD)',
					},
					{
						displayName: 'Daily Ad Delivery Model',
						name: 'daily_ad_delivery_model',
						type: 'options',
						options: [
							{ name: 'Accelerated', value: 'ACCELERATED' },
							{ name: 'Balanced', value: 'BALANCED' },
							{ name: 'Strict', value: 'STRICT' },
						],
						default: 'BALANCED',
						description: 'How the daily budget is spent',
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
				displayName: 'Title',
				name: 'itemTitle',
				type: 'string',
				default: '',
				description: 'The title/headline for the item',
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['create'] },
				},
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnailUrl',
				type: 'string',
				default: '',
				description: 'URL of the thumbnail image',
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['create'] },
				},
			},
			{
				displayName: 'Item Update Fields',
				name: 'itemUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['campaignItem'], operation: ['update'] },
				},
				options: [
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
					{
						displayName: 'Thumbnail URL',
						name: 'thumbnail_url',
						type: 'string',
						default: '',
						description: 'Updated thumbnail image URL',
					},
					{
						displayName: 'Active',
						name: 'is_active',
						type: 'boolean',
						default: true,
						description: 'Whether the item is active',
					},
				],
			},

			// ── Report Fields ──
			{
				displayName: 'Dimension',
				name: 'dimension',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
				],
				default: 'day',
				description: 'The time dimension for the report',
				displayOptions: {
					show: { resource: ['report'] },
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
				displayName: 'Campaign ID (Optional)',
				name: 'reportCampaignId',
				type: 'string',
				default: '',
				description: 'Filter report by a specific campaign ID',
				displayOptions: {
					show: { resource: ['report'] },
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('taboolaApi');

		// Get access token via OAuth2 client credentials
		const tokenResponse = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://backstage.taboola.com/backstage/oauth/token',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: credentials.clientId as string,
				client_secret: credentials.clientSecret as string,
				grant_type: 'client_credentials',
			}).toString(),
		});

		const accessToken = tokenResponse.access_token as string;
		const baseUrl = 'https://backstage.taboola.com/backstage/api/1.0';

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
							...additionalFields,
						};

						// Handle country_targeting conversion
						if (additionalFields.country_targeting && typeof additionalFields.country_targeting === 'string') {
							(body as Record<string, unknown>).country_targeting = {
								type: 'INCLUDE',
								value: (additionalFields.country_targeting as string).split(',').map((c: string) => c.trim()),
							};
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
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as Record<string, unknown>;
						body = { ...updateFields, ...additionalFields };
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
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/`;
						body = {
							url: this.getNodeParameter('itemUrl', i) as string,
							title: this.getNodeParameter('itemTitle', i, '') as string,
							thumbnail_url: this.getNodeParameter('thumbnailUrl', i, '') as string,
						};
						// Remove empty optional fields
						if (!(body as Record<string, unknown>).title) delete (body as Record<string, unknown>).title;
						if (!(body as Record<string, unknown>).thumbnail_url) delete (body as Record<string, unknown>).thumbnail_url;
					}

					if (operation === 'update') {
						method = 'POST';
						const itemId = this.getNodeParameter('itemId', i) as string;
						url = `${baseUrl}/${accountId}/campaigns/${campaignId}/items/${itemId}/`;
						body = this.getNodeParameter('itemUpdateFields', i, {}) as object;
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
					const dimension = this.getNodeParameter('dimension', i) as string;
					const startDate = this.getNodeParameter('reportStartDate', i) as string;
					const endDate = this.getNodeParameter('reportEndDate', i) as string;
					const campaignId = this.getNodeParameter('reportCampaignId', i, '') as string;

					if (operation === 'campaignSummary') {
						url = `${baseUrl}/${accountId}/reports/campaign-summary/dimensions/${dimension}`;
					}
					if (operation === 'topCampaignContent') {
						url = `${baseUrl}/${accountId}/reports/top-campaign-content/dimensions/${dimension}`;
					}

					url += `?start_date=${startDate}&end_date=${endDate}`;
					if (campaignId) {
						url += `&campaign=${campaignId}`;
					}
				}

				if (!url) {
					throw new NodeOperationError(this.getNode(), `Unsupported resource/operation: ${resource}/${operation}`, { itemIndex: i });
				}

				const options: IHttpRequestOptions = {
					method,
					url,
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				};

				if (body && Object.keys(body).length > 0) {
					options.body = body;
				}

				const response = await this.helpers.httpRequest(options);

				// Handle array results (e.g. from getAll endpoints)
				if (response.results && Array.isArray(response.results)) {
					for (const item of response.results) {
						returnData.push({ json: item });
					}
				} else if (Array.isArray(response)) {
					for (const item of response) {
						returnData.push({ json: item });
					}
				} else {
					returnData.push({ json: response });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
