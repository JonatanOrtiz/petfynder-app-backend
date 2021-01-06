const { Schema, model } = require('mongoose')

const RescuedPetSchema = new Schema({
  photo: String,
  name: String,
  breed: String,
  state: String,
  city: String,
  district: String,
  street: String,
  animal: String,
  gender: String,
  about: String,
  user: String,
}, {
  timestamps: true
})

// PetSchema.pre("save", function () {
//   if (!this.url) {
//     this.url = `${process.env.APP_URL}/files/${this.key}`;
//   }
// });

module.exports = model('RescuedPet', RescuedPetSchema)
