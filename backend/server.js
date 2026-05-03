require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Models
const Lead = require('./models/Lead');
const View = require('./models/View');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- LEAD ENDPOINTS ---

// GET all leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ submittedAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leads' });
    }
});

// POST a new lead
app.post('/api/leads', async (req, res) => {
    try {
        console.log('📩 Received Lead Data:', req.body);
        const newLead = new Lead(req.body);
        await newLead.save();
        console.log('✅ Lead Saved to MongoDB:', newLead);
        res.status(201).json({ message: 'Lead added successfully', lead: newLead });
    } catch (error) {
        console.error('❌ Error saving lead:', error);
        res.status(500).json({ message: 'Error saving lead' });
    }
});

// DELETE a lead
app.delete('/api/leads/:id', async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting lead' });
    }
});

// UPDATE lead status
app.patch('/api/leads/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Lead.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

// CLEAR all leads
app.delete('/api/leads', async (req, res) => {
    try {
        await Lead.deleteMany({});
        res.json({ message: 'All leads cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing leads' });
    }
});

// --- VIEW TRACKING ENDPOINTS ---

// GET total views
app.get('/api/views', async (req, res) => {
    try {
        let viewData = await View.findOne();
        if (!viewData) {
            viewData = new View({ total: 0, log: [] });
            await viewData.save();
        }
        res.json(viewData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching views' });
    }
});

// POST increment view
app.post('/api/views', async (req, res) => {
    try {
        let viewData = await View.findOne();
        if (!viewData) {
            viewData = new View({ total: 1, log: [new Date()] });
        } else {
            viewData.total += 1;
            viewData.log.push(new Date());
            // Keep log manageable
            if (viewData.log.length > 1000) viewData.log.shift();
        }
        await viewData.save();
        res.json({ message: 'View tracked', total: viewData.total });
    } catch (error) {
        res.status(500).json({ message: 'Error tracking view' });
    }
});

// RESET views
app.delete('/api/views', async (req, res) => {
    try {
        await View.deleteMany({});
        const newView = new View({ total: 0, log: [] });
        await newView.save();
        res.json({ message: 'Views reset' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting views' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
