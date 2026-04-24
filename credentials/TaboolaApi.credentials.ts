import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class TaboolaApi implements ICredentialType {
	name = 'taboolaApi';

	displayName = 'Taboola API';

	icon: Icon = 'file:../icons/taboola.svg';

	documentationUrl = 'https://developers.taboola.com/backstage-api/reference/welcome';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'The Client ID provided by your Taboola account manager',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The Client Secret provided by your Taboola account manager',
		},
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Taboola advertiser account ID',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const clientId = credentials.clientId as string;
		const clientSecret = credentials.clientSecret as string;
		const accountId = credentials.accountId as string;
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://backstage.taboola.com/backstage/oauth/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials&account_id=${encodeURIComponent(accountId)}`,
		});
		return { accessToken: response.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://backstage.taboola.com/backstage/api/1.0',
			url: '/users/current/allowed-accounts/',
			method: 'GET',
		},
	};
}
