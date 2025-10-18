import { mongoose } from "./connection.js";

const classroomSchema = new mongoose.Schema({
  classroomId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  courses:[ {type: mongoose.Schema.Types.ObjectId, ref: "Course"}
  ],
  lessons: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }
  ],
  students: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Student" }
  ],
  startTime:{type: Date, required: true},
  duration:{type: Number, required: true},
  numStudents:{type: Number, default: 0},
  owner: { type: String, required: true }, 
  status: {
    type: String,
    enum: ["Draft", "Published", "Archived"],
    default: "Draft"
  },
  
}, { timestamps: true });

const CreatedClassrooms = mongoose.model("Classrooms", classroomSchema);

export default CreatedClassrooms;