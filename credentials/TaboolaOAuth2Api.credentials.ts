import type {
	Icon,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TaboolaOAuth2Api implements ICredentialType {
	name = 'taboolaOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Taboola OAuth2 API';

	icon: Icon = { light: 'file:../nodes/Taboola/taboola-light.svg', dark: 'file:../nodes/Taboola/taboola-dark.svg' };

	documentationUrl = 'https://developers.taboola.com/backstage-api/reference/welcome';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://backstage.taboola.com/backstage/oauth/token',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
