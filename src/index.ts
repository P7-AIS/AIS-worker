import { Queue } from 'bullmq'
import dotenv from 'dotenv'
import AISWorker from './implementations/AISWorker'
import RandomScorer from './implementations/RandomScorer'
import HashScorer from './implementations/HashScorer'
<<<<<<< HEAD
import SimpleScorer from './implementations/SimpleScorer'
=======
import VesselScore from './implementations/VesselScorer'
>>>>>>> f940fdedddff6e1697945322463c1d4889508bc8

dotenv.config()

const { REDIS_IP, REDIS_PORT, REDIS_QUEUE_NAME } = process.env

if (!REDIS_IP || !REDIS_PORT || !REDIS_QUEUE_NAME) {
  throw new Error('Missing environment variables')
}

const connection = { host: REDIS_IP, port: Number(REDIS_PORT) }
const queue = new Queue(REDIS_QUEUE_NAME, { connection })

const randomScorer = new RandomScorer()
const simpleScorer = new SimpleScorer()
const hashScorer = new HashScorer()

const aisWorker = new AISWorker(queue, connection, randomScorer, simpleScorer, hashScorer)

aisWorker.start()
