
import fetch from 'node-fetch'
import cors from '@fastify/cors'
import fastify from 'fastify'

import { config } from 'dotenv'

config(); // https://github.com/sveltejs/sapper/issues/122
// const urldata = require('fastify-url-data')


const server = fastify()
// app.register(urldata)
server.register(cors, {
  // put your options here
  origin: ['*', 'http://localhost:3000'],
  methods: ['*'],
  // credentials: true,
  // allowedHeaders: 'Accept, X-Requested-With, Content-type'
  allowedHeaders: '*'
})


server.get('/', function (request, reply) {
  reply.code(200).send({ message: "Hello world!" });
})

async function getfile(cid, gateway) {
  console.log('getfile: ', cid, gateway)
  let res = await fetch(gateway + cid)
  if(res.ok) {
    return {
      gateway,
      type: res.headers.get('content-type'),
      arrBuf: await res.arrayBuffer()
    }
  }
}

server.get("/:cid", async (req, res) => {
  const cid = req.params.cid;
  const name = req.query.name;

  // weird edge case
  if (cid == 'favicon.ico') return

  console.log('>> requesting -->', cid, name)
  
  let file
  let result = await Promise.any([
    getfile(cid, "https://dweb.link/ipfs/"),
    getfile(cid, "https://ipfs.fleek.co/ipfs/"),
    getfile(cid, "https://gateway.ipfs.io/ipfs/"),
    getfile(cid, "https://cloudflare-ipfs.com/ipfs/"),
    getfile(cid, "https://cf-ipfs.com/ipfs/"),
    getfile(cid, "https://ipfs.io/ipfs/"),
    getfile(cid, "https://ipfs.infura.io/ipfs/"),
  ])

  if(result) {
    console.log('result:', result);
    file = result
  
    //   return res.send(type);
    res.headers({
      'Content-Type': file.type, // uncommenting headers makes Chrome show it
      // 'Content-disposition': `attachment; filename="${name}"`, // downloads
      'Content-Disposition': `inline; filename="${name}"`, // shows in browser
    })
  
    return res.send(Buffer.from(file.arrBuf));
  }

  return res.send('nothing bub')
});


server.listen(process.env.PORT || 8080, "0.0.0.0", (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
// module.exports = app
// export default app

// export default async (req, res) => {
//   await app.ready();
//   app.server.emit('request', req, res);
// }

