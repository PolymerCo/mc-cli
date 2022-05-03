import { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { McRconAdmin, McRconOptions } from '@polymer-co/mc-rcon'
import '@polymer-co/rope'
const program = new Command();

interface Args {
  command?: string,
  configPath: string,
  save?: boolean,
  silent?: boolean,
  stop?: boolean,
  test?: boolean,
  verbose?: boolean,
  players?: boolean
}

program
  .option('rcon-cli')
  .option('Provides various utilities for interacting with a Minecraft server via CLI.')
  .option('--command <string>', 'send an arbitrary command to the server and print the result')
  .option('-c,--config-path <path>', 'path to the RCON config JSON file', 'config.json')
  .option('--save', 'save the current state to disk')
  .option('-s,--silent', 'silence all output')
  .option('--stop', 'stop the minecraft server')
  .option('-t,--test', 'test connection with server')
  .option('-v,--verbose', 'outputs messages to indicate non-action program state change')
  .option('--players', 'print a list of the current online players')

program.parse()

const args = program.opts() as Args

if (!existsSync(args.configPath)) {
  throw `Configuration file '${args.configPath} does not exist!`
}

const config = JSON.parse(readFileSync(args.configPath).toString('ascii')) as Partial<McRconOptions>
const rcon = new McRconAdmin(config)

!args.silent && args.verbose && console.log('connecting to RCON service..')

rcon.connect().then(async () => {
  !args.silent && args.verbose && console.log('connected via RCON.')

  if (args.test) {
    !args.silent && console.log('connection successful! exiting')
    process.exit(0)
  }

  if (args.command && !args.command.isEmptyOrWhitespace()) {
    !args.silent && console.log(`sending command: ${args.command}`)
    const result = await rcon.command(args.command)
    
    if (result && !result.isEmptyOrWhitespace()) {
      console.log(`successful: ${result}`)
    } else {
      console.log('successful')
    }
  }

  if (args.players) {
    const players = await rcon.list()
    const count = players.length

    !args.silent && console.log(`-- ${count} player${count == 1 ? '' : 's'} online`)

    players.forEach(player => {
      !args.silent && console.log(`${player.name}: ${player.uuid}`)
    })
  }

  if (args.save) {
    !args.silent && console.log('saving world..')
    await rcon.saveAll(true)
    !args.silent && console.log('world saved.')
  }

  if (args.stop) {
    !args.silent && console.log('stopping server..')
    await rcon.stop()
    !args.silent && console.log('server stopped.')
  }

  !args.silent && args.verbose && console.log('disconnecting from RCON.')

  await rcon.disconnect()
  process.exit(0)
})
