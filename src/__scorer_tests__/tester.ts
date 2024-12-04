import ScorerTest, { VesselRandomiser } from './ScorerTest'
import dotenv from 'dotenv'

dotenv.config()

const MOD = 4294967295

class Randomizer implements VesselRandomiser {
  seed: number
  mult: number
  inc: number
  next: number | undefined
  delete: number

  trajRandom(index: number, input: number, long: boolean): number {
    if (Math.random() < 0.95) {
      return input
    }
    let output = long ? Math.random() * 360 - 180 : Math.random() * 180 - 90
    return output
  }
  cogRandom(index: number, input?: number): number | undefined {
    if (!input) {
      return undefined
    }

    if (Math.random() < 0.9) {
      return input
    }
    return Math.random() * 360
  }
  sogRandom(index: number, input?: number): number | undefined {
    if (!input) {
      return undefined
    }
    if (Math.random() < 0.9) {
      return input
    }

    return Math.random() * 1000
  }
  repRandom(index: number): boolean {
    if (this.delete > 0) {
      this.delete = this.delete - 1
      return false
    }
    if (this.random() > 0.9) {
      this.delete = this.random() * 1000
    }
    return true
  }
  reset(): void {
    this.next = undefined
  }

  private random(): number {
    let num = this.next ? this.next : this.seed
    let ran = (this.mult * num + this.inc) % MOD

    this.next = ran
    return ran / MOD
  }

  constructor() {
    this.seed = Math.floor(Math.random() * MOD)
    this.mult = Math.floor(Math.random() * MOD)
    this.inc = Math.floor(Math.random() * MOD)
    this.delete = 0
  }
}

class NotRandomizer implements VesselRandomiser {
  trajRandom(index: number, input: number, long: boolean): number {
    return input
  }
  cogRandom(index: number, input?: number): number | undefined {
    return input
  }
  sogRandom(index: number, input?: number): number | undefined {
    return input
  }
  repRandom(index: number): boolean {
    return false
  }
  reset(): void {}

  private prng(): number {
    return 0
  }
}

async function shit_lang() {
  const { DATABASE_URL } = process.env

  if (!DATABASE_URL) {
    throw new Error('Missing environment variables')
  }

  let vessels_to_test = [
    212521000, 219003113, 220046000, 212949000, 219000811, 219026706, 232007858, 244036000, 219031203, 220345000,
  ]

  console.log('Fetching from db')
  let scorerTester = new ScorerTest(DATABASE_URL)
  await scorerTester.initialize(vessels_to_test)

  let randomizer = new Randomizer()

  let notRandom = new NotRandomizer()

  console.log('Calculating non random results')
  let result_not_random = await scorerTester.runTest(notRandom)

  console.log(result_not_random)
  console.log('Calculating random results')
  let result_random = await scorerTester.runTest(randomizer)

  console.log(result_random)
  process.exit(0)
}

shit_lang()
