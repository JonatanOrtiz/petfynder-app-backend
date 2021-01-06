const User = require('../model/User')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const mailer = require('../modules/mailer')
// const jwt = require('jsonwebtoken')
// const authConfig = require('../config/auth.json')

// function generateToken(params = {}) {
//   return jwt.sign(params, authConfig.secret, {
//     expiresIn: 86400
//   })
// }

module.exports = {
  async auth(req, res) {
    const { email, password } = req.body
    const lowerEmail = email.toLowerCase()
    
    const user = await User.findOne({ email: lowerEmail }).select('+password')

    if (!user) return res.status(400).send({ error: 'Usuário não encontrado!' })

    if (user.password) {
      if (!await bcrypt.compare(password, user.password)) return res.status(400).send({ error: 'Senha inválida!' })
    } else {
      return res.status(400).send({ error: 'Você criou sua conta vinculada ao Facebook, faça login através do Facebook.' })
    }

    user.password = undefined

    const { id } = user

    res.send({
      user, id
      // token: generateToken({ id: user._id })
    })
  },

  async updatePassword(req, res) {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.params.id).select('+password')

    if (!await bcrypt.compare(oldPassword, user.password)) return res.status(400).send({ error: 'Senha inválida!' })

    user.password = await bcrypt.hash(newPassword, 10)

    await user.save()

    user.password = undefined

    res.send({ success: 'Senha alterada com sucesso.' })
  },

  async forgotPassword(req, res) {
    const { email } = req.body
    const lowerEmail = email.toLowerCase()

    try {
      const user = await User.findOne({ email: lowerEmail })

      if (!user) return res.status(400).send({ error: 'Usuário não encontrado!' })

      const token = crypto.randomBytes(10).toString('hex')

      const now = new Date()
      now.setHours(now.getHours() + 1)

      user.passwordResetToken = token
      user.passwordResetExpires = now

      await user.save()

      await mailer.sendMail({
        subject: 'Petfynder - Renovação de senha',
        to: email,
        from: 'jonataneduard@gmail.com',
        template: 'auth/forgot_password',
        context: { token }
      }, (err) => {
        if (err) return res.status(400).send({ error: 'Erro ao enviar email' })
        return res.send();
      })
    } catch (e) {
      return res.status(400).send({ error: 'Erro ao solicitar token, tente novamente.' })
    }
  },

  async resetPassword(req, res) {
    const { email, token, password } = req.body
    const lowerEmail = email.toLowerCase()

    try {
      const user = await User.findOne({ email: lowerEmail }).select('+passwordResetToken passwordResetExpires')

      if (!user) return res.status(400).send({ error: 'Usuário não encontrado!' })

      if (token !== user.passwordResetToken) res.status(400).send({ error: 'Token Inválido!' })

      const now = new Date()
      
      if (now > user.passwordResetExpires) res.status(400).send({ error: 'Token expirado, solicite um novo!' })

      user.password = await bcrypt.hash(password, 10)

      await user.save()

      res.send()
    } catch (e) {
      return res.status(400).send({ error: 'Erro ao recadastrar senha, tente novamente.' })
    }
  }
}
