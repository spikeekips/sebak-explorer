import sebakApi from './api';
import sebakTransformer from './transformer';

const sebakService = {
  getAccount,
  getTransactions,
  getTransaction,
  getOperations,
  getOperationsForAccount,
  getOperationsForTransaction,
  getNetInformation,
  getBlocks,
  getBlock,
  getFrozenAccounts,
  getFrozenAccountsForAccount
}

export default sebakService;

function getTransactions(params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const transactions = (await sebakApi.getTransactions(params));
        resolve(getTransactionsObject(transactions));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getTransaction(transactionHash, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const response = await sebakApi.getTransaction(transactionHash, params);
        resolve(sebakTransformer.transformTransaction(response.data));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getAccount(publicKey, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const response = await sebakApi.getAccount(publicKey, params);
        resolve(sebakTransformer.transformAccount(response.data));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getOperationsForAccount(publicKey, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const operations = getRecords(await sebakApi.getOperationsForAccount(publicKey, params));
        const data = [];

        for (const operation of operations) {
          data.push(sebakTransformer.transformOperation(operation));
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    }
  );
}

export function getOperationsForTransaction(transaction, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const operations = getRecords(await sebakApi.getOperationsForTransaction(transaction.hash, params));
        const data = [];

        for (const operation of operations) {
          data.push(sebakTransformer.transformOperation(operation));
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    }
  );
}

export function getOperations(params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const transactions = (await getTransactions(params)).data;
        const data = [];

        transactionsLoop:
          for (const transaction of transactions) {
            const operations = getRecords(await sebakApi.getOperationsForTransaction(transaction.hash));

            for (const operation of operations) {
              data.push(sebakTransformer.transformOperation(operation));

              if (data.length === params.limit) {
                break transactionsLoop;
              }
            }
          }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    }
  );
}

export function getNetInformation() {
  return new Promise(
    async function (resolve, reject) {
      try {
        const netInformation = await sebakApi.getNetInformation();
        resolve(getNetInformationObject(netInformation));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getBlocks(params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const blocks = await sebakApi.getBlocks(params);
        resolve(getBlocksObject(blocks));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getBlock(blockHash, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const response = await sebakApi.getBlock(blockHash, params);
        resolve(sebakTransformer.transformBlock(response.data));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getFrozenAccounts(params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const frozenAccounts = await sebakApi.getFrozenAccounts(params);
        resolve(getFrozenAccountsObject(frozenAccounts));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function getFrozenAccountsForAccount(publicKey, params = {}) {
  return new Promise(
    async function (resolve, reject) {
      try {
        const frozenAccounts = await sebakApi.getFrozenAccountsForAccount(publicKey, params);
        resolve(getFrozenAccountsObject(frozenAccounts));
      } catch (error) {
        reject(error);
      }
    }
  );
}

function calculateInflation(currentBlockHeight, startBlockHeight, duration, inflation) {
  if (currentBlockHeight > startBlockHeight + duration) {
    return inflation * duration;
  } else if (currentBlockHeight > startBlockHeight) {
    return inflation * (currentBlockHeight - startBlockHeight);
  } else return 0;
}

function calculateCommonsBudgetInflation(currentBlockHeight) {
  return calculateInflation(currentBlockHeight, 1, 36000000, 50);
}

function calculatePF00Inflation(currentBlockHeight) {
  // todo set start block height once known
  return calculateInflation(currentBlockHeight, undefined, 6307200, 25.5);
}

function getSupply(currentBlockHeight) {
  let initialSupply = 500000000;

  initialSupply += calculateCommonsBudgetInflation(currentBlockHeight);
  initialSupply += calculatePF00Inflation(currentBlockHeight);

  return initialSupply;
}

function getRecords(response) {
  return response.data._embedded.records;
}

function getTransactionsObject(response) {
  const data = [];

  for (const transaction of response.data._embedded.records) {
    data.push(sebakTransformer.transformTransaction(transaction));
  }

  return {
    data,
    next: async function () {
      return getTransactionsObject(await sebakApi.getLink(`${response.data._links.next.href}`));
    },
    previous: async function () {
      return getTransactionsObject(await sebakApi.getLink(`${response.data._links.prev.href}`));
    }
  }
}

function getBlocksObject(response) {
  const data = [];

  for (const block of response.data._embedded.records) {
    data.push(sebakTransformer.transformBlock(block));
  }

  return {
    data,
    next: async function () {
      return getBlocksObject(await sebakApi.getLink(`${response.data._links.next.href}`));
    },
    previous: async function () {
      return getBlocksObject(await sebakApi.getLink(`${response.data._links.prev.href}`));
    }
  }
}

function getFrozenAccountsObject(response) {
  if (!response.data._embedded.records) {
    return {
      data: []
    }
  }

  const data = [];

  for (const frozenAccount of response.data._embedded.records) {
    data.push(sebakTransformer.transformFrozenAccount(frozenAccount));
  }

  return {
    data,
    next: async function () {
      return getFrozenAccountsObject(await sebakApi.getLink(`${response.data._links.next.href}`));
    },
    previous: async function () {
      return getFrozenAccountsObject(await sebakApi.getLink(`${response.data._links.prev.href}`));
    }
  }
}

function getNetInformationObject(response) {
  const netInformation = sebakTransformer.transformNetInformation(response.data);
  return {
    data: {
      ...netInformation,
      supply: getSupply(netInformation.currentBlockHeight)
    }
  }
}
