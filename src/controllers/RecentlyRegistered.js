const LostPet = require('../model/LostPet')
const FoundPet = require('../model/FoundPet')
const RescuedPet = require('../model/RescuedPet')

module.exports = {
  async index(req, res) {
    const lostPets = await LostPet.find().sort({ updatedAt: -1 }).limit(6);
    const foundPets = await FoundPet.find().sort({ updatedAt: -1 }).limit(6);
    const rescuedPets = await RescuedPet.find().sort({ updatedAt: -1 }).limit(6);

    const recentlyPets = lostPets.concat(foundPets).concat(rescuedPets);

    return res.json(recentlyPets);
  },
}
