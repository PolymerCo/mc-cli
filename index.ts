import { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { McRconAdmin, McRconOptions } from '@polymer-co/mc-rcon'
const program = new Command();

interface Args {
  configPath: string,
  stop?: boolean,
  save?: boolean,
  players?: boolean
}

program
  .option('rcon-cli')
  .option('Provides various utilities for interacting with a Minecraft server via CLI.')
  .option('--stop', 'stop the minecraft server')
  .option('--save', 'save the current state to disk')
  .option('--players', 'print a list of the current online players')
  .option('--config-path <path>', 'path to the RCON config JSON file', 'config.json')

program.parse()

const args = program.opts() as Args

if (!existsSync(args.configPath)) {
  throw `Configuration file '${args.configPath} does not exist!`
}

const config = JSON.parse(readFileSync(args.configPath).toString('ascii')) as Partial<McRconOptions>
const rcon = new McRconAdmin(config)

console.log('connecting to RCON service..')

rcon.connect().then(async () => {
  console.log('connected via RCON.')

  if (args.players) {
    const players = await rcon.list()
    const count = players.length

    console.log(`-- ${count} player${count == 1 ? '' : 's'} online`)

    players.forEach(player => {
      console.log(`${player.name}: ${player.uuid}`)
    })
  }

  if (args.save) {
    console.log('saving world..')
    await rcon.saveAll(true)
    console.log('world saved.')
  }

  if (args.stop) {
    console.log('stopping server..')
    await rcon.stop()
    console.log('server stopped.')
  }

  console.log('disconnecting from RCON.')

  rcon.disconnect()
})
