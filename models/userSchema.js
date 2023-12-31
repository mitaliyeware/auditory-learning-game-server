const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

//user schema or document structure
const userSchema = new mongoose.Schema({
  userType: {
    type: String,

    enum: ["child", "teacher"],
    default: "child", // Only "child" or "teacher" is allowed as the value
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  // username: {
  //   type: String,
  //   required: true,
  //   unique: true,
  // },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  rollNo: {
    type: String,
    required: false,
  },
  ageGroup: {
    type: String,
    required: false,
  },
  teacherId: {
    type: Number,
    required: true,
  },

  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

//hashing password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = bcryptjs.hashSync(this.password, 10);
  }
  next();
});

//generate tokens to verify user
userSchema.methods.generateToken = async function () {
  try {
    let generatedToken = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    this.tokens = this.tokens.concat({ token: generatedToken });
    await this.save();
    return generatedToken;
  } catch (error) {
    console.log(error);
  }
};

//create model
const Users = new mongoose.model("Users", userSchema);

module.exports = Users;
