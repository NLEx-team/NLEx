**Action Items & Notes:**

1. **Refine the Report Preview UX**, using the Perplexity reference as a guide — avoid overloading the screen with too many visible actions at once.

2. **Move database management to a separate sidebar tab** with persistent connections across chats; remove the mandatory DB connection step at the beginning of each chat. (?)

3. **Rely on the model's auto-detection** to identify the correct database; optionally add an "Advanced Settings" toggle for manual database selection.  
**Add a "Test Connection" button** to the Add Database form.

4. **Design the SQL Preview UX thoughtfully** (collapsible element, separate from the business analyst's view) and keep the first-rows preview as a core feature for all users.

5. **Synchronize the design with user stories** (e.g., US-2 and others that are currently missing from the mockups).

6. **Consider raising the priority of US-17** (LLM usage statistics and monitoring dashboard).

7. **Prepare a verified, working instruction for local deployment** along with OpenAI-compatible API support (token, URL, model ID via environment variables).  
**(Version 2.0)** Introduce user roles and an admin panel; add query templates.
