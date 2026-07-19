[00:13:00:58] Maxim Merkushev: Can you go to the site and log in? Is everything working fine? I just uploaded an update to the site. There wasn't enough time to check it locally.

[00:58:01:19] Serafim Soldatov: So, this is our last week, essentially the final one. After we hold the demo and present the product to everyone, it seems like it's the end. There will be one more story left, but it's online and not critical.

[01:27:01:33] Maxim Merkushev: Well, good, great. Let's get closer to the agenda.

[01:33:01:47] Serafim Soldatov: Yesterday, you and Maxim discussed the final form in which you'll receive the product. We proposed our concepts and reviewed some of them. I'll say right away that completing everything in the one remaining week is problematic. In particular, implementing MTP technology under time constraints is difficult. Nevertheless, we've tried to push through some points and will now present the new final version of our product, the MVP3.0. You'll take another look at it, and then I'll show you the updated Customer Handover. I sent it before as a first draft, but the one I'll show you now is the final description of what you, as the customer, need to know. At the end, we'll also discuss the transition, how the product will end up with you. That's all from me for now; Maxim Merkushev will present the product.

[02:52:03:02] Maxim Merkushev: Overall, I can show it, or you, Nikita, can start a screen share yourself and take a look. Among the new features, we've redone the interface.

[03:08:03:49] Nikita Maksimenko: You show it, that will be more convenient.

[03:08:04:09] Maxim Merkushev: Let me close all unnecessary windows now. I had screen sharing disabled in my settings; I'll rejoin the conference now, I need a reboot.

[04:09:04:31] Serafim Soldatov: Maxim provided our documentation on GitPages. Did he show it to you or not?

[04:20:04:26] Nikita Maksimenko: Yes, I even made a couple of comments on what I'd like to see.

[04:31:05:02] Serafim Soldatov: Okay, great. We'll upload the final report, probably today or tomorrow, as I still need to polish it a bit. In the end, the project history documentation will be complete and quite detailed. Although, we didn't document every specific step of how each process was carried out, because that's a colossal effort for a team doing this for the first time. But all the instructions and everything there is reflected in it.

[05:16:05:54] Maxim Merkushev: Okay, let me start the screen demo now. Can you see the whole screen? So, this is our updated interface. For the admin, database management is available here. If you log in as a regular user, then it's just a new chat. We were aiming for something like ChatGPT – clean, concise, nothing superfluous.

[06:03:06:17] Maxim Merkushev: Database management — here it's only adding, deleting, or checking the database ping. Databases are selected at the new chat stage, right here. For example, we write a query as a table — it thinks and outputs the table. It worked very fast; we optimized that.

[07:05:07:53] Maxim Merkushev: We optimized the Excel export. Initially, we worked through the XLS Writer class, which is quite slow. Previously, exporting 120,000 rows took about two or three minutes. We switched to another, faster class; it works more cleverly: first converting to CSV, then exporting. I'll show you now with a remote database. See, the result was generated in about 13 seconds. Also, a status with the time taken has been added to the export. By the way, it downloaded as HTML here, but locally everything downloads to Excel just fine.

[09:07:09:36] Maxim Merkushev: Locally, when I tested, everything deploys smoothly. The only thing we didn't manage to add is charts. Possibly, I'll add them during the day. But the priority, of course, is for the file to download. We'll fix this bug.

[09:56:10:37] Maxim Merkushev: We also optimized the local deployment. We'll provide a branch — everything is already done in main. Serafim will contact you and write which specific branch to take. Locally, everything deploys well; you just need to edit the .env file: keys, GVT token, admin password. We'll definitely fix this little error. We tested locally and it worked fine, but here on the site there's a bug. Different stages of testing, we had just a little too little time to test it. But we'll fix it.

[11:10:11:53] Maxim Merkushev: User management, all roles, statuses. Regarding roles: the admin's status cannot be changed, so one admin can't go in and change the real admin to a regular user. That's logical. I think that's everything.

[12:20:12:41] Nikita Maksimenko: Can I see the user analytics? Yes, thank you, it's there.

[12:41:13:09] Maxim Merkushev: Also, what was added in earlier versions: if files were saved via links, after restarting the Docker container, their IDs would change, and the Excel file couldn't be downloaded. Now, even if the container restarts, the files still work and download normally. We'll fix it for the web version too; it works locally. Here, it's downloading now.

[13:23:14:18] Nikita Maksimenko: Just a piece of advice. Before designing something, you can look at how others have implemented it. Surely there's some standard. It seems to me that this is usually done differently. You could say you've reinvented the wheel. I don't know if it's good or bad, but just a tip from a designer's perspective.

[14:09:14:32] Maxim Merkushev: Agreed, to not clutter things up, we could just take existing patterns, for example, filters on top, and the history tables below. But that's just food for thought.

[14:41:15:10] Serafim Soldatov: Nikita, I want to ask you. The product is due this week. Do you see any bugs? Is there anything critical we must do?

[15:10:16:18] Nikita Maksimenko: Bugs aside, overall the product quality is satisfactory. From a UI and user story perspective, you've done a very good job; well done, it looks great. From a technical standpoint, unfortunately, due to a huge workload, I haven't had a chance to assess how it really works on large databases. But from what you showed with 120,000 records, and the replacement of the Excel export — I believe it will also be fine on large databases. Right now, I would advise you to focus on finalizing, don't add new features, because a new feature is a new bug, as always. So focus on manual testing, go through everything, see where things aren't right, fix them, and verify not only locally but also in the production environment. Overall, the product quality is satisfactory.

[16:35:16:59] Serafim Soldatov: Excellent. In that case, on a different note: we didn't have time to test it ourselves, but we'll document the product. The status is very important to us. I think we've at least earned "Ready for Independent Use." You'll be able to use this product independently from us, given the documentation we provide. Now, let me show you the updated documentation. We talked a little about charts, and Maxim Maltsev added them.

[17:32:17:59] Nikita Maksimenko: Can I get a screenshot? This wasn't here last time. This is really good. For those who will take the course where you learn to draw such things, they fit very well into documentation. This is great, well done.

[18:07:18:35] Serafim Soldatov: We have several sections, for example, architecture — it's the most diagram-heavy.

[18:18:18:41] Nikita Maksimenko: How did you make these diagrams, just out of curiosity? As far as I can guess, it's Mermaid, but I'm not sure.

[18:35:19:15] Serafim Soldatov: Maxim Maltsev knows for sure; I didn't get the details from him. The diagrams are drawn using Mermaid. Do you have ADRs here?

[19:15:19:51] Nikita Maksimenko: ADR is when you make an architectural decision, it's proposed and recorded in a separate ADR. Honestly, I don't remember exactly what it stands for, but the essence is that it's an architectural decision made at a specific moment. For instance, switching from one parser to another — that's an ADR.

[20:03:20:45] Serafim Soldatov: I specifically didn't formalize such documents because we decided right away that we didn't have those specific technical transitions — we expanded the system, not changed things out. But we discussed the architecture and essentially made decisions, we just didn't document them like that. We're learning, improving our skills. We'll definitely do this in the future, as it's a useful thing.

[20:45:21:29] Nikita Maksimenko: You'll learn about that later on, don't worry. In the presentation you need to prepare for the demo, they ask for a Roadmap. For your MVP, according to semantic versioning, you need to specify PBA. My question is: will you send me your final presentation later? I'd be interested to see it. You have your in-person defense next week? If possible, send it; if I have time, I'll drop in and watch.

[21:50:22:52] Serafim Soldatov: I'll send you the meeting place and time. Let's go through the documentation. Here we have deployment info, slides, diagrams, a Troubleshooting section, various services. A DevOps section and Environment variables. In Development, it describes our MVPs 1, 2, and 3. In Quality, we have our QR and tests aimed at checking product compliance with requirements, User Assessments, Definition of Done. So that's about it for the documentation.

[23:05:23:50] Serafim Soldatov: I also want to show you a small document where everything is brought together. Here it is, the Handover. Here are links to the repository and documentation. We need to fill in the status; we agreed on "Ready for Independent Use." To raise this level, we need confirmation that you have tested it yourself.

[24:11:24:52] Nikita Maksimenko: Yes, I tested your version on the dev database. I embedded the necessary certificates for it all to work. In principle, everything works, you can use it independently, except for the bugs. If you just need a confirmation statement from me — yes, of course.

[24:45:24:52] Serafim Soldatov: Do I understand correctly that you even tested our application on real databases and it worked for you?

[24:51:24:52] Nikita Maksimenko: Yes, of course.

[24:52:26:47] Serafim Soldatov: Excellent, then we will note that. Regarding repository access: we agreed to make it public as Open Source. Should I ask again now: can we make the repository private, or leave it open?

[25:26:26:47] Nikita Maksimenko: Leave it as it is now. I would suggest adding a Contributing page, this is purely for you, not for the course. So that when you apply for internships and such, they can look at this page and see what each of you did — what Serafim did, what Maxim did. This is 100% your portfolio project. If you list it when applying somewhere, they will definitely look at it. Polish the main page a bit better, write what the project is and what it's for. And write who was in what role. That's just advice for the future.

[26:55:28:14] Serafim Soldatov: Regarding the repository — we'll leave it open. The Git Flow documentation is a slightly different document. READMEs are also written, everything's good there. Our deployment is described. Environment variables that you set in the Docker container are also listed. Setup and Verification — the process of launching our application in self-hosting production mode. Verification steps and Recovery — what to do in case of an error. There's a bit about DevOps integration, but it will be deployed via Docker Compose, running in a separate service. We likely won't have time for Kubernetes.

[28:14:29:31] Serafim Soldatov: The most important documents are hosted on a separate page. Quality Requirements, Testing Strategy, User Assessment Test, Roadmap, and Contributing — all in the repository. Here we talk about the current limitations: there's no chart generation yet, but we will add it. The fact that you have to manually configure certificates for some databases — it seems unavoidable.

[29:10:29:43] Nikita Maksimenko: Yes, of course, that will always be there.

[29:13:30:12] Serafim Soldatov: Performance and Scalability: on the databases we have, which are quite large, everything works, and we believe it should also work on very large databases, but again, we didn't have a chance to test it on a really massive scale. MCP integration, as we said, is a large separate topic, and likely would introduce many bugs we wouldn't have time to fix within the course. We need to deliver a finished product. Also, there may be some language issues, which are fixed by switching the language in the settings, but problems can still arise if, for example, you chat in different languages or the database is in one language and your query is in another. We've collected and listed the most common problems that have occurred for us.

[30:32:31:41] Serafim Soldatov: As for support: during the course, we're closing everything out, and you've been in contact with us via Telegram and GitHub Issues. With the repository being public, the Issues will remain, so you can still submit something. But after the course, when it ends, the university virtual machine will also be shut down. You'll be able to go to the login page, but trying to register or log in will result in a "server not available" error. But in any case, you'll be running it locally, so it's not that important.

[31:44:32:37] Serafim Soldatov: The last points are dedicated to the documentation assessment. I'm writing here about "Ready for Independent Use," and we've just shown you everything again. This is a summary of all the documentation with all the links. I'll send you this document.

[32:37:33:22] Nikita Maksimenko: Look, I'm really happy with your work. I didn't know how well you'd handle it, or how much output there would be, which is why there were MVP1 and MVP2. We almost reached "ready to deploy."

[33:22:34:21] Serafim Soldatov: It's been very pleasant working with you, Nikita. For me, as someone taking on such a first project, one we could have been paid real money for if it weren't a training course, this felt like a real adult project. I had to learn a lot during the positioning process. I was handling more of the business analysis, trying to guide the guys, as everyone had different visions, but I needed to establish teamwork. In the end, it seems everything went well: we made the product, there were no quarrels, and we formed very kind working relationships. I don't think this is the end.

[35:28:36:13] Serafim Soldatov: I'll try to become a team lead next, to take on other projects. But it has to be a dedicated effort; it's not just a couple of hours a week. You really need to be constantly in the project, knowing what's in every PR. I didn't have that capacity because the guys write so much, the project is large, and it's more convenient for them to collaborate with each other. But the experience I gained — GitHub Pages, task distribution, writing Issues, documentation — has been very useful. Documentation requires a huge amount of time, essentially being a writer. You have to write what is specifically required, and that is the art of a business analyst. For self-study, I recommend the book "Manage It!".

[37:27:39:03] Maxim Merkushev: I'm very glad I had the opportunity to write such a large, colossal project. It was complex from the start, and the hardest part was designing the application architecture so that everything worked well and smoothly. We basically brought the final product to near-ideal condition, if not for this bug in the web version. I advanced the most in networking: web deployment is quite a complex topic, with the frontend and backend running on different virtual machines. I configured the certificates and the domain. My biggest experience gain in this project was network setup and working with databases.

[39:14:41:33] Nikita Maksimenko: Cool! I'm glad you learned something new. My goal as a customer, and as a former student who also took this course, was to give you a project you could develop, one with its own technical challenges. It's really great that you were able to grow from it. I believe I completely fulfilled my goal. 

[39:44:40:22] Serafim Soldatov: I talk to other students who tell me about their customers, and we haven't had a single problem — no misunderstandings, no issues of any kind. Everything went perfectly. Thank you again for the project and for the opportunity to develop.

[40:22:41:33] Nikita Maksimenko: Thank you! I am waiting for the invitation to the defense. I'm actually returning to Innopolis next Saturday. That's all great, let's wrap up! Well done, tell everyone on the team that they all did great.
