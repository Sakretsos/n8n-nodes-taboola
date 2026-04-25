import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
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

	// Used only by the credential test below — the node fetches its own token directly.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				client_id: '={{$credentials.clientId}}',
				client_secret: '={{$credentials.clientSecret}}',
				grant_type: 'client_credentials',
			},
		},
	};

	// Verifies credentials by obtaining an access token from Taboola.
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: 'https://backstage.taboola.com/backstage/oauth/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		},
	};
}
