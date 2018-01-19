const fasta2json = require('fasta2json')
    , gff2json = require('bionode-gff')
    , species =
      { contigs: __dirname + '/../data/ecoli.fa'
      , gff: __dirname + '/../data/prokka-ecoli.gff'
      , name: 'ecoli'
      }
    , createDatabase = require('../app/database')
    , HitModel = require('../app/models/hit')
    , ContigModel = require('../app/models/contig')
    , db = createDatabase()

db.dropDatabase().then(() => {
  let contigs = fasta2json.ReadFasta(species.contigs)

  ContigModel.create(contigs, (err) => {
    if (err) console.log('ERROR: ' + err)

    let promises = []

    gff2json.read(species.gff).on('data', (gff) => {
      promises.push(new Promise((resolve, reject) => {
        let contig = contigs.find(x => x.head.split(' ')[0] === gff.seqid)

        ContigModel.findOne({ head: contig.head }, { _id: true }).then((contigId) => {
          let savedContig = { id: contigId._id, head: contig.head }

          // this needs to be checked, and probably reverse complimented
          let codingseq = contig.seq.substr(gff.start, gff.end)

          if (gff.strand === '-') {
            let reverse = codingseq.split('').reverse().join('')

            codingseq = reverse.replace(/[ACTG]/g, (base) => {
              return 'ACTG'.charAt('TGAC'.indexOf(base))
            })
          }

          let gffId = gff.attributes.ID
          let product = gff.attributes.product
          let locustag = gff.attributes.locus_tag
          let name = gff.attributes.Name

          delete gff.attributes.ID
          delete gff.attributes.product
          delete gff.attributes.locus_tag
          delete gff.attributes.Name

          let hit = Object.assign(
            { species: species.name
            , gffId
            , product
            , locustag
            , name
            , contig: savedContig
            , codingseq
            }, gff)

          HitModel.create(hit).then(() => {
            resolve()
          }).catch(err => reject(err))
        }).catch(err => reject(err))
      }))

    }).on('end', () => {
      Promise.all(promises).then(() => {
        db.collection('hits').createIndex(
          { 'contig.head': 'text'
          , gffId: 'text'
          , locustag: 'text'
          , product: 'text'
          , name: 'text'
          }
        , { weights:
            { product: 8
            , 'contig.head': 6
            , locusttag: 10
            , gffId: 10
            , name: 10
            }
          , name: 'hit_search_index'
          }
        )
        db.close(() => {
          console.log('Finished.')
          process.exit(0)
        })
      }).catch(console.error)
    })
  })
})
