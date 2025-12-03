import bcrypt from "bcryptjs";
import User from "./models/users.js";
import sequelize from "./config/db.js";

await sequelize.authenticate();

const email = "test05@example.com";
const plain = "123456";

// Create user if missing
let user = await User.findOne({ where: { email } });
if (!user) {
  const hash = await bcrypt.hash(plain, 10);
  user = await User.create({ name: "Tester", email, password: hash });
  console.log("User created:", user.toJSON());
}

// Try login
const isMatch = await bcrypt.compare(plain, user.password);
console.log("Password matches?", isMatch);

process.exit();
