const Web3 = require('web3')

module.exports = strapi => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        if ((ctx.method === 'POST' || ctx.method === 'PUT') &&
          (ctx.url.startsWith("/accounts") || ctx.url.startsWith("/properties") || ctx.url === '/upload')
        ) {
          const { signMessage: message, signature, address } = ctx.request.body
          ctx.log.debug('params: ', message, signature, address)
          if (!message || !signature || !address) {
            ctx.response.unauthorized('invalid request')
            return
          }

          const web3 = new Web3()
          const recoverAccount = web3.eth.accounts.recover(message, signature)
          ctx.log.debug('recover: ', recoverAccount, address)

          if (recoverAccount !== address) {
            ctx.response.unauthorized('invalid request')
          }
        }

        await next();
      });
    },
  };
};