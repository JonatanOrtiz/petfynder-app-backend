const { Schema, model } = require('mongoose')

const LostPetSchema = new Schema({
  photos: [String],
  name: String,
  breed: String,
  state: String,
  city: String,
  district: String,
  street: String,
  phone: String,
  contactName: String,
  animal: String,
  gender: String,
  about: String,
  colors: [String],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  user: String,
}, {
  timestamps: true
})

// PetSchema.pre("save", function () {
//   if (!this.url) {
//     this.url = `${process.env.APP_URL}/files/${this.key}`;
//   }
// });

module.exports = model('LostPet', LostPetSchema)
