const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Fix - GitHub Pages ninnu call cheyyaan
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB connect with retry
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
    console.log('✅ MongoDB connect ആയി bro');
  } catch (err) {
    console.log('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
};
connectDB();

// Bus Schema - Validation + Default values
const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, default: function() { return this.busNumber; } },
  from: { type: String, required: true, trim: true },
  to: { type: String, required: true, trim: true },
  route: String,
  type: { type: String, default: 'Private Bus' },
  time: String,
  departureTime: String,
  fare: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, default: 40, min: 1 },
  bookedSeats: { type: Number, default: 0, min: 0 },
  bookedSeatsList: { type: [String], default: [] }, // Seat numbers track cheyyan
  createdAt: { type: Date, default: Date.now }
});

// Spot fare + available seats calculate cheyyan
const addExtraFields = (bus) => {
  const busObj = bus.toObject();
  busObj.spotFare = (busObj.fare || 0) + 10;
  busObj.availableSeats = busObj.totalSeats - busObj.bookedSeats;
  return busObj;
};

const Bus = mongoose.model('Bus', busSchema);

// Home route
app.get('/', (req, res) => {
  res.send('🚌 Bus Card Backend Running ✅ μStack 2026 | CRUD + Seat Lock Ready');
});

// 1. GET all buses with search
app.get('/api/buses', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let query = {};

    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    if (type) query.type = new RegExp(type, 'i');

    const buses = await Bus.find(query).sort({ createdAt: -1 });
    res.json(buses.map(addExtraFields));
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// 2. GET single bus
app.get('/api/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus കിട്ടിയില്ല bro' });
    res.json(addExtraFields(bus));
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

// 3. POST new bus - Admin
app.post('/api/buses', async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json({ msg: "Bus add ആയി ✅", bus: addExtraFields(bus) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Bus number already und bro' });
    }
    res.status(400).json({ error: 'Validation error: ' + err.message });
  }
});

// 4. PUT - Book seat - Race condition fixed
app.put('/api/book/:id', async (req, res) => {
  try {
    const { type, seat, passengerName } = req.query;

    if (!seat) return res.status(400).json({ error: 'Seat number venda bro' });

    // Atomic update - 2 per orumichu book cheyyaan pattilla
    const bus = await Bus.findOneAndUpdate(
      {
        _id: req.params.id,
        $expr: { $lt: ["$bookedSeats", "$totalSeats"] },
        bookedSeatsList: { $ne: seat } // Same seat 2 vattam book aavathilla
      },
      {
        $inc: { bookedSeats: 1 },
        $push: { bookedSeatsList: seat }
      },
      { new: true }
    );

    if (!bus) {
      return res.status(400).json({ error: "Seats full aayi or seat already booked 😢" });
    }

    res.json({
      msg: `${type.toUpperCase()} Seat ${seat} booked ✅`,
      available: bus.totalSeats - bus.bookedSeats,
      seat: seat,
      passengerName: passengerName || 'Guest',
      bus: addExtraFields(bus)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. PUT - Update bus
app.put('/api/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ error: 'Bus കിട്ടിയില്ല bro' });
    res.json({ msg: "Bus update ആയി ✅", bus: addExtraFields(bus) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. DELETE bus
app.delete('/api/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus കിട്ടിയില്ല bro' });
    res.json({ msg: "Bus delete ആയി ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. GET available seats list
app.get('/api/buses/:id/seats', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Bus കിട്ടിയില്ല bro' });

    const allSeats = Array.from({ length: bus.totalSeats }, (_, i) => `A${i + 1}`);
    const availableSeats = allSeats.filter(seat =>!bus.bookedSeatsList.includes(seat));

    res.json({
      total: bus.totalSeats,
      booked: bus.bookedSeats,
      available: availableSeats.length,
      availableSeats: availableSeats,
      bookedSeats: bus.bookedSeatsList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT}-ൽ run ആവുന്നു | μStack 2026`);
});
