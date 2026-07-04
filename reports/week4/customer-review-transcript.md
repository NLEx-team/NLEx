[00:00:00:10] **Serafim Soldatov**: Should I show you MVP1, or rather, will you open and test it yourself? After all, it's already a product.

[00:10:00:30] **Nikita Maksimenko**: To be honest, I haven't had time to click around myself. Let me share my screen, I'll test it, and you can guide me if needed. So, you should be seeing NLEx. Do you see it?

[00:30:01:34] **Maxim Merkushev**: Yes, I can see the browser. Now the whole screen is visible, everything is fine. The registration page opened, now the chat. On the left, there is the history and the database list. If you open the list, there's "Test BD" — this is the database running locally in Docker. The next one, "Remote Test BD", is a remote database. I connected it, but it doesn't always work stably because the server is free. If you are going to test it now, it's better to choose "Test BD". "Remote Test BD" should work too, but because of the free tier, it might respond with delays.

[01:34:01:38] **Nikita Maksimenko**: Got it. So this is...

[01:38:01:59] **Maxim Merkushev**: This is our database list. Only an admin can add new databases. That is, if you log in under an admin profile, an "Add Database" button will appear above the list, allowing you to add a new DB. Like this.

[01:59:02:06] **Nikita Maksimenko**: Well, let's try. As I recall, there was something about actors in the test database.

[02:06:02:25] **Maxim Merkushev**: You can, for example, ask the neural network to output a list of tables, and then proceed from there. It's better to specify in the request exactly which database to take the information from, because there are two of them.

[02:25:02:27] **Nikita Maksimenko**: Okay, but where do I specify that?

[02:27:02:34] **Maxim Merkushev**: On the left in the "Database list" menu. Or you can just write a prompt in the chat, and the system will most likely ask you which database you want to get the data from.

[02:34:02:40] **Nikita Maksimenko**: I see. I just don't have a specific button here to select the database before making a request.

[02:40:02:42] **Serafim Soldatov**: Oh, right, we will add that functionality.

[02:42:02:56] **Maxim Merkushev**: It's just that for now, we've been testing this via direct text requests in the chat. So you write a prompt: "Output the table names and columns from the Test BD database," for example.

[02:56:03:18] **Serafim Soldatov**: As far as I remember, we discussed that there would be an "Advanced Settings" section somewhere here, and I think Lyuba showed it in the design. At least, that's how I remember it. We will definitely add and implement the database selection via the interface.

[03:18:04:53] **Maxim Merkushev**: We also want to add an AI mode toggle: fast and "thinking". In the fast mode, a lightweight model like GPT-4o-mini will be used, and in the "thinking" mode, a more powerful model for complex requests. And the most important thing is that the neural network keeps the context. You don't need to write which database it should connect to every time. If it doesn't understand something in your request, it will offer response options and clarify what exactly you mean. Buttons with options will appear, and you just click the right one. This way it will clarify what you specifically meant.

[05:01:05:05] **Nikita Maksimenko**: Funny. But don't you think the response is taking a bit long to generate?

[05:05:05:27] **Maxim Merkushev**: That's most likely using the base model. We will also test it on a more powerful, "thinking" version, but its response delay will be slightly longer — it needs more time to generate.

[05:27:05:35] **Nikita Maksimenko**: Look, it substituted the table name and its columns from the context. So, in fact, it didn't make a direct query to the DB itself to get the schema, but took everything from the context?

[05:35:05:47] **Maxim Merkushev**: Yes, it didn't access the DB directly, but output the structure from the existing context. We did this for speed. But we can change it.

[05:47:05:52] **Serafim Soldatov**: What would be better: for it to make a fresh request to the database every time, or to take the structure from the cache?

[05:52:06:46] **Nikita Maksimenko**: No, using the cache is fine. I just thought it would be a direct SQL query to the DB from which it would pull the structure. But it acted smarter. So, how do we force it to pull specific data?

[06:46:06:52] **Maxim Merkushev**: Did it calculate something? Can you go back to the chat? Let's come up with a prompt together now.

[06:52:06:58] **Nikita Maksimenko**: Okay. By the way, just a heads-up, I have about 30 minutes left.

[06:58:07:03] **Serafim Soldatov**: Yeah, no worries, I think that time will be enough for us.

[07:03:07:12] **Maxim Merkushev**: Try asking it: "Output from the users table..." I think there's a salary column there.

[07:12:07:16] **Nikita Maksimenko**: "Output the salary from the users table."

[07:16:07:28] **Maxim Merkushev**: No, just write "output from the users table." Let's give it the most ambiguous request possible to see how it clarifies what exactly we mean.

[07:28:07:58] **Nikita Maksimenko**: Ah, here, it's asking what exactly needs to be output. I'll choose "both". Cool, very convenient. Here are the columns: base salary, bonuses, and the total amount.

[07:58:08:08] **Maxim Merkushev**: Yes. And now, if you enter unrelated text, it should throw an error saying it's not relevant.

[08:08:08:16] **Nikita Maksimenko**: I just noticed that while the response is generating, the input field is blocked, and I can't write anything.

[08:16:08:31] **Serafim Soldatov**: That's a good point, we will definitely fix that.

[08:31:08:51] **Nikita Maksimenko**: Choosing from the suggested options overrides my text messages, apparently. Well, overall it's awesome, looks cool.

[08:51:09:06] **Maxim Merkushev**: The only thing is, we hardcoded a limit of 1000 rows for the output. I set it so that requests don't take too long and the database doesn't crash. What do you think, should we keep this limit or remove it entirely?

[09:06:09:56] **Nikita Maksimenko**: I think it makes sense to keep a limit, maybe even make it smaller. Queries can be aggregated or regular. There shouldn't be a large number of rows in aggregated ones, but in regular selections, there can be more than 1000. For example, at work right now I have 600,000 rows of raw data, and 100,000 aggregated. If I want to get an analysis on them, I'd like the result to be exported to a file. For example, display 1000 rows in the interface, and the rest in a file.

[09:56:10:33] **Maxim Merkushev**: Yes, up to 1000 rows in the interface — that's right. We will test this further. Right now it's MVP 1.0, the limit is there to ensure the system works reliably. Naturally, we will test how it works without a limit — we'll check if it can output 100,000 rows from a table, and we'll polish this aspect so everything works stably. By the way, you can export the result to Excel, it will open correctly and show those thousand rows.

[10:33:10:52] **Nikita Maksimenko**: Uh-huh.

[10:52:11:01] **Serafim Soldatov**: In general, do you think we should add a toggle for the fast and "thinking" models, or is the current base version enough?

[11:01:11:32] **Nikita Maksimenko**: For MVP 1.0, the current fast model is generally enough. I'm more concerned about MVP 2.0, where there will be cross-database queries. There, the model needs to be smarter. It has to understand what data is in one database, what is in another, and know how to link them together.

[11:32:11:38] **Serafim Soldatov**: Okay, got it.

[11:38:13:06] **Nikita Maksimenko**: I don't need any additional training. Overall, everything looks cool. I like this table. It's great that the frontend developer did a good job and thought of adding a scroll for wide tables. You know what else would be cool? When the neural network suggests response options via buttons, add another inactive hint button with the text "Other: type your option in the chat," in case none of the options fit.

[13:06:13:18] **Serafim Soldatov**: Okay, we'll add that. In Cursor, for example, there's an "Other" button and you can type right inside it. Ours is implemented via standard buttons, so typing directly in them probably wouldn't be as convenient, but we'll add a hint.

[13:18:13:32] **Nikita Maksimenko**: Cool, awesome. Just phrase the text on the button in more natural language.

[13:32:14:00] **Maxim Merkushev**: Yes, we will. Pay attention to the chat list. We implemented chat renaming similarly to other popular AIs. When you make a request, the model analyzes the context and automatically comes up with a title for that chat's history. We did this so that chats don't hang there as obscure IDs, but have meaningful titles.

[14:00:15:02] **Nikita Maksimenko**: An idea for a new feature: I recently saw this in Claude. The model doesn't synthesize the title immediately after the first short prompt, but after a couple of messages, or if the first prompt was long enough. Right now, if I write "output names from the database," the title just keeps the word "names" — and it's unclear what it's about. But if the title were synthesized based on 2-3 messages, it would be something like "Table names and their fields." This will really help navigation in the history when you accumulate 10-20 chats. By the way, I just got an error. Can I log in as an administrator?

[15:02:15:12] **Maxim Merkushev**: Yes, let me dictate it. Login: admin@nlex.ai. Password: admin123. There, you're in. Click "Add Database" and see what you can select there.

[15:12:15:44] **Nikita Maksimenko**: There's nothing available to select here.

[15:44:16:22] **Maxim Merkushev**: We will fix that — we'll add a list of available DBMS. For now, the admin functionality is basic, but we will expand it. You can click on the info icon next to the database, and there will be a "Delete" button. If you delete it, it will disappear for all users.

[16:22:16:58] **Nikita Maksimenko**: And as a regular user, can I delete a DB? Let's check. By the way, I tried to register a new account earlier but couldn't. Most likely, the system didn't accept a short password.

[16:58:17:14] **Maxim Merkushev**: Yes, the password must be at least 8 characters long. We will definitely add warnings about password requirements on the registration form. It's just an MVP for now, we haven't managed to polish everything yet. And regarding a regular user deleting a database — here, look.

[17:14:17:24] **Nikita Maksimenko**: I can click the delete button, but the action still doesn't apply. If there are no permissions, this button shouldn't be shown to regular users at all. Or it should show an error message saying this action is only available to administrators.

[17:24:17:37] **Serafim Soldatov**: According to best practices, the button shouldn't be shown at all. If a user doesn't have access to a feature, that interface element should be hidden.

[17:37:17:45] **Nikita Maksimenko**: Yes, exactly — the space should just be empty so it's not even visible. The only thing is, you could leave a "Check connection" button for regular users so they can test the connection to the DB.

[17:45:18:04] **Maxim Merkushev**: I agree. And maybe we should also display the ping (latency) to the database server.

[18:04:18:08] **Serafim Soldatov**: Nikita, are you still with us? Let's move on to the plans for further development.

[18:08:18:32] **Nikita Maksimenko**: Yes, yes, I'm here. I have no more questions about the demo itself. Overall, I saw everything I was interested in. We tested everything — it looks cool, the table is convenient. What are your plans now and do you have any questions for me?

[18:32:18:42] **Serafim Soldatov**: I wanted to ask two questions. The first is a smaller one. What would you like to see in the admin panel first? What ideas immediately come to mind?

[18:42:19:50] **Nikita Maksimenko**: Well, what have we discussed already? Database connection — okay, that's been moved to the admin panel. I'm not a UX designer, but I'd like to see a dashboard with token usage. Ideally, request statistics for each user. Put an analytics button in the profile so you can look at charts: how many requests a person made, how many tokens they burned.

[19:50:19:53] **Serafim Soldatov**: So, a chart showing the amount of spent tokens, right?

[19:53:20:06] **Nikita Maksimenko**: Yes, so I can analyze activity. To see: this user is actively utilizing the neural network, while this one made a couple of requests and never logged in again.

[20:06:20:23] **Serafim Soldatov**: Maxim, regarding changing the LLM model — as far as I remember, we were going to configure this via the .env file and Docker, right? So switching models wasn't planned through the admin panel.

[20:23:20:59] **Maxim Merkushev**: The model selection can be automated. If a user makes a complex query across multiple databases, the system will automatically switch to a powerful model. And for simple requests within a single DB, a basic, fast model will be used. Implementing this logic is not difficult. Nikita, do you agree with this approach?

[20:59:21:29] **Nikita Maksimenko**: Yes, automatic switching is good. But for model configuration, it would be ideal to move the input of the API token, URL, and model ID right into the admin panel. So I can connect my custom model via the interface instead of having to change variables in the .env file every time.

[21:29:21:32] **Serafim Soldatov**: Yes, I understand. Just to clarify: you still have access to all changes through the Git repository anyway, right?

[21:32:22:08] **Nikita Maksimenko**: Yes, of course. Right now I'm most interested in deploying the project locally. I can only connect to my work databases from my local machine since a VPN is used there. I want to spin up the service on my end, insert my LLM credentials, connect my databases, and check how it all works on my real, complex data. But I'll only be able to fully test this once you add support for the Oracle DBMS.

[22:08:23:18] **Serafim Soldatov**: The second question is more global. We've already sketched out a feature plan for MVP 2.0. We will likely adjust it further since we're currently in our first sprint. This week we are doing bug fixes, polishing the interface, and writing tests. Next week we will start on the second version: we'll update the backlog and I'll send you the documentation for the new APIs. MVP 2.0 will definitely include cross-database queries, admin panel expansion, and a template system (we presented it to you, and you said the idea was cool). Do you have any other wishes or suggestions for MVP 2.0, or should we just focus on our current tasks for now?

[23:18:24:08] **Nikita Maksimenko**: Look, you definitely have enough tasks for this week: you need to polish everything, fix the interface and the colors. Let other developers on your team click around the app, let them take a fresh look and drop some bug reports on the UI — these kinds of flaws are easier to spot from the outside. Move forward according to your plan. The main thing is, tell me, will you be able to provide me with the instructions for local deployment this Friday?

[24:08:24:18] **Serafim Soldatov**: Access to the repository and the guide, I think we will have ready by Friday so you can deploy and test everything with your data in time.

[24:18:24:47] **Nikita Maksimenko**: Yes, Friday evening is fine. If I have time over the weekend, I want to deploy the project locally and connect it to my databases. For this, I need the Oracle connector. And another question about the admin panel: how is the admin initially created? Are the login and password hardcoded or created via the terminal?

[24:47:25:19] **Serafim Soldatov**: Yes, we will hand over the credentials to you, you'll be able to log in. I have a counter-request: when you test the system on your work databases, could you give us detailed feedback? It will really help us improve the product. Additionally, we could include the results of your testing in our project report, which would be a big plus.

[25:19:25:37] **Nikita Maksimenko**: Yes, of course. I'll put together a markdown document for you — maybe I'll write it myself, maybe I'll generate it via Cursor, but the thoughts will be mine. I'll write down everything I notice during the testing process and send it to you.

[25:37:25:43] **Serafim Soldatov**: Yes, please send it. That would be really cool.

[25:43:26:10] **Nikita Maksimenko**: But for everything to go smoothly, your deployment instruction needs to be written as clearly as possible, so that a person with zero knowledge of your project's architecture can launch it. Preparing good documentation is not an easy task. But you'll have to do it anyway for the final project submission, so consider this a useful intermediate step.

[26:10:26:29] **Serafim Soldatov**: Got it. Well, I have no more questions for now. We will take your comments into account and prepare a stable build and a guide for local deployment by Friday.

[26:29:26:46] **Nikita Maksimenko**: Excellent. The progress is good, I liked the design and the frontend — respect to the guys. Keep polishing the functionality and fixing bugs. Let me know when you are ready.

[26:46:27:28] **Serafim Soldatov**: I suggest we plan the next meeting in advance. If we hand over the build to you on Friday, you'll have the weekend to test. It would be great to get feedback from you closer to Sunday. I don't think we'll need any additional calls this week — we've already discussed everything. And over the weekend, we'll message each other and agree on a date for the next meeting the following week.

[27:28:27:40] **Nikita Maksimenko**: Agreed. If you need anything, DM me. Thanks for the presentation.
