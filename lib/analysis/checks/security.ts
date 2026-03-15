import type { FindingInput, SecurityData } from "../types";

export function analyzeSecurity(data: SecurityData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (!data.tlsTransportEnabled) {
    findings.push({
      category: "SECURITY",
      severity: "CRITICAL",
      title: "Transport layer TLS is disabled",
      detail:
        "Inter-node communication is unencrypted. Any node in the same network can intercept cluster traffic, including data and credentials.",
      recommendation:
        "Enable TLS for transport: set plugins.security.ssl.transport.enabled: true in opensearch.yml and provide certificates. This requires a cluster restart.",
      docUrl: "https://opensearch.org/docs/latest/security/configuration/tls/",
    });
  }

  if (!data.tlsHttpEnabled) {
    findings.push({
      category: "SECURITY",
      severity: "CRITICAL",
      title: "HTTP layer TLS (HTTPS) is disabled",
      detail:
        "REST API traffic is not encrypted. Credentials and data sent via the REST API are exposed in plaintext.",
      recommendation:
        "Enable HTTPS: set plugins.security.ssl.http.enabled: true in opensearch.yml and provide certificates.",
      docUrl: "https://opensearch.org/docs/latest/security/configuration/tls/",
    });
  }

  if (data.anonymousAccessEnabled) {
    findings.push({
      category: "SECURITY",
      severity: "CRITICAL",
      title: "Anonymous access is enabled",
      detail:
        "Unauthenticated users can access the cluster. All data and operations may be accessible without credentials.",
      recommendation:
        "Disable anonymous access: set plugins.security.allow_default_init_securityindex: false and ensure no anonymous roles are configured in roles_mapping.yml.",
      docUrl: "https://opensearch.org/docs/latest/security/configuration/anonymous-auth/",
    });
  }

  if (!data.authBackendConfigured) {
    findings.push({
      category: "SECURITY",
      severity: "WARNING",
      title: "No authentication backend configured",
      detail:
        "The Security plugin is active but no authentication backend (internal users, LDAP, SAML, OIDC) appears to be configured beyond defaults.",
      recommendation:
        "Configure an authentication backend appropriate for your environment. Use securityadmin.sh to apply the configuration.",
      docUrl: "https://opensearch.org/docs/latest/security/authentication-backends/",
    });
  }

  if (!data.auditLoggingEnabled) {
    findings.push({
      category: "SECURITY",
      severity: "INFO",
      title: "Audit logging is not enabled",
      detail:
        "Audit logging records security events (authentication, authorization, REST/transport requests). Without it, you cannot investigate security incidents.",
      recommendation:
        "Enable audit logging in opensearch.yml: plugins.security.audit.type: internal_opensearch. Configure filters to avoid excessive log volume.",
      docUrl: "https://opensearch.org/docs/latest/security/audit-logs/index/",
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "SECURITY",
      severity: "OK",
      title: "Security configuration looks good",
      detail: "TLS enabled on transport and HTTP, no anonymous access, authentication backend configured.",
      recommendation: "Continue monitoring security configuration as your cluster evolves.",
    });
  }

  return findings;
}
