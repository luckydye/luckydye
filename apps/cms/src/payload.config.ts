import { buildConfig } from 'payload/config';
import path from 'path';
import Examples from './collections/Examples';
import Users from './collections/Users';

const url = process.env.NODE_ENV === 'production' ? 'https://cms.luckydye.de' : 'http://localhost:3001';

export default buildConfig({
  serverURL: url,
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
