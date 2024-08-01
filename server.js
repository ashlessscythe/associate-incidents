import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configure CORS
const corsOptions = {
  origin: true, // This allows all origins. In production, you might want to be more specific.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors());
app.use(express.json());

// JWT AUTH Section
const JWT_SECRET = process.env.JWT_SECRET || 'bobdoesntcareaboutbob';

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// end of JWT AUTH Section

app.get("/api/associates", async (req, res) => {
  const associates = await prisma.associate.findMany();
  res.json(associates);
});

app.get("/api/incidents/:associateId", authenticateToken, async (req, res) => {
  const { associateId } = req.params;
  const incidents = await prisma.incident.findMany({
    where: { associateId },
    include: {
      type: true, // include full details
    },
    orderBy: { date: "desc" },
  });
  res.json(incidents);
});

app.get("/api/incident-types", async (req, res) => {
  const incidentTypes = await prisma.incidentType.findMany();
  res.json(incidentTypes);
});

app.post("/api/incidents", authenticateToken, async (req, res) => {
  const { typeId, description, isVerbal, associateId } = req.body;

  try {
    const newIncident = await prisma.incident.create({
      data: {
        typeId,
        description,
        isVerbal,
        associateId,
        date: new Date(),
      },
    });

    res.json(newIncident);
  } catch (err) {
    console.error("failed to create incident:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// New routes for CRUD operations

app.get("/api/incidents/single/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { type: true },
    });
    if (incident) {
      res.json(incident);
    } else {
      res.status(404).json({ message: "Incident not found" });
    }
  } catch (err) {
    console.error("Failed to fetch incident:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/incidents/:id", async (req, res) => {
  const { id } = req.params;
  const { typeId, description, isVerbal } = req.body;
  try {
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: { typeId, description, isVerbal },
      include: { type: true },
    });
    res.json(updatedIncident);
  } catch (err) {
    console.error("Failed to update incident:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/incidents/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.incident.delete({
      where: { id },
    });
    res.json({ message: "Incident deleted successfully" });
  } catch (err) {
    console.error("Failed to delete incident:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
