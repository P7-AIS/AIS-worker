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
  used: boolean
  random_index: number

  trajRandom(progress: number, input: number, long: boolean): number {
    if (this.random_index !== 0) {
      return input
    }

    if (this.used) {
      return input
    }
    if (Math.random() > progress) {
      return input
    }
    let output = long ? Math.random() * 360 - 180 : Math.random() * 180 - 90
    console.log(output)
    this.used = true
    return output
  }
  cogRandom(progress: number, input?: number): number | undefined {
    if (this.random_index !== 1) {
      return input
    }
    if (this.used) {
      return input
    }
    if (!input) {
      return undefined
    }

    if (Math.random() > progress) {
      return input
    }
    this.used = true
    let output = (input + 180) % 360
    return output
  }
  sogRandom(progress: number, input?: number): number | undefined {
    if (this.random_index !== 2) {
      return input
    }
    if (this.used) {
      return input
    }
    if (!input) {
      return undefined
    }

    if (Math.random() > progress) {
      return input
    }
    this.used = true
    return Math.random() * 1000
  }
  repRandom(progress: number): boolean {
    if (this.random_index !== 3) {
      return true
    }
    if (this.used) {
      return true
    }

    if (Math.random() > progress) {
      return true
    }
    this.used = true
    return false
  }
  reset(): void {
    this.next = undefined
    this.used = false
  }

  reset_vessel(): void {
    this.reset()
    this.random_index = 1 // Math.floor(Math.random() * 3)
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
    this.used = false
    this.random_index = -1
  }
}

class NotRandomizer implements VesselRandomiser {
  reset_vessel(): void {}
  trajRandom(progress: number, input: number, long: boolean): number {
    return input
  }
  cogRandom(progress: number, input?: number): number | undefined {
    return input
  }
  sogRandom(progress: number, input?: number): number | undefined {
    return input
  }
  repRandom(progress: number): boolean {
    return true
  }
  reset(): void {}
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
