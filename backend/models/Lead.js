const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    inquiry: String,
    message: String,
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "new"
    }
});

module.exports = mongoose.model("Lead", leadSchema);
