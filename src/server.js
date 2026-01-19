require('dotenv').config()
const app = require('./index.js')
const connectDB = require('./db')

const PORT = process.env.PORT || 3000

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

start()
