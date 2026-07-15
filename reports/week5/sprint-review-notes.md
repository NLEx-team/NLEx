# Sprint Review Notes

**Date:** 2026-07-05
**Participants:** Maksim Merkushev (Product Owner), Serafim Soldatov (Scrum Master), Customer

*Note: The meeting was conducted, but due to recording issues on the Mac laptop, the sound is absent. We provide these notes instead of the full transcript, alongside the [video recording link](https://drive.google.com/file/d/1RQ0Lvp41GtW0Nbn_r8CdVpDEWLQUe91O/view?usp=sharing).*

## Discussion summary:
During the meeting, we presented MVP 2.0 to the customer. All our UATs covering cross-db requests and the admin panel were passed, and the new functionality was evaluated highly by the customer. However, we received some comments regarding aspects of our product that we can improve in the next sprints.

## Customer Feedback points:
1. **Filters:** Need filters in the analytics table and the user table.
2. **Analytics Timeframes:** Need more accurate analytics for a short period of time (week and day; currently, you can only view a month).
3. **Admin Actions:** Need the ability to block account access via the admin panel.
4. **Security / Usage:** Need restrictions on executing queries directly in SQL.
5. **NoSQL Support:** Strong desire for support for NoSQL databases, specifically MongoDB and MinIO.

The team agreed to deprecate all template-related PBIs (due to a changed vision of the product) and focus the upcoming MVP 3.0 on NoSQL support and the above improvements.
