const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema({
    total: {
        type: Number,
        default: 0
    },
    log: [{
        type: Date,
        default: Date.now
    }]
});

module.exports = mongoose.model("View", viewSchema);
