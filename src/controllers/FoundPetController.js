const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const aws = require("aws-sdk");
const s3 = new aws.S3();
const admin = require("firebase-admin");
const FoundPet = require('../model/FoundPet')
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
      lostOrFound: 'found',
      id: id
    },
    notification: {
      title: "",
      body: "  Um novo Pet foi encontrado!",
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
    const foundpets = await FoundPet.find({
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

    return res.json(foundpets);
  },

  async findOnePet(req, res) {
    const foundpet = await FoundPet.findById(req.params.id);

    return res.json(foundpet);
  },

  async store(req, res) {
    const photos = []
    req.files.map(file => photos.push(file.key));
    const { breed, state, city, district, street, phone, contactName, animal, gender, colors, about, latitude, longitude, user } = req.body
    const colorsArray = colors.split(',')
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const foundpet = await FoundPet.create({
      photos,
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

    const { _id } = foundpet

    const userProfile = await User.findById(user)

    userProfile.foundPets = [...userProfile.foundPets, _id]

    await userProfile.save()

    const { id } = foundpet

    sendNotification(id, latitude, longitude)

    return res.json(foundpet)
  },

  async update(req, res) {
    const photos = []
    req.files.map(file => photos.push(file.key));
    const { breed, state, city, district, street, animal, phone, contactName, gender, colors, about, latitude, longitude, photosForDelete } = req.body
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

    const foundpet = await FoundPet.findByIdAndUpdate(req.params.id, {
      photos,
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

    await foundpet.save()

    return res.json(foundpet)
  },

  async delete(req, res) {
    const foundpet = await FoundPet.findById(req.params.id);
    await User.findByIdAndUpdate(foundpet.user, {
      $pull: { foundPets: foundpet._id }
    });

    const deleteParams = {
      Bucket: "petfynderimages",
      Delete: { Objects: [] }
    };

    foundpet.photos.forEach((content) => {
      deleteParams.Delete.Objects.push({ Key: content });
    });

    if (process.env.STORAGE_TYPE === "s3") {
      s3.deleteObjects(deleteParams).promise();
    } else {
      promisify(fs.unlink)(path.resolve(__dirname, "..", "..", "tmp", "uploads", this.key));
    }

    await foundpet.remove();

    return res.send();
  }
}