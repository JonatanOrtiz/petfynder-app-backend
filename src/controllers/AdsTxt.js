const fs = require('fs');
const file = 'app-ads.txt'

module.exports = {

  async index(req, res) {
    const text = fs.readFileSync(__dirname + `/../../app-ads/${file}`, 'utf8');
      res.set({ "Content-Disposition": `attachment; filename=\"${file}\"` });
      console.log(text)
      return res.send(text);
  }
}
