const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const aws = require("aws-sdk");
const s3 = new aws.S3();
const admin = require("firebase-admin");
const LostPet = require('../model/LostPet')
const User = require('../model/User')

async function sendNotification(id, latitude, longitude) {

  const users = await User.find({
    $and: [
      {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 10000,
          },
        },
      },
      {
        deviceToken: { $ne: '' }
      }
    ]
  });

  const payload = {
    data: {
      lostOrFound: 'lost',
      id: id
    },
    notification: {
      title: "",
      body: "  Um novo Pet se perdeu!",
      sound: "default",
      color: '#dc4e41',
    }
  };

  const options = {
    contentAvailable: true,
    priority: 'high',
  };

  users.map(user => {
    admin.messaging().sendToDevice(user.deviceToken, payload, options)
      .then(function (response) {
      })
      .catch(function (error) {
        console.log('Error sending message: ', error);
      })
  })
}

module.exports = {

  async index(req, res) {
    let searchInput
    if (Object.keys(req.query).length !== 0) {
      searchInput = req.query.searchInput
    } else {
      searchInput = req.headers.searchinput
    }
    // const searchInputFormatted = searchInput.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const searchOptions = { $regex: searchInput, $options: "i" }
    // const searchOptions = searchInput
    const lostpets = await LostPet.find({
      $or: [
        { name: searchOptions },
        { breed: searchOptions },
        { state: searchOptions },
        { district: searchOptions },
        { street: searchOptions },
        { animal: searchOptions },
        { gender: searchOptions },
        { about: searchOptions },
        { colors: searchOptions },
        { city: searchOptions },
      ]
    }).sort({ updatedAt: -1 });
    // .collation({ locale: "en", strength: 1 }).sort({ updatedAt: -1 });

    return res.json(lostpets);
  },

  async findOnePet(req, res) {
    const lostpet = await LostPet.findById(req.params.id);

    return res.json(lostpet);
  },

  async store(req, res) {
    // console.log(req.body)
    // console.log(req.files)
    const photos = []
    req.files.map(file => photos.push(file.key));
    const { name, breed, state, city, district, street, phone, contactName, animal, gender, colors, about, latitude, longitude, user } = req.body
    const colorsArray = colors.split(',')
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const lostpet = await LostPet.create({
      photos,
      name,
      breed,
      state,
      city,
      district,
      street,
      phone,
      contactName,
      animal,
      gender,
      about,
      colors: colorsArray,
      location,
      user
    })

    const { _id } = lostpet

    const userProfile = await User.findById(user)

    userProfile.lostPets = [...userProfile.lostPets, _id]

    await userProfile.save()

    const { id } = lostpet

    sendNotification(id, latitude, longitude)

    return res.json(lostpet)
  },

  async update(req, res) {
    const photos = []
    req.files.map(file => photos.push(file.key));
    const { name, breed, state, city, district, street, phone, contactName, animal, gender, colors, about, latitude, longitude, photosForDelete } = req.body
    const colorsArray = colors.split(',')
    const photosForDeleteArray = photosForDelete.split(',')

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const deleteParams = {
      Bucket: "petfynderimages",
      Delete: { Objects: [] }
    };

    photosForDeleteArray.forEach((content) => {
      deleteParams.Delete.Objects.push({ Key: content });
    });

    if (process.env.STORAGE_TYPE === "s3") {
      s3.deleteObjects(deleteParams).promise();
    } else {
      promisify(fs.unlink)(path.resolve(__dirname, "..", "..", "tmp", "uploads", this.key));
    }

    const lostpet = await LostPet.findByIdAndUpdate(req.params.id, {
      photos,
      name,
      breed,
      state,
      city,
      district,
      street,
      animal,
      phone,
      contactName,
      gender,
      about,
      colors: colorsArray,
      location,
    }, { new: true })

    await lostpet.save()

    return res.json(lostpet)
  },

  async delete(req, res) {
    const lostpet = await LostPet.findById(req.params.id);
    await User.findByIdAndUpdate(lostpet.user, {
      $pull: { lostPets: lostpet._id }
    });

    const deleteParams = {
      Bucket: "petfynderimages",
      Delete: { Objects: [] }
    };

    lostpet.photos.forEach((content) => {
      deleteParams.Delete.Objects.push({ Key: content });
    });

    if (process.env.STORAGE_TYPE === "s3") {
      s3.deleteObjects(deleteParams).promise();
    } else {
      promisify(fs.unlink)(path.resolve(__dirname, "..", "..", "tmp", "uploads", this.key));
    }

    await lostpet.remove();

    return res.send();
  }
}