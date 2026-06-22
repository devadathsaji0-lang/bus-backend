const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connect ആയി bro'))
  .catch(err => console.log('❌ Error:', err));

// Bus Schema
const busSchema = new mongoose.Schema({
  busNumber: String,
  from: String,
  to: String,
  route: String,
  type: String,
  time: String,
  fare: Number,
  totalSeats: { type: Number, default: 40 },
  bookedSeats: { type: Number, default: 0 }
});

const Bus = mongoose.model('Bus', busSchema);

// Test route
app.get('/', (req, res) => {
  res.send('Bus Card Backend Running ✅ CRUD Ready');
});

// 1. R = READ - /api/buses PLURAL
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({error: 'Error വന്നു bro: ' + err.message});
  }
});

// 2. C = CREATE - /api/buses PLURAL
app.post('/api/buses', async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json({ msg: "Bus add ആയി ✅", bus });
  } catch (err) {
    res.status(400).json({error: 'Error: ' + err.message});
  }
});

// 3. U = UPDATE - Seat book
app.put('/api/book/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: "Bus കിട്ടിയില്ല bro" });
    
    if (bus.bookedSeats >= bus.totalSeats) {
      return res.status(400).json({ error: "Seats full ആയി 😢" });
    }
    
    bus.bookedSeats += 1;
    await bus.save();
    res.json({ 
      msg: "Seat booked ✅", 
      available: bus.totalSeats - bus.bookedSeats,
      bus 
    });
  } catch (err) {
    res.status(400).json({error: err.message});
  }
});

// 4. D = DELETE - /api/buses PLURAL
app.delete('/api/buses/:id', async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ msg: "Bus delete ആയി ✅" });
  } catch (err) {
    res.status(400).json({error: err.message});
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT}-ൽ run ആവുന്നു`);
});
