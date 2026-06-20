// Bus Card Backend - Simple Student Code
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Frontend-ൽ നിന്ന് connect ചെയ്യാൻ
app.use(express.json()); // JSON data എടുക്കാൻ

// MongoDB connect ചെയ്യുന്നു
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log(' MongoDB connect ആയി bro'))
  .catch(err => console.log(' Error:', err));

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

// എല്ലാ bus-ഉം കാണിക്കാൻ - നിന്റെ frontend-ന് ഇത് മതി
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find(); // DB-യിൽ നിന്ന് എല്ലാം എടുക്കും
    res.json(buses); // Frontend-ലേക്ക് അയക്കും
  } catch (err) {
    res.status(500).json({error: 'Error വന്നു bro'});
  }
});

// Test ചെയ്യാൻ - server run ആവുന്നുണ്ടോ എന്ന് നോക്കാൻ
app.get('/', (req, res) => {
  res.send('Bus Card Backend Running ');
});

// Server start ചെയ്യുന്നു
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server port ${PORT}-ൽ run ആവുന്നു`);
});
