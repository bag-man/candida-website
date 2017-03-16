module.exports = (url) => {
  const Database = require('../database.js')
      , db = new Database(url)
      , { Model, Schema } = db.database

  const schema = new Schema(
    { id: Schema.ObjectId
    , name: String
    , species: String
    , hitid: String
    , def: String
    , accession: String
    , uniprot: String
    , cgdid: String
    , refseq: String
    , len: Number
    , bitscore: Number
    , evalue: Number
    , qfrom: Number
    , qto: Number
    , hfrom: Number
    , hto: Number
    , gaps: Number
    , alignlen: Number
    , contig: { head: String, seq: String }
    , protein: { head: String, seq: String, goids: [String] }
    }
  )

  class HitModel extends Model {
    findHitSeq () {
      return this.contig.seq
    }
  }

  try {
    return db.database.model('HitModel')
  } catch (error) {
    return db.database.model(HitModel, schema, 'hits')
  }
}
