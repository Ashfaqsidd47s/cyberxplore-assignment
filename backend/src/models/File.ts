import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        default: "",
    },
    path: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "pending",
    },
    scannedAt: {
        type: Date,
        default: null,
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    }
}, {
    timestamps: true, 
});

// Rename createdAt to uploadedAt in the output
fileSchema.virtual('uploadedAt').get(function() {
    return this.createdAt;
});

// Ensure uploadedAt is included when converting to JSON
fileSchema.set('toJSON', { virtuals: true });

const File = mongoose.model("File", fileSchema);

export default File;