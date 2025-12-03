import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import bcrypt from "bcryptjs";

class User extends Model {
  //  Compare raw candidate password with stored hashed password
  async comparePassword(candidatePassword) {
    if (!this.password) return false; // OAuth / no password case
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: { isNumeric: true, len: [10, 15] }
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // null for OAuth users
    },
    role: {
      type: DataTypes.ENUM("patient", "practitioner", "admin"),
      allowNull: false,
      defaultValue: "patient"
    },
   // isVerified: {
    //  type: DataTypes.BOOLEAN,
    //  defaultValue: true //admin ke baad false karna hai
    //}
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    timestamps: true,
    hooks: {
      //  Hash password only when it’s new/changed
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith("$2b$")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && user.password && !user.password.startsWith("$2b$")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
