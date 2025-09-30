import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/concrete-tracker';

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Pour Schema
const pourSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pour_id: { type: String, required: true },
  date: { type: String, required: true },
  area: { type: Number, required: true },
  price_per_sqft: { type: Number, required: true },
  labor_cost: { type: Number, required: true },
  equipment_cost: { type: Number, required: true },
  fuel_cost: { type: Number, required: true },
  repairs_cost: { type: Number, required: true },
  consumables_cost: { type: Number, required: true },
  lunch_cost: { type: Number, required: true },
  misc_cost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Pour = mongoose.model('Pour', pourSchema);

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pour routes
app.get('/api/pours', authenticateToken, async (req, res) => {
  try {
    const pours = await Pour.find({ userId: req.user.userId })
      .sort({ date: -1, createdAt: -1 });
    
    // Convert MongoDB documents to plain objects with id field
    const poursWithId = pours.map(pour => ({
      id: pour._id.toString(),
      user_id: pour.userId.toString(),
      pour_id: pour.pour_id,
      date: pour.date,
      area: pour.area,
      price_per_sqft: pour.price_per_sqft,
      labor_cost: pour.labor_cost,
      equipment_cost: pour.equipment_cost,
      fuel_cost: pour.fuel_cost,
      repairs_cost: pour.repairs_cost,
      consumables_cost: pour.consumables_cost,
      lunch_cost: pour.lunch_cost,
      misc_cost: pour.misc_cost,
      created_at: pour.createdAt
    }));

    res.json(poursWithId);
  } catch (error) {
    console.error('Get pours error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/pours', authenticateToken, async (req, res) => {
  try {
    const {
      pour_id,
      date,
      area,
      price_per_sqft,
      labor_cost,
      equipment_cost,
      fuel_cost,
      repairs_cost,
      consumables_cost,
      lunch_cost,
      misc_cost
    } = req.body;

    const pour = new Pour({
      userId: req.user.userId,
      pour_id,
      date,
      area,
      price_per_sqft,
      labor_cost,
      equipment_cost,
      fuel_cost,
      repairs_cost,
      consumables_cost,
      lunch_cost,
      misc_cost
    });

    await pour.save();

    // Return in the expected format
    const newPour = {
      id: pour._id.toString(),
      user_id: pour.userId.toString(),
      pour_id: pour.pour_id,
      date: pour.date,
      area: pour.area,
      price_per_sqft: pour.price_per_sqft,
      labor_cost: pour.labor_cost,
      equipment_cost: pour.equipment_cost,
      fuel_cost: pour.fuel_cost,
      repairs_cost: pour.repairs_cost,
      consumables_cost: pour.consumables_cost,
      lunch_cost: pour.lunch_cost,
      misc_cost: pour.misc_cost,
      created_at: pour.createdAt
    };

    res.json(newPour);
  } catch (error) {
    console.error('Create pour error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/pours/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Pour.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!result) {
      return res.status(404).json({ error: 'Pour not found' });
    }

    res.json({ message: 'Pour deleted successfully' });
  } catch (error) {
    console.error('Delete pour error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
