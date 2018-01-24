const HitModel = require('../models/hit.js')
    , template = require('pug').compileFile(__dirname + '/../assets/templates/pages/hit.pug')
    // , max = 1000

class hitController {
  constructor (req, res, fields) {
    this.res = res
    this.fields = fields
  }

  render (title, data, options, error) {
    let html = template({ title, data, options, error, fields: this.fields })
    this.res.send(html)
  }

  view (id, search) {
    let constraints = { _id: false }
    HitModel.findOne(id, constraints, (err, data) => {
      if (err) {
        this.render('Something went wrong', null, search, err)
      } else {
        this.render('GENE VIEW', [ data ], search, null)
      }
    }).lean()
  }

  search (options) {
    let constraints =
	{ _id: true
        , 'contig.head': true
        , start: true
        , end: true
        , type: true
        , 'attributes.ID': true
	}
      , search = JSON.parse(JSON.stringify(options))
      // , limit = options.limit < max ? parseInt(options.limit) : max
      , attributes = {}

    if (options.fields) {
      for (let i = 0; i < options.fields.length; i++) {
        attributes['attributes.' + options.fields[i]] = new RegExp(options.inputs[i], 'i')
      }

      delete options.fields
      delete options.inputs
    }

    for (let option in options) {
      options[option] = new RegExp(options[option], 'i')
    }

    Object.assign(options, attributes)

    HitModel.find(options, constraints, (err, data) => {
      if (err) {
        this.render('Something went wrong', null, options, err)
      } else {
        if (!data.length) {
          this.render('Search', null, search, 'No results.')
        } else {
          this.render('Search', data, search, null)
        }
      }
    })
  }
}

module.exports = hitController
