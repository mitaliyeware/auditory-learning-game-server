const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  selectedCategory: {
    type: String,
    required: true,
  },
});

//create model
const Images = new mongoose.model("Images", imageSchema);

module.exports = Images;
