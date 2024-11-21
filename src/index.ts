import { Queue } from 'bullmq'
import dotenv from 'dotenv'
import AISWorker from './implementations/AISWorker'
import RandomScorer from './implementations/RandomScorer'
import HashScorer from './implementations/HashScorer'
import SimpleScorer from './implementations/SimpleScorer'
import DatabaseHandler from './implementations/DatabaseHandler'

dotenv.config()

const { REDIS_IP, REDIS_PORT, REDIS_QUEUE_NAME, DB_CONNECTION_STRING } = process.env

if (!REDIS_IP || !REDIS_PORT || !REDIS_QUEUE_NAME || !DB_CONNECTION_STRING) {
  throw new Error('Missing environment variables')
}

const databaseHandler = new DatabaseHandler(DB_CONNECTION_STRING)

const redisConnection = { host: REDIS_IP, port: Number(REDIS_PORT) }
const queue = new Queue(REDIS_QUEUE_NAME, { connection: redisConnection })

const randomScorer = new RandomScorer()
const simpleScorer = new SimpleScorer()
const hashScorer = new HashScorer()

const aisWorker = new AISWorker(queue, databaseHandler, redisConnection, randomScorer, simpleScorer, hashScorer)

aisWorker.start()
