# Customer Meeting Notes — Supplementary Action Items

> **Note:** The customer permitted recording and the publication of the sanitized
> English transcript in this repository. The transcript at
> [`customer-meeting-transcript.md`](customer-meeting-transcript.md) is the primary
> evidence of the meeting. The structured meeting summary is in
> [`customer-meeting-summary.md`](customer-meeting-summary.md).
>
> This file contains supplementary action items captured live during the meeting
> by Polina Systerova. It is kept for traceability but is **not** a replacement
> for the transcript or the summary.

**Date:** 13 June 2026
**Captured by:** Polina Systerova
**Status:** Supplementary notes (transcript is the primary evidence)

---

## Action Items

1. **Refine the Reply Preview UX**, using the Perplexity reference as a guide —
   avoid overloading the screen with too many visible actions at once.
   *Owner: Liubov Savchenko. Related stories: US-04, US-08.*

2. **Move database management to a separate sidebar tab** with persistent
   connections across chats; remove the mandatory DB connection step at the
   beginning of each chat.
   *Owner: Liubov Savchenko, Maksim Maltsev. Related stories: US-02, US-06.*

3. **Rely on the model's auto-detection** to identify the correct database;
   optionally add an "Advanced Settings" toggle for manual database selection.
   *Owner: Maksim Merkushev, Ramina Yanturina. Related stories: US-02, US-05, US-12.*

4. **Add a "Test Connection" button** to the Add Database form.
   *Owner: Liubov Savchenko, Maksim Maltsev. Related stories: US-07.*

5. **Design the SQL Preview UX thoughtfully** (collapsible element, separate
   from the business analyst's view) and keep the first-rows preview as a core
   feature for all users.
   *Owner: Liubov Savchenko. Related stories: US-04, US-08.*

6. **Synchronize the design with user stories** — particularly US-02, which is
   currently missing from the Figma mockups.
   *Owner: Liubov Savchenko, Serafim Soldatov. Related stories: US-02.*

7. **Consider raising the priority of US-17** (LLM usage statistics and
   monitoring dashboard) per the customer's strong recommendation.
   *Owner: Serafim Soldatov. Decision deferred to Sprint 2 planning.*

8. **Prepare a verified, working instruction for local deployment** along with
   OpenAI-compatible API support (token, URL, model ID via environment
   variables).
   *Owner: Maksim Maltsev. Related stories: US-06, US-07.*

9. **(Targeted at MVP v2)** Introduce user roles and an admin panel; add query
   templates.
   *Owner: TBD. Related stories: US-14, US-15, US-16, US-17.*

---

## Decisions Captured

- The project is confirmed as open source under the MIT license. Written
  consent was obtained from the customer via Telegram before repository
  creation and is reproduced as a screenshot at
  [`images/MIT-permission.png`](images/MIT-permission.png).
- The customer permitted recording of the meeting, private sharing of the
  sanitized transcript with course instructors, and publication of the
  sanitized transcript in the repository.
- The next customer meeting is scheduled for Thursday of Week 3, after 1–2 PM.
