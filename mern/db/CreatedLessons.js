// mern/database/CreatedLessons.js
import { mongoose } from "./connection.js";

const lessonSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  objective : String,
  prerequisites: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }
  ],
  createdBy: String,
  status: { type: String, enum: ["Draft", "Published", "Archived"] },
  creditPoints: { type: Number, default: 0 },
  readings: [
    { title: String, url: String }
  ],
  assignments: [
    { title: String, dueDate: Date, points: Number }
  ],
  estimatedWork: { type: Number, default: 0 },
  
  course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Course", 
        // ❌ REMOVE: required: true 
        default: null // Explicitly set default to null for new standalone lessons
    }
}, { timestamps: true });

const CreatedLessons = mongoose.model("Lesson", lessonSchema);

export default CreatedLessons;   // ✅ default export
