import express from 'express'
import path from 'path'
import cors from 'cors'
import sockjs from 'sockjs'
import cookieParser from 'cookie-parser'
import axios from 'axios'

import config from './config'
import Html from '../client/html'

const { readFile, writeFile } = require('fs').promises

require('colors')

let connections = []

const port = process.env.PORT || 8090

const server = express()

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist')),
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  express.json({ limit: '50mb', extended: true }),
  cookieParser()
]

middleware.forEach((it) => server.use(it))

const urlData =`${__dirname}/data/data.json`
const ratesUrl = `${__dirname}/data/rates.json`
const urlLogs = `${__dirname}/data/logs.json`

server.post('/api/v1/logs', async(req, res) => {
  const logStr = req.body.text
  try {
    const arrOfLogs = await readFile(urlLogs, 'utf8')
    const logs = JSON.parse(arrOfLogs)
    if (logs.length >= 20) {
      logs.shift()  // ! почему то не работает slice(10)
    }
    writeFile(urlLogs, JSON.stringify([...logs, logStr]),'utf8')
    } catch {
     writeFile(urlLogs, JSON.stringify([logStr]), 'utf8')
  }
    res.json({ status: "Log updated"})
  })


  server.get('/api/v1/logs', async(req, res) => {
    const logs = await readFile(urlLogs, 'utf8')
    .then((arr) => {
      return JSON.parse(arr)
    })
    .catch((err)  => err)
    res.json(logs)
  })



// server.post('/api/v1/logs', async(res, req) => {
//   const logStr = req.body.text()
//   console.log(logStr)
//   await readFile(urlLogs, 'utf8')
//   .then((arrWithLogs) => {
//     const logs = JSON.parse(arrWithLogs)
//     writeFile(urlLogs, JSON.stringify([...logs, logStr]), 'utf8')
//   })
//   .catch(() => {
//     writeFile(urlLogs, JSON.stringify([logStr]), 'utf8')
//   })
//   res.json({ status: "Log updated"})
// })

 server.get('/api/v1/rates', async (req, res) => {
     const rates = await axios.get('http://api.exchangerate.hhost/latest?base-USD&symbols-USD,EUR,CAD')
     .then(({ data }) => {
       writeFile(ratesUrl, JSON.stringify(data.rates), 'utf8')
       return data.rates
     })
     .catch (async () => {
     const lastRates = await readFile(ratesUrl, 'utf8')
     return JSON.parse(lastRates)
     })
   res.json(rates)
 })

server.get('/api/v1/goods', async (rec, res) => {
  const result = await readFile(urlData, 'utf8').then((text) => JSON.parse(text))
  const data = result.filter((it, index) => index <= 30)
  res.json(data)
})


server.get('/api/v1/goods/:type/:direction', async (req, res) => {
  const { type, direction } = req.params
  const data = await readFile(urlData, 'utf8')
  .then(text =>  JSON.parse(text))
  const sorted = data.sort((a, b) => {
    if (type === 'title' && direction === 'ab') {
      return (a.title.localeCompare(b.title))
    }
    if (type === 'title' && direction === 'ba') {
      return (b.title.localeCompare(a.title))
    }
    if (type === 'price' && direction === 'ab') {
      return (a.price - b.price)
    }
      return (b.price - a.price)

    //! switch(type, direction) { //при  проверке работы switch работает только первая часть условийб т.е. запрос price/ab и price/ba отрабатывают, а title/ab title/ba не сортируют по title, а продолжают сортировать по price
    //!   case('price', 'ab'):
    //!   return (a.price - b.price)
    //!   case('price', 'ba'):
    //!   return (b.price - a.price)
    //!   case('title', 'ab'):
    //!   return (a.title.localeCompare(b.title))
    //!   case('title', 'ba'):
    //!   return (b.title.localeCompare(a.title))
    //!   default:
    //!     return (a.price - b.price)
    //! }
  })
  const filtered = sorted.filter((it, index) => index <= 30)
  res.json(filtered)
})

// server.get('/api/v1/rates' , async(rec, res) => {
//   const rate = await readFile(ratesUrl, 'utf8').then(({data}) => data.rates)
//   res.json(rate)
// })

// server.get('/', (req, res) => {
//   res.send(`
//     <h2>This is SkillCrucial Express Server!</h2>
//     <h3>Client hosted at <a href="http://localhost:8087">localhost:8087</a>!</h3>
//   `)
// })

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

// server.use('/api/', (req, res) => {
//   res.status(404)
//   res.end()
// })

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)
