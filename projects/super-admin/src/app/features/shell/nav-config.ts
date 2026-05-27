import { SuperAdminRole } from '../../core/models/super-admin-user.model';

export interface NavItem {
  labelKey: string;
  route: string;
  icon: string;
  roles: SuperAdminRole[];
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const ALL_ROLES: SuperAdminRole[] = ['super_admin', 'support_agent', 'finance', 'developer'];
const ADMIN_AND_SUPPORT: SuperAdminRole[] = ['super_admin', 'support_agent'];
const ADMIN_AND_FINANCE: SuperAdminRole[] = ['super_admin', 'finance'];
const ADMIN_AND_DEV: SuperAdminRole[] = ['super_admin', 'developer'];
const ADMIN_ONLY: SuperAdminRole[] = ['super_admin'];

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav.section_platform',
    items: [
      { labelKey: 'nav.overview', route: '/overview', icon: '◉', roles: ALL_ROLES },
      { labelKey: 'nav.leads', route: '/leads', icon: '🌱', roles: ADMIN_AND_SUPPORT },
      { labelKey: 'nav.tenants', route: '/tenants', icon: '🏢', roles: ALL_ROLES },
    ],
  },
  {
    titleKey: 'nav.section_business',
    items: [
      { labelKey: 'nav.subscriptions', route: '/subscriptions', icon: '🔄', roles: ADMIN_AND_FINANCE },
      { labelKey: 'nav.billing', route: '/billing', icon: '💳', roles: ADMIN_AND_FINANCE },
      { labelKey: 'nav.commission', route: '/commission', icon: '📈', roles: ADMIN_AND_FINANCE },
      { labelKey: 'nav.invoices', route: '/invoices', icon: '🧾', roles: ADMIN_AND_FINANCE },
    ],
  },
  {
    titleKey: 'nav.section_config',
    items: [
      { labelKey: 'nav.feature_flags', route: '/feature-flags', icon: '🚩', roles: ADMIN_AND_DEV },
      { labelKey: 'nav.templates', route: '/templates', icon: '🎨', roles: ADMIN_ONLY },
      { labelKey: 'nav.plans', route: '/plans', icon: '💼', roles: ADMIN_AND_FINANCE },
      { labelKey: 'nav.delivery_providers', route: '/delivery-providers', icon: '🚚', roles: ADMIN_ONLY },
      { labelKey: 'nav.payment_gateways', route: '/payment-gateways', icon: '💱', roles: ADMIN_AND_FINANCE },
      { labelKey: 'nav.comms_providers', route: '/comms-providers', icon: '✉️', roles: ADMIN_ONLY },
    ],
  },
  {
    titleKey: 'nav.section_monitoring',
    items: [
      { labelKey: 'nav.health', route: '/health', icon: '🩺', roles: [...ADMIN_AND_DEV] },
      { labelKey: 'nav.audit_log', route: '/audit-log', icon: '📜', roles: ALL_ROLES },
      { labelKey: 'nav.jobs', route: '/jobs', icon: '⚙️', roles: ADMIN_AND_DEV },
      { labelKey: 'nav.errors', route: '/errors', icon: '⚠️', roles: ADMIN_AND_DEV },
    ],
  },
  {
    titleKey: 'nav.section_admin',
    items: [
      { labelKey: 'nav.users', route: '/users', icon: '👤', roles: ADMIN_ONLY },
      { labelKey: 'nav.settings', route: '/settings', icon: '🔧', roles: ADMIN_ONLY },
    ],
  },
];
