import config from "../config";
import async from 'async';
import * as moment from 'moment';
import $ from 'jquery';
import {
  ERROR,
  CONFIGURE,
  CONFIGURE_RETURNED,
  GET_BALANCES,
  GET_BALANCES_RETURNED,
  GET_BALANCES_PERPETUAL,
  GET_BALANCES_PERPETUAL_RETURNED,
  STAKE,
  STAKE_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_REWARDS,
  GET_REWARDS_RETURNED,
  EXIT,
  EXIT_RETURNED,
  PROPOSE,
  PROPOSE_RETURNED,
  GET_PROPOSALS,
  GET_PROPOSALS_RETURNED,
  VOTE_FOR,
  VOTE_FOR_RETURNED,
  VOTE_AGAINST,
  VOTE_AGAINST_RETURNED,
  GET_CLAIMABLE_ASSET,
  GET_CLAIMABLE_ASSET_RETURNED,
  CLAIM,
  CLAIM_RETURNED,
  GET_CLAIMABLE,
  GET_CLAIMABLE_RETURNED,
  GET_YCRV_REQUIREMENTS,
  GET_YCRV_REQUIREMENTS_RETURNED,
} from '../constants';
import Web3 from 'web3';

import {
  injected,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  frame,
  fortmatic,
  portis,
  squarelink,
  torus,
  authereum
} from "./connectors";

const rp = require('request-promise');
const ethers = require('ethers');

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      currentBlock: 0,
      universalGasPrice: '70',
      account: {},
      web3: null,
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        Ledger: ledger,
        Trezor: trezor,
        Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        Squarelink: squarelink,
        Torus: torus,
        Authereum: authereum
      },
      web3context: null,
      languages: [
        {
          language: 'English',
          code: 'en'
        },
        {
          language: 'Japanese',
          code: 'ja'
        },
        {
          language: 'Chinese',
          code: 'zh'
        }
      ],
      proposals: [
      ],
      claimableAsset: {
        id: 'YYFI',
        name: 'yearn.finance',
        address: config.yfiAddress,
        abi: config.yfiABI,
        symbol: 'YYFI',
        balance: 0,
        decimals: 18,
        rewardAddress: '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d',
        rewardSymbol: 'aDAI',
        rewardDecimals: 18,
        claimableBalance: 0
      },
      rewardPools: [
        {
          id: 'Seed Pool',
          name: 'yfarmland.finance',
          website: 'app.yfarmland.finance',
          link: 'https://app.yfarmland.finance/',
          YieldCalculatorLink: "",   //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'WETH/YFARMER Uniswap',
              address: '0x9E4700445bD0deEEDE76Fb23dca904798E304f90',
              symbol: 'ETH',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.seedPoolEthUniRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'ethereum',
              usdValue:0
            },
            {
              id: 'USDT/YFARMER Uniswap',
              address: '0x260C1356E1379dc6510992b46b5bEdd2b3587C55', 
              symbol: 'USDT',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.seedPoolUsdUniRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'tether',
              usdValue:0

            }
          ]
        },
        {
          id: 'Annual Farm Pool',
          name: 'Annual Farm Pool',
          website: 'app.yfarmland.finance',
          link: 'https://app.yfarmland.finance/',
          YieldCalculatorLink: "",   //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'WETH',
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              symbol: 'ETH',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.annualPoolWethRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'ethereum',
              usdValue:0
            },
            {
              id: 'Compound',
              address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
              symbol: 'COMP',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.annualPoolCompRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'compound-governance-token',
              usdValue:0
            }
            ,
            {
              id: 'YFI',
              address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
              symbol: 'YFI',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.annualPoolYfiRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'yearn-finance',
              usdValue:0
            }
          ]
        },
        {
          id: 'Biennial Farm Pool',
          name: 'Biennial Farm Pool',
          website: 'app.yfarmland.finance',
          link: 'https://app.yfarmland.finance/',
          YieldCalculatorLink: "",   //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'WETH',
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              symbol: 'ETH',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.biAnnualPoolEthRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              coinGeckoName:'ethereum',
              lockedWithdraw:false,
              usdValue:0
            },
            {
              id: 'Compound',
              address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
              symbol: 'COMP',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.biAnnualPoolCompRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'compound-governance-token',
              usdValue:0
            }
            ,
            {
              id: 'YFI',
              address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
              symbol: 'YFI',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.biAnnualPoolYfiRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'yearn-finance',
              usdValue:0
            }
          ]
        },
        {
          id: 'Perennial Farm Pool',
          name: 'Perennial Farm Pool',
          website: 'app.yfarmland.finance',
          link: 'https://app.yfarmland.finance/',
          YieldCalculatorLink: "",   //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'WETH',
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              symbol: 'ETH',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.preAnnualPoolEthRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'ethereum',
              usdValue:0
            },
            {
              id: 'Compound',
              address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
              symbol: 'COMP',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.preAnnualPoolCompRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'compound-governance-token',
              usdValue:0
            }
            ,
            {
              id: 'YFI',
              address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
              symbol: 'YFI',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.preAnnualPoolYfiRewardsAddress,
              rewardsABI: config.yCurveFiRewardsABI,
              rewardsSymbol: 'YFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'yearn-finance',
              usdValue:0
            }
          ]
        },
        {
          id: 'Abracadabra Pot',
          name: 'Abracadabra Pot',
          website: 'app.yfarmland.finance',
          link: 'https://app.yfarmland.finance/',
          YieldCalculatorLink: "",   //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'WETH/pYFARMER Uniswap',
              address: '0xff417643D4E98B52c7E894407dd23F8eDD8167f0',
              symbol: 'ETH',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.abracadabraPoolRewardsAddress,
              rewardsABI: config.abracadabraABI,
              rewardsSymbol: 'pYFARMER',
              Rewardsdecimals: 18,
              rewardsBalance:0,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
              totalStaked: 0,
              lockedWithdraw:false,
              coinGeckoName:'ethereum',
              usdValue:0
            }
          ]
        }
        /*{
          id: 'balancer',
          name: 'Balancer Pool',
          website: 'pools.balancer.exchange',
          link: 'https://pools.balancer.exchange/#/pool/0xd19e1b2f35a17c0f65bba7824b2a73678b30a530',
          YieldCalculatorLink: "", //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'bpt',
              address: '0xd19e1b2f35a17c0f65bba7824b2a73678b30a530',
              symbol: 'BPT',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.balancerRewardsAddress,
              rewardsABI: config.balancerRewardsABI,
              rewardsSymbol: 'XFI',
              decimals: 18,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
            }
          ]
        },
        {
          id: 'uniswap',
          name: 'Uniswap Pool',
          website: 'app.uniswap.org',
          link: 'https://app.uniswap.org/#/add/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/0xCa22d16A50F69cE61093D1f18B21b8b4423b0D6D',
          YieldCalculatorLink: "https://yieldfarming.yyfi.finance/yyfi/yyfi_dai/", //收益率器地址
          depositsEnabled: true,
          tokens: [
            {
              id: 'uni',
              address: '0x9c0988e23095ae9d9ef293765235d39570eae743',
              symbol: 'UNI',
              abi: config.erc20ABI,
              decimals: 18,
              rewardsAddress: config.uniswapRewardsAddres,
              rewardsABI: config.uniswapRewardsABI,
              rewardsSymbol: 'XFI',
              decimals: 18,
              balance: 0,
              stakedBalance: 0,
              rewardsAvailable: 0,
            }
          ]
        },*/
        // {
        //   id: 'Governance',
        //   name: 'Governance',
        //   website: 'pools.balancer.exchange',
        //   link: 'https://pools.balancer.exchange/#/pool/0x95c4b6c7cff608c0ca048df8b81a484aa377172b',
        //   depositsEnabled: true,
        //   tokens: [
        //     {
        //       id: 'bpt',
        //       address: '0x95c4b6c7cff608c0ca048df8b81a484aa377172b',
        //       symbol: 'BPT',
        //       abi: config.bpoolABI,
        //       decimals: 18,
        //       rewardsAddress: config.governanceAddress,
        //       rewardsABI: config.governanceABI,
        //       rewardsSymbol: 'YYFI',
        //       decimals: 18,
        //       balance: 0,
        //       stakedBalance: 0,
        //       rewardsAvailable: 0
        //     }
        //   ]
        // },
        // {
        //   id: 'Fee Rewards',
        //   name: 'Fee Rewards',
        //   website: 'ygov.finance',
        //   link: 'https://ygov.finance/',
        //   depositsEnabled: true,
        //   tokens: [
        //     {
        //       id: 'YYFI',
        //       address: config.yfiAddress,
        //       symbol: 'YYFI',
        //       abi: config.yfiABI,
        //       decimals: 18,
        //       rewardsAddress: config.feeRewardsAddress,
        //       rewardsABI: config.feeRewardsABI,
        //       rewardsSymbol: '$',
        //       decimals: 18,
        //       balance: 0,
        //       stakedBalance: 0,
        //       rewardsAvailable: 0
        //     }
        //   ]
        // }
      ]
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload);
            break;
          case GET_BALANCES:
            this.getBalances(payload);
            break;
          case GET_BALANCES_PERPETUAL:
            this.getBalancesPerpetual(payload);
            break;
          case STAKE:
            this.stake(payload);
            break;
          case WITHDRAW:
            this.withdraw(payload);
            break;
          case GET_REWARDS:
            this.getReward(payload);
            break;
          case EXIT:
            this.exit(payload);
            break;
          case PROPOSE:
            this.propose(payload)
            break;
          case GET_PROPOSALS:
            this.getProposals(payload)
            break;
          case VOTE_FOR:
            this.voteFor(payload)
            break;
          case VOTE_AGAINST:
            this.voteAgainst(payload)
            break;
          case GET_CLAIMABLE_ASSET:
            this.getClaimableAsset(payload)
            break;
          case CLAIM:
            this.claim(payload)
            break;
          case GET_CLAIMABLE:
            this.getClaimable(payload)
            break;
          case GET_YCRV_REQUIREMENTS:
            this.getYCRVRequirements(payload)
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    // console.log(this.store)
    return emitter.emit('StoreUpdated');
  };

  configure = async () => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    const currentBlock = await web3.eth.getBlockNumber()

    store.setStore({ currentBlock: currentBlock })

    window.setTimeout(() => {
      emitter.emit(CONFIGURE_RETURNED)
    }, 100)
  }

  getBalancesPerpetual = async () => {
    const pools = store.getStore('rewardPools')
    const account = store.getStore('account')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    const currentBlock = await web3.eth.getBlockNumber()
    store.setStore({ currentBlock: currentBlock })

    async.map(pools, (pool, callback) => {

      async.map(pool.tokens, (token, callbackInner) => {

        async.parallel([
          (callbackInnerInner) => { this._getERC20Balance(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getstakedBalance(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getRewardsAvailable(web3, token, account, callbackInnerInner) }
        ], (err, data) => {
          if(err) {
            console.log(err)
            return callbackInner(err)
          }

          token.balance = data[0]
          token.stakedBalance = data[1]
          token.rewardsAvailable = data[2]

          callbackInner(null, token)
        })
      }, (err, tokensData) => {
        if(err) {
          console.log(err)
          return callback(err)
        }

        pool.tokens = tokensData
        callback(null, pool)
      })

    }, (err, poolData) => {
      if(err) {
        console.log(err)
        return emitter.emit(ERROR, err)
      }
      store.setStore({rewardPools: poolData})
      emitter.emit(GET_BALANCES_PERPETUAL_RETURNED)
      emitter.emit(GET_BALANCES_RETURNED)
    })
  }

  getBalances = () => {
    const pools = store.getStore('rewardPools')
    const account = store.getStore('account')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.map(pools, (pool, callback) => {

      async.map(pool.tokens, (token, callbackInner) => {
        console.log(pool.tokens);
        console.log(token);

        async.parallel([
          (callbackInnerInner) => { this._getERC20Balance(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getstakedBalance(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getRewardsAvailable(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getLockedWithdraw(web3, token, account, callbackInnerInner) },
          (callbackInnerInner) => { this._getTotalStakedBalance(web3, token, account, callbackInnerInner) }
        ], (err, data) => {
          if(err) {
            console.log(err)
            return callbackInner(err)
          }
          token.balance = data[0]
          token.stakedBalance = data[1]
          token.rewardsAvailable = data[2]
          token.lockedWithdraw = !data[3]
          token.totalStaked = data[4].balance
          token.usdValue = data[4].usdvalue
          console.log(data[3])
          callbackInner(null, token)
        })
      }, (err, tokensData) => {
        if(err) {
          console.log(err)
          return callback(err)
        }

        pool.tokens = tokensData
        callback(null, pool)
      })

    }, (err, poolData) => {
      if(err) {
        console.log(err)
        return emitter.emit(ERROR, err)
      }
      store.setStore({rewardPools: poolData})
      emitter.emit(GET_BALANCES_RETURNED)
    })
  }

  _checkApproval = async (asset, account, amount, contract, callback) => {
    try {
      const web3 = new Web3(store.getStore('web3context').library.provider);
      const erc20Contract = new web3.eth.Contract(asset.abi, asset.address)
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })
      const ethAllowance = web3.utils.fromWei(allowance, "ether")
      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        await erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        callback()
      }
    } catch(error) {
      console.log(error)
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  _checkApprovalWaitForConfirmation = async (asset, account, amount, contract, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

    const ethAllowance = web3.utils.fromWei(allowance, "ether")

    if(parseFloat(ethAllowance) < parseFloat(amount)) {
      erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        .on('transactionHash', function(hash){
          callback()
        })
        .on('error', function(error) {
          if (!error.toString().includes("-32601")) {
            if(error.message) {
              return callback(error.message)
            }
            callback(error)
          }
        })
    } else {
      callback()
    }
  }

  _getERC20Balance = async (web3, asset, account, callback) => {
    console.log(web3,asset,account);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    console.log(erc20Contract);

    try {
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      console.log(balance);
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  _getLockedWithdraw = async (web3, asset, account, callback) => {
    console.log(web3,asset,account);
    let rewardsContract = new web3.eth.Contract(config.yCurveFiRewardsABI, asset.rewardsAddress)

    try {
      var locked = await rewardsContract.methods.checkWithdrawal(account.address).call({ from: account.address });
      console.log(locked);
      callback(null, locked)
    } catch(ex) {
      return callback(ex)
    }
  }
//
  _getRewardsBalance = async (web3, asset, account, callback) => {
    console.log(web3,asset,account);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset)
    

    try {
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**18
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  _getstakedBalance = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    try {
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

   lookUpPrices = async (id_array) => {
    let ids = id_array.join("%2C");
    return $.ajax({
        url: "https://api.coingecko.com/api/v3/simple/price?ids=" + ids + "&vs_currencies=usd",
        type: 'GET'
    });
};

  _getTotalStakedBalance = async (web3, asset, account, callback) => {
    if(asset.id == "WETH/YFARMER Uniswap"){
      var erc20Contract = new web3.eth.Contract(config.erc20ABI, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
    } else if(asset.id =="USDT/YFARMER Uniswap"){
      var erc20Contract = new web3.eth.Contract(config.erc20ABI, "0xdac17f958d2ee523a2206206994597c13d831ec7")
    } else if(asset.id =="WETH/pYFARMER Uniswap"){
      var erc20Contract = new web3.eth.Contract(config.erc20ABI, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
    } else {
      var erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    }
    

    try {
      if(asset.id == "WETH/YFARMER Uniswap"){
        var balance = await erc20Contract.methods.balanceOf(asset.address).call({ from: account.address });
      } else if(asset.id =="USDT/YFARMER Uniswap"){
        var balance = await erc20Contract.methods.balanceOf(asset.address).call({ from: account.address });
      } else if(asset.id =="WETH/pYFARMER Uniswap"){
        var balance = await erc20Contract.methods.balanceOf(asset.address).call({ from: account.address });
      } else {
        var balance = await erc20Contract.methods.balanceOf(asset.rewardsAddress).call({ from: account.address });
      }
     // var balance = await erc20Contract.methods.balanceOf(asset.rewardsAddress).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      let dollarvalue = await this.lookUpPrices([asset.coinGeckoName]);
      console.log(dollarvalue);
      let obv = {
        balance: parseFloat(balance),
        usdvalue:dollarvalue[asset.coinGeckoName].usd * balance
      }
      console.log(balance);
      callback(null, obv)
    } catch(ex) {
      return callback(ex)
    }
  }

  _getRewardsAvailable = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    try {
      var earned = await erc20Contract.methods.earned(account.address).call({ from: account.address });
      earned = parseFloat(earned)/10**asset.Rewardsdecimals
      callback(null, parseFloat(earned))
    } catch(ex) {
      return callback(ex)
    }
  }

  _checkIfApprovalIsNeeded = async (asset, account, amount, contract, callback, overwriteAddress) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, (overwriteAddress ? overwriteAddress : asset.address))
    const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

    const ethAllowance = web3.utils.fromWei(allowance, "ether")
    if(parseFloat(ethAllowance) < parseFloat(amount)) {
      asset.amount = amount
      callback(null, asset)
    } else {
      callback(null, false)
    }
  }

  _callApproval = async (asset, account, amount, contract, last, callback, overwriteAddress) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, (overwriteAddress ? overwriteAddress : asset.address))
    try {
      if(last) {
        await erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        erc20Contract.methods.approve(contract, web3.utils.toWei("999999999999999999", "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            callback()
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
          })
      }
    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  stake = (payload) => {
    const account = store.getStore('account')
    const { asset, amount } = payload.content
   
    console.log(asset);
    console.log(account);
    console.log(amount);

    this._checkApproval(asset, account, amount, asset.rewardsAddress, (err) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      this._callStake(asset, account, amount, (err, res) => {
        if(err) {
          return emitter.emit(ERROR, err);
        }

        return emitter.emit(STAKE_RETURNED, res)
      })
    })
  }

  _callStake = async (asset, account, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const yCurveFiContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    yCurveFiContract.methods.stake(amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  withdraw = (payload) => {
    const account = store.getStore('account')
    const { asset, amount } = payload.content

    this._callWithdraw(asset, account, amount, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(WITHDRAW_RETURNED, res)
    })
  }

  _callWithdraw = async (asset, account, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const yCurveFiContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    yCurveFiContract.methods.withdraw(amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getReward = (payload) => {
    const account = store.getStore('account')
    const { asset } = payload.content

    this._callGetReward(asset, account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(GET_REWARDS_RETURNED, res)
    })
  }

  _callGetReward = async (asset, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const yCurveFiContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    yCurveFiContract.methods.getReward().send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  exit = (payload) => {
    const account = store.getStore('account')
    const { asset } = payload.content

    this._callExit(asset, account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(EXIT_RETURNED, res)
    })
  }

  _callExit = async (asset, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const yCurveFiContract = new web3.eth.Contract(asset.rewardsABI, asset.rewardsAddress)

    yCurveFiContract.methods.exit().send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  propose = (payload) => {
    const account = store.getStore('account')

    this._callPropose(account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(PROPOSE_RETURNED, res)
    })
  }

  _callPropose = async (account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)

    governanceContract.methods.propose().send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_BALANCES, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getProposals = (payload) => {
    // emitter.emit(GET_PROPOSALS_RETURNED)
    const account = store.getStore('account')
    const web3 = new Web3(store.getStore('web3context').library.provider);

    this._getProposalCount(web3, account, (err, proposalCount) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      let arr = Array.from(Array(parseInt(proposalCount)).keys())

      if(proposalCount == 0) {
        arr = []
      }

      async.map(arr, (proposal, callback) => {
        this._getProposals(web3, account, proposal, callback)
      }, (err, proposalsData) => {
        if(err) {
          return emitter.emit(ERROR, err);
        }

        store.setStore({ proposals: proposalsData })
        emitter.emit(GET_PROPOSALS_RETURNED)
      })

    })
  }

  _getProposalCount = async (web3, account, callback) => {
    try {
      const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)
      var proposals = await governanceContract.methods.proposalCount().call({ from: account.address });
      callback(null, proposals)
    } catch(ex) {
      return callback(ex)
    }
  }

  _getProposals = async (web3, account, number, callback) => {
    try {
      const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)
      var proposals = await governanceContract.methods.proposals(number).call({ from: account.address });
      callback(null, proposals)
    } catch(ex) {
      return callback(ex)
    }
  }

  voteFor = (payload) => {
    const account = store.getStore('account')
    const { proposal } = payload.content

    this._callVoteFor(proposal, account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(VOTE_FOR_RETURNED, res)
    })
  }

  _callVoteFor = async (proposal, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)

    governanceContract.methods.voteFor(proposal.id).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_PROPOSALS, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  voteAgainst = (payload) => {
    const account = store.getStore('account')
    const { proposal } = payload.content

    this._callVoteAgainst(proposal, account, (err, res) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      return emitter.emit(VOTE_AGAINST_RETURNED, res)
    })
  }

  _callVoteAgainst = async (proposal, account, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)

    governanceContract.methods.voteAgainst(proposal.id).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_PROPOSALS, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getClaimableAsset = (payload) => {
    const account = store.getStore('account')
    const asset = store.getStore('claimableAsset')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.parallel([
      (callbackInnerInner) => { this._getClaimableBalance(web3, asset, account, callbackInnerInner) },
      (callbackInnerInner) => { this._getClaimable(web3, asset, account, callbackInnerInner) },
    ], (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      asset.balance = data[0]
      asset.claimableBalance = data[1]

      store.setStore({claimableAsset: asset})
      emitter.emit(GET_CLAIMABLE_ASSET_RETURNED)
    })
  }

  _getClaimableBalance = async (web3, asset, account, callback) => {
    let erc20Contract = new web3.eth.Contract(asset.abi, asset.address)

    try {
      var balance = await erc20Contract.methods.balanceOf(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  _getClaimable = async (web3, asset, account, callback) => {
    let claimContract = new web3.eth.Contract(config.claimABI, config.claimAddress)

    try {
      var balance = await claimContract.methods.claimable(account.address).call({ from: account.address });
      balance = parseFloat(balance)/10**asset.decimals
      callback(null, parseFloat(balance))
    } catch(ex) {
      return callback(ex)
    }
  }

  claim = (payload) => {
    const account = store.getStore('account')
    const asset = store.getStore('claimableAsset')
    const { amount } = payload.content

    this._checkApproval(asset, account, amount, config.claimAddress, (err) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      this._callClaim(asset, account, amount, (err, res) => {
        if(err) {
          return emitter.emit(ERROR, err);
        }

        return emitter.emit(CLAIM_RETURNED, res)
      })
    })
  }

  _callClaim = async (asset, account, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    const claimContract = new web3.eth.Contract(config.claimABI, config.claimAddress)

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (asset.decimals != 18) {
      amountToSend = (amount*10**asset.decimals).toFixed(0);
    }

    claimContract.methods.claim(amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
        if(confirmationNumber == 2) {
          dispatcher.dispatch({ type: GET_CLAIMABLE_ASSET, content: {} })
        }
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  getClaimable = (payload) => {
    const account = store.getStore('account')
    const asset = store.getStore('claimableAsset')

    const web3 = new Web3(store.getStore('web3context').library.provider);

    async.parallel([
      (callbackInnerInner) => { this._getClaimableBalance(web3, asset, account, callbackInnerInner) },
      (callbackInnerInner) => { this._getClaimable(web3, asset, account, callbackInnerInner) },
    ], (err, data) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      asset.balance = data[0]
      asset.claimableBalance = data[1]

      store.setStore({claimableAsset: asset})
      emitter.emit(GET_CLAIMABLE_RETURNED)
    })
  }

  getYCRVRequirements = async (payload) => {
    try {
      const account = store.getStore('account')
      const web3 = new Web3(store.getStore('web3context').library.provider);

      const governanceContract = new web3.eth.Contract(config.governanceABI, config.governanceAddress)
      let balance = await governanceContract.methods.balanceOf(account.address).call({ from: account.address })
      balance = parseFloat(balance)/10**18

      const voteLock = await governanceContract.methods.voteLock(account.address).call({ from: account.address })
      const currentBlock = await web3.eth.getBlockNumber()

      const returnOBJ = {
        balanceValid: (balance > 1000),
        voteLockValid: voteLock > currentBlock,
        voteLock: voteLock
      }

      emitter.emit(GET_YCRV_REQUIREMENTS_RETURNED, returnOBJ)

    } catch(ex) {
      return emitter.emit(ERROR, ex);
    }
  }

  _getGasPrice = async () => {
    try {
      const url = 'https://gasprice.poa.network/'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)
      if(priceJSON) {
        return priceJSON.fast.toFixed(0)
      }
      return store.getStore('universalGasPrice')
    } catch(e) {
      console.log(e)
      return store.getStore('universalGasPrice')
    }
  }
}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};
