const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  audio: {
    type: String,
    required: true,
  },
  selectedCategory: {
    type: String,
    required: true,
  },

  //   objectName: {
  //     type: String,
  //     required: true,
  //   },
});

//create model
const Questions = new mongoose.model("Questions", questionSchema);

module.exports = Questions;
