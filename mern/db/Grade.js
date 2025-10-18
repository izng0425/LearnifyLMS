import { mongoose } from "./connection.js";


const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References your Student discriminator
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true
  },
    classroom: { type: mongoose.Schema.Types.ObjectId, 
      ref: 'Classroom', 
      required: true 
    }, // ✅ new field
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    default: ''
  }
});

// Auto-calculate passed status (50+ = pass)
gradeSchema.pre('save', function(next) {
  this.passed = this.score >= 50;
  next();
});

// Pre-findOneAndUpdate hook for updates
gradeSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If score is being updated, recalculate passed
  if (update.$set && update.$set.score !== undefined) {
    update.$set.passed = update.$set.score >= 50;
  } else if (update.score !== undefined) {
    // For direct field updates (without $set)
    update.passed = update.score >= 50;
  }
  
  this.setUpdate(update);
  next();
});

// Also add hook for findByIdAndUpdate
gradeSchema.pre('findByIdAndUpdate', function(next) {
  const update = this.getUpdate();
  
  if (update.$set && update.$set.score !== undefined) {
    update.$set.passed = update.$set.score >= 50;
  } else if (update.score !== undefined) {
    update.passed = update.score >= 50;
  }
  
  this.setUpdate(update);
  next();
});

gradeSchema.index({ student: 1, lesson: 1, classroom: 1 }, { unique: true });


const Grade = mongoose.model('Grade', gradeSchema);



export default Grade;