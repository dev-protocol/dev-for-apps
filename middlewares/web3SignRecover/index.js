const Web3 = require('web3')

const getXDevAuthToken = (ctx) => {
	const { 'x-dev-auth': xDevAuth } = ctx.request.headers
	const [address, signature, ...message] = xDevAuth.split(';')
	return { signMessage: message.join(';'), signature, address }
}

module.exports = (strapi) => ({
	initialize() {
		strapi.app.use(async (ctx, next) => {
			// NOTE: If the Authorization Header is present,
			//       Web3.sign/recover authentication will not be performed.
			//       Because it is a change from the management console.
			const { authorization } = ctx.request.headers
			if (!authorization) {
				if (
					(ctx.method === 'POST' ||
						ctx.method === 'PUT' ||
						ctx.method === 'DELETE') &&
					(ctx.url.startsWith('/accounts') ||
						ctx.url.startsWith('/properties') ||
						ctx.url.startsWith('/property-settings') ||
						ctx.url.startsWith('/upload'))
				) {
					const {
						signMessage: message,
						signature,
						address,
					} = ctx.method === 'DELETE' ? getXDevAuthToken(ctx) : ctx.request.body
					ctx.log.debug('params: ', message, signature, address)
					if (!message || !signature || !address) {
						ctx.response.unauthorized('invalid request')
						return
					}

					const web3 = new Web3()
					const recoverAccount = web3.eth.accounts.recover(message, signature)
					ctx.log.debug('recover: ', recoverAccount, address)

					// NOTE: special case
					//   * properties's key is `property` address, auth key is account_address
					const compareAddress =
						ctx.method !== 'DELETE' && ctx.url.startsWith('/properties')
							? ctx.request.body.account_address
							: address

					if (recoverAccount !== compareAddress) {
						ctx.response.unauthorized('invalid request')
					}
				}
			}

			await next()
		})
	},
})
