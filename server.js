// Bus Card Backend - Fixed Code
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Frontend-ൽ നിന്ന് connect ചെയ്യാൻ
app.use(express.json()); // JSON data എടുക്കാൻ

// MongoDB connect ചെയ്യുന്നു
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connect ആയി bro'))
  .catch(err => console.log('❌ Error:', err));

// Bus-ന്റെ details save ചെയ്യാൻ
const Bus = mongoose.model('Bus', {
  busNumber: String,  // KL15A1234
  from: String,       // Mavelikara
  to: String,         // Haripad
  route: String,      // Route details
  type: String,       // KSRTC or Private
  time: String,       // 8:30 AM
  fare: Number        // Ticket rate
});

// എല്ലാ bus-ഉം കാണിക്കാൻ - frontend-ന് ഇത് മതി
app.get('/api/bus', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({error: 'Error വന്നു bro: ' + err.message});
  }
});

// Test ചെയ്യാൻ - server run ആവുന്നുണ്ടോ എന്ന് നോക്കാൻ
app.get('/', (req, res) => {
  res.send('Bus Card Backend Running ✅');
});

// Server start ചെയ്യുന്നു - Render-ന് 10000 വേണം
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT}-ൽ run ആവുന്നു`);
});
