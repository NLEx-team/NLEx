# Sprint 4 Reflection

## What We Learned

### From the Trial Release
- Delivering a stable trial release (v2.1.0) with UX improvements validated that addressing UI/UX feedback early increases customer confidence in the product
- Chat folder organization and minimalist UI were effectively implemented by studying established chatbot UX patterns (ChatGPT, Claude, Perplexity), confirming that following proven design conventions accelerates development and improves user acceptance
- Moving schema vectorization to the initial database connection significantly improved the demo and user experience — the connection status flow (yellow → green) provides clear visual feedback

### From the Documentation Review
- The customer confirmed that the Docker Compose deployment instructions were clear and allowed independent deployment without any issues — this validates the documentation approach taken in previous Sprints
- However, per-service documentation for Kubernetes/DevOps deployment is essential for production adoption. Docker Compose bundles all configuration into a shared `.env` file, but production clusters require separate Deployment, ConfigMap, and Secrets for each microservice
- Architecture diagrams and service interconnection documentation are needed for the customer's infrastructure team to plan production deployment
- This customer values documentation as highly as features — an important insight for prioritization

### From the Week 6 Customer Meeting
- The customer considers the product **"a solid solution"** already, which is a strong indicator of feature completeness
- The main blocker to independent customer use is **not product quality but logistics**: the customer needs a stable branch sent to them, plus VPN certificate handling guidance for connecting to production databases
- Chart generation was correctly assessed as resource-intensive and deferred — the customer understood and accepted this prioritization decision
- The customer's interest in MCP (Model Context Protocol) integration for DB-specific query optimization shows they see long-term production potential in the product, which is encouraging
- The customer shared a concrete production use case (ClickHouse table with 1.6 billion rows, 25 GB) that will serve as a real-world benchmark for the product's SQL generation quality

### Transition Blockers Discovered
- The stable release-candidate branch was **not sent to the customer before the meeting** — this was the primary blocker to independent testing and should have been delivered earlier
- The customer needs to install VPN certificates into Docker images to access production databases, which requires clear per-service documentation
- Production database testing with hundreds of gigabytes of data may reveal performance issues or suboptimal query generation that weren't caught in development testing
- The gap between Docker Compose development setup and production Kubernetes deployment is significant and requires dedicated documentation effort

## What Went Well
- All planned Sprint 4 PBIs were completed on schedule
- Customer meeting was highly productive and generated actionable, specific feedback
- UI/UX improvements received positive customer reception — no pushback on any implemented changes
- Hosted documentation (GitHub Pages with MkDocs Material) is live and accessible
- Customer handover documentation was created as a structured, comprehensive document
- Sprint velocity remained consistent (29 SP, compared to 32 SP in Sprint 3)

## What Could Be Improved
- **Should have sent the stable branch earlier**: The customer requested this in the previous meeting, and it was the main reason they hadn't yet tested independently. Delivering it before the Week 6 meeting would have enabled real customer testing feedback during the meeting
- **Per-service deployment documentation should have been prioritized earlier**: This was known to be a customer need but was left as one of the last Sprint 4 items
- **Need to proactively address deployment prerequisites**: VPN certificate installation, custom CA trust configuration, and proxy settings should be documented before the customer encounters them
- **Customer handover documentation should be started earlier in the process**: Starting it at Week 6 feels late; an earlier skeleton would have made the Week 6 version more complete
