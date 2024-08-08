import 'dotenv/config';
import { Db, MongoClient } from 'mongodb';


const dropUsers = (db: Db) => db.dropCollection("users")

const dropMessages = (db: Db) => db.dropCollection("messages")

const dropChat = (db: Db) => db.dropCollection("chats");

const dropEvents = (db: Db) => db.dropCollection("events");


const seedDb = async  (client : MongoClient) => {
	console.log("INITIATING DB SEEDING...");

	const db = client.db();

	console.log("CLEARING DB...");

	try {
		await dropChat(db);
		await dropUsers(db);
		await dropMessages(db);
		await dropEvents(db);


	} catch (error) {
		console.log(error)
	}
}

const client: MongoClient = new MongoClient(process.env.MONGODB_CONNECTION_URI!);

seedDb(client);

process.exit();