const mongoose = require("mongoose");

const db = process.env.DATABASE;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection Successful");
  })
  .catch((e) => {
    console.log("Database Connection Failed", e);
  });
