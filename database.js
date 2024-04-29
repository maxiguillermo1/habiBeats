const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://habibeatsteam:Buzzball@habibeatscluster.umxgicd.mongodb.net/?retryWrites=true&w=majority&appName=HabiBeatsCluster";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    await addUser("spiderman1610@gmail.com", "Buzzball", "Miles");

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}


async function addUser(email, password, firstName) {
    const database = client.db("HabiBeatsApplicationData");
    const users = database.collection("users");


    // creating user document
    const doc = {
        email: email,
        password: password,
        firstName: firstName
    };

    const result = await users.insertOne(doc);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
};
run().catch(console.dir);

