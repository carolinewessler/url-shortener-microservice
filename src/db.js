const mongoose = require('mongoose')

async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI não encontrada no .env')
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB conectado ✅')
  })

  mongoose.connection.on('error', (err) => {
    console.error('Erro MongoDB:', err.message)
  })

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })

  // console.log('DB name:', mongoose.connection.db?.databaseName)
  // console.log('Host:', mongoose.connection.host)

  // const collections = await mongoose.connection.db.listCollections().toArray()
  // console.log(collections.map(c => c.name))
}

module.exports = connectDB
