const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  deviceToken: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  lostPets: [{ type: Schema.Types.ObjectId, ref: 'LostPet' }], 
  foundPets: [{ type: Schema.Types.ObjectId, ref: 'FoundPet' }],
  lostFavorites: [{ type: Schema.Types.ObjectId, ref: 'LostPet' }],
  foundFavorites: [{ type: Schema.Types.ObjectId, ref: 'FoundPet' }],
}, {
  timestamps: true
})

UserSchema.index({ location: '2dsphere' });

// User.pre('save', async function (next) {
  // if (!this.url) {
  //   this.url = `${process.env.APP_URL}/files/${this.key}`;
  // }
// });

module.exports = model('User', UserSchema)
