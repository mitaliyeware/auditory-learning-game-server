//import all dependencies
const dotenv = require("dotenv");
const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

//configure ENV file and require connection file
dotenv.config({ path: "./config.env" });
require("./database/connection");
const port = process.env.PORT;

//require model
const Users = require("./models/userSchema");
const Images = require("./models/imageSchema");
const Audios = require("./models/audioSchema");
const Questions = require("./models/questionsSchema");
//const errorHandler = require("./middleware/errorHandler");

//to get data and cookies from front-end
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: false }));
app.use(cookieParser());
app.use(cors());
// app.use("/", require("./routes/appRoutes"));
// app.use("/questions", require("./routes/questionRoutes"));
// app.use("/users", require("./routes/userRoutes"));
//app.use(errorHandler);

const output = [];

//register
app.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      contact,
      birthDate,
      rollNo,
      ageGroup,
      teacherId,
      userType, // Add userType to the request body
    } = req.body;

    // Check if the user is already exists in the database
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Existing user");
    }

    const createUser = new Users({
      firstName,
      lastName,
      email,
      password,
      contact,
      birthDate,
      userType, // Save the userType in the database
      teacherId,
      rollNo,
      ageGroup,
    });

    const created = await createUser.save();
    console.log(created);
    res.status(200).send("Registered");
  } catch (error) {
    res.status(400).send(error);
  }
});

//login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //find if the user is existing
    const user = await Users.findOne({ email: email });
    console.log(user);
    if (user) {
      //verify password
      const isMatch = await bcryptjs.compare(password, user.password);

      const userDetails = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        teacherId: user.teacherId,
        rollNo: user.rollNo,
      };

      if (isMatch) {
        //generate token which is defined in userSchema
        const token = await user.generateToken();
        res.cookie("jwt", token, {
          //expires token in 24 hours
          expires: new Date(Date.now() + 86400000),
          httpOnly: true,
        });
        res.status(200).json(userDetails);
      } else {
        res.status(400).send("Please enter valid credentials");
      }
    } else {
      res.status(400).send("Please enter valid credentials");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//Get list of students for teachers
app.get("/students", async (req, res) => {
  try {
    const { teacherId } = req.query;

    const students = await Users.find({
      userType: "kid",
      teacherId,
    });

    const output = [];
    students?.forEach((student) =>
      output.push({
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        ageGroup: student.ageGroup,
        email: student.email,
      })
    );

    res.status(200).json(output);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Get details student for parents
app.get("/student", async (req, res) => {
  try {
    const { parentEmail } = req.query;

    const studentData = await Users.find({
      userType: "kid",
      parentEmail,
    });

    const output = [];
    studentData?.forEach((student) =>
      output.push({
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        ageGroup: student.ageGroup,
        email: student.email,
      })
    );

    res.status(200).json(output);
  } catch (error) {
    res.status(400).send(error);
  }
});

// get user profile
app.get("/profile", async (req, res) => {
  try {
    const { userType, email } = req.query;

    const userDetails = await Users.findOne({
      userType,
      email,
    });

    const output = {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      contact: userDetails.contact,
      birthDate: userDetails.birthDate,
      rollNo: userDetails?.userType === "kid" ? userDetails.rollNo : undefined,
      ageGroup:
        userDetails?.userType === "kid" ? userDetails.ageGroup : undefined,
      parentEmail:
        userDetails?.userType === "kid" ? userDetails.parentEmail : undefined,
      teacherId: userDetails.teacherId,
      addressLine1: userDetails.addressLine1,
      addressLine2: userDetails.addressLine2,
      city: userDetails.city,
      zipCode: userDetails.zipCode,
      state: userDetails.state,
      country: userDetails.country,
      userType: userDetails.userType,
      image: userDetails.image,
    };

    res.status(200).json(output);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.put("/profile", async (req, res) => {
  try {
    const { queryField, updateFields } = req.body;
    const userDetails = await Users.findOneAndUpdate(
      queryField,
      {
        $set: updateFields,
      },
      { new: true }
    );

    const output = {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      contact: userDetails.contact,
      birthDate: userDetails.birthDate,
      rollNo: userDetails.userType === "kid" ? userDetails.rollNo : undefined,
      ageGroup:
        userDetails.userType === "kid" ? userDetails.ageGroup : undefined,
      parentEmail:
        userDetails?.userType === "kid" ? userDetails.parentEmail : undefined,
      teacherId: userDetails.teacherId,
      addressLine1: userDetails.addressLine1,
      addressLine2: userDetails.addressLine2,
      city: userDetails.city,
      zipCode: userDetails.zipCode,
      state: userDetails.state,
      country: userDetails.country,
      userType: userDetails.userType,
      image: userDetails.image,
    };

    res.status(200).json(output);
  } catch (error) {
    res.status(400).send(error);
  }
});

// delete profile
app.delete("/profile", async (req, res) => {
  try {
    const { email } = req.query;

    await Users.deleteOne({ email }); // Deleting the user with the provided email.

    res.status(200).send("Profile deleted successfully");
  } catch (error) {
    res.status(400).send(error);
  }
});

// upload image
app.post("/upload-image", async (req, res) => {
  try {
    const { image, name, selectedCategory } = req.body;

    const response = await Images.create({ image, name, selectedCategory });
    console.log({ image, name, selectedCategory });
    res.status(200).json({ image: response.name });
  } catch (error) {
    res.status(400).send(error);
  }
});

// upload audio
app.post("/upload-audio", async (req, res) => {
  try {
    const { audio, name, selectedCategory } = req.body;
    console.log("Audio request reached");
    const response = await Audios.create({ audio, name, selectedCategory });
    console.log("Audio file inserted into DB");
    res.status(200).json({ audio: response.name });
  } catch (error) {
    res.status(400).send(error);
  }
});

// create question
app.post("/generate-question", async (req, res) => {
  try {
    const { image, audio, selectedCategory } = req.body;
    const response = await Questions.create({
      image,
      audio,
      selectedCategory,
      // objectName,
    });
    res.status(200).json({ response: "Media uploaded successfully" });
  } catch (error) {
    console.error("Error while generating question:", error);
    res.status(400).send({ message: "Failed to generate question." });
  }
});

// generate question and answer to learn
app.get("/learn", async (req, res) => {
  try {
    const { category } = req.query; // Extracting the category from query parameters
    console.log(`Received category: ${category}`);

    const output = [];
    const questions = category
      ? await Questions.find({ selectedCategory: category }).lean()
      : await Questions.find().lean();
    console.log(`Fetched questions for ${category}:`, questions);

    console.log("questions: ", questions);
    for (let question of questions) {
      const imageData = await Images.findOne({ name: question.image });
      const audioData = await Audios.findOne({ name: question.audio });
      output.push({ id: question._id, image: imageData, audio: audioData });
    }
    console.log("Prepared questions to send:", output);
    res.status(200).json(output);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/matchmasters", async (req, res) => {
  try {
    const { category } = req.query;
    const output = [];
    const questions = category
      ? await Questions.find({ selectedCategory: category }).lean()
      : await Questions.find().lean();
    const randomQuestions = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      randomQuestions.push(questions[randomIndex]);
      questions.splice(randomIndex, 1); // remove the selected question
    }

    for (let question of randomQuestions) {
      const imageData = await Images.findOne({ name: question.image });
      const audioData = await Audios.findOne({ name: question.audio });
      output.push({ id: question._id, image: imageData, audio: audioData });
    }
    res.status(200).json(output);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
};

app.get("/digitdashy", async (req, res) => {
  try {
    const { category } = req.query;
    console.log(`Received category: ${category}`);

    const output = [];
    // Count the number of items in the selected category
    const countSelectedCategory = await Questions.countDocuments({
      selectedCategory: category,
    });

    // Randomly decide which documents to skip to from the selected category
    const randomSkipSelected = Math.floor(
      Math.random() * (countSelectedCategory - 2)
    );

    // Fetch 3 random items of the selected category
    const selectedQuestions = await Questions.find({
      selectedCategory: category,
    })
      .skip(randomSkipSelected)
      .limit(3)
      .lean();

    // Count the number of items in categories other than the selected category
    const countOtherCategory = await Questions.countDocuments({
      selectedCategory: { $ne: category },
    });

    // Randomly decide which document to skip to from other categories
    const randomSkipOther = Math.floor(Math.random() * countOtherCategory);

    // Fetch 1 random item from a different category
    const otherCategory = await Questions.find({
      selectedCategory: { $ne: category },
    })
      .skip(randomSkipOther)
      .limit(1)
      .lean();

    let combinedQuestions = [...selectedQuestions, ...otherCategory];

    combinedQuestions = shuffleArray(combinedQuestions);

    console.log("Shuffled combined questions:", combinedQuestions);

    for (let question of combinedQuestions) {
      const imageData = await Images.findOne({ name: question.image });
      const audioData = await Audios.findOne({ name: question.audio });
      output.push({
        id: question._id,
        image: imageData,
        audio: audioData,
        selectedCategory: question.selectedCategory,
      });
    }
    console.log("Prepared questions to send:", output);
    res.status(200).set("Cache-Control", "no-store").json(output);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/targettuck", async (req, res) => {
  try {
    const { category } = req.query;

    const output = [];
    const questions = category
      ? await Questions.find({ selectedCategory: category }).lean()
      : await Questions.find().lean();

    const randomQuestions = [];
    const numQuestionsToFetch = Math.min(questions.length, 4); // Adjust for fewer questions

    for (let i = 0; i < numQuestionsToFetch; i++) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      randomQuestions.push(questions[randomIndex]);
      questions.splice(randomIndex, 1); // remove the selected question
    }

    for (let question of randomQuestions) {
      const imageData = await Images.findOne({ name: question.image });

      // Fetch the audio data based on the sound name stored in questions
      const audioData = await Audios.findOne({ name: question.audio });

      output.push({
        id: question._id,
        image: imageData,
        audio: audioData, // This should now contain the actual sound URL
      });
    }

    res.status(200).json(output);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/peculiarpick", async (req, res) => {
  try {
    const selectedCategory = req.query.category;

    // Fetch selected category images
    const selectedImages = await Images.find({ selectedCategory });

    // Fetch other category images (excluding the selected category)
    const otherImages = await Images.find({
      selectedCategory: { $ne: selectedCategory },
    }).limit(9);

    res.status(200).json({ selectedImages, otherImages });
  } catch (error) {
    res.status(400).send(error);
  }
});

//logout page
app.get("/logout", (req, res) => {
  res.clearCookie("jwt", { path: "/" });
  res.status(200).send("User Logged Out");
});

//Run server
app.listen(process.env.PORT, () => {
  console.log(`Server is listening ${process.env.PORT}`);
});

// app.get("/media/:filename", async (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const file = await Questions.findOne({ filename: filename }); // Assuming filename is unique

//     if (!file) {
//       return res.status(404).send("File not found");
//     }

//     res.set("Content-Type", file.contentType); // Assuming you saved the content type when uploading
//     res.send(file.data);
//   } catch (error) {
//     console.error("Error fetching media:", error);
//     res.status(500).send("Internal server error");
//   }
// });
// const dotenv = require("dotenv");
// const express = require("express");
// const bcryptjs = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const app = express();

// //configure ENV file and require connection file
// dotenv.config({ path: "./config.env" });
// require("./database/connection");
// const port = process.env.PORT;

// //require model
// const Users = require("./models/userSchema");

// //to get data and cookies from front-end
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(cors());

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//   })
// );

// const port_ga = process.env.PORT || 8080;
//app.listen(port_ga, () => console.log(`Listening on port ${port_ga}...`));
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID:
//         "266047439759-fvarqjjbnb1963fjb46chpo9sr8aunni.apps.googleusercontent.com",
//       clientSecret: "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",
//       callbackURL: "http://localhost:3001/auth/google/callback",
//     },
//     async (token, tokenSecret, profile, done) => {
//       // Here you can check if the user exists in your database and create it if not
//       // For this example, let's just return the profile
//       return done(null, profile);
//     }
//   )
// );

// // Use session to keep track of login
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   // Here you would fetch the user from the database using the id
//   done(null, id);
// });

// // Route to start OAuth flow
// app.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })
// );

// // Callback route after Google authentication
// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => {
//     // Successful login
//     res.redirect("/"); // Redirect to the desired page after login
//   }
// );

// const options: cors.CorsOptions = {
//   allowedHeaders: [
//     "Origin",
//     "X-Requested-With",
//     "Content-Type",
//     "Accept",
//     "x-token-header",
//     "x-access-token",
//   ],

//   credentials: true,
//   methods: "GET, HEAD, OPTIONS, PUT, PATCH, POST, DELETE",
//   origin: "*",
//   preflightContinue: false,
// };

// app.use(cors(options));

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// Require the models for both child and teacher
// const Users = require("./models/userSchema");
// const Teachers = require("./models/teacherSchema");

// // registration
// app.post("/register", async (req, res) => {
//   try {
//     // Get body or data
//     const userType = req.body.userType;
//     const firstname = req.body.firstname;
//     const lastname = req.body.lastname;
//     const username = req.body.username;
//     const email = req.body.email;
//     const password = req.body.password;
//     const contact = req.body.contact;
//     const birthdate = req.body.birthdate;
//     const rollno = req.body.rollno;
//     const agegroup = req.body.agegroup;

//     // // Check if the user already exists based on email
//     // let existingUser;
//     // if (userType === "child") {
//     //   existingUser = await Users.findOne({ email: email });
//     // } else if (userType === "teacher") {
//     //   existingUser = await Users.findOne({ email: email });
//     // }

//     // if (existingUser) {
//     //   return res.status(400).send("User already exists.");
//     // }

//     // Create and save the user in the appropriate collection
//     if (userType === "child") {
//       const createUser = new Users({
//         userType: userType,
//         firstname: firstname,
//         lastname: lastname,
//         username: username,
//         email: email,
//         password: password,
//         contact: contact,
//         birthdate: birthdate,
//         rollno: rollno,
//         agegroup: agegroup,
//       });
//       await createUser.save();
//     } else if (userType === "teacher") {
//       const createTeacher = new Teachers({
//         userType: userType,
//         firstname: firstname,
//         lastname: lastname,
//         username: username,
//         email: email,
//         password: password,
//         contact: contact,
//         birthdate: birthdate,
//         rollno: rollno,
//         teacherId: teacherId,
//       });
//       await createTeacher.save();
//     }

//     console.log("User registered successfully");
//     res.status(200).send("Registered");
//   } catch (error) {
//     console.log(error);
//     res.status(400).send("Error during registration");
//   }
// });

//     //save method is used to create user
//     const created = await createUser.save();
//     console.log(created);
//     res.status(200).send("Registered");
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

//register
// app.post("/register", async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       password,
//       contact,
//       birthDate,
//       rollNo,
//       ageGroup,
//       teacherId,
//       userType, // Add userType to the request body
//     } = req.body;

//     // Check if the user is already exists in the database
//     const existingUser = await Users.findOne({ email });
//     if (existingUser) {
//       return res.status(400).send("Existing user");
//     }

//     const createUser = new Users({
//       firstName,
//       lastName,
//       email,
//       password,
//       contact,
//       birthDate,
//       userType, // Save the userType in the database
//       teacherId,
//       rollNo,
//       ageGroup,
//     });

//     const created = await createUser.save();
//     console.log(created);
//     res.status(200).send("Registered");
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// //login user
// app.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     //find if the user is existing
//     const user = await Users.findOne({ email: email });
//     console.log(user);
//     if (user) {
//       //verify password
//       const isMatch = await bcryptjs.compare(password, user.password);

//       const userDetails = {
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         userType: user.userType,
//         teacherId: user.teacherId,
//       };

//       if (isMatch) {
//         //generate token which is defined in userSchema
//         const token = await user.generateToken();
//         res.cookie("jwt", token, {
//           //expires token in 24 hours
//           expires: new Date(Date.now() + 86400000),
//           httpOnly: true,
//         });
//         res.status(200).json(userDetails);
//       } else {
//         res.status(400).send("Please enter valid credentials");
//       }
//     } else {
//       res.status(400).send("Please enter valid credentials");
//     }
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// app.get("/studentList", async (req, res) => {
//   try {
//     const { teacherId } = req.query;

//     const studentList = await Users.find({
//       userType: "child",
//       teacherId,
//     });

//     const output = [];
//     studentList?.forEach((student) =>
//       output.push({
//         firstName: student.firstName,
//         lastName: student.lastName,
//         rollNo: student.rollNo,
//         ageGroup: student.ageGroup,
//       })
//     );

//     res.status(200).json(output);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// //logout page
// app.get("/logout", (req, res) => {
//   res.clearCookie("jwt", { path: "/" });
//   res.status(200).send("User Logged Out");
// });

// //Run server
// app.listen(process.env.PORT, () => {
//   console.log(`Server is listening ${process.env.PORT}`);
// });

//import all dependencies
// const dotenv = require("dotenv");
// const express = require("express");
// const bcryptjs = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const app = express();

// //configure ENV file and require connection file
// dotenv.config({ path: "./config.env" });
// require("./database/connection");
// const port = process.env.PORT;

//require model
// const Users = require("./models/userSchema");
// const Images = require("./models/imageSchema");
// const Audios = require("./models/audioSchema");
// const Questions = require("./models/questionsSchema");
// const errorHandler = require("./middleware/errorHandler");

// //to get data and cookies from front-end
// app.use(express.json({ limit: "15mb" }));
// app.use(express.urlencoded({ limit: "15mb", extended: false }));
// app.use(cookieParser());
// app.use(cors());
// app.use("/", require("./routes/appRoutes"));
// app.use("/questions", require("./routes/questionRoutes"));
// app.use("/users", require("./routes/userRoutes"));
// app.use(errorHandler);
