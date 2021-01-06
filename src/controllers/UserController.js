// const fs = require("fs");
// const path = require("path");
// const { promisify } = require("util");
const aws = require("aws-sdk");
// const s3 = new aws.S3();
const User = require('../model/User')
const bcrypt = require('bcrypt')
const LostPet = require('../model/LostPet')
const FoundPet = require('../model/FoundPet')

// const jwt = require('jsonwebtoken')
// const authConfig = require('../config/auth.json')

// function generateToken(params = {}) {
//   return jwt.sign(params, authConfig.secret, {
//     expiresIn: 86400
//   })
// }

module.exports = {

  async findUserAndPopulateLost(req, res) {
    const user = await User.findById(req.params.id).populate({path: 'lostPets', options: { sort: { 'updatedAt': -1 }}});

    return res.json(user);
  },

  async findUserAndPopulateFound(req, res) {
    const user = await User.findById(req.params.id).populate({path: 'foundPets', options: { sort: { 'updatedAt': -1 }}});

    return res.json(user);
  },

  async store(req, res) {
    const { email, password } = req.body
    const lowerEmail = email.toLowerCase()

    try {
      if (await User.findOne({ email: lowerEmail })) {
        return res.status(400).send({ error: 'Este usuário já existe!' })
      }

      const encryptedPassword = await bcrypt.hash(password, 10)

      const user = await User.create({
        email: lowerEmail,
        password: encryptedPassword,
        deviceToken: '',
        location: {
          type: 'Point',
          coordinates: [0, 0]
        }
      })

      user.password = undefined

      return res.send(
        user.id
        // token: generateToken({ id: user._id })
      )
    } catch (e) {
      return res.status(400).send({ error: 'Erro ao registrar!' })
    }
  },

  async facebookLogin(req, res) {
    const { email } = req.body

    try {
      const user = await User.findOne({ email })
      if (user) {
        const { id } = user

        res.send({
          user, id
          // token: generateToken({ id: user._id })
        })
      } else {
        const user = await User.create({
          email,
          deviceToken: '',
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        })

        return res.send(
          user.id
          // token: generateToken({ id: user._id })
        )
      }
    } catch (e) {
      return res.status(400).send({ error: 'Erro ao registrar!' })
    }
  },

  async updateNotification(req, res) {
    const { deviceToken, latitude, longitude } = req.body

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const user = await User.findByIdAndUpdate(req.params.id, {
      deviceToken,
      location
    }, { new: true });

    return res.json(user)
  },

  async updateLostFavorite(req, res) {
    const { petId, favorite } = req.body

    if (favorite === 'makeFavorite') {

      const user = await User.findById(req.params.id)

      user.lostFavorites = [...user.lostFavorites, petId]

      await user.save()

    } else if (favorite === 'undoFavorite') {

      const user = await User.findByIdAndUpdate(req.params.id, {
        $pull: { lostFavorites: petId }
      });

      await user.save()
    }

    return res.send()
  },

  async updateFoundFavorite(req, res) {
    const { petId, favorite } = req.body

    if (favorite === 'makeFavorite') {

      const user = await User.findById(req.params.id)

      user.foundFavorites = [...user.foundFavorites, petId]

      await user.save()

    } else if (favorite === 'undoFavorite') {

      const user = await User.findByIdAndUpdate(req.params.id, {
        $pull: { foundFavorites: petId }
      });

      await user.save()
    }

    return res.send()
  },

  async lostFavorites(req, res) {
    const user = await User.findById(req.params.id)

    const lostFavorites = await LostPet.find().where('_id').in(user.lostFavorites).sort({ updatedAt: -1 }).exec();

    return res.json(lostFavorites)
  },

  async foundFavorites(req, res) {

    const user = await User.findById(req.params.id)

    const foundFavorites = await FoundPet.find().where('_id').in(user.foundFavorites).sort({ updatedAt: -1 }).exec();

    return res.json(foundFavorites)
  },

  async delete(req, res) {
    const user = await User.findById(req.params.id).select('+password')
    const { password } = req.headers

    if (user.password || password) {
      if (!await bcrypt.compare(password, user.password)) return res.status(400).send({ error: 'Senha inválida!' })
    }

    await user.remove();

    return res.send();
  }
}
