const fs = require('fs')
const Web3 = require('web3')
const contract = require('truffle-contract')
const path = require('path')

const network = process.argv[2] || 'development'
const config = require('../truffle').networks[network]
const provider = config.provider ? config.provider() : new Web3.providers.HttpProvider(`http://${config.host}:${config.port}`)
const web3 = new Web3(provider)

const contractNames = ['Registry']

const isDevelopment = network === 'development'
const isProduction = network === 'production'

async function publish() {
  const promises = contractNames.map(async contractName => {
    return new Promise((resolve, reject) => {
      const instance = contract(require('../build/contracts/' + contractName))
      instance.setProvider(provider)
      instance.detectNetwork().then(() => {
        resolve({
          name: instance.contractName,
          abi: instance.abi,
          address: instance.address,
          bytecode: instance.bytecode
        })
      })
    })
  })
  const config = {}
  const result = await Promise.all(promises)
  result.forEach(contract => {
    config[contract.name] = {
      abi: contract.abi,
      address: contract.address,
      bytecode: contract.bytecode
    }
  })

  const fileName = `contract.defs.${isDevelopment ? 'local' : network}.json`

  fs.writeFileSync(`${path.resolve(__dirname)}/../${fileName}`, JSON.stringify(config))
}

publish()
  .catch(console.error)
  .finally(() => process.exit(0))