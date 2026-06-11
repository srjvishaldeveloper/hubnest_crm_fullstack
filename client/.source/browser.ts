// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"api-reference.mdx": () => import("../content/docs/api-reference.mdx?collection=docs"), "architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "auth-mfa.mdx": () => import("../content/docs/auth-mfa.mdx?collection=docs"), "changelog.mdx": () => import("../content/docs/changelog.mdx?collection=docs"), "crm.mdx": () => import("../content/docs/crm.mdx?collection=docs"), "database-schema.mdx": () => import("../content/docs/database-schema.mdx?collection=docs"), "deployment.mdx": () => import("../content/docs/deployment.mdx?collection=docs"), "finance-invoices.mdx": () => import("../content/docs/finance-invoices.mdx?collection=docs"), "hr.mdx": () => import("../content/docs/hr.mdx?collection=docs"), "installation.mdx": () => import("../content/docs/installation.mdx?collection=docs"), "integrations.mdx": () => import("../content/docs/integrations.mdx?collection=docs"), "marketing-tracking.mdx": () => import("../content/docs/marketing-tracking.mdx?collection=docs"), "multi-tenant-saas.mdx": () => import("../content/docs/multi-tenant-saas.mdx?collection=docs"), "overview.mdx": () => import("../content/docs/overview.mdx?collection=docs"), "rbac-departments.mdx": () => import("../content/docs/rbac-departments.mdx?collection=docs"), "support.mdx": () => import("../content/docs/support.mdx?collection=docs"), "troubleshooting.mdx": () => import("../content/docs/troubleshooting.mdx?collection=docs"), "webhooks.mdx": () => import("../content/docs/webhooks.mdx?collection=docs"), }),
};
export default browserCollections;