const RescuedPet = require('../model/RescuedPet')

module.exports = {

  async index(req, res) {
    const lostpets = await RescuedPet.find().sort({ createdAt: -1 });

    return res.json(lostpets);
  },

  async store(req, res) {
    const photo = req.files[0].key;
    const { name, breed, state, city, district, street, animal, gender, about, user } = req.body

    const rescued = await RescuedPet.create({
      photo,
      name,
      breed,
      state,
      city,
      district,
      street,
      animal,
      gender,
      about,
      user,
    })

    return res.send()
  }
}