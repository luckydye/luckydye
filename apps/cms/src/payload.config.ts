import { buildConfig } from 'payload/config';
import path from 'path';
import Examples from './collections/Examples';
import Users from './collections/Users';

export default buildConfig({
  serverURL: 'http://localhost:3001',
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Examples,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
})
