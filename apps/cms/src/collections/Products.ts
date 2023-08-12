import { CollectionConfig } from "payload/types";

enum Fields {
  title = "title",
  id = "stripe_id",
}

// Example Collection - For reference only, this must be added to payload.config.ts to be used.
const Products: CollectionConfig = {
  slug: "products",
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: Fields.title,
  },
  fields: [
    {
      name: Fields.title,
      type: "text",
    },
  ],
};

export default Products;
