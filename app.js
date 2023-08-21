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

//to get data and cookies from front-end
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

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

app.get("/studentList", async (req, res) => {
  try {
    const { teacherId } = req.query;

    const studentList = await Users.find({
      userType: "child",
      teacherId,
    });

    const output = [];
    studentList?.forEach((student) =>
      output.push({
        firstName: student.firstName,
        lastName: student.lastName,
        rollNo: student.rollNo,
        ageGroup: student.ageGroup,
      })
    );

    res.status(200).json(output);
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
