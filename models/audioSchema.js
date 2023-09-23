const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  audio: {
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
const Audios = new mongoose.model("Audios", audioSchema);

module.exports = Audios;
