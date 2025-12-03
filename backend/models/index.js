import sequelize from "../config/db.js";
import User from "./users.js";
import Schedule from "./schedule.js";

// Initialize associations after both models are loaded
const initializeAssociations = () => {
  // User associations
  User.hasMany(Schedule, { 
    as: "practitionerSchedules", 
    foreignKey: "practitionerId",
    onDelete: "CASCADE"
  });
  
  User.hasMany(Schedule, { 
    as: "patientSchedules", 
    foreignKey: "patientId",
    onDelete: "SET NULL"
  });

  // Schedule associations
  Schedule.belongsTo(User, { 
    as: "practitioner", 
    foreignKey: "practitionerId"
  });
  
  Schedule.belongsTo(User, { 
    as: "patient", 
    foreignKey: "patientId"
  });

  console.log("✅ Model associations initialized");
};

// Initialize associations
initializeAssociations();

export { User, Schedule, sequelize };
export default { User, Schedule, sequelize };