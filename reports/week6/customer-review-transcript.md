[0:00: 0:15] **Maksim Maltsev**: Now I will turn off the illustration. Can you see my screen?

[0:16: 0:19] **Nikita Maksimenko**: Yes.

[0:20: 0:51] **Maksim Maltsev**: So, we added analytics here. The analytics are both personal and global. They are only available to the admin. We added filters—by time, database, and text match. You can also look at the chat history: what the users wrote there and what answers they received. You can download files and look at the queries themselves.

[0:51: 1:01] **Nikita Maksimenko**: And what is your data stored in?

[1:02: 1:21] **Maksim Maltsev**: It is stored in a Postgres table. Next is the LLM management. You can add your own model, set up a proxy, and manage users. You can view statistics, like how many chats and queries they have. You can block them or assign roles.

[1:21: 2:46] **Nikita Maksimenko**: Yes, I heard you've changed a lot. Cool. Only... right now there is no filter like in ByDate, let's say. Searching by email or by name through a separate window. Usually, next to the email, there is a small flag for sorting and a small flag for a filter where you can type an email. The same thing goes next to the name. If you type an email, then the sorting by name is disabled, and vice versa. Usually, it's done like that on the frontend. Plus, for queries and chats, it would also be interesting to add sorting in the table to see who used the system the most and who used it the least.

[2:46: 3:39] **Maksim Maltsev**: Got it, we'll do that. And also... the stage of building the database was moved to the initial connection, meaning to the first chat. I can demonstrate this right now: for example, I'll delete this database, copy it, and add it again. That's it, it's deleted.

[3:39: 4:08] **Nikita Maksimenko**: And when deleting a database, you probably have a cascading deletion? I mean, does its vector representation and the database schema in the vector space get deleted? I'm wondering, if I delete the database, does it delete all the data about it so that the next AI query doesn't see its schema anymore?

[4:08: 4:38] **Maksim Maltsev**: Yes, the next query will not see the schema. It is stored in Postgres, and the Trino catalog is deleted, along with all the schemas and additional data related to this catalog. So, yes, this is done. The connection is displayed nicely: first yellow, then green.

[4:38: 4:46] **Nikita Maksimenko**: I noticed that when it connected, it said "successfully," even though the interface seems to be in Russian.

[4:46: 5:46] **Maksim Maltsev**: Yes, that's a translation error, it happens. By the way, the interface is now available in both English and Russian. You can switch the language. Chats also have their own language, and the model should answer in the language selected for the chat. For now, there might be minor bugs—for example, when English is selected but the prompt is written in Russian, or vice versa. But overall, I think that's it for this functionality.

[5:46: 5:51] **Nikita Maksimenko**: And it turns out there is now support for databases for queries?

[5:52: 6:06] **Maksim Maltsev**: Yes, that appeared a long time ago, back when we added Trino. We also added NoSQL and ClickHouse.

[6:06: 6:11] **Nikita Maksimenko**: Isn't ClickHouse SQL?

[6:13: 6:33] **Maksim Maltsev**: Yes, I mixed it up, ClickHouse is SQL. By NoSQL I meant MinIO and Mongo. Anyway, we added NoSQL.

[6:33: 6:45] **Maksim Maltsev**: That's probably all for the new functionality. Do you have any suggestions on what else should be added, what's missing?

[6:45: 8:02] **Nikita Maksimenko**: Look, I can't say right off the bat, because from my point of view, it already looks like a solid solution. The most I can suggest is to make the interface settings a bit clearer, which I already mentioned in the table. Click on the chats, please. Let's say it's not very convenient that there are so many chats here; I'd like to group them into folders. If a user works with three databases, they will want to keep traffic queries separately from company queries, so they are stored in different places, or, for example, make a separate folder for reports.

[8:02: 8:07] **Maksim Maltsev**: Got it. But at the same time, the ability to create a chat without a folder should also remain, right?

[8:07: 9:54] **Nikita Maksimenko**: Yes, of course. And the chats themselves... honestly, they don't look very convenient. On the left, these little flags seem kind of huge. I just remember the designs of ChatGPT and Perplexity. Everything has already come to strict standardization there. Now you open any service and you can immediately see who copied whom. Therefore, it would be more convenient to make a familiar UX. In ChatGPT, Claude, and Perplexity, it's implemented more clearly. And maybe it doesn't make sense to make the folder icon in the top left corner so big.

[9:54: 10:05] **Maksim Maltsev**: Yes, I also think it's better to make it smaller.

[10:05: 11:23] **Nikita Maksimenko**: From the functionality side, the only thing that comes to mind is adding charts. So you can build charts based on the data. It would be convenient if the Excel export was built on certain data (data on one sheet, a chart on the second), and right in the interface there was a preview of these charts, like how it's done now with tables.

[11:23: 12:51] **Maksim Maltsev**: This is a new feature that we will include in the third version. This is already polishing the project. The feature is quite resource-intensive and will take time to implement, as it requires a double check for generating the Excel file and the interface itself. Perhaps chart generation should be offloaded to the frontend. Well, anyway, the question is mostly up to you—I think you can fully use the product now.

[12:51: 13:36] **Nikita Maksimenko**: Look, at the last meeting, I asked for a new branch (a release candidate) with those features we discussed. Serafim didn't send it to me. He didn't send the security data (which I am grateful for), but he never dropped the branch itself so I could poke around the product. Since the product, as you think, is ready for use...

[13:36: 13:54] **Maksim Maltsev**: Right now the new functionality is in the mpp 120 branch. Let's make it easier...

[13:54: 15:19] **Nikita Maksimenko**: Message me in TG about which branch to use so that nothing changes too much there and everything works stably. I will deploy it locally because I will use my own model and test it on real production databases with hundreds of gigabytes of data. I will battle-test your application. I only have access to this DB via a work VPN, so it will only work if I deploy the project locally. Plus, I still need to drop certificates into your images. You'll have to explain to me how to deploy all this for myself.

[15:19: 15:42] **Maksim Maltsev**: The documentation is clear. We have a description on GitHub of how to bring it all up and configure it.

[15:42: 15:58] **Nikita Maksimenko**: Last time I was sent the official instructions, everything was clear there, and I was able to deploy locally without any problems. So no extra help from your side was needed, everything was fine.

[15:58: 16:30] **Maksim Maltsev**: Honestly, we published our documentation on GitHub Pages. There is full information on the deployment there. It seems we haven't missed anything important.

[16:30: 17:01] **Nikita Maksimenko**: I have a link from Serafim; I haven't clicked it yet, but I will definitely read it carefully.

[17:01: 17:40] **Maksim Maltsev**: Serafim will probably tell you more about this documentation. We think it's important to document the product well so that it can be easily deployed without problems. There is also documentation on architectural decisions and so on.

[17:40: 21:04] **Nikita Maksimenko**: Yes, of course, documentation is important. Plus, if we are talking about production use, we need to somehow calculate the load on the application: how much parallel queries increase memory consumption, and whether the application will handle the load. Regarding deployment: I need an instruction on what settings are required for each service individually. In Kubernetes, each microservice is configured separately—Deployment, ConfigMap, Secrets. I need to understand what exactly the frontend needs, what the ML service needs, and what the connections are between them. Docker-compose allows doing this much easier: all the settings are in a shared .env file, and the specifics for individual services get somewhat lost. Therefore, it's better to document each service separately, right?

[21:04: 21:12] **Maksim Maltsev**: Got it.

[21:12: 21:17] **Nikita Maksimenko**: Yes, exactly.

[21:17: 22:31] **Maksim Maltsev**: At the moment, we have everything bundled together—docker-compose and the .env file. For development, this is fine, but for deploying into a production cluster, you need data for each service separately, since they are built and deployed via different pipelines. We will gather feedback and prepare this.

[22:31: 28:49] **Nikita Maksimenko**: We'll see. Deploying everything with our databases will take a lot of time and resources, it requires approvals, and we simply won't manage to do it all in a month. But I will bring up the branch and connect it to the production database. I'm curious to see how the model handles large DB volumes and whether it makes suboptimal queries. For example, yesterday one of our analysts made a query to a ClickHouse table weighing 25 GB (1.6 billion records). We needed to figure out if there was duplication in a specific field. She tried to run the query for an hour. Basically, it outputs the number of unique values. But the database has a memory limit, the query hits this limit, fails to process the data, and crashes. The solution, which developers know about, was simple—it's tied to the DB's internal optimization. It was a SELECT COUNT(DISTINCT field) query. In ClickHouse, DISTINCT works through a large hash table, so everything broke. But if you replace it with an ORDER BY and GROUP BY, GROUP BY has much better optimization, and the query finished in 7 minutes. It would be interesting to see how your solution handles such a task. Perhaps it makes sense to connect some kind of MCP (Model Context Protocol) or a knowledge base about how the DB is structured internally and how to optimally build queries. The neural network could analyze the DB and prioritize approaches: if out of 1.6 billion records there are only a million unique ones, DISTINCT would have worked, but GROUP BY might have broken due to data cardinality. It would be nice to add this functionality to the next version, so the neural network itself understands how best to work with a specific DB type, or to connect an MCP for Postgres and ClickHouse.

[28:49: 29:15] **Maksim Maltsev**: Connecting an MCP to the system will probably be quite difficult from an architectural standpoint. Right now we are basically at the final stage of development, and adding something that wasn't originally in our plan is not that easy.

[29:15: 29:53] **Nikita Maksimenko**: Understood. Anyway, you give me the branch, I'll bring everything up, connect the heavy databases, and we'll see if your solution sags or not. If it performs well, then maybe nothing will need to be changed. I will test it on the same queries that developers racked their brains over. I won't feed it a ready-made optimized SQL query; I will literally describe in words what needs to be done, and we'll see what kind of query the model comes up with. We're really looking forward to testing this.
