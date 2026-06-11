// @ts-nocheck
import * as __fd_glob_18 from "../content/docs/webhooks.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/troubleshooting.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/support.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/rbac-departments.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/overview.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/multi-tenant-saas.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/marketing-tracking.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/integrations.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/hr.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/finance-invoices.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/deployment.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/database-schema.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/crm.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/changelog.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/auth-mfa.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/architecture.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/api-reference.mdx?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, }, {"api-reference.mdx": __fd_glob_1, "architecture.mdx": __fd_glob_2, "auth-mfa.mdx": __fd_glob_3, "changelog.mdx": __fd_glob_4, "crm.mdx": __fd_glob_5, "database-schema.mdx": __fd_glob_6, "deployment.mdx": __fd_glob_7, "finance-invoices.mdx": __fd_glob_8, "hr.mdx": __fd_glob_9, "installation.mdx": __fd_glob_10, "integrations.mdx": __fd_glob_11, "marketing-tracking.mdx": __fd_glob_12, "multi-tenant-saas.mdx": __fd_glob_13, "overview.mdx": __fd_glob_14, "rbac-departments.mdx": __fd_glob_15, "support.mdx": __fd_glob_16, "troubleshooting.mdx": __fd_glob_17, "webhooks.mdx": __fd_glob_18, });