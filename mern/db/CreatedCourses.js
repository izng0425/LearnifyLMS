import { mongoose } from "./connection.js";

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  lessons: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }
  ],
  status: {
    type: String,
    enum: ["Draft", "Published", "Archived"],
    default: "Draft"
  },
  totalCredit: { type: Number, default: 0 },
  owner: { type: String, required: true }, 
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  
}, { timestamps: true });

const CreatedCourses = mongoose.model("Course", courseSchema);

export default CreatedCourses;