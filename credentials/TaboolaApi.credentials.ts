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
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://backstage.taboola.com/backstage/oauth/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: `client_id=${encodeURIComponent(credentials.clientId as string)}&client_secret=${encodeURIComponent(credentials.clientSecret as string)}&grant_type=client_credentials`,
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
