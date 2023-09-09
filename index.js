const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const { preNettyVersionsByProtocolVersion } = require('minecraft-data')
const collectBlock = require('mineflayer-collectblock').plugin


const bot = mineflayer.createBot({
    host: 'localhost',
    port: '64599',
    username: 'Bot V2.5',
})

bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea (pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})

bot.on('physicTick', () => {
  if (!guardPos) return

  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
                      e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})

function arrena(){
    bot.chat('/fill ~ ~ ~ ~30 ~ ~30 stone_bricks')
    bot.chat('/fill ~ ~ ~ ~30 ~5 ~ stone_bricks')
    bot.chat('/fill ~ ~ ~ ~ ~5 ~30 stone_bricks')
    bot.chat('/fill ~ ~ ~ ~30 ~5 ~30 stone_bricks')
    bot.chat('/fill ~1 ~1 ~1 ~29 ~5 ~29 air')
}

bot.on('chat', (username, message) => {
  if (message === 'guard') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('I will guard that location.')
    guardArea(player.entity.position)
  }

  if (message === 'pvp') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.lookAt(player)
    bot.pvp.attack(player.entity)
  }

  if (message === 'stop') {
    bot.chat('I stop my action')
    stopGuarding()
  }

  if (message === 'jump') {
    bot.setControlState('jump', true)
  }

  if (message === 'forward') {
    bot.setControlState('forward', true)
  }

  if (message === 'back') {
    bot.setControlState('back', true)
  }

  if (message === 'sprint') {
    bot.setControlState('sprint', true)
  }

  if (message === 'left') {
    bot.setControlState('left', true)
  }

  if (message === 'right') {
    bot.setControlState('right', true)
  }
  if (message === 'crarr') {
    try {
        arrena()
        bot.chat('Arrena created !')
        const player = bot.players[username]
    } catch (err) {
        bot.chat('Arrena not created please retry !')
    }
  }

  if (message === 'help') {
    bot.chat('All command of the bot: guard - pvp - forward - back - jump - sprint - left - right - crarr - stop - help [this command]')
  }
})
bot.loadPlugin(collectBlock)
  
let mcData
bot.once('spawn', () => {
    mcData = require('minecraft-data')(bot.version)
})

bot.on('rain', () => {
  bot.chat('Say good bey to the rain!')
  bot.chat('/weather clear')
})

bot.on('entitySleep', () => {
  bot.chat("A player is sleeping")
})

bot.on('playerJoined', () => {
  bot.chat("Welcome, " + player.name)
})

bot.on('itemDrop', () => {
  bot.chat('§4Warning your drop an item !')
})
  
bot.on('chat', async (username, message) => {
    const args = message.split(' ')
    if (args[0] !== 'collect') return
  
    let count = 1
    if (args.length === 3) count = parseInt(args[1])
  
    let type = args[1]
    if (args.length === 3) type = args[2]
  
    const blockType = mcData.blocksByName[type]
    if (!blockType) {
      return
    }
  
    const blocks = bot.findBlocks({
      matching: blockType.id,
      maxDistance: 64,
      count: count
    })
  
    if (blocks.length === 0) {
      bot.chat("I don't see that block nearby.")
      return
    }
  
    const targets = []
    for (let i = 0; i < Math.min(blocks.length, count); i++) {
      targets.push(bot.blockAt(blocks[i]))
    }
  
    bot.chat(`Found ${targets.length} ${type}(s)`)
  
    try {
      await bot.collectBlock.collect(targets)
      bot.chat('Done')
    } catch (err) {
      bot.chat(err.message)
      console.log(err)
    }

})
