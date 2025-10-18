import {mongoose} from "./connection.js";

const options = { discriminatorKey: "role", collection: "users" };

const baseUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
}, options);

//Automatic status update based on lastLogin
baseUserSchema.pre('save', function(next) {
  // Only update status if lastLogin is being modified
  if (this.isModified('lastLogin') && this.lastLogin) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Automatically set status based on last login
    this.status = this.lastLogin >= thirtyDaysAgo ? 'Active' : 'Inactive';
  }
  next();
});

const User = mongoose.model("User", baseUserSchema);

// Extend for Student
const Student = User.discriminator("Student", 
  new mongoose.Schema({
    title: { type: String, enum: ["Mr", "Ms", "Mrs", "Other"], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classrooms", default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", default: null }
  })
);

// Extend for Instructor
const Instructor = User.discriminator("Instructor", 
  new mongoose.Schema({
    title: { type: String, enum: ["Mr", "Ms", "Mrs", "Other"], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    // subjects: [{ type: String }]
  })
);

// Admin (no extra fields)
const Admin = User.discriminator("Admin", new mongoose.Schema({}));

export { Student, Instructor, User, Admin };