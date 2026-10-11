# Neven Geci

> Cloud Security / Platform Engineer

- **location:** Varaždin, HR
- **email:** gecineven@gmail.com
- **linkedin:** https://www.linkedin.com/in/neven-geci/
- **github:** https://github.com/Nesho99
- **website:** https://nesho99.github.io

Cloud security and platform engineer with 4 years across data platforms, cloud infrastructure and security, from ETL pipelines and a product-wide public API to GxP-validated infrastructure and centralized identity. Came up through QA and security testing, so “what happens when this breaks?” is baked into how I build.

## Experience

### Platform Engineer @ Cognism

<!-- id: cognism -->

*Jul 2025 – Present · Remote*

- Owned the platform for Cognism’s greenfield, product-wide public API end to end: deploying its services, Kubernetes networking, Cloudflare routing and rewrite rules, OpenAPI standardization and the implementation guide, and supporting teams through Kubernetes logging, monitoring, and scheduling issues.
- Built the data layer of the internal developer platform on Port: configured the out-of-the-box GitHub data source, wrote a custom MongoDB Atlas integration, and extended the data model to fit both.
- Integrated Confluent (Kafka) metrics into the Kubernetes monitoring stack and Coralogix and built the KEDA autoscaling proof of concept, laying the groundwork for Kafka monitoring and the more efficient scaling now rolling out.
- Led an organization-wide secret-rotation effort after a vendor vulnerability, coordinating security with multiple backend and frontend teams; used phased rolling windows and lower-environment testing to roll out with zero downtime.
- Diagnosed and resolved networking, timeout, and customer SSO issues across the Cloudflare, Zscaler, and load-balancer stack — tracing root causes such as early load-balancer timeouts and missing logging, then coordinating fixes with developers and customers.
- Administered Zscaler Private Access end to end, from configuration in the Zscaler console to the AWS networking behind it, and delivered a zero-downtime security upgrade of the Zscaler connectors.
- Migrated 5+ ECS clusters, designing a safer cutover strategy after the first move so every later migration ran with zero downtime.
- Designed a Kubernetes-native database migration strategy, extending the Helm chart with Argo CD PreSync jobs so schema migrations run before each rollout and application and database versions stay in step.
- Cut Docker build times by ~60% by building on native architecture instead of emulation, speeding developer iteration and lowering CI cost.

### DevOps Engineer @ Elixirr Digital (ex iOLAP) · for National Resilience

<!-- id: elixirr -->

*Nov 2022 – Jul 2025 · Remote*

- Designed and built GxP-compliant AWS infrastructure in CDK for a US biomanufacturer, with GxP controls encoded directly in code; the platform passed GxP validation.
- Created a reusable CDK stack that provisions a Flyway schema-migration pipeline for any PostgreSQL database, giving teams versioned, repeatable database changes across environments.
- Designed and delivered end-to-end ETL pipelines and integrations across Veeva, Jira, Teams, Planner, SharePoint, OneDrive, Smartsheet, Workday and Tableau, including Starburst data products that fed leadership reporting.
- Ran self-hosted Tableau and Starburst with high availability and disaster recovery, and supported a GxP-compliant SAP deployment.
- Centralized organization-wide permissions in Active Directory as the single source of truth, provisioning access to AWS IAM, Okta and connected apps via SCIM and other integrations; helped run cross-account AWS networking.
- Deployed and maintained Veeam, Zabbix and a range of domain-specific tools across Windows and Linux.

### Quality Assurance Engineer @ iOLAP

<!-- id: iolap -->

*Jul 2022 – Nov 2022 · Remote*

- Prepared and executed manual test cases, administered Office 365 accounts, built test data, and authored automated tests in Cypress.io.

### Quality Assurance Engineer @ Qualis Auri

<!-- id: qualis-auri -->

*Oct 2021 – Jun 2022 · Remote*

- Manual testing and user support for the client Personal Health Insights.

## Skills

| area | stack |
| --- | --- |
| cloud/devops | AWS, Azure, Docker, Kubernetes, ECS, CI/CD, GitHub Actions, GitLab, Nginx, Cloudflare, CloudFront |
| k8s/gitops | Argo CD, FluxCD, Helm, Kustomize, KEDA |
| observability | Grafana, Prometheus, Coralogix |
| iac | CDK, Pulumi, Terraform, Ansible |
| messaging | Kafka, RabbitMQ, Redis |
| systems/net | Linux, Windows Server, Networking, Zscaler, Git |
| data/etl | SQL, PostgreSQL, MongoDB, Flyway, Databricks, Starburst, Trino |
| languages | Python, C#, PHP (Laravel), JavaScript, Bash |
| security/test | Security testing, static code analysis, image scanning, Selenium, Cypress |
| identity | Active Directory, Okta, AWS IAM, SCIM, SSO |
| compliance | GxP, SOC 2 |

## Education

- **degree:** B.Sc. in Information Sciences
- **school:** Faculty of Organization and Informatics, Varaždin
- **year:** 2024
- **thesis:** CTF machines and ethical hacking

## Languages

Croatian (native), English (C1).

## Security scan

| check | target | result |
| --- | --- | --- |
| secret-rotation | org-wide, after vendor vuln | zero downtime |
| zero-trust | Zscaler Private Access + AWS | connectors upgraded, zero downtime |
| identity | AD → AWS IAM, Okta via SCIM | single source of truth |
| edge | Cloudflare, LB, customer SSO | root causes traced, fixed |
| compliance | GxP infra in CDK | passed validation |
| supply-chain | image scanning, static analysis | in the pipeline |
| offense | thesis: CTF machines, ethical hacking | breaks things first |
