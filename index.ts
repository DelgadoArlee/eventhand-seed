import 'dotenv/config';
import { Db, MongoClient, ObjectId } from 'mongodb';
import {faker} from "@faker-js/faker";
import { isBefore } from 'date-fns';

 interface PackageInclusion {
	id: ObjectId;
	name: string;
	description: string;
  }
  
   interface BookingPackage {
	name: string;
	capacity: number;
	orderType: string;
	description: string;
	inclusions: PackageInclusion[];
  }
  
  type BookingStatus = "COMPLETED"| "PENDING" |'CONFIRMED'| 'CANCELLED'| 'DECLINED'

   interface Booking {
	_id: ObjectId;
	vendorId: ObjectId;
	eventId: ObjectId;
	date: Date;
	status: BookingStatus;
	package: BookingPackage;
	createdAt: Date;
	updatedAt: Date;
  }

   interface VendorAddress {
	street: string;
	city: string;
	region: string;
	postalCode: number;
  }
  
   interface VendorCredential {
	type: string;
	url: string;
	verified: boolean;
	expiry: Date;
  }
  
   interface Vendor {
	_id: ObjectId;
	clerkId: string;
	name: string;
	email: string;
	contactNum: string;
	bio: string;
	logo: string;
	address: VendorAddress;
	blockedDays: string[];
	credentials: VendorCredential[];
	visibility: boolean;
	credibiltyfactor: number;
	createdAt: Date;
	updatedAt: Date;
  }

  type EventBudget = {
	eventPlanning: number | null;
	eventCoordination: number | null;
	venue: number | null;
	catering: number | null;
	decorations: number | null;
	photography: number | null;
	videography: number | null;
  };
  
  type Event = {
	_id: ObjectId;
	clientId: ObjectId;
	name: string;
	attendees: number;
	date: Date;
	address: string;
	budget: EventBudget;
	bookings: ObjectId[]; // Array of booking ObjectIds
	createdAt: Date;
	updatedAt: Date;
  };


const dropUsers = (db: Db) => db.dropCollection("users")

const dropMessages = (db: Db) => db.dropCollection("messages")

const dropChat = (db: Db) => db.dropCollection("chats");

const dropEvents = (db: Db) => db.dropCollection("events");

const dropBookings = (db: Db) => db.dropCollection("bookings");

const dropReviews = (db: Db) => db.dropCollection("vendorReviews")

const dropPackages = (db: Db) => db.dropCollection("vendorPackages");

const dropTags = (db: Db) => db.dropCollection("tags");

const dropVendorTags = (db: Db) => db.dropCollection("vendorTags");

const dropVendors = (db: Db) => db.dropCollection("vendors");

function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
	  const j = Math.floor(Math.random() * (i + 1));
	  [array[i], array[j]] = [array[j], array[i]];
	}
	return array;
  }
  
  // Function to get a random number of unique tags
  function getRandomTags(tags: any) {
	// Shuffle the tags array
	const shuffledTags = shuffleArray(tags.slice());
	
	// Get a random number of tags (1 to the length of the shuffled array)
	const randomCount = Math.floor(Math.random() * shuffledTags.length) + 1;
	
	// Return the first 'randomCount' number of tags
	return shuffledTags.slice(0, randomCount);
  }

  const createUserEvents = async (db: Db, tagIds: ObjectId[], clientId: ObjectId) => {
	const vendorsCollection = db.collection('vendors');
	const eventsCollection = db.collection('events');
	const bookingsCollection = db.collection('bookings');
  
	// Helper function to randomly return a number or null
	const getRandomBudgetValue = () => (Math.random() > 0.5 ? faker.number.int({ min: 1000, max: 10000 }) : null);
  
	// Helper function to get a random date before or after today
	const getRandomDate = () => (Math.random() > 0.5 ? faker.date.past() : faker.date.future());
  
	// Seed Vendors
	const vendors = await vendorsCollection.find().toArray();
  
	// Seed Events
	const events = Array.from({ length: 25 }).map(() => {
	  const budget = {
		eventPlanning: getRandomBudgetValue(),
		eventCoordination: getRandomBudgetValue(),
		venue: getRandomBudgetValue(),
		catering: getRandomBudgetValue(),
		decorations: getRandomBudgetValue(),
		photography: getRandomBudgetValue(),
		videography: getRandomBudgetValue(),
	  };
  
	  const eventDate = getRandomDate();
  
	  return {
		_id: new ObjectId(),
		clientId: clientId,
		name: faker.word.words(3),
		attendees: faker.number.int({ min: 50, max: 500 }),
		date: eventDate,
		address: budget.venue !== null? undefined: faker.location.streetAddress(),
		budget,
		bookings: [], // Will be filled later
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
	  };
	});
  
	await eventsCollection.insertMany(events);
  
	// Seed Bookings
	const bookings = Array.from({ length: 10 }).map(() => {
	  const vendor = faker.helpers.arrayElement(vendors);
	  const event = faker.helpers.arrayElement(events);
  
    // Ensure booking date is always before the event date
    const bookingDate = isBefore(  new Date(), event.date) 
      ? faker.date.between({from: new Date(), to: event.date})  // Booking date between today and event date
      : faker.date.past();  // For past events, set booking to a random past date

  
	  const booking = {
		_id: new ObjectId(),
		vendorId: vendor._id,
		eventId: event._id,
		date: bookingDate, // Booking date always after event date
		status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'CANCELLED', 'DECLINED']),
		package: {
		  _id: new ObjectId(),
		  name: faker.word.words(2),
		  imageUrl: faker.image.url(),
		  tags: getRandomTags(tagIds),
		  capacity: faker.number.int({ min: 50, max: 500 }),
		  orderType: faker.helpers.arrayElement(['PICKUP', 'DELIVERY', 'SERVICE']),
		  price: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
		  description: faker.lorem.sentences(2),
		  inclusions: Array.from({ length: 3 }).map(() => ({
			_id: new ObjectId(),
			imageUrl: faker.image.url(),
			quantity: faker.number.int({min: 1, max: 100 }),
			name: faker.word.noun(),
			description: faker.lorem.sentence(),
		  })),
		},
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
	  };
  
	  // Add booking ID to the event's booking array
	  (event as any).bookings.push(booking._id);
	  return booking;
	});
  
	await bookingsCollection.insertMany(bookings);
  
	// Update the events with their bookings
	for (const event of events) {
	  await eventsCollection.updateOne({ _id: event._id }, { $set: { bookings: event.bookings } });
	}
  };

  const getRandomLength = (maxLength: number) => Math.floor(Math.random() * maxLength) + 1;

// Create an array of objects with each type appearing only once
const generateRandomPermits = () => {
  const permits = ['BARANGAY_PERMIT', 'MAYORS_PERMIT', 'BIR_REGISTRATION', 'DTI_REGISTRATION',]
  const shuffledTypes = shuffleArray([...permits]); // Create a shuffled copy of the types array
  const length = getRandomLength(shuffledTypes.length); // Determine the random length

  return shuffledTypes.slice(0, length).map(type => ({
    type: type,
    url: faker.internet.url(),
    verified: faker.datatype.boolean(),
    expiry: faker.date.future(),
  }));
};

const generateRandomOrderTypes = () => {
	const orderTypes = ["DELIVERY", "PICKUP", "SERVICE"]
	const shuffledTypes = shuffleArray([...orderTypes]); // Create a shuffled copy of the types array
	const length = getRandomLength(shuffledTypes.length); // Determine the random length
  
	return shuffledTypes.slice(0, length).map(type => ({
		name: type,
		disabled: true,
	  }));
  };
  

  const createVendors = async (db: Db, tags: ObjectId[] ) => {
	const vendorsCollection = db.collection('vendors');
	const vendorPackagesCollection = db.collection('vendorPackages');


	console.log("Seeding Vendors...")

    const blockedDays = [
      "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
    ];

	const ids = [ 'DRIVER_LICENSE','PASSPORT' ];

    const vendors = Array.from({ length: 10 }, () => ({
	  _id: new ObjectId(),
	  clerkId: faker.string.uuid(),
      name: faker.company.name(),
      email: faker.internet.email(),
      contactNum: faker.phone.number(),
      bio: faker.lorem.paragraph(),
      logo: faker.image.url(),
      address: {
        street: faker.location.streetAddress(),
        city: "Iloilo City",
        region: "Iloilo",
        postalCode: parseInt(faker.location.zipCode(), 10),
      },
      blockedDays: getRandomTags(blockedDays),
      credentials: [
        {
          type: getRandomTags(ids),
          url: faker.internet.url(),
          verified: faker.datatype.boolean(),
          expiry: faker.date.future(),
        },
		...generateRandomPermits(),
      ],      
	  visibility: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

	await vendorsCollection.insertMany(vendors);

	for(const vendor in vendors){
		const vendorPackages = Array.from({ length: 5 }).map(() => ({
			_id: new ObjectId(),
			vendorId: vendors[vendor]._id,
			imageUrl: faker.image.url(),
			name: faker.commerce.productName(),
			capacity: faker.number.int({ min: 1, max: 100 }),
			price: parseFloat(faker.commerce.price()),
			description: faker.lorem.sentence(2),
			orderTypes: generateRandomOrderTypes(),
			tags: getRandomTags(tags), // Assuming tag IDs are valid ObjectId
			inclusions: Array.from({ length: 5 }).map(() => ({
			  _id: new ObjectId(),
			  imageUrl: faker.image.url(),
			  name: faker.commerce.productName(),
			  description: faker.lorem.sentence(),
			  quantity: faker.number.int({ min: 1, max: 10 }),
			})),
			createdAt: new Date(),
			updatedAt: new Date(),
		  }));
	  
		  // Insert vendor packages into the collection
		  await vendorPackagesCollection.insertMany(vendorPackages);
	}
  }

  const createClients = async (db: Db) => {
	console.log("Seeding Users...")
	const usersCollection = db.collection('users');
	   // Generate fake clients
    const clients = Array.from({ length: 10 }).map(() => ({
      _id: new ObjectId(),
      clerkId: faker.string.uuid(),
      email: faker.internet.email(),
      profilePicture: faker.image.avatar(),
      lastName: faker.person.lastName(),
      firstName: faker.person.firstName(),
      contactNumber: faker.phone.number(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

	await usersCollection.insertMany(clients)

  }
  
  const createVendorPackages = async (db: Db, tags: ObjectId[]) => {
	const vendorsCollection = db.collection('vendors');
	const vendorPackagesCollection = db.collection('vendorPackages');

	const vendors = await vendorsCollection.find().toArray()

    // Vendor ID (Replace this with an actual vendor ID from your database)

    // Generate fake vendor packages
	for(const vendor in vendors){
		const vendorPackages = Array.from({ length: 5 }).map(() => ({
			_id: new ObjectId(),
			vendorId: vendors[vendor]._id,
			imageUrl: faker.image.url(),
			name: faker.commerce.productName(),
			capacity: faker.number.int({ min: 1, max: 100 }),
			price: parseFloat(faker.commerce.price()),
			orderTypes: generateRandomOrderTypes(),
			tags: getRandomTags(tags), // Assuming tag IDs are valid ObjectId
			inclusions: Array.from({ length: 5 }).map(() => ({
			  _id: new ObjectId(),
			  imageUrl: faker.image.url(),
			  name: faker.commerce.productName(),
			  description: faker.lorem.sentence(),
			  quantity: faker.number.int({ min: 1, max: 10 }),
			})),
			createdAt: new Date(),
			updatedAt: new Date(),
		  }));
	  
		  // Insert vendor packages into the collection
		  await vendorPackagesCollection.insertMany(vendorPackages);
	}

  }

  const createVendorReviews = async (db: Db) => {
	const vendorReviewsCollection = db.collection('vendorReviews');
	const vendorPackages = db.collection('vendorPackages');
	const userCollection = db.collection('users')

	const clients = await userCollection.find().toArray()

	const packages = await vendorPackages.find().toArray();

	for(const p in packages){
		const vendorReviews = Array.from({ length: faker.number.int({min: 1, max: 10}) }).map(() => ({
			_id: new ObjectId(),
			vendorId: packages[p].vendorId,
			clientId:faker.helpers.arrayElement(clients)._id , // This would be replaced with an actual client ID from your database
			rating: faker.number.int({ min: 1, max: 5 }),
			package: {
			  _id: packages[p]._id, // This would be replaced with an actual package ID from your database
			  name: packages[p].name,
			  imageUrl: packages[p].imageUrl,
			  capacity: packages[p].capacity,
			  tags: packages[p].tags, // Assuming tag IDs are valid ObjectId
			  orderType: packages[p].orderTypes[faker.number.int({min: 0, max: packages[p].orderTypes.length -1 })].name,
			  description: packages[p].description,
			  price: packages[p].price,
			  inclusions: packages[p].inclusions,
			},
			comment: faker.lorem.sentence(),
			createdAt: new Date(),
			updatedAt: new Date(),
		  }));
	
		await vendorReviewsCollection.insertMany(vendorReviews);
	}



  }

  const createRealVendor = async (db: Db, clerkId: string, tags: ObjectId[] ) => {
	const vendorsCollection = db.collection('vendors');
	const vendorPackagesCollection = db.collection('vendorPackages');
	const vendorReviewsCollection = db.collection('vendorReviews');
	const userCollection = db.collection('users')

	const clients = await userCollection.find().toArray()


    const blockedDays = [
      "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
    ];

	const ids = [ 'DRIVER_LICENSE','PASSPORT' ];

    const vendor = {
	  _id: new ObjectId(),
	  clerkId: clerkId,
      name: faker.company.name(),
      email: faker.internet.email(),
      contactNum: faker.phone.number(),
      bio: faker.lorem.paragraph(),
      logo: faker.image.url(),
      address: {
        street: faker.location.streetAddress(),
        city: "Iloilo City",
        region: "Iloilo",
        postalCode: parseInt(faker.location.zipCode(), 10),
      },
      blockedDays: [],
      credentials: [
        {
          type: getRandomTags(ids),
          url: faker.internet.url(),
          verified: faker.datatype.boolean(),
          expiry: faker.date.future(),
        },
		...generateRandomPermits(),
      ],      
	  visibility: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

	await vendorsCollection.insertOne(vendor);

	
		const packages = Array.from({ length: 5 }).map(() => ({
			_id: new ObjectId(),
			vendorId: vendor._id,
			imageUrl: faker.image.url(),
			name: faker.commerce.productName(),
			capacity: faker.number.int({ min: 1, max: 100 }),
			price: parseFloat(faker.commerce.price()),
			orderTypes: generateRandomOrderTypes(),
			description: faker.lorem.sentence(2),
			tags: getRandomTags(tags), // Assuming tag IDs are valid ObjectId
			inclusions: Array.from({ length: 5 }).map(() => ({
			  _id: new ObjectId(),
			  imageUrl: faker.image.url(),
			  name: faker.commerce.productName(),
			  description: faker.lorem.sentence(),
			  quantity: faker.number.int({ min: 1, max: 10 }),
			})),
			createdAt: new Date(),
			updatedAt: new Date(),
		  }));
	  
		  // Insert vendor packages into the collection
		  await vendorPackagesCollection.insertMany(packages);

		  
	for(const p in packages){
		const vendorReviews = Array.from({ length: faker.number.int({min: 1, max: 10}) }).map(() => ({
			_id: new ObjectId(),
			vendorId: packages[p].vendorId,
			clientId:faker.helpers.arrayElement(clients)._id , // This would be replaced with an actual client ID from your database
			rating: faker.number.int({ min: 1, max: 5 }),
			package: {
			  _id: packages[p]._id, // This would be replaced with an actual package ID from your database
			  name: packages[p].name,
			  imageUrl: packages[p].imageUrl,
			  capacity: packages[p].capacity,
			  tags: packages[p].tags, // Assuming tag IDs are valid ObjectId
			  orderType: packages[p].orderTypes[faker.number.int({min: 0, max: packages[p].orderTypes.length -1 })].name,
			  description: packages[p].description,
			  price: packages[p].price,
			  inclusions: packages[p].inclusions,
			},
			comment: faker.lorem.sentence(),
			createdAt: new Date(),
			updatedAt: new Date(),
		  }));
	
		await vendorReviewsCollection.insertMany(vendorReviews);
	}

	
  }

  const addBookingsToEvent = async (db: Db, eventId: string,  tagIds: ObjectId[], status: BookingStatus, length: number) => {
	const vendorsCollection = db.collection('vendors');
	const eventsCollection = db.collection<Event>('events');
	const bookingsCollection = db.collection('bookings');


	const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) }, {projection: {date: 1}})
	const vendors = await vendorsCollection.find().toArray();
	console.log(event)

	const bookings = Array.from({ length }).map(() => {
		const vendor = faker.helpers.arrayElement(vendors);
	
	  // Ensure booking date is always before the event date
	  const bookingDate = isBefore(  new Date(), event!.date) 
		? faker.date.between({from: new Date(), to: event!.date})  // Booking date between today and event date
		: faker.date.past();  // For past events, set booking to a random past date
  
	
		const booking = {
		  _id: new ObjectId(),
		  vendorId: vendor._id,
		  eventId: new ObjectId(eventId),
		  date: bookingDate, // Booking date always after event date
		  status: status,
		  package: {
			_id: new ObjectId(),
			name: faker.word.words(2),
			imageUrl: faker.image.url(),
			tags: getRandomTags(tagIds),
			capacity: faker.number.int({ min: 50, max: 500 }),
			orderType: faker.helpers.arrayElement(['PICKUP', 'DELIVERY', 'SERVICE']),
			price: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
			description: faker.lorem.sentences(2),
			inclusions: Array.from({ length: 3 }).map(() => ({
			  _id: new ObjectId(),
			  imageUrl: faker.image.url(),
			  quantity: faker.number.int({min: 1, max: 100 }),
			  name: faker.word.noun(),
			  description: faker.lorem.sentence(),
			})),
		  },
		  createdAt: faker.date.past(),
		  updatedAt: faker.date.recent(),
		};
	
		// Add booking ID to the event's booking array
		return booking;
	  });
	
	  await bookingsCollection.insertMany(bookings);

	  const bookingIds = bookings.map((booking) => booking._id);

	
	  // Update the events with their bookings
	
	await eventsCollection.updateOne({ _id: event!._id }, { $push: { bookings: { $each: bookingIds as ObjectId[] } } });
	  

  }

  const addBookingsToVendor = async (
	db: Db,
	eventId: string,
	tagIds: ObjectId[],
	status: BookingStatus,
	length: number
  ) => {
	const vendorsCollection = db.collection('vendors');
	const eventsCollection = db.collection<Event>('events');
	const bookingsCollection = db.collection('bookings');
  
	// Fetch events and vendor
	const events = await eventsCollection.find().toArray();
	const vendor = await vendorsCollection.findOne(
	  { _id: new ObjectId(eventId) },
	  { projection: { _id: 1 } }
	);
  
	if (!vendor) {
	  throw new Error('Vendor not found');
	}
  
	// Create bookings
	const bookings = await Promise.all(
	  Array.from({ length }).map(async () => {
		const event = faker.helpers.arrayElement(events);
  
		if (!event) {
		  throw new Error('Event not found');
		}
  
		// Ensure booking date is always before the event date
		const bookingDate = isBefore(new Date(), event.date)
		  ? faker.date.between({ from: new Date(), to: event.date })
		  : faker.date.past(); // For past events, set booking to a random past date
  
		const booking = {
		  _id: new ObjectId(),
		  vendorId: new ObjectId(vendor._id),
		  eventId: new ObjectId(event._id),
		  date: bookingDate,
		  status: status,
		  package: {
			_id: new ObjectId(),
			name: faker.word.words(2),
			imageUrl: faker.image.url(),
			tags: getRandomTags(tagIds),
			capacity: faker.number.int({ min: 50, max: 500 }),
			orderType: faker.helpers.arrayElement(['PICKUP', 'DELIVERY', 'SERVICE']),
			price: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
			description: faker.lorem.sentences(2),
			inclusions: Array.from({ length: 3 }).map(() => ({
			  _id: new ObjectId(),
			  imageUrl: faker.image.url(),
			  quantity: faker.number.int({ min: 1, max: 100 }),
			  name: faker.word.noun(),
			  description: faker.lorem.sentence(),
			})),
		  },
		  createdAt: faker.date.past(),
		  updatedAt: faker.date.recent(),
		};
  
		// Add booking ID to the event's booking array
		await eventsCollection.updateOne(
		  { _id: event._id },
		  { $push: { bookings: booking._id } }
		);
  
		return booking;
	  })
	);
  
	// Insert bookings
	await bookingsCollection.insertMany(bookings);

	// console.log(bookings)
  
	console.log('Bookings added successfully');
  };


const seedDb = async  (client : MongoClient) => {
	console.log("INITIATING DB SEEDING...");

	const db = client.db();

	console.log("CLEARING DB...");

	try {
		await dropUsers(db);
		await dropMessages(db);
		await dropChat(db);
		await dropEvents(db);
		await dropBookings(db);
		await dropReviews(db);
		await dropPackages(db);
		// await dropTags(db);
		// await dropVendorTags(db);
		await dropVendors(db);
		
		console.log("CLEARING DB SUCCESSFUL!!!");

		const tagsCollection = db.collection('tags');

		const tags = [
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d42"),
				name: "EVENTPLANNING",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d43"),
				name: "EVENTCOORDINATION",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d44"),
				name: "VENUE",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d45"),
				name: "CATERING",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d46"),
				name: "DECORATIONS",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d47"),
				name: "PHOTOGRAPHY",
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId("66d88166d003b4f05e5b9d48"),
				name: "VIDEOGRAPHY",
				createdAt: new Date(),
				updatedAt: new Date()
			},

		]

		const tagIds = tags.map(tag => tag._id);

		// tagsCollection.insertMany(tags)
		
		// await createClients(db);
		// await createVendors(db, tagIds);
		// await createVendorPackages(db, tagIds);
		// await createVendorReviews(db);
		// await createUserEvents(db, tagIds, new ObjectId("66d197ce3e97cb8a64e1cb24"));
		// await addBookingsToEvent(db, "66de16113f588b9430d09a3c", tagIds, "PENDING", 10);
		// await createRealVendor(db,"user_2kGVDwvbPTiiHgVolLzyIXIaI8H", tagIds)
		// await addBookingsToVendor(db, "66dca598f88822840fa78760", tagIds, "PENDING", 5);
		// await addBookingsToVendor(db, "66dca598f88822840fa78760", tagIds, "CONFIRMED", 5);
		// await addBookingsToVendor(db, "66dca598f88822840fa78760", tagIds, "DECLINED", 5);
		// await addBookingsToVendor(db, "66dca598f88822840fa78760", tagIds, "CANCELLED", 5);
		// await addBookingsToVendor(db, "66dca598f88822840fa78760", tagIds, "COMPLETED", 5);

		// const blockedDays = [5
		// 	"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
		//   ];

		//   console.log(getRandomTags(blockedDays))

	} catch (error) {
		console.log(error)
	} finally {
		client.close()
		process.exit();

	}	

}

const client: MongoClient = new MongoClient(process.env.MONGODB_CONNECTION_URI!)

client
.on('serverOpening', () => console.log('DB Connected'))
.on('serverClosed', () => console.log('DB Disconnected'))
.on('error', (error) => console.log('An Error has Occured:', error))
.connect();


seedDb(client);

