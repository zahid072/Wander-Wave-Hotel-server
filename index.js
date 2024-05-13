const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://wander-wave-28d5c.web.app",
      "https://wander-wave-28d5c.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running...");
});

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pvtbyiu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const roomsCollection = client.db("HotelRoomsDB").collection("hotelRooms");
    const bookingsCollection = client.db("HotelRoomsDB").collection("bookings");
    const reviewsCollection = client
      .db("HotelRoomsDB")
      .collection("clientReviews");

    // All apis
    // get apis
    app.get("/hotelRooms", async (req, res) => {
      let { minPrice, maxPrice } = req.query;
      minPrice = parseInt(minPrice);
      maxPrice = parseInt(maxPrice);
      let query = {};
      if (minPrice && maxPrice) {
        query = { price_per_night: { $gte: minPrice, $lte: maxPrice } };
      } else if (minPrice) {
        query = { price_per_night: { $gte: minPrice } };
      } else if (maxPrice) {
        query = { price_per_night: { $lte: maxPrice } };
      }
      const rooms = await roomsCollection.find(query).toArray();
      res.send(rooms);
    });

    app.get("/highestPricedRooms", async (req, res) => {
      const rooms = await roomsCollection
        .find()
        .sort({ price_per_night: -1 })
        .limit(4)
        .toArray();
      res.send(rooms);
    });

    app.get("/hotelRooms/:id", async (req, res) => { 
      const roomId = req.params.id;
      const filter = { _id: new ObjectId(roomId) };
      const room = await roomsCollection.findOne(filter);
      res.send(room);
    });

    app.get("/bookings", async (req, res) => {
      const { email } = req.query;
      const query = { user_email: email };
      const booking = await bookingsCollection.find(query).toArray();
      res.send(booking);
    });
    app.get("/clientReviews", async (req, res) => {
      const reviews = await reviewsCollection
        .find()
        .sort({ timestamp: -1 })
        .toArray();
        res.send(reviews)
    });

    // post apis
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
    app.post("/clientReviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    // update apis
    app.patch("/hotelRooms/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedValue = req.body;
      const updatedDoc = {
        $set: {
          availability: updatedValue.availability,
        },
      };
      const result = await roomsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedValue = req.body;
      const updatedDoc = {
        $set: {
          booking_date: updatedValue.booking_date,
        },
      };
      const result = await bookingsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // delete apis

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`server is running on port: ${port}`);
});
