import path from 'path';
import { buildConfig } from 'payload/config';
import stripePlugin from '@payloadcms/plugin-stripe';
import Products from './collections/Products';
import Users from './collections/Users';

const url =
	process.env.NODE_ENV === 'production' ? 'https://cms.luckydye.de' : 'http://localhost:3001';

export default buildConfig({
	serverURL: url,
	admin: {
		user: Users.slug,
	},
	collections: [Users, Products],
	typescript: {
		outputFile: path.resolve(__dirname, 'payload-types.ts'),
	},
	plugins: [
		stripePlugin({
			logs: true,
			stripeSecretKey: process.env.STRIPE_SECRET_KEY,
			isTestKey: true,
			sync: [
				{
					collection: 'products',
					stripeResourceType: 'products',
					stripeResourceTypeSingular: 'product',
					fields: [
						{
							fieldPath: 'title',
							stripeProperty: 'name',
						},
					],
				},
			],
		}),
	],
});
