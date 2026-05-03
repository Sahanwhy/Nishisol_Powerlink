const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    inquiry: String,
    message: String,
    status: {
        type: String,
        default: "new"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Keep submittedAt for compatibility with existing dashboard
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Lead", leadSchema);
