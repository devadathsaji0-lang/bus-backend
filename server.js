const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Frontend-ൽ നിന്ന് connect ചെയ്യാൻ
app.use(express.json()); // JSON data എടുക്കാൻ

// MongoDB connect ചെയ്യുന്നു - Render-ൽ MONGO_URI എന്ന് വെച്ചാൽ മതി
mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connect ആയി bro'))
  .catch(err => console.log('❌ Error:', err));

// Bus Schema - booking fields കൂടി add ചെയ്തു
const busSchema = new mongoose.Schema({
  busNumber: String,  // KL15A1234
  from: String,       // Mavelikara
  to: String,         // Haripad
  route: String,      // Route details
  type: String,       // KSRTC or Private
  time: String,       // 8:30 AM
  fare: Number,       // Ticket rate
  totalSeats: { type: Number, default: 40 }, // പുതിയത്
  bookedSeats: { type: Number, default: 0 }  // പുതിയത്
});

const Bus = mongoose.model('Bus', busSchema);

// Test route - server run ആവുന്നുണ്ടോ എന്ന് നോക്കാൻ
app.get('/', (req, res) => {
  res.send('Bus Card Backend Running ✅ CRUD Ready');
});

// 1. R = READ - എല്ലാ bus-ഉം കാണിക്കാൻ
app.get('/api/bus', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({error: 'Error വന്നു bro: ' + err.message});
  }
});

// 2. C = CREATE - പുതിയ bus add ചെയ്യാൻ
app.post('/api/bus', async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json({ msg: "Bus add ആയി ✅", bus });
  } catch (err) {
    res.status(400).json({error: 'Error: ' + err.message});
  }
});

// 3. U = UPDATE - Spot booking / Seat book ചെയ്യാൻ
app.put('/api/book/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: "Bus കിട്ടിയില്ല bro" });
    
    if (bus.bookedSeats >= bus.totalSeats) {
      return res.status(400).json({ error: "Seats full ആയി 😢" });
    }
    
    bus.bookedSeats += 1;
    await bus.save();
    res.json({ msg: "Seat booked ✅", bus });
  } catch (err) {
    res.status(400).json({error: err.message});
  }
});

// 4. D = DELETE - Bus delete ചെയ്യാൻ
app.delete('/api/bus/:id', async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ msg: "Bus delete ആയി ✅" });
  } catch (err) {
    res.status(400).json({error: err.message});
  }
});

// Server start ചെയ്യുന്നു - Render-ന് PORT auto കിട്ടും
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT}-ൽ run ആവുന്നു`);
});
